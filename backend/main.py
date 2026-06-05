import io
import json
from datetime import datetime, date, timedelta
from typing import List, Dict, Any

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import EmailStr

import models
import schemas
import auth
import ai_service
from database import engine, get_db, Base
from config import settings

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event to seed database
@app.on_event("startup")
def seed_database():
    db = next(get_db())
    try:
        # Check if admin user exists
        admin = db.query(models.User).filter(models.User.email == "admin@platform.com").first()
        if not admin:
            admin_user = models.User(
                email="admin@platform.com",
                full_name="System Administrator",
                hashed_password=auth.get_password_hash("admin123"),
                target_role="Manager",
                skills="Leadership, System Design, Analytics",
                experience_level="Senior",
                is_admin=True
            )
            db.add(admin_user)
            
        # Check if demo user exists
        demo = db.query(models.User).filter(models.User.email == "candidate@example.com").first()
        if not demo:
            demo_user = models.User(
                email="candidate@example.com",
                full_name="Jane Doe",
                hashed_password=auth.get_password_hash("password123"),
                target_role="Data Scientist",
                skills="Python, SQL, Machine Learning, Pandas, Scikit-Learn",
                experience_level="Entry Level"
            )
            db.add(demo_user)

        # Seed Coding Challenges
        challenges_count = db.query(models.CodingChallenge).count()
        if challenges_count == 0:
            ch1 = models.CodingChallenge(
                title="Two Sum (Python)",
                description="Write a function `two_sum(nums: list, target: int) -> list` that returns the indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution.\n\nExample:\nInput: nums = [2, 7, 11, 15], target = 9\nOutput: [0, 1] because nums[0] + nums[1] == 9.",
                difficulty="Easy",
                starter_code="def two_sum(nums: list, target: int) -> list:\n    # Write your code here\n    pass",
                test_cases=json.dumps([
                    {"input": "[2, 7, 11, 15], 9", "expected": "[0, 1]"},
                    {"input": "[3, 2, 4], 6", "expected": "[1, 2]"}
                ])
            )
            ch2 = models.CodingChallenge(
                title="Palindrome Check",
                description="Write a function `is_palindrome(s: str) -> bool` that checks if a string is a palindrome. A palindrome reads the same backwards as forwards, ignoring spaces and casing.\n\nExample:\nInput: s = \"A man a plan a canal Panama\"\nOutput: True",
                difficulty="Easy",
                starter_code="def is_palindrome(s: str) -> bool:\n    # Write your code here\n    pass",
                test_cases=json.dumps([
                    {"input": "'racecar'", "expected": "True"},
                    {"input": "'hello'", "expected": "False"},
                    {"input": "'A man a plan a canal Panama'", "expected": "True"}
                ])
            )
            ch3 = models.CodingChallenge(
                title="FizzBuzz",
                description="Write a function `fizz_buzz(n: int) -> list` that returns a list of strings from 1 to n. For multiples of three, append 'Fizz', for multiples of five append 'Buzz', and for multiples of both append 'FizzBuzz'.\n\nExample:\nInput: n = 5\nOutput: ['1', '2', 'Fizz', '4', 'Buzz']",
                difficulty="Easy",
                starter_code="def fizz_buzz(n: int) -> list:\n    # Write your code here\n    pass",
                test_cases=json.dumps([
                    {"input": "3", "expected": "['1', '2', 'Fizz']"},
                    {"input": "5", "expected": "['1', '2', 'Fizz', '4', 'Buzz']"},
                    {"input": "15", "expected": "['1', '2', 'Fizz', '4', 'Buzz', 'Fizz', '7', '8', 'Fizz', 'Buzz', '11', 'Fizz', '13', '14', 'FizzBuzz']"}
                ])
            )
            db.add_all([ch1, ch2, ch3])

        # Seed Daily Challenges
        today = date.today()
        daily_challenge = db.query(models.DailyChallenge).filter(models.DailyChallenge.assigned_date == today).first()
        if not daily_challenge:
            d1 = models.DailyChallenge(
                topic="Machine Learning",
                question_text="Explain the difference between overfitting and underfitting in Machine Learning, and how regularization can prevent overfitting.",
                assigned_date=today
            )
            # Create a backup for tomorrow
            d2 = models.DailyChallenge(
                topic="Python",
                question_text="What is the GIL (Global Interpreter Lock) in Python and how does it affect multi-threaded programs?",
                assigned_date=today + timedelta(days=1)
            )
            db.add_all([d1, d2])

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error seeding DB: {e}")
    finally:
        db.close()


# --- AUTH ENDPOINTS ---

@app.post("/api/auth/signup", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def signup(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user_in.password)
    user = models.User(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@app.post("/api/auth/login", response_model=schemas.Token)
def login(user_in: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if not user or not user.hashed_password or not auth.verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@app.post("/api/auth/google-login", response_model=schemas.Token)
def google_login(payload: schemas.GoogleLogin, db: Session = Depends(get_db)):
    google_data = auth.verify_google_token(payload.token)
    email = google_data.get("email")
    name = google_data.get("name")
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        user = models.User(
            email=email,
            full_name=name,
            hashed_password=None, # Google OAuth signup, no password needed
            target_role="Software Engineer",
            skills="",
            experience_level="Entry Level"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@app.get("/api/auth/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.put("/api/auth/profile", response_model=schemas.UserResponse)
def update_profile(user_update: schemas.UserUpdate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    if user_update.target_role is not None:
        current_user.target_role = user_update.target_role
    if user_update.skills is not None:
        current_user.skills = user_update.skills
    if user_update.experience_level is not None:
        current_user.experience_level = user_update.experience_level
        
    db.commit()
    db.refresh(current_user)
    return current_user


# --- RESUME ENDPOINTS ---

@app.post("/api/resumes/upload", response_model=schemas.ResumeResponse)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
    try:
        from pypdf import PdfReader
        file_bytes = await file.read()
        pdf_file = io.BytesIO(file_bytes)
        reader = PdfReader(pdf_file)
        
        extracted_text = ""
        for page in reader.pages:
            text = page.extract_text()
            if text:
                extracted_text += text + "\n"
                
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF")
            
        # Analyze resume using AI
        analysis = ai_service.parse_resume(extracted_text)
        
        resume_info = models.ResumeInfo(
            user_id=current_user.id,
            filename=file.filename,
            extracted_text=extracted_text,
            skills=analysis.get("skills", ""),
            experience=analysis.get("experience", ""),
            projects=analysis.get("projects", "")
        )
        db.add(resume_info)
        
        # Update user's skills and experience based on resume
        if analysis.get("skills"):
            current_user.skills = analysis.get("skills")
            
        db.commit()
        db.refresh(resume_info)
        return resume_info
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to process resume: {str(e)}")


# --- INTERVIEW ENDPOINTS ---

@app.post("/api/interviews/sessions", response_model=schemas.SessionResponse)
def create_session(
    session_in: schemas.SessionCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    resume_context = ""
    if session_in.use_resume:
        latest_resume = db.query(models.ResumeInfo).filter(models.ResumeInfo.user_id == current_user.id).order_by(models.ResumeInfo.created_at.desc()).first()
        if latest_resume:
            resume_context = f"Skills: {latest_resume.skills}. Experience: {latest_resume.experience}. Projects: {latest_resume.projects}"
        else:
            raise HTTPException(status_code=400, detail="No resume uploaded yet. Please upload a resume first.")

    # Create new session
    session = models.InterviewSession(
        user_id=current_user.id,
        topic=session_in.topic,
        difficulty=session_in.difficulty,
        status="in_progress",
        resume_context=resume_context
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    
    # Generate the first question
    first_q = ai_service.generate_next_question(
        topic=session.topic,
        difficulty=session.difficulty,
        target_role=current_user.target_role,
        skills=current_user.skills,
        history=[],
        resume_context=resume_context
    )
    
    question = models.InterviewQuestion(
        session_id=session.id,
        question_text=first_q["question_text"],
        ideal_answer=first_q["ideal_answer"],
        question_order=1
    )
    db.add(question)
    db.commit()
    
    return session

@app.get("/api/interviews/sessions", response_model=List[schemas.SessionResponse])
def list_sessions(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    return db.query(models.InterviewSession).filter(models.InterviewSession.user_id == current_user.id).order_by(models.InterviewSession.created_at.desc()).all()

@app.get("/api/interviews/sessions/{session_id}", response_model=schemas.SessionDetailResponse)
def get_session(session_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    session = db.query(models.InterviewSession).filter(
        models.InterviewSession.id == session_id,
        models.InterviewSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
    
    # Map questions and user responses
    responses_list = []
    for question in session.questions:
        resp = db.query(models.InterviewResponse).filter(models.InterviewResponse.question_id == question.id).first()
        responses_list.append({
            "id": question.id,
            "question_text": question.question_text,
            "user_answer": resp.user_answer if resp else "",
            "score_technical": resp.score_technical if resp else 0.0,
            "score_communication": resp.score_communication if resp else 0.0,
            "score_confidence": resp.score_confidence if resp else 0.0,
            "score_completeness": resp.score_completeness if resp else 0.0,
            "feedback": resp.feedback if resp else ""
        })
        
    return {
        "id": session.id,
        "topic": session.topic,
        "difficulty": session.difficulty,
        "status": session.status,
        "overall_score": session.overall_score,
        "score_technical": session.score_technical,
        "score_communication": session.score_communication,
        "score_confidence": session.score_confidence,
        "score_completeness": session.score_completeness,
        "feedback": session.feedback,
        "strengths": session.strengths,
        "weaknesses": session.weaknesses,
        "recommended_resources": session.recommended_resources,
        "created_at": session.created_at,
        "responses": responses_list
    }

@app.get("/api/interviews/sessions/{session_id}/next-question", response_model=schemas.QuestionResponse)
def get_next_question(
    session_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(models.InterviewSession).filter(
        models.InterviewSession.id == session_id,
        models.InterviewSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status == "completed":
        raise HTTPException(status_code=400, detail="Session is already completed")
        
    # Check if the latest question has already been answered. If not, return it.
    latest_q = db.query(models.InterviewQuestion).filter(
        models.InterviewQuestion.session_id == session.id
    ).order_by(models.InterviewQuestion.question_order.desc()).first()
    
    if latest_q:
        resp = db.query(models.InterviewResponse).filter(models.InterviewResponse.question_id == latest_q.id).first()
        if not resp:
            return latest_q
            
    # Maximum 5 questions per session
    current_q_count = len(session.questions)
    if current_q_count >= 5:
        raise HTTPException(status_code=400, detail="Reached maximum questions. Please complete the interview.")
        
    # Construct history
    history = []
    for q in session.questions:
        r = db.query(models.InterviewResponse).filter(models.InterviewResponse.question_id == q.id).first()
        if r:
            history.append({"question": q.question_text, "answer": r.user_answer})
            
    # Generate new question
    next_q_data = ai_service.generate_next_question(
        topic=session.topic,
        difficulty=session.difficulty,
        target_role=current_user.target_role,
        skills=current_user.skills,
        history=history,
        resume_context=session.resume_context
    )
    
    next_q = models.InterviewQuestion(
        session_id=session.id,
        question_text=next_q_data["question_text"],
        ideal_answer=next_q_data["ideal_answer"],
        question_order=current_q_count + 1
    )
    db.add(next_q)
    db.commit()
    db.refresh(next_q)
    return next_q

@app.post("/api/interviews/questions/{question_id}/respond", response_model=schemas.AnswerEvaluationResponse)
def respond_to_question(
    question_id: int,
    answer_in: schemas.AnswerSubmit,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    question = db.query(models.InterviewQuestion).filter(models.InterviewQuestion.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    # Verify ownership
    session = db.query(models.InterviewSession).filter(
        models.InterviewSession.id == question.session_id,
        models.InterviewSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    # Check if already responded
    existing_resp = db.query(models.InterviewResponse).filter(models.InterviewResponse.question_id == question.id).first()
    if existing_resp:
        raise HTTPException(status_code=400, detail="Already responded to this question")
        
    # Evaluate with AI
    evaluation = ai_service.evaluate_answer(
        question=question.question_text,
        ideal_answer=question.ideal_answer,
        user_answer=answer_in.user_answer
    )
    
    response = models.InterviewResponse(
        question_id=question.id,
        user_answer=answer_in.user_answer,
        score_technical=evaluation["score_technical"],
        score_communication=evaluation["score_communication"],
        score_confidence=evaluation["score_confidence"],
        score_completeness=evaluation["score_completeness"],
        feedback=evaluation["feedback"]
    )
    
    db.add(response)
    db.commit()
    db.refresh(response)
    
    return {
        "score_technical": response.score_technical,
        "score_communication": response.score_communication,
        "score_confidence": response.score_confidence,
        "score_completeness": response.score_completeness,
        "feedback": response.feedback,
        "ideal_answer": evaluation.get("ideal_answer") or question.ideal_answer
    }


@app.post("/api/interviews/sessions/{session_id}/complete", response_model=schemas.SessionDetailResponse)
def complete_session(
    session_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(models.InterviewSession).filter(
        models.InterviewSession.id == session_id,
        models.InterviewSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    # Gather responses
    responses = []
    for q in session.questions:
        r = db.query(models.InterviewResponse).filter(models.InterviewResponse.question_id == q.id).first()
        if r:
            responses.append(r)
            
    if not responses:
        raise HTTPException(status_code=400, detail="Cannot complete an interview with no responses")
        
    # Compute averages
    tech_avg = sum(r.score_technical for r in responses) / len(responses)
    comm_avg = sum(r.score_communication for r in responses) / len(responses)
    conf_avg = sum(r.score_confidence for r in responses) / len(responses)
    comp_avg = sum(r.score_completeness for r in responses) / len(responses)
    
    overall = (tech_avg + comm_avg + conf_avg + comp_avg) / 4
    
    session.status = "completed"
    session.score_technical = round(tech_avg, 1)
    session.score_communication = round(comm_avg, 1)
    session.score_confidence = round(conf_avg, 1)
    session.score_completeness = round(comp_avg, 1)
    session.overall_score = round(overall, 1)
    
    # Generate overall report details using Gemini or simple templates
    session.feedback = f"Great work completing your {session.topic} Mock Interview! Your communication structure is strong, with an average score of {session.score_communication}/10. Keep practicing tech details to raise technical accuracy."
    session.strengths = "Articulate explanations, structural approach to answering, consistent pacing."
    session.weaknesses = "Detailing code implementations, citing specific algorithm complexities under pressure."
    session.recommended_resources = "LeetCode Python track, System Design Primer, standard HR behavioral template guides."
    
    db.commit()
    db.refresh(session)
    return get_session(session.id, current_user, db)


# --- CODING CHALLENGE ENDPOINTS ---

@app.get("/api/challenges", response_model=List[schemas.CodingChallengeResponse])
def get_challenges(db: Session = Depends(get_db)):
    return db.query(models.CodingChallenge).all()

@app.get("/api/challenges/{challenge_id}", response_model=schemas.CodingChallengeResponse)
def get_challenge(challenge_id: int, db: Session = Depends(get_db)):
    challenge = db.query(models.CodingChallenge).filter(models.CodingChallenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Coding challenge not found")
    return challenge

@app.post("/api/challenges/{challenge_id}/submit", response_model=schemas.CodingSubmissionResponse)
def submit_code(
    challenge_id: int,
    submission: schemas.CodeSubmissionCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    challenge = db.query(models.CodingChallenge).filter(models.CodingChallenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
        
    # Use AI evaluation service to review user submitted python code
    evaluation = ai_service.evaluate_code(
        challenge_description=challenge.description,
        user_code=submission.submitted_code
    )
    
    db_submission = models.CodingSubmission(
        user_id=current_user.id,
        challenge_id=challenge.id,
        submitted_code=submission.submitted_code,
        score=evaluation.get("score", 0.0),
        evaluation=evaluation.get("evaluation", ""),
        status=evaluation.get("status", "failed")
    )
    db.add(db_submission)
    db.commit()
    db.refresh(db_submission)
    return db_submission


# --- DAILY CHALLENGE ENDPOINTS ---

@app.get("/api/daily-challenges/today", response_model=schemas.DailyChallengeResponse)
def get_today_challenge(db: Session = Depends(get_db)):
    today = date.today()
    challenge = db.query(models.DailyChallenge).filter(models.DailyChallenge.assigned_date == today).first()
    if not challenge:
        # Fallback to any recent challenge
        challenge = db.query(models.DailyChallenge).order_by(models.DailyChallenge.assigned_date.desc()).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Daily challenge not found")
    return challenge

@app.post("/api/daily-challenges/{challenge_id}/submit", response_model=schemas.DailyChallengeSubmissionResponse)
def submit_daily_challenge(
    challenge_id: int,
    submission: schemas.AnswerSubmit,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    challenge = db.query(models.DailyChallenge).filter(models.DailyChallenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
        
    # Evaluate response with AI evaluation
    evaluation = ai_service.evaluate_answer(
        question=challenge.question_text,
        ideal_answer="Technical answer detailing standard concepts.",
        user_answer=submission.user_answer
    )
    
    score = (evaluation["score_technical"] + evaluation["score_communication"] + evaluation["score_confidence"] + evaluation["score_completeness"]) * 2.5 # Scale to 100
    
    db_submission = models.DailyChallengeSubmission(
        user_id=current_user.id,
        daily_challenge_id=challenge.id,
        user_answer=submission.user_answer,
        score=round(score, 1),
        feedback=evaluation["feedback"]
    )
    db.add(db_submission)
    db.commit()
    db.refresh(db_submission)
    return db_submission


# --- PERFORMANCE DASHBOARD ENDPOINTS ---

@app.get("/api/dashboard/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    # Total completed interviews
    sessions = db.query(models.InterviewSession).filter(
        models.InterviewSession.user_id == current_user.id,
        models.InterviewSession.status == "completed"
    ).all()
    
    total_interviews = len(sessions)
    avg_score = round(sum(s.overall_score for s in sessions) / total_interviews, 1) if total_interviews > 0 else 0.0
    
    # Calculate streak (simple mock logic or date difference)
    streak_days = 0
    if total_interviews > 0:
        streak_days = len(set([s.created_at.date() for s in sessions]))
        
    # Calculate weakest topics
    topics_query = db.query(
        models.InterviewSession.topic,
        func.avg(models.InterviewSession.overall_score).label("avg_score"),
        func.count(models.InterviewSession.id).label("count")
    ).filter(
        models.InterviewSession.user_id == current_user.id,
        models.InterviewSession.status == "completed"
    ).group_by(models.InterviewSession.topic).all()
    
    weakest_topics = []
    for topic, avg, count in topics_query:
        weakest_topics.append({
            "topic": topic,
            "average_score": round(avg, 1),
            "count": count
        })
        
    # Sort weakest topics (ascending score)
    weakest_topics.sort(key=lambda x: x["average_score"])
    
    # Performance trend
    trend = []
    # Fetch last 7 interviews
    recent_sessions = db.query(models.InterviewSession).filter(
        models.InterviewSession.user_id == current_user.id,
        models.InterviewSession.status == "completed"
    ).order_by(models.InterviewSession.created_at.asc()).limit(7).all()
    
    for s in recent_sessions:
        trend.append({
            "date": s.created_at.strftime("%m/%d"),
            "score": s.overall_score
        })
        
    # Dynamic Leaderboard
    leaderboard_query = db.query(
        models.User.full_name,
        func.avg(models.InterviewSession.overall_score).label("avg_score"),
        func.count(models.InterviewSession.id).label("total_completed")
    ).join(models.InterviewSession).filter(
        models.InterviewSession.status == "completed"
    ).group_by(models.User.id).order_by(func.avg(models.InterviewSession.overall_score).desc()).limit(5).all()
    
    leaderboard = []
    for idx, (name, avg, count) in enumerate(leaderboard_query):
        leaderboard.append({
            "rank": idx + 1,
            "name": name,
            "average_score": round(avg, 1),
            "interviews_completed": count
        })
        
    # Fallback default leaderboard if empty
    if not leaderboard:
        leaderboard = [
            {"rank": 1, "name": "Aarav Sharma", "average_score": 9.2, "interviews_completed": 12},
            {"rank": 2, "name": "Priya Patel", "average_score": 8.7, "interviews_completed": 8},
            {"rank": 3, "name": "Jane Doe (You)" if current_user.email == "candidate@example.com" else current_user.full_name, "average_score": avg_score, "interviews_completed": total_interviews},
            {"rank": 4, "name": "Rohan Das", "average_score": 7.9, "interviews_completed": 6},
            {"rank": 5, "name": "Neha Gupta", "average_score": 7.5, "interviews_completed": 4}
        ]
        
    # Sorting fallback list
    leaderboard.sort(key=lambda x: x["average_score"], reverse=True)
    for idx, item in enumerate(leaderboard):
        item["rank"] = idx + 1
        
    # List all user interview history
    history = db.query(models.InterviewSession).filter(
        models.InterviewSession.user_id == current_user.id
    ).order_by(models.InterviewSession.created_at.desc()).all()
    
    return {
        "total_interviews": total_interviews,
        "average_score": avg_score,
        "streak_days": streak_days if streak_days > 0 else 1,
        "weakest_topics": weakest_topics,
        "performance_trend": trend,
        "interview_history": history,
        "leaderboard": leaderboard
    }


# --- ADMIN ENDPOINTS ---

@app.get("/api/admin/analytics", response_model=Dict[str, Any])
def get_admin_analytics(admin_user: models.User = Depends(auth.get_admin_user), db: Session = Depends(get_db)):
    total_users = db.query(models.User).count()
    total_sessions = db.query(models.InterviewSession).count()
    completed_sessions = db.query(models.InterviewSession).filter(models.InterviewSession.status == "completed").count()
    
    average_platform_score = db.query(func.avg(models.InterviewSession.overall_score)).filter(models.InterviewSession.status == "completed").scalar()
    avg_score = round(average_platform_score, 1) if average_platform_score else 0.0
    
    # User growth (mock/grouped by date)
    users = db.query(models.User).order_by(models.User.created_at.desc()).limit(10).all()
    user_list = [{"id": u.id, "email": u.email, "name": u.full_name, "role": u.target_role, "created_at": u.created_at} for u in users]
    
    sessions = db.query(models.InterviewSession).order_by(models.InterviewSession.created_at.desc()).limit(10).all()
    session_list = [{"id": s.id, "topic": s.topic, "difficulty": s.difficulty, "status": s.status, "score": s.overall_score, "created_at": s.created_at} for s in sessions]
    
    return {
        "total_users": total_users,
        "total_sessions": total_sessions,
        "completed_sessions": completed_sessions,
        "average_score": avg_score,
        "recent_users": user_list,
        "recent_sessions": session_list
    }
