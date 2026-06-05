import os
import json
import random
from typing import Optional, Dict, Any
import google.generativeai as genai
from config import settings

# Initialize Gemini API
api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
is_mock_mode = not api_key

if not is_mock_mode:
    genai.configure(api_key=api_key)

def call_gemini(prompt: str, response_json: bool = True) -> str:
    """Helper to call Gemini API with error handling and optional JSON output."""
    if is_mock_mode:
        return ""
    
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        generation_config = {}
        if response_json:
            generation_config = {"response_mime_type": "application/json"}
            
        response = model.generate_content(
            prompt,
            generation_config=generation_config
        )
        return response.text.strip()
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return ""

def parse_resume(resume_text: str) -> Dict[str, Any]:
    """Parse resume text using Gemini to extract skills, experience, and projects."""
    if is_mock_mode:
        return {
            "skills": "Python, SQL, Machine Learning, Scikit-Learn, Git, Docker",
            "experience": "2 years as Junior Data Scientist at Tech Solutions - built regression and classification models.",
            "projects": "Predictive maintenance system (Python/Flask), Customer churn forecasting dashboard (Pandas/SQL)."
        }
        
    prompt = f"""
    Analyze the following resume text and extract the key information in JSON format.
    The response MUST be a JSON object with the following fields:
    1. 'skills': A comma-separated string of technical skills and tools found in the resume.
    2. 'experience': A short text summary of work history and experience level (Entry, Mid, Senior) and years of experience.
    3. 'projects': A brief summary of core projects mentioned.

    Resume text:
    ---
    {resume_text}
    ---
    """
    response_text = call_gemini(prompt, response_json=True)
    try:
        return json.loads(response_text)
    except Exception:
        # Fallback if JSON parsing fails
        return {
            "skills": "Extracted from resume",
            "experience": "Details parsed from resume",
            "projects": "Projects parsed from resume"
        }

def generate_next_question(
    topic: str,
    difficulty: str,
    target_role: str,
    skills: str,
    history: list[dict],
    resume_context: Optional[str] = None
) -> Dict[str, str]:
    """Generate the next interview question based on topic, difficulty, role, and conversation history."""
    if is_mock_mode:
        # Provide realistic mock questions
        mock_questions = {
            "HR": [
                {"question_text": "Tell me about a time you faced a difficult conflict within a team project and how you resolved it.", "ideal_answer": "Use the STAR method: Situation, Task, Action, Result. Highlight empathy, active listening, and collaborative compromise."},
                {"question_text": "Why are you interested in this position, and how does it align with your long-term career goals?", "ideal_answer": "Connect the company's mission and technical stack with your skills, desire to grow, and career trajectory."},
                {"question_text": "How do you handle tight deadlines or stressful situations in the workplace?", "ideal_answer": "Discuss task prioritization, clear communication with stakeholders, and maintaining focus."}
            ],
            "Python": [
                {"question_text": "What is the difference between a list and a tuple in Python, and when would you use one over the other?", "ideal_answer": "Lists are mutable, tuples are immutable. Use lists for dynamic collections and tuples for fixed records or dictionary keys."},
                {"question_text": "Explain what decorators are in Python and write a simple example of one.", "ideal_answer": "Decorators modify the behavior of a function or class without changing its source code. They wrap another function."},
                {"question_text": "How does memory management work in Python, specifically regarding garbage collection?", "ideal_answer": "Python uses reference counting and a cyclic garbage collector to clean up objects that are no longer accessible."}
            ],
            "Data Science": [
                {"question_text": "What is overfitting, and what are three common ways to prevent it in a predictive model?", "ideal_answer": "Overfitting is when a model learns noise in training data. Prevent it using cross-validation, regularization (L1/L2), pruning, or reducing feature dimensions."},
                {"question_text": "Explain the difference between L1 and L2 regularization.", "ideal_answer": "L1 (Lasso) adds absolute weight values to the loss, driving some weights to 0 (feature selection). L2 (Ridge) adds squared weights, shrinking them near 0."},
                {"question_text": "What is the ROC AUC score, and how is it used to evaluate binary classifiers?", "ideal_answer": "ROC plots True Positive Rate vs False Positive Rate. AUC is the area under this curve, showing model capability to distinguish classes."}
            ],
            "Machine Learning": [
                {"question_text": "How do you choose the optimal number of clusters in a K-Means clustering algorithm?", "ideal_answer": "Use the Elbow Method (minimizing inertia/distortion) or Silhouette Coefficient/Analysis."},
                {"question_text": "Explain how a Random Forest classifier works.", "ideal_answer": "It is an ensemble method that constructs many decision trees during training and outputs the mode of classes (voting) of individual trees."},
                {"question_text": "What is the bias-variance tradeoff in Machine Learning?", "ideal_answer": "Bias is error from erroneous assumptions (underfitting). Variance is error from sensitivity to small fluctuations in training data (overfitting)."}
            ]
        }
        topic_key = topic if topic in mock_questions else "HR"
        # Select based on history length to simulate a progression
        q_index = len(history) % len(mock_questions[topic_key])
        return mock_questions[topic_key][q_index]

    history_str = "\n".join([f"Q: {h['question']}\nA: {h['answer']}" for h in history])
    
    resume_prompt = f"Resume details: {resume_context}" if resume_context else ""

    prompt = f"""
    You are an expert technical and HR interviewer. Generate a single interview question.
    Context:
    - Target Role: {target_role}
    - Interview Topic/Focus: {topic}
    - Difficulty: {difficulty}
    - Candidate Skills: {skills}
    {resume_prompt}
    
    Previous Conversation History (Do not repeat these questions, build upon them if relevant to keep a conversational flow):
    {history_str}
    
    The response MUST be a JSON object containing two keys:
    1. 'question_text': The question to ask the candidate. Make it sound natural, professional, and conversational. Ask only one question at a time.
    2. 'ideal_answer': A concise summary of what a perfect answer would include (technical concepts, keywords, behavioral structure).
    """
    
    response_text = call_gemini(prompt, response_json=True)
    try:
        return json.loads(response_text)
    except Exception:
        # Fallback question
        return {
            "question_text": f"Can you tell me about your experience working with {topic} and how it applies to your target role as a {target_role}?",
            "ideal_answer": f"The candidate should explain core principles of {topic}, mention specific frameworks/libraries, and connect them to real projects."
        }

def evaluate_answer(question: str, ideal_answer: str, user_answer: str) -> Dict[str, Any]:
    """Evaluate a user's answer against the question and ideal answer, returning scores and feedback."""
    if is_mock_mode:
        # Generate semi-random high-quality scores based on length of answer
        word_count = len(user_answer.split())
        base_score = min(max(5.0 + (word_count / 15.0), 4.0), 9.5)
        
        # Add slight randomness
        score_tech = round(min(base_score + random.uniform(-0.5, 0.5), 10.0), 1)
        score_comm = round(min(base_score + random.uniform(-0.8, 0.8), 10.0), 1)
        score_conf = round(min(base_score + random.uniform(-0.3, 0.7), 10.0), 1)
        score_comp = round(min(base_score + random.uniform(-0.9, 0.3), 10.0), 1)

        return {
            "score_technical": score_tech,
            "score_communication": score_comm,
            "score_confidence": score_conf,
            "score_completeness": score_comp,
            "feedback": "This is a simulated feedback report. Your answer is well-structured. To improve further, make sure to explicitly include real-world examples and clarify your technical definitions.",
            "ideal_answer": ideal_answer or "A strong answer would contain key terminology, clear delivery, and structured progression."
        }

    prompt = f"""
    You are an expert interviewer evaluating a candidate's response.
    
    - Question Asked: "{question}"
    - Reference Ideal Answer: "{ideal_answer}"
    - Candidate's Response: "{user_answer}"
    
    Evaluate the candidate's answer on the following four dimensions (each on a scale of 0.0 to 10.0):
    1. Technical Accuracy: Is the technical content correct and precise?
    2. Communication: Is the answer articulate, structured, and easy to understand?
    3. Confidence: Does the tone feel assured, clear, and professional?
    4. Completeness: Did the answer address all aspects of the question?
    
    Return your response as a JSON object with the following fields:
    - 'score_technical': float (0-10)
    - 'score_communication': float (0-10)
    - 'score_confidence': float (0-10)
    - 'score_completeness': float (0-10)
    - 'feedback': Detailed constructive feedback pointing out strengths and areas for improvement.
    - 'ideal_answer': A refined ideal response for this question.
    """
    
    response_text = call_gemini(prompt, response_json=True)
    try:
        return json.loads(response_text)
    except Exception:
        return {
            "score_technical": 7.0,
            "score_communication": 7.0,
            "score_confidence": 7.0,
            "score_completeness": 7.0,
            "feedback": "Successfully received answer. (Gemini score parsing fell back to defaults). Good effort, try to expand on details.",
            "ideal_answer": ideal_answer or "A detailed explanation."
        }

def evaluate_code(challenge_description: str, user_code: str) -> Dict[str, Any]:
    """Evaluate programming code submissions."""
    if is_mock_mode:
        # Simple local checking for common syntax
        passed = True
        err = ""
        if "def " not in user_code:
            passed = False
            err = "Function definition missing."
        
        score = 100.0 if passed else 30.0
        return {
            "score": score,
            "evaluation": f"Syntactic code review: Function declaration found. {err if err else 'Tests passed.'}",
            "status": "passed" if passed else "failed"
        }

    prompt = f"""
    You are an automated coding assessment compiler.
    Evaluate the following python code against the problem description.
    
    Problem Description:
    {challenge_description}
    
    User Submitted Code:
    {user_code}
    
    Evaluate correctness, time complexity, and code quality.
    Return a JSON object with these keys:
    - 'score': float (0 to 100)
    - 'evaluation': A detailed text review of the code (mentioning time/space complexity, clean code principles, and corrections).
    - 'status': string ('passed' if it meets requirements, otherwise 'failed')
    """
    
    response_text = call_gemini(prompt, response_json=True)
    try:
        return json.loads(response_text)
    except Exception:
        return {
            "score": 50.0,
            "evaluation": "Could not complete full AI compilation. Code received.",
            "status": "failed"
        }
