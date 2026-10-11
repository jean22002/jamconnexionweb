"""Build 217 — Routes pour les plateaux musicaux.

Flow MVP :
- POST   /plateaus                           — créer (invite les membres)
- GET    /plateaus/my                        — mes plateaux (admin ou membre)
- GET    /plateaus/open                      — plateaux avec places vacantes (filtres)
- GET    /plateaus/{id}                      — détails
- PATCH  /plateaus/{id}                      — admin modifie
- DELETE /plateaus/{id}                      — admin supprime (notif aux membres)
- POST   /plateaus/{id}/invite               — admin invite plus de membres
- POST   /plateaus/{id}/respond              — membre invité accepte/refuse
- POST   /plateaus/{id}/request-join         — un extérieur propose son projet
- POST   /plateaus/{id}/respond-join-request — admin accepte/refuse une demande

Notifications persistées dans db.notifications (collection existante).
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime, timezone
import uuid
import logging

from utils import get_current_user
from utils.db import db
from models.plateau import (
    PlateauCreateInput, PlateauUpdateInput, PlateauInviteInput,
    PlateauRespondInput, PlateauJoinRequestInput,
    PlateauMemberInput, now_iso,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/plateaus", tags=["plateaus"])


# ─── Helpers ────────────────────────────────────────────────────────────
async def _resolve_project(member_input: PlateauMemberInput) -> dict:
    """Construit un PlateauMember-like dict depuis un musician_id (+ band_id optionnel).

    Retourne un dict avec project_name, music_styles, photo, user_id.
    """
    musician = await db.musicians.find_one(
        {"id": member_input.musician_id}, {"_id": 0}
    )
    if not musician:
        raise HTTPException(
            status_code=404,
            detail=f"Musicien {member_input.musician_id} introuvable",
        )

    user_id = musician.get("user_id")
    kind = member_input.project_kind
    band_id = member_input.band_id

    if kind == "band" and band_id:
        bands = musician.get("bands") or []
        band = next((b for b in bands if b.get("id") == band_id or b.get("band_id") == band_id), None)
        if not band:
            raise HTTPException(
                status_code=404,
                detail=f"Groupe {band_id} introuvable sur le musicien",
            )
        project_name = band.get("name") or musician.get("pseudo") or "Groupe"
        music_styles = band.get("music_styles") or []
        photo = band.get("photo") or musician.get("profile_image")
    else:
        # Solo / projet principal du musicien
        project_name = musician.get("pseudo") or musician.get("stage_name") or "Musicien"
        music_styles = musician.get("music_styles") or []
        photo = musician.get("profile_image")

    return {
        "user_id": user_id,
        "musician_id": member_input.musician_id,
        "project_kind": kind,
        "band_id": band_id,
        "project_name": project_name,
        "music_styles": music_styles if isinstance(music_styles, list) else [],
        "photo": photo,
    }


async def _notify(user_id: str, notif_type: str, title: str, message: str, data: dict, link: Optional[str] = None):
    """Insère une notification dans db.notifications (collection existante)."""
    try:
        doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "type": notif_type,
            "title": title,
            "message": message,
            "data": data,
            # Build 218 — link cliquable (frontend route) pour "Clic notif → bon onglet"
            "link": link or data.get("link"),
            "read": False,
            "created_at": now_iso(),
        }
        await db.notifications.insert_one(doc)
    except Exception as e:
        logger.warning(f"Failed to persist notification: {e}")


def _plateau_link(plateau_id: str) -> str:
    """Deep link vers l'onglet Plateaux du dashboard musicien, plateau pré-ouvert."""
    return f"/musician?tab=plateaus&plateau_id={plateau_id}"


async def _create_group_conversation_if_needed(plateau: dict):
    """Build 218 — Message groupe plateau.

    Crée automatiquement une conversation de groupe (type="plateau_group") quand
    tous les membres actifs ont accepté. Idempotent : ne crée qu'une seule fois.
    """
    members_accepted = [m for m in plateau.get("members", []) if m.get("status") == "accepted"]
    if len(members_accepted) < 2:
        return

    existing = await db.conversations.find_one(
        {"type": "plateau_group", "plateau_id": plateau["id"]}, {"_id": 0}
    )
    if existing:
        # Déjà créée — on pourrait synchroniser les participants ici si besoin
        return

    now = datetime.now(timezone.utc)
    participants = []
    unread_count = {}
    for m in members_accepted:
        participants.append({
            "user_id": m["user_id"],
            "role": "musician",
            "name": m.get("project_name", "Musicien"),
            "avatar": m.get("photo"),
            "last_read_at": None,
        })
        unread_count[m["user_id"]] = 0

    conv_id = f"conv_plateau_{plateau['id'][:12]}"
    await db.conversations.insert_one({
        "id": conv_id,
        "type": "plateau_group",
        "plateau_id": plateau["id"],
        "name": plateau.get("title", "Plateau"),
        "participants": participants,
        "last_message": None,
        "unread_count": unread_count,
        "created_at": now,
        "updated_at": now,
    })

    # Notifier tous les membres de la nouvelle discussion de groupe
    for m in members_accepted:
        await _notify(
            user_id=m["user_id"],
            notif_type="plateau_group_chat_created",
            title="💬 Discussion de groupe du plateau",
            message=f'La discussion du plateau "{plateau["title"]}" est ouverte',
            data={"plateau_id": plateau["id"], "conversation_id": conv_id},
            link=_plateau_link(plateau["id"]),
        )


def _recompute_status(plateau: dict) -> str:
    """Recalcule le statut global :
    - pending   : au moins un membre pending (pas encore répondu)
    - active    : tous les membres ont accepté ET pas de places vacantes
    - incomplete: tous les membres ont accepté MAIS place(s) libre(s) → visible dans /open
    """
    members = plateau.get("members", [])
    non_rejected = [m for m in members if m.get("status") != "rejected"]
    if any(m.get("status") == "pending" for m in non_rejected):
        return "pending"
    accepted = len([m for m in non_rejected if m.get("status") == "accepted"])
    if accepted >= plateau.get("max_members", 4):
        return "active"
    return "incomplete"


async def _get_plateau_or_404(plateau_id: str) -> dict:
    plateau = await db.plateaus.find_one({"id": plateau_id}, {"_id": 0})
    if not plateau:
        raise HTTPException(status_code=404, detail="Plateau introuvable")
    return plateau


def _require_admin(plateau: dict, user_id: str):
    if plateau.get("admin_user_id") != user_id:
        raise HTTPException(status_code=403, detail="Seul l'administrateur du plateau peut effectuer cette action")


# ─── Endpoints ──────────────────────────────────────────────────────────
@router.post("")
async def create_plateau(payload: PlateauCreateInput, current_user: dict = Depends(get_current_user)):
    """Créer un plateau. L'auteur devient admin. Les membres invités reçoivent une notification."""
    if current_user.get("role") != "musician":
        raise HTTPException(status_code=403, detail="Réservé aux musiciens")

    admin_musician = await db.musicians.find_one(
        {"user_id": current_user["id"]}, {"_id": 0}
    )
    if not admin_musician:
        raise HTTPException(status_code=404, detail="Profil musicien introuvable")

    if len(payload.invited_members) < 1:
        raise HTTPException(
            status_code=400,
            detail="Un plateau nécessite au moins 1 membre invité (vous êtes l'admin, et au moins 1 autre projet)",
        )
    if len(payload.invited_members) >= payload.max_members:
        raise HTTPException(
            status_code=400,
            detail="Le nombre d'invités doit être inférieur à max_members (vous comptez comme 1 membre)",
        )

    # L'admin est automatiquement accepté comme premier membre
    admin_member = {
        "user_id": current_user["id"],
        "musician_id": admin_musician["id"],
        "project_kind": "solo",
        "band_id": None,
        "project_name": admin_musician.get("pseudo") or "Admin",
        "music_styles": admin_musician.get("music_styles") or [],
        "photo": admin_musician.get("profile_image"),
        "status": "accepted",
        "invited_at": now_iso(),
        "responded_at": now_iso(),
    }

    # Résout chaque projet invité → doc PlateauMember
    now = now_iso()
    seen_keys = set()
    members = [admin_member]
    for mi in payload.invited_members:
        key = (mi.musician_id, mi.band_id)
        if key in seen_keys:
            raise HTTPException(status_code=400, detail="Doublon dans les projets invités")
        seen_keys.add(key)
        resolved = await _resolve_project(mi)
        members.append({
            **resolved,
            "status": "pending",
            "invited_at": now,
            "responded_at": None,
        })

    plateau_doc = {
        "id": str(uuid.uuid4()),
        "admin_user_id": current_user["id"],
        "admin_musician_id": admin_musician["id"],
        "admin_name": admin_musician.get("pseudo") or "Admin",
        "title": payload.title,
        "description": payload.description or "",
        "max_members": payload.max_members,
        "members": members,
        "status": "pending",
        "country": admin_musician.get("country"),
        "region": admin_musician.get("region"),
        "department": admin_musician.get("department"),
        "city": admin_musician.get("city"),
        "created_at": now,
        "updated_at": now,
    }
    plateau_doc["status"] = _recompute_status(plateau_doc)

    await db.plateaus.insert_one(plateau_doc)

    # Notifier chaque invité
    for m in members:
        if m["status"] == "pending":
            await _notify(
                user_id=m["user_id"],
                notif_type="plateau_invitation",
                title="🎸 Invitation à un plateau",
                message=f'{admin_member["project_name"]} vous invite au plateau "{payload.title}"',
                data={"plateau_id": plateau_doc["id"], "musician_id": m["musician_id"]},
                link=_plateau_link(plateau_doc["id"]),
            )

    plateau_doc.pop("_id", None)
    return plateau_doc


@router.get("/my")
async def my_plateaus(current_user: dict = Depends(get_current_user)):
    """Plateaux où je suis admin OU membre."""
    cursor = db.plateaus.find(
        {"$or": [
            {"admin_user_id": current_user["id"]},
            {"members.user_id": current_user["id"]},
        ]},
        {"_id": 0},
    ).sort("created_at", -1)
    return [p async for p in cursor]


@router.get("/open")
async def open_plateaus(
    country: Optional[str] = None,
    region: Optional[str] = None,
    department: Optional[str] = None,
    music_style: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Plateaux avec places vacantes (status=incomplete) + filtres optionnels."""
    query = {"status": "incomplete"}
    if country:
        query["country"] = country
    if region:
        query["region"] = region
    if department:
        query["department"] = department
    if music_style:
        query["members.music_styles"] = music_style

    cursor = db.plateaus.find(query, {"_id": 0}).sort("created_at", -1)
    results = []
    async for p in cursor:
        # Compte places vacantes pour l'UI
        accepted = len([m for m in p.get("members", []) if m.get("status") == "accepted"])
        p["vacant_slots"] = max(p.get("max_members", 4) - accepted, 0)
        results.append(p)
    return results


@router.get("/{plateau_id}")
async def get_plateau(plateau_id: str, current_user: dict = Depends(get_current_user)):
    plateau = await _get_plateau_or_404(plateau_id)
    accepted = len([m for m in plateau.get("members", []) if m.get("status") == "accepted"])
    plateau["vacant_slots"] = max(plateau.get("max_members", 4) - accepted, 0)
    return plateau


@router.patch("/{plateau_id}")
async def update_plateau(plateau_id: str, payload: PlateauUpdateInput, current_user: dict = Depends(get_current_user)):
    plateau = await _get_plateau_or_404(plateau_id)
    _require_admin(plateau, current_user["id"])

    updates = payload.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="Aucun champ à modifier")
    updates["updated_at"] = now_iso()

    await db.plateaus.update_one({"id": plateau_id}, {"$set": updates})

    # Notifier membres accepted
    accepted_members = [m for m in plateau.get("members", []) if m.get("status") == "accepted" and m.get("user_id") != current_user["id"]]
    for m in accepted_members:
        await _notify(
            user_id=m["user_id"],
            notif_type="plateau_updated",
            title="🎸 Plateau mis à jour",
            message=f'Le plateau "{plateau["title"]}" a été modifié par l\'admin',
            data={"plateau_id": plateau_id},
            link=_plateau_link(plateau_id),
        )

    updated = await db.plateaus.find_one({"id": plateau_id}, {"_id": 0})
    return updated


@router.delete("/{plateau_id}")
async def delete_plateau(plateau_id: str, current_user: dict = Depends(get_current_user)):
    plateau = await _get_plateau_or_404(plateau_id)
    _require_admin(plateau, current_user["id"])

    await db.plateaus.delete_one({"id": plateau_id})

    # Notifier membres
    for m in plateau.get("members", []):
        if m.get("user_id") and m["user_id"] != current_user["id"]:
            await _notify(
                user_id=m["user_id"],
                notif_type="plateau_deleted",
                title="🎸 Plateau supprimé",
                message=f'Le plateau "{plateau["title"]}" a été supprimé',
                data={"plateau_id": plateau_id, "plateau_title": plateau["title"]},
            )
    return {"message": "Plateau supprimé"}


@router.post("/{plateau_id}/invite")
async def invite_members(plateau_id: str, payload: PlateauInviteInput, current_user: dict = Depends(get_current_user)):
    """Admin invite plus de projets (pour remplir les places vacantes)."""
    plateau = await _get_plateau_or_404(plateau_id)
    _require_admin(plateau, current_user["id"])

    members = plateau.get("members", [])
    accepted_count = len([m for m in members if m.get("status") == "accepted"])
    pending_count = len([m for m in members if m.get("status") == "pending"])
    free_slots = plateau.get("max_members", 4) - accepted_count - pending_count
    if free_slots <= 0:
        raise HTTPException(status_code=400, detail="Aucune place disponible")
    if len(payload.members) > free_slots:
        raise HTTPException(status_code=400, detail=f"Trop d'invités : {free_slots} place(s) libre(s)")

    now = now_iso()
    added = []
    existing_keys = {(m.get("musician_id"), m.get("band_id")) for m in members}
    for mi in payload.members:
        if (mi.musician_id, mi.band_id) in existing_keys:
            continue  # évite les doublons silencieusement
        resolved = await _resolve_project(mi)
        new_member = {
            **resolved,
            "status": "pending",
            "invited_at": now,
            "responded_at": None,
        }
        members.append(new_member)
        added.append(new_member)

    if not added:
        raise HTTPException(status_code=400, detail="Tous les invités sont déjà dans le plateau")

    plateau["members"] = members
    plateau["status"] = _recompute_status(plateau)
    plateau["updated_at"] = now
    await db.plateaus.update_one(
        {"id": plateau_id},
        {"$set": {"members": members, "status": plateau["status"], "updated_at": now}},
    )

    for m in added:
        await _notify(
            user_id=m["user_id"],
            notif_type="plateau_invitation",
            title="🎸 Invitation à un plateau",
            message=f'{plateau["admin_name"]} vous invite au plateau "{plateau["title"]}"',
            data={"plateau_id": plateau_id, "musician_id": m["musician_id"]},
            link=_plateau_link(plateau_id),
        )
    return plateau


@router.post("/{plateau_id}/respond")
async def respond_invitation(plateau_id: str, payload: PlateauRespondInput, current_user: dict = Depends(get_current_user)):
    """Un membre invité accepte ou refuse."""
    plateau = await _get_plateau_or_404(plateau_id)

    members = plateau.get("members", [])
    # Trouve le membre pending correspondant à l'utilisateur courant
    target = None
    for m in members:
        if m.get("user_id") == current_user["id"] and m.get("status") == "pending":
            if payload.musician_id and m.get("musician_id") != payload.musician_id:
                continue
            target = m
            break
    if not target:
        raise HTTPException(status_code=404, detail="Aucune invitation en attente pour vous")

    target["status"] = "accepted" if payload.accept else "rejected"
    target["responded_at"] = now_iso()

    new_status = _recompute_status(plateau)
    plateau["status"] = new_status
    plateau["updated_at"] = now_iso()

    await db.plateaus.update_one(
        {"id": plateau_id},
        {"$set": {"members": members, "status": new_status, "updated_at": plateau["updated_at"]}},
    )

    # Build 218 — Auto-crée la discussion de groupe si plateau devient "active"
    if new_status == "active":
        await _create_group_conversation_if_needed(plateau)

    # Notifier l'admin
    await _notify(
        user_id=plateau["admin_user_id"],
        notif_type="plateau_response",
        title="🎸 Réponse à votre plateau",
        message=f'{target["project_name"]} a {"accepté" if payload.accept else "refusé"} le plateau "{plateau["title"]}"',
        data={"plateau_id": plateau_id, "member": target},
        link=_plateau_link(plateau_id),
    )

    return {"message": "Réponse enregistrée", "plateau_status": new_status}


@router.post("/{plateau_id}/request-join")
async def request_join(plateau_id: str, payload: PlateauJoinRequestInput, current_user: dict = Depends(get_current_user)):
    """Un musicien extérieur propose son projet pour une place vacante."""
    if current_user.get("role") != "musician":
        raise HTTPException(status_code=403, detail="Réservé aux musiciens")

    plateau = await _get_plateau_or_404(plateau_id)
    if plateau.get("status") != "incomplete":
        raise HTTPException(status_code=400, detail="Ce plateau n'a plus de places vacantes")

    members = plateau.get("members", [])
    # Vérifie que le user n'est pas déjà membre
    if any(m.get("user_id") == current_user["id"] for m in members):
        raise HTTPException(status_code=400, detail="Vous êtes déjà membre de ce plateau")

    # Résout le projet proposé
    mi = PlateauMemberInput(**payload.model_dump())
    resolved = await _resolve_project(mi)
    if resolved["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Ce projet ne vous appartient pas")

    now = now_iso()
    join_request_doc = {
        "id": str(uuid.uuid4()),
        "plateau_id": plateau_id,
        **resolved,
        "status": "pending",
        "created_at": now,
    }
    await db.plateau_join_requests.insert_one(join_request_doc)

    await _notify(
        user_id=plateau["admin_user_id"],
        notif_type="plateau_join_request",
        title="🎸 Demande d'intégration à votre plateau",
        message=f'{resolved["project_name"]} veut rejoindre le plateau "{plateau["title"]}"',
        data={
            "plateau_id": plateau_id,
            "join_request_id": join_request_doc["id"],
            "requester": resolved,
        },
        link=_plateau_link(plateau_id),
    )
    return {"message": "Demande envoyée à l'admin", "join_request_id": join_request_doc["id"]}


@router.get("/{plateau_id}/join-requests")
async def list_join_requests(plateau_id: str, current_user: dict = Depends(get_current_user)):
    """Admin consulte les demandes d'intégration en attente."""
    plateau = await _get_plateau_or_404(plateau_id)
    _require_admin(plateau, current_user["id"])

    cursor = db.plateau_join_requests.find(
        {"plateau_id": plateau_id, "status": "pending"}, {"_id": 0}
    ).sort("created_at", 1)
    return [r async for r in cursor]


@router.post("/{plateau_id}/respond-join-request")
async def respond_join_request(plateau_id: str, join_request_id: str, payload: PlateauRespondInput, current_user: dict = Depends(get_current_user)):
    """Admin accepte ou refuse une demande d'intégration."""
    plateau = await _get_plateau_or_404(plateau_id)
    _require_admin(plateau, current_user["id"])

    req = await db.plateau_join_requests.find_one(
        {"id": join_request_id, "plateau_id": plateau_id}, {"_id": 0}
    )
    if not req:
        raise HTTPException(status_code=404, detail="Demande introuvable")
    if req.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Demande déjà traitée")

    now = now_iso()
    new_req_status = "accepted" if payload.accept else "rejected"
    await db.plateau_join_requests.update_one(
        {"id": join_request_id},
        {"$set": {"status": new_req_status, "responded_at": now}},
    )

    if payload.accept:
        # Ajoute comme membre accepté
        members = plateau.get("members", [])
        accepted_count = len([m for m in members if m.get("status") == "accepted"])
        if accepted_count >= plateau.get("max_members", 4):
            raise HTTPException(status_code=400, detail="Plateau déjà complet")

        new_member = {
            "user_id": req["user_id"],
            "musician_id": req["musician_id"],
            "project_kind": req.get("project_kind", "band"),
            "band_id": req.get("band_id"),
            "project_name": req["project_name"],
            "music_styles": req.get("music_styles", []),
            "photo": req.get("photo"),
            "status": "accepted",
            "invited_at": req["created_at"],
            "responded_at": now,
        }
        members.append(new_member)
        new_status = _recompute_status({"members": members, "max_members": plateau.get("max_members", 4)})
        await db.plateaus.update_one(
            {"id": plateau_id},
            {"$set": {"members": members, "status": new_status, "updated_at": now}},
        )
        # Build 218 — Auto-crée la discussion de groupe si le plateau devient "active"
        if new_status == "active":
            fresh = await db.plateaus.find_one({"id": plateau_id}, {"_id": 0})
            if fresh:
                await _create_group_conversation_if_needed(fresh)

    # Notifier le demandeur
    await _notify(
        user_id=req["user_id"],
        notif_type="plateau_join_response",
        title="🎸 Réponse à votre demande d'intégration",
        message=f'Votre demande pour "{plateau["title"]}" a été {"acceptée" if payload.accept else "refusée"}',
        data={"plateau_id": plateau_id, "join_request_id": join_request_id, "accepted": payload.accept},
        link=_plateau_link(plateau_id) if payload.accept else None,
    )
    return {"message": "Réponse enregistrée"}
