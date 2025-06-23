from sqlalchemy import Column, Integer, LargeBinary, String, ForeignKey, Date, Text, DateTime, func, Boolean
from sqlalchemy.orm import relationship
from database import Base

class OTPStore(Base):
    __tablename__ = "otpstore"
    ID = Column(Integer, primary_key= True, index= True)
    Email = Column(String(100), unique=True, index=True)
    OTP = Column(Integer)


class User(Base):
    __tablename__ = "users"

    UserID = Column(Integer, primary_key=True, index=True)
    Name = Column(String(100))
    applications = relationship("Application", back_populates="user")
    Email = Column(String(100), unique=True, index=True)
    Phone = Column(String(15), unique=True)
    Resume = Column(LargeBinary)  # store file path in this
    Skills = Column(Text)
    Experience = Column(String(100))
    Education = Column(String(100))



class Recruiter(Base):
    __tablename__ = "recruiters"

    RecruiterID = Column(Integer, primary_key=True, index=True)
    Name = Column(String(100))
    Email = Column(String(100), unique=True, index=True)
    Company = Column(String(100))
    Phone = Column(String(15), unique=True)

    jobs = relationship("Job", back_populates="recruiter")


class Job(Base):
    __tablename__ = "jobs"

    JobID = Column(Integer, primary_key=True, index=True)
    RecruiterID = Column(Integer, ForeignKey("recruiters.RecruiterID"))
    Title = Column(String(100))
    Description = Column(Text)
    SkillsRequired = Column(Text)
    ExperienceRequired = Column(String(100))
    Salary = Column(String(100))
    Location = Column(String(100))
    Status = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    recruiter = relationship("Recruiter", back_populates="jobs")
    applications = relationship("Application", back_populates="job")


class Application(Base):
    __tablename__ = "applications"

    ApplicationID = Column(Integer, primary_key=True, index=True)
    UserID = Column(Integer, ForeignKey("users.UserID"))
    JobID = Column(Integer, ForeignKey("jobs.JobID"))
    ResumeScore = Column(Integer)
    AI_Review = Column(String(100))
    Status = Column(String(50))

    user = relationship("User", back_populates="applications")
    job = relationship("Job", back_populates="applications")
    interview = relationship("Interview", back_populates="application", uselist=False)


class Interview(Base):
    __tablename__ = "interviews"

    InterviewID = Column(Integer, primary_key=True, index=True)
    ApplicationID = Column(Integer, ForeignKey("applications.ApplicationID"))
    InterviewDate = Column(Date)
    InterviewMode = Column(String(50))
    Feedback = Column(Text)
    Status = Column(String(50))

    application = relationship("Application", back_populates="interview")


class AI_Model(Base):
    __tablename__ = "ai_model"

    ModelID = Column(Integer, primary_key=True, index=True)
    Version = Column(String(50))
    Description = Column(String(255))
    Accuracy = Column(String(50))


class Notification(Base):
    __tablename__ = "notifications"

    NotificationID = Column(Integer, primary_key= True, index= True)
    UserID = Column(Integer, ForeignKey("users.UserID"), nullable= True)
    JobID = Column(Integer, ForeignKey("jobs.JobID"), nullable= True)
    Message = Column(String(255))
    IsRead = Column(Boolean, default= False)
    Timestamp = Column(DateTime(timezone= True), server_default= func.now())

    user = relationship("User", backref= "notifications")
    job = relationship("Job", backref= "notifications")

    