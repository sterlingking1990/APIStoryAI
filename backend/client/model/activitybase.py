from pydantic import BaseModel
from client.model.activitytype import ActivityType
# Pydantic model for incoming request
class ActivityRequest(BaseModel):
    user_id: int
    activity_type: ActivityType
    details: str = None
    
    class Config:
        from_attributes = True