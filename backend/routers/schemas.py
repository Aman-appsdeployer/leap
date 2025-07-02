from typing import List
from pydantic import BaseModel
from datetime import datetime

class PostImageSchema(BaseModel):
    image_url: str
    class Config:
        orm_mode = True

class PostCreate(BaseModel):
    html: str
    css: str
    created_by: int
    image_urls: List[str] = []

class PostResponse(BaseModel):
    id: int
    html: str
    css: str
    created_by: int
    created_at: datetime
    images: List[PostImageSchema]
    class Config:
        orm_mode = True
