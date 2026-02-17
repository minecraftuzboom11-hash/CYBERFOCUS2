# CyberFocus - Gamified Productivity App

A full-stack gamified productivity application with XP system, achievements, AI coaching, and more.

## Tech Stack

- **Frontend**: React 19 + Tailwind CSS + Framer Motion
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **AI**: OpenAI GPT-4o via Emergent LLM

## Features

- 🎮 XP & Level System with animations
- ✅ Task Management with difficulty ratings
- ⚔️ Daily Boss Challenges
- 🤖 AI Coach for productivity tips
- 🎯 Focus Mode (Pomodoro timer)
- 📊 Analytics Dashboard
- 🏆 Achievements System
- 📚 Learning Hub
- 🎵 Study Music Player
- 🛡️ Admin Panel

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

## Render Deployment

### Option 1: Blueprint Deployment

1. Fork this repository
2. Connect your GitHub to Render
3. Create a new Blueprint and select this repo
4. Render will automatically deploy using `render.yaml`

### Option 2: Manual Deployment

#### Backend Service

1. Create a new **Web Service** on Render
2. Connect your repository
3. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
4. Add Environment Variables:
   - `MONGO_URL`: Your MongoDB connection string
   - `JWT_SECRET`: A secure random string
   - `EMERGENT_LLM_KEY`: Your Emergent LLM API key (optional)
   - `CORS_ORIGINS`: Your frontend URL

#### Frontend Service

1. Create a new **Static Site** on Render
2. Connect your repository
3. Configure:
   - **Root Directory**: `frontend`
   - **Build Command**: `yarn install && yarn build`
   - **Publish Directory**: `build`
4. Add Environment Variables:
   - `REACT_APP_BACKEND_URL`: Your backend service URL

## Environment Variables

### Backend (.env)

```
MONGO_URL=mongodb+srv://...
DB_NAME=cyberfocus
JWT_SECRET=your-secret-key
EMERGENT_LLM_KEY=sk-emergent-...
CORS_ORIGINS=https://your-frontend.onrender.com
```

### Frontend (.env)

```
REACT_APP_BACKEND_URL=https://your-backend.onrender.com
```

## Admin Panel

Access the admin panel at `/admin` with:
- **Username**: Rebadion
- **Password**: Rebadion2010

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/tasks` - Get user tasks
- `POST /api/tasks` - Create task
- `GET /api/boss-challenge/today` - Daily challenge
- `POST /api/ai-coach/chat` - AI coaching
- `GET /api/music` - Study music tracks
- `GET /api/learning` - Learning content
- `GET /api/health` - Health check

## License

MIT
