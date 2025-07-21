from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.orm import Session
from pydantic import BaseModel
import bcrypt
import hashlib
import jwt
from datetime import datetime, timedelta
from typing import Optional
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from db.database import get_db
from routers.school_routes import router as school_router
from routers.quiz_routes import quiz_router, public_router, badge_router, project_router
from routers.batch_routes import router as batch_router
from routers import student_routes
from routers.post_routes import router as post_router

# === Configuration ===
SECRET_KEY = os.getenv("JWT_SECRET", "CHANGE_ME_IN_PRODUCTION")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

# === FastAPI App ===
app = FastAPI()
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

origins = os.getenv("ALLOWED_ORIGINS", "").split(",")


# === CORS ===
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Pydantic Models ===
class LoginRequest(BaseModel):
    username: str
    password: str
    user_type: str  # "students" or "teacher"

# === Password Helpers ===
def hash_password_with_bcrypt(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str):
    md5_hashed = hashlib.md5(plain_password.encode("utf-8")).hexdigest()
    if md5_hashed == hashed_password:
        return True, hash_password_with_bcrypt(plain_password)
    elif bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8")):
        return True, None
    return False, None

# === JWT ===
def create_access_token(data: dict, expires_delta: timedelta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(authorization: str = Header(...)):
    try:
        print("Auth Header:", authorization)  
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid auth header")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return username
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.PyJWTError as e:
        print("JWT Error:", str(e))
        raise HTTPException(status_code=401, detail="Invalid token")

# === Routes ===

@app.get("/")
def home():
    return {"message": "Hello from FastAPI"}

@app.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    if not data.username or not data.password or not data.user_type:
        raise HTTPException(status_code=400, detail="All fields are required")

    expected_type = 1 if data.user_type.lower() == "students" else 2 if data.user_type.lower() == "teacher" else None
    if expected_type is None:
        raise HTTPException(status_code=400, detail="Invalid user type selected")

    result = db.execute(text("""
        SELECT ul.username, ul.password, ul.user_type_id_fk, ut.user_type, ut.active_status
        FROM user_login ul
        JOIN user_type ut ON ul.user_type_id_fk = ut.user_type_id_pk
        WHERE ul.username = :username
    """), {"username": data.username}).fetchone()

    if not result:
        raise HTTPException(status_code=401, detail="Invalid username")

    stored_username, stored_password, user_type_id_fk, user_type_str, user_type_status = result

    if user_type_status != 'A':
        raise HTTPException(status_code=403, detail="User type is not active")

    if user_type_id_fk != expected_type:
        raise HTTPException(status_code=403, detail=f"Login not allowed as {data.user_type}")

    is_verified, new_hash = verify_password(data.password, stored_password)
    if not is_verified:
        raise HTTPException(status_code=401, detail="Invalid password")

    if new_hash:
        db.execute(text("UPDATE user_login SET password = :password WHERE username = :username"), {
            "password": new_hash,
            "username": stored_username
        })
        db.commit()

    access_token = create_access_token(data={"sub": stored_username})
    redirect_path = "/student" if expected_type == 1 else "/teacher"
    
    student_data = None
    if expected_type == 1:
        student = db.execute(text("""
            SELECT student_details_id_pk, school_id_fk, class_id_fk, section_id_fk, name
            FROM student_details
            WHERE email = :email
        """), {"email": stored_username}).fetchone()

        if not student:
            raise HTTPException(status_code=404, detail="Student record not found")

        student_data = {
            "student_details_id_pk": student.student_details_id_pk,
            "school_id_fk": student.school_id_fk,
            "class_id_fk": student.class_id_fk,
            "section_id_fk": student.section_id_fk,
            "name": student.name
        }

    return {
        "success": True,
        "message": "Login successful",
        "token": access_token,
        "redirect": redirect_path,
        "student": student_data
    }

@app.get("/student")
def student_dashboard(current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    result = db.execute(text("""
        SELECT name, student_details_id_pk
        FROM student_details
        WHERE email = :email
    """), {"email": current_user}).fetchone()

    if result:
        return {"name": result.name, "student_id": result.student_details_id_pk}
    raise HTTPException(status_code=404, detail="Student not found")

@app.get("/teacher")
def teacher_dashboard(current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    result = db.execute(text("""
        SELECT name
        FROM teacher_details
        WHERE email = :email
    """), {"email": current_user}).fetchone()

    if result:
        return {"name": result.name}
    raise HTTPException(status_code=404, detail="Teacher not found")

# === Routers ===
app.include_router(school_router)
app.include_router(batch_router)
app.include_router(student_routes.router)
app.include_router(quiz_router)
app.include_router(public_router)
app.include_router(badge_router)
app.include_router(project_router)
app.include_router(post_router)



















