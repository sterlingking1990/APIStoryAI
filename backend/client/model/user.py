from pydantic import BaseModel
from client.model.subscription import SubscriptionBase
from typing import List, Optional

class UserBase(BaseModel):
    name: Optional[str]
    email: Optional[str]
    msisdn: Optional[str]
    subscriptions: List[SubscriptionBase] = []
    
    class Config:
        from_attributes=True
