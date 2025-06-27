# Instrusction before runing the test so that pytest can recognize every file which is outside test
# (beroozgar-py3.10) E:\git\Beroozgar\Beroozgar>set PYTHONPATH=.
# (beroozgar-py3.10) E:\git\Beroozgar\Beroozgar>pytest

from unittest.mock import patch



def test_user_sign_up(client):
    response = client.post(
        "/userSignup",
        data = {
            "name": "Ankit Test",
            "email": "ankitrajthakur804@gmail.com",
            "phone": "9999999999",
            "skills": "Python, FastAPI",
            "experience": "2 years",
            "education": "B.Tech"
        },
        files = {"resume": ("resume.pdf", b"dummy resume data", "application/pdf")}
    )
    assert response.status_code == 200
    assert response.json()["message"] == "ankitrajthakur804@gmail.com is registered now."

def test_duplicate_user_signup(client):
    response = client.post("/userSignup",
                          data = {
                                "name": "Duplicate",
                                "email": "ankitrajthakur804@gmail.com",  
                                "phone": "9999999999",
                                "skills": "Python",
                                "experience": "1 year",
                                "education": "M.Tech"
                          },
                          files = {"resume": ("resume.pdf", b"dummy", "application/pdf")}
                          )
    assert response.status_code == 400


def test_user_login_email_sender(client):
    user_data = {"email": "ankitrajthakur804@gmail.com"}
    response = client.post("/userLoginEmailSender", json= user_data)
    assert response.status_code == 200
    assert "otp" in response.json()

@patch("routers.mail_sender")
def test_otp_verifier_and_cookie(mock_mail_sender, client):
    user_email = "ankitrajthakur804@gmail.com"
    fake_otp = 123456

    mock_mail_sender.return_value = {"status" : "Email sent successfully!", "otp": fake_otp}

    response = client.post("/userLoginEmailSender", json={"email": user_email})
    assert response.status_code == 200
    assert response.json()["otp"] == fake_otp

    response = client.post(f"/otpVerifier?otp={fake_otp}&email={user_email}")
    assert response.status_code == 200
    assert "set-cookie" in response.headers


def test_protected_route(client):
    response = client.get("/protected-route")
    if response.status_code == 401:
        assert response.json()["detail"] == "Unauthorized, token not found."

def test_logout(client):
    response = client.post("/logout")
    assert response.status_code == 200
    assert response.json()["message"] == "Logged out successfully."

def test_recruiter_signup(client):
    response = client.post("/recruiter-signup", json={
        "name": "Recruiter",
        "email": "ankitrajthakur805@gmail.com",
        "company": "TestCorp",
        "phone": "1234567890"
    })
    assert response.status_code == 200
    assert response.json()["message"] == "ankitrajthakur805@gmail.com is registered now."

def test_create_job(client):
    json_data = {
        "title": "Backend Developer",
        "description": "FastAPI, SQLAlchemy",
        "skills_required": "Python",
        "experience_required": "1-3 years",
        "salary": "6 LPA",
        "location": "Remote",
        "status": "Open"
    }
    response = client.post("/new-job", json= json_data)
    assert response.status_code in [200, 401, 403]

def test_create_job_unauthenticated(client):
    job_data = {
        "title": "Frontend Dev",
        "description": "ReactJS",
        "skills_required": "JavaScript",
        "experience_required": "1 year",
        "salary": "5 LPA",
        "location": "Remote",
        "status": "Open"
    }
    response = client.post("/new-job", json=job_data)
    assert response.status_code == 401

def test_get_all_jobs(client):
    response = client.get("/jobs")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_search_jobs(client):
    response = client.get("/jobs/search?title=Backend")
    assert response.status_code == 200

def test_recent_jobs(client):
    response = client.get("/jobs/recent?limit=5")
    assert response.status_code == 200

def test_get_user_notifications(client):
    response = client.get("/user/notifications")
    assert response.status_code in [200, 401]

def test_get_recruiter_notifications(client):
    response = client.get("/recruiter/notifications")
    assert response.status_code in [200, 401]