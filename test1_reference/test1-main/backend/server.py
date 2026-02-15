from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from jose import jwt
# passlib removed (bcrypt version mismatch in some environments)

import os
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import Any, Dict, List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import random


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ.get('MONGO_URL') or 'mongodb://localhost:27017'
# In production, .env may not be present; default DB_NAME to keep the app booting.
db_name = os.environ.get('DB_NAME') or 'levelup_db'
jwt_secret = os.environ.get('JWT_SECRET', 'dev-secret')

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

app = FastAPI()
api_router = APIRouter(prefix="/api")

security = HTTPBearer(auto_error=False)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


def strip_mongo_id(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not doc:
        return None
    doc.pop('_id', None)
    return doc


def sign_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "iat": int(datetime.now(timezone.utc).timestamp()),
        "exp": int((datetime.now(timezone.utc) + timedelta(days=30)).timestamp()),
    }
    return jwt.encode(payload, jwt_secret, algorithm="HS256")


async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    if not creds or creds.scheme.lower() != 'bearer':
        raise HTTPException(status_code=401, detail='Invalid authentication credentials')

    try:
        payload = jwt.decode(creds.credentials, jwt_secret, algorithms=["HS256"])
        user_id = payload.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail='Invalid authentication credentials')
    except Exception:
        raise HTTPException(status_code=401, detail='Invalid authentication credentials')

    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail='Invalid authentication credentials')
    return user


def user_public(user: Dict[str, Any]) -> Dict[str, Any]:
    # Frontend expects mostly snake_case, but some parts use camelCase.
    # Return both for safety.
    hashed = user.get('hashedPassword')
    u = dict(user)
    u.pop('_id', None)
    if hashed is not None:
        u.pop('hashedPassword', None)

    # Ensure mirrored keys
    u.setdefault('total_xp', u.get('totalXp', 0))
    u.setdefault('totalXp', u.get('total_xp', 0))

    u.setdefault('current_streak', u.get('currentStreak', 0))
    u.setdefault('currentStreak', u.get('current_streak', 0))

    u.setdefault('longest_streak', u.get('longestStreak', 0))
    u.setdefault('longestStreak', u.get('longest_streak', 0))

    u.setdefault('discipline_score', u.get('disciplineScore', 50))
    u.setdefault('disciplineScore', u.get('discipline_score', 50))

    u.setdefault('background_tokens', u.get('backgroundTokens', 0))
    u.setdefault('backgroundTokens', u.get('background_tokens', 0))

    return u


# ----------------------------
# Models
# ----------------------------
class AuthSignupIn(BaseModel):
    email: str
    username: str
    password: str


class AuthLoginIn(BaseModel):
    email: str
    password: str


class AuthOut(BaseModel):
    access_token: str
    token_type: str = 'bearer'
    user: Dict[str, Any]


class TaskCreateIn(BaseModel):
    title: str
    description: Optional[str] = ''
    skill_tree: str = 'Mind'
    difficulty: int = 1
    estimated_minutes: int = 10


class FocusSessionCreateIn(BaseModel):
    mode: str


class FocusSessionEndIn(BaseModel):
    duration_minutes: int


class MoodIn(BaseModel):
    mood: str
    energy: int
    notes: Optional[str] = ''


class SystemAccessIn(BaseModel):
    username: str
    password: str


class GlobalQuestIn(BaseModel):
    title: str
    description: Optional[str] = ''
    xp_reward: int
    category: str = 'productivity'
    difficulty: str = 'medium'
    expires_at: Optional[str] = None


# ----------------------------
# Health + public
# ----------------------------
@app.get('/healthz')
async def healthz_root():
    return {"status": "ok"}


@api_router.get('/healthz')
async def healthz_api():
    return {"status": "ok"}


@api_router.get('/version')
async def api_version():
    return {"backend": "fastapi", "version": "2026-02-14"}


@api_router.get('/public/stats')
async def public_stats():
    total_users = await db.users.count_documents({})
    completed_tasks = await db.tasks.count_documents({"completed": True})
    all_tasks = await db.tasks.count_documents({})
    success_rate = round((completed_tasks / all_tasks) * 100) if all_tasks else 95
    return {"total_users": total_users, "completed_tasks": completed_tasks, "success_rate": success_rate}


# ----------------------------
# Auth
# ----------------------------
@api_router.post('/auth/signup', response_model=AuthOut)
async def auth_signup(inp: AuthSignupIn):
    email = inp.email.strip().lower()
    username = inp.username.strip()

    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail='Email already registered')

    import bcrypt
    hashed = bcrypt.hashpw(inp.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    user = {
        "id": new_id(),
        "email": email,
        "username": username,
        "hashedPassword": hashed,
        "level": 1,
        "xp": 0,
        "totalXp": 0,
        "currentStreak": 0,
        "longestStreak": 0,
        "disciplineScore": 50,
        "backgroundTokens": 10,
        "country": "Unknown",
        "createdAt": now_iso(),
        "lastActive": now_iso(),
    }

    await db.users.insert_one(user)

    # initialize skill trees
    for skill in ["Mind", "Knowledge", "Discipline", "Fitness"]:
        await db.skill_trees.insert_one(
            {
                "id": new_id(),
                "userId": user["id"],
                "skillTree": skill,
                "level": 1,
                "xp": 0,
                "totalXp": 0,
            }
        )

    token = sign_token(user["id"])
    return {"access_token": token, "token_type": "bearer", "user": user_public(user)}


@api_router.post('/auth/login', response_model=AuthOut)
async def auth_login(inp: AuthLoginIn):
    email = inp.email.strip().lower()

    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail='Invalid credentials')

    hashed = user.get('hashedPassword')
    if not hashed:
        raise HTTPException(status_code=401, detail='Invalid credentials')

    import bcrypt
    try:
        valid = bcrypt.checkpw(inp.password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        valid = False
    if not valid:
        raise HTTPException(status_code=401, detail='Invalid credentials')

    await db.users.update_one({"id": user["id"]}, {"$set": {"lastActive": now_iso()}})

    token = sign_token(user["id"])
    return {"access_token": token, "token_type": "bearer", "user": user_public(user)}


@api_router.get('/auth/me')
async def auth_me(user: Dict[str, Any] = Depends(get_current_user)):
    return user_public(user)


# ----------------------------
# Tasks
# ----------------------------
def xp_for_next_level(level: int) -> int:
    if level >= 1000:
        return 0
    return level * level * 100


def level_from_total_xp(total_xp: int) -> int:
    lvl = int((total_xp / 100) ** 0.5) + 1
    return max(1, min(1000, lvl))


def calc_task_xp(difficulty: int, estimated_minutes: int, streak: int) -> int:
    base = max(1, difficulty) * 20
    time_bonus = max(1, estimated_minutes) * 2
    multiplier = min(1.0 + max(0, streak) * 0.1, 3.0)
    return int((base + time_bonus) * multiplier)


@api_router.get('/tasks')
async def list_tasks(
    completed: Optional[bool] = Query(default=None),
    limit: int = Query(default=200, ge=1, le=500),
    skip: int = Query(default=0, ge=0),
    user: Dict[str, Any] = Depends(get_current_user),
):
    q: Dict[str, Any] = {"userId": user["id"]}
    if completed is not None:
        q["completed"] = completed

    docs = await db.tasks.find(q, {"_id": 0}).sort("createdAt", -1).skip(skip).limit(limit).to_list(length=limit)

    out = []
    for t in docs:
        out.append(
            {
                **t,
                "skill_tree": t.get("skillTree"),
                "estimated_minutes": t.get("estimatedMinutes"),
                "xp_reward": t.get("xpReward"),
                "user_id": t.get("userId"),
                "created_at": t.get("createdAt"),
                "completed_at": t.get("completedAt"),
            }
        )
    return out


@api_router.post('/tasks')
async def create_task(inp: TaskCreateIn, user: Dict[str, Any] = Depends(get_current_user)):
    task = {
        "id": new_id(),
        "userId": user["id"],
        "title": inp.title,
        "description": inp.description or '',
        "skillTree": inp.skill_tree,
        "difficulty": int(inp.difficulty),
        "estimatedMinutes": int(inp.estimated_minutes),
        "xpReward": calc_task_xp(int(inp.difficulty), int(inp.estimated_minutes), int(user.get('currentStreak', 0))),
        "completed": False,
        "createdAt": now_iso(),
        "completedAt": None,
    }
    await db.tasks.insert_one(task)
    task = strip_mongo_id(task)
    return {"success": True, "task": {**task, "skill_tree": task["skillTree"], "estimated_minutes": task["estimatedMinutes"], "xp_reward": task["xpReward"], "user_id": task["userId"], "created_at": task["createdAt"], "completed_at": task["completedAt"]}}


@api_router.patch('/tasks/{task_id}/complete')
async def complete_task(task_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    task = await db.tasks.find_one({"id": task_id, "userId": user["id"]}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail='Task not found')
    if task.get('completed'):
        return {"success": True, "xp_gained": 0, "level_up": False, "new_level": user.get('level', 1)}

    xp_gained = int(task.get('xpReward', 0))
    new_total = int(user.get('totalXp', 0)) + xp_gained
    new_level = level_from_total_xp(new_total)
    level_up = new_level > int(user.get('level', 1))

    await db.tasks.update_one({"id": task_id}, {"$set": {"completed": True, "completedAt": now_iso()}})
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"totalXp": new_total, "level": new_level, "xp": int(user.get('xp', 0)) + xp_gained}},
    )

    return {"success": True, "xp_gained": xp_gained, "level_up": level_up, "new_level": new_level}


@api_router.delete('/tasks/{task_id}')
async def delete_task(task_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    res = await db.tasks.delete_one({"id": task_id, "userId": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail='Task not found')
    return {"success": True}


# ----------------------------
# Analytics
# ----------------------------
@api_router.get('/analytics/dashboard')
async def analytics_dashboard(days: int = Query(default=30, ge=1, le=365), user: Dict[str, Any] = Depends(get_current_user)):
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    tasks = await db.tasks.find({"userId": user["id"], "completed": True, "completedAt": {"$gte": since}}, {"_id": 0}).to_list(length=2000)
    focus = await db.focus_sessions.find({"userId": user["id"], "startTime": {"$gte": since}}, {"_id": 0}).to_list(length=2000)

    total_tasks = len(tasks)
    total_focus_time = sum(int(s.get('durationMinutes') or 0) for s in focus)

    # weekly chart (last 7 days)
    weekly_data = []
    for i in range(6, -1, -1):
        d = datetime.now(timezone.utc) - timedelta(days=i)
        date_str = d.date().isoformat()
        day_tasks = sum(1 for t in tasks if (t.get('completedAt') or '').startswith(date_str))
        day_focus = sum(int(s.get('durationMinutes') or 0) for s in focus if (s.get('startTime') or '').startswith(date_str))
        weekly_data.append({"date": date_str, "tasks": day_tasks, "focus_minutes": day_focus})

    # burnout heuristic
    risk_level = 'low'
    if total_focus_time > 8 * 60 and total_tasks > 20:
        risk_level = 'high'
    elif total_focus_time > 5 * 60:
        risk_level = 'medium'

    burnout_msg = {
        'low': 'You are pacing well. Keep consistency.',
        'medium': 'High output detected. Schedule recovery blocks.',
        'high': 'Burnout risk is high. Reduce load and prioritize sleep.',
    }[risk_level]

    return {
        "total_tasks": total_tasks,
        "total_focus_time": total_focus_time,
        "current_level": user.get('level', 1),
        "current_xp": user.get('xp', 0),
        "next_level_xp": xp_for_next_level(int(user.get('level', 1))),
        "discipline_score": user.get('disciplineScore', 50),
        "current_streak": user.get('currentStreak', 0),
        "longest_streak": user.get('longestStreak', 0),
        "burnout_risk": {"risk_level": risk_level, "message": burnout_msg},
        "optimal_time": "Try scheduling deep work in your most consistent focus window.",
        "weekly_data": weekly_data,
        "window_days": days,
    }


# ----------------------------
# Focus sessions
# ----------------------------
@api_router.post('/focus-sessions')
async def start_focus_session(inp: FocusSessionCreateIn, user: Dict[str, Any] = Depends(get_current_user)):
    sess = {
        "id": new_id(),
        "userId": user["id"],
        "mode": inp.mode,
        "startTime": now_iso(),
        "endTime": None,
        "durationMinutes": 0,
    }
    await db.focus_sessions.insert_one(sess)
    return {"success": True, "session_id": sess["id"]}


@api_router.patch('/focus-sessions/{session_id}/end')
async def end_focus_session(session_id: str, inp: FocusSessionEndIn, user: Dict[str, Any] = Depends(get_current_user)):
    sess = await db.focus_sessions.find_one({"id": session_id, "userId": user["id"]}, {"_id": 0})
    if not sess:
        raise HTTPException(status_code=404, detail='Session not found')

    await db.focus_sessions.update_one(
        {"id": session_id},
        {"$set": {"endTime": now_iso(), "durationMinutes": int(inp.duration_minutes)}},
    )
    return {"success": True}


# ----------------------------
# Quests (simple deterministic generation)
# ----------------------------
QUEST_TEMPLATES = {
    "daily": [
        ("Win the morning", "Complete 1 focused task", 80, "productivity", "easy"),
        ("Deep work burst", "Do 25 minutes of focus", 120, "discipline", "medium"),
        ("Health check", "Drink water and stretch", 60, "wellness", "easy"),
    ],
    "weekly": [
        ("Weekly conquest", "Complete 10 tasks", 500, "productivity", "hard"),
        ("Streak builder", "Maintain a 3-day streak", 350, "discipline", "medium"),
    ],
    "monthly": [
        ("Monthly mastery", "Complete 60 tasks", 2500, "productivity", "legendary"),
    ],
    "micro": [
        ("Micro win", "Do 5 minutes of planning", 30, "learning", "easy"),
        ("Micro win", "Tidy workspace", 30, "wellness", "easy"),
    ],
    "beginner": [
        ("First mission", "Create your first task", 100, "productivity", "easy"),
        ("First focus", "Start a focus session", 120, "discipline", "easy"),
    ],
}


def quest_expiry_iso(qtype: str) -> Optional[str]:
    now = datetime.now(timezone.utc)
    if qtype == 'daily':
        end = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        return end.isoformat()
    if qtype == 'weekly':
        return (now + timedelta(days=7)).isoformat()
    if qtype == 'monthly':
        return (now + timedelta(days=30)).isoformat()
    if qtype == 'micro':
        return (now + timedelta(hours=6)).isoformat()
    if qtype == 'beginner':
        return None
    return None


async def ensure_user_quests(user_id: str, qtype: str) -> List[Dict[str, Any]]:
    existing = await db.quests.find({"userId": user_id, "type": qtype}, {"_id": 0}).to_list(length=200)
    if existing:
        return existing

    templates = QUEST_TEMPLATES.get(qtype, [])
    exp = quest_expiry_iso(qtype)
    quests = []
    for title, desc, xp, cat, diff in templates:
        q = {
            "id": new_id(),
            "userId": user_id,
            "type": qtype,
            "title": title,
            "description": desc,
            "xpReward": xp,
            "category": cat,
            "difficulty": diff,
            "completed": False,
            "createdAt": now_iso(),
            "expiresAt": exp,
            "progress": 0,
            "target": 1,
        }
        quests.append(q)

    if quests:
        await db.quests.insert_many(quests)

    return quests


def quest_public(q: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": q.get('id'),
        "type": q.get('type'),
        "title": q.get('title'),
        "description": q.get('description'),
        "xp_reward": q.get('xpReward'),
        "category": q.get('category'),
        "difficulty": q.get('difficulty'),
        "completed": q.get('completed', False),
        "expires_at": q.get('expiresAt'),
        "progress": q.get('progress', 0),
        "target": q.get('target', 1),
    }


@api_router.get('/quests/{quest_type}')
async def get_quests(quest_type: str, user: Dict[str, Any] = Depends(get_current_user)):
    if quest_type == 'global':
        docs = await db.global_quests.find({}, {"_id": 0}).sort("createdAt", -1).limit(200).to_list(length=200)
        quests = []
        for g in docs:
            quests.append(
                {
                    "id": g.get('id'),
                    "type": "global",
                    "title": g.get('title'),
                    "description": g.get('description'),
                    "xp_reward": g.get('xpReward'),
                    "category": g.get('category'),
                    "difficulty": g.get('difficulty', 'medium'),
                    "completed": False,
                    "expires_at": g.get('expiresAt'),
                    "progress": 0,
                    "target": 1,
                }
            )
        return {"quests": quests, "extra_quests": 0}

    user_quests = await ensure_user_quests(user['id'], quest_type)
    return {"quests": [quest_public(q) for q in user_quests], "extra_quests": 0}


@api_router.post('/quests/{quest_id}/complete')
async def complete_user_quest(
    quest_id: str,
    quest_type: str = Query(default='daily'),
    user: Dict[str, Any] = Depends(get_current_user),
):
    q = await db.quests.find_one({"id": quest_id, "userId": user['id'], "type": quest_type}, {"_id": 0})
    if not q:
        raise HTTPException(status_code=404, detail='Quest not found')
    if q.get('completed'):
        return {"success": True, "xp_gained": 0, "level_up": False, "new_level": user.get('level', 1)}

    xp_gained = int(q.get('xpReward', 0))
    new_total = int(user.get('totalXp', 0)) + xp_gained
    new_level = level_from_total_xp(new_total)
    level_up = new_level > int(user.get('level', 1))

    await db.quests.update_one({"id": quest_id}, {"$set": {"completed": True}})
    await db.users.update_one({"id": user['id']}, {"$set": {"totalXp": new_total, "level": new_level}})

    return {"success": True, "xp_gained": xp_gained, "level_up": level_up, "new_level": new_level}


@api_router.post('/quests/global/{quest_id}/complete')
async def complete_global_quest(quest_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    g = await db.global_quests.find_one({"id": quest_id}, {"_id": 0})
    if not g:
        raise HTTPException(status_code=404, detail='Quest not found')

    # prevent double completion
    existing = await db.user_quest_completions.find_one({"userId": user['id'], "questId": quest_id}, {"_id": 0})
    if existing:
        return {"success": True, "xp_gained": 0, "level_up": False, "new_level": user.get('level', 1)}

    xp_gained = int(g.get('xpReward', 0))
    new_total = int(user.get('totalXp', 0)) + xp_gained
    new_level = level_from_total_xp(new_total)
    level_up = new_level > int(user.get('level', 1))

    await db.user_quest_completions.insert_one({"id": new_id(), "userId": user['id'], "questId": quest_id, "completedAt": now_iso()})
    await db.users.update_one({"id": user['id']}, {"$set": {"totalXp": new_total, "level": new_level}})

    return {"success": True, "xp_gained": xp_gained, "level_up": level_up, "new_level": new_level}


# ----------------------------
# Skill trees
# ----------------------------
@api_router.get('/skill-trees')
async def get_skill_trees(user: Dict[str, Any] = Depends(get_current_user)):
    docs = await db.skill_trees.find({"userId": user['id']}, {"_id": 0}).to_list(length=50)
    out = []
    for t in docs:
        out.append({"id": t.get('id'), "skill_tree": t.get('skillTree'), "level": t.get('level', 1), "xp": t.get('xp', 0), "total_xp": t.get('totalXp', 0)})
    return {"skill_trees": out}


# ----------------------------
# Achievements (simple)
# ----------------------------
@api_router.get('/achievements/available')
async def available_achievements(user: Dict[str, Any] = Depends(get_current_user)):
    tasks_completed = await db.tasks.count_documents({"userId": user['id'], "completed": True})
    focus_count = await db.focus_sessions.count_documents({"userId": user['id'], "endTime": {"$ne": None}})

    achievements = [
        {"id": "first_task", "title": "First Steps", "description": "Complete your first task", "unlocked": tasks_completed >= 1},
        {"id": "focus_master", "title": "Focus Master", "description": "Complete 10 focus sessions", "unlocked": focus_count >= 10},
        {"id": "level_10", "title": "Rising Star", "description": "Reach level 10", "unlocked": int(user.get('level', 1)) >= 10},
    ]
    return {"achievements": achievements}


# ----------------------------
# Leaderboard
# ----------------------------
@api_router.get('/leaderboard/global')
async def leaderboard_global(timeframe: str = Query(default='all_time'), limit: int = Query(default=100, ge=1, le=200), user: Dict[str, Any] = Depends(get_current_user)):
    # timeframe ignored for now
    docs = await db.users.find({}, {"_id": 0}).sort("totalXp", -1).limit(limit).to_list(length=limit)
    leaderboard = []
    for u in docs:
        leaderboard.append(
            {
                "username": u.get('username'),
                "level": u.get('level', 1),
                "total_xp": u.get('totalXp', 0),
                "current_streak": u.get('currentStreak', 0),
            }
        )

    total_users = await db.users.count_documents({})

    # current user rank
    higher = await db.users.count_documents({"totalXp": {"$gt": int(user.get('totalXp', 0))}})
    current_rank = higher + 1

    return {"leaderboard": leaderboard, "current_user_rank": current_rank, "total_users": total_users, "country": user.get('country', '')}


@api_router.get('/leaderboard/local')
async def leaderboard_local(timeframe: str = Query(default='all_time'), limit: int = Query(default=100, ge=1, le=200), user: Dict[str, Any] = Depends(get_current_user)):
    country = user.get('country', 'Unknown')
    docs = await db.users.find({"country": country}, {"_id": 0}).sort("totalXp", -1).limit(limit).to_list(length=limit)
    leaderboard = []
    for u in docs:
        leaderboard.append(
            {
                "username": u.get('username'),
                "level": u.get('level', 1),
                "total_xp": u.get('totalXp', 0),
                "current_streak": u.get('currentStreak', 0),
            }
        )

    total_users = await db.users.count_documents({"country": country})
    higher = await db.users.count_documents({"country": country, "totalXp": {"$gt": int(user.get('totalXp', 0))}})
    current_rank = higher + 1

    return {"leaderboard": leaderboard, "current_user_rank": current_rank, "total_users": total_users, "country": country}


# ----------------------------
# Background customization
# ----------------------------
@api_router.get('/user/background')
async def get_background(user: Dict[str, Any] = Depends(get_current_user)):
    pref = await db.user_preferences.find_one({"userId": user['id']}, {"_id": 0})
    if not pref:
        return {"background": "default", "tokens": user.get('backgroundTokens', 0)}
    return {"background": pref.get('background', 'default'), "tokens": user.get('backgroundTokens', 0)}


@api_router.post('/user/background/update')
async def update_background(payload: Dict[str, Any], user: Dict[str, Any] = Depends(get_current_user)):
    background = payload.get('background', 'default')
    await db.user_preferences.update_one({"userId": user['id']}, {"$set": {"userId": user['id'], "background": background}}, upsert=True)
    return {"success": True, "background": background}


@api_router.post('/user/background/generate')
async def generate_background(payload: Dict[str, Any], user: Dict[str, Any] = Depends(get_current_user)):
    # MOCK generation (no LLM). Keeps UI functional.
    prompt = (payload.get('prompt') or 'neo gradient').strip()
    options = [
        {"background": f"gradient:{prompt}:cyan-magenta", "cost": 2},
        {"background": f"gradient:{prompt}:purple-blue", "cost": 2},
        {"background": f"gradient:{prompt}:neon-grid", "cost": 2},
    ]
    return {"success": True, "options": options}


# ----------------------------
# System control (admin)
# ----------------------------
async def get_current_admin(creds: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    if not creds or creds.scheme.lower() != 'bearer':
        raise HTTPException(status_code=401, detail='Invalid authentication credentials')

    try:
        payload = jwt.decode(creds.credentials, jwt_secret, algorithms=["HS256"])
        admin_id = payload.get('admin')
        if not admin_id:
            raise HTTPException(status_code=401, detail='Invalid authentication credentials')
    except Exception:
        raise HTTPException(status_code=401, detail='Invalid authentication credentials')

    admin = await db.admins.find_one({"id": admin_id}, {"_id": 0})
    if not admin:
        raise HTTPException(status_code=401, detail='Admin not found')
    return admin


def sign_admin_token(admin_id: str) -> str:
    payload = {
        "admin": admin_id,
        "iat": int(datetime.now(timezone.utc).timestamp()),
        "exp": int((datetime.now(timezone.utc) + timedelta(days=7)).timestamp()),
    }
    return jwt.encode(payload, jwt_secret, algorithm="HS256")


@api_router.post('/system/access')
async def system_access(inp: SystemAccessIn):
    admin = await db.admins.find_one({"username": inp.username}, {"_id": 0})
    if not admin:
        raise HTTPException(status_code=401, detail='Invalid credentials')

    import bcrypt
    admin_hash = admin.get('hashedPassword', '')
    try:
        valid = bcrypt.checkpw(inp.password.encode('utf-8'), admin_hash.encode('utf-8'))
    except Exception:
        valid = False
    if not valid:
        raise HTTPException(status_code=401, detail='Invalid credentials')

    token = sign_admin_token(admin['id'])
    return {"access_token": token, "token_type": "bearer"}


@api_router.get('/system/status')
async def system_status(admin: Dict[str, Any] = Depends(get_current_admin)):
    total_users = await db.users.count_documents({})
    return {"status": "ok", "total_users": total_users}


@api_router.delete('/system/users/{user_id}')
async def system_delete_user(user_id: str, admin: Dict[str, Any] = Depends(get_current_admin)):
    await db.users.delete_one({"id": user_id})
    await db.tasks.delete_many({"userId": user_id})
    await db.quests.delete_many({"userId": user_id})
    return {"success": True}


@api_router.post('/system/admin/create')
async def system_create_admin(payload: Dict[str, Any], admin: Dict[str, Any] = Depends(get_current_admin)):
    username = (payload.get('username') or '').strip()
    password = (payload.get('password') or '').strip()
    if not username or not password:
        raise HTTPException(status_code=400, detail='Missing username or password')

    existing = await db.admins.find_one({"username": username}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail='Admin already exists')

    import bcrypt
    doc = {
        "id": new_id(),
        "username": username,
        "hashedPassword": bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
        "isSuperAdmin": False,
        "createdAt": now_iso(),
    }
    await db.admins.insert_one(doc)
    return {"success": True}


# ----------------------------
# Admin global quest manager
# ----------------------------
@api_router.get('/admin/quests/global')
async def admin_list_global_quests(admin: Dict[str, Any] = Depends(get_current_admin)):
    docs = await db.global_quests.find({}, {"_id": 0}).sort("createdAt", -1).limit(500).to_list(length=500)
    quests = []
    for q in docs:
        quests.append(
            {
                "id": q.get('id'),
                "title": q.get('title'),
                "description": q.get('description', ''),
                "xp_reward": q.get('xpReward', 0),
                "category": q.get('category', 'productivity'),
                "difficulty": q.get('difficulty', 'medium'),
                "expires_at": q.get('expiresAt'),
                "created_at": q.get('createdAt'),
            }
        )
    return {"quests": quests}


@api_router.post('/admin/quests/global')
async def admin_create_global_quest(inp: GlobalQuestIn, admin: Dict[str, Any] = Depends(get_current_admin)):
    doc = {
        "id": new_id(),
        "title": inp.title,
        "description": inp.description or '',
        "xpReward": int(inp.xp_reward),
        "category": inp.category,
        "difficulty": inp.difficulty,
        "expiresAt": inp.expires_at,
        "createdAt": now_iso(),
    }
    await db.global_quests.insert_one(doc)
    return {"success": True, "quest": {"id": doc['id']}}


@api_router.put('/admin/quests/global/{quest_id}')
async def admin_update_global_quest(quest_id: str, inp: GlobalQuestIn, admin: Dict[str, Any] = Depends(get_current_admin)):
    res = await db.global_quests.update_one(
        {"id": quest_id},
        {"$set": {"title": inp.title, "description": inp.description or '', "xpReward": int(inp.xp_reward), "category": inp.category, "difficulty": inp.difficulty, "expiresAt": inp.expires_at}},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail='Quest not found')
    return {"success": True}


@api_router.delete('/admin/quests/global/{quest_id}')
async def admin_delete_global_quest(quest_id: str, admin: Dict[str, Any] = Depends(get_current_admin)):
    res = await db.global_quests.delete_one({"id": quest_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail='Quest not found')
    await db.user_quest_completions.delete_many({"questId": quest_id})
    return {"success": True}


@api_router.get('/admin/quests/stats')
async def admin_global_quest_stats(admin: Dict[str, Any] = Depends(get_current_admin)):
    total_global = await db.global_quests.count_documents({})
    total_completions = await db.user_quest_completions.count_documents({})
    total_users = await db.users.count_documents({})
    return {
        "total_global_quests": total_global,
        "active_quests": total_global,
        "expired_quests": 0,
        "total_completions": total_completions,
        "average_completions_per_user": (total_completions / total_users) if total_users else 0,
    }


# ----------------------------
# AI / Mode endpoints (placeholders, no external AI)
# ----------------------------
@api_router.post('/ai-coach/chat')
async def ai_coach_chat(payload: Dict[str, Any], user: Dict[str, Any] = Depends(get_current_user)):
    message = (payload.get('message') or '').strip()
    return {"reply": f"(Mock coach) I hear you: '{message}'. Pick 1 priority and execute for 25 minutes."}


@api_router.get('/strategist/vision')
async def strategist_get_vision(user: Dict[str, Any] = Depends(get_current_user)):
    doc = await db.strategist_vision.find_one({"userId": user['id']}, {"_id": 0})
    return {"vision": doc.get('vision') if doc else None}


@api_router.post('/strategist/vision')
async def strategist_set_vision(payload: Dict[str, Any], user: Dict[str, Any] = Depends(get_current_user)):
    vision = payload.get('vision')
    await db.strategist_vision.update_one({"userId": user['id']}, {"$set": {"userId": user['id'], "vision": vision, "updatedAt": now_iso()}}, upsert=True)
    return {"success": True}


@api_router.get('/strategist/daily-priority')
async def strategist_daily_priority(user: Dict[str, Any] = Depends(get_current_user)):
    return {"priority": "Ship one meaningful task today. Remove one distraction."}


@api_router.get('/strategist/weekly-analysis')
async def strategist_weekly(user: Dict[str, Any] = Depends(get_current_user)):
    return {"analysis": "(Mock) Your week looks stable. Aim for consistency over intensity."}


@api_router.get('/identity/alter-ego')
async def identity_get(user: Dict[str, Any] = Depends(get_current_user)):
    doc = await db.identity_profiles.find_one({"userId": user['id']}, {"_id": 0})
    return {"alter_ego": doc.get('alterEgo') if doc else None}


@api_router.post('/identity/alter-ego')
async def identity_set(payload: Dict[str, Any], user: Dict[str, Any] = Depends(get_current_user)):
    await db.identity_profiles.update_one({"userId": user['id']}, {"$set": {"userId": user['id'], "alterEgo": payload, "updatedAt": now_iso()}}, upsert=True)
    return {"success": True}


@api_router.get('/identity/decision-scenario')
async def identity_scenario(user: Dict[str, Any] = Depends(get_current_user)):
    return {"scenario": "(Mock) You feel like procrastinating. What do you do?", "options": ["Start for 5 minutes", "Plan next step", "Remove distraction"]}


@api_router.get('/impact/stats')
async def impact_stats(user: Dict[str, Any] = Depends(get_current_user)):
    total = await db.impact_events.count_documents({"userId": user['id']})
    return {"total_contributions": total, "impact_score": total * 10}


@api_router.post('/impact/contribution')
async def impact_contribution(payload: Dict[str, Any], user: Dict[str, Any] = Depends(get_current_user)):
    await db.impact_events.insert_one({"id": new_id(), "userId": user['id'], "type": payload.get('type'), "notes": payload.get('notes'), "createdAt": now_iso()})
    return {"success": True}


@api_router.get('/founder/ideas')
async def founder_ideas(user: Dict[str, Any] = Depends(get_current_user)):
    docs = await db.founder_ideas.find({"userId": user['id']}, {"_id": 0}).sort("createdAt", -1).limit(100).to_list(length=100)
    return {"ideas": docs}


@api_router.post('/founder/ideas')
async def founder_add_idea(payload: Dict[str, Any], user: Dict[str, Any] = Depends(get_current_user)):
    doc = {"id": new_id(), "userId": user['id'], "title": payload.get('title'), "description": payload.get('description', ''), "createdAt": now_iso()}
    await db.founder_ideas.insert_one(doc)
    strip_mongo_id(doc)
    return {"success": True, "idea": doc}


@api_router.post('/psychology/mood')
async def psychology_mood(inp: MoodIn, user: Dict[str, Any] = Depends(get_current_user)):
    doc = {"id": new_id(), "userId": user['id'], "mood": inp.mood, "energy": inp.energy, "notes": inp.notes or '', "createdAt": now_iso()}
    await db.mood_logs.insert_one(doc)
    return {"success": True}


@api_router.get('/psychology/insights')
async def psychology_insights(user: Dict[str, Any] = Depends(get_current_user)):
    last = await db.mood_logs.find({"userId": user['id']}, {"_id": 0}).sort("createdAt", -1).limit(10).to_list(length=10)
    if not last:
        return {"insights": "No mood logs yet. Track one entry to start.", "recent": []}
    avg_energy = sum(int(x.get('energy', 0)) for x in last) / len(last)
    return {"insights": f"(Mock) Your average energy recently is {avg_energy:.1f}/10.", "recent": last}


# ----------------------------
# Boss challenge (mock)
# ----------------------------
@api_router.get('/boss-challenge/today')
async def boss_today(user: Dict[str, Any] = Depends(get_current_user)):
    today = datetime.now(timezone.utc).date().isoformat()
    existing = await db.boss_challenges.find_one({"userId": user['id'], "date": today}, {"_id": 0})
    if existing:
        return {
            "id": existing.get('id'),
            "challenge_text": existing.get('challengeText'),
            "difficulty": existing.get('difficulty', 1),
            "xp_reward": existing.get('xpReward', 200),
            "completed": existing.get('completed', False),
        }

    doc = {
        "id": new_id(),
        "userId": user['id'],
        "date": today,
        "challengeText": "Answer the boss exam to prove mastery.",
        "difficulty": min(5, max(1, int(user.get('level', 1)) // 5 + 1)),
        "xpReward": 200,
        "completed": False,
        "createdAt": now_iso(),
    }
    await db.boss_challenges.insert_one(doc)
    return {"id": doc['id'], "challenge_text": doc['challengeText'], "difficulty": doc['difficulty'], "xp_reward": doc['xpReward'], "completed": False}


@api_router.get('/boss-challenge/{challenge_id}/generate-exam')
async def boss_generate_exam(challenge_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    challenge = await db.boss_challenges.find_one({"id": challenge_id, "userId": user['id']}, {"_id": 0})
    if not challenge:
        raise HTTPException(status_code=404, detail='Challenge not found')

    exam_id = new_id()
    questions = "\n".join([f"Q{i+1}. Pick the best answer (A/B/C/D)." for i in range(5)])

    await db.boss_exams.insert_one({"id": exam_id, "userId": user['id'], "challengeId": challenge_id, "answers": None, "createdAt": now_iso()})

    return {"exam_id": exam_id, "questions": questions}


@api_router.post('/boss-challenge/submit-exam')
async def boss_submit_exam(exam_id: str = Query(...), answers: Dict[str, Any] = None, user: Dict[str, Any] = Depends(get_current_user)):
    exam = await db.boss_exams.find_one({"id": exam_id, "userId": user['id']}, {"_id": 0})
    if not exam:
        raise HTTPException(status_code=404, detail='Exam not found')

    # score mock
    score = random.uniform(40.0, 100.0)
    grade = 'A*' if score >= 95 else 'A' if score >= 85 else 'B' if score >= 70 else 'C' if score >= 50 else 'D' if score >= 40 else 'F'

    xp_gained = 0
    xp_penalty = 0
    extra_quests = 0

    if score >= 50:
        xp_gained = 250
    else:
        xp_penalty = int((50 - score) * 10)
        extra_quests = max(1, int((50 - score) / 10))

    await db.boss_exams.update_one({"id": exam_id}, {"$set": {"answers": answers or {}, "score": score, "grade": grade, "submittedAt": now_iso()}})

    # mark challenge complete + apply xp
    if exam.get('challengeId'):
        await db.boss_challenges.update_one({"id": exam['challengeId']}, {"$set": {"completed": True}})

    new_total = int(user.get('totalXp', 0)) + xp_gained - xp_penalty
    new_total = max(0, new_total)
    new_level = level_from_total_xp(new_total)
    level_up = new_level > int(user.get('level', 1))

    await db.users.update_one({"id": user['id']}, {"$set": {"totalXp": new_total, "level": new_level}})

    return {"grade": grade, "score": score, "xp_gained": xp_gained, "xp_penalty": xp_penalty, "extra_quests": extra_quests, "level_up": level_up, "new_level": new_level}


# ----------------------------
# Startup: ensure super admin exists
# ----------------------------
@app.on_event("startup")
async def startup_init():
    admin_username = os.environ.get('ADMIN_USERNAME', 'Rebadion')
    admin_password = os.environ.get('ADMIN_PASSWORD')

    existing = await db.admins.find_one({"username": admin_username}, {"_id": 0})
    if not existing and admin_password:
        import bcrypt
        await db.admins.insert_one(
            {
                "id": new_id(),
                "username": admin_username,
                "hashedPassword": bcrypt.hashpw(admin_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
                "isSuperAdmin": True,
                "createdAt": now_iso(),
            }
        )


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
