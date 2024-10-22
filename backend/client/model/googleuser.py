from pydantic import BaseModel
from typing import Optional
class GoogleUser(BaseModel):
    user_auth_id:str
    name: str
    email: str