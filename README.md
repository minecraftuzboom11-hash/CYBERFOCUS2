# CyberFocus - Gamified Productivity App

A full-stack gamified productivity application with XP system, achievements, AI coaching, and more.

## Tech Stack

- **Frontend**: React 19 + Tailwind CSS + Framer Motion
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **AI**: OpenAI GPT-4o via Emergent LLM

## Features

- 🎮 XP & Level System with animations
- ✅ Task Management with AI suggestions
- ⚔️ Daily Boss Challenges
- 🤖 AI Coach for productivity tips
- 🎯 Focus Mode (Pomodoro timer)
- 📊 Analytics Dashboard
- 🏆 Achievements System
- 📚 Learning Hub
- 🎵 Study Music Player
- 🛡️ Admin Panel (Login: Rebadion / Rebadion2010)

## Render Deployment (Single Web Service)

### Quick Deploy

1. Fork/clone this repository to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click **New** → **Web Service**
4. Connect your GitHub repository
5. Configure:
   - **Name**: `cyberfocus` (or your choice)
   - **Root Directory**: Leave empty (uses root)
   - **Environment**: `Python 3`
   - **Build Command**: `chmod +x build.sh && ./build.sh`
   - **Start Command**: `chmod +x start.sh && ./start.sh`

6. Add Environment Variables:
   | Key | Value |
   |-----|-------|
   | `MONGO_URL` | Your MongoDB connection string |
   | `DB_NAME` | `cyberfocus` |
   | `JWT_SECRET` | Click "Generate" for random value |
   | `CORS_ORIGINS` | `*` |

7. Click **Create Web Service**

### MongoDB Setup (Free Tier)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create free account and cluster
3. Create database user with password
4. Whitelist IP: `0.0.0.0/0` (allow from anywhere)
5. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/cyberfocus`

## Local Development

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8001
```

### Frontend

```bash
cd frontend
yarn install
yarn start
```

## Environment Variables

### Required for Production

```
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/cyberfocus
DB_NAME=cyberfocus
JWT_SECRET=your-secret-key
CORS_ORIGINS=*
```

### Optional (for AI features)

```
EMERGENT_LLM_KEY=sk-emergent-your-key
```

## Admin Panel

Access at `/admin`:
- **Username**: `Rebadion`
- **Password**: `Rebadion2010`

## API Endpoints

All API routes are prefixed with `/api`:

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/tasks` - Get tasks
- `POST /api/tasks` - Create task
- `GET /api/boss-challenge/today` - Daily challenge
- `POST /api/ai-coach/chat` - AI coaching
- `GET /api/music` - Study music
- `GET /api/health` - Health check

## License

MIT
