# Beroozgar 🚀

A modular, FastAPI-powered backend for a job portal platform, supporting user/recruiter signup and authentication, job management, applications, notifications, and real-time chat/interview scheduling.

---

## 📦 Key Features

- 🧑‍💻 **User & Recruiter Onboarding**: Secure multipart form signup with resume upload.
- ✉️ **OTP Login**: Email-based login for users with one-time-password tokens.
- 🔒 **JWT Authentication**: Cookie-based JWT handling, protected routes.
- 💼 **Job Management**: Recruiters post jobs; users can apply, scored by AI.
- 🧠 **Resume Scoring**: TF-IDF resume matching against job descriptions/skills.
- 🔔 **Notifications**: Email and in-app notifications for events.
- 🎙️ **Interview Scheduling**: Recruiters can schedule & notify candidates.
- 💬 **Real-time Chat**: Users and recruiters chat via WebSockets.
- 🧪 **Automated Testing**: End-to-end coverage using `pytest` & mocks.

---

## 🌐 Project Structure

Beroozgar/
├── auth.py # JWT token management
├── config.py # Env-based settings using Pydantic
├── database.py # SQLAlchemy DB setup, session management
├── main.py # FastAPI app initialization + DB creation
├── models.py # SQLAlchemy ORM models
├── routers.py # API endpoints & WebSocket logic
├── schemas.py # Pydantic models for validation
├── utils.py # Helpers: OTP, scoring, email, notifications
├── tests/
│ ├── conftest.py # Test fixtures
│ └── test_apis.py # Integration & route tests
├── .env.example # Env var template
├── pyproject.toml # Poetry config
├── poetry.lock # Locked dependencies
└── README.md # ← You are here

---

## ⚙️ Setup & Installation

1. **Clone repo**
   ```bash
   git clone https://github.com/ankitraj20616/Beroozgar.git
   cd Beroozgar

Install dependencies
bash
poetry install

Environment variables
bash
cp .env.example .env
Fill in database URL, email creds, JWT keys, etc.

Run the API
bash
uvicorn main:app --reload
Access docs at http://127.0.0.1:8000/docs.

🧪 Running Tests
Bootstrap test fixtures and run:
bash
export PYTHONPATH=.
pytest -q
Covers signup, duplicate checks, login OTP, JWT, job CRUD, and notifications.

🔐 Authentication Flow
User Signup (POST /userSignup)
Multipart form data + resume upload.
OTP Login (POST /userLoginEmailSender + POST /otpVerifier)
Generates OTP, stores in DB, returns JWT in cookie.
Access Protected Routes via JWT in cookie.

📧 Email, Resume & Scoring
Emails sent via Gmail SMTP using credentials in .env.
Resume content parsed via pdfplumber.
Job–Resume matching using TF-IDF & cosine_similarity.

💼 Job & Application Workflow
Recruiter Signup → POST /recruiter-signup
Post Job → POST /new-job
View Jobs → GET /jobs, /job/{id}, /jobs/search, /jobs/recent

Apply to Job:
POST /apply/{job_id}
Parses resume, scores, sends notifications, persists application.
View Applications → /user/applied-jobs, /recruiter/job/{job_id}/applications

🎙️ Interview & Notifications
Schedule Interview → POST /schedule-interview
Sends email & in-app notifications to both parties.
Get Notifications → /user/notifications, /recruiter/notifications
Mark Read Notification → PUT /notification/{id}/read

💬 Real-Time Chat
WebSockets at /ws/chat for authenticated users.
Persist chat messages in DB.
Retrieve history: GET /chat-history?with_email={email}

🔧 Utility Functions
otp_generator(), mail_sender() for email OTPs.
score_resume_against_job() returns % match + review.
notification_sender(), create_notification() manage notifications.

✅ Contributing
Fork & clone repository
Create branch (git checkout -b feature/my-feature)
Commit with meaningful messages and tests
Open a Pull Request

