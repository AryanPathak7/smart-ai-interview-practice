from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date

# --- AUTH & USER SCHEMAS ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleLogin(BaseModel):
    token: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    target_role: Optional[str] = None
    skills: Optional[str] = None
    experience_level: Optional[str] = None

class UserResponse(UserBase):
    id: int
    target_role: str
    skills: str
    experience_level: str
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None


# --- INTERVIEW SCHEMAS ---
class SessionCreate(BaseModel):
    topic: str # HR, Python, Data Science, ML, Custom
    difficulty: str # Easy, Medium, Hard
    use_resume: bool = False

class QuestionResponse(BaseModel):
    id: int
    session_id: int
    question_text: str
    question_order: int

    class Config:
        from_attributes = True

class AnswerSubmit(BaseModel):
    user_answer: str

class AnswerEvaluationResponse(BaseModel):
    score_technical: float
    score_communication: float
    score_confidence: float
    score_completeness: float
    feedback: str
    ideal_answer: str

class ResponseDetail(BaseModel):
    id: int
    question_text: str
    user_answer: str
    score_technical: float
    score_communication: float
    score_confidence: float
    score_completeness: float
    feedback: str

class SessionResponse(BaseModel):
    id: int
    topic: str
    difficulty: str
    status: str
    overall_score: float
    created_at: datetime

    class Config:
        from_attributes = True

class SessionDetailResponse(SessionResponse):
    score_technical: float
    score_communication: float
    score_confidence: float
    score_completeness: float
    feedback: str
    strengths: str
    weaknesses: str
    recommended_resources: str
    responses: List[ResponseDetail] = []

    class Config:
        from_attributes = True


# --- RESUME SCHEMAS ---
class ResumeResponse(BaseModel):
    id: int
    filename: str
    skills: str
    experience: str
    projects: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- CODING CHALLENGE SCHEMAS ---
class CodingChallengeResponse(BaseModel):
    id: int
    title: str
    description: str
    difficulty: str
    starter_code: str

    class Config:
        from_attributes = True

class CodeSubmissionCreate(BaseModel):
    submitted_code: str

class CodingSubmissionResponse(BaseModel):
    id: int
    challenge_id: int
    submitted_code: str
    score: float
    evaluation: str
    status: str
    submitted_at: datetime

    class Config:
        from_attributes = True


# --- DAILY CHALLENGE SCHEMAS ---
class DailyChallengeResponse(BaseModel):
    id: int
    topic: str
    question_text: str
    assigned_date: date

    class Config:
        from_attributes = True

class DailyChallengeSubmissionResponse(BaseModel):
    id: int
    daily_challenge_id: int
    user_answer: str
    score: float
    feedback: str
    submitted_at: datetime

    class Config:
        from_attributes = True


# --- DASHBOARD & ANALYTICS SCHEMAS ---
class TopicScore(BaseModel):
    topic: str
    average_score: float
    count: int

class TrendPoint(BaseModel):
    date: str
    score: float

class DashboardStats(BaseModel):
    total_interviews: int
    average_score: float
    streak_days: int
    weakest_topics: List[TopicScore] = []
    performance_trend: List[TrendPoint] = []
    interview_history: List[SessionResponse] = []
    leaderboard: List[dict] = []
