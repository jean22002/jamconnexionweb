from typing import Optional
from pydantic import BaseModel

class CheckoutRequest(BaseModel):
    origin_url: str
    billing_cycle: Optional[str] = "monthly"  # Build 241 — "monthly" | "yearly"
