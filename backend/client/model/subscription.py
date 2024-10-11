from pydantic import BaseModel
from typing import Optional
from datetime import date

class SubscriptionBase(BaseModel):
    service: str
    service_duration: Optional[str] = None
    date_subscribed: Optional[date] = None 
    description: Optional[str] = None
    end_date: Optional[date] = None
    
    class Config:
        from_attributes=True  