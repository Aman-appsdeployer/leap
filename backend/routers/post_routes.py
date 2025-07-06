# Updated FastAPI Router with Title & Image Support
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from uuid import uuid4
import os
from fastapi.responses import JSONResponse

from db.database import get_db  # DB session dependency
from routers.models import Post, PostImage
from routers.schemas import PostCreate, PostResponse

router = APIRouter(
    prefix="/api/posts",
    tags=["Posts"]
)

# Ensure upload directory exists
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ✅ Upload an image and return its URL
@router.post("/upload-image")
def upload_image(file: UploadFile = File(...)):
    file_ext = file.filename.split('.')[-1]
    filename = f"{uuid4().hex}.{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as f:
        f.write(file.file.read())

    image_url = f"/uploads/{filename}"
    return JSONResponse(content={"url": image_url})

# ✅ Create a post with title, html, css, image URLs
@router.post("/create", response_model=dict)
def create_post(post: PostCreate, db: Session = Depends(get_db)):
    new_post = Post(
        title=post.title,             # ✅ Save the title
        html=post.html,
        css=post.css,
        created_by=post.created_by
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    # ✅ Save associated image URLs
    if post.image_urls:
        for url in post.image_urls:
            db.add(PostImage(image_url=url, post_id=new_post.id))
        db.commit()

    return {
        "message": "Post saved successfully",
        "post_id": new_post.id
    }

# ✅ Get latest post
@router.get("/latest", response_model=PostResponse)
def get_latest_post(db: Session = Depends(get_db)):
    post = db.query(Post).order_by(Post.created_at.desc()).first()
    if not post:
        raise HTTPException(status_code=404, detail="No posts found")
    return post

# ✅ Get all posts
@router.get("/all", response_model=List[PostResponse])
def get_all_posts(db: Session = Depends(get_db)):
    posts = db.query(Post).order_by(Post.created_at.desc()).all()
    return posts
