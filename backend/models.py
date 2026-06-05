from sqlalchemy import Column, Integer, String, Text, Float, Boolean, ForeignKey, DateTime, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True) # Nullable for Google-only signups
    full_name = Column(String, nullable=False)
    target_role = Column(String, default="Software Engineer")
    skills = Column(Text, default="") # Comma-separated or JSON string
    experience_level = Column(String, default="Entry Level") # Entry, Mid, Senior
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    sessions = relationship("InterviewSession", back_populates="user", cascade="all, delete-orphan")
    resumes = relationship("ResumeInfo", back_populates="user", cascade="all, delete-orphan")
    coding_submissions = relationship("CodingSubmission", back_populates="user", cascade="all, delete-orphan")
    challenge_submissions = relationship("DailyChallengeSubmission", back_populates="user", cascade="all, delete-orphan")


class ResumeInfo(Base):
    __tablename__ = "resume_info"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    extracted_text = Column(Text, nullable=False)
    skills = Column(Text, default="")
    experience = Column(Text, default="")
    projects = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="resumes")


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    topic = Column(String, nullable=False) # HR, Python, Data Science, ML, Custom
    difficulty = Column(String, nullable=False) # Easy, Medium, Hard
    status = Column(String, default="in_progress") # in_progress, completed
    overall_score = Column(Float, default=0.0)
    score_technical = Column(Float, default=0.0)
    score_communication = Column(Float, default=0.0)
    score_confidence = Column(Float, default=0.0)
    score_completeness = Column(Float, default=0.0)
    feedback = Column(Text, default="")
    strengths = Column(Text, default="")
    weaknesses = Column(Text, default="")
    recommended_resources = Column(Text, default="") # JSON list or Text
    resume_context = Column(Text, default="")
    time_limit = Column(Integer, default=1800) # seconds
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="sessions")
    questions = relationship("InterviewQuestion", back_populates="session", cascade="all, delete-orphan")


class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    ideal_answer = Column(Text, default="")
    question_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("InterviewSession", back_populates="questions")
    responses = relationship("InterviewResponse", back_populates="question", cascade="all, delete-orphan")


class InterviewResponse(Base):
    __tablename__ = "interview_responses"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("interview_questions.id"), nullable=False)
    user_answer = Column(Text, nullable=False)
    score_technical = Column(Float, default=0.0)
    score_communication = Column(Float, default=0.0)
    score_confidence = Column(Float, default=0.0)
    score_completeness = Column(Float, default=0.0)
    feedback = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    question = relationship("InterviewQuestion", back_populates="responses")


class CodingChallenge(Base):
    __tablename__ = "coding_challenges"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    difficulty = Column(String, nullable=False) # Easy, Medium, Hard
    starter_code = Column(Text, nullable=False)
    test_cases = Column(Text, nullable=False) # JSON list of {input: str, expected: str}
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    submissions = relationship("CodingSubmission", back_populates="challenge", cascade="all, delete-orphan")


class CodingSubmission(Base):
    __tablename__ = "coding_submissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    challenge_id = Column(Integer, ForeignKey("coding_challenges.id"), nullable=False)
    submitted_code = Column(Text, nullable=False)
    score = Column(Float, default=0.0)
    evaluation = Column(Text, default="")
    status = Column(String, default="failed") # passed, failed
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="coding_submissions")
    challenge = relationship("CodingChallenge", back_populates="submissions")


class DailyChallenge(Base):
    __tablename__ = "daily_challenges"

    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String, nullable=False)
    question_text = Column(Text, nullable=False)
    assigned_date = Column(Date, unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    submissions = relationship("DailyChallengeSubmission", back_populates="challenge", cascade="all, delete-orphan")


class DailyChallengeSubmission(Base):
    __tablename__ = "daily_challenge_submissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    daily_challenge_id = Column(Integer, ForeignKey("daily_challenges.id"), nullable=False)
    user_answer = Column(Text, nullable=False)
    score = Column(Float, default=0.0)
    feedback = Column(Text, default="")
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="challenge_submissions")
    challenge = relationship("DailyChallenge", back_populates="submissions")
