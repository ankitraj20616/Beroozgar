from dotenv import load_dotenv
load_dotenv()
from pydantic_settings import BaseSettings
from pydantic import ConfigDict
import os

class Settings(BaseSettings):
    webpage_name: str = "Beroozgar"
    DATABASE_URL: str
    TEST_DB_URL: str
    SENDER_EMAIL : str
    SENDER_EMAIL_PASSWORD : str
    JWT_ALGORITHM : str
    JWT_SECRET_KEY : str
    TOKEN_EXPIRE_MINUTES : int
    
    model_config = ConfigDict(env_nested_delimiter = "__")

setting = Settings(_env_file = os.path.join(os.getcwd(), "Beroozgar/.env"))