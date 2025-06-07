from fastapi import APIRouter, HTTPException, Depends, Body
from sqlalchemy import text
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from db.database import get_db

quiz_router = APIRouter(prefix="/api/quizzes", tags=["Quizzes"])
public_router = APIRouter()

# === Pydantic Models ===
class OptionCreate(BaseModel):
    option_text: str
    is_correct: bool

class QuestionCreate(BaseModel):
    question_text: str
    question_type: str
    points: int
    options: List[OptionCreate]

class QuizCreate(BaseModel):
    quiz_title: str
    description: Optional[str] = None
    created_by_mentor_id_fk: int
    is_open: bool = True
    start_time: Optional[datetime] = None

class FullQuizCreate(QuizCreate):
    questions: List[QuestionCreate]

class QuizAssignmentRequest(BaseModel):
    quiz_id: int
    batch_id: int

# === ROUTES ===

@quiz_router.post("/quiz")
def create_quiz(data: FullQuizCreate, db=Depends(get_db)):
    try:
        # Insert Quiz
        db.execute(text("""
            INSERT INTO Quiz (quiz_title, description, created_by_mentor_id_fk, is_open, start_time)
            VALUES (:quiz_title, :description, :created_by, :is_open, :start_time)
        """), {
            "quiz_title": data.quiz_title,
            "description": data.description or "",
            "created_by": data.created_by_mentor_id_fk,
            "is_open": data.is_open,
            "start_time": data.start_time or datetime.utcnow()
        })
        db.commit()

        quiz_id = db.execute(text("SELECT LAST_INSERT_ID()")).scalar()
        if not quiz_id:
            raise HTTPException(status_code=500, detail="❌ Could not retrieve quiz ID after insert.")

        # Insert Questions
        for question in data.questions:
            db.execute(text("""
                INSERT INTO Question (quiz_id_fk, question_text, question_type, points)
                VALUES (:quiz_id_fk, :question_text, :question_type, :points)
            """), {
                "quiz_id_fk": quiz_id,
                "question_text": question.question_text,
                "question_type": question.question_type,
                "points": question.points
            })
            db.commit()

            question_id = db.execute(text("SELECT LAST_INSERT_ID()")).scalar()
            if not question_id:
                raise HTTPException(status_code=500, detail="❌ Could not retrieve question ID.")

            # Insert Options
            for option in question.options:
                db.execute(text("""
                    INSERT INTO QuestionOption (question_id_fk, option_text, is_correct)
                    VALUES (:question_id_fk, :option_text, :is_correct)
                """), {
                    "question_id_fk": question_id,
                    "option_text": option.option_text,
                    "is_correct": option.is_correct
                })

        db.commit()
        return {"message": "✅ Quiz created successfully."}

    except Exception as e:
        db.rollback()
        import traceback
        print("❌ QUIZ CREATION ERROR:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"❌ Failed to create quiz: {str(e)}")


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
        raise HTTPException(status_code=500, detail=f"❌ Failed to fetch quiz: {str(e)}")


@quiz_router.get("/")
def get_all_quizzes(db=Depends(get_db)):
    try:
        quizzes = db.execute(text("SELECT quiz_id, quiz_title FROM Quiz")).fetchall()
        return [
            {
                "quiz_id": row._mapping["quiz_id"],
                "quiz_title": row._mapping["quiz_title"]
            }
            for row in quizzes
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"❌ Failed to fetch quizzes: {str(e)}")
    
@quiz_router.post("/assign-quiz-to-batch")
def assign_quiz_to_batch(data: QuizAssignmentRequest, db=Depends(get_db)):
    try:
        students = db.execute(
            text("SELECT student_id FROM BatchStudent WHERE batch_id = :batch_id"),
            {"batch_id": data.batch_id}
        ).fetchall()

        if not students:
            raise HTTPException(status_code=404, detail="No students found in this batch.")

        batch_row = db.execute(
            text("SELECT batch_name FROM Batch WHERE batch_id = :batch_id"),
            {"batch_id": data.batch_id}
        ).fetchone()

        if not batch_row:
            raise HTTPException(status_code=404, detail="Batch not found.")

        batch_name = batch_row._mapping["batch_name"]

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

        return {"message": f"✅ Quiz assigned to {len(students)} students in batch '{batch_name}'."}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"❌ Failed to assign quiz: {str(e)}")



@quiz_router.put("/quiz/{quiz_id}")
def update_quiz(quiz_id: int, data: FullQuizCreate, db=Depends(get_db)):
    existing = db.execute(text("SELECT * FROM Quiz WHERE quiz_id = :quiz_id"), {"quiz_id": quiz_id}).fetchone()
    if not existing:
        raise HTTPException(status_code=404, detail="Quiz not found.")

    if not data.questions:
        raise HTTPException(status_code=400, detail="Quiz must have at least one question.")

    try:
        db.execute(text("""
            UPDATE Quiz
            SET quiz_title = :quiz_title,
                description = :description,
                is_open = :is_open,
                start_time = :start_time
            WHERE quiz_id = :quiz_id
        """), {
            "quiz_title": data.quiz_title,
            "description": data.description or "",
            "is_open": data.is_open,
            "start_time": data.start_time or datetime.utcnow(),
            "quiz_id": quiz_id
        })
        db.commit()

        db.execute(text("DELETE FROM Response WHERE question_id_fk IN (SELECT question_id FROM Question WHERE quiz_id_fk = :quiz_id)"), {"quiz_id": quiz_id})
        db.execute(text("DELETE FROM QuestionOption WHERE question_id_fk IN (SELECT question_id FROM Question WHERE quiz_id_fk = :quiz_id)"), {"quiz_id": quiz_id})
        db.execute(text("DELETE FROM Question WHERE quiz_id_fk = :quiz_id"), {"quiz_id": quiz_id})
        db.commit()

        for question in data.questions:
            if not question.question_text or not question.options or len(question.options) < 2:
                raise HTTPException(status_code=400, detail="Each question must have text and at least two options.")

            db.execute(text("""
                INSERT INTO Question (quiz_id_fk, question_text, question_type, points)
                VALUES (:quiz_id_fk, :question_text, :question_type, :points)
            """), {
                "quiz_id_fk": quiz_id,
                "question_text": question.question_text,
                "question_type": question.question_type,
                "points": question.points,
            })
            db.commit()
            question_id = db.execute(text("SELECT LAST_INSERT_ID()")).scalar()

            for option in question.options:
                db.execute(text("""
                    INSERT INTO QuestionOption (question_id_fk, option_text, is_correct)
                    VALUES (:question_id_fk, :option_text, :is_correct)
                """), {
                    "question_id_fk": question_id,
                    "option_text": option.option_text,
                    "is_correct": option.is_correct,
                })
        db.commit()

        return {"message": "✅ Quiz updated successfully."}

    except Exception as e:
        db.rollback()
        print("❌ UPDATE ERROR:", str(e))  # Add debug log
        raise HTTPException(status_code=500, detail=f"❌ Failed to update quiz: {str(e)}")


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

        return {"message": "✅ Quiz deleted successfully."}
    except Exception as e:
        db.rollback()
        print(f"❌ DELETE ERROR: {str(e)}")  # Optional: debug log
        raise HTTPException(status_code=500, detail=f"❌ Failed to delete quiz: {str(e)}")

@quiz_router.get("/assigned-quizzes/{student_id}")
def get_assigned_quizzes_for_student(student_id: int, db=Depends(get_db)):
    try:
        result = db.execute(text("""
            SELECT 
                q.quiz_id, 
                q.quiz_title, 
                q.description, 
                q.is_open,
                (
                    SELECT COUNT(*) 
                    FROM Attempt a
                    JOIN Batch_Assignment ba2 ON a.batch_assignment_id = ba2.batch_assignment_id
                    WHERE ba2.quiz_id_fk = q.quiz_id 
                      AND a.student_id_fk = :student_id
                ) AS attempt_count
            FROM Quiz q
            JOIN Batch_Assignment ba ON q.quiz_id = ba.quiz_id_fk
            WHERE ba.student_id_fk = :student_id
        """), {"student_id": student_id}).fetchall()

        return [dict(row._mapping) for row in result]

    except Exception as e:
        import traceback
        print("❌ ERROR in assigned-quizzes:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"❌ Failed to fetch assigned quizzes: {str(e)}")


# New route to record attempt
@quiz_router.post("/attempt")
def attempt_quiz(payload: dict = Body(...), db=Depends(get_db)):
    """
    Records a new Attempt row for a given student + quiz.
    The first attempt is "pre", and the second attempt is "post".
    After the second attempt, no more attempts are allowed.
    """
    try:
        student_id = payload.get("student_id")
        quiz_id = payload.get("quiz_id")
        
        if not student_id or not quiz_id:
            raise HTTPException(status_code=400, detail="Invalid input")

        # 1) Fetch the assignment to ensure the student really has this quiz assigned
        assignment = db.execute(text("""
            SELECT batch_assignment_id 
            FROM Batch_Assignment
            WHERE student_id_fk = :student_id 
              AND quiz_id_fk = :quiz_id
        """), {"student_id": student_id, "quiz_id": quiz_id}).fetchone()

        if not assignment:
            raise HTTPException(status_code=403, detail="Quiz not assigned to this student")

        assignment_id = assignment._mapping["batch_assignment_id"]

        # 2) Check how many attempts the student has already made for this quiz
        attempt_check = db.execute(text("""
            SELECT COUNT(*) AS attempt_count 
            FROM Attempt
            WHERE student_id_fk = :student_id 
              AND batch_assignment_id = :assignment_id
        """), {"student_id": student_id, "assignment_id": assignment_id}).fetchone()

        current_attempt_count = attempt_check._mapping["attempt_count"] if attempt_check else 0

        # 3) If the student has already made 2 attempts, block further attempts
        if current_attempt_count >= 2:
            raise HTTPException(status_code=403, detail="❌ Maximum 2 attempts reached. No more attempts allowed.")

        # 4) Determine the attempt type: 'pre' for first attempt, 'post' for second attempt
        next_attempt_type = "pre" if current_attempt_count == 0 else "post"

        # 5) Insert the new attempt with the next attempt_number
        next_attempt_number = current_attempt_count + 1

        db.execute(text("""
            INSERT INTO Attempt 
                (batch_assignment_id, student_id_fk, attempt_type, attempt_date, attempt_number)
            VALUES 
                (:assignment_id, :student_id, :attempt_type, NOW(), :attempt_number)
        """), {
            "assignment_id": assignment_id,
            "student_id": student_id,
            "attempt_type": next_attempt_type,
            "attempt_number": next_attempt_number
        })

        db.commit()

        return {
            "attempt_number": next_attempt_number,
            "attempt_type": next_attempt_type,
            "message": f"✅ Attempt #{next_attempt_number} recorded as '{next_attempt_type}'."
        }

    except IntegrityError as e:
        db.rollback()
        print(f"❌ IntegrityError: {str(e)}")
        raise HTTPException(status_code=400, detail="❌ Attempt already recorded for this quiz.")
    except Exception as e:
        db.rollback()
        print(f"❌ ERROR in /attempt: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error recording attempt: {str(e)}")

   
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
              )
        """), {"student_id": student_id, "quiz_id": quiz_id}).fetchone()

        # Handle case if no result is returned
        attempt_count = result._mapping["attempt_count"] if result else 0
        
        return {"attempt_count": attempt_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching attempt count: {str(e)}")


