import smtplib
from email.message import EmailMessage
import random
import math
from config import setting
from io import BytesIO
import pdfplumber
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from fastapi import HTTPException, Request, Depends, status
from sqlalchemy.orm import Session
from database import get_db
from auth import JWTAuth
from models import Notification


authentication = JWTAuth()

def check_who_loged_in(request: Request= None)-> str:
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code= status.HTTP_401_UNAUTHORIZED, detail="Unauthorized: token not found.")
    try:
        payload = authentication.verify_token(token)
    except Exception as e:
        raise HTTPException(status_code= status.HTTP_401_UNAUTHORIZED, detail= f"Invalid or expired token, error: {e}")
    email = payload.get("email")
    return email

def create_notification(message: str, user_id: int= None, job_id: int= None, db: Session= None):
    notification = Notification(
        Message = message,
        UserID = user_id,
        JobID = job_id
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)

def notification_sender(email: str, message: str):
    msg = EmailMessage()
    msg.set_content(message)
    msg["Subject"] = "Notification from Beroozgar.com"
    msg["From"] = setting.SENDER_EMAIL
    msg["To"] = email
    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(setting.SENDER_EMAIL, setting.SENDER_EMAIL_PASSWORD)
            smtp.send_message(msg)
        return {"status": "Notification sent successfully!", "Notification": message}
    except Exception as e:
        return {"status" : f"Failed to send notification email: {e}"}            

def otp_generator():
    digit = [i for i in range(0, 10)]
    random_str = ""
    for i in range(6):
        index = math.floor(random.random() * 10)
        random_str += str(digit[index])
    return int(random_str)


def mail_sender(to_email):
    msg = EmailMessage()
    otp = otp_generator()
    msg.set_content(f"Your login OTP:- {otp}.")
    msg["Subject"] = "Beroozgar.com Login OTP."
    msg["From"] = setting.SENDER_EMAIL
    msg["To"] = to_email

    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(setting.SENDER_EMAIL, setting.SENDER_EMAIL_PASSWORD)
            smtp.send_message(msg)
        return {"status" : "Email sent successfully!", "otp": otp}
    except Exception as e:
        return {"status" : f"Failed to send email: {e}"}

def extract_text_from_pdf(file_bytes: bytes)-> str:
    with pdfplumber.open(BytesIO(file_bytes)) as pdf:
        text = ""
        for page in pdf.pages:
            text += page.extract_text() or ""
    return text

def score_resume_against_job(resume_text: str, job_desc: str, skill_required: str):
    documents = [resume_text, job_desc, skill_required]
    tfidf = TfidfVectorizer(stop_words= 'english')
    tfidf_matrix = tfidf.fit_transform(documents)
    sim_with_job_desc = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
    sim_with_skills = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[2:3])[0][0]
    
    score = float((sim_with_job_desc + sim_with_skills) / 2)
    score_percentage = round(score * 100, 2)

    review = f"Resume matches job description by {score_percentage}%. "
    if score_percentage >= 75:
        review += "Greate match!"
    elif score_percentage >= 50:
        review += "Good match, but can be improved."
    else:
        review += "Low match. Please tailor your resume."
    return score_percentage, review



# if __name__ == "__main__":
#     print(mail_sender('ankit.raj.cseiot.2022@tint.edu.in'))