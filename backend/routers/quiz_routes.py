from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import text
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from db.database import get_db

router = APIRouter()

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

# === Routes ===

@router.post("/quiz")
def create_quiz(data: FullQuizCreate, db=Depends(get_db)):
    try:
        insert_quiz = text("""
            INSERT INTO Quiz (quiz_title, description, created_by_mentor_id_fk, is_open, start_time)
            VALUES (:quiz_title, :description, :created_by_mentor_id_fk, :is_open, :start_time)
        """)
        db.execute(insert_quiz, {
            "quiz_title": data.quiz_title,
            "description": data.description,
            "created_by_mentor_id_fk": data.created_by_mentor_id_fk,
            "is_open": data.is_open,
            "start_time": data.start_time or datetime.utcnow(),
        })
        db.commit()

        quiz_id = db.execute(text("SELECT LAST_INSERT_ID()")).fetchone()[0]

        for question in data.questions:
            insert_question = text("""
                INSERT INTO Question (quiz_id_fk, question_text, question_type, points)
                VALUES (:quiz_id_fk, :question_text, :question_type, :points)
            """)
            db.execute(insert_question, {
                "quiz_id_fk": quiz_id,
                "question_text": question.question_text,
                "question_type": question.question_type,
                "points": question.points,
            })
            db.commit()

            question_id = db.execute(text("SELECT LAST_INSERT_ID()")).fetchone()[0]

            for option in question.options:
                insert_option = text("""
                    INSERT INTO QuestionOption (question_id_fk, option_text, is_correct)
                    VALUES (:question_id_fk, :option_text, :is_correct)
                """)
                db.execute(insert_option, {
                    "question_id_fk": question_id,
                    "option_text": option.option_text,
                    "is_correct": option.is_correct,
                })
            db.commit()

        return {"message": "✅ Quiz created successfully."}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"❌ Failed to create quiz: {str(e)}")

@router.get("/quizzes")
def get_all_quizzes(db=Depends(get_db)):
    quizzes = db.execute(text("SELECT * FROM Quiz")).fetchall()
    return [dict(quiz._mapping) for quiz in quizzes]

@router.get("/quiz/{quiz_id}")
def get_quiz_by_id(quiz_id: int, db=Depends(get_db)):
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

@router.put("/quiz/{quiz_id}")
def update_quiz(quiz_id: int, data: FullQuizCreate, db=Depends(get_db)):
    existing = db.execute(text("SELECT * FROM Quiz WHERE quiz_id = :quiz_id"), {"quiz_id": quiz_id}).fetchone()
    if not existing:
        raise HTTPException(status_code=404, detail="Quiz not found.")

    try:
        # Update quiz
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

        # Delete previous question-related data
        db.execute(text("DELETE FROM Response WHERE question_id_fk IN (SELECT question_id FROM Question WHERE quiz_id_fk = :quiz_id)"), {"quiz_id": quiz_id})
        db.execute(text("DELETE FROM QuestionOption WHERE question_id_fk IN (SELECT question_id FROM Question WHERE quiz_id_fk = :quiz_id)"), {"quiz_id": quiz_id})
        db.execute(text("DELETE FROM Question WHERE quiz_id_fk = :quiz_id"), {"quiz_id": quiz_id})
        db.commit()

        # Re-insert questions and options
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

            question_id = db.execute(text("SELECT LAST_INSERT_ID()")).fetchone()[0]

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

@router.delete("/quiz/{quiz_id}")
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

@router.post("/assign-quiz-to-batch")
def assign_quiz_to_batch(data: QuizAssignmentRequest, db=Depends(get_db)):
    try:
        # Fetch all students for the given batch
        students = db.execute(
            text("SELECT student_id FROM BatchStudent WHERE batch_id = :batch_id"),
            {"batch_id": data.batch_id}
        ).fetchall()

        # If no students are found in the batch
        if not students:
            raise HTTPException(status_code=404, detail="No students found in this batch.")

        # Fetch the batch name to return in the response
        batch_row = db.execute(
            text("SELECT batch_name FROM Batch WHERE batch_id = :batch_id"),
            {"batch_id": data.batch_id}
        ).fetchone()

        if not batch_row:
            raise HTTPException(status_code=404, detail="Batch not found.")

        batch_name = batch_row['batch_name']

        # Insert records into Batch_Assignment for each student
        for student in students:
            db.execute(
                text("""
                    INSERT INTO Batch_Assignment (batch_id_fk, quiz_id_fk, student_id_fk)
                    VALUES (:batch_id, :quiz_id, :student_id)
                """),
                {
                    "batch_id": data.batch_id,
                    "quiz_id": data.quiz_id,
                    "student_id": student['student_id']
                }
            )
        
        db.commit()  # Commit the changes

        return {"message": f"✅ Quiz assigned to {len(students)} students in batch '{batch_name}'."}

    except Exception as e:
        db.rollback()  # Rollback in case of error
        raise HTTPException(status_code=500, detail=f"❌ Failed to assign quiz: {str(e)}")


@router.get("/batches")
def get_all_batches(db=Depends(get_db)):
    try:
        # Execute the query and fetch the results
        result = db.execute(text("SELECT batch_id, batch_name FROM Batch")).fetchall()

        # Check if result is empty and handle accordingly
        if not result:
            return []

        # If not empty, process each row as a dictionary
        batch_list = []
        for row in result:
            batch_list.append({
                "value": row[0],  # batch_id (first column in the tuple)
                "label": row[1]   # batch_name (second column in the tuple)
            })

        return batch_list

    except Exception as e:
        # Log the error for better insight
        print(f"Error occurred while fetching batches: {str(e)}")
        raise HTTPException(status_code=500, detail=f"❌ Failed to fetch batches: {str(e)}")
















# from fastapi import APIRouter, HTTPException, Depends
# from sqlalchemy import text
# from typing import List, Optional
# from pydantic import BaseModel
# from datetime import datetime
# from db.database import get_db   
# from routers.models import Quiz 
# router = APIRouter()

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

# # === Routes ===

# # Create a new quiz (with questions and options)
# @router.post("/quiz")
# def create_quiz(data: FullQuizCreate, db=Depends(get_db)):
#     try:
#         # Insert quiz
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

#         quiz_id = db.execute(text("SELECT LAST_INSERT_ID()")).fetchone()[0]

#         # Insert questions and options
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

#             question_id = db.execute(text("SELECT LAST_INSERT_ID()")).fetchone()[0]

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

# # Get all quizzes
# @router.get("/quizzes")
# def get_all_quizzes(db=Depends(get_db)):
#     quizzes = db.execute(text("SELECT * FROM Quiz")).fetchall()
#     return [dict(quiz._mapping) for quiz in quizzes]

# # Get single quiz (with questions and options)
# @router.get("/quiz/{quiz_id}")
# def get_quiz_by_id(quiz_id: int, db=Depends(get_db)):
#     quiz = db.execute(text("SELECT * FROM Quiz WHERE quiz_id = :quiz_id"), {"quiz_id": quiz_id}).fetchone()
#     if not quiz:
#         raise HTTPException(status_code=404, detail="Quiz not found.")

#     quiz_data = dict(quiz._mapping)
#     quiz_data["questions"] = []

#     questions = db.execute(text("SELECT * FROM Question WHERE quiz_id_fk = :quiz_id"), {"quiz_id": quiz_id}).fetchall()

#     for question in questions:
#         q = dict(question._mapping)
#         options = db.execute(text("SELECT * FROM QuestionOption WHERE question_id_fk = :question_id"),
#                              {"question_id": q["question_id"]}).fetchall()
#         q["options"] = [dict(option._mapping) for option in options]
#         quiz_data["questions"].append(q)

#     return quiz_data

# # Update a quiz
# @router.put("/quiz/{quiz_id}")
# def update_quiz(quiz_id: int, data: FullQuizCreate, db=Depends(get_db)):
#     quiz = db.execute(text("SELECT * FROM Quiz WHERE quiz_id = :quiz_id"), {"quiz_id": quiz_id}).fetchone()
#     if not quiz:
#         raise HTTPException(status_code=404, detail="Quiz not found.")

#     try:
#         # Update quiz info
#         update_quiz = text("""
#             UPDATE Quiz
#             SET quiz_title = :quiz_title, description = :description, is_open = :is_open, start_time = :start_time
#             WHERE quiz_id = :quiz_id
#         """)
#         db.execute(update_quiz, {
#             "quiz_title": data.quiz_title,
#             "description": data.description,
#             "is_open": data.is_open,
#             "start_time": data.start_time or datetime.utcnow(),
#             "quiz_id": quiz_id
#         })
#         db.commit()

#         # Delete old responses
#         db.execute(text("""
#             DELETE FROM Response WHERE question_id_fk IN (
#                 SELECT question_id FROM Question WHERE quiz_id_fk = :quiz_id
#             )
#         """), {"quiz_id": quiz_id})
#         db.commit()

#         # Delete old options
#         db.execute(text("""
#             DELETE FROM QuestionOption WHERE question_id_fk IN (
#                 SELECT question_id FROM Question WHERE quiz_id_fk = :quiz_id
#             )
#         """), {"quiz_id": quiz_id})
#         db.commit()

#         # Delete old questions
#         db.execute(text("DELETE FROM Question WHERE quiz_id_fk = :quiz_id"), {"quiz_id": quiz_id})
#         db.commit()

#         # Insert new questions and options
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

#             question_id = db.execute(text("SELECT LAST_INSERT_ID()")).fetchone()[0]

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

#         return {"message": "✅ Quiz updated successfully."}

#     except Exception as e:
#         db.rollback()
#         raise HTTPException(status_code=500, detail=f"❌ Failed to update quiz: {str(e)}")

# # Delete a quiz
# @router.delete("/quiz/{quiz_id}")
# def delete_quiz(quiz_id: int, db=Depends(get_db)):
#     quiz = db.execute(text("SELECT * FROM Quiz WHERE quiz_id = :quiz_id"), {"quiz_id": quiz_id}).fetchone()
#     if not quiz:
#         raise HTTPException(status_code=404, detail="Quiz not found.")

#     try:
#         db.execute(text("""
#             DELETE FROM Response WHERE question_id_fk IN (
#                 SELECT question_id FROM Question WHERE quiz_id_fk = :quiz_id
#             )
#         """), {"quiz_id": quiz_id})
#         db.commit()

#         db.execute(text("""
#             DELETE FROM QuestionOption WHERE question_id_fk IN (
#                 SELECT question_id FROM Question WHERE quiz_id_fk = :quiz_id
#             )
#         """), {"quiz_id": quiz_id})
#         db.commit()

#         db.execute(text("DELETE FROM Question WHERE quiz_id_fk = :quiz_id"), {"quiz_id": quiz_id})
#         db.commit()

#         db.execute(text("DELETE FROM Quiz WHERE quiz_id = :quiz_id"), {"quiz_id": quiz_id})
#         db.commit()

#         return {"message": "✅ Quiz deleted successfully."}

#     except Exception as e:
#         db.rollback()
#         raise HTTPException(status_code=500, detail=f"❌ Failed to delete quiz: {str(e)}")














# from fastapi import APIRouter, HTTPException, Depends, status
# from sqlalchemy import text
# from sqlalchemy.orm import Session
# from typing import List, Optional
# from pydantic import BaseModel
# from datetime import datetime
# from sqlalchemy.exc import IntegrityError

# from db.database import get_db
# from routers.models import Quiz, Batch, StudentDetails, BatchAssignment, BatchStudent

# router = APIRouter()

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
#     batch_id: int
#     quiz_id: int


# # === Routes ===

# @router.post("/quiz", status_code=status.HTTP_201_CREATED)
# def create_quiz(data: FullQuizCreate, db: Session = Depends(get_db)):
#     try:
#         # Insert Quiz
#         insert_quiz_stmt = text(""" 
#             INSERT INTO Quiz (quiz_title, description, created_by_mentor_id_fk, is_open, start_time)
#             VALUES (:quiz_title, :description, :created_by_mentor_id_fk, :is_open, :start_time)
#         """)
#         db.execute(insert_quiz_stmt, {
#             "quiz_title": data.quiz_title,
#             "description": data.description,
#             "created_by_mentor_id_fk": data.created_by_mentor_id_fk,
#             "is_open": data.is_open,
#             "start_time": data.start_time or datetime.utcnow()
#         })
#         db.commit()

#         quiz_id = db.execute(text("SELECT LAST_INSERT_ID()")).scalar()

#         # Insert Questions and Options
#         for question in data.questions:
#             insert_question_stmt = text(""" 
#                 INSERT INTO Question (quiz_id_fk, question_text, question_type, points)
#                 VALUES (:quiz_id_fk, :question_text, :question_type, :points)
#             """)
#             db.execute(insert_question_stmt, {
#                 "quiz_id_fk": quiz_id,
#                 "question_text": question.question_text,
#                 "question_type": question.question_type,
#                 "points": question.points,
#             })
        
#         db.commit()  # commit after inserting questions
#         question_id = db.execute(text("SELECT LAST_INSERT_ID()")).scalar()

#         # Insert Options
#         for question in data.questions:
#             for option in question.options:
#                 insert_option_stmt = text(""" 
#                     INSERT INTO QuestionOption (question_id_fk, option_text, is_correct)
#                     VALUES (:question_id_fk, :option_text, :is_correct)
#                 """)
#                 db.execute(insert_option_stmt, {
#                     "question_id_fk": question_id,
#                     "option_text": option.option_text,
#                     "is_correct": option.is_correct,
#                 })

#         db.commit()
#         return {"message": "✅ Quiz created successfully."}
#     except IntegrityError as e:
#         db.rollback()
#         raise HTTPException(status_code=400, detail=f"❌ Integrity error: {str(e)}")
#     except Exception as e:
#         db.rollback()
#         raise HTTPException(status_code=500, detail=f"❌ Failed to create quiz: {str(e)}")


# @router.get("/quizzes", status_code=status.HTTP_200_OK)
# def get_all_quizzes(db: Session = Depends(get_db)):
#     quizzes = db.execute(text("SELECT * FROM Quiz")).fetchall()
#     return [dict(quiz._mapping) for quiz in quizzes]


# @router.get("/quiz/{quiz_id}", status_code=status.HTTP_200_OK)
# def get_quiz_by_id(quiz_id: int, db: Session = Depends(get_db)):
#     quiz = db.execute(text("SELECT * FROM Quiz WHERE quiz_id = :quiz_id"), {"quiz_id": quiz_id}).fetchone()
#     if not quiz:
#         raise HTTPException(status_code=404, detail="Quiz not found.")

#     quiz_data = dict(quiz._mapping)
#     quiz_data["questions"] = []

#     questions = db.execute(text("SELECT * FROM Question WHERE quiz_id_fk = :quiz_id"), {"quiz_id": quiz_id}).fetchall()
#     for question in questions:
#         q = dict(question._mapping)
#         options = db.execute(text("SELECT * FROM QuestionOption WHERE question_id_fk = :question_id"),
#                              {"question_id": q["question_id"]}).fetchall()
#         q["options"] = [dict(opt._mapping) for opt in options]
#         quiz_data["questions"].append(q)

#     return quiz_data


# @router.put("/quiz/{quiz_id}", status_code=status.HTTP_200_OK)
# def update_quiz(quiz_id: int, data: FullQuizCreate, db: Session = Depends(get_db)):
#     quiz = db.execute(text("SELECT * FROM Quiz WHERE quiz_id = :quiz_id"), {"quiz_id": quiz_id}).fetchone()
#     if not quiz:
#         raise HTTPException(status_code=404, detail="Quiz not found.")

#     try:
#         # Update quiz info
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

#         # Delete old data
#         db.execute(text(""" 
#             DELETE FROM Response WHERE question_id_fk IN (
#                 SELECT question_id FROM Question WHERE quiz_id_fk = :quiz_id
#             )
#         """), {"quiz_id": quiz_id})
#         db.commit()

#         db.execute(text(""" 
#             DELETE FROM QuestionOption WHERE question_id_fk IN (
#                 SELECT question_id FROM Question WHERE quiz_id_fk = :quiz_id
#             )
#         """), {"quiz_id": quiz_id})
#         db.commit()

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
        
#         db.commit()  # commit after inserting questions
#         question_id = db.execute(text("SELECT LAST_INSERT_ID()")).scalar()

#         # Insert Options
#         for question in data.questions:
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
#         return {"message": "✅ Quiz updated successfully."}
#     except Exception as e:
#         db.rollback()
#         raise HTTPException(status_code=500, detail=f"❌ Failed to update quiz: {str(e)}")


# @router.delete("/quiz/{quiz_id}", status_code=status.HTTP_200_OK)
# def delete_quiz(quiz_id: int, db: Session = Depends(get_db)):
#     quiz = db.execute(text("SELECT * FROM Quiz WHERE quiz_id = :quiz_id"), {"quiz_id": quiz_id}).fetchone()
#     if not quiz:
#         raise HTTPException(status_code=404, detail="Quiz not found.")

#     try:
#         db.execute(text(""" 
#             DELETE FROM Response WHERE question_id_fk IN (
#                 SELECT question_id FROM Question WHERE quiz_id_fk = :quiz_id
#             )
#         """), {"quiz_id": quiz_id})
#         db.commit()

#         db.execute(text(""" 
#             DELETE FROM QuestionOption WHERE question_id_fk IN (
#                 SELECT question_id FROM Question WHERE quiz_id_fk = :quiz_id
#             )
#         """), {"quiz_id": quiz_id})
#         db.commit()

#         db.execute(text("DELETE FROM Question WHERE quiz_id_fk = :quiz_id"), {"quiz_id": quiz_id})
#         db.commit()

#         db.execute(text("DELETE FROM Quiz WHERE quiz_id = :quiz_id"), {"quiz_id": quiz_id})
#         db.commit()

#         return {"message": "✅ Quiz deleted successfully."}
#     except Exception as e:
#         db.rollback()
#         raise HTTPException(status_code=500, detail=f"❌ Failed to delete quiz: {str(e)}")

# # Fetch batches from the database
# @router.get("/batches", status_code=status.HTTP_200_OK)
# def get_batches(db: Session = Depends(get_db)):
#     batches = db.query(Batch.batch_name).all()
#     if not batches:
#         raise HTTPException(status_code=404, detail="No batches found.")
#     return [{"batch_name": batch.batch_name} for batch in batches]

# # Assign a quiz to a batch
# @router.post("/assign-quiz-to-batch/")
# def assign_quiz_to_batch(batch_name: str, quiz_id: int, db: Session = Depends(get_db)):
#     batch = db.query(Batch).filter(Batch.batch_name == batch_name).first()
#     if not batch:
#         raise HTTPException(status_code=404, detail="Batch not found")

#     students = db.query(BatchStudent).filter(BatchStudent.batch_id == batch.batch_id).all()
#     if not students:
#         raise HTTPException(status_code=404, detail="No students in this batch")

#     for student in students:
#         existing = db.query(BatchAssignment).filter(
#             BatchAssignment.batch_id_fk == batch.batch_id,
#             BatchAssignment.quiz_id_fk == quiz_id,
#             BatchAssignment.student_id_fk == student.student_id
#         ).first()

#         if not existing:
#             assignment = BatchAssignment(
#                 batch_id_fk=batch.batch_id,
#                 quiz_id_fk=quiz_id,
#                 student_id_fk=student.student_id
#             )
#             db.add(assignment)

#     db.commit()
#     return {"message": f"Quiz {quiz_id} assigned to all students in batch {batch_name}"}











