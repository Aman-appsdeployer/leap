from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from pydantic import BaseModel
import bcrypt
import hashlib
import jwt  # For JWT token generation
from datetime import datetime, timedelta
from typing import Optional, List

from routers.quiz_routes import router as quiz_router

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

# === Database Config ===
DATABASE_URL = "mysql+pymysql://anjali:Telta21%402025@db.leap21stcentury.org:3306/leap21_hkt"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

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

# === JWT Helper Function ===
SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"

def create_access_token(data: dict, expires_delta: timedelta = timedelta(hours=1)):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# === Routes ===
@app.get("/")
def home():
    return {"message": "Hello from FastAPI"}

@app.post("/login")
def login(data: LoginRequest, db=Depends(get_db)):
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

    # Generate a JWT token
    access_token = create_access_token(data={"sub": stored_username})
    return {
        "success": True,
        "message": "Login successful",
        "token": access_token,  # Return the generated token
        "redirect": redirect_path
    }

@app.get("/student")
def student_dashboard():
    return {"message": "Welcome Student"}

@app.get("/teacher")
def teacher_dashboard():
    return {"message": "Welcome Teacher"}

# Include Quiz Routes
app.include_router(quiz_router)




# from fastapi import FastAPI, HTTPException, Depends
# from fastapi.middleware.cors import CORSMiddleware
# from sqlalchemy import create_engine, text
# from sqlalchemy.orm import sessionmaker
# from pydantic import BaseModel
# import hashlib
# import bcrypt
# from typing import List, Optional
# from datetime import datetime

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

# class OptionCreate(BaseModel):
#     option_text: str
#     is_correct: bool

# class QuestionCreate(BaseModel):
#     question_text: str
#     question_type: str
#     points: int
#     options: List[OptionCreate]

# class QuizCreate(BaseModel):
#     quiz_title: str
#     description: Optional[str]
#     created_by_mentor_id_fk: int
#     is_open: Optional[bool] = True
#     start_time: Optional[datetime] = None

# class FullQuizCreate(QuizCreate):
#     questions: List[QuestionCreate]

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

#     return {
#         "success": True,
#         "message": "Login successful",
#         "token": "your-jwt-token-here",  # Replace with real JWT if needed
#         "redirect": redirect_path
#     }

# @app.get("/student")
# def student_dashboard():
#     return {"message": "Welcome Student"}

# @app.get("/teacher")
# def teacher_dashboard():
#     return {"message": "Welcome Teacher"}

# @app.post("/quiz/full-create")
# def create_full_quiz(data: FullQuizCreate, db=Depends(get_db)):
#     # Start by inserting the quiz
#     quiz_query = text("""
#         INSERT INTO Quiz (quiz_title, description, created_by_mentor_id_fk, is_open, start_time)
#         VALUES (:quiz_title, :description, :created_by_mentor_id_fk, :is_open, :start_time)
#     """)
#     quiz_result = db.execute(quiz_query, {
#         "quiz_title": data.quiz_title,
#         "description": data.description,
#         "created_by_mentor_id_fk": data.created_by_mentor_id_fk,
#         "is_open": data.is_open,
#         "start_time": data.start_time or datetime.now()
#     })
#     quiz_id = quiz_result.lastrowid

#     # Now insert questions and options
#     for q in data.questions:
#         question_query = text("""
#             INSERT INTO Question (quiz_id_fk, question_text, question_type, points)
#             VALUES (:quiz_id_fk, :question_text, :question_type, :points)
#         """)
#         question_result = db.execute(question_query, {
#             "quiz_id_fk": quiz_id,
#             "question_text": q.question_text,
#             "question_type": q.question_type,
#             "points": q.points
#         })
#         question_id = question_result.lastrowid

#         for opt in q.options:
#             option_query = text("""
#                 INSERT INTO QuestionOption (question_id_fk, option_text, is_correct)
#                 VALUES (:question_id_fk, :option_text, :is_correct)
#             """)
#             db.execute(option_query, {
#                 "question_id_fk": question_id,
#                 "option_text": opt.option_text,
#                 "is_correct": opt.is_correct
#             })

#     db.commit()
#     return {"success": True, "quiz_id": quiz_id}

# @app.get("/quizzes")
# def get_all_quizzes(db=Depends(get_db)):
#     query = text("SELECT quiz_id, quiz_title, description FROM Quiz WHERE is_open = TRUE")
#     result = db.execute(query).mappings().fetchall()
#     return [row for row in result]

# @app.get("/quiz/{quiz_id}")
# def get_quiz_with_questions(quiz_id: int, db=Depends(get_db)):
#     # Get quiz
#     quiz_query = text("SELECT * FROM Quiz WHERE quiz_id = :quiz_id")
#     quiz_result = db.execute(quiz_query, {"quiz_id": quiz_id}).mappings().fetchone()

#     if not quiz_result:
#         raise HTTPException(status_code=404, detail="Quiz not found")

#     # Get questions
#     question_query = text("SELECT * FROM Question WHERE quiz_id_fk = :quiz_id")
#     questions = db.execute(question_query, {"quiz_id": quiz_id}).mappings().fetchall()

#     full_questions = []

#     for q in questions:
#         question_dict = dict(q)

#         # Fetch options for each question from QuestionOption
#         option_query = text("SELECT * FROM QuestionOption WHERE question_id_fk = :qid")
#         options = db.execute(option_query, {"qid": q["question_id"]}).mappings().fetchall()

#         question_dict["options"] = [dict(opt) for opt in options]
#         full_questions.append(question_dict)

#     return {
#         "quiz": dict(quiz_result),
#         "questions": full_questions
#     }

# class AnswerSubmission(BaseModel):
#     user_id: int
#     quiz_id: int
#     answers: dict[int, int]  # question_id → selected option_id

# @app.post("/api/submit_quiz")
# def submit_quiz(data: AnswerSubmission, db=Depends(get_db)):
#     total_score = 0

#     for question_id, selected_option_id in data.answers.items():
#         # Check if selected option is correct
#         query = text("""
#             SELECT is_correct, q.points FROM QuestionOption o
#             JOIN Question q ON q.question_id = o.question_id_fk
#             WHERE o.option_id = :option_id AND o.question_id_fk = :question_id
#         """)
#         result = db.execute(query, {
#             "option_id": selected_option_id,
#             "question_id": question_id
#         }).mappings().fetchone()

#         if result and result["is_correct"]:
#             total_score += result["points"]

#         # Save response
#         db.execute(text("""
#             INSERT INTO Response (question_id_fk, response_text)
#             VALUES (:qid, :response)
#         """), {
#             "qid": question_id,
#             "response": str(selected_option_id)  # store selected option
#         })

#     db.commit()  # Commit the transaction once all answers are stored
#     return {"success": True, "score": total_score}

# @app.delete("/quiz/{quiz_id}")
# def delete_quiz(quiz_id: int, db=Depends(get_db)):
#     # Delete options
#     db.execute(text("""
#         DELETE FROM QuestionOption WHERE question_id_fk IN 
#         (SELECT question_id FROM Question WHERE quiz_id_fk = :qid)
#     """), {"qid": quiz_id})

#     # Delete questions
#     db.execute(text("DELETE FROM Question WHERE quiz_id_fk = :qid"), {"qid": quiz_id})

#     # Delete quiz
#     db.execute(text("DELETE FROM Quiz WHERE quiz_id = :qid"), {"qid": quiz_id})

#     db.commit()
#     return {"success": True, "message": "Quiz deleted successfully"}












































# from fastapi import FastAPI, HTTPException, Depends
# from fastapi.middleware.cors import CORSMiddleware
# from sqlalchemy import create_engine, text
# from sqlalchemy.orm import sessionmaker
# from pydantic import BaseModel
# import hashlib
# import bcrypt
# from typing import List, Optional
# from datetime import datetime

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

# class OptionCreate(BaseModel):
#     option_text: str
#     is_correct: bool

# class QuestionCreate(BaseModel):
#     question_text: str
#     question_type: str
#     points: int
#     options: List[OptionCreate]

# class QuizCreate(BaseModel):
#     quiz_title: str
#     description: Optional[str]
#     created_by_mentor_id_fk: int
#     is_open: Optional[bool] = True
#     start_time: Optional[datetime] = None

# class FullQuizCreate(QuizCreate):
#     questions: List[QuestionCreate]

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

#     return {
#         "success": True,
#         "message": "Login successful",
#         "token": "your-jwt-token-here",  # Replace with real JWT if needed
#         "redirect": redirect_path
#     }

# @app.get("/student")
# def student_dashboard():
#     return {"message": "Welcome Student"}

# @app.get("/teacher")
# def teacher_dashboard():
#     return {"message": "Welcome Teacher"}

# @app.post("/quiz/full-create")
# def create_full_quiz(data: FullQuizCreate, db=Depends(get_db)):
#     quiz_query = text("""
#         INSERT INTO Quiz (quiz_title, description, created_by_mentor_id_fk, is_open, start_time)
#         VALUES (:quiz_title, :description, :created_by_mentor_id_fk, :is_open, :start_time)
#     """)
#     quiz_result = db.execute(quiz_query, {
#         "quiz_title": data.quiz_title,
#         "description": data.description,
#         "created_by_mentor_id_fk": data.created_by_mentor_id_fk,
#         "is_open": data.is_open,
#         "start_time": data.start_time or datetime.now()
#     })
#     quiz_id = quiz_result.lastrowid

#     for q in data.questions:
#         question_query = text("""
#             INSERT INTO Question (quiz_id_fk, question_text, question_type, points)
#             VALUES (:quiz_id_fk, :question_text, :question_type, :points)
#         """)
#         question_result = db.execute(question_query, {
#             "quiz_id_fk": quiz_id,
#             "question_text": q.question_text,
#             "question_type": q.question_type,
#             "points": q.points
#         })
#         question_id = question_result.lastrowid

#         for opt in q.options:
#             option_query = text("""
#                 INSERT INTO QuestionOption (question_id_fk, option_text, is_correct)
#                 VALUES (:question_id_fk, :option_text, :is_correct)
#             """)
#             db.execute(option_query, {
#                 "question_id_fk": question_id,
#                 "option_text": opt.option_text,
#                 "is_correct": opt.is_correct
#             })

#     db.commit()
#     return {"success": True, "quiz_id": quiz_id}

# @app.get("/quizzes")
# def get_all_quizzes(db=Depends(get_db)):
#     query = text("SELECT * FROM Quiz")
#     result = db.execute(query).fetchall()
#     return [dict(row) for row in result]

# @app.get("/quiz/{quiz_id}")
# def get_quiz_with_questions(quiz_id: int, db=Depends(get_db)):
#     quiz_query = text("SELECT * FROM Quiz WHERE quiz_id = :quiz_id")
#     quiz_result = db.execute(quiz_query, {"quiz_id": quiz_id}).fetchone()
#     if not quiz_result:
#         raise HTTPException(status_code=404, detail="Quiz not found")

#     question_query = text("SELECT * FROM Question WHERE quiz_id_fk = :quiz_id")
#     question_result = db.execute(question_query, {"quiz_id": quiz_id}).fetchall()
#     questions = [dict(row) for row in question_result]

#     return {
#         "quiz": dict(quiz_result),
#         "questions": questions
#     }



# from fastapi import FastAPI, HTTPException, Depends
# from fastapi.middleware.cors import CORSMiddleware
# from sqlalchemy import create_engine, text
# from sqlalchemy.orm import sessionmaker

# from pydantic import BaseModel
# import hashlib
# import bcrypt





# # === FastAPI App ===
# app = FastAPI()

# # === CORS ===
# origins = ["*"]
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # === Database Config ===
# DATABASE_URL = "mysql+pymysql://anjali:Telta21%402025@db.leap21stcentury.org:3306/leap21_hkt"
# engine = create_engine(DATABASE_URL)
# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# # === Dependency for DB session ===
# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

# # === Request Model ===
# class LoginRequest(BaseModel):
#     username: str  # Email or username
#     password: str
#     user_type: str  # "teacher" or "student"

# # === Password Helpers ===
# def hash_password_with_bcrypt(password: str) -> str:
#     salt = bcrypt.gensalt()
#     return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

# def verify_password(plain_password: str, hashed_password: str):
#     md5_hashed = hashlib.md5(plain_password.encode("utf-8")).hexdigest()
#     if md5_hashed == hashed_password:
#         # It's an old MD5 hash, return upgraded hash
#         return True, hash_password_with_bcrypt(plain_password)
#     elif bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8")):
#         return True, None
#     return False, None

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
#         update_table = "user_login"
#         login_identifier_column = "username"
#     elif data.user_type.lower() == "teacher":
#         query = text("""
#             SELECT td.email AS username, ul.password  
#             FROM teacher_details td
#             JOIN user_login ul ON td.email = ul.username
#             WHERE td.email = :username
#         """)
#                                    # td  maens teacher_details &&&    ul user_login 
#         redirect_path = "/teacher"
#         update_table = "user_login"
#         login_identifier_column = "username"
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
#         update_query = text(f"UPDATE {update_table} SET password = :password WHERE {login_identifier_column} = :username")
#         db.execute(update_query, {"password": new_hash, "username": stored_username})
#         db.commit()

#     return {
#         "success": True,
#         "message": "Login successful",
#         "token": "your-jwt-token-here",  # Add JWT generation later
#         "redirect": redirect_path
#     }

# @app.get("/student")
# def student_dashboard():
#     return {"message": "Welcome Student"}

# @app.get("/teacher")
# def teacher_dashboard():
#     return {"message": "Welcome Teacher"}



































