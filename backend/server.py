from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt

# Try to import emergent integrations, fallback gracefully
try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    EMERGENT_AVAILABLE = True
except ImportError:
    EMERGENT_AVAILABLE = False
    logging.warning("emergentintegrations not available, AI features disabled")

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection with fallback
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'cyberfocus')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'default_secret_change_in_production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Emergent LLM Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Create the main app
app = FastAPI(
    title="CyberFocus API",
    description="Gamified Productivity App Backend",
    version="2.0.0"
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer()

# ============ MODELS ============

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    username: str
    email: str
    level: int = 1
    xp: int = 0
    current_streak: int = 0
    longest_streak: int = 0
    discipline_score: int = 50
    total_tasks_completed: int = 0
    created_at: str

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    skill_tree: str = "General"
    difficulty: int = Field(default=1, ge=1, le=5)
    estimated_minutes: int = 30
    xp_reward: int = 25

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    skill_tree: Optional[str] = None
    difficulty: Optional[int] = None
    estimated_minutes: Optional[int] = None
    completed: Optional[bool] = None

class TaskResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    title: str
    description: str
    skill_tree: str
    difficulty: int
    estimated_minutes: int
    xp_reward: int
    completed: bool
    completed_at: Optional[str] = None
    created_at: str

class BossChallengeResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    challenge_text: str
    difficulty: int
    xp_reward: int
    completed: bool
    date: str

class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    session_id: str

class FocusSessionCreate(BaseModel):
    duration_minutes: int = 25
    task_id: Optional[str] = None

class FocusSessionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    duration_minutes: int
    task_id: Optional[str]
    completed: bool
    xp_earned: int
    started_at: str
    completed_at: Optional[str] = None

class AchievementResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    description: str
    icon: str
    xp_reward: int
    unlocked: bool
    unlocked_at: Optional[str] = None

# ============ HELPERS ============

def create_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = verify_token(credentials.credentials)
    user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def calculate_xp_for_level(level: int) -> int:
    return int(100 * (level ** 1.5))

def calculate_level(xp: int) -> int:
    level = 1
    while xp >= calculate_xp_for_level(level):
        xp -= calculate_xp_for_level(level)
        level += 1
    return level

def calculate_xp_to_next_level(xp: int, level: int) -> tuple:
    total_xp_for_current = sum(calculate_xp_for_level(l) for l in range(1, level))
    current_level_xp = xp - total_xp_for_current
    next_level_xp = calculate_xp_for_level(level)
    return current_level_xp, next_level_xp

# ============ AUTH ROUTES ============

@api_router.post("/auth/register")
async def register(user: UserCreate):
    existing = await db.users.find_one({"email": user.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = bcrypt.hashpw(user.password.encode(), bcrypt.gensalt()).decode()
    
    user_doc = {
        "id": str(uuid.uuid4()),
        "username": user.username,
        "email": user.email,
        "password": hashed_password,
        "level": 1,
        "xp": 0,
        "current_streak": 0,
        "longest_streak": 0,
        "discipline_score": 50,
        "total_tasks_completed": 0,
        "last_active_date": datetime.now(timezone.utc).date().isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    token = create_token(user_doc["id"], user_doc["email"])
    
    # Create clean user response without password and _id
    user_response = {k: v for k, v in user_doc.items() if k not in ["password", "_id"]}
    return {"token": token, "user": user_response}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not bcrypt.checkpw(credentials.password.encode(), user["password"].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Update streak
    today = datetime.now(timezone.utc).date().isoformat()
    yesterday = (datetime.now(timezone.utc).date() - timedelta(days=1)).isoformat()
    
    if user.get("last_active_date") == yesterday:
        new_streak = user.get("current_streak", 0) + 1
        longest = max(user.get("longest_streak", 0), new_streak)
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"current_streak": new_streak, "longest_streak": longest, "last_active_date": today}}
        )
        user["current_streak"] = new_streak
        user["longest_streak"] = longest
    elif user.get("last_active_date") != today:
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"current_streak": 1, "last_active_date": today}}
        )
        user["current_streak"] = 1
    
    token = create_token(user["id"], user["email"])
    user_response = {k: v for k, v in user.items() if k != "password"}
    return {"token": token, "user": user_response}

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

# ============ TASK ROUTES ============

@api_router.post("/tasks", response_model=TaskResponse)
async def create_task(task: TaskCreate, current_user: dict = Depends(get_current_user)):
    xp_reward = task.xp_reward or (task.difficulty * 20 + task.estimated_minutes // 2)
    
    task_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "title": task.title,
        "description": task.description or "",
        "skill_tree": task.skill_tree,
        "difficulty": task.difficulty,
        "estimated_minutes": task.estimated_minutes,
        "xp_reward": xp_reward,
        "completed": False,
        "completed_at": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.tasks.insert_one(task_doc)
    return task_doc

@api_router.get("/tasks", response_model=List[TaskResponse])
async def get_tasks(completed: Optional[bool] = None, current_user: dict = Depends(get_current_user)):
    query = {"user_id": current_user["id"]}
    if completed is not None:
        query["completed"] = completed
    
    tasks = await db.tasks.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return tasks

@api_router.patch("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(task_id: str, task_update: TaskUpdate, current_user: dict = Depends(get_current_user)):
    task = await db.tasks.find_one({"id": task_id, "user_id": current_user["id"]}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = {k: v for k, v in task_update.model_dump().items() if v is not None}
    
    level_up = False
    new_level = current_user["level"]
    
    if task_update.completed and not task["completed"]:
        update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
        
        # Award XP
        new_xp = current_user["xp"] + task["xp_reward"]
        new_level = calculate_level(new_xp)
        level_up = new_level > current_user["level"]
        
        await db.users.update_one(
            {"id": current_user["id"]},
            {
                "$set": {"xp": new_xp, "level": new_level},
                "$inc": {"total_tasks_completed": 1, "discipline_score": 1}
            }
        )
    
    if update_data:
        await db.tasks.update_one({"id": task_id}, {"$set": update_data})
    
    updated_task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    
    if level_up:
        updated_task["level_up"] = True
        updated_task["new_level"] = new_level
        updated_task["xp_earned"] = task["xp_reward"]
    
    return updated_task

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.tasks.delete_one({"id": task_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted"}

# ============ BOSS CHALLENGE ROUTES ============

BOSS_CHALLENGES = [
    "Complete 5 tasks without distraction",
    "Work for 2 hours straight in Focus Mode",
    "Finish your most difficult task today",
    "Complete all pending tasks from yesterday",
    "Learn something new and create a task about it",
    "Help someone else with their task",
    "Wake up early and complete 3 tasks before noon",
    "No social media until you complete 3 tasks",
    "Complete a task you've been procrastinating on",
    "Double your daily task completion rate"
]

@api_router.get("/boss-challenge/today", response_model=BossChallengeResponse)
async def get_todays_boss_challenge(current_user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).date().isoformat()
    
    challenge = await db.boss_challenges.find_one(
        {"user_id": current_user["id"], "date": today},
        {"_id": 0}
    )
    
    if not challenge:
        import random
        challenge_text = random.choice(BOSS_CHALLENGES)
        difficulty = random.randint(3, 5)
        
        challenge = {
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "challenge_text": challenge_text,
            "difficulty": difficulty,
            "xp_reward": difficulty * 50,
            "completed": False,
            "date": today
        }
        await db.boss_challenges.insert_one(challenge)
    
    return challenge

@api_router.post("/boss-challenge/{challenge_id}/complete")
async def complete_boss_challenge(challenge_id: str, current_user: dict = Depends(get_current_user)):
    challenge = await db.boss_challenges.find_one(
        {"id": challenge_id, "user_id": current_user["id"]},
        {"_id": 0}
    )
    
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    if challenge["completed"]:
        raise HTTPException(status_code=400, detail="Challenge already completed")
    
    await db.boss_challenges.update_one(
        {"id": challenge_id},
        {"$set": {"completed": True}}
    )
    
    new_xp = current_user["xp"] + challenge["xp_reward"]
    new_level = calculate_level(new_xp)
    level_up = new_level > current_user["level"]
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {
            "$set": {"xp": new_xp, "level": new_level},
            "$inc": {"discipline_score": 5}
        }
    )
    
    return {
        "message": "Boss challenge completed!",
        "xp_earned": challenge["xp_reward"],
        "level_up": level_up,
        "new_level": new_level if level_up else None
    }

# ============ AI COACH ROUTES ============

@api_router.post("/ai-coach/chat", response_model=ChatResponse)
async def chat_with_ai_coach(message: ChatMessage, current_user: dict = Depends(get_current_user)):
    if not EMERGENT_LLM_KEY or not EMERGENT_AVAILABLE:
        raise HTTPException(status_code=500, detail="AI Coach not configured. Please add EMERGENT_LLM_KEY.")
    
    session_id = f"coach_{current_user['id']}"
    
    # Get recent chat history
    history = await db.chat_history.find(
        {"session_id": session_id}
    ).sort("timestamp", -1).limit(10).to_list(10)
    history.reverse()
    
    system_message = f"""You are CyberCoach, an AI productivity coach in a gamified task management system called CyberFocus.
    
User Stats:
- Username: {current_user['username']}
- Level: {current_user['level']}
- XP: {current_user['xp']}
- Current Streak: {current_user['current_streak']} days
- Discipline Score: {current_user['discipline_score']}/100
- Total Tasks Completed: {current_user['total_tasks_completed']}

Your role:
- Motivate users with a cyberpunk warrior mentality
- Give practical productivity advice
- Celebrate their wins and streaks
- Help them set goals and stay focused
- Be energetic, supportive, but direct
- Use gaming/RPG metaphors when appropriate
- Keep responses concise but impactful
"""
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=system_message
        ).with_model("openai", "gpt-4o")
        
        # Add history context
        context = ""
        for h in history:
            role = "User" if h["role"] == "user" else "CyberCoach"
            context += f"{role}: {h['content']}\n"
        
        full_message = f"{context}\nUser: {message.message}" if context else message.message
        
        user_message = UserMessage(text=full_message)
        response = await chat.send_message(user_message)
        
        # Save to history
        await db.chat_history.insert_one({
            "id": str(uuid.uuid4()),
            "session_id": session_id,
            "role": "user",
            "content": message.message,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        await db.chat_history.insert_one({
            "id": str(uuid.uuid4()),
            "session_id": session_id,
            "role": "assistant",
            "content": response,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        return {"response": response, "session_id": session_id}
    except Exception as e:
        logging.error(f"AI Coach error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI Coach error: {str(e)}")

@api_router.get("/ai-coach/history")
async def get_chat_history(current_user: dict = Depends(get_current_user)):
    session_id = f"coach_{current_user['id']}"
    history = await db.chat_history.find(
        {"session_id": session_id},
        {"_id": 0}
    ).sort("timestamp", 1).to_list(50)
    return history

# ============ FOCUS MODE ROUTES ============

@api_router.post("/focus/start", response_model=FocusSessionResponse)
async def start_focus_session(session: FocusSessionCreate, current_user: dict = Depends(get_current_user)):
    session_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "duration_minutes": session.duration_minutes,
        "task_id": session.task_id,
        "completed": False,
        "xp_earned": 0,
        "started_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None
    }
    
    await db.focus_sessions.insert_one(session_doc)
    return session_doc

@api_router.post("/focus/{session_id}/complete")
async def complete_focus_session(session_id: str, current_user: dict = Depends(get_current_user)):
    session = await db.focus_sessions.find_one(
        {"id": session_id, "user_id": current_user["id"]},
        {"_id": 0}
    )
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session["completed"]:
        raise HTTPException(status_code=400, detail="Session already completed")
    
    xp_earned = session["duration_minutes"] * 2
    
    await db.focus_sessions.update_one(
        {"id": session_id},
        {"$set": {
            "completed": True,
            "xp_earned": xp_earned,
            "completed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    new_xp = current_user["xp"] + xp_earned
    new_level = calculate_level(new_xp)
    level_up = new_level > current_user["level"]
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {
            "$set": {"xp": new_xp, "level": new_level},
            "$inc": {"discipline_score": 2}
        }
    )
    
    return {
        "message": "Focus session completed!",
        "xp_earned": xp_earned,
        "level_up": level_up,
        "new_level": new_level if level_up else None
    }

@api_router.get("/focus/history", response_model=List[FocusSessionResponse])
async def get_focus_history(current_user: dict = Depends(get_current_user)):
    sessions = await db.focus_sessions.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("started_at", -1).to_list(20)
    return sessions

# ============ ANALYTICS ROUTES ============

@api_router.get("/analytics/dashboard")
async def get_dashboard_analytics(current_user: dict = Depends(get_current_user)):
    total_tasks = await db.tasks.count_documents({"user_id": current_user["id"], "completed": True})
    pending_tasks = await db.tasks.count_documents({"user_id": current_user["id"], "completed": False})
    
    # Focus time this week
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    focus_sessions = await db.focus_sessions.find(
        {"user_id": current_user["id"], "completed": True, "started_at": {"$gte": week_ago}},
        {"_id": 0}
    ).to_list(100)
    
    total_focus_minutes = sum(s.get("duration_minutes", 0) for s in focus_sessions)
    
    # XP breakdown
    current_xp, next_level_xp = calculate_xp_to_next_level(current_user["xp"], current_user["level"])
    
    # Tasks by skill tree
    pipeline = [
        {"$match": {"user_id": current_user["id"], "completed": True}},
        {"$group": {"_id": "$skill_tree", "count": {"$sum": 1}}}
    ]
    skill_breakdown = await db.tasks.aggregate(pipeline).to_list(20)
    
    return {
        "total_tasks": total_tasks,
        "pending_tasks": pending_tasks,
        "focus_minutes_week": total_focus_minutes,
        "current_xp": current_xp,
        "next_level_xp": next_level_xp,
        "skill_breakdown": {s["_id"]: s["count"] for s in skill_breakdown},
        "level": current_user["level"],
        "streak": current_user.get("current_streak", 0)
    }

@api_router.get("/analytics/weekly")
async def get_weekly_analytics(current_user: dict = Depends(get_current_user)):
    days = []
    for i in range(7):
        date = (datetime.now(timezone.utc) - timedelta(days=i)).date().isoformat()
        
        tasks_completed = await db.tasks.count_documents({
            "user_id": current_user["id"],
            "completed": True,
            "completed_at": {"$regex": f"^{date}"}
        })
        
        focus_sessions = await db.focus_sessions.find({
            "user_id": current_user["id"],
            "completed": True,
            "started_at": {"$regex": f"^{date}"}
        }, {"_id": 0}).to_list(100)
        
        focus_minutes = sum(s.get("duration_minutes", 0) for s in focus_sessions)
        
        days.append({
            "date": date,
            "tasks_completed": tasks_completed,
            "focus_minutes": focus_minutes
        })
    
    days.reverse()
    return days

# ============ ACHIEVEMENTS ROUTES ============

ACHIEVEMENTS = [
    {"id": "first_task", "name": "First Blood", "description": "Complete your first task", "icon": "Sword", "xp_reward": 50, "threshold": 1, "type": "tasks"},
    {"id": "task_10", "name": "Warrior", "description": "Complete 10 tasks", "icon": "Shield", "xp_reward": 100, "threshold": 10, "type": "tasks"},
    {"id": "task_50", "name": "Champion", "description": "Complete 50 tasks", "icon": "Trophy", "xp_reward": 250, "threshold": 50, "type": "tasks"},
    {"id": "task_100", "name": "Legend", "description": "Complete 100 tasks", "icon": "Crown", "xp_reward": 500, "threshold": 100, "type": "tasks"},
    {"id": "streak_3", "name": "Consistent", "description": "Maintain a 3-day streak", "icon": "Flame", "xp_reward": 75, "threshold": 3, "type": "streak"},
    {"id": "streak_7", "name": "On Fire", "description": "Maintain a 7-day streak", "icon": "Zap", "xp_reward": 150, "threshold": 7, "type": "streak"},
    {"id": "streak_30", "name": "Unstoppable", "description": "Maintain a 30-day streak", "icon": "Star", "xp_reward": 500, "threshold": 30, "type": "streak"},
    {"id": "level_5", "name": "Rising Star", "description": "Reach level 5", "icon": "TrendingUp", "xp_reward": 100, "threshold": 5, "type": "level"},
    {"id": "level_10", "name": "Elite", "description": "Reach level 10", "icon": "Award", "xp_reward": 250, "threshold": 10, "type": "level"},
    {"id": "focus_60", "name": "Deep Work", "description": "Complete a 60-minute focus session", "icon": "Target", "xp_reward": 100, "threshold": 60, "type": "focus"}
]

@api_router.get("/achievements", response_model=List[AchievementResponse])
async def get_achievements(current_user: dict = Depends(get_current_user)):
    user_achievements = await db.achievements.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).to_list(100)
    
    unlocked_ids = {a["achievement_id"] for a in user_achievements}
    unlocked_map = {a["achievement_id"]: a for a in user_achievements}
    
    result = []
    for ach in ACHIEVEMENTS:
        is_unlocked = ach["id"] in unlocked_ids
        result.append({
            "id": ach["id"],
            "name": ach["name"],
            "description": ach["description"],
            "icon": ach["icon"],
            "xp_reward": ach["xp_reward"],
            "unlocked": is_unlocked,
            "unlocked_at": unlocked_map.get(ach["id"], {}).get("unlocked_at")
        })
    
    return result

# ============ ADMIN ROUTES ============

ADMIN_USERNAME = "Rebadion"
ADMIN_PASSWORD = "Rebadion2010"

class AdminLogin(BaseModel):
    username: str
    password: str

class QuestCreate(BaseModel):
    title: str
    description: str
    quest_type: str = "daily"  # daily, weekly, boss
    difficulty: int = 3
    xp_reward: int = 100
    questions: Optional[List[dict]] = None  # For multiple choice quests

class NewsCreate(BaseModel):
    title: str
    content: str
    category: str = "announcement"

class LearningContentCreate(BaseModel):
    title: str
    description: str
    content: str
    category: str  # programming, productivity, mindset, etc.
    difficulty: str = "beginner"
    estimated_minutes: int = 15

class MusicTrackCreate(BaseModel):
    title: str
    artist: str
    url: str  # YouTube or other URL
    category: str = "lofi"  # lofi, ambient, classical, nature
    thumbnail: Optional[str] = None

@api_router.post("/admin/login")
async def admin_login(credentials: AdminLogin):
    if credentials.username == ADMIN_USERNAME and credentials.password == ADMIN_PASSWORD:
        token = jwt.encode({
            "admin": True,
            "username": credentials.username,
            "exp": datetime.now(timezone.utc) + timedelta(hours=24)
        }, JWT_SECRET, algorithm=JWT_ALGORITHM)
        return {"token": token, "admin": True, "username": credentials.username}
    raise HTTPException(status_code=401, detail="Invalid admin credentials")

async def verify_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if not payload.get("admin"):
            raise HTTPException(status_code=403, detail="Admin access required")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Admin token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid admin token")

@api_router.get("/admin/stats")
async def get_admin_stats(admin: dict = Depends(verify_admin)):
    total_users = await db.users.count_documents({})
    total_tasks = await db.tasks.count_documents({})
    completed_tasks = await db.tasks.count_documents({"completed": True})
    total_focus_sessions = await db.focus_sessions.count_documents({"completed": True})
    
    # Get users with streaks
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    
    # Sort by streak
    users_by_streak = sorted(users, key=lambda x: x.get("current_streak", 0), reverse=True)[:10]
    
    return {
        "total_users": total_users,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "total_focus_sessions": total_focus_sessions,
        "top_streaks": users_by_streak
    }

@api_router.get("/admin/users")
async def get_all_users(admin: dict = Depends(verify_admin)):
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    return users

@api_router.post("/admin/quests")
async def create_admin_quest(quest: QuestCreate, admin: dict = Depends(verify_admin)):
    quest_doc = {
        "id": str(uuid.uuid4()),
        "title": quest.title,
        "description": quest.description,
        "quest_type": quest.quest_type,
        "difficulty": quest.difficulty,
        "xp_reward": quest.xp_reward,
        "questions": quest.questions or [],
        "active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": "admin"
    }
    await db.admin_quests.insert_one(quest_doc)
    # Return clean document without _id
    return {k: v for k, v in quest_doc.items() if k != "_id"}

@api_router.get("/admin/quests")
async def get_admin_quests(admin: dict = Depends(verify_admin)):
    quests = await db.admin_quests.find({}, {"_id": 0}).to_list(100)
    return quests

@api_router.delete("/admin/quests/{quest_id}")
async def delete_admin_quest(quest_id: str, admin: dict = Depends(verify_admin)):
    result = await db.admin_quests.delete_one({"id": quest_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Quest not found")
    return {"message": "Quest deleted"}

@api_router.post("/admin/news")
async def create_news(news: NewsCreate, admin: dict = Depends(verify_admin)):
    news_doc = {
        "id": str(uuid.uuid4()),
        "title": news.title,
        "content": news.content,
        "category": news.category,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.news.insert_one(news_doc)
    # Return clean document without _id
    return {k: v for k, v in news_doc.items() if k != "_id"}

@api_router.get("/admin/news")
async def get_all_news(admin: dict = Depends(verify_admin)):
    news = await db.news.find({}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return news

@api_router.delete("/admin/news/{news_id}")
async def delete_news(news_id: str, admin: dict = Depends(verify_admin)):
    result = await db.news.delete_one({"id": news_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="News not found")
    return {"message": "News deleted"}

# ============ PUBLIC QUESTS ROUTES ============

@api_router.get("/quests/available")
async def get_available_quests(current_user: dict = Depends(get_current_user)):
    quests = await db.admin_quests.find({"active": True}, {"_id": 0}).to_list(50)
    
    # Check which quests user has completed
    completed = await db.quest_completions.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).to_list(100)
    completed_ids = {c["quest_id"] for c in completed}
    
    for quest in quests:
        quest["completed"] = quest["id"] in completed_ids
    
    return quests

@api_router.post("/quests/{quest_id}/submit")
async def submit_quest(quest_id: str, answers: dict, current_user: dict = Depends(get_current_user)):
    quest = await db.admin_quests.find_one({"id": quest_id}, {"_id": 0})
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    
    # Check if already completed
    existing = await db.quest_completions.find_one({
        "user_id": current_user["id"],
        "quest_id": quest_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Quest already completed")
    
    # Calculate score for multiple choice
    score = 0
    total_questions = len(quest.get("questions", []))
    if total_questions > 0:
        for i, q in enumerate(quest.get("questions", [])):
            user_answer = answers.get("answers", {}).get(str(i))
            if user_answer == q.get("correct_answer"):
                score += 1
    
    # Award XP based on score
    xp_earned = quest["xp_reward"] if total_questions == 0 else int(quest["xp_reward"] * (score / total_questions))
    
    # Save completion
    await db.quest_completions.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "quest_id": quest_id,
        "score": score,
        "total_questions": total_questions,
        "xp_earned": xp_earned,
        "completed_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Update user XP
    new_xp = current_user["xp"] + xp_earned
    new_level = calculate_level(new_xp)
    level_up = new_level > current_user["level"]
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"xp": new_xp, "level": new_level}}
    )
    
    return {
        "score": score,
        "total_questions": total_questions,
        "xp_earned": xp_earned,
        "level_up": level_up,
        "new_level": new_level if level_up else None
    }

# ============ NEWS ROUTES (PUBLIC) ============

@api_router.get("/news")
async def get_public_news():
    news = await db.news.find({}, {"_id": 0}).sort("created_at", -1).to_list(20)
    return news

# ============ LEARNING ROUTES ============

@api_router.post("/admin/learning")
async def create_learning_content(content: LearningContentCreate, admin: dict = Depends(verify_admin)):
    content_doc = {
        "id": str(uuid.uuid4()),
        "title": content.title,
        "description": content.description,
        "content": content.content,
        "category": content.category,
        "difficulty": content.difficulty,
        "estimated_minutes": content.estimated_minutes,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.learning_content.insert_one(content_doc)
    # Return clean document without _id
    return {k: v for k, v in content_doc.items() if k != "_id"}

@api_router.get("/admin/learning")
async def get_all_learning_admin(admin: dict = Depends(verify_admin)):
    content = await db.learning_content.find({}, {"_id": 0}).to_list(100)
    return content

@api_router.delete("/admin/learning/{content_id}")
async def delete_learning_content(content_id: str, admin: dict = Depends(verify_admin)):
    result = await db.learning_content.delete_one({"id": content_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Content not found")
    return {"message": "Content deleted"}

@api_router.get("/learning")
async def get_learning_content(category: Optional[str] = None):
    query = {} if not category else {"category": category}
    content = await db.learning_content.find(query, {"_id": 0}).to_list(100)
    return content

@api_router.get("/learning/{content_id}")
async def get_learning_detail(content_id: str):
    content = await db.learning_content.find_one({"id": content_id}, {"_id": 0})
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    return content

@api_router.post("/learning/{content_id}/complete")
async def complete_learning(content_id: str, current_user: dict = Depends(get_current_user)):
    content = await db.learning_content.find_one({"id": content_id}, {"_id": 0})
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    # Check if already completed
    existing = await db.learning_completions.find_one({
        "user_id": current_user["id"],
        "content_id": content_id
    })
    if existing:
        return {"message": "Already completed", "xp_earned": 0}
    
    xp_earned = content["estimated_minutes"] * 2
    
    await db.learning_completions.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "content_id": content_id,
        "xp_earned": xp_earned,
        "completed_at": datetime.now(timezone.utc).isoformat()
    })
    
    new_xp = current_user["xp"] + xp_earned
    new_level = calculate_level(new_xp)
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"xp": new_xp, "level": new_level}}
    )
    
    return {"message": "Learning completed!", "xp_earned": xp_earned}

# ============ MUSIC ROUTES ============

# Default music tracks
DEFAULT_MUSIC = [
    {"id": "1", "title": "Lofi Hip Hop Radio", "artist": "Lofi Girl", "url": "https://www.youtube.com/watch?v=jfKfPfyJRdk", "category": "lofi", "thumbnail": "https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg"},
    {"id": "2", "title": "Chill Coding Music", "artist": "Programming Music", "url": "https://www.youtube.com/watch?v=f02mOEt11OQ", "category": "lofi", "thumbnail": "https://i.ytimg.com/vi/f02mOEt11OQ/hqdefault.jpg"},
    {"id": "3", "title": "Deep Focus Music", "artist": "Study Music", "url": "https://www.youtube.com/watch?v=lTRiuFIWV54", "category": "ambient", "thumbnail": "https://i.ytimg.com/vi/lTRiuFIWV54/hqdefault.jpg"},
    {"id": "4", "title": "Relaxing Piano Music", "artist": "Classical Study", "url": "https://www.youtube.com/watch?v=77ZozI0rw7w", "category": "classical", "thumbnail": "https://i.ytimg.com/vi/77ZozI0rw7w/hqdefault.jpg"},
    {"id": "5", "title": "Nature Sounds - Rain", "artist": "Nature Ambience", "url": "https://www.youtube.com/watch?v=mPZkdNFkNps", "category": "nature", "thumbnail": "https://i.ytimg.com/vi/mPZkdNFkNps/hqdefault.jpg"},
    {"id": "6", "title": "Synthwave Radio", "artist": "Retro Vibes", "url": "https://www.youtube.com/watch?v=4xDzrJKXOOY", "category": "synthwave", "thumbnail": "https://i.ytimg.com/vi/4xDzrJKXOOY/hqdefault.jpg"},
]

@api_router.post("/admin/music")
async def add_music_track(track: MusicTrackCreate, admin: dict = Depends(verify_admin)):
    track_doc = {
        "id": str(uuid.uuid4()),
        "title": track.title,
        "artist": track.artist,
        "url": track.url,
        "category": track.category,
        "thumbnail": track.thumbnail or "",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.music_tracks.insert_one(track_doc)
    # Return clean document without _id
    return {k: v for k, v in track_doc.items() if k != "_id"}

@api_router.get("/admin/music")
async def get_all_music_admin(admin: dict = Depends(verify_admin)):
    tracks = await db.music_tracks.find({}, {"_id": 0}).to_list(100)
    return DEFAULT_MUSIC + tracks

@api_router.delete("/admin/music/{track_id}")
async def delete_music_track(track_id: str, admin: dict = Depends(verify_admin)):
    result = await db.music_tracks.delete_one({"id": track_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Track not found")
    return {"message": "Track deleted"}

@api_router.get("/music")
async def get_music_tracks(category: Optional[str] = None):
    custom_tracks = await db.music_tracks.find({}, {"_id": 0}).to_list(100)
    all_tracks = DEFAULT_MUSIC + custom_tracks
    
    if category:
        all_tracks = [t for t in all_tracks if t.get("category") == category]
    
    return all_tracks

# ============ USER SETTINGS ============

class UserSettings(BaseModel):
    music_enabled: bool = True
    music_volume: int = 50
    preferred_music_category: str = "lofi"
    notifications_enabled: bool = True
    focus_duration: int = 25
    theme: str = "dark"

@api_router.get("/settings")
async def get_user_settings(current_user: dict = Depends(get_current_user)):
    settings = await db.user_settings.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not settings:
        # Return defaults
        return {
            "user_id": current_user["id"],
            "music_enabled": True,
            "music_volume": 50,
            "preferred_music_category": "lofi",
            "notifications_enabled": True,
            "focus_duration": 25,
            "theme": "dark"
        }
    return settings

@api_router.put("/settings")
async def update_user_settings(settings: UserSettings, current_user: dict = Depends(get_current_user)):
    settings_doc = {
        "user_id": current_user["id"],
        **settings.model_dump()
    }
    await db.user_settings.update_one(
        {"user_id": current_user["id"]},
        {"$set": settings_doc},
        upsert=True
    )
    return settings_doc

# ============ AI TASK SUGGESTIONS ============

class TaskSuggestionRequest(BaseModel):
    context: str  # What the user is working on
    skill_tree: Optional[str] = None

@api_router.post("/ai/suggest-task")
async def suggest_task(request: TaskSuggestionRequest, current_user: dict = Depends(get_current_user)):
    if not EMERGENT_LLM_KEY or not EMERGENT_AVAILABLE:
        # Return a basic suggestion if AI is not available
        return {
            "title": request.context[:60],
            "description": "Task created from your description",
            "difficulty": 2,
            "estimated_minutes": 30,
            "skill_tree": request.skill_tree or "General"
        }
    
    system_message = """You are a task creation assistant for a gamified productivity app.
Based on the user's context, suggest a specific, actionable task.
Return a JSON object with:
- title: A clear, concise task title (max 60 chars)
- description: Brief description of what to do
- difficulty: Number 1-5 based on complexity
- estimated_minutes: Realistic time estimate
- skill_tree: Category (Work, Learning, Health, Creative, Social, General)

Only return valid JSON, no markdown or explanation."""
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"task_suggest_{current_user['id']}_{datetime.now().timestamp()}",
            system_message=system_message
        ).with_model("openai", "gpt-4o")
        
        prompt = f"User context: {request.context}"
        if request.skill_tree:
            prompt += f"\nPreferred category: {request.skill_tree}"
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Try to parse JSON
        import json
        try:
            # Clean response
            response = response.strip()
            if response.startswith("```json"):
                response = response[7:]
            if response.startswith("```"):
                response = response[3:]
            if response.endswith("```"):
                response = response[:-3]
            
            task_data = json.loads(response.strip())
            return task_data
        except json.JSONDecodeError:
            return {
                "title": request.context[:60],
                "description": "AI-suggested task",
                "difficulty": 2,
                "estimated_minutes": 30,
                "skill_tree": request.skill_tree or "General"
            }
    except Exception as e:
        logging.error(f"AI task suggestion error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")

# ============ DATA ROUTES (for testing) ============

@api_router.get("/data")
async def get_data():
    return {"message": "CyberFocus API is running", "status": "operational"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

@api_router.get("/")
async def root():
    return {"message": "Welcome to CyberFocus API", "version": "2.0.0"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
