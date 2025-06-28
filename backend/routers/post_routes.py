from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from db.database import get_db  # Your DB session dependency
from routers.models import Post
from routers.schemas import PostCreate
 

router = APIRouter(
    prefix="/api/posts",
    tags=["Posts"]
)

@router.post("/create")
def create_post(post: PostCreate, db: Session = Depends(get_db)):
    new_post = Post(
        html=post.html,
        css=post.css,
        created_by=post.created_by
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return {
        "message": "Post saved successfully",
        "post_id": new_post.id
    }

@router.get("/latest")
def get_latest_post(db: Session = Depends(get_db)):
    post = db.query(Post).order_by(Post.created_at.desc()).first()
    if not post:
        raise HTTPException(status_code=404, detail="No posts found")
    return {
        "html": post.html,
        "css": post.css
    }

@router.get("/all")
def get_all_posts(db: Session = Depends(get_db)):
    posts = db.query(Post).order_by(Post.created_at.desc()).all()
    return [
        {
            "id": p.id,
            "html": p.html,
            "css": p.css,
            "created_by": p.created_by,
            "created_at": p.created_at
        }
        for p in posts
    ]
