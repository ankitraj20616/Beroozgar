# 💼 Beroozgar - Job Portal API (FastAPI Backend)

This is a modern backend API for a **Job Portal** where users can:
- Register and log in with OTP-based authentication
- Upload resumes and apply to jobs
- Get AI-powered resume scoring
- Receive real-time interview notifications
- Chat with recruiters via WebSocket

Recruiters can:
- Post jobs
- View applicants
- Schedule interviews
- Chat with candidates

---

## 📦 Tech Stack

- **Backend**: [FastAPI](https://fastapi.tiangolo.com/)
- **Database**: PostgreSQL / MySQL (via SQLAlchemy ORM)
- **Authentication**: JWT (set via HTTP-only cookies)
- **Realtime Communication**: WebSockets
- **Resume Parsing**: `pdfminer` / custom parser
- **Email OTP**: SMTP with Gmail
- **Notification System**: In-app & WebSocket-based

---

## 🚀 Features

### 👤 User Features
- Signup with resume upload
- Login with Gmail OTP
- Apply for jobs with AI resume matching
- View applied jobs
- Chat with recruiters
- View interview notifications

### 🧑‍💼 Recruiter Features
- Recruiter signup/login
- Post and manage jobs
- View applicants
- Schedule interviews
- Chat with users
- Get notified of applications

### 💬 Real-Time Chat & Notification
- WebSocket-based chat for user ↔ recruiter
- Notification on:
  - Job application submission
  - Interview schedule
  - Real-time delivery using `WebSocket`

---

## 🔐 Auth Flow

- OTP login (sent via email)
- On OTP verification:
  - JWT token generated and set in secure cookie
- Auth validated in:
  - Routes
  - WebSocket connections

---

## 📁 Project Structure

beroozgar/
├── main.py # FastAPI app instance
├── routers.py # All API & WebSocket routes
├── models.py # SQLAlchemy ORM models
├── schemas.py # Pydantic request schemas
├── auth.py # JWT utilities
├── database.py # DB session handling
├── utils.py # OTP mail, resume parsing, etc.
├── config.py # Environment variables
└── requirements.txt # Project dependencies

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/yourusername/beroozgar-backend.git
cd beroozgar-backend

2️⃣ Create and Activate Virtual Environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

3️⃣ Install Dependencies
pip install -r requirements.txt

4️⃣ Set Environment Variables
Create .env or add these in config.py:

env

DATABASE_URL=postgresql://username:password@localhost/dbname
SECRET_KEY=your-secret-key
ALGORITHM=HS256
TOKEN_EXPIRE_MINUTES=60
EMAIL_USER=yourgmail@gmail.com
EMAIL_PASS=yourappspecificpassword

5️⃣ Run the Application

uvicorn main:app --reload
🔌 WebSocket Endpoints
ws://localhost:8000/ws — Notification channel
ws://localhost:8000/ws/chat — Chat channel

Send JSON data:

json

{
  "to": "receiver@email.com",
  "message": "Hello!"
}

📡 REST API Endpoints
Method	Endpoint	Description
POST	/userSignup	Register user with resume
POST	/userLoginEmailSender	Send OTP to email
POST	/otpVerifier	Verify OTP and login
GET	/jobs	List all jobs
POST	/apply/{job_id}	Apply to a job
GET	/user/applied-jobs	View applied jobs
GET	/user/notifications	View notifications
GET	/download-resume/{user_id}	Download resume as PDF
GET	/chat-history	Get chat history

More endpoints available for recruiters...

👨‍💻 Author
Ankit Raj

⭐️ If you like this project...
Star ⭐️ the repo on GitHub and share it with others!
