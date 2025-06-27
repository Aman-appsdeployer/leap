from pydantic import BaseModel

class PostCreate(BaseModel):
    html: str
    css: str
    created_by: int
