from pydantic import BaseModel
from typing import Optional

class ProfitabilityData(BaseModel):
    revenue: float  # Recettes
    expenses: float  # Dépenses
    notes: Optional[str] = None

class ProfitabilityResponse(BaseModel):
    revenue: float
    expenses: float
    profit: float  # Bénéfice net (calculé)
    notes: Optional[str] = None
    recorded_at: str
