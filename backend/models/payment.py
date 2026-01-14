from pydantic import BaseModel

class CheckoutRequest(BaseModel):
    origin_url: str
