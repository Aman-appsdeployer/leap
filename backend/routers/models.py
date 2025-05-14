from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Enum, Text, DateTime, Date
from sqlalchemy.orm import relationship
from db.database import Base
import enum
from datetime import datetime

# Enums
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

# Models
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

class ClassModel(Base):  # Renamed to avoid conflict with `class` keyword
    __tablename__ = "class"
    class_id = Column(Integer, primary_key=True)
    class_name = Column(String)

class SectionModel(Base):  # Renamed for clarity
    __tablename__ = "section"
    section_id = Column(Integer, primary_key=True)
    section_name = Column(String)

class SessionModel(Base):  # Renamed for consistency
    __tablename__ = "session"
    session_id = Column(Integer, primary_key=True)
    session_name = Column(String)
    is_current = Column(Enum(IsCurrentEnum))

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
    city_village_flag = Column(Enum(CityVillageEnum))
    city_village_name = Column(String)
    parent_consent_form = Column(Text)
    reg_date = Column(Date)
    verify_status = Column(Enum(VerifyStatusEnum))
    email_verify_status = Column(Enum(EmailVerifyEnum))
    active_status = Column(Enum(ActiveStatusEnum))

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

class BatchStudent(Base):
    __tablename__ = "BatchStudent"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    batch_id = Column(Integer, ForeignKey("Batch.batch_id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("student_details.student_details_id_pk", ondelete="CASCADE"), nullable=False)

    batch = relationship("Batch", back_populates="students")




    
    
    
    
    
# from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Enum, Text, DateTime, Date
# from sqlalchemy.orm import relationship
# from db.database import Base
# import enum
# from datetime import datetime

# # Enums for reuse
# class QuestionTypeEnum(str, enum.Enum):
#     MCQ = "MCQ"
#     Descriptive = "Descriptive"

# class YesNoEnum(str, enum.Enum):
#     Y = "Y"
#     N = "N"

# class VerifyStatusEnum(str, enum.Enum):
#     V = "V"  # Verified
#     P = "P"  # Pending
#     R = "R"  # Rejected

# class ActiveStatusEnum(str, enum.Enum):
#     A = "A"  # Active
#     I = "I"  # Inactive
#     D = "D"  # Disabled

# class CityVillageEnum(str, enum.Enum):
#     C = "C"  # City
#     V = "V"  # Village

# # Quiz system
# class Quiz(Base):
#     __tablename__ = "quiz"

#     quiz_id = Column(Integer, primary_key=True, index=True)
#     quiz_title = Column(String(255), nullable=False)
#     description = Column(Text)
#     created_by_mentor_id_fk = Column(Integer, nullable=False)
#     is_open = Column(Boolean, default=True)
#     start_time = Column(DateTime, default=datetime.utcnow)

#     questions = relationship("Question", back_populates="quiz", cascade="all, delete-orphan")
#     quiz_assignments = relationship("BatchAssignment", back_populates="quiz", cascade="all, delete")

#     def __repr__(self):
#         return f"<Quiz(id={self.quiz_id}, title={self.quiz_title})>"

# class Question(Base):
#     __tablename__ = "question"

#     question_id = Column(Integer, primary_key=True, index=True)
#     quiz_id_fk = Column(Integer, ForeignKey("quiz.quiz_id", ondelete="CASCADE"))
#     question_text = Column(Text, nullable=False)
#     question_type = Column(Enum(QuestionTypeEnum), nullable=False)
#     points = Column(Integer, default=1)

#     quiz = relationship("Quiz", back_populates="questions")
#     options = relationship("QuestionOption", back_populates="question", cascade="all, delete-orphan")

# class QuestionOption(Base):
#     __tablename__ = "question_option"

#     option_id = Column(Integer, primary_key=True, index=True)
#     question_id_fk = Column(Integer, ForeignKey("question.question_id", ondelete="CASCADE"))
#     option_text = Column(Text, nullable=False)
#     is_correct = Column(Boolean, default=False)

#     question = relationship("Question", back_populates="options")

# # Core reference tables
# class Class(Base):
#     __tablename__ = "class"

#     class_id = Column(Integer, primary_key=True)
#     class_name = Column(String)

# class Section(Base):
#     __tablename__ = "section"

#     section_id = Column(Integer, primary_key=True)
#     section_name = Column(String)

# class Session(Base):
#     __tablename__ = "session"

#     session_id = Column(Integer, primary_key=True)
#     session_name = Column(String)
#     is_current = Column(Enum("0", "1"))  # You can also convert this to Boolean or an Enum if preferred

# # Student table
# class StudentDetails(Base):
#     __tablename__ = "student_details"

#     student_details_id_pk = Column(Integer, primary_key=True)
#     name = Column(String)
#     phone = Column(String(15))
#     email = Column(String)
#     dob = Column(Date)
#     gender = Column(String(25))
#     caste = Column(String(50))
#     school_id_fk = Column(Integer)
#     other_school = Column(String)
#     class_id_fk = Column(Integer)
#     section_id_fk = Column(Integer)
#     state_id_fk = Column(Integer)
#     district_id_fk = Column(Integer)
#     city_village_flag = Column(Enum(CityVillageEnum))
#     city_village_name = Column(String)
#     parent_consent_form = Column(Text)
#     reg_date = Column(Date)
#     verify_status = Column(Enum(VerifyStatusEnum), default=VerifyStatusEnum.P)  # Default to Pending
#     email_verify_status = Column(Enum(YesNoEnum), default=YesNoEnum.N)  # Default to No
#     active_status = Column(Enum(ActiveStatusEnum), default=ActiveStatusEnum.A)  # Default to Active

#     student_assignments = relationship("BatchAssignment", back_populates="student", cascade="all, delete")
#     batch_links = relationship("BatchStudent", back_populates="student", cascade="all, delete")

# # Batch table
# class Batch(Base):
#     __tablename__ = "batch"

#     batch_id = Column(Integer, primary_key=True, autoincrement=True)
#     batch_name = Column(String(255), nullable=False)
#     school_id_fk = Column(Integer, nullable=False)
#     created_by = Column(Integer, nullable=False)
#     class_id = Column(Integer, nullable=False)
#     section_id = Column(Integer, nullable=False)
#     session_id = Column(Integer, nullable=False)

#     students = relationship("BatchStudent", back_populates="batch", cascade="all, delete")
#     batch_assignments = relationship("BatchAssignment", back_populates="batch", cascade="all, delete")

# # Linking students to batches
# class BatchStudent(Base):
#     __tablename__ = "batch_student"

#     id = Column(Integer, primary_key=True, autoincrement=True)
#     batch_id = Column(Integer, ForeignKey("batch.batch_id", ondelete="CASCADE"), nullable=False)
#     student_id = Column(Integer, ForeignKey("student_details.student_details_id_pk", ondelete="CASCADE"), nullable=False)

#     batch = relationship("Batch", back_populates="students")
#     student = relationship("StudentDetails", back_populates="batch_links")

# # Batch-Quiz-Student assignment mapping
# class BatchAssignment(Base):
#     __tablename__ = "batch_assignment"

#     batch_assignment_id = Column(Integer, primary_key=True)
#     batch_id_fk = Column(Integer, ForeignKey("batch.batch_id", ondelete="CASCADE"))
#     quiz_id_fk = Column(Integer, ForeignKey("quiz.quiz_id", ondelete="CASCADE"))
#     student_id_fk = Column(Integer, ForeignKey("student_details.student_details_id_pk", ondelete="CASCADE"))

#     batch = relationship("Batch", back_populates="batch_assignments")
#     quiz = relationship("Quiz", back_populates="quiz_assignments")
#     student = relationship("StudentDetails", back_populates="student_assignments")
