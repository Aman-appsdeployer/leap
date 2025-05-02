from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Enum, Text, DateTime ,Date
from sqlalchemy.orm import relationship
from db.database import Base
import enum
from datetime import datetime



class QuestionTypeEnum(str, enum.Enum):
    MCQ = "MCQ"
    Descriptive = "Descriptive"

class Quiz(Base):
    __tablename__ = "Quiz"

    quiz_id = Column(Integer, primary_key=True, index=True)
    quiz_title = Column(String(255), nullable=False)
    description = Column(Text)
    created_by_mentor_id_fk = Column(Integer, nullable=False)
    is_open = Column(Boolean, default=True)
    start_time = Column(DateTime, default=datetime.utcnow)

    questions = relationship("Question", back_populates="quiz", cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = "Question"

    question_id = Column(Integer, primary_key=True, index=True)
    quiz_id_fk = Column(Integer, ForeignKey("Quiz.quiz_id"))
    question_text = Column(Text, nullable=False)
    question_type = Column(Enum(QuestionTypeEnum), nullable=False)
    points = Column(Integer, default=1)

    quiz = relationship("Quiz", back_populates="questions")
    options = relationship("QuestionOption", back_populates="question", cascade="all, delete-orphan")

class QuestionOption(Base):
    __tablename__ = "QuestionOption"

    option_id = Column(Integer, primary_key=True, index=True)
    question_id_fk = Column(Integer, ForeignKey("Question.question_id"))
    option_text = Column(Text, nullable=False)
    is_correct = Column(Boolean, default=False)

    question = relationship("Question", back_populates="options")



class Class(Base):
    __tablename__ = "class"
    class_id = Column(Integer, primary_key=True)
    class_name = Column(String)

class Section(Base):
    __tablename__ = "section"
    section_id = Column(Integer, primary_key=True)
    section_name = Column(String)

class Session(Base):
    __tablename__ = "session"
    session_id = Column(Integer, primary_key=True)
    session_name = Column(String)
    is_current = Column(Enum("0", "1"))

class StudentDetails(Base):
    __tablename__ = "student_details"
    student_details_id_pk = Column(Integer, primary_key=True)
    name = Column(String)
    phone = Column(String(15))
    email = Column(String)
    dob = Column(Date)
    gender = Column(String(25))
    caste = Column(String(50))
    school_id_fk = Column(Integer)
    other_school = Column(String)
    class_id_fk = Column(Integer)
    section_id_fk = Column(Integer)
    state_id_fk = Column(Integer)
    district_id_fk = Column(Integer)
    city_village_flag = Column(Enum("C", "V"))
    city_village_name = Column(String)
    parent_consent_form = Column(Text)
    reg_date = Column(Date)
    verify_status = Column(Enum("V", "P", "R"))
    email_verify_status = Column(Enum("Y", "N"))
    active_status = Column(Enum("A", "I", "D"))

class BatchStudent(Base):
    __tablename__ = "batch_student"
    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("student_details.student_details_id_pk"))
    batch_id = Column(Integer)
