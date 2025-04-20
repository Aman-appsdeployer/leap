# from fastapi import APIRouter, HTTPException, Depends
# from sqlalchemy import text
# from typing import List
# from pydantic import BaseModel
# from datetime import datetime
# from database import get_db  # Import the get_db function for database session

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
#     description: Optional[str]
#     created_by_mentor_id_fk: int
#     is_open: Optional[bool] = True
#     start_time: Optional[datetime] = None

# class FullQuizCreate(QuizCreate):
#     questions: List[QuestionCreate]

# # === Routes ===

# @router.post("/quiz/full-create")
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

# @router.get("/quizzes")
# def get_all_quizzes(db=Depends(get_db)):
#     query = text("SELECT quiz_id, quiz_title, description FROM Quiz WHERE is_open = TRUE")
#     result = db.execute(query).mappings().fetchall()
#     return [row for row in result]

# @router.get("/quiz/{quiz_id}")
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








# from fastapi import APIRouter, Body, HTTPException
# from pydantic import BaseModel
# from typing import List
# from database import get_db  # Assuming you have a database connection function

# router = APIRouter()

# # ---------------- Models ---------------- #
# class QuestionCreate(BaseModel):
#     question_text: str
#     question_type: str
#     points: int
#     options: List[dict]  # {option_text: str, is_correct: bool}

# class OptionCreate(BaseModel):
#     option_text: str
#     is_correct: bool

# class QuizCreate(BaseModel):
#     quiz_title: str
#     description: str
#     created_by_mentor_id: int
#     start_time: str  # ISO timestamp
#     questions: List[QuestionCreate]

# # ---------------- Create Quiz ---------------- #
# @router.post("/api/create_quiz")
# def create_quiz(data: QuizCreate):
#     conn = get_db()
#     cursor = conn.cursor()
#     try:
#         # Insert Quiz
#         cursor.execute(
#             """
#             INSERT INTO Quiz (quiz_title, description, created_by_mentor_id_fk, is_open, start_time)
#             VALUES (%s, %s, %s, %s, %s)
#             """,
#             (data.quiz_title, data.description, data.created_by_mentor_id, True, data.start_time)
#         )
#         quiz_id = cursor.fetchone()[0]

#         # Insert Questions and Options
#         for q in data.questions:
#             cursor.execute(
#                 """
#                 INSERT INTO Question (quiz_id_fk, question_text, question_type, points)
#                 VALUES (%s, %s, %s, %s)
#                 RETURNING question_id
#                 """,
#                 (quiz_id, q.question_text, q.question_type, q.points)
#             )
#             question_id = cursor.fetchone()[0]

#             for opt in q.options:
#                 cursor.execute(
#                     """
#                     INSERT INTO Option_Table (question_id_fk, option_text, is_correct)
#                     VALUES (%s, %s, %s)
#                     """,
#                     (question_id, opt['option_text'], opt['is_correct'])
#                 )

#         conn.commit()
#         return {"message": "Quiz created", "quiz_id": quiz_id}
#     except Exception as e:
#         conn.rollback()
#         raise HTTPException(status_code=500, detail=str(e))
#     finally:
#         cursor.close()
#         conn.close()

# # ---------------- List Teacher Quizzes ---------------- #
# @router.get("/api/teacher_quizzes/{mentor_id}")
# def get_teacher_quizzes(mentor_id: int):
#     conn = get_db()
#     cursor = conn.cursor()
#     try:
#         cursor.execute("""
#             SELECT quiz_id, quiz_title, description, is_open, start_time
#             FROM Quiz
#             WHERE created_by_mentor_id_fk = %s
#             ORDER BY quiz_id DESC;
#         """, (mentor_id,))
#         quizzes = cursor.fetchall()
#         return [
#             {
#                 "quiz_id": q[0],
#                 "quiz_title": q[1],
#                 "description": q[2],
#                 "is_open": q[3],
#                 "start_time": q[4].isoformat() if q[4] else None
#             } for q in quizzes
#         ]
#     finally:
#         cursor.close()
#         conn.close()

# # ---------------- Toggle Quiz Status ---------------- #
# @router.put("/api/toggle_quiz/{quiz_id}")
# def toggle_quiz_status(quiz_id: int, is_open: bool = Body(...)):
#     conn = get_db()
#     cursor = conn.cursor()
#     try:
#         cursor.execute("UPDATE Quiz SET is_open = %s WHERE quiz_id = %s", (is_open, quiz_id))
#         conn.commit()
#         return {"message": "Quiz status updated"}
#     finally:
#         cursor.close()
#         conn.close()

# # ---------------- Get Quiz by ID ---------------- #
# @router.get("/api/quiz/{quiz_id}")
# def get_quiz(quiz_id: int):
#     conn = get_db()
#     cursor = conn.cursor()
#     try:
#         cursor.execute("SELECT quiz_title, description, start_time FROM Quiz WHERE quiz_id = %s", (quiz_id,))
#         row = cursor.fetchone()
#         return {
#             "quiz_title": row[0],
#             "description": row[1],
#             "start_time": row[2].isoformat() if row[2] else None
#         }
#     finally:
#         cursor.close()
#         conn.close()

# # ---------------- Update Quiz ---------------- #
# @router.put("/api/quiz/{quiz_id}")
# def update_quiz(quiz_id: int, data: dict):
#     conn = get_db()
#     cursor = conn.cursor()
#     try:
#         cursor.execute(
#             "UPDATE Quiz SET quiz_title = %s, description = %s, start_time = %s WHERE quiz_id = %s",
#             (data['quiz_title'], data['description'], data['start_time'], quiz_id)
#         )
#         conn.commit()
#         return {"message": "Quiz updated"}
#     finally:
#         cursor.close()
#         conn.close()

# # ---------------- Delete Quiz ---------------- #
# @router.delete("/api/quiz/{quiz_id}")
# def delete_quiz(quiz_id: int):
#     conn = get_db()
#     cursor = conn.cursor()
#     try:
#         cursor.execute("DELETE FROM Option_Table WHERE question_id_fk IN (SELECT question_id FROM Question WHERE quiz_id_fk = %s)", (quiz_id,))
#         cursor.execute("DELETE FROM Question WHERE quiz_id_fk = %s", (quiz_id,))
#         cursor.execute("DELETE FROM Quiz WHERE quiz_id = %s", (quiz_id,))
#         conn.commit()
#         return {"message": "Quiz deleted successfully"}
#     finally:
#         cursor.close()
#         conn.close()

# # ---------------- Student View Quizzes ---------------- #
# @router.get("/api/student_quizzes")
# def get_open_quizzes():
#     conn = get_db()
#     cursor = conn.cursor()
#     try:
#         cursor.execute("""
#             SELECT quiz_id, quiz_title, description, is_open, start_time
#             FROM Quiz
#             WHERE is_open = TRUE
#             ORDER BY start_time;
#         """)
#         rows = cursor.fetchall()
#         return [
#             {
#                 "quiz_id": row[0],
#                 "quiz_title": row[1],
#                 "description": row[2],
#                 "is_open": row[3],
#                 "start_time": row[4].isoformat() if row[4] else None
#             } for row in rows
#         ]
#     finally:
#         cursor.close()
#         conn.close()
