from pydantic import BaseModel
from typing import List
class SummarizeRequest(BaseModel):
    queryResult: List[dict]  # Assuming query result is a list of dictionaries (you can adjust as needed)
    question: str
    aiKey: str
    
    class Config:
        from_attributes=True 