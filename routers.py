from fastapi import APIRouter, Depends, Form, HTTPException, Response, Request, File, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy import and_, desc, func, or_
from sqlalchemy.orm import Session
from models import User, OTPStore, Recruiter, Job, Application, Interview, Notification, ChatMessage
from schemas import UserLogin, RecruiterCreate, JobCreate
from database import get_db, get_db_sync
from starlette import status
from utils import mail_sender, extract_text_from_pdf, score_resume_against_job, check_who_loged_in, notification_sender, create_notification, check_user_type
from pydantic import EmailStr
from datetime import timedelta
from config import setting
from auth import JWTAuth
from io import BytesIO


router = APIRouter()
authentication = JWTAuth()






@router.post("/userSignup")
async def user_sign_up(
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    skills: str = Form(...),
    experience: str = Form(...),
    education: str = Form(...),
    resume: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if db.query(User).filter(User.Email == email).first():
        raise HTTPException(status_code= status.HTTP_400_BAD_REQUEST, detail= "Email already registered!")

    resume_data = await resume.read()  

    new_user = User(
        Name=name,
        Email=email,
        Phone=phone,
        Resume=resume_data,
        Skills=skills,
        Experience=experience,
        Education=education
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": f"{new_user.Email} is registered now."
    }

# Note:- Email must be of Gmail 
@router.post("/userLoginEmailSender")
def user_login_email_sender(user: UserLogin, db: Session = Depends(get_db)):
    email_sent_response = mail_sender(user.email)
    otp = email_sent_response.get("otp")
    if not otp:
        raise HTTPException(status_code= status.HTTP_400_BAD_REQUEST, detail= "Unable to sent otp, please check mail id!")
    is_otp_sent_earlier = db.query(OTPStore).filter(OTPStore.Email == user.email).delete()
    db.commit()
    otp_data = OTPStore(
        Email = user.email,
        OTP = otp
    )
    db.add(otp_data)
    db.commit()
    db.refresh(otp_data)
    return {
        "status": "OTP sent and stored in db successfully!",
        "otp": otp,
        "to_email": user.email 
    }

@router.post("/otpVerifier")
def verify_sent_otp(otp: int, email: EmailStr, db: Session = Depends(get_db)):
    user_otp_data = db.query(OTPStore).filter(OTPStore.Email == email).first() 
    if not user_otp_data:
        raise HTTPException(status_code= status.HTTP_400_BAD_REQUEST, detail= "OTP is not sent yet to provided email.")
    if user_otp_data.OTP == otp:
        exp_time = timedelta(minutes= setting.TOKEN_EXPIRE_MINUTES)
        jwt_token = authentication.generate_access_token({
                                                            "email": email,
                                                            "otp": otp
                                                        }, exp_time= exp_time)
        db.delete(user_otp_data)
        db.commit()

        response = Response()
        response = JSONResponse(content={"message": f"Logged in successfully. Token set in cookie for {email}"})
        response.set_cookie(
            key= "access_token",
            value= jwt_token,
            httponly= True,
            secure= False, 
            samesite= "Lax",
            max_age=setting.TOKEN_EXPIRE_MINUTES * 60
        )
        
        return response
    raise HTTPException(status_code= status.HTTP_401_UNAUTHORIZED, detail= "Incorrect OTP.")

@router.get("/protected-route")
def protected_route(request: Request, db: Session= Depends(get_db)):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code= status.HTTP_401_UNAUTHORIZED, detail="Unauthorized, token not found.")
    payload = authentication.verify_token(token= token)
    user_type = check_user_type(email= payload.get("email"), db= db)
    return {"user": payload,
            "user_email": payload.get("email"),
            "user_type": user_type}

@router.post("/logout")
def logout(response: Response):
    response = JSONResponse(content= {"message": "Logged out successfully."})
    response.delete_cookie(key= "access_token")
    return response

@router.post("/recruiter-signup")
def recruiter_signup(new_recruiter: RecruiterCreate, db: Session = Depends(get_db)):
    if db.query(Recruiter).filter(Recruiter.Email == new_recruiter.email).first():
        raise HTTPException(status_code= status.HTTP_400_BAD_REQUEST, detail= "Recruiter already signed in!")
    new_recruiter = Recruiter(
        Name = new_recruiter.name,
        Email = new_recruiter.email,
        Company = new_recruiter.company,
        Phone = new_recruiter.phone
    )
    db.add(new_recruiter)
    db.commit()
    db.refresh(new_recruiter)
    return {
        "message": f"{new_recruiter.Email} is registered now."
    }

@router.post("/new-job")
def create_job(new_job: JobCreate, recruiter_email: str= Depends(check_who_loged_in),db: Session = Depends(get_db)):
    recruiter = db.query(Recruiter).filter(Recruiter.Email == recruiter_email).first()
    if not recruiter:
        raise HTTPException(status_code= status.HTTP_401_UNAUTHORIZED, detail= "Unauthorized: Not registered as recruiter.")
    
    job = Job(
        RecruiterID = recruiter.RecruiterID,
        Title = new_job.title,
        Description = new_job.description,
        SkillsRequired = new_job.skills_required,
        ExperienceRequired = new_job.experience_required,
        Salary = new_job.salary,
        Location = new_job.location,
        Status = new_job.status
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    return {
        "message": "Job posted successfully.",
        "job_id": job.JobID,
        "recruiter_email": recruiter.Email
    }


@router.get("/jobs")
def get_all_jobs(db: Session= Depends(get_db)):
    jobs = db.query(Job).all()
    return jobs

@router.get("/job/{job_id}")
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.JobID == job_id).first()
    if not job:
        raise HTTPException(status_code= status.HTTP_404_NOT_FOUND, detail= "Job not found.")
    return job

@router.get("/recruiter/jobs")
def get_job_by_recruiter(recruiter_email: str= Depends(check_who_loged_in), db: Session = Depends(get_db)):
    recruiter = db.query(Recruiter).filter(Recruiter.Email == recruiter_email).first()
    if not recruiter:
        raise HTTPException(status_code= status.HTTP_401_UNAUTHORIZED, detail= "Unauthorized: Not registered as recruiter.")
    jobs = db.query(Job).filter(Job.RecruiterID == recruiter.RecruiterID).all()
    return jobs

@router.get("/jobs/search")
def search_jobs(title: str= "", skills: str= "", location: str= "", db: Session = Depends(get_db)):
    query = db.query(Job)

    if title:
        query = query.filter(Job.Title.ilike(f"%{title}%"))
    if location:
        query = query.filter(Job.Location.ilike(f"%{location}%"))
    if skills:
        query = query.filter(Job.SkillsRequired.ilike(f"%{skills}%"))
    jobs = query.all()
    return jobs

@router.get("/jobs/recent")
def recent_jobs(limit: int = 10, db: Session = Depends(get_db)):
    jobs = db.query(Job).order_by(Job.created_at.desc()).limit(limit).all()
    return jobs




@router.post("/apply/{job_id}")
async def apply_for_job(job_id: int, user_email: str= Depends(check_who_loged_in), db: Session= Depends(get_db)):
    user = db.query(User).filter(User.Email == user_email).first()
    if not user:
        raise HTTPException(status_code= status.HTTP_404_NOT_FOUND, detail= "User not found.")
    
    job = db.query(Job).filter(Job.JobID == job_id).first()
    if not job:
        raise HTTPException(status_code= status.HTTP_404_NOT_FOUND, detail= "Job not found.")
    
    existing = db.query(Application).filter(Application.UserID == user.UserID, Application.JobID == job.JobID).first()
    if existing:
        raise HTTPException(status_code= status.HTTP_400_BAD_REQUEST, detail= "Already applied for this job.")
    
    resume_text = extract_text_from_pdf(user.Resume)
    score, review = score_resume_against_job(resume_text, job.Description, job.SkillsRequired)

    application = Application(
        UserID = user.UserID,
        JobID = job.JobID,
        ResumeScore = score,
        AI_Review = review,
        Status = "Applied"

    )
    db.add(application)
    db.commit()
    db.refresh(application)

    notification_message = f"Application submitted for job '{job.Title}'" 
    
    create_notification(message= notification_message, user_id= user.UserID, job_id= application.JobID, db= db)
    notification_sender(user_email, notification_message)
    await send_ws_notification(user_email, notification_message)

    recruiter = db.query(Recruiter).filter(Recruiter.RecruiterID == job.RecruiterID).first()
    if recruiter:
        recruiter_notification = f"New application received for your job '{job.Title}'"
        await send_ws_notification(recruiter.Email, recruiter_notification)


    return {
        "message": "Application submitted successfully",
        "score": score,
        "review": review
    }


@router.get("/user/applied-jobs")
def get_applied_jobs(user_email: str= Depends(check_who_loged_in),db: Session= Depends(get_db)):
    user = db.query(User).filter(User.Email == user_email).first()
    if not user:
        raise HTTPException(status_code= status.HTTP_404_NOT_FOUND, detail= "User not found.")
    
    applications = db.query(Application).filter(Application.UserID == user.UserID).all()

    all_applied_jobs = []
    for app in applications:
        all_applied_jobs.append(
            {
                "job_id": app.JobID,
                "resume_score": app.ResumeScore,
                "ai_review": app.AI_Review,
                "status": app.Status
            }
        )
    return all_applied_jobs

@router.get("/recruiter/job/{job_id}/applications")
def get_applications_for_job(job_id: int, recruiter_email: str= Depends(check_who_loged_in), db: Session = Depends(get_db)):
    recruiter = db.query(Recruiter).filter(Recruiter.Email == recruiter_email).first()
    if not recruiter:
        raise HTTPException(status_code= status.HTTP_400_BAD_REQUEST, detail= "Recruiter not found.")
    job = db.query(Job).filter(Job.JobID == job_id, Job.RecruiterID == recruiter.RecruiterID).first()
    if not job:
        raise HTTPException(status_code= status.HTTP_404_NOT_FOUND, detail= "No job found.")
    application = db.query(Application).filter(Application.JobID == job.JobID).all()

    return [
        {
            "applicant_id": app.UserID,
            "applicant_user_id": app.UserID,
            "resume_score": app.ResumeScore,
            "ai_review": app.AI_Review,
            "status": app.Status
        } for app in application
    ]


@router.post("/schedule-interview")
async def schedule_interview(application_id: int, date: str, mode: str, recruiter_email: str= Depends(check_who_loged_in), db: Session = Depends(get_db)):
    recruiter = db.query(Recruiter).filter(Recruiter.Email == recruiter_email).first()
    if not recruiter:
        raise HTTPException(status_code= status.HTTP_400_BAD_REQUEST, detail= "Recruiter not found.")
    is_valid_application_id = db.query(Application).filter(Application.ApplicationID == application_id).first()
    if not is_valid_application_id:
        raise HTTPException(status_code= status.HTTP_400_BAD_REQUEST, detail= "Application not found.")
    interview = Interview(
        ApplicationID = application_id,
        InterviewDate = date,
        InterviewMode = mode,
        Feedback = "Pending",
        Status = "Scheduled"
    )

    db.add(interview)
    db.commit()
    db.refresh(interview)

    candidate = db.query(User).filter(User.UserID == is_valid_application_id.UserID).first()
    if candidate:
        notification_message_for_candidate = f"Interview scheduled on {date} via {mode} for Job ID {is_valid_application_id.JobID}'" 
        notification_sender(candidate.Email, notification_message_for_candidate)
        create_notification(message= notification_message_for_candidate, user_id= candidate.UserID, job_id= is_valid_application_id.JobID, db= db)
        await send_ws_notification(candidate.Email, notification_message_for_candidate)

    notification_message_for_recruiter = f"Interview scheduled with candidate ID {is_valid_application_id.UserID}"
    notification_sender(recruiter_email, notification_message_for_recruiter)
    create_notification(message= notification_message_for_recruiter, user_id= recruiter.RecruiterID, job_id= is_valid_application_id.JobID, db= db)

    await send_ws_notification(recruiter.Email, notification_message_for_recruiter)
    return {"message": "Interview scheduled"}
    


@router.get("/download-resume/{user_id}")
def download_resume(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.UserID == user_id).first()
    if not user or not user.Resume:
        raise HTTPException(status_code= status.HTTP_404_NOT_FOUND, detail= "Resume not found.")
    resume = BytesIO(user.Resume)
    return StreamingResponse(
        resume,
        media_type= "application/pdf",
        headers= {"Content-Disposition": f"attachment; filename=resume_user_{user_id}.pdf"}
    )


@router.get("/user/notifications")
def get_user_notifications(user_email: str= Depends(check_who_loged_in), db: Session= Depends(get_db)):
    user = db.query(User).filter(User.Email == user_email).first()
    if not user:
        raise HTTPException(status_code= status.HTTP_404_NOT_FOUND, detail= "User not found.")
    notifications = db.query(Notification).filter(Notification.UserID == user.UserID).order_by(Notification.Timestamp.desc()).all()
    return notifications

@router.get("/recruiter/notifications")
def get_recruiter_notifications(recruiter_email: str= Depends(check_who_loged_in), db: Session= Depends(get_db)):
    recruiter = db.query(Recruiter).filter(Recruiter.Email == recruiter_email).first()
    if not recruiter:
        raise HTTPException(status_code= status.HTTP_404_NOT_FOUND, detail= "Recruiter not found.")
    recruiter_jobs = db.query(Job.JobID).filter(Job.RecruiterID == recruiter.RecruiterID).subquery()
    notifications = db.query(Notification).filter(Notification.JobID.in_(recruiter_jobs)).order_by(Notification.Timestamp.desc()).all()
    return notifications

@router.put("/notification/{notification_id}/read")
def mark_as_read(notification_id: int, db: Session = Depends(get_db)):
    notification = db.query(Notification).filter(Notification.NotificationID == notification_id).first()
    if not notification:
        raise HTTPException(status_code= status.HTTP_404_NOT_FOUND, detail= "Notification not found.")
    notification.IsRead = True
    db.commit()
    return {"message": f"{notification_id} Notification marked as read"}


# key-> email, value-> websocket object
active_websocket_connections = {}

async def send_ws_notification(email:str, message: str):
    websocket: WebSocket = active_websocket_connections.get(email)
    if websocket:
        await websocket.send_text(message)


@router.websocket("/ws/chat")
async def websocket_receive_chat(websocket: WebSocket, email: str):
    await websocket.accept()
    active_websocket_connections[email] = websocket
    try:
        while True:
            data = await websocket.receive_json()
            receiver = data.get("to")
            message = data.get("message")

            with get_db_sync() as db:
                chat_message = ChatMessage(
                    SenderEmail = email,
                    ReceiverEmail = receiver,
                    Message = message
                )

                db.add(chat_message)
                db.commit()

            if receiver == email:
                await websocket.send_json({"error": "You cannot send message to yourself."})
                continue
            if not receiver or not message:
                await websocket.send_json({"error": "Invalid chat message format."})
                continue
            if receiver in active_websocket_connections:
                await active_websocket_connections[receiver].send_json({
                    "from": email,
                    "message": message
                })
            

    except WebSocketDisconnect:
        del active_websocket_connections[email]


@router.get("/chat-history")
def get_chat_history(with_email: str, user_email: str= Depends(check_who_loged_in), db: Session= Depends(get_db)):
    messages = db.query(ChatMessage).filter(
        ((ChatMessage.SenderEmail == user_email) & (ChatMessage.ReceiverEmail == with_email)) |
        ((ChatMessage.SenderEmail == with_email) & (ChatMessage.ReceiverEmail == user_email))
    ).order_by(ChatMessage.Timestamp.asc()).all()

    return [{"from": msg.SenderEmail, "to": msg.ReceiverEmail, "message": msg.Message, "timestamp": msg.Timestamp} for msg in messages]

@router.get("/chat/contacts")
def get_chat_contacts(user_email: str = Depends(check_who_loged_in), db: Session = Depends(get_db)):
    # Get all unique contact emails (both sent and received)
    receivers_mail = db.query(ChatMessage.ReceiverEmail).filter(ChatMessage.SenderEmail == user_email)
    senders_mail = db.query(ChatMessage.SenderEmail).filter(ChatMessage.ReceiverEmail == user_email)
    all_contacts = set()

    for mail in receivers_mail:
        all_contacts.add(mail[0])
    for mail in senders_mail:
        all_contacts.add(mail[0])

    result = []

    for contact_email in all_contacts:
        # Get user name (if exists)
        user = db.query(User).filter(User.Email == contact_email).first()

        # Get the last message between user and contact
        last_msg = db.query(ChatMessage).filter(
            or_(
                and_(ChatMessage.SenderEmail == user_email, ChatMessage.ReceiverEmail == contact_email),
                and_(ChatMessage.SenderEmail == contact_email, ChatMessage.ReceiverEmail == user_email)
            )
        ).order_by(desc(ChatMessage.Timestamp)).first()

        # Count unread messages from contact
        unread_count = db.query(func.count()).filter(
            ChatMessage.SenderEmail == contact_email,
            ChatMessage.ReceiverEmail == user_email,
            ChatMessage.is_read == False  
        ).scalar()

        result.append({
            "email": contact_email,
            "name": user.Name if user else None,
            "last_message": last_msg.Message if last_msg else None,
            "unread_count": unread_count or 0
        })

    return result


@router.get("/check-registered-email")
def check_registered_email(email_to_check: str, db: Session= Depends(get_db)):
    check_in_users = db.query(User).filter(User.Email == email_to_check).first()
    if check_in_users:
        return {"response": f"{email_to_check} is registered."}
    check_in_recruiter = db.query(Recruiter).filter(Recruiter.Email == email_to_check).first()
    if check_in_recruiter:
        return {"response": f"{email_to_check} is registered."}
    raise HTTPException(status_code= status.HTTP_404_NOT_FOUND, detail= "Email is not registered.")