from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, Union
from datetime import date

class UserBase(BaseModel):
    name: str
    email: EmailStr
    phone: str
    skills: str
    experience: str
    education: str


class UserRead(UserBase):
    user_id: int
    model_config = ConfigDict(
        from_attributes = True
    )

class UserUpdate(BaseModel):
    name: Optional[str]
    email: Optional[EmailStr] = None
    phone: Optional[str]
    skills: Optional[str]
    experience: Optional[str]
    education: Optional[str]
    resume: Optional[str] = None

class UserReturn(BaseModel):
    Name: Optional[str]
    Email: Optional[EmailStr]
    Phone: Optional[str]
    Skills: Optional[str]
    Experience: Optional[str]
    Education: Optional[str]
    Resume: Optional[str]


class UserLogin(BaseModel):
    email: EmailStr
    model_config = ConfigDict(
        json_schema_extra = {
            "example": {
                "email": "Enter your registered email."
            }
        }
    )

class OtpVerifySchema(BaseModel):
    email: EmailStr
    otp: int

class RecruiterBase(BaseModel):
    name: str
    email: EmailStr
    company: str
    phone: str

class RecruiterReturn(BaseModel):
    Name: Optional[str]
    Email: Optional[EmailStr] = None
    Company: Optional[str]
    Phone: Optional[str]


class RecruiterUpdate(BaseModel):
    name: Optional[str]
    email: Optional[EmailStr]
    company: Optional[str]
    phone: Optional[str]

UpdateRequest = Union[UserUpdate, RecruiterUpdate]

class RecruiterCreate(RecruiterBase):
    pass
    model_config = ConfigDict(
        json_schema_extra = {
            "example": {
                "name": "Name of recruiter",
                "email": "Email of recruiter",
                "company": "Company of recruiter",
                "phone": "Phone number of recruiter"
            }
        }
    )      

class RecruiterRead(RecruiterBase):
    recruiter_id: int
    model_config = ConfigDict(
        from_attributes = True
    )

class JobBase(BaseModel):
    title: str
    description: str
    skills_required: str
    experience_required: str
    salary: str
    location: str
    status: str
    

class JobCreate(JobBase):
    pass
    model_config = ConfigDict(
        json_schema_extra = {
            "example": {
                "title": "Title of job",
                "description": "Description of job",
                "skills_required": "Skills required for job",
                "experience_required": "Experienced required for job",
                "salary": "Salary of this job",
                "location": "Location of this job",
                "status": "Status of this job",
                
            }
        }
    )

class JobRead(JobBase):
    job_id: int

    model_config = ConfigDict(
        from_attributes = True
    )


class ApplicationBase(BaseModel):
    user_id: int
    job_id: int
    resume_score: Optional[float]
    ai_review: Optional[str]
    status: str

class ApplicationCreate(ApplicationBase):
    pass
    model_config = ConfigDict(
        json_schema_extra = {
            "example": {
                "user_id": "User id of this application",
                "job_id": "Job id of the job",
                "resume_score": "Resume score provided by AI model",
                "ai_review": "AI review of this application",
                "status": "Status of this application"
            }
        }
    )

class ApplicationRead(ApplicationBase):
    application_id: int

    model_config = ConfigDict(from_attributes = True)


class InterviewBase(BaseModel):
    application_id: int
    interview_date: date
    interview_mode: str
    feedback: Optional[str]
    status: str

class InterviewCreate(InterviewBase):
    pass
    model_config = ConfigDict(
        json_schema_extra = {
            "example": {
                "application_id": "Application id of the applied application",
                "interview_date": "Interview date of the application",
                "interview_mode": "Interview mode of the application",
                "feedback": "Feedback of the interview",
                "status": "Status of the interview"
            }
        }
    )

class InterviewRead(InterviewBase):
    interview_id: int

    model_config = ConfigDict(from_attributes = True)

class AIModelBase(BaseModel):
    version: str
    description: str
    accuracy: str

class AIModelCreate(AIModelBase):
    pass

    model_config = ConfigDict(
        json_schema_extra = {
            "example": {
                "version": "Version of AI model used",
                "description": "Description about AI model used",
                "accuracy": "Accuracy provided by the AI model used" 
            }
        }
    )

class AIModelRead(AIModelBase):
    model_id: int

    model_config = ConfigDict(from_attributes = True)
