


import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from main import app
from database import Base, get_db
from config import setting

test_db = setting.TEST_DB_URL



engine = create_engine(test_db)
Testing_Session_Local = sessionmaker(bind= engine, autocommit=False, autoflush=False)

@pytest.fixture(scope= "session", autouse= True)
def create_test_database():
    Base.metadata.drop_all(bind= engine)
    Base.metadata.create_all(bind= engine)
    yield
    Base.metadata.drop_all(bind= engine)

@pytest.fixture(scope= "function")
def db_session():
    db = Testing_Session_Local()
    try:
        yield db
    finally:
        db.rollback()
        db.close()

def override_get_db():
    db = Testing_Session_Local()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture()
def client():
    return TestClient(app)

# if __name__ == "__main__":
#     print(test_db)