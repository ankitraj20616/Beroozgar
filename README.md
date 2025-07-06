# Beroozgar 🚀

A full-stack job portal platform with a modular FastAPI backend and interactive frontend, supporting user/recruiter signup and authentication, job management, applications, notifications, and real-time chat/interview scheduling.

## 📦 Key Features

### Backend
- 🧑‍💻 **User & Recruiter Onboarding**: Secure multipart form signup with resume upload
- ✉️ **OTP Login**: Email-based login for users with one-time-password tokens
- 🔒 **JWT Authentication**: Cookie-based JWT handling, protected routes
- 💼 **Job Management**: Recruiters post jobs; users can apply, scored by AI
- 🧠 **Resume Scoring**: TF-IDF resume matching against job descriptions/skills
- 🔔 **Notifications**: Email and in-app notifications for events
- 🎙️ **Interview Scheduling**: Recruiters can schedule & notify candidates
- 💬 **Real-time Chat**: Users and recruiters chat via WebSockets
- 🧪 **Automated Testing**: End-to-end coverage using pytest & mocks

### Frontend
- 🎨 **Responsive UI**: Modern, mobile-friendly interface
- 🔄 **Real-time Updates**: Dynamic content updates without page refresh
- 📱 **Interactive Forms**: User-friendly signup, login, and job application forms
- 💬 **Live Chat Interface**: Real-time messaging between users and recruiters
- 📊 **Dashboard**: Comprehensive user and recruiter dashboards
- 🔍 **Job Search**: Advanced search and filtering capabilities

## 🌐 Project Structure

```
Beroozgar/
├── backend/
│   ├── auth.py              # JWT token management
│   ├── config.py            # Env-based settings using Pydantic
│   ├── database.py          # SQLAlchemy DB setup, session management
│   ├── main.py              # FastAPI app initialization + DB creation
│   ├── models.py            # SQLAlchemy ORM models
│   ├── routers.py           # API endpoints & WebSocket logic
│   ├── schemas.py           # Pydantic models for validation
│   ├── utils.py             # Helpers: OTP, scoring, email, notifications
│   └── tests/
│       ├── conftest.py      # Test fixtures
│       └── test_apis.py     # Integration & route tests
├── frontend/
│   ├── index.html           # Landing page
│   ├── styles.css           # Main stylesheet
│   ├── script.js            # Main JavaScript functionality
│   ├── jquery.min.js        # jQuery library
│   └── package.json         # Frontend dependencies
├── .env.example             # Environment variables template
├── pyproject.toml           # Poetry config
├── poetry.lock              # Locked dependencies
└── README.md                # ← You are here
```

## ⚙️ Setup & Installation

### Prerequisites
- Python 3.8+
- npm (for frontend dependencies)
- Git

### Backend Setup

1. **Clone repository**
   ```bash
   git clone https://github.com/ankitraj20616/Beroozgar.git
   cd Beroozgar
   ```

2. **Install Python dependencies**
   ```bash
   poetry install
   ```

3. **Environment variables**
   ```bash
   cp .env.example .env
   # Fill in database URL, email credentials, JWT keys, etc.
   ```

4. **Run the API**
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install frontend dependencies** (if package.json exists)
   ```bash
   npm install
   ```

3. **Open in browser**
   - Open `index.html` in your browser, or
   - Serve via a local server for best experience:
     ```bash
     python -m http.server 8080
     ```
   - Access at `http://localhost:8080`

### Access Points
- **Backend API**: http://127.0.0.1:8000
- **API Documentation**: http://127.0.0.1:8000/docs
- **Frontend**: http://localhost:8080 (or direct file access)

## 🧪 Running Tests

Bootstrap test fixtures and run:

```bash
export PYTHONPATH=.
pytest -q
```

Covers signup, duplicate checks, login OTP, JWT, job CRUD, and notifications.

## 🔐 Authentication Flow

1. **User Signup** (`POST /userSignup`)
   - Multipart form data + resume upload
   
2. **OTP Login** (`POST /userLoginEmailSender` + `POST /otpVerifier`)
   - Generates OTP, stores in DB, returns JWT in cookie
   
3. **Access Protected Routes** via JWT in cookie

## 📧 Email, Resume & Scoring

- Emails sent via Gmail SMTP using credentials in `.env`
- Resume content parsed via `pdfplumber`
- Job–Resume matching using TF-IDF & cosine_similarity

## 💼 Job & Application Workflow

1. **Recruiter Signup** → `POST /recruiter-signup`
2. **Post Job** → `POST /new-job`
3. **View Jobs** → `GET /jobs`, `/job/{id}`, `/jobs/search`, `/jobs/recent`
4. **Apply to Job** → `POST /apply/{job_id}`
   - Parses resume, scores, sends notifications, persists application
5. **View Applications** → `/user/applied-jobs`, `/recruiter/job/{job_id}/applications`

## 🎙️ Interview & Notifications

- **Schedule Interview** → `POST /schedule-interview`
- Sends email & in-app notifications to both parties
- **Get Notifications** → `/user/notifications`, `/recruiter/notifications`
- **Mark Read Notification** → `PUT /notification/{id}/read`

## 💬 Real-Time Chat

- WebSockets at `/ws/chat` for authenticated users
- Persist chat messages in DB
- Retrieve history: `GET /chat-history?with_email={email}`

## 🔧 Utility Functions

- `otp_generator()`, `mail_sender()` for email OTPs
- `score_resume_against_job()` returns % match + review
- `notification_sender()`, `create_notification()` manage notifications

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern, fast web framework
- **SQLAlchemy** - SQL toolkit and ORM
- **Pydantic** - Data validation using Python type hints
- **JWT** - JSON Web Token authentication
- **WebSockets** - Real-time communication
- **Pytest** - Testing framework

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling and responsive design
- **JavaScript** - Dynamic functionality
- **jQuery** - DOM manipulation and AJAX

## 📱 Browser Support

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## 🚀 Deployment

### Backend
The FastAPI backend can be deployed on platforms like:
- Heroku
- Railway
- DigitalOcean
- AWS/GCP/Azure

### Frontend
The frontend can be deployed on:
- Netlify
- Vercel
- GitHub Pages
- Any static hosting service

## ✅ Contributing

1. Fork & clone repository
2. Create branch (`git checkout -b feature/my-feature`)
3. Make changes to backend and/or frontend
4. Test your changes thoroughly
5. Commit with meaningful messages and tests
6. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Support

For support, email [your-email@example.com] or create an issue in the GitHub repository.

---

**Happy Job Hunting! 🎯**
