from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import List, Optional
import logging

from db.database import get_db

router = APIRouter(prefix="/api/batches", tags=["Batches"])

# ─── Pydantic Schemas ─────────────────────────────
class BatchBase(BaseModel):
    batch_name: str
    school_id_fk: int
    created_by: int
    class_id_fk: Optional[int] = None
    section_id_fk: Optional[int] = None
    session_id_fk: Optional[int] = None

class BatchCreate(BatchBase):
    student_ids: List[int]

class BatchOut(BatchBase):
    batch_id: int
    student_ids: List[int]

    class Config:
        orm_mode = True


# ─── CREATE BATCH ──────────────────────────────────
@router.post("", response_model=BatchOut, status_code=status.HTTP_201_CREATED)
def create_batch(batch: BatchCreate, db: Session = Depends(get_db)):
    """
    Create a new batch with associated students.
    """
    try:
        if not batch.student_ids:
            raise HTTPException(status_code=400, detail="No student IDs provided")

        # Insert batch
        batch_sql = text("""
            INSERT INTO Batch (
                batch_name, school_id_fk, created_by,
                class_id_fk, section_id_fk, session_id_fk
            ) VALUES (
                :batch_name, :school_id_fk, :created_by,
                :class_id_fk, :section_id_fk, :session_id_fk
            )
        """)
        batch_data = batch.dict(exclude={"student_ids"})
        db.execute(batch_sql, batch_data)

        batch_id = db.execute(text("SELECT LAST_INSERT_ID()")).scalar()

        # Associate students
        student_sql = text("INSERT INTO BatchStudent (batch_id, student_id) VALUES (:batch_id, :student_id)")
        for sid in batch.student_ids:
            db.execute(student_sql, {"batch_id": batch_id, "student_id": sid})

        db.commit()

        return {**batch_data, "batch_id": batch_id, "student_ids": batch.student_ids}

    except Exception as e:
        db.rollback()
        logging.error(f"Error creating batch: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


# ─── GET ALL BATCHES ───────────────────────────────
@router.get("", response_model=List[BatchOut])
def read_batches(db: Session = Depends(get_db)):
    """
    Retrieve all batches along with associated student IDs.
    """
    try:
        query = text("""
            SELECT b.*, GROUP_CONCAT(bs.student_id) AS student_ids
            FROM Batch b
            LEFT JOIN BatchStudent bs ON b.batch_id = bs.batch_id
            GROUP BY b.batch_id
            ORDER BY b.batch_id DESC
        """)
        rows = db.execute(query).fetchall()
        return [
            {
                **dict(row._mapping),
                "student_ids": list(map(int, row.student_ids.split(','))) if row.student_ids else []
            } for row in rows
        ]

    except Exception as e:
        logging.error(f"Error reading batches: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


# ─── FILTER STUDENTS NOT IN ANY BATCH ──────────────
@router.get("/students/filter", response_model=List[dict])
def filter_students_for_batch(
    school_id: Optional[int] = Query(None),
    class_id_fk: Optional[int] = Query(None),
    section_id_fk: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Return list of students not assigned to any batch, optionally filtered by class/section/school.
    """
    try:
        sql = """
            SELECT s.student_details_id_pk AS student_id, s.name, s.email, s.phone,
                   s.class_id_fk, s.section_id_fk, s.school_id_fk
            FROM student_details s
            WHERE NOT EXISTS (
                SELECT 1 FROM BatchStudent bs WHERE bs.student_id = s.student_details_id_pk
            )
        """
        conditions = []
        params = {}

        if school_id:
            conditions.append("s.school_id_fk = :school_id")
            params["school_id"] = school_id
        if class_id_fk:
            conditions.append("s.class_id_fk = :class_id_fk")
            params["class_id_fk"] = class_id_fk
        if section_id_fk:
            conditions.append("s.section_id_fk = :section_id_fk")
            params["section_id_fk"] = section_id_fk

        if conditions:
            sql += " AND " + " AND ".join(conditions)

        result = db.execute(text(sql), params).fetchall()
        return [dict(row._mapping) for row in result]

    except Exception as e:
        logging.error(f"Error filtering students: {str(e)}")
        raise HTTPException(status_code=500, detail="Error filtering students")


# ─── GET SESSIONS ──────────────────────────────────
@router.get("/sessions")
def get_sessions(db: Session = Depends(get_db)):
    try:
        query = text("""
            SELECT session_id, session_name 
            FROM Session
        """)
        return [{"session_id": row.session_id, "session_name": row.session_name} for row in db.execute(query).fetchall()]
    except Exception as e:
        logging.error(f"Failed to fetch sessions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch sessions")



# ─── GET CLASSES ───────────────────────────────────
@router.get("/classes")
def get_classes(db: Session = Depends(get_db)):
    try:
        query = text("""
            SELECT DISTINCT class_id_fk 
            FROM student_details 
            WHERE class_id_fk IS NOT NULL
        """)
        return [{"class_id": row.class_id_fk, "label": f"Class {row.class_id_fk}"} for row in db.execute(query).fetchall()]
    except Exception as e:
        logging.error(f"Failed to fetch classes: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch classes")




# ─── GET SECTIONS ──────────────────────────────────
@router.get("/sections")
def get_sections(db: Session = Depends(get_db)):
    try:
        query = text("""
            SELECT DISTINCT section_id_fk 
            FROM student_details 
            WHERE section_id_fk IS NOT NULL
        """)
        return [{"section_id": row.section_id_fk, "label": f"Section {row.section_id_fk}"} for row in db.execute(query).fetchall()]
    except Exception as e:
        logging.error(f"Failed to fetch sections: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch sections")




# ─── UPDATE BATCH ──────────────────────────────────
@router.put("/{batch_id}", response_model=BatchOut)
def update_batch(batch_id: int, updated_batch: BatchCreate, db: Session = Depends(get_db)):
    """
    Update an existing batch and reassign students.
    """
    try:
        exists = db.execute(
            text("SELECT COUNT(*) FROM Batch WHERE batch_id = :batch_id"),
            {"batch_id": batch_id}
        ).scalar()

        if not exists:
            raise HTTPException(status_code=404, detail="Batch not found")

        # Update batch metadata
        update_sql = text("""
            UPDATE Batch SET
                batch_name = :batch_name,
                school_id_fk = :school_id_fk,
                created_by = :created_by,
                class_id_fk = :class_id_fk,
                section_id_fk = :section_id_fk,
                session_id_fk = :session_id_fk
            WHERE batch_id = :batch_id
        """)
        db.execute(update_sql, {**updated_batch.dict(exclude={"student_ids"}), "batch_id": batch_id})

        # Delete old and insert new student mappings
        db.execute(text("DELETE FROM BatchStudent WHERE batch_id = :batch_id"), {"batch_id": batch_id})
        for sid in updated_batch.student_ids:
            db.execute(text("INSERT INTO BatchStudent (batch_id, student_id) VALUES (:batch_id, :student_id)"),
                       {"batch_id": batch_id, "student_id": sid})

        db.commit()
        return {**updated_batch.dict(exclude={"student_ids"}), "batch_id": batch_id, "student_ids": updated_batch.student_ids}

    except Exception as e:
        db.rollback()
        logging.error(f"Error updating batch: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


# ─── DELETE BATCH ──────────────────────────────────
@router.delete("/{batch_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_batch(batch_id: int, db: Session = Depends(get_db)):
    """
    Delete a batch and its student assignments.
    """
    try:
        db.execute(text("DELETE FROM BatchStudent WHERE batch_id = :batch_id"), {"batch_id": batch_id})
        result = db.execute(text("DELETE FROM Batch WHERE batch_id = :batch_id"), {"batch_id": batch_id})

        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Batch not found")

        db.commit()

    except Exception as e:
        db.rollback()
        logging.error(f"Error deleting batch: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")









 

 







# from fastapi import APIRouter, Depends, HTTPException, status, Query
# from sqlalchemy.orm import Session
# from sqlalchemy import text
# from pydantic import BaseModel
# from typing import List, Optional
# import logging

# from db.database import get_db  # ensure this points to your actual DB session dependency

# router = APIRouter(
#     prefix="/api/batches",
#     tags=["Batches"]
# )

# # ─── Pydantic Schemas ────────────────────────────────────────────────────────────
# class BatchBase(BaseModel):
#     batch_name: str
#     school_id_fk: int
#     created_by: int
#     class_id: Optional[int] = None
#     section_id: Optional[int] = None
#     session_id: Optional[int] = None

# class BatchCreate(BatchBase):
#     student_ids: List[int]

# class BatchUpdate(BatchBase):
#     student_ids: Optional[List[int]] = None

# class BatchOut(BatchBase):
#     batch_id: int
#     student_id: Optional[int]

#     class Config:
#         orm_mode = True

# # ─── CREATE ─────────────────────────────────────────────────────────────────────
# @router.post("", response_model=List[BatchOut], status_code=status.HTTP_201_CREATED)
# def create_batch(batch: BatchCreate, db: Session = Depends(get_db)):
#     try:
#         if not batch.student_ids:
#             raise HTTPException(status_code=400, detail="No student IDs provided")

#         sql = text("""
#             INSERT INTO Batch
#             (batch_name, school_id_fk, created_by, class_id, section_id, session_id, student_id)
#             VALUES
#             (:batch_name, :school_id_fk, :created_by, :class_id, :section_id, :session_id, :student_id)
#         """)
        
#         inserted_batches = []
#         for student_id in batch.student_ids:
#             values = batch.dict(exclude={"student_ids"})
#             values["student_id"] = student_id
#             result = db.execute(sql, values)
#             inserted_batches.append({**values, "batch_id": result.lastrowid})

#         db.commit()
#         return inserted_batches

#     except Exception as e:
#         logging.error(f"Error occurred while creating batch: {str(e)}")
#         raise HTTPException(status_code=500, detail=str(e))


# # ─── READ ALL ────────────────────────────────────────────────────────────────────
# @router.get("", response_model=List[BatchOut])
# def read_batches(db: Session = Depends(get_db)):
#     sql = text("""
#         SELECT
#             batch_id, batch_name, school_id_fk, created_by,
#             class_id, section_id, session_id, student_id
#         FROM Batch
#         ORDER BY batch_id DESC
#     """)
#     rows = db.execute(sql).fetchall()
#     return [dict(r._mapping) for r in rows]

# # ─── READ SINGLE ─────────────────────────────────────────────────────────────────
# @router.get("/{batch_id}", response_model=BatchOut)
# def read_batch(batch_id: int, db: Session = Depends(get_db)):
#     sql = text("""
#         SELECT
#             batch_id, batch_name, school_id_fk, created_by,
#             class_id, section_id, session_id, student_id
#         FROM Batch
#         WHERE batch_id = :batch_id
#     """)
#     row = db.execute(sql, {"batch_id": batch_id}).fetchone()
#     if not row:
#         raise HTTPException(status_code=404, detail="Batch not found")
#     return dict(row._mapping)

# # ─── SEARCH BATCHES ──────────────────────────────────────────────────────────────
# @router.get("/search", response_model=List[BatchOut])
# def search_batches(
#     school_name: Optional[str] = Query(None),
#     class_id: Optional[int] = Query(None),
#     section_id: Optional[int] = Query(None),
#     db: Session = Depends(get_db)
# ):
#     try:
#         sql = """
#             SELECT
#                 b.batch_id, b.batch_name, b.school_id_fk, b.created_by,
#                 b.class_id, b.section_id, b.session_id, b.student_id
#             FROM Batch b
#             JOIN school_details s ON b.school_id_fk = s.school_id_pk
#             WHERE 1 = 1
#         """
#         params = {}

#         if school_name:
#             sql += " AND s.school_name LIKE :school_name"
#             params["school_name"] = f"%{school_name}%"
#         if class_id:
#             sql += " AND b.class_id = :class_id"
#             params["class_id"] = class_id
#         if section_id:
#             sql += " AND b.section_id = :section_id"
#             params["section_id"] = section_id

#         sql += " ORDER BY b.batch_id DESC"

#         rows = db.execute(text(sql), params).fetchall()
#         return [dict(row._mapping) for row in rows]

#     except Exception as e:
#         logging.error(f"Error filtering batches: {e}")
#         raise HTTPException(status_code=500, detail="Error filtering batches")

# # ─── UPDATE ─────────────────────────────────────────────────────────────────────
# @router.put("/{batch_id}", response_model=BatchOut)
# def update_batch(batch_id: int, batch: BatchUpdate, db: Session = Depends(get_db)):
#     updates = batch.dict(exclude_unset=True)
#     if not updates:
#         raise HTTPException(status_code=400, detail="No fields provided for update")

#     set_clause = ", ".join(f"{k} = :{k}" for k in updates.keys())
#     params = {**updates, "batch_id": batch_id}
#     sql = text(f"UPDATE Batch SET {set_clause} WHERE batch_id = :batch_id")

#     result = db.execute(sql, params)
#     db.commit()

#     if result.rowcount == 0:
#         raise HTTPException(status_code=404, detail="Batch not found")

#     return read_batch(batch_id, db)

# # ─── DELETE ─────────────────────────────────────────────────────────────────────
# @router.delete("/{batch_id}", status_code=status.HTTP_204_NO_CONTENT)
# def delete_batch(batch_id: int, db: Session = Depends(get_db)):
#     result = db.execute(
#         text("DELETE FROM Batch WHERE batch_id = :batch_id"),
#         {"batch_id": batch_id},
#     )
#     db.commit()

#     if result.rowcount == 0:
#         raise HTTPException(status_code=404, detail="Batch not found")


# # ─── FILTER STUDENTS FOR BATCH SELECTION ─────────────────────────────────────────
# @router.get("/students/filter", response_model=List[dict])
# def filter_students_for_batch(
#     school_name: Optional[str] = Query(None, description="Filter by school name"),
#     class_id: Optional[int] = Query(None, description="Filter by class ID"),
#     section_id: Optional[int] = Query(None, description="Filter by section ID"),
#     db: Session = Depends(get_db)
# ):
#     try:
#         sql = """
#             SELECT 
#                 s.student_details_id_pk AS student_id,
#                 s.name,
#                 s.email,
#                 s.phone,
#                 s.class_id_fk,
#                 s.section_id_fk,
#                 s.school_id_fk
#             FROM student_details s
#             JOIN school_details sd ON s.school_id_fk = sd.school_id_pk
#             WHERE 1 = 1
#         """
#         params = {}

#         if school_name:
#             sql += " AND sd.school_name LIKE :school_name"
#             params["school_name"] = f"%{school_name}%"
#         if class_id:
#             sql += " AND s.class_id_fk = :class_id"
#             params["class_id"] = class_id
#         if section_id:
#             sql += " AND s.section_id_fk = :section_id"
#             params["section_id"] = section_id

#         result = db.execute(text(sql), params).fetchall()
#         return [dict(row._mapping) for row in result]

#     except Exception as e:
#         logging.error(f"Error filtering students: {e}")
#         raise HTTPException(status_code=500, detail="Error filtering students")








# from fastapi import APIRouter, Depends, HTTPException, status, Query
# from sqlalchemy.orm import Session
# from sqlalchemy import text
# from pydantic import BaseModel
# from typing import List, Optional
# import logging

# from db.database import get_db

# router = APIRouter(
#     prefix="/api/batches",
#     tags=["Batches"]
# )

# # ─── Pydantic Schemas ────────────────────────────────────────────────────────────
# class BatchBase(BaseModel):
#     batch_name: str
#     school_id_fk: int
#     created_by: int
#     class_id: Optional[int] = None
#     section_id: Optional[int] = None
#     session_id: Optional[int] = None

# class BatchCreate(BatchBase):
#     student_ids: List[int]

# class BatchUpdate(BatchBase):
#     student_ids: Optional[List[int]] = None

# class BatchOut(BatchBase):
#     batch_id: int
#     student_id: Optional[int]

#     class Config:
#         orm_mode = True

# # ─── CREATE ─────────────────────────────────────────────────────────────────────
# @router.post("", response_model=List[BatchOut], status_code=status.HTTP_201_CREATED)
# def create_batch(batch: BatchCreate, db: Session = Depends(get_db)):
#     try:
#         if not batch.student_ids:
#             raise HTTPException(status_code=400, detail="No student IDs provided")

#         sql = text("""
#             INSERT INTO Batch
#             (batch_name, school_id_fk, created_by, class_id, section_id, session_id, student_id)
#             VALUES
#             (:batch_name, :school_id_fk, :created_by, :class_id, :section_id, :session_id, :student_id)
#         """)
        
#         inserted_batches = []
#         for student_id in batch.student_ids:
#             values = batch.dict(exclude={"student_ids"})
#             values["student_id"] = student_id
#             result = db.execute(sql, values)
#             inserted_batches.append({**values, "batch_id": result.lastrowid})

#         db.commit()
#         return inserted_batches

#     except Exception as e:
#         logging.error(f"Error occurred while creating batch: {str(e)}")
#         raise HTTPException(status_code=500, detail=str(e))


# # ─── READ ALL ────────────────────────────────────────────────────────────────────
# @router.get("", response_model=List[BatchOut])
# def read_batches(db: Session = Depends(get_db)):
#     sql = text("""
#         SELECT
#             batch_id, batch_name, school_id_fk, created_by,
#             class_id, section_id, session_id, student_id
#         FROM Batch
#         ORDER BY batch_id DESC
#     """)
#     rows = db.execute(sql).fetchall()
#     return [dict(r._mapping) for r in rows]

# # ─── READ SINGLE ─────────────────────────────────────────────────────────────────
# @router.get("/{batch_id}", response_model=BatchOut)
# def read_batch(batch_id: int, db: Session = Depends(get_db)):
#     sql = text("""
#         SELECT
#             batch_id, batch_name, school_id_fk, created_by,
#             class_id, section_id, session_id, student_id
#         FROM Batch
#         WHERE batch_id = :batch_id
#     """)
#     row = db.execute(sql, {"batch_id": batch_id}).fetchone()
#     if not row:
#         raise HTTPException(status_code=404, detail="Batch not found")
#     return dict(row._mapping)

# # ─── SEARCH BY SCHOOL NAME ───────────────────────────────────────────────────────
# @router.get("/search", response_model=List[BatchOut])
# def search_batches(school_name: str, db: Session = Depends(get_db)):
#     sql = text("""
#         SELECT
#             b.batch_id, b.batch_name, b.school_id_fk, b.created_by,
#             b.class_id, b.section_id, b.session_id, b.student_id
#         FROM Batch b
#         JOIN school_details s ON b.school_id_fk = s.school_id_pk
#         WHERE s.school_name LIKE :school_name
#         ORDER BY b.batch_id DESC
#     """)
#     rows = db.execute(sql, {"school_name": f"%{school_name}%"}).fetchall()
#     return [dict(r._mapping) for r in rows]

# # ─── UPDATE ─────────────────────────────────────────────────────────────────────
# @router.put("/{batch_id}", response_model=BatchOut)
# def update_batch(batch_id: int, batch: BatchUpdate, db: Session = Depends(get_db)):
#     updates = batch.dict(exclude_unset=True)
#     if not updates:
#         raise HTTPException(status_code=400, detail="No fields provided for update")

#     set_clause = ", ".join(f"{k} = :{k}" for k in updates.keys())
#     params = {**updates, "batch_id": batch_id}
#     sql = text(f"UPDATE Batch SET {set_clause} WHERE batch_id = :batch_id")

#     result = db.execute(sql, params)
#     db.commit()

#     if result.rowcount == 0:
#         raise HTTPException(status_code=404, detail="Batch not found")

#     return read_batch(batch_id, db)

# # ─── DELETE ─────────────────────────────────────────────────────────────────────
# @router.delete("/{batch_id}", status_code=status.HTTP_204_NO_CONTENT)
# def delete_batch(batch_id: int, db: Session = Depends(get_db)):
#     result = db.execute(
#         text("DELETE FROM Batch WHERE batch_id = :batch_id"),
#         {"batch_id": batch_id},
#     )
#     db.commit()

#     if result.rowcount == 0:
#         raise HTTPException(status_code=404, detail="Batch not found")


# # ─── FILTER STUDENTS FOR BATCH SELECTION ─────────────────────────────────────────
# @router.get("/students/filter", response_model=List[dict])
# def filter_students_for_batch(
#     school_name: Optional[str] = Query(None, description="Filter by school name"),
#     class_id: Optional[int] = Query(None, description="Filter by class ID"),
#     section_id: Optional[int] = Query(None, description="Filter by section ID"),
#     db: Session = Depends(get_db)
# ):
#     try:
#         sql = """
#             SELECT 
#                 s.student_details_id_pk AS student_id,
#                 s.name,
#                 s.email,
#                 s.phone,
#                 s.class_id_fk,
#                 s.section_id_fk,
#                 s.school_id_fk
#             FROM student_details s
#             JOIN school_details sd ON s.school_id_fk = sd.school_id_pk
#             WHERE 1 = 1
#         """

#         params = {}

#         if school_name:
#             sql += " AND sd.school_name LIKE :school_name"
#             params["school_name"] = f"%{school_name}%"

#         if class_id:
#             sql += " AND s.class_id_fk = :class_id"
#             params["class_id"] = class_id

#         if section_id:
#             sql += " AND s.section_id_fk = :section_id"
#             params["section_id"] = section_id

#         result = db.execute(text(sql), params).fetchall()
#         return [dict(row._mapping) for row in result]

#     except Exception as e:
#         logging.error(f"Error filtering students: {e}")
#         raise HTTPException(status_code=500, detail="Error filtering students")









# from fastapi import APIRouter, Depends, HTTPException, status
# from sqlalchemy.orm import Session
# from sqlalchemy import text
# from pydantic import BaseModel
# from typing import List, Optional
# import logging

# from db.database import get_db

# router = APIRouter(
#     prefix="/api/batches",
#     tags=["Batches"]
# )

# # ─── Pydantic Schemas ────────────────────────────────────────────────────────────
# class BatchBase(BaseModel):
#     batch_name: str
#     school_id_fk: int
#     created_by: int
#     class_id: Optional[int] = None
#     section_id: Optional[int] = None
#     session_id: Optional[int] = None

# class BatchCreate(BatchBase):
#     student_ids: List[int]

# class BatchUpdate(BatchBase):
#     student_ids: Optional[List[int]] = None

# class BatchOut(BatchBase):
#     batch_id: int
#     student_id: Optional[int]

#     class Config:
#         orm_mode = True

# # ─── CREATE ─────────────────────────────────────────────────────────────────────
# @router.post("", response_model=List[BatchOut], status_code=status.HTTP_201_CREATED)
# def create_batch(batch: BatchCreate, db: Session = Depends(get_db)):
#     try:
#         if not batch.student_ids:
#             raise HTTPException(status_code=400, detail="No student IDs provided")

#         sql = text("""
#             INSERT INTO Batch
#             (batch_name, school_id_fk, created_by, class_id, section_id, session_id, student_id)
#             VALUES
#             (:batch_name, :school_id_fk, :created_by, :class_id, :section_id, :session_id, :student_id)
#         """)
        
#         inserted_batches = []
#         for student_id in batch.student_ids:
#             values = batch.dict(exclude={"student_ids"})
#             values["student_id"] = student_id
#             result = db.execute(sql, values)
#             inserted_batches.append({**values, "batch_id": result.lastrowid})

#         db.commit()
#         return inserted_batches

#     except Exception as e:
#         logging.error(f"Error occurred while creating batch: {str(e)}")
#         raise HTTPException(status_code=500, detail=str(e))


# # ─── READ ALL ────────────────────────────────────────────────────────────────────
# @router.get("", response_model=List[BatchOut])
# def read_batches(db: Session = Depends(get_db)):
#     sql = text("""
#         SELECT
#             batch_id, batch_name, school_id_fk, created_by,
#             class_id, section_id, session_id, student_id
#         FROM Batch
#         ORDER BY batch_id DESC
#     """)
#     rows = db.execute(sql).fetchall()
#     return [dict(r._mapping) for r in rows]

# # ─── READ SINGLE ─────────────────────────────────────────────────────────────────
# @router.get("/{batch_id}", response_model=BatchOut)
# def read_batch(batch_id: int, db: Session = Depends(get_db)):
#     sql = text("""
#         SELECT
#             batch_id, batch_name, school_id_fk, created_by,
#             class_id, section_id, session_id, student_id
#         FROM Batch
#         WHERE batch_id = :batch_id
#     """)
#     row = db.execute(sql, {"batch_id": batch_id}).fetchone()
#     if not row:
#         raise HTTPException(status_code=404, detail="Batch not found")
#     return dict(row._mapping)

# # ─── SEARCH BY SCHOOL NAME ───────────────────────────────────────────────────────
# @router.get("/search", response_model=List[BatchOut])
# def search_batches(school_name: str, db: Session = Depends(get_db)):
#     sql = text("""
#         SELECT
#             b.batch_id, b.batch_name, b.school_id_fk, b.created_by,
#             b.class_id, b.section_id, b.session_id, b.student_id
#         FROM Batch b
#         JOIN school_details s ON b.school_id_fk = s.school_id_pk
#         WHERE s.school_name LIKE :school_name
#         ORDER BY b.batch_id DESC
#     """)
#     rows = db.execute(sql, {"school_name": f"%{school_name}%"}).fetchall()
#     return [dict(r._mapping) for r in rows]

# # ─── UPDATE ─────────────────────────────────────────────────────────────────────
# @router.put("/{batch_id}", response_model=BatchOut)
# def update_batch(batch_id: int, batch: BatchUpdate, db: Session = Depends(get_db)):
#     updates = batch.dict(exclude_unset=True)
#     if not updates:
#         raise HTTPException(status_code=400, detail="No fields provided for update")

#     set_clause = ", ".join(f"{k} = :{k}" for k in updates.keys())
#     params = {**updates, "batch_id": batch_id}
#     sql = text(f"UPDATE Batch SET {set_clause} WHERE batch_id = :batch_id")

#     result = db.execute(sql, params)
#     db.commit()

#     if result.rowcount == 0:
#         raise HTTPException(status_code=404, detail="Batch not found")

#     return read_batch(batch_id, db)

# # ─── DELETE ─────────────────────────────────────────────────────────────────────
# @router.delete("/{batch_id}", status_code=status.HTTP_204_NO_CONTENT)
# def delete_batch(batch_id: int, db: Session = Depends(get_db)):
#     result = db.execute(
#         text("DELETE FROM Batch WHERE batch_id = :batch_id"),
#         {"batch_id": batch_id},
#     )
#     db.commit()

#     if result.rowcount == 0:
#         raise HTTPException(status_code=404, detail="Batch not found")
