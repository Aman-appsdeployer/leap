
from fastapi import APIRouter, HTTPException, Depends, Body , Header, File, UploadFile, Form
from sqlalchemy.orm import Session 
import logging
import requests
import os
from .models import Attempt, Response, QuestionOption
from sqlalchemy import text, func
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from db.database import get_db
import traceback 

quiz_router = APIRouter(prefix="/api/quizzes", tags=["Quizzes"])
public_router = APIRouter()
badge_router = APIRouter()


# === Pydantic Models ===
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# ───── Reusable Option model ───────────────────────
class OptionCreate(BaseModel):
    option_text: str
    is_correct: bool

# ───── Reusable Question model ─────────────────────
class QuestionCreate(BaseModel):
    question_text: str
    question_type: str
    points: int
    options: List[OptionCreate]

# ───── Quiz creation model ─────────────────────────
class QuizCreate(BaseModel):
    quiz_title: str
    description: Optional[str] = None
    created_by_mentor_id_fk: int
    is_open: bool = True
    start_time: Optional[datetime] = None

# ───── Full Quiz with nested questions ─────────────
class FullQuizCreate(QuizCreate):
    questions: List[QuestionCreate]

# ───── Quiz assignment to a batch ──────────────────
class QuizAssignmentRequest(BaseModel):
    quiz_id: int
    batch_id: int

# ───── Update models ───────────────────────────────
class OptionUpdate(BaseModel):
    option_text: str
    is_correct: bool

class QuestionUpdate(BaseModel):
    question_text: str
    question_type: str
    points: int
    options: List[OptionUpdate]

class QuizUpdateSchema(BaseModel):
    quiz_title: str
    description: Optional[str]
    questions: List[QuestionUpdate]


# === ROUTES ===

@quiz_router.post("/quiz")
def create_quiz(data: FullQuizCreate, db=Depends(get_db)):
    try:
        #  Use default Teacher ID (you can override this later if needed)
        default_mentor_id = 3

        #  Confirm mentor exists
        mentor_exists = db.execute(
            text("SELECT teacher_details_id_pk FROM teacher_details WHERE teacher_details_id_pk = :id"),
            {"id": default_mentor_id}
        ).fetchone()

        if not mentor_exists:
            raise HTTPException(status_code=400, detail=" Default mentor (ID 3) not found in teacher_details.")

        #  Validate top-level quiz fields
        if not data.quiz_title.strip():
            raise HTTPException(status_code=400, detail=" Quiz title is required.")
        if not data.questions or len(data.questions) == 0:
            raise HTTPException(status_code=400, detail=" Quiz must contain at least one question.")

        #  Validate all questions before inserting
        for i, question in enumerate(data.questions):
            if not question.question_text.strip():
                raise HTTPException(status_code=400, detail=f" Question {i+1} is empty.")
            if not question.options or len(question.options) < 2:
                raise HTTPException(status_code=400, detail=f" Question {i+1} must have at least two options.")
            if any(not opt.option_text.strip() for opt in question.options):
                raise HTTPException(status_code=400, detail=f" Question {i+1} has an empty option.")
            if not any(opt.is_correct for opt in question.options):
                raise HTTPException(status_code=400, detail=f" Question {i+1} must have at least one correct answer.")

        #  Insert into Quiz table
        result = db.execute(text("""
            INSERT INTO Quiz (quiz_title, description, created_by_mentor_id_fk, is_open, start_time)
            VALUES (:quiz_title, :description, :created_by, :is_open, :start_time)
        """), {
            "quiz_title": data.quiz_title.strip(),
            "description": data.description or "",
            "created_by": data.created_by_mentor_id_fk,
            "is_open": data.is_open,
            "start_time": data.start_time or datetime.utcnow()
        })
        db.commit()

        quiz_id = result.lastrowid
        if not quiz_id:
            raise HTTPException(status_code=500, detail=" Could not retrieve quiz ID after insert.")

        #  Insert each question and its options
        for question in data.questions:
            question_result = db.execute(text("""
                INSERT INTO Question (quiz_id_fk, question_text, question_type, points)
                VALUES (:quiz_id_fk, :question_text, :question_type, :points)
            """), {
                "quiz_id_fk": quiz_id,
                "question_text": question.question_text.strip(),
                "question_type": question.question_type,
                "points": question.points
            })
            db.commit()

            question_id = question_result.lastrowid
            if not question_id:
                raise HTTPException(status_code=500, detail=" Could not retrieve question ID.")

            #  Insert options
            for option in question.options:
                db.execute(text("""
                    INSERT INTO QuestionOption (question_id_fk, option_text, is_correct)
                    VALUES (:question_id_fk, :option_text, :is_correct)
                """), {
                    "question_id_fk": question_id,
                    "option_text": option.option_text.strip(),
                    "is_correct": option.is_correct
                })

        db.commit()
        return {"message": " Quiz created successfully."}

    except Exception as e:
        db.rollback()
        print(" QUIZ CREATION ERROR:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f" Failed to create quiz: {str(e)}")


@quiz_router.get("/quiz/{quiz_id}")
def get_quiz_by_id(quiz_id: int, db=Depends(get_db)):
    try:
        quiz = db.execute(text("SELECT * FROM Quiz WHERE quiz_id = :quiz_id"), {"quiz_id": quiz_id}).fetchone()
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found.")

        quiz_data = dict(quiz._mapping)
        quiz_data["questions"] = []

        questions = db.execute(text("SELECT * FROM Question WHERE quiz_id_fk = :quiz_id"), {"quiz_id": quiz_id}).fetchall()

        for question in questions:
            q = dict(question._mapping)
            options = db.execute(text("SELECT * FROM QuestionOption WHERE question_id_fk = :question_id"),
                                 {"question_id": q["question_id"]}).fetchall()
            q["options"] = [dict(option._mapping) for option in options]
            quiz_data["questions"].append(q)

        return quiz_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=f" Failed to fetch quiz: {str(e)}")


# @quiz_router.get("/")
# def get_all_quizzes(db=Depends(get_db)):
#     try:
#         quizzes = db.execute(text("SELECT quiz_id, quiz_title FROM Quiz")).fetchall()
#         return [
#             {
#                 "quiz_id": row._mapping["quiz_id"],
#                 "quiz_title": row._mapping["quiz_title"],
                
#             }
#             for row in quizzes
#         ]
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f" Failed to fetch quizzes: {str(e)}")
    
@quiz_router.get("/")
def get_all_quizzes(db=Depends(get_db)):
    try:
        quizzes = db.execute(text("""
            SELECT quiz_id, quiz_title, description, start_time 
            FROM Quiz
        """)).fetchall()
        return [
            {
                "quiz_id": row.quiz_id,
                "quiz_title": row.quiz_title,
                "description": row.description,
                "start_time": row.start_time
            }
            for row in quizzes
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch quizzes: {str(e)}")



@quiz_router.post("/assign-quiz-to-batch")
def assign_quiz_to_batch(data: QuizAssignmentRequest, db=Depends(get_db)):
    try:
        # ✅ Check if quiz is already assigned to this batch
        existing = db.execute(
            text("""
                SELECT 1 FROM Batch_Assignment 
                WHERE batch_id_fk = :batch_id AND quiz_id_fk = :quiz_id
                LIMIT 1
            """),
            {"batch_id": data.batch_id, "quiz_id": data.quiz_id}
        ).fetchone()

        if existing:
            raise HTTPException(status_code=409, detail="Quiz already assigned to this batch.")

        # ✅ Get students from batch
        students = db.execute(
            text("SELECT student_id FROM BatchStudent WHERE batch_id = :batch_id"),
            {"batch_id": data.batch_id}
        ).fetchall()

        if not students:
            raise HTTPException(status_code=404, detail="No students found in this batch.")

        # ✅ Assign quiz to each student
        for student in students:
            db.execute(
                text("""
                    INSERT INTO Batch_Assignment (batch_id_fk, quiz_id_fk, student_id_fk)
                    VALUES (:batch_id, :quiz_id, :student_id)
                """),
                {
                    "batch_id": data.batch_id,
                    "quiz_id": data.quiz_id,
                    "student_id": student._mapping["student_id"]
                }
            )

        db.commit()
        return {"message": f"✅ Quiz assigned to {len(students)} students."}

    except HTTPException:
        raise  # re-raise FastAPI HTTPExceptions
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to assign quiz: {str(e)}")






# ─── UPDATE QUIZ ────────────────────────────────
@quiz_router.put("/quiz/{quiz_id}")
def update_quiz(quiz_id: int, data: QuizUpdateSchema, db: Session = Depends(get_db)):
    try:
        db.begin()

        # Validate unique questions
        if len(set(q.question_text for q in data.questions)) != len(data.questions):
            raise HTTPException(status_code=400, detail="❌ Duplicate questions found. Ensure all questions are unique.")

        # Update Quiz table
        db.execute(text("""
            UPDATE Quiz
            SET quiz_title = :title,
                description = :desc
            WHERE quiz_id = :quiz_id
        """), {
            "quiz_id": quiz_id,
            "title": data.quiz_title.strip(),
            "desc": data.description or ""
        })

        # Delete old QuestionOptions
        db.execute(text("""
            DELETE FROM QuestionOption
            WHERE question_id_fk IN (
                SELECT question_id FROM Question WHERE quiz_id_fk = :quiz_id
            )
        """), {"quiz_id": quiz_id})

        # Delete old Questions
        db.execute(text("DELETE FROM Question WHERE quiz_id_fk = :quiz_id"), {"quiz_id": quiz_id})

        # Insert new Questions and Options
        for question in data.questions:
            db.execute(text("""
                INSERT INTO Question (quiz_id_fk, question_text, question_type, points)
                VALUES (:quiz_id_fk, :question_text, :question_type, :points)
            """), {
                "quiz_id_fk": quiz_id,
                "question_text": question.question_text.strip(),
                "question_type": question.question_type,
                "points": question.points
            })

            # Get the inserted question_id safely
            question_id = db.execute(text("SELECT LAST_INSERT_ID()")).scalar()

            for option in question.options:
                db.execute(text("""
                    INSERT INTO QuestionOption (question_id_fk, option_text, is_correct)
                    VALUES (:question_id_fk, :option_text, :is_correct)
                """), {
                    "question_id_fk": question_id,
                    "option_text": option.option_text.strip(),
                    "is_correct": option.is_correct
                })

        db.commit()
        return {"message": "✅ Quiz updated successfully."}

    except Exception as e:
        db.rollback()
        print("❌ UPDATE ERROR:", e)
        raise HTTPException(status_code=500, detail="Quiz update failed. Check logs for more info.")




# @quiz_router.put("/quiz/{quiz_id}")
# def update_quiz(quiz_id: int, data: FullQuizCreate, db=Depends(get_db)):
#     existing = db.execute(text("SELECT * FROM Quiz WHERE quiz_id = :quiz_id"), {"quiz_id": quiz_id}).fetchone()
#     if not existing:
#         raise HTTPException(status_code=404, detail="Quiz not found.")

#     if not data.questions:
#         raise HTTPException(status_code=400, detail="Quiz must have at least one question.")

#     try:
#         db.execute(text("""
#             UPDATE Quiz
#             SET quiz_title = :quiz_title,
#                 description = :description,
#                 is_open = :is_open,
#                 start_time = :start_time
#             WHERE quiz_id = :quiz_id
#         """), {
#             "quiz_title": data.quiz_title,
#             "description": data.description or "",
#             "is_open": data.is_open,
#             "start_time": data.start_time or datetime.utcnow(),
#             "quiz_id": quiz_id
#         })
#         db.commit()

#         db.execute(text("DELETE FROM Response WHERE question_id_fk IN (SELECT question_id FROM Question WHERE quiz_id_fk = :quiz_id)"), {"quiz_id": quiz_id})
#         db.execute(text("DELETE FROM QuestionOption WHERE question_id_fk IN (SELECT question_id FROM Question WHERE quiz_id_fk = :quiz_id)"), {"quiz_id": quiz_id})
#         db.execute(text("DELETE FROM Question WHERE quiz_id_fk = :quiz_id"), {"quiz_id": quiz_id})
#         db.commit()

#         for question in data.questions:
#             if not question.question_text or not question.options or len(question.options) < 2:
#                 raise HTTPException(status_code=400, detail="Each question must have text and at least two options.")

#             db.execute(text("""
#                 INSERT INTO Question (quiz_id_fk, question_text, question_type, points)
#                 VALUES (:quiz_id_fk, :question_text, :question_type, :points)
#             """), {
#                 "quiz_id_fk": quiz_id,
#                 "question_text": question.question_text,
#                 "question_type": question.question_type,
#                 "points": question.points,
#             })
#             db.commit()
#             question_id = db.execute(text("SELECT LAST_INSERT_ID()")).scalar()

#             for option in question.options:
#                 db.execute(text("""
#                     INSERT INTO QuestionOption (question_id_fk, option_text, is_correct)
#                     VALUES (:question_id_fk, :option_text, :is_correct)
#                 """), {
#                     "question_id_fk": question_id,
#                     "option_text": option.option_text,
#                     "is_correct": option.is_correct,
#                 })
#         db.commit()

#         return {"message": " Quiz updated successfully."}

#     except Exception as e:
#         db.rollback()
#         print(" UPDATE ERROR:", str(e))  # Add debug log
#         raise HTTPException(status_code=500, detail=f" Failed to update quiz: {str(e)}")


@quiz_router.delete("/quiz/{quiz_id}")
def delete_quiz(quiz_id: int, db=Depends(get_db)):
    quiz = db.execute(text("SELECT * FROM Quiz WHERE quiz_id = :quiz_id"), {"quiz_id": quiz_id}).fetchone()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found.")

    try:
        db.execute(text("DELETE FROM Batch_Assignment WHERE quiz_id_fk = :quiz_id"), {"quiz_id": quiz_id})
        db.execute(text("DELETE FROM Response WHERE question_id_fk IN (SELECT question_id FROM Question WHERE quiz_id_fk = :quiz_id)"), {"quiz_id": quiz_id})
        db.execute(text("DELETE FROM QuestionOption WHERE question_id_fk IN (SELECT question_id FROM Question WHERE quiz_id_fk = :quiz_id)"), {"quiz_id": quiz_id})
        db.execute(text("DELETE FROM Question WHERE quiz_id_fk = :quiz_id"), {"quiz_id": quiz_id})
        db.execute(text("DELETE FROM Quiz WHERE quiz_id = :quiz_id"), {"quiz_id": quiz_id})
        db.commit()

        return {"message": " Quiz deleted successfully."}
    except Exception as e:
        db.rollback()
        print(f" DELETE ERROR: {str(e)}")  # Optional: debug log
        raise HTTPException(status_code=500, detail=f" Failed to delete quiz: {str(e)}")

@quiz_router.get("/assigned-quizzes/{student_id}")
def get_assigned_quizzes_for_student(student_id: int, db=Depends(get_db)):
    try:
        quizzes = db.execute(text("""
            SELECT
                q.quiz_id,
                q.quiz_title,
                q.description,
                q.is_open,
                ba.batch_assignment_id
            FROM Quiz q
            JOIN Batch_Assignment ba ON q.quiz_id = ba.quiz_id_fk
            WHERE ba.student_id_fk = :student_id
        """), {"student_id": student_id}).fetchall()

        quiz_list = []

        for row in quizzes:
            quiz_data = dict(row._mapping)
            attempts = db.execute(text("""
                SELECT attempt_type, score
                FROM Attempt
                WHERE student_id_fk = :student_id
                AND batch_assignment_id = :assignment_id
            """), {
                "student_id": student_id,
                "assignment_id": row._mapping["batch_assignment_id"]
            }).fetchall()

            quiz_data["attempts"] = [dict(a._mapping) for a in attempts]
            quiz_data["attempt_count"] = len(attempts)
            quiz_list.append(quiz_data)

        return quiz_list

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch assigned quizzes: {str(e)}")
    
@quiz_router.get("/assign-quiz-to-batch/batch/{batch_id}")
def get_assigned_quizzes_by_batch(batch_id: int, db: Session = Depends(get_db)):
    try:
        result = db.execute(text("""
            SELECT DISTINCT q.quiz_id, q.quiz_title, q.description, q.start_time
            FROM Batch_Assignment ba
            JOIN Quiz q ON ba.quiz_id_fk = q.quiz_id
            WHERE ba.batch_id_fk = :batch_id
        """), {"batch_id": batch_id}).fetchall()

        quizzes = [
            {
                "quiz_id": row.quiz_id,
                "quiz_title": row.quiz_title,
                "description": row.description,
                "start_time": row.start_time.isoformat() if row.start_time else None
            }
            for row in result
        ]
        return quizzes

    except Exception as e:
        import logging
        logging.exception("Failed to fetch assigned quizzes")
        raise HTTPException(status_code=500, detail="Internal Server Error")



    
@quiz_router.get("/report/{quiz_id}")
def get_quiz_report(quiz_id: int, db: Session = Depends(get_db)):
    try:
        rows = db.execute(text("""
            SELECT 
                q.quiz_title,
                s.name AS student_name,
                COALESCE(t.name, 'Unknown') AS teacher_name,
                c.class AS class_name,
                MAX(CASE WHEN a.attempt_type = 'pre' THEN a.score END) AS pre_score,
                MAX(CASE WHEN a.attempt_type = 'post' THEN a.score END) AS post_score
            FROM student_details s
            JOIN Attempt a ON s.student_details_id_pk = a.student_id_fk
            JOIN Batch_Assignment ba ON ba.batch_assignment_id = a.batch_assignment_id
            JOIN Quiz q ON q.quiz_id = ba.quiz_id_fk
            LEFT JOIN teacher_details t ON q.created_by_mentor_id_fk = t.teacher_details_id_pk
            LEFT JOIN class_details c ON s.class_id_fk = c.class_id_pk
            WHERE q.quiz_id = :quiz_id
            GROUP BY q.quiz_title, s.student_details_id_pk, s.name, t.name, c.class
        """), {"quiz_id": quiz_id}).fetchall()

        return [dict(row._mapping) for row in rows]

    except Exception as e:
        import traceback
        print("Error fetching quiz report:")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to fetch quiz report: {str(e)}")



@quiz_router.post("/attempt")
def attempt_quiz(payload: dict = Body(...), db: Session = Depends(get_db)):
    try:
        student_id = payload.get("student_id")
        quiz_id = payload.get("quiz_id")
        responses = payload.get("responses", [])
        score = payload.get("score", 0)

        if not all([student_id, quiz_id, responses]):
            raise HTTPException(status_code=400, detail=" Missing required fields")

        #  Step 1: Verify quiz assignment
        assignment = db.execute(text("""
            SELECT batch_assignment_id FROM Batch_Assignment
            WHERE student_id_fk = :student_id AND quiz_id_fk = :quiz_id
        """), {"student_id": student_id, "quiz_id": quiz_id}).fetchone()

        if not assignment:
            raise HTTPException(status_code=403, detail=" Student not assigned to this quiz")

        batch_assignment_id = assignment[0]

        #  Step 2: Check previous attempts
        attempt_count = db.execute(text("""
            SELECT COUNT(*) FROM Attempt
            WHERE student_id_fk = :student_id AND batch_assignment_id = :batch_assignment_id
        """), {
            "student_id": student_id,
            "batch_assignment_id": batch_assignment_id
        }).scalar()

        if attempt_count >= 2:
            raise HTTPException(status_code=403, detail=" Max 2 attempts (pre + post) already submitted")

        attempt_number = attempt_count + 1
        attempt_type = "pre" if attempt_number == 1 else "post"

        #  Step 3: Insert into Attempt (REMOVE quiz_id_fk)
        db.execute(text("""
            INSERT INTO Attempt (
                batch_assignment_id, student_id_fk, attempt_date,
                attempt_type, attempt_number, score
            ) VALUES (
                :batch_assignment_id, :student_id_fk, :attempt_date,
                :attempt_type, :attempt_number, :score
            )
        """), {
            "batch_assignment_id": batch_assignment_id,
            "student_id_fk": student_id,
            "attempt_date": datetime.utcnow(),
            "attempt_type": attempt_type,
            "attempt_number": attempt_number,
            "score": score
        })

        attempt_id = db.execute(text("SELECT LAST_INSERT_ID()")).scalar()

        #  Step 4: Insert all responses
        for response in responses:
            question_id = response.get("question_id")
            response_text = response.get("response_text")

            if question_id is None or response_text is None:
                continue

            db.execute(text("""
                INSERT INTO Response (attempt_id_fk, question_id_fk, response_text)
                VALUES (:attempt_id, :question_id, :response_text)
            """), {
                "attempt_id": attempt_id,
                "question_id": int(question_id),
                "response_text": str(response_text)
            })

        db.commit()

        return {
            "message": f" {attempt_type.upper()} attempt recorded",
            "attempt_type": attempt_type,
            "attempt_number": attempt_number,
            "score": score
        }

    except Exception as e:
        db.rollback()
        print(" QUIZ ATTEMPT ERROR:", e)
        raise HTTPException(status_code=500, detail=f" Failed to record quiz attempt: {str(e)}")


@quiz_router.get("/attempts/{quiz_id}")
def get_attempts_by_quiz(quiz_id: int, student_id: int, db=Depends(get_db)):
    """
    Fetches the pre and post attempt scores made by a student for a specific quiz.
    This joins via Batch_Assignment since Attempt table does not directly contain quiz_id.
    """
    try:
        attempts = db.execute(text("""
            SELECT a.attempt_type, a.score
            FROM Attempt a
            JOIN Batch_Assignment ba ON a.batch_assignment_id = ba.batch_assignment_id
            WHERE ba.quiz_id_fk = :quiz_id AND a.student_id_fk = :student_id
        """), {"student_id": student_id, "quiz_id": quiz_id}).fetchall()

        attempts_data = {
            "pre_score": None,
            "post_score": None
        }

        for attempt in attempts:
            if attempt["attempt_type"] == "pre":
                attempts_data["pre_score"] = attempt["score"]
            elif attempt["attempt_type"] == "post":
                attempts_data["post_score"] = attempt["score"]

        return attempts_data

    except Exception as e:
        print(" Error fetching attempts:", str(e))
        raise HTTPException(status_code=500, detail=f"Failed to fetch attempts: {str(e)}")


   
@quiz_router.get("/attempt/count")
def get_attempt_count(quiz_id: int, student_id: int, db=Depends(get_db)):
    """
    Returns the number of attempts a student has made for a specific quiz.
    """
    try:
        result = db.execute(text("""
            SELECT COUNT(*) AS attempt_count 
            FROM Attempt
            WHERE student_id_fk = :student_id 
              AND batch_assignment_id IN (
                  SELECT batch_assignment_id 
                  FROM Batch_Assignment 
                  WHERE student_id_fk = :student_id 
                  AND quiz_id_fk = :quiz_id
              ) AND attempt_type ='post'
        """), {"student_id": student_id, "quiz_id": quiz_id}).fetchone()

        # Handle case if no result is returned
        attempt_count = result._mapping["attempt_count"] if result else 0
        
        return {"attempt_count": attempt_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching attempt count: {str(e)}")



badge_router = APIRouter(prefix="/student/badges", tags=["Badges"])

# Badgr Access Token
BADGR_ACCESS_TOKEN = "w7sgNQ0v3q1q3ma41Z001e5L46IK0v"

@badge_router.get("/{student_email}")
def get_student_badges(student_email: str):
    try:
        # 1 Prepare URL
        url = f"https://api.badgr.io/v2/backpack/assertions?recipient_email={student_email}"

        headers = {
            "Authorization": f"Bearer {BADGR_ACCESS_TOKEN}",
            "Accept": "application/json"
        }

        # 2 Call Badgr API
        response = requests.get(url, headers=headers)

        # 3 Print logs for debugging
        print(" Badgr API status:", response.status_code)
        print(" Badgr API response:", response.text)

        # 4 Error handling
        if response.status_code == 401:
            raise HTTPException(status_code=401, detail="Unauthorized - Badgr token invalid or expired")

        if response.status_code == 403:
            raise HTTPException(status_code=403, detail="Forbidden - Badgr API access denied")

        if response.status_code == 404:
            raise HTTPException(status_code=404, detail="No badges found for this email")

        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=f"Error from Badgr API: {response.text}")

        # 5 Return response as JSON
        return response.json()

    except Exception as e:
        print(" Exception while fetching badges:", str(e))
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    

project_router = APIRouter(prefix="/api/projects", tags=["Projects"])

UPLOAD_DIR = "static/uploads/projects"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@project_router.post("/upload-project")
async def upload_project(
    student_id_fk: int = Form(...),
    school_id_fk: int = Form(...),
    class_id_fk: int = Form(...),
    section_id_fk: int = Form(...),
    topic_id_fk: int = Form(...),
    other_topic: str = Form(""),
    project_title: str = Form(...),
    project_details: str = Form(...),
    subject_id_fk: int = Form(...),
    project_language: str = Form(...),
    file_type_id_fk: int = Form(...),
    project_month: str = Form(...),
    project_year: str = Form(...),
    uploaded_by_user_id: int = Form(...),
    uploaded_by_user_type: int = Form(...),
    project_file: UploadFile = File(...),
    project_thumbnail: UploadFile = File(None),
    db: Session = Depends(get_db),
):
    try:
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        file_location = f"{UPLOAD_DIR}/{timestamp}_{project_file.filename}"
        with open(file_location, "wb") as f:
            f.write(await project_file.read())

        thumbnail_path = None
        if project_thumbnail:
            thumb_location = f"{UPLOAD_DIR}/{timestamp}_{project_thumbnail.filename}"
            with open(thumb_location, "wb") as f:
                f.write(await project_thumbnail.read())
            thumbnail_path = thumb_location

        db.execute(text("""
            INSERT INTO projects (
                student_id_fk, school_id_fk, class_id_fk, section_id_fk, topic_id_fk, other_topic,
                project_title, project_details, subject_id_fk, project_language, project_file_path,
                project_thumbnail, file_type_id_fk, project_month, project_year,
                uploaded_by_user_id, uploaded_by_user_type, upload_date, verify_status,
                project_rating, project_remarks, active_status
            ) VALUES (
                :student_id_fk, :school_id_fk, :class_id_fk, :section_id_fk, :topic_id_fk, :other_topic,
                :project_title, :project_details, :subject_id_fk, :project_language, :project_file_path,
                :project_thumbnail, :file_type_id_fk, :project_month, :project_year,
                :uploaded_by_user_id, :uploaded_by_user_type, CURDATE(), 'P',
                '', '', 'A'
            )
        """), {
            "student_id_fk": student_id_fk,
            "school_id_fk": school_id_fk,
            "class_id_fk": class_id_fk,
            "section_id_fk": section_id_fk,
            "topic_id_fk": topic_id_fk,
            "other_topic": other_topic,
            "project_title": project_title,
            "project_details": project_details,
            "subject_id_fk": subject_id_fk,
            "project_language": project_language,
            "project_file_path": file_location,
            "project_thumbnail": thumbnail_path,
            "file_type_id_fk": file_type_id_fk,
            "project_month": project_month,
            "project_year": project_year,
            "uploaded_by_user_id": uploaded_by_user_id,
            "uploaded_by_user_type": uploaded_by_user_type,
        })

        db.commit()
        return {"message": " Project uploaded successfully."}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f" Error uploading project: {str(e)}")
    
@project_router.get("/count/{student_id}")
def get_project_count(student_id: int, db: Session = Depends(get_db)):
    try:
        result = db.execute(text("""
            SELECT COUNT(*) AS count 
            FROM projects 
            WHERE student_id_fk = :student_id AND active_status != 'D'
        """), {"student_id": student_id}).fetchone()
        return {"count": result._mapping["count"] if result else 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to count projects: {str(e)}")


@project_router.get("/languages")
def get_languages(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT language_id_pk, language FROM project_language WHERE active_status = 'A'"))
    return [{"id": row.language_id_pk, "label": row.language} for row in result]


@project_router.get("/topics")
def get_topics(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT topic_id_pk, topic FROM topics WHERE active_status = 'A'"))
    return [{"id": row.topic_id_pk, "label": row.topic} for row in result]

@project_router.get("/file-types")
def get_file_types(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT file_type_id_pk, file_type FROM file_type WHERE active_status = 'A'"))
    return [{"id": row.file_type_id_pk, "label": row.file_type} for row in result]

@project_router.get("/subjects")
def get_subjects(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT subject_id_pk, subject_name FROM subject_details WHERE active_status = 'A'"))
    return [{"id": row.subject_id_pk, "label": row.subject_name} for row in result]

@quiz_router.get("/quiz-data")
def get_quiz_data(db: Session = Depends(get_db)):
    try:
        rows = db.execute(text("SELECT * FROM quiz_data")).fetchall()
        return [dict(row._mapping) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch quiz data: {str(e)}")


