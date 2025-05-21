from fastapi import APIRouter, HTTPException, Depends
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
        db.execute(text("""
            INSERT INTO Quiz (quiz_title, description, created_by_mentor_id_fk, is_open, start_time)
            VALUES (:quiz_title, :description, :created_by, :is_open, :start_time)
        """), {
            "quiz_title": data.quiz_title,
            "description": data.description,
            "created_by": data.created_by_mentor_id_fk,
            "is_open": data.is_open,
            "start_time": data.start_time or datetime.utcnow()
        })
        db.commit()

        quiz_id = db.execute(text("SELECT LAST_INSERT_ID()")).scalar()

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

# @router.get("/quizzes")
# def get_all_quizzes(db=Depends(get_db)):
#     try:
#         quizzes = db.execute(text("SELECT * FROM Quiz")).fetchall()
#         return [dict(quiz._mapping) for quiz in quizzes]
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"❌ Failed to fetch quizzes: {str(e)}")


@public_router.get("/quizzes", tags=["Public Quizzes"])
def public_quiz_list(db=Depends(get_db)):
    try:
        quizzes = db.execute(text("SELECT quiz_id, quiz_title FROM Quiz")).fetchall()
        return [
            {"quiz_id": row._mapping["quiz_id"], "quiz_title": row._mapping["quiz_title"]}
            for row in quizzes
        ]
    except Exception as e:
        print("❌ Error in public_quiz_list:", str(e))
        raise HTTPException(status_code=500, detail=f"❌ Failed to fetch public quizzes: {str(e)}")

@quiz_router.get("/assigned-quizzes/{student_id}")
def get_assigned_quizzes_for_student(student_id: int, db=Depends(get_db)):
    try:
        result = db.execute(text("""
            SELECT q.quiz_id, q.quiz_title, q.description
            FROM Quiz q
            JOIN Batch_Assignment ba ON q.quiz_id = ba.quiz_id_fk
            WHERE ba.student_id_fk = :student_id
        """), {"student_id": student_id}).fetchall()

        return [dict(row._mapping) for row in result]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"❌ Failed to fetch assigned quizzes: {str(e)}")


@quiz_router.get("/")
def get_all_quizzes(db=Depends(get_db)):
    try:
        quizzes = db.execute(text("SELECT quiz_id, quiz_title FROM Quiz")).fetchall()
        return [
            {
                "quiz_id": row._mapping["quiz_id"],     # ✅ exact field names
                "quiz_title": row._mapping["quiz_title"]
            }
            for row in quizzes
        ]
    except Exception as e:
        print("❌ Error in get_all_quizzes:", str(e))
        raise HTTPException(status_code=500, detail=f"❌ Failed to fetch quizzes: {str(e)}")
    




@quiz_router.put("/quiz/{quiz_id}")
def update_quiz(quiz_id: int, data: FullQuizCreate, db=Depends(get_db)):
    existing = db.execute(text("SELECT * FROM Quiz WHERE quiz_id = :quiz_id"), {"quiz_id": quiz_id}).fetchone()
    if not existing:
        raise HTTPException(status_code=404, detail="Quiz not found.")

    try:
        db.execute(text("""
            UPDATE Quiz
            SET quiz_title = :quiz_title, description = :description, is_open = :is_open, start_time = :start_time
            WHERE quiz_id = :quiz_id
        """), {
            "quiz_title": data.quiz_title,
            "description": data.description,
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
        raise HTTPException(status_code=500, detail=f"❌ Failed to update quiz: {str(e)}")


@quiz_router.delete("/quiz/{quiz_id}")
def delete_quiz(quiz_id: int, db=Depends(get_db)):
    quiz = db.execute(text("SELECT * FROM Quiz WHERE quiz_id = :quiz_id"), {"quiz_id": quiz_id}).fetchone()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found.")

    try:
        db.execute(text("DELETE FROM Response WHERE question_id_fk IN (SELECT question_id FROM Question WHERE quiz_id_fk = :quiz_id)"), {"quiz_id": quiz_id})
        db.execute(text("DELETE FROM QuestionOption WHERE question_id_fk IN (SELECT question_id FROM Question WHERE quiz_id_fk = :quiz_id)"), {"quiz_id": quiz_id})
        db.execute(text("DELETE FROM Question WHERE quiz_id_fk = :quiz_id"), {"quiz_id": quiz_id})
        db.execute(text("DELETE FROM Quiz WHERE quiz_id = :quiz_id"), {"quiz_id": quiz_id})
        db.commit()

        return {"message": "✅ Quiz deleted successfully."}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"❌ Failed to delete quiz: {str(e)}")


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
        print("❌ Error assigning quiz to batch:", str(e))
        raise HTTPException(status_code=500, detail=f"❌ Failed to assign quiz: {str(e)}")











# from fastapi import APIRouter, HTTPException, Depends ,Query
# from sqlalchemy import text
# from typing import List, Optional
# from pydantic import BaseModel
# from datetime import datetime
# from db.database import get_db

# router = APIRouter()

# quiz_router = APIRouter(prefix="/api/quizzes", tags=["Quizzes"])


# # === Pydantic Models ===

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
#     description: Optional[str] = None
#     created_by_mentor_id_fk: int
#     is_open: bool = True
#     start_time: Optional[datetime] = None

# class FullQuizCreate(QuizCreate):
#     questions: List[QuestionCreate]

# class QuizAssignmentRequest(BaseModel):
#     quiz_id: int
#     batch_id: int

# class QuizOut(BaseModel):
#     quiz_id: int
#     quiz_title: str
#     description: str
#     created_by_mentor_id_fk: int
#     is_open: bool
#     start_time: datetime 
# # === Routes ===

# @router.post("/quiz")
# def create_quiz(data: FullQuizCreate, db=Depends(get_db)):
#     try:
#         # Insert quiz data
#         insert_quiz = text("""
#             INSERT INTO Quiz (quiz_title, description, created_by_mentor_id_fk, is_open, start_time)
#             VALUES (:quiz_title, :description, :created_by_mentor_id_fk, :is_open, :start_time)
#         """)
#         db.execute(insert_quiz, {
#             "quiz_title": data.quiz_title,
#             "description": data.description,
#             "created_by_mentor_id_fk": data.created_by_mentor_id_fk,
#             "is_open": data.is_open,
#             "start_time": data.start_time or datetime.utcnow(),
#         })
#         db.commit()

#         # Get the last inserted quiz ID
#         quiz_id = db.execute(text("SELECT LAST_INSERT_ID()")).fetchone()[0]

#         # Insert questions
#         for question in data.questions:
#             insert_question = text("""
#                 INSERT INTO Question (quiz_id_fk, question_text, question_type, points)
#                 VALUES (:quiz_id_fk, :question_text, :question_type, :points)
#             """)
#             db.execute(insert_question, {
#                 "quiz_id_fk": quiz_id,
#                 "question_text": question.question_text,
#                 "question_type": question.question_type,
#                 "points": question.points,
#             })
#             db.commit()

#             # Get the last inserted question ID
#             question_id = db.execute(text("SELECT LAST_INSERT_ID()")).fetchone()[0]

#             # Insert options
#             for option in question.options:
#                 insert_option = text("""
#                     INSERT INTO QuestionOption (question_id_fk, option_text, is_correct)
#                     VALUES (:question_id_fk, :option_text, :is_correct)
#                 """)
#                 db.execute(insert_option, {
#                     "question_id_fk": question_id,
#                     "option_text": option.option_text,
#                     "is_correct": option.is_correct,
#                 })
#             db.commit()

#         return {"message": "✅ Quiz created successfully."}

#     except Exception as e:
#         db.rollback()
#         raise HTTPException(status_code=500, detail=f"❌ Failed to create quiz: {str(e)}")

# @router.get("/quiz/{quiz_id}")
# def get_quiz_by_id(quiz_id: int, db=Depends(get_db)):
#     try:
#         quiz = db.execute(text("SELECT * FROM Quiz WHERE quiz_id = :quiz_id"), {"quiz_id": quiz_id}).fetchone()
#         if not quiz:
#             raise HTTPException(status_code=404, detail="Quiz not found.")

#         quiz_data = dict(quiz._mapping)
#         quiz_data["questions"] = []

#         questions = db.execute(text("SELECT * FROM Question WHERE quiz_id_fk = :quiz_id"), {"quiz_id": quiz_id}).fetchall()

#         for question in questions:
#             q = dict(question._mapping)
#             options = db.execute(text("SELECT * FROM QuestionOption WHERE question_id_fk = :question_id"),
#                                  {"question_id": q["question_id"]}).fetchall()
#             q["options"] = [dict(option._mapping) for option in options]
#             quiz_data["questions"].append(q)

#         return quiz_data

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"❌ Failed to fetch quiz: {str(e)}")


# @router.put("/quiz/{quiz_id}")
# def update_quiz(quiz_id: int, data: FullQuizCreate, db=Depends(get_db)):
#     existing = db.execute(text("SELECT * FROM Quiz WHERE quiz_id = :quiz_id"), {"quiz_id": quiz_id}).fetchone()
#     if not existing:
#         raise HTTPException(status_code=404, detail="Quiz not found.")

#     try:
#         # Update quiz
#         db.execute(text("""
#             UPDATE Quiz
#             SET quiz_title = :quiz_title, description = :description, is_open = :is_open, start_time = :start_time
#             WHERE quiz_id = :quiz_id
#         """), {
#             "quiz_title": data.quiz_title,
#             "description": data.description,
#             "is_open": data.is_open,
#             "start_time": data.start_time or datetime.utcnow(),
#             "quiz_id": quiz_id
#         })
#         db.commit()

#         # Delete previous question-related data
#         db.execute(text("DELETE FROM Response WHERE question_id_fk IN (SELECT question_id FROM Question WHERE quiz_id_fk = :quiz_id)"), {"quiz_id": quiz_id})
#         db.execute(text("DELETE FROM QuestionOption WHERE question_id_fk IN (SELECT question_id FROM Question WHERE quiz_id_fk = :quiz_id)"), {"quiz_id": quiz_id})
#         db.execute(text("DELETE FROM Question WHERE quiz_id_fk = :quiz_id"), {"quiz_id": quiz_id})
#         db.commit()

#         # Re-insert questions and options
#         for question in data.questions:
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

#             question_id = db.execute(text("SELECT LAST_INSERT_ID()")).fetchone()[0]

#             for option in question.options:
#                 db.execute(text("""
#                     INSERT INTO QuestionOption (question_id_fk, option_text, is_correct)
#                     VALUES (:question_id_fk, :option_text, :is_correct)
#                 """), {
#                     "question_id_fk": question_id,
#                     "option_text": option.option_text,
#                     "is_correct": option.is_correct,
#                 })
#             db.commit()

#         return {"message": "✅ Quiz updated successfully."}

#     except Exception as e:
#         db.rollback()
#         raise HTTPException(status_code=500, detail=f"❌ Failed to update quiz: {str(e)}")
    
# @router.get("/quizzes")
# def get_all_quizzes(db=Depends(get_db)):
#     try:
#         quizzes = db.execute(text("SELECT * FROM Quiz")).fetchall()
#         return [dict(quiz._mapping) for quiz in quizzes]
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"❌ Failed to fetch quizzes: {str(e)}")


# @router.delete("/quiz/{quiz_id}")
# def delete_quiz(quiz_id: int, db=Depends(get_db)):
#     quiz = db.execute(text("SELECT * FROM Quiz WHERE quiz_id = :quiz_id"), {"quiz_id": quiz_id}).fetchone()
#     if not quiz:
#         raise HTTPException(status_code=404, detail="Quiz not found.")

#     try:
#         db.execute(text("DELETE FROM Response WHERE question_id_fk IN (SELECT question_id FROM Question WHERE quiz_id_fk = :quiz_id)"), {"quiz_id": quiz_id})
#         db.execute(text("DELETE FROM QuestionOption WHERE question_id_fk IN (SELECT question_id FROM Question WHERE quiz_id_fk = :quiz_id)"), {"quiz_id": quiz_id})
#         db.execute(text("DELETE FROM Question WHERE quiz_id_fk = :quiz_id"), {"quiz_id": quiz_id})
#         db.execute(text("DELETE FROM Quiz WHERE quiz_id = :quiz_id"), {"quiz_id": quiz_id})
#         db.commit()

#         return {"message": "✅ Quiz deleted successfully."}

#     except Exception as e:
#         db.rollback()
#         raise HTTPException(status_code=500, detail=f"❌ Failed to delete quiz: {str(e)}")
    
# @quiz_router.get("/", tags=["Quizzes"])
# def get_all_quizzes(db=Depends(get_db)):
#     try:
#         quizzes = db.execute(text("SELECT quiz_id, quiz_title FROM Quiz")).fetchall()
#         return [
#             {
#                 "value": quiz["quiz_id"],   # value used in frontend <Select>
#                 "label": quiz["quiz_title"] # label shown in dropdown
#             } for quiz in quizzes
#         ]
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"❌ Failed to fetch quizzes: {str(e)}")



# @router.post("/assign-quiz-to-batch")
# def assign_quiz_to_batch(data: QuizAssignmentRequest, db=Depends(get_db)):
#     try:
#         # Fetch all students for the given batch
#         students = db.execute(
#             text("SELECT student_id FROM BatchStudent WHERE batch_id = :batch_id"),
#             {"batch_id": data.batch_id}
#         ).fetchall()

#         # If no students are found in the batch
#         if not students:
#             raise HTTPException(status_code=404, detail="No students found in this batch.")

#         # Fetch the batch name to return in the response
#         batch_row = db.execute(
#             text("SELECT batch_name FROM Batch WHERE batch_id = :batch_id"),
#             {"batch_id": data.batch_id}
#         ).fetchone()

#         if not batch_row:
#             raise HTTPException(status_code=404, detail="Batch not found.")

#         batch_name = batch_row['batch_name']

#         # Insert records into Batch_Assignment for each student
#         for student in students:
#             db.execute(
#                 text("""
#                     INSERT INTO Batch_Assignment (batch_id_fk, quiz_id_fk, student_id_fk)
#                     VALUES (:batch_id, :quiz_id, :student_id)
#                 """),
#                 {
#                     "batch_id": data.batch_id,
#                     "quiz_id": data.quiz_id,
#                     "student_id": student['student_id']
#                 }
#             )
        
#         db.commit()  # Commit the changes

#         return {"message": f"✅ Quiz assigned to {len(students)} students in batch '{batch_name}'."}

#     except Exception as e:
#         db.rollback()  # Rollback in case of error
#         raise HTTPException(status_code=500, detail=f"❌ Failed to assign quiz: {str(e)}")
     
