from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
from pydantic import BaseModel

from db.database import get_db

router = APIRouter(
    prefix="/api/students",
    tags=["Students"]
)

class StudentOut(BaseModel):
    id: int
    name: str

    class Config:
        orm_mode = True

@router.get("", response_model=List[StudentOut])
def get_students_by_school(
    school_id: int = Query(..., description="School ID to filter students"),
    db: Session = Depends(get_db)
):
    """
    Fetch all active students by school ID.
    """
    query = text("""
        SELECT student_details_id_pk, name 
        FROM student_details 
        WHERE school_id_fk = :school_id AND active_status = 'A'
    """)
    rows = db.execute(query, {"school_id": school_id}).fetchall()
    return [{"id": r[0], "name": r[1]} for r in rows]
