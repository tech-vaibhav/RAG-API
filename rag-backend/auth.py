# auth.py

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from database import database
from models import users

SECRET_KEY = "super_secret_key_here"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = HTTPBearer()


router = APIRouter()

class UserIn(BaseModel):
    full_name: str   # add full name where
    username: str
    password: str

class LoginIn(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    full_name: str  # include full name in token response

# Password hashing
def verify_password(plain, hashed): return pwd_context.verify(plain, hashed)
def get_hash(password): return pwd_context.hash(password)

# JWT token creation
def create_token(data: dict, expire: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expire or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_user(username: str):
    query = users.select().where(users.c.username == username)
    row = await database.fetch_one(query)
    return row

@router.post("/signup", status_code=201)
async def signup(user: UserIn):
    if await get_user(user.username):
        raise HTTPException(status_code=400, detail="Username already taken.")
    hashed = get_hash(user.password)
    query = users.insert().values(
        username=user.username,
        full_name=user.full_name,   # <--- save full_name
        hashed_password=hashed
    )
    await database.execute(query)
    return {"message": "User registered successfully"}

@router.post("/login", response_model=Token)
async def login(data: LoginIn):
    user = await get_user(data.username)
    if not user or not verify_password(data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token({"sub": user["username"]}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))

    return {
        "access_token": token,
        "token_type": "bearer",
        "full_name": user["full_name"]
    }

# Protected dependency
async def get_current_user(token: HTTPAuthorizationCredentials = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await get_user(username)
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Token verification failed")
