from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Enum, Text, DateTime
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
