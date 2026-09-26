from pydantic import BaseModel, EmailStr
from typing import Optional, Literal

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    role: Literal["customer", "business"]
    location: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    user_id: str
    role: Literal["customer", "business"]
    token: str
    is_first_time: bool
