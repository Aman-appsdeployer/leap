from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from typing import Optional, List
import bcrypt
import hashlib
import jwt
from datetime import datetime, timedelta

# === FastAPI App ===
app = FastAPI()

# === CORS Middleware ===
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Database Configuration ===
DATABASE_URL = "mysql+pymysql://anjali:Telta21%402025@db.leap21stcentury.org:3306/leap21_hkt"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# === JWT Settings ===
SECRET_KEY = "anjali"  # Change to a strong secret key later
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 1

def create_access_token(data: dict, expires_delta: timedelta = timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# === Pydantic Models ===
class LoginRequest(BaseModel):
    username: str
    password: str
    user_type: str

class BatchCreate(BaseModel):
    batch_name: str
    school_id: int
    created_by: int
    class_id: Optional[int] = None
    section_id: Optional[int] = None
    student_id: Optional[int] = None
    session_id: Optional[int] = None

class BatchUpdate(BatchCreate):
    batch_id: int

class BatchOut(BaseModel):
    batch_id: int
    batch_name: str
    school_id_fk: int
    created_by: int
    class_id: Optional[int]
    section_id: Optional[int]
    student_id: Optional[int]
    session_id: Optional[int]

# === Password Helper Functions ===
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

# === Routes ===

# Home Route
@app.get("/")
def home():
    return {"message": "Hello from FastAPI"}

# Login Route
@app.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    if not data.username or not data.password or not data.user_type:
        raise HTTPException(status_code=400, detail="All fields are required")

    if data.user_type.lower() == "students":
        query = text("SELECT username, password FROM user_login WHERE username = :username")
        redirect_path = "/student"
    elif data.user_type.lower() == "teacher":
        query = text("""
            SELECT td.email AS username, ul.password  
            FROM teacher_details td
            JOIN user_login ul ON td.email = ul.username
            WHERE td.email = :username
        """)
        redirect_path = "/teacher"
    else:
        raise HTTPException(status_code=400, detail="Unsupported user type")

    result = db.execute(query, {"username": data.username}).fetchone()
    if not result:
        raise HTTPException(status_code=401, detail="Invalid username/email or password")

    stored_username, stored_password = result
    is_verified, new_hash = verify_password(data.password, stored_password)
    if not is_verified:
        raise HTTPException(status_code=401, detail="Invalid password")

    if new_hash:
        update_query = text("UPDATE user_login SET password = :password WHERE username = :username")
        db.execute(update_query, {"password": new_hash, "username": stored_username})
        db.commit()

    access_token = create_access_token(data={"sub": stored_username})
    return {
        "success": True,
        "message": "Login successful",
        "token": access_token,
        "redirect": redirect_path
    }

# Student and Teacher Dashboards
@app.get("/student")
def student_dashboard():
    return {"message": "Welcome Student"}

@app.get("/teacher")
def teacher_dashboard():
    return {"message": "Welcome Teacher"}

# === Batch Management ===

# Create Batch
@app.post("/api/create_batch")
def create_batch(data: BatchCreate, db: Session = Depends(get_db)):
    db.execute(text("""
        INSERT INTO Batch (batch_name, school_id_fk, created_by, class_id, section_id, student_id, session_id)
        VALUES (:batch_name, :school_id, :created_by, :class_id, :section_id, :student_id, :session_id)
    """), {
        "batch_name": data.batch_name,
        "school_id": data.school_id,
        "created_by": data.created_by,
        "class_id": data.class_id,
        "section_id": data.section_id,
        "student_id": data.student_id,
        "session_id": data.session_id
    })
    db.commit()
    return {"success": True, "message": "Batch created successfully"}

# Get all Batches
@app.get("/api/batches", response_model=List[BatchOut])
def get_batches(db: Session = Depends(get_db)):
    rows = db.execute(text("SELECT * FROM Batch")).fetchall()
    return [
        BatchOut(
            batch_id=row.batch_id,
            batch_name=row.batch_name,
            school_id_fk=row.school_id_fk,
            created_by=row.created_by,
            class_id=row.class_id,
            section_id=row.section_id,
            student_id=row.student_id,
            session_id=row.session_id
        )
        for row in rows
    ]

# Update Batch
@app.put("/api/update_batch")
def update_batch(data: BatchUpdate, db: Session = Depends(get_db)):
    query = text("""
        UPDATE Batch
        SET batch_name = :batch_name,
            school_id_fk = :school_id,
            created_by = :created_by,
            class_id = :class_id,
            section_id = :section_id,
            student_id = :student_id,
            session_id = :session_id
        WHERE batch_id = :batch_id
    """)
    result = db.execute(query, {
        "batch_name": data.batch_name,
        "school_id": data.school_id,
        "created_by": data.created_by,
        "class_id": data.class_id,
        "section_id": data.section_id,
        "student_id": data.student_id,
        "session_id": data.session_id,
        "batch_id": data.batch_id
    })
    db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Batch not found")
    return {"success": True, "message": "Batch updated successfully"}

# Delete Batch
@app.delete("/api/delete_batch/{batch_id}")
def delete_batch(batch_id: int, db: Session = Depends(get_db)):
    try:
        db.execute(text("DELETE FROM Batch_Assignment WHERE batch_id_fk = :batch_id"), {"batch_id": batch_id})
        result = db.execute(text("DELETE FROM Batch WHERE batch_id = :batch_id"), {"batch_id": batch_id})
        db.commit()

        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Batch not found")

        return {"success": True, "message": "Batch deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting batch: {str(e)}")

# === Fetch Schools for Dropdown ===

@app.get("/api/schools")
def get_schools(search: Optional[str] = None, db: Session = Depends(get_db)):
    if search:
        query = text("""
            SELECT school_id_pk AS school_id, school_name
            FROM school_details
            WHERE active_status = 'A' AND school_name LIKE :search
        """)
        rows = db.execute(query, {"search": f"%{search}%"}).fetchall()
    else:
        query = text("""
            SELECT school_id_pk AS school_id, school_name
            FROM school_details
            WHERE active_status = 'A'
        """)
        rows = db.execute(query).fetchall()

    return [{"school_id": row.school_id, "school_name": row.school_name} for row in rows]


# === Fetch Students by School ===

@app.get("/api/students_by_school/{school_id}")
def get_students_by_school(school_id: int, db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT student_id, student_name
        FROM student
        WHERE school_id_fk = :school_id
    """), {"school_id": school_id}).fetchall()
    return [{"student_id": row.student_id, "student_name": row.student_name} for row in rows]


















# from fastapi import FastAPI, HTTPException, Depends, Query
# from fastapi.middleware.cors import CORSMiddleware
# from sqlalchemy import create_engine, text
# from sqlalchemy.orm import sessionmaker
# from pydantic import BaseModel
# import bcrypt
# import hashlib
# import jwt  # For JWT token generation
# from datetime import datetime, timedelta
# from typing import Optional, List

# from routers.quiz_routes import router as quiz_router

# # === FastAPI App ===
# app = FastAPI()

# # === CORS ===
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # === Database Config ===
# DATABASE_URL = "mysql+pymysql://anjali:Telta21%402025@db.leap21stcentury.org:3306/leap21_hkt"
# engine = create_engine(DATABASE_URL)
# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

# # === Pydantic Models ===
# class LoginRequest(BaseModel):
#     username: str
#     password: str
#     user_type: str

# # === Password Helpers ===
# def hash_password_with_bcrypt(password: str) -> str:
#     salt = bcrypt.gensalt()
#     return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

# def verify_password(plain_password: str, hashed_password: str):
#     md5_hashed = hashlib.md5(plain_password.encode("utf-8")).hexdigest()
#     if md5_hashed == hashed_password:
#         return True, hash_password_with_bcrypt(plain_password)
#     elif bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8")):
#         return True, None
#     return False, None

# # === JWT Helper Function ===
# SECRET_KEY = "anjali"
# ALGORITHM = "HS256"

# def create_access_token(data: dict, expires_delta: timedelta = timedelta(hours=1)):
#     to_encode = data.copy()
#     expire = datetime.utcnow() + expires_delta
#     to_encode.update({"exp": expire})
#     encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
#     return encoded_jwt

# # === Routes ===
# @app.get("/")
# def home():
#     return {"message": "Hello from FastAPI"}

# @app.post("/login")
# def login(data: LoginRequest, db=Depends(get_db)):
#     if not data.username or not data.password or not data.user_type:
#         raise HTTPException(status_code=400, detail="All fields are required")

#     if data.user_type.lower() == "students":
#         query = text("SELECT username, password FROM user_login WHERE username = :username")
#         redirect_path = "/student"
#     elif data.user_type.lower() == "teacher":
#         query = text(""" 
#             SELECT td.email AS username, ul.password  
#             FROM teacher_details td
#             JOIN user_login ul ON td.email = ul.username
#             WHERE td.email = :username
#         """)
#         redirect_path = "/teacher"
#     else:
#         raise HTTPException(status_code=400, detail="Unsupported user type")

#     result = db.execute(query, {"username": data.username}).fetchone()
#     if not result:
#         raise HTTPException(status_code=401, detail="Invalid username/email or password")

#     stored_username, stored_password = result
#     is_verified, new_hash = verify_password(data.password, stored_password)
#     if not is_verified:
#         raise HTTPException(status_code=401, detail="Invalid password")

#     if new_hash:
#         update_query = text("UPDATE user_login SET password = :password WHERE username = :username")
#         db.execute(update_query, {"password": new_hash, "username": stored_username})
#         db.commit()

#     # Generate a JWT token
#     access_token = create_access_token(data={"sub": stored_username})
#     return {
#         "success": True,
#         "message": "Login successful",
#         "token": access_token,  # Return the generated token
#         "redirect": redirect_path
#     }

# @app.get("/student")
# def student_dashboard():
#     return {"message": "Welcome Student"}

# @app.get("/teacher")
# def teacher_dashboard():
#     return {"message": "Welcome Teacher"}

# # Include Quiz Routes
# app.include_router(quiz_router)

# @app.get("/api/schools")
# def get_schools(search: Optional[str] = "", db=Depends(get_db)):
#     query = text("""SELECT school_id_pk, school_name FROM school_details WHERE active_status = 'A' AND school_name LIKE :search""")
#     results = db.execute(query, {"search": f"%{search}%"}).fetchall()
#     return [{"school_id": row[0], "school_name": row[1]} for row in results]


# @app.get("/api/students")
# def get_students_by_school(school_id: int = Query(...), db=Depends(get_db)):
#     query = text("""
#         SELECT student_details_id_pk, name 
#         FROM student_details 
#         WHERE school_id_fk = :school_id AND active_status = 'A'
#     """)
#     rows = db.execute(query, {"school_id": school_id}).fetchall()
#     return [{"id": r[0], "name": r[1]} for r in rows]

# class BatchCreate(BaseModel):
#     batch_name: str
#     school_id: int
#     created_by: int
#     student_ids: List[int]

# @app.post("/api/create_batch")
# def create_batch(data: BatchCreate, db=Depends(get_db)):
#     result = db.execute(text("""
#         INSERT INTO Batch (batch_name, school_id_fk, created_by)
#         VALUES (:batch_name, :school_id, :created_by)
#     """), {
#         "batch_name": data.batch_name,
#         "school_id": data.school_id,
#         "created_by": data.created_by
#     })
#     batch_id = result.lastrowid

#     for _ in data.student_ids:
#         db.execute(text("""
#             INSERT INTO Batch_Assignment (batch_id_fk, quiz_id_fk)
#             VALUES (:batch_id, NULL)
#         """), {"batch_id": batch_id})

#     db.commit()
#     return {"success": True, "batch_id": batch_id}              


   







































