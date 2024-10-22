from pydantic import BaseModel
from client.model.subscription import SubscriptionBase
from typing import List, Optional
from datetime import datetime

# SubscriptionBase Model with subscription_amount
class SubscriptionBase(BaseModel):
    user_id: int
    subscription_type: str # e.g., Free, Standard, Pro
    subscription_amount: float
    transaction_reference:str
    start_date: datetime
    end_date: datetime
    

    class Config:
        from_attributes = True