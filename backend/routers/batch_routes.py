from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, Field
from typing import List, Optional
import logging

from db.database import get_db

router = APIRouter(prefix="/api/batches", tags=["Batches"])

# ─── SCHEMAS ───────────────────────────────────────
class BatchBase(BaseModel):
    batch_name: str
    school_id_fk: int
    created_by: int
    class_id: int
    section_id: int
    session_id: int

class BatchCreate(BatchBase):
    student_ids: List[int] = Field(..., min_items=1, description="List of student IDs")

class BatchOut(BatchBase):
    batch_id: int
    student_ids: List[int]

    class Config:
        orm_mode = True


# ─── CREATE ───────────────────────────────────────
@router.post("", response_model=BatchOut, status_code=status.HTTP_201_CREATED)
def create_batch(batch: BatchCreate, db: Session = Depends(get_db)):
    try:
        # Insert into Batch and get last inserted ID
        result = db.execute(text("""
            INSERT INTO Batch (batch_name, school_id_fk, created_by, class_id, section_id, session_id)
            VALUES (:batch_name, :school_id_fk, :created_by, :class_id, :section_id, :session_id)
        """), {
            "batch_name": batch.batch_name,
            "school_id_fk": batch.school_id_fk,
            "created_by": batch.created_by,
            "class_id": batch.class_id,
            "section_id": batch.section_id,
            "session_id": batch.session_id
        })
        db.commit()

        # Fetch last inserted ID safely
        batch_id = db.execute(text("SELECT MAX(batch_id) FROM Batch")).scalar()
        if not batch_id:
            raise RuntimeError("Could not retrieve new batch_id")

        # Insert students into BatchStudent
        for sid in batch.student_ids:
            valid = db.execute(text("""
                SELECT 1 FROM student_details
                WHERE student_details_id_pk = :sid
                  AND class_id_fk = :class_id
                  AND section_id_fk = :section_id
                LIMIT 1
            """), {
                "sid": sid,
                "class_id": batch.class_id,
                "section_id": batch.section_id
            }).fetchone()
            if not valid:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Student {sid} not in class {batch.class_id}/section {batch.section_id}"
                )

            db.execute(text("""
                INSERT INTO BatchStudent (batch_id, student_id)
                VALUES (:batch_id, :student_id)
            """), {"batch_id": batch_id, "student_id": sid})

        db.commit()
        return BatchOut(batch_id=batch_id, **batch.dict())

    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        logging.exception("Failed to create batch")
        raise HTTPException(status_code=500, detail="Internal Server Error")


# ─── READ ALL ──────────────────────────────────────
@router.get("", response_model=List[BatchOut])
def read_batches(db: Session = Depends(get_db)):
    try:
        rows = db.execute(text("""
            SELECT
              b.batch_id,
              b.batch_name,
              b.school_id_fk,
              b.created_by,
              b.class_id,
              b.section_id,
              b.session_id,
              GROUP_CONCAT(bs.student_id) AS student_ids
            FROM Batch b
            LEFT JOIN BatchStudent bs ON bs.batch_id = b.batch_id
            GROUP BY b.batch_id
            ORDER BY b.batch_id DESC
        """)).fetchall()

        result: List[BatchOut] = []
        for r in rows:
            ids = list(map(int, r.student_ids.split(","))) if r.student_ids else []
            result.append(BatchOut(
                batch_id=r.batch_id,
                batch_name=r.batch_name,
                school_id_fk=r.school_id_fk,
                created_by=r.created_by,
                class_id=r.class_id,
                section_id=r.section_id,
                session_id=r.session_id,
                student_ids=ids
            ))
        return result

    except Exception:
        logging.exception("Failed to read batches")
        raise HTTPException(status_code=500, detail="Internal Server Error")


# ─── FILTER STUDENTS ──────────────────────────────
@router.get("/students/filter", response_model=List[dict])
def filter_students(
    school_id: Optional[int] = Query(None),
    class_id: Optional[int] = Query(None),
    section_id: Optional[int] = Query(None),
    exclude_assigned: bool = Query(True),
    db: Session = Depends(get_db)
):
    try:
        sql = """
          SELECT 
            s.student_details_id_pk AS student_id,
            s.name, s.email, s.phone,
            s.class_id_fk, s.section_id_fk, s.school_id_fk
          FROM student_details s
        """
        clauses, params = [], {}
        if exclude_assigned:
            clauses.append("NOT EXISTS (SELECT 1 FROM BatchStudent bs WHERE bs.student_id = s.student_details_id_pk)")
        if school_id is not None:
            clauses.append("s.school_id_fk = :school_id"); params["school_id"] = school_id
        if class_id is not None:
            clauses.append("s.class_id_fk = :class_id"); params["class_id"] = class_id
        if section_id is not None:
            clauses.append("s.section_id_fk = :section_id"); params["section_id"] = section_id
        if clauses:
            sql += " WHERE " + " AND ".join(clauses)

        rows = db.execute(text(sql), params).fetchall()
        return [dict(r._mapping) for r in rows]

    except Exception:
        logging.exception("Failed to filter students")
        raise HTTPException(status_code=500, detail="Internal Server Error")


# ─── UPDATE ───────────────────────────────────────   
@router.put("/{batch_id}", response_model=BatchOut)
def update_batch(batch_id: int, updated: BatchCreate, db: Session = Depends(get_db)):
    try:
        # 1) Ensure the batch exists
        exists = db.execute(text("SELECT 1 FROM Batch WHERE batch_id = :id"), {"id": batch_id}).fetchone()
        if not exists:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Batch not found")

        # 2) Validate new student_ids against school/class/section
        if updated.student_ids:
            placeholders = ",".join([str(sid) for sid in updated.student_ids])
            query = text(f"""
                SELECT student_details_id_pk FROM student_details
                WHERE student_details_id_pk IN ({placeholders})
                AND school_id_fk = :school_id
                AND class_id_fk = :class_id
                AND section_id_fk = :section_id
            """)
            result = db.execute(query, {
                "school_id": updated.school_id_fk,
                "class_id": updated.class_id,
                "section_id": updated.section_id
            }).fetchall()
            valid_ids = {row[0] for row in result}
            if len(valid_ids) != len(updated.student_ids):
                raise HTTPException(status.HTTP_400_BAD_REQUEST, "One or more students are not valid or not in the selected class/section/school.")

        # 3) Update the batch info
        db.execute(text("""
            UPDATE Batch SET
              batch_name    = :batch_name,
              school_id_fk  = :school_id_fk,
              created_by    = :created_by,
              class_id      = :class_id,
              section_id    = :section_id,
              session_id    = :session_id
            WHERE batch_id = :batch_id
        """), {"batch_id": batch_id, **updated.dict(exclude={"student_ids"})})

        # 4) Delete existing students and insert only selected ones
        db.execute(text("DELETE FROM BatchStudent WHERE batch_id = :batch_id"), {"batch_id": batch_id})
        for sid in updated.student_ids:
            db.execute(text("""
                INSERT INTO BatchStudent (batch_id, student_id)
                VALUES (:batch_id, :student_id)
            """), {"batch_id": batch_id, "student_id": sid})

        db.commit()

        return BatchOut(batch_id=batch_id, **updated.dict())

    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        logging.exception("Failed to update batch")
        raise HTTPException(status_code=500, detail="Internal Server Error")


# ─── DELETE ───────────────────────────────────────
@router.delete("/{batch_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_batch(batch_id: int, db: Session = Depends(get_db)):
    try:
        db.execute(text("DELETE FROM BatchStudent WHERE batch_id = :batch_id"), {"batch_id": batch_id})
        res = db.execute(text("DELETE FROM Batch WHERE batch_id = :batch_id"), {"batch_id": batch_id})
        if res.rowcount == 0:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Batch not found")
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        logging.exception("Failed to delete batch")
        raise HTTPException(status_code=500, detail="Internal Server Error")


# ─── LOOKUPS ───────────────────────────────────────
# @router.get("/classes", response_model=List[dict])
# def get_classes(db: Session = Depends(get_db)):
#     rows = db.execute(text("SELECT DISTINCT class_id_fk AS class_id FROM student_details")).fetchall()
#     return [{"class_id": r.class_id, "label": f"Class {r.class_id}"} for r in rows]


# @router.get("/sections", response_model=List[dict])
# def get_sections(db: Session = Depends(get_db)):
#     rows = db.execute(text("SELECT DISTINCT section_id_fk AS section_id FROM student_details")).fetchall()
#     return [{"section_id": r.section_id, "label": f"Section {r.section_id}"} for r in rows]


@router.get("/classes", response_model=List[dict])
def get_classes(db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT class_id_pk, class AS class_name FROM class_details WHERE active_status = 'A'
    """)).fetchall()
    return [{"class_id": r.class_id_pk, "label": r.class_name} for r in rows]

@router.get("/sections", response_model=List[dict])
def get_sections(db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT section_id_pk, section FROM sections WHERE active_status = 'A'
    """)).fetchall()
    return [{"section_id": r.section_id_pk, "label": r.section} for r in rows]


@router.get("/sessions", response_model=List[dict])
def get_sessions(db: Session = Depends(get_db)):
    rows = db.execute(text("SELECT session_id, session_name FROM Session")).fetchall()
    return [{"session_id": r.session_id, "session_name": r.session_name} for r in rows]


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
                "value": row[0],  
                "label": row[1]   
            })

        return batch_list

    except Exception as e:
        # Log the error for better insight
        print(f"Error occurred while fetching batches: {str(e)}")
        raise HTTPException(status_code=500, detail=f"❌ Failed to fetch batches: {str(e)}")
    
    



















# @router.post("/batch/{batch_id}/assign_quiz")
# def assign_quiz_to_batch(batch_id: int, quiz_id: int, student_ids: List[int], db: Session = Depends(get_db)):
#     batch = db.query(Batch).filter(Batch.batch_id == batch_id).first()
#     if not batch:
#         raise HTTPException(status_code=404, detail="Batch not found")

#     quiz = db.query(Quiz).filter(Quiz.quiz_id == quiz_id).first()
#     if not quiz:
#         raise HTTPException(status_code=404, detail="Quiz not found")

#     # Assign quiz to students in the batch
#     for student_id in student_ids:
#         student_assignment = BatchAssignment(batch_id_fk=batch_id, quiz_id_fk=quiz_id, student_id_fk=student_id)
#         db.add(student_assignment)

#     db.commit()
#     return {"message": "Quiz assigned to students successfully"}

















