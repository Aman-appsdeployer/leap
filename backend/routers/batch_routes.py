from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, Field
from typing import List, Optional
import logging
import traceback
from db.database import get_db

router = APIRouter(prefix="/api/batches", tags=["Batches"])

# ─── SCHEMAS ───────────────────────────────────────
class BatchBase(BaseModel):
<<<<<<< HEAD
=======
    batch_name: Optional[str] = None
>>>>>>> 693386cb (batches changes)
    school_id_fk: int
    created_by: int
    class_id: int
    section_id: int
    session_id: int

class BatchCreate(BatchBase):
    student_ids: List[int] = Field(..., min_items=1)

class PromotionPayload(BaseModel):
    student_ids: List[int]
    new_class_id: int
    new_section_id: int
    new_session_id: int
    new_school_id: int
    created_by: int

# For response only, batch_name included
class BatchOut(BatchBase):
    batch_id: int
    batch_name: str
    student_ids: List[int]
<<<<<<< HEAD
    school_name: Optional[str] = None 
    boy_count: int = 0
    girl_count: int = 0
=======
    school_name: Optional[str] = None  # ✅ default value added
>>>>>>> 693386cb (batches changes)

    class Config:
        orm_mode = True
        

@router.post("", response_model=BatchOut, status_code=status.HTTP_201_CREATED)
def create_batch(batch: BatchCreate, db: Session = Depends(get_db)):
    try:
<<<<<<< HEAD
        # ❗ Check if a batch with the same school_id, class_id, and section_id already exists
        duplicate_check = db.execute(text("""
            SELECT 1 FROM Batch 
            WHERE school_id_fk = :school_id 
              AND class_id = :class_id 
              AND section_id = :section_id
              AND session_id = :session_id
        """), {
            "school_id": batch.school_id_fk,
            "class_id": batch.class_id,
            "section_id": batch.section_id,
            "session_id": batch.session_id
        }).fetchone()

        if duplicate_check:
            raise HTTPException(status_code=400, detail=" A batch for this school, class, section, and session already exists.")

        # Existing batch name generation
        class_row = db.execute(
            text("SELECT class FROM class_details WHERE class_id_pk = :id"),
            {"id": batch.class_id}
        ).fetchone()

        section_row = db.execute(
            text("SELECT section FROM sections WHERE section_id_pk = :id"),
            {"id": batch.section_id}
        ).fetchone()

        session_row = db.execute(
            text("SELECT session_name FROM Session WHERE session_id = :id"),
            {"id": batch.session_id}
        ).fetchone()
=======
        # Fetch class, section, and session labels for dynamic batch name
        class_row = db.execute(text("SELECT class FROM class_details WHERE class_id_pk = :id"),
                               {"id": batch.class_id}).fetchone()
        section_row = db.execute(text("SELECT section FROM sections WHERE section_id_pk = :id"),
                                 {"id": batch.section_id}).fetchone()
        session_row = db.execute(text("SELECT session_name FROM Session WHERE session_id = :id"),
                                 {"id": batch.session_id}).fetchone()
>>>>>>> 693386cb (batches changes)

        if not (class_row and section_row and session_row):
            raise HTTPException(status_code=400, detail="Invalid class, section, or session ID")

<<<<<<< HEAD
        batch_name = f"{batch.school_id_fk} CLASS {class_row[0]} {section_row[0]} {session_row[0]}"

=======
        # ✅ Fix: access tuple values by index, not by key
        batch_name = f"{batch.school_id_fk} CLASS {class_row[0]} {section_row[0]} {session_row[0]}"

        # Insert into Batch table
>>>>>>> 693386cb (batches changes)
        db.execute(text("""
            INSERT INTO Batch (batch_name, school_id_fk, created_by, class_id, section_id, session_id)
            VALUES (:batch_name, :school_id_fk, :created_by, :class_id, :section_id, :session_id)
        """), {
            "batch_name": batch_name,
            "school_id_fk": batch.school_id_fk,
            "created_by": batch.created_by,
            "class_id": batch.class_id,
            "section_id": batch.section_id,
            "session_id": batch.session_id
        })
        db.commit()

<<<<<<< HEAD
        batch_id = db.execute(text("SELECT MAX(batch_id) FROM Batch")).scalar()
=======
        # Get newly created batch_id
        batch_id = db.execute(text("SELECT MAX(batch_id) FROM Batch")).scalar()
        if not batch_id:
            raise HTTPException(status_code=500, detail="Could not retrieve batch ID")
>>>>>>> 693386cb (batches changes)

        for sid in batch.student_ids:
<<<<<<< HEAD
=======
            valid = db.execute(text("""
                SELECT 1 FROM student_details
                WHERE student_details_id_pk = :sid
                  AND class_id_fk = :class_id
                  AND section_id_fk = :section_id
            """), {
                "sid": sid,
                "class_id": batch.class_id,
                "section_id": batch.section_id
            }).fetchone()
            if not valid:
                raise HTTPException(status_code=400, detail=f"Student {sid} does not match class/section")

>>>>>>> 693386cb (batches changes)
            db.execute(text("""
                INSERT INTO BatchStudent (batch_id, student_id)
                VALUES (:batch_id, :student_id)
            """), {"batch_id": batch_id, "student_id": sid})

        db.commit()
<<<<<<< HEAD

        return BatchOut(batch_id=batch_id, batch_name=batch_name, **batch.dict())
=======
        return BatchOut(batch_id=batch_id, batch_name=batch_name, **batch.dict(exclude={"batch_name"}))

>>>>>>> 693386cb (batches changes)

    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        logging.exception("Failed to create batch")
        raise HTTPException(status_code=500, detail="Internal Server Error")



<<<<<<< HEAD
=======

>>>>>>> 693386cb (batches changes)
# ─── READ ALL ──────────────────────────────────────
@router.get("", response_model=List[BatchOut])
def read_batches(db: Session = Depends(get_db)):
    try:
        rows = db.execute(text("""
            SELECT
              b.batch_id,
              b.batch_name,
              b.school_id_fk,
<<<<<<< HEAD
              sd.school_name,
=======
             s.school_name,
>>>>>>> 693386cb (batches changes)
              b.created_by,
              b.class_id,
              b.section_id,
              b.session_id,
              GROUP_CONCAT(bs.student_id) AS student_ids,
              COUNT(CASE WHEN s.gender = 'Male' THEN 1 END) AS boy_count,
              COUNT(CASE WHEN s.gender = 'Female' THEN 1 END) AS girl_count
            FROM Batch b
            JOIN school_details s ON b.school_id_fk = s.school_id_pk
            LEFT JOIN BatchStudent bs ON bs.batch_id = b.batch_id
            LEFT JOIN student_details s ON bs.student_id = s.student_details_id_pk
            LEFT JOIN school_details sd ON sd.school_id_pk = b.school_id_fk
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
<<<<<<< HEAD
                school_name=r.school_name,
                class_id=r.class_id,created_by=r.created_by if r.created_by is not None else 0,

=======
                school_name=r.school_name, 
                created_by=r.created_by,
                class_id=r.class_id,
>>>>>>> 693386cb (batches changes)
                section_id=r.section_id,
                session_id=r.session_id,
                student_ids=ids,
                boy_count=r.boy_count,
                girl_count=r.girl_count
            ))
        return result

    except Exception:
        logging.exception("Failed to read batches")
        raise HTTPException(status_code=500, detail="Internal Server Error")



# ─── FILTER STUDENTS ──────────────────────────────
<<<<<<< HEAD
# @router.get("/students/filter", response_model=List[dict])
# def filter_students(
#     school_id: Optional[int] = Query(None),
#     class_id: Optional[int] = Query(None),
#     section_id: Optional[int] = Query(None),
#     exclude_assigned: bool = Query(True),
#     db: Session = Depends(get_db)
# ):
#     try:
#         sql = """
#           SELECT 
#             s.student_details_id_pk AS student_id,
<<<<<<< HEAD
#             s.name, s.email, s.phone,s.gender,
=======
#             s.name, s.email, s.phone,
>>>>>>> b74972c9 (main chla leave per)
#             s.class_id_fk, s.section_id_fk, s.school_id_fk
#           FROM student_details s
#         """
#         clauses, params = [], {}
#         if exclude_assigned:
#             clauses.append("NOT EXISTS (SELECT 1 FROM BatchStudent bs WHERE bs.student_id = s.student_details_id_pk)")
#         if school_id is not None:
#             clauses.append("s.school_id_fk = :school_id"); params["school_id"] = school_id
#         if class_id is not None:
#             clauses.append("s.class_id_fk = :class_id"); params["class_id"] = class_id
#         if section_id is not None:
#             clauses.append("s.section_id_fk = :section_id"); params["section_id"] = section_id
#         if clauses:
#             sql += " WHERE " + " AND ".join(clauses)

#         rows = db.execute(text(sql), params).fetchall()
#         return [dict(r._mapping) for r in rows]

#     except Exception:
#         logging.exception("Failed to filter students")
#         raise HTTPException(status_code=500, detail="Internal Server Error")


=======
>>>>>>> 693386cb (batches changes)
@router.get("/students/filter", response_model=List[dict])
def filter_students(
    school_id: Optional[int] = Query(None),
    class_id: Optional[int] = Query(None),
    section_id: Optional[int] = Query(None),
    session_id: Optional[int] = Query(None),
    exclude_assigned: bool = Query(True),
    db: Session = Depends(get_db)
):
    try:
        sql = """
<<<<<<< HEAD
          SELECT 
            s.student_details_id_pk AS student_id,
            s.name, s.email, s.phone, s.gender,
            s.class_id_fk, s.section_id_fk, s.school_id_fk
          FROM student_details s
=======
            SELECT 
                s.student_details_id_pk AS student_id,
                s.name, s.email, s.phone,
                s.class_id_fk, s.section_id_fk, s.school_id_fk
            FROM student_details s
>>>>>>> b74972c9 (main chla leave per)
        """
        clauses, params = [], {}

        if exclude_assigned:
            clauses.append("""
                NOT EXISTS (
<<<<<<< HEAD
                    SELECT 1 FROM BatchStudent bs
                    WHERE bs.student_id = s.student_details_id_pk
                )
            """)

        if school_id is not None:
            clauses.append("s.school_id_fk = :school_id")
            params["school_id"] = school_id

        if class_id is not None:
            clauses.append("s.class_id_fk = :class_id")
            params["class_id"] = class_id

        if section_id is not None:
            clauses.append("s.section_id_fk = :section_id")
            params["section_id"] = section_id

        if session_id is not None:
            # academic_year stores session_id as a string, so we convert it
            clauses.append("s.academic_year = :session_id")
            params["session_id"] = str(session_id)

=======
                    SELECT 1 FROM BatchStudent bs 
                    WHERE bs.student_id = s.student_details_id_pk
                )
            """)
        if school_id is not None:
            clauses.append("s.school_id_fk = :school_id")
            params["school_id"] = school_id
        if class_id is not None:
            clauses.append("s.class_id_fk = :class_id")
            params["class_id"] = class_id
        if section_id is not None:
            clauses.append("s.section_id_fk = :section_id")
            params["section_id"] = section_id
>>>>>>> b74972c9 (main chla leave per)
        if clauses:
            sql += " WHERE " + " AND ".join(clauses)

        print("DEBUG FILTER SQL:", sql)
        print("DEBUG FILTER PARAMS:", params)

        rows = db.execute(text(sql), params).fetchall()
        return [dict(r._mapping) for r in rows]

    except Exception:
        logging.exception("Failed to filter students")
        raise HTTPException(status_code=500, detail="Internal Server Error")



# ─── UPDATE ───────────────────────────────────────   
# @router.put("/{batch_id}", response_model=BatchOut)
# def update_batch(batch_id: int, updated: BatchCreate, db: Session = Depends(get_db)):
#     try:
#         # 1) Ensure the batch exists
#         exists = db.execute(text("SELECT 1 FROM Batch WHERE batch_id = :id"), {"id": batch_id}).fetchone()
#         if not exists:
#             raise HTTPException(status.HTTP_404_NOT_FOUND, "Batch not found")

#         # 2) Validate new student_ids against school/class/section
#         if updated.student_ids:
#             placeholders = ",".join([str(sid) for sid in updated.student_ids])
#             query = text(f"""
#                 SELECT student_details_id_pk FROM student_details
#                 WHERE student_details_id_pk IN ({placeholders})
#                 AND school_id_fk = :school_id
#                 AND class_id_fk = :class_id
#                 AND section_id_fk = :section_id
#             """)
#             result = db.execute(query, {
#                 "school_id": updated.school_id_fk,
#                 "class_id": updated.class_id,
#                 "section_id": updated.section_id
#             }).fetchall()
#             valid_ids = {row[0] for row in result}
#             if len(valid_ids) != len(updated.student_ids):
#                 raise HTTPException(status.HTTP_400_BAD_REQUEST, "One or more students are not valid or not in the selected class/section/school.")

#         # 3) Update the batch info
#         db.execute(text("""
#             UPDATE Batch SET
#               batch_name    = :batch_name,
#               school_id_fk  = :school_id_fk,
#               created_by    = :created_by,
#               class_id      = :class_id,
#               section_id    = :section_id,
#               session_id    = :session_id
#             WHERE batch_id = :batch_id
#         """), {"batch_id": batch_id, **updated.dict(exclude={"student_ids"})})

#         # 4) Delete existing students and insert only selected ones
#         db.execute(text("DELETE FROM BatchStudent WHERE batch_id = :batch_id"), {"batch_id": batch_id})
#         for sid in updated.student_ids:
#             db.execute(text("""
#                 INSERT INTO BatchStudent (batch_id, student_id)
#                 VALUES (:batch_id, :student_id)
#             """), {"batch_id": batch_id, "student_id": sid})

#         db.commit()

#         return BatchOut(batch_id=batch_id, **updated.dict())

#     except HTTPException:
#         db.rollback()
#         raise
#     except Exception:
#         db.rollback()
#         logging.exception("Failed to update batch")
#         raise HTTPException(status_code=500, detail="Internal Server Error")


@router.put("/{batch_id}", response_model=BatchOut)
def update_batch(batch_id: int, updated: BatchCreate, db: Session = Depends(get_db)):
    try:
        # Check if the batch exists
        existing_batch = db.execute(
            text("SELECT * FROM Batch WHERE batch_id = :id"), {"id": batch_id}
        ).fetchone()
        if not existing_batch:
            raise HTTPException(status_code=404, detail="Batch not found")

        # Generate batch name like: 631 CLASS X A 2025-2026
        class_row = db.execute(
            text("SELECT class FROM class_details WHERE class_id_pk = :id"),
            {"id": updated.class_id}
        ).fetchone()
        section_row = db.execute(
            text("SELECT section FROM sections WHERE section_id_pk = :id"),
            {"id": updated.section_id}
        ).fetchone()
        session_row = db.execute(
            text("SELECT session_name FROM Session WHERE session_id = :id"),
            {"id": updated.session_id}
        ).fetchone()

        if not (class_row and section_row and session_row):
            raise HTTPException(status_code=400, detail="Invalid class, section, or session ID")

        batch_name = f"{updated.school_id_fk} CLASS {class_row[0]} {section_row[0]} {session_row[0]}"

        # Update batch main table
        db.execute(
            text("""
                UPDATE Batch SET
                    batch_name    = :batch_name,
                    school_id_fk  = :school_id_fk,
                    created_by    = :created_by,
                    class_id      = :class_id,
                    section_id    = :section_id,
                    session_id    = :session_id
                WHERE batch_id = :batch_id
            """),
            {
                "batch_id": batch_id,
                "batch_name": batch_name,
                "school_id_fk": updated.school_id_fk,
                "created_by": updated.created_by,
                "class_id": updated.class_id,
                "section_id": updated.section_id,
                "session_id": updated.session_id,
            }
        )

        # Remove old student mappings
        db.execute(text("DELETE FROM BatchStudent WHERE batch_id = :batch_id"), {"batch_id": batch_id})

        # Add new student mappings
        for sid in updated.student_ids:
            db.execute(
                text("INSERT INTO BatchStudent (batch_id, student_id) VALUES (:batch_id, :student_id)"),
                {"batch_id": batch_id, "student_id": sid}
            )

        db.commit()

        return BatchOut(
            batch_id=batch_id,
            batch_name=batch_name,
            student_ids=updated.student_ids,
            school_id_fk=updated.school_id_fk,
            created_by=updated.created_by,
            class_id=updated.class_id,
            section_id=updated.section_id,
            session_id=updated.session_id
        )

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logging.exception("Failed to update batch")
<<<<<<< HEAD
        raise HTTPException(status_code=500, detail="Failed to update batch")

=======
        raise HTTPException(status_code=500, detail="Internal Server Error")
    
@router.get("/{batch_id}/students", response_model=dict)
def get_students_in_batch(batch_id: int, db: Session = Depends(get_db)):
    """
    Returns all student IDs assigned to a given batch.
    """
    rows = db.execute(text("""
        SELECT student_id FROM BatchStudent WHERE batch_id = :batch_id
    """), {"batch_id": batch_id}).fetchall()

    if not rows:
        raise HTTPException(status_code=404, detail="Batch not found or no students assigned")

    return {"student_ids": [r[0] for r in rows]}
>>>>>>> 693386cb (batches changes)



# ─── DELETE ───────────────────────────────────────
@router.delete("/{batch_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_batch(batch_id: int, db: Session = Depends(get_db)):
    try:
        # 1. Delete Attempts linked to Batch_Assignment
        db.execute(text("""
            DELETE FROM Attempt 
            WHERE batch_assignment_id IN (
                SELECT batch_assignment_id FROM Batch_Assignment WHERE batch_id_fk = :batch_id
            )
        """), {"batch_id": batch_id})

        # 2. Delete Batch_Assignment entries
        db.execute(text("DELETE FROM Batch_Assignment WHERE batch_id_fk = :batch_id"), {"batch_id": batch_id})

        # 3. Delete from BatchStudent
        db.execute(text("DELETE FROM BatchStudent WHERE batch_id = :batch_id"), {"batch_id": batch_id})

        # 4. Delete the Batch itself
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

@router.get("/{batch_id}/students")
def get_batch_students(batch_id: int, db: Session = Depends(get_db)):
    try:
        rows = db.execute(
            text("SELECT student_id FROM BatchStudent WHERE batch_id = :batch_id"),
            {"batch_id": batch_id}
        ).fetchall()
        return {"student_ids": [row.student_id for row in rows]}
    except Exception:
        logging.exception("Failed to fetch students for batch")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get("/batches")
def get_all_batches(db=Depends(get_db)):
    try:
        # Join Batch with School to include school_name
        result = db.execute(text("""
            SELECT b.batch_id, b.batch_name, s.school_name
            FROM Batch b
            JOIN school_details s ON b.school_id_fk = s.school_id_pk
        """)).fetchall()

        # Handle no data case
        if not result:
            return []

        # Prepare response
        batch_list = []
        for row in result:
            batch_list.append({
                "value": row.batch_id,
                "label": row.batch_name,
                "school_name": row.school_name
            })

        return batch_list

    except Exception as e:
        print(f"Error occurred while fetching batches: {str(e)}")
        raise HTTPException(status_code=500, detail=f" Failed to fetch batches: {str(e)}")

    
    
@router.post("/promote")
def promote_students(payload: PromotionPayload, db: Session = Depends(get_db)):
    try:
        student_ids = payload.student_ids
        new_class_id = payload.new_class_id
        new_section_id = payload.new_section_id
        new_session_id = payload.new_session_id
        new_school_id = payload.new_school_id

        print("✅ Received payload:", payload.dict())

        # ── Step 1: Fetch class, section, and session names ──────────────
        class_label = db.execute(
            text("SELECT class FROM class_details WHERE class_id_pk = :id"),
            {"id": new_class_id}
        ).scalar()

        section_label = db.execute(
            text("SELECT section FROM sections WHERE section_id_pk = :id"),
            {"id": new_section_id}
        ).scalar()

        session_name = db.execute(
            text("SELECT session_name FROM Session WHERE session_id = :id"),
            {"id": new_session_id}
        ).scalar()

        if not (class_label and section_label and session_name):
            raise HTTPException(status_code=400, detail="Invalid class, section, or session ID.")

        # ── Step 2: Format batch name ───────────────────────────────────
        batch_name = f"{new_school_id} {class_label} {section_label} {session_name}"

        # ── Step 3: Check if batch already exists ───────────────────────
        batch = db.execute(text("""
            SELECT batch_id FROM Batch
            WHERE class_id = :class_id
              AND section_id = :section_id
              AND session_id = :session_id
              AND school_id_fk = :school_id
        """), {
            "class_id": new_class_id,
            "section_id": new_section_id,
            "session_id": new_session_id,
            "school_id": new_school_id
        }).fetchone()

        if batch:
            batch_id = batch[0]
            print(f"📦 Found existing batch: {batch_id}")
        else:
            # ── Step 4: Create new batch ─────────────────────────────────
            result = db.execute(text("""
                INSERT INTO Batch (batch_name, class_id, section_id, session_id, school_id_fk, created_by)
                VALUES (:name, :class_id, :section_id, :session_id, :school_id, :created_by)
            """), {
                "name": batch_name,
                "class_id": new_class_id,
                "section_id": new_section_id,
                "session_id": new_session_id,
                "school_id": new_school_id
            })
            db.commit()
            batch_id = result.lastrowid or db.execute(text("SELECT LAST_INSERT_ID()")).scalar()
            print(f"🆕 Created new batch: {batch_id} ({batch_name})")

        # ── Step 5: Promote students and assign to batch ────────────────
        for sid in student_ids:
            # Check for existing assignment
            exists = db.execute(text("""
                SELECT 1 FROM BatchStudent
                WHERE batch_id = :batch_id AND student_id = :sid
            """), {"batch_id": batch_id, "sid": sid}).fetchone()

            if not exists:
                db.execute(text("""
                    INSERT INTO BatchStudent (batch_id, student_id)
                    VALUES (:batch_id, :sid)
                """), {"batch_id": batch_id, "sid": sid})

            # Update student academic year & new class/section
            db.execute(text("""
                UPDATE student_details
                SET class_id_fk = :class_id,
                    section_id_fk = :section_id,
                    school_id_fk = :school_id,
                    academic_year = :academic_year
                WHERE student_details_id_pk = :sid
            """), {
                "class_id": new_class_id,
                "section_id": new_section_id,
                "school_id": new_school_id,
                "academic_year": session_name,
                "sid": sid
            })

        db.commit()
        print("✅ Promotion completed successfully.")

        return {
            "message": "✅ Students promoted successfully.",
            "batch_id": batch_id,
            "batch_name": batch_name
        }

    except Exception as e:
        db.rollback()
        print("❌ Error during promotion:", str(e))
        raise HTTPException(status_code=500, detail="Internal Server Error")



    
    





































