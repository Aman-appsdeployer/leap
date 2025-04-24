from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from pydantic import BaseModel

from db.database import get_db

router = APIRouter(
    prefix="/api/schools",
    tags=["Schools"]
)

class SchoolOut(BaseModel):
    school_id: int
    school_name: str

    class Config:
        orm_mode = True


@router.get("", response_model=List[SchoolOut])
def list_schools(search: Optional[str] = None, db: Session = Depends(get_db)):
    base_sql = """
      SELECT
        school_id_pk AS school_id,
        school_name
      FROM school_details
      WHERE active_status = 'A'
    """
    if search:
        stmt = text(base_sql + " AND school_name LIKE :search")
        params = {"search": f"%{search}%"}
    else:
        stmt = text(base_sql)
        params = {}

    rows = db.execute(stmt, params).fetchall()
    return [{"school_id": r.school_id, "school_name": r.school_name} for r in rows]


# ✅ ADD THIS ROUTE to show students by school
class StudentOut(BaseModel):
    id: int
    name: str

    class Config:
        orm_mode = True


@router.get("/students", response_model=List[StudentOut])
def get_students_by_school(school_id: int, db: Session = Depends(get_db)):
    query = text("""
        SELECT student_id_pk AS id, student_name AS name
        FROM student_details
        WHERE school_id_fk = :school_id AND active_status = 'A'
    """)
    rows = db.execute(query, {"school_id": school_id}).fetchall()
    return [{"id": r.id, "name": r.name} for r in rows]
