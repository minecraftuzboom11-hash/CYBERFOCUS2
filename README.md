# CyberFocus - Gamified Productivity App

## Render Deployment - Single Web Service

### Build Command:
```
cd backend && pip install -r requirements.txt && cd ../frontend && yarn install && yarn build && cp -r build ../backend/static
```

### Start Command:
```
cd backend && uvicorn server:app --host 0.0.0.0 --port $PORT
```

### Environment Variables:

| Key | Value |
|-----|-------|
| `MONGO_URL` | Your MongoDB Atlas connection string |
| `DB_NAME` | `cyberfocus` |
| `JWT_SECRET` | Click "Generate" |
| `CORS_ORIGINS` | `*` |

### Optional (AI features):
| `EMERGENT_LLM_KEY` | Your key (optional) |

---

## MongoDB Atlas Setup (Free)

1. Go to https://www.mongodb.com/atlas
2. Create free cluster
3. Database Access → Add user with password
4. Network Access → Add IP `0.0.0.0/0`
5. Connect → Get connection string:
   ```
   mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/cyberfocus
   ```

## Admin Panel

URL: `/admin`
- Username: `Rebadion`
- Password: `Rebadion2010`

## Features

- 🎮 XP & Level System
- ✅ Task Management + AI suggestions
- ⚔️ Daily Boss Challenges  
- 🤖 AI Coach
- 🎯 Focus Mode (Pomodoro)
- 📊 Analytics
- 🏆 Achievements
- 📚 Learning Hub
- 🎵 Study Music Player
- 🛡️ Admin Panel
