from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from pydantic import BaseModel
import bcrypt
import hashlib
import jwt
from datetime import datetime, timedelta
from typing import Optional

from db.database import get_db
from routers.school_routes import router as school_router
from routers.quiz_routes import quiz_router, public_router
from routers.batch_routes import router as batch_router
from routers import student_routes

# === FastAPI App ===
app = FastAPI()

# === CORS ===
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Pydantic Models ===
class LoginRequest(BaseModel):
    username: str
    password: str
    user_type: str

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

# === JWT Helpers ===
SECRET_KEY = "AMAN"
ALGORITHM = "HS256"

def create_access_token(data: dict, expires_delta: timedelta = timedelta(hours=1)):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(authorization: str = Header(...)):
    try:
        token = authorization.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return username
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# === Routes ===
@app.get("/")
def home():
    return {"message": "Hello from FastAPI"}

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

@app.get("/student")
def student_dashboard(current_user: str = Depends(get_current_user)):
    return {"message": f"Welcome {current_user}"}

@app.get("/teacher")
def teacher_dashboard(current_user: str = Depends(get_current_user)):
    return {"message": f"Welcome {current_user}"}

# === Include Routers (Only Once Each) ===
app.include_router(school_router)
app.include_router(batch_router)
app.include_router(student_routes.router)
app.include_router(quiz_router)  # ✅ already has prefix "/api/quizzes"
app.include_router(public_router)      # For /quizzes















# from fastapi import FastAPI, HTTPException, Depends, Header 
# from fastapi.middleware.cors import CORSMiddleware
# from sqlalchemy import text
# from sqlalchemy.orm import Session
# from pydantic import BaseModel
# import bcrypt
# import hashlib
# import jwt
# from datetime import datetime, timedelta
# from typing import Optional
# from db.database import get_db
# from routers.school_routes import router as school_router
# from routers.quiz_routes import router as quiz_router
# from routers.batch_routes import router as batch_router
# from routers import student_routes
 


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

# # === JWT Helpers ===
# SECRET_KEY = "anjali"
# ALGORITHM = "HS256"

# def create_access_token(data: dict, expires_delta: timedelta = timedelta(hours=1)):
#     to_encode = data.copy()
#     expire = datetime.utcnow() + expires_delta
#     to_encode.update({"exp": expire})
#     return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# def get_current_user(authorization: str = Header(...)):
#     try:
#         token = authorization.split(" ")[1]
#         payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#         username = payload.get("sub")
#         if username is None:
#             raise HTTPException(status_code=401, detail="Invalid token payload")
#         return username
#     except jwt.ExpiredSignatureError:
#         raise HTTPException(status_code=401, detail="Token expired")
#     except jwt.PyJWTError:
#         raise HTTPException(status_code=401, detail="Invalid token")

# # === Routes ===
# @app.get("/")
# def home():
#     return {"message": "Hello from FastAPI"}

# @app.post("/login")
# def login(data: LoginRequest, db: Session = Depends(get_db)):
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

#     access_token = create_access_token(data={"sub": stored_username})
#     return {
#         "success": True,
#         "message": "Login successful",
#         "token": access_token,
#         "redirect": redirect_path
#     }

# @app.get("/student")
# def student_dashboard(current_user: str = Depends(get_current_user)):
#     return {"message": f"Welcome {current_user}"}

# @app.get("/teacher")
# def teacher_dashboard(current_user: str = Depends(get_current_user)):
#     return {"message": f"Welcome {current_user}"}

# class QuizAssignmentRequest(BaseModel):
#     batch_id: int
#     quiz_id: int


# # === Include Routers ===
# app.include_router(school_router)
# app.include_router(quiz_router)
# app.include_router(batch_router)
# app.include_router(student_routes.router)





























# from fastapi import FastAPI, HTTPException, Depends
# from fastapi.middleware.cors import CORSMiddleware
# from sqlalchemy import text
# from sqlalchemy.orm import Session
# from pydantic import BaseModel
# import bcrypt
# import hashlib
# import jwt
# from datetime import datetime, timedelta
# from typing import Optional

# # Import database dependency
# from db.database import get_db

# # Import routers
# from routers.school_routes import router as school_router
# from routers.quiz_routes import router as quiz_router
# from routers.batch_routes import router as batch_router
# from routers import student_routes


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
# SECRET_KEY = "your-secret-key"
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
# def login(data: LoginRequest, db: Session = Depends(get_db)):
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

#     access_token = create_access_token(data={"sub": stored_username})
#     return {
#         "success": True,
#         "message": "Login successful",
#         "token": access_token,
#         "redirect": redirect_path
#     }

# @app.get("/student")
# def student_dashboard():
#     return {"message": "Welcome Student"}

# @app.get("/teacher")
# def teacher_dashboard():
#     return {"message": "Welcome Teacher"}

# # === Include Routers ===
# app.include_router(school_router)
# app.include_router(quiz_router)
# app.include_router(batch_router)
# app.include_router(student_routes.router)















# from fastapi import FastAPI, HTTPException, Depends
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
# SECRET_KEY = "your-secret-key"
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



