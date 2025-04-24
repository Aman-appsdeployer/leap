from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import List, Optional
import logging

from db.database import get_db

router = APIRouter(
    prefix="/api/batches",
    tags=["Batches"]
)

# ─── Pydantic Schemas ────────────────────────────────────────────────────────────
class BatchBase(BaseModel):
    batch_name: str
    school_id_fk: int
    created_by: int
    class_id: Optional[int] = None
    section_id: Optional[int] = None
    session_id: Optional[int] = None

class BatchCreate(BatchBase):
    student_ids: List[int]

class BatchUpdate(BatchBase):
    student_ids: Optional[List[int]] = None

class BatchOut(BatchBase):
    batch_id: int
    student_id: Optional[int]

    class Config:
        orm_mode = True

# ─── CREATE ─────────────────────────────────────────────────────────────────────
@router.post("", response_model=List[BatchOut], status_code=status.HTTP_201_CREATED)
def create_batch(batch: BatchCreate, db: Session = Depends(get_db)):
    try:
        if not batch.student_ids:
            raise HTTPException(status_code=400, detail="No student IDs provided")

        sql = text("""
            INSERT INTO Batch
            (batch_name, school_id_fk, created_by, class_id, section_id, session_id, student_id)
            VALUES
            (:batch_name, :school_id_fk, :created_by, :class_id, :section_id, :session_id, :student_id)
        """)
        
        inserted_batches = []
        for student_id in batch.student_ids:
            values = batch.dict(exclude={"student_ids"})
            values["student_id"] = student_id
            result = db.execute(sql, values)
            inserted_batches.append({**values, "batch_id": result.lastrowid})

        db.commit()
        return inserted_batches

    except Exception as e:
        logging.error(f"Error occurred while creating batch: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── READ ALL ────────────────────────────────────────────────────────────────────
@router.get("", response_model=List[BatchOut])
def read_batches(db: Session = Depends(get_db)):
    sql = text("""
        SELECT
            batch_id, batch_name, school_id_fk, created_by,
            class_id, section_id, session_id, student_id
        FROM Batch
        ORDER BY batch_id DESC
    """)
    rows = db.execute(sql).fetchall()
    return [dict(r._mapping) for r in rows]

# ─── READ SINGLE ─────────────────────────────────────────────────────────────────
@router.get("/{batch_id}", response_model=BatchOut)
def read_batch(batch_id: int, db: Session = Depends(get_db)):
    sql = text("""
        SELECT
            batch_id, batch_name, school_id_fk, created_by,
            class_id, section_id, session_id, student_id
        FROM Batch
        WHERE batch_id = :batch_id
    """)
    row = db.execute(sql, {"batch_id": batch_id}).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Batch not found")
    return dict(row._mapping)

# ─── SEARCH BY SCHOOL NAME ───────────────────────────────────────────────────────
@router.get("/search", response_model=List[BatchOut])
def search_batches(school_name: str, db: Session = Depends(get_db)):
    sql = text("""
        SELECT
            b.batch_id, b.batch_name, b.school_id_fk, b.created_by,
            b.class_id, b.section_id, b.session_id, b.student_id
        FROM Batch b
        JOIN school_details s ON b.school_id_fk = s.school_id_pk
        WHERE s.school_name LIKE :school_name
        ORDER BY b.batch_id DESC
    """)
    rows = db.execute(sql, {"school_name": f"%{school_name}%"}).fetchall()
    return [dict(r._mapping) for r in rows]

# ─── UPDATE ─────────────────────────────────────────────────────────────────────
@router.put("/{batch_id}", response_model=BatchOut)
def update_batch(batch_id: int, batch: BatchUpdate, db: Session = Depends(get_db)):
    updates = batch.dict(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    set_clause = ", ".join(f"{k} = :{k}" for k in updates.keys())
    params = {**updates, "batch_id": batch_id}
    sql = text(f"UPDATE Batch SET {set_clause} WHERE batch_id = :batch_id")

    result = db.execute(sql, params)
    db.commit()

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Batch not found")

    return read_batch(batch_id, db)

# ─── DELETE ─────────────────────────────────────────────────────────────────────
@router.delete("/{batch_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_batch(batch_id: int, db: Session = Depends(get_db)):
    result = db.execute(
        text("DELETE FROM Batch WHERE batch_id = :batch_id"),
        {"batch_id": batch_id},
    )
    db.commit()

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Batch not found")
