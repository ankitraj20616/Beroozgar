from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from config import setting
from contextlib import contextmanager

DATABASE_URL = setting.DATABASE_URL

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit = False, autoflush= False, bind= engine)

Base = declarative_base()

def get_db():
    db  = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@contextmanager
def get_db_sync():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()