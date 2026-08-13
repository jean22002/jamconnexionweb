"""
Emergent-managed Push Notifications (SuprSend relay)

Backend does NOT store device tokens — SuprSend does.
Backend does NOT talk to Firebase directly — Emergent relays.

Env var: EMERGENT_PUSH_KEY (placeholder in dev, real key auto-injected at prod deploy).
"""
import os
import logging
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

PUSH_BASE_URL = "https://integrations.emergentagent.com"
PUSH_KEY = os.environ.get("EMERGENT_PUSH_KEY", "placeholder")

# Shared async client (module-level singleton)
_push_client = httpx.AsyncClient(
    base_url=PUSH_BASE_URL,
    headers={"X-Push-Key": PUSH_KEY},
    timeout=10.0,
)

router = APIRouter(tags=["push"])


class RegisterPushBody(BaseModel):
    user_id: str
    platform: str = Field(..., description='"android" | "ios"')
    device_token: str


@router.post("/register-push", status_code=201)
async def register_push(body: RegisterPushBody):
    """
    Called by the mobile app after login/app-open to register its native
    device token (FCM / APNs) with Emergent Push Service.
    """
    try:
        resp = await _push_client.post(
            "/api/v1/push/users/register",
            json=body.model_dump(),
        )
    except httpx.RequestError as e:
        logger.warning(f"[push] register network error: {e}")
        raise HTTPException(status_code=502, detail="Push provider unavailable")

    if resp.status_code == 401:
        raise HTTPException(status_code=500, detail="EMERGENT_PUSH_KEY missing or invalid")
    if resp.status_code >= 500:
        raise HTTPException(status_code=502, detail="Push provider unavailable")

    resp.raise_for_status()
    return {"status": "registered"}


async def send_push(
    recipients: list[str],
    data: dict,
    idempotency_key: Optional[str] = None,
) -> None:
    """
    Send a push notification to a list of user IDs (NOT device tokens).

    ⚠️ Callers MUST wrap this in try/except — a push failure must NEVER
    block the main business operation.

    Args:
        recipients: list of user_ids (max 100 per call).
        data: dict with at minimum {title, message}; optional {action_url, type, ...}.
        idempotency_key: recommended to avoid duplicates on retry.
    """
    if not recipients:
        return
    if len(recipients) > 100:
        raise ValueError("max 100 recipients per call; chunk before sending")
    if "title" not in data or "message" not in data:
        raise ValueError("data must include title and message")

    payload: dict = {"recipients": recipients, "data": data}
    if idempotency_key:
        payload["$idempotency_key"] = idempotency_key

    try:
        resp = await _push_client.post("/api/v1/push/trigger", json=payload)
    except httpx.RequestError as e:
        logger.warning(f"[push] send network error: {e}")
        raise HTTPException(status_code=502, detail="Push provider unavailable")

    if resp.status_code == 401:
        raise HTTPException(status_code=500, detail="EMERGENT_PUSH_KEY missing or invalid")
    if resp.status_code >= 500:
        raise HTTPException(status_code=502, detail="Push provider unavailable")

    resp.raise_for_status()
