import uuid
import hashlib
from fastapi import APIRouter, HTTPException, status
from app.models.auth import SignupRequest, LoginRequest, AuthResponse
from app.db.mongo import get_collection

router = APIRouter(prefix="/api/auth", tags=["auth"])

def get_users_collection():
    return get_collection("users")

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

@router.post("/signup", response_model=AuthResponse)
async def signup(request: SignupRequest):
    if len(request.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long"
        )
        
    users_coll = get_users_collection()
    
    # Check if user already exists
    existing_user = users_coll.find_one({"email": request.email.lower()})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    user_id = f"usr_{uuid.uuid4().hex[:8]}"
    
    new_user = {
        "user_id": user_id,
        "email": request.email.lower(),
        "password": hash_password(request.password),
        "role": request.role,
        "location": request.location
    }
    
    users_coll.insert_one(new_user)
        
    return AuthResponse(
        user_id=user_id,
        role=request.role,
        token="mock_jwt_token_12345",
        is_first_time=True
    )


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    users_coll = get_users_collection()
    
    user = users_coll.find_one({
        "email": request.email.lower(),
        "password": hash_password(request.password)
    })
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    return AuthResponse(
        user_id=user["user_id"],
        role=user["role"],
        token="mock_jwt_token_67890",
        is_first_time=False
    )
