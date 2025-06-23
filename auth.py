import jwt
from fastapi import HTTPException
from starlette import status
from datetime import datetime, timedelta, timezone
from config import setting

class JWTAuth:
    def __init__(self):
        self.secret_key = setting.JWT_SECRET_KEY
        self.jwt_algorithm = setting.JWT_ALGORITHM
        self.token_exp_time = setting.TOKEN_EXPIRE_MINUTES

    def generate_access_token(self, data: dict, exp_time: timedelta | None = None):
        data_to_encode = data.copy()
        if exp_time:
            exp_time = datetime.now(timezone.utc) + exp_time
        else:
            exp_time = datetime.now(timezone.utc) + timedelta(minutes= self.token_exp_time)
        data_to_encode.update({"exp": exp_time})
        encoded_jwt = jwt.encode(data_to_encode, self.secret_key, algorithm= self.jwt_algorithm)
        return encoded_jwt

    def verify_token(self, token: str):
        try:
            payload = jwt.decode(token, self.secret_key, algorithms= [self.jwt_algorithm])
            email: str = payload.get("email")
            if not email:
                raise HTTPException(status_code= status.HTTP_502_BAD_GATEWAY, detail= "JWT token error.")
            return payload
        except Exception as e:
            return {"Error" : str(e)}
        
