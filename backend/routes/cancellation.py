"""
Cancellation validation flow (Build 152.6 — refactored 152.13)

Extracted from /app/backend/routes/planning.py for maintainability.
Handles the flow when a musician cancels an accepted application:
  - Musician requests cancellation → venue must approve/refuse
  - Venue lists pending cancellation requests
  - Venue approves (reopens slot) or refuses (returns to accepted)
"""
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

# Reuse shared helpers from planning module to avoid duplication
from routes import planning as _planning
from routes.planning import get_current_user, create_notification
from routes.push import send_push


class _DBProxy:
    """Late-binding proxy so `db.<collection>` resolves to routes.planning.db
    at call-time (planning.set_db() is called by server.py at startup, after
    this module has already been imported)."""
    def __getattr__(self, name):
        real = _planning.db
        if real is None:
            raise RuntimeError("planning.db not initialised yet")
        return getattr(real, name)

db = _DBProxy()

logger = logging.getLogger(__name__)

router = APIRouter(tags=["cancellation"])


# ==================================================================
# Pydantic bodies
# ==================================================================
class CancelBody(BaseModel):
    reason: Optional[str] = Field(default=None, max_length=500)


class CancellationValidatePayload(BaseModel):
    approve: bool
    message: Optional[str] = Field(default=None, max_length=500)


# ==================================================================
# Endpoints
# ==================================================================
@router.post("/applications/{app_id}/cancel")
async def cancel_application_v2(
    app_id: str,
    body: Optional[CancelBody] = None,
    current_user: dict = Depends(get_current_user),
):
    """
    Annuler une candidature (musicien).
    - status='pending' → suppression immédiate (comportement historique)
    - status='accepted' → passage en cancellation_status='requested' (attente validation du bar)
    - status='cancellation_requested' (déjà en cours) → 400
    - status='cancelled' ou autre → 400
    """
    if current_user["role"] != "musician":
        raise HTTPException(status_code=403, detail="Only musicians can cancel their applications")

    musician = await db.musicians.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not musician:
        raise HTTPException(status_code=404, detail="Musician profile not found")

    app = await db.applications.find_one({"id": app_id}, {"_id": 0})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if app.get("musician_id") != musician["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this application")

    status = app.get("status")
    now_iso = datetime.now(timezone.utc).isoformat()

    # Cas 1 : pending → suppression directe
    if status == "pending":
        await db.applications.delete_one({"id": app_id})
        slot = await db.planning_slots.find_one({"id": app["planning_slot_id"]}, {"_id": 0})
        if slot:
            venue = await db.venues.find_one({"id": slot["venue_id"]}, {"_id": 0})
            if venue and venue.get("user_id"):
                await create_notification(
                    venue["user_id"],
                    "application_cancelled",
                    "Candidature annulée",
                    f"{app.get('musician_name', 'Un musicien')} a annulé sa candidature pour le créneau du {slot.get('date', 'TBD')}",
                    None,
                )
        return {"success": True, "action": "deleted"}

    # Cas 2 : accepted → demande d'annulation en attente
    if status == "accepted":
        if app.get("cancellation_status") == "requested":
            raise HTTPException(status_code=400, detail="Une demande d'annulation est déjà en attente")

        reason = (body.reason if body else None) or ""

        await db.applications.update_one(
            {"id": app_id},
            {"$set": {
                "cancellation_status": "requested",
                "cancellation_requested_at": now_iso,
                "cancellation_reason": reason or None,
            }},
        )

        slot = await db.planning_slots.find_one({"id": app["planning_slot_id"]}, {"_id": 0})
        if slot:
            venue = await db.venues.find_one({"id": slot["venue_id"]}, {"_id": 0})
            if venue and venue.get("user_id"):
                musician_display = app.get("musician_name") or musician.get("pseudo") or "Un musicien"
                await create_notification(
                    venue["user_id"],
                    "cancellation_requested",
                    "🟠 Demande d'annulation",
                    f"{musician_display} demande à annuler sa candidature pour le {slot.get('date', 'TBD')}",
                    None,
                )
                # Emergent push (safe-failed)
                try:
                    await send_push(
                        recipients=[venue["user_id"]],
                        data={
                            "title": "🟠 Demande d'annulation",
                            "message": f"{musician_display} demande à annuler sa candidature du {slot.get('date', 'TBD')}",
                            "action_url": "/(tabs)/index",
                            # Build 152.18 — deeplink explicite pour SuprSend
                            "deeplink": f"jamconnexion:///applications/{app_id}",
                            "type": "cancellation_requested",
                            "application_id": app_id,
                        },
                        idempotency_key=f"cancel-req-{app_id}",
                    )
                except Exception as e:
                    logger.warning(f"Push failed (cancellation_requested): {e}")

        return {"success": True, "action": "cancellation_requested"}

    # Cas 3 : cancelled ou autre statut non annulable
    if status == "cancelled":
        raise HTTPException(status_code=400, detail="Candidature déjà annulée")

    raise HTTPException(status_code=400, detail=f"Impossible d'annuler une candidature au statut '{status}'")


@router.post("/applications/{app_id}/cancellation/validate")
async def validate_cancellation(
    app_id: str,
    payload: CancellationValidatePayload,
    current_user: dict = Depends(get_current_user),
):
    """
    Le bar valide (approve=True) ou refuse (approve=False) une demande d'annulation.
    """
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can validate cancellations")

    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=403, detail="Venue profile not found")

    app = await db.applications.find_one({"id": app_id}, {"_id": 0})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    slot = await db.planning_slots.find_one(
        {"id": app["planning_slot_id"], "venue_id": venue["id"]}, {"_id": 0}
    )
    if not slot:
        raise HTTPException(status_code=403, detail="Not authorized on this application")

    if app.get("cancellation_status") != "requested":
        raise HTTPException(
            status_code=400,
            detail="Aucune demande d'annulation à valider pour cette candidature",
        )

    now_iso = datetime.now(timezone.utc).isoformat()
    message = (payload.message or "").strip()[:500] if payload.message else ""

    musician = await db.musicians.find_one({"id": app["musician_id"]}, {"_id": 0})
    musician_user_id = musician.get("user_id") if musician else None

    if payload.approve:
        await db.applications.update_one(
            {"id": app_id},
            {"$set": {
                "status": "cancelled",
                "cancellation_status": "approved",
                "cancellation_resolved_at": now_iso,
                "cancellation_message": message or None,
            }},
        )

        # Reopen slot if needed
        # Build 152.16 — Fix : un slot avec num_bands_needed=0 (karaoké, jam ouverte…) ne
        # se rouvrait jamais après validation d'une annulation. On normalise en `max(..., 1)`
        # pour garantir qu'un slot fermé après acceptation se rouvre systématiquement dès
        # que l'application acceptée est effectivement annulée.
        accepted_count = await db.applications.count_documents({
            "planning_slot_id": slot["id"],
            "status": "accepted",
        })
        num_bands_needed = max(int(slot.get("num_bands_needed") or 1), 1)
        if accepted_count < num_bands_needed:
            await db.planning_slots.update_one(
                {"id": slot["id"]},
                {"$set": {"is_open": True}},
            )

        if musician_user_id:
            venue_name = venue.get("name", "L'établissement")
            body_text = f"{venue_name} a validé votre demande d'annulation"
            if message:
                body_text += f" — « {message[:60]}{'…' if len(message) > 60 else ''} »"
            await create_notification(
                musician_user_id,
                "cancellation_approved",
                "✅ Annulation validée",
                body_text,
                None,
            )
            try:
                await send_push(
                    recipients=[musician_user_id],
                    data={
                        "title": "✅ Annulation validée",
                        "message": body_text,
                        "action_url": "/(tabs)/applications",
                        # Build 152.18 — deeplink explicite pour SuprSend
                        "deeplink": f"jamconnexion:///applications/{app_id}",
                        "type": "cancellation_approved",
                        "application_id": app_id,
                    },
                    idempotency_key=f"cancel-val-approve-{app_id}",
                )
            except Exception as e:
                logger.warning(f"Push failed (cancellation_approved): {e}")

        return {"success": True, "action": "approved"}

    # Refuse
    await db.applications.update_one(
        {"id": app_id},
        {"$set": {
            "cancellation_status": "refused",
            "cancellation_resolved_at": now_iso,
            "cancellation_message": message or None,
        }},
    )

    if musician_user_id:
        venue_name = venue.get("name", "L'établissement")
        body_text = f"{venue_name} a refusé votre demande d'annulation"
        if message:
            body_text += f" — « {message[:60]}{'…' if len(message) > 60 else ''} »"
        await create_notification(
            musician_user_id,
            "cancellation_refused",
            "❌ Annulation refusée",
            body_text,
            None,
        )
        try:
            await send_push(
                recipients=[musician_user_id],
                data={
                    "title": "❌ Annulation refusée",
                    "message": body_text,
                    "action_url": "/(tabs)/applications",
                    # Build 152.18 — deeplink explicite pour SuprSend
                    "deeplink": f"jamconnexion:///applications/{app_id}",
                    "type": "cancellation_refused",
                    "application_id": app_id,
                },
                idempotency_key=f"cancel-val-refuse-{app_id}",
            )
        except Exception as e:
            logger.warning(f"Push failed (cancellation_refused): {e}")

    return {"success": True, "action": "refused"}


@router.get("/applications/received/cancellation-requests")
async def list_pending_cancellations(current_user: dict = Depends(get_current_user)):
    """
    Liste les candidatures dont l'annulation est en attente de validation par le bar.
    """
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can access this")

    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")

    slot_ids = [
        s["id"]
        for s in await db.planning_slots.find(
            {"venue_id": venue["id"]}, {"_id": 0, "id": 1}
        ).to_list(2000)
    ]
    if not slot_ids:
        return {"applications": [], "count": 0}

    apps = await db.applications.find(
        {
            "planning_slot_id": {"$in": slot_ids},
            "cancellation_status": "requested",
        },
        {"_id": 0},
    ).sort("cancellation_requested_at", -1).to_list(500)

    enriched = []
    for a in apps:
        slot = await db.planning_slots.find_one(
            {"id": a["planning_slot_id"]}, {"_id": 0}
        )
        musician = await db.musicians.find_one(
            {"id": a["musician_id"]},
            {"_id": 0, "pseudo": 1, "profile_image": 1, "city": 1, "user_id": 1},
        )
        enriched.append({
            **a,
            "slot_date": slot.get("date") if slot else None,
            "slot_time": slot.get("time") if slot else None,
            "slot_title": slot.get("title") if slot else None,
            "musician_pseudo": (musician or {}).get("pseudo"),
            "musician_profile_image": (musician or {}).get("profile_image"),
            "musician_city": (musician or {}).get("city"),
        })

    return {"applications": enriched, "count": len(enriched)}
