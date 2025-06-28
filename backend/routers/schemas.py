from pydantic import BaseModel
from datetime import datetime

class PostCreate(BaseModel):
    html: str
    css: str
    created_by: int

class PostResponse(BaseModel):
    id: int
    html: str
    css: str
    created_by: int
    created_at: datetime

    class Config:
        orm_mode = True
