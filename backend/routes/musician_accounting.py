"""
Musician Accounting router - Per-event accounting entries owned by a musician.

These endpoints let a musician (mobile + web) record financial details for each
participation/event they take part in: amount, GUSO/Facture, payment status, notes.

Strictly isolated from venue accounting (/api/accounting/...).
"""
from fastapi import APIRouter, HTTPException, Depends, Header, Response
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
import jwt
import os
import logging

router = APIRouter()
db = None
logger = logging.getLogger(__name__)

JWT_SECRET = os.environ.get('JWT_SECRET', 'default_secret')
JWT_ALGORITHM = "HS256"

ALLOWED_PAYMENT_METHODS = {"guso", "facture", "especes", "virement", "cheque", "promotion", ""}
ALLOWED_PAYMENT_STATUSES = {"paid", "pending", "confirmed", ""}
GUSO_CHARGES_RATE = 0.22  # ~22% charges sociales artistes


def set_db(database):
    global db
    db = database


async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


async def require_musician(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "musician":
        raise HTTPException(status_code=403, detail="Reserved to musicians")
    return current_user


class AccountingEntry(BaseModel):
    event_id: Optional[str] = None
    event_type: Optional[str] = None
    amount: Optional[float] = Field(None, ge=0)
    cachet_net: Optional[float] = None
    charges_sociales: Optional[float] = None
    payment_method: Optional[str] = ""
    payment_status: Optional[str] = ""
    is_guso: Optional[bool] = False
    guso_contract_type: Optional[str] = None
    invoice_file: Optional[str] = None
    notes: Optional[str] = Field(None, max_length=500)
    updated_at: Optional[datetime] = None


def _calculate_guso(amount: float):
    """Calcule charges + net pour un cachet GUSO (~22% charges)."""
    charges = round(amount * GUSO_CHARGES_RATE, 2)
    net = round(amount - charges, 2)
    return charges, net


def _serialize(doc):
    """Strip private fields before sending to clients."""
    if not doc:
        return None
    doc.pop("_id", None)
    doc.pop("musician_id", None)
    return doc


@router.get("/musicians/me/accounting", response_model=List[AccountingEntry])
async def list_my_accounting_entries(current_user: dict = Depends(require_musician)):
    """List all accounting entries for the connected musician."""
    cursor = db.musician_accounting.find({"musician_id": current_user["id"]}, {"_id": 0})
    docs = await cursor.to_list(length=2000)
    return [_serialize(doc) for doc in docs if doc]


# Reserved paths that already exist in musicians.py and must not be hijacked
# by the catch-all {event_id} route below.
_RESERVED_EVENT_IDS = {"summary", "concerts", "export", "invoices"}


@router.get("/musicians/me/accounting/{event_id}", response_model=AccountingEntry)
async def get_my_accounting_entry(event_id: str, current_user: dict = Depends(require_musician)):
    """Get a single accounting entry by event_id."""
    if event_id in _RESERVED_EVENT_IDS:
        raise HTTPException(status_code=404, detail="Not found")
    doc = await db.musician_accounting.find_one(
        {"musician_id": current_user["id"], "event_id": event_id},
        {"_id": 0},
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return _serialize(doc)


@router.put("/musicians/me/accounting/{event_id}", response_model=AccountingEntry)
async def upsert_my_accounting_entry(
    event_id: str,
    payload: AccountingEntry,
    current_user: dict = Depends(require_musician),
):
    """Create or update an accounting entry for a given event_id."""
    if event_id in _RESERVED_EVENT_IDS:
        raise HTTPException(status_code=400, detail="Invalid event_id")

    data = payload.dict(exclude_unset=True)

    # Validate enums explicitly
    if "payment_method" in data and data["payment_method"] not in ALLOWED_PAYMENT_METHODS:
        raise HTTPException(status_code=400, detail="Invalid payment_method")
    if "payment_status" in data and data["payment_status"] not in ALLOWED_PAYMENT_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid payment_status")

    # Force ownership and key
    data["event_id"] = event_id
    data["musician_id"] = current_user["id"]
    data["updated_at"] = datetime.now(timezone.utc)

    # Auto compute GUSO numbers server-side for consistency between web & mobile
    if data.get("is_guso") and data.get("amount") is not None:
        charges, net = _calculate_guso(data["amount"])
        data["charges_sociales"] = charges
        data["cachet_net"] = net
    elif "is_guso" in data and data.get("is_guso") is False:
        # Explicit non-GUSO update: clear stale GUSO numbers unless caller set them
        if "charges_sociales" not in data:
            data["charges_sociales"] = None
        if "cachet_net" not in data:
            data["cachet_net"] = None

    await db.musician_accounting.update_one(
        {"musician_id": current_user["id"], "event_id": event_id},
        {
            "$set": data,
            "$setOnInsert": {"created_at": datetime.now(timezone.utc)},
        },
        upsert=True,
    )

    doc = await db.musician_accounting.find_one(
        {"musician_id": current_user["id"], "event_id": event_id},
        {"_id": 0},
    )
    return _serialize(doc)


@router.delete("/musicians/me/accounting/{event_id}", status_code=204)
async def delete_my_accounting_entry(event_id: str, current_user: dict = Depends(require_musician)):
    """Delete an accounting entry."""
    if event_id in _RESERVED_EVENT_IDS:
        raise HTTPException(status_code=400, detail="Invalid event_id")
    await db.musician_accounting.delete_one({
        "musician_id": current_user["id"],
        "event_id": event_id,
    })
    return Response(status_code=204)
