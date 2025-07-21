from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    Boolean,
    Enum,
    Text,
    DateTime,
    Date
)
from sqlalchemy.orm import relationship
from db.database import Base
from datetime import datetime
import enum
from sqlalchemy.sql import func



# ─── ENUM DEFINITIONS ─────────────────────────────
class QuestionTypeEnum(str, enum.Enum):
    MCQ = "MCQ"
    Descriptive = "Descriptive"


class IsCurrentEnum(str, enum.Enum):
    NO = "0"
    YES = "1"


class CityVillageEnum(str, enum.Enum):
    CITY = "C"
    VILLAGE = "V"


class VerifyStatusEnum(str, enum.Enum):
    VERIFIED = "V"
    PENDING = "P"
    REJECTED = "R"


class EmailVerifyEnum(str, enum.Enum):
    YES = "Y"
    NO = "N"


class ActiveStatusEnum(str, enum.Enum):
    ACTIVE = "A"
    INACTIVE = "I"
    DELETED = "D"
    
class AttemptTypeEnum(str, enum.Enum):
    PRE = "pre"
    POST = "post"


# ─── QUIZ MODELS ──────────────────────────────────
class Quiz(Base):
    __tablename__ = "Quiz"

    quiz_id = Column(Integer, primary_key=True, index=True)
    quiz_title = Column(String(255), nullable=False)
    description = Column(Text)
    created_by_mentor_id_fk = Column(Integer, nullable=False)
    is_open = Column(Boolean, default=True)
    start_time = Column(DateTime, default=datetime.utcnow)

    questions = relationship("Question", back_populates="quiz", cascade="all, delete-orphan")
    assignments = relationship("BatchAssignment", back_populates="quiz", cascade="all, delete-orphan")
    # This relationship is correct for linking Quiz to its Attempts
    attempts = relationship("Attempt", back_populates="quiz", cascade="all, delete-orphan") 


class Question(Base):
    __tablename__ = "Question"

    question_id = Column(Integer, primary_key=True, index=True)
    quiz_id_fk = Column(Integer, ForeignKey("Quiz.quiz_id", ondelete="CASCADE"))
    question_text = Column(Text, nullable=False)
    question_type = Column(Enum(QuestionTypeEnum), nullable=False)
    points = Column(Integer, default=1)

    quiz = relationship("Quiz", back_populates="questions")
    options = relationship("QuestionOption", back_populates="question", cascade="all, delete-orphan")


class QuestionOption(Base):
    __tablename__ = "QuestionOption"

    option_id = Column(Integer, primary_key=True, index=True)
    question_id_fk = Column(Integer, ForeignKey("Question.question_id", ondelete="CASCADE"))
    option_text = Column(Text, nullable=False)
    is_correct = Column(Boolean, default=False)

    question = relationship("Question", back_populates="options")


# ─── STUDENT AND SCHOOL MODELS ─────────────────────
class StudentDetails(Base):
    __tablename__ = "student_details"

    student_details_id_pk = Column(Integer, primary_key=True)
    name = Column(String(255))
    phone = Column(String(15))
    email = Column(String(255), index=True)
    dob = Column(Date)
    gender = Column(String(25))
    caste = Column(String(50))
    school_id_fk = Column(Integer)
    other_school = Column(String(255))
    class_id_fk = Column(Integer)
    section_id_fk = Column(Integer)
    state_id_fk = Column(Integer)
    district_id_fk = Column(Integer)
    city_village_flag = Column(Enum(CityVillageEnum))
    city_village_name = Column(String(255))
    parent_consent_form = Column(Text)
    reg_date = Column(Date)
    verify_status = Column(Enum(VerifyStatusEnum))
    email_verify_status = Column(Enum(EmailVerifyEnum))
    active_status = Column(Enum(ActiveStatusEnum))

    batches = relationship("BatchStudent", back_populates="student", cascade="all, delete-orphan")
    assignments = relationship("BatchAssignment", back_populates="student", cascade="all, delete-orphan")


# ─── BATCH MODELS ─────────────────────────────────
class Batch(Base):
    __tablename__ = "Batch"

    batch_id = Column(Integer, primary_key=True, autoincrement=True)
    batch_name = Column(String(255), nullable=False)
    school_id_fk = Column(Integer, nullable=False)
    created_by = Column(Integer, nullable=False)
    class_id = Column(Integer, nullable=False)
    section_id = Column(Integer, nullable=False)
    session_id = Column(Integer, nullable=False)

    students = relationship("BatchStudent", back_populates="batch", cascade="all, delete-orphan")
    assignments = relationship("BatchAssignment", back_populates="batch", cascade="all, delete-orphan")


class BatchStudent(Base):
    __tablename__ = "BatchStudent"

    id = Column(Integer, primary_key=True, autoincrement=True)
    batch_id = Column(Integer, ForeignKey("Batch.batch_id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("student_details.student_details_id_pk", ondelete="CASCADE"), nullable=False)

    batch = relationship("Batch", back_populates="students")
    student = relationship("StudentDetails", back_populates="batches")


# ─── SUPPORT TABLES ───────────────────────────────
class ClassDetails(Base):
    __tablename__ = "class_details"

    class_id_pk = Column(Integer, primary_key=True, index=True)
    class_name = Column("class", String(255))
    active_status = Column(Enum(ActiveStatusEnum))


class Section(Base):
    __tablename__ = "sections"

    section_id = Column("section_id_pk", Integer, primary_key=True, autoincrement=True)
    section_name = Column("section", String(255))
    active_status = Column(Enum(ActiveStatusEnum))


class SessionModel(Base):
    __tablename__ = "session"

    session_id = Column(Integer, primary_key=True)
    session_name = Column(String(255))
    is_current = Column(Enum(IsCurrentEnum))


# ─── ASSIGNMENT TABLE ─────────────────────────────
class BatchAssignment(Base):
    __tablename__ = "BatchAssignment"

    # Assuming 'id' is the primary key column name.
    # If your database table uses 'batch_assignment_id' as the primary key name,
    # you might need to adjust the column definition here and in SQL queries.
    id = Column(Integer, primary_key=True, autoincrement=True) 
    batch_id_fk = Column(Integer, ForeignKey("Batch.batch_id", ondelete="CASCADE"), nullable=False)
    quiz_id_fk = Column(Integer, ForeignKey("Quiz.quiz_id", ondelete="CASCADE"), nullable=False)
    student_id_fk = Column(Integer, ForeignKey("student_details.student_details_id_pk", ondelete="CASCADE"), nullable=False)

    batch = relationship("Batch", back_populates="assignments")
    quiz = relationship("Quiz", back_populates="assignments")
    student = relationship("StudentDetails", back_populates="assignments")
    
    
class Attempt(Base):
    __tablename__ = "Attempt"

    attempt_id = Column(Integer, primary_key=True, autoincrement=True)
    batch_assignment_id = Column(Integer, ForeignKey("BatchAssignment.id"), nullable=False)
    student_id_fk = Column(Integer, ForeignKey("student_details.student_details_id_pk"), nullable=False)
    attempt_date = Column(DateTime, default=datetime.utcnow)
    attempt_type = Column(Enum(AttemptTypeEnum), nullable=False)
    attempt_number = Column(Integer, default=1)
    score = Column(Integer, default=0)

    # Removed quiz relationship and quiz_id_fk — not in the table
    responses = relationship("Response", back_populates="attempt", cascade="all, delete-orphan")


# ─── RESPONSE MODEL ─────────────────────────────
class Response(Base):
    __tablename__ = "Response"

    response_id = Column(Integer, primary_key=True, autoincrement=True)
    attempt_id_fk = Column(Integer, ForeignKey("Attempt.attempt_id"), nullable=False)
    question_id_fk = Column(Integer, ForeignKey("Question.question_id"), nullable=False)
    response_text = Column(Text)

    attempt = relationship("Attempt", back_populates="responses")
    question = relationship("Question") 

# ─── PROJECT MODEL ────────────────────────────────
class Project(Base):
    __tablename__ = "projects"

    project_id_pk = Column(Integer, primary_key=True, autoincrement=True)
    student_id_fk = Column(Integer, nullable=False)
    school_id_fk = Column(Integer, nullable=False)
    class_id_fk = Column(Integer, nullable=False)
    section_id_fk = Column(Integer, nullable=False)
    topic_id_fk = Column(Integer, nullable=False)
    other_topic = Column(String(255))
    project_title = Column(Text, nullable=False)
    project_details = Column(Text, nullable=False)
    subject_id_fk = Column(Integer, nullable=False)
    project_language = Column(String(255), nullable=False)
    project_file_path = Column(Text, nullable=False)
    project_thumbnail = Column(Text)
    file_type_id_fk = Column(Integer, nullable=False)
    project_month = Column(String(25), nullable=False)
    project_year = Column(String(5), nullable=False)
    uploaded_by_user_id = Column(Integer, nullable=False)
    uploaded_by_user_type = Column(Integer, nullable=False)
    upload_date = Column(Date, default=datetime.utcnow)
    verify_status = Column(Enum(VerifyStatusEnum), default=VerifyStatusEnum.PENDING)
    project_rating = Column(String(12), default="")
    project_remarks = Column(Text, default="")
    active_status = Column(Enum(ActiveStatusEnum), default=ActiveStatusEnum.ACTIVE)


    
# ─── PROJECT LANGUAGE MODEL ───────────────────────


class ProjectLanguage(Base):
    __tablename__ = "project_language"

    language_id_pk = Column(Integer, primary_key=True, autoincrement=True)
    language = Column(String(255), nullable=False)
    active_status = Column(Enum(ActiveStatusEnum), default=ActiveStatusEnum.ACTIVE)
    
class Topic(Base):
    __tablename__ = "topics"

    topic_id_pk = Column(Integer, primary_key=True, autoincrement=True)
    topic = Column(Text, nullable=False)
    active_status = Column(Enum(ActiveStatusEnum), default=ActiveStatusEnum.ACTIVE)

class FileType(Base):
    __tablename__ = "file_type"

    file_type_id_pk = Column(Integer, primary_key=True, autoincrement=True)
    file_type = Column(String(255), nullable=False)
    active_status = Column(Enum(ActiveStatusEnum), default=ActiveStatusEnum.ACTIVE)


class Post(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    html = Column(Text, nullable=False)
    css = Column(Text, nullable=False)
    created_by = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    images = relationship("PostImage", back_populates="post", cascade="all, delete", lazy="joined")

class PostImage(Base):
    __tablename__ = "post_images"
    id = Column(Integer, primary_key=True)
    image_url = Column(String(255), nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id"))
    post = relationship("Post", back_populates="images")

# # ─── POST MODEL ───────────────────────────────────


    
    
    
    
    
    
    
    
    






     




    
    
    
    
