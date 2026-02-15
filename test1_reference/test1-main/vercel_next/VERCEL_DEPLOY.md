# Quest Dashboard (Next.js) — Vercel Deploy

## 1) Deploy steps
1. Push this folder as its own repo OR set Vercel **Root Directory** to `vercel_next/`.
2. Vercel detects Next.js automatically.
3. Add Environment Variables (below) in Vercel Project Settings.
4. Deploy.

## 2) Environment Variables (REQUIRED)
Set these in **Vercel → Project → Settings → Environment Variables** (Production + Preview):

- `MONGODB_URI`
  - `mongodb+srv://admin:Rebadion2010@rebadion.yhqetqy.mongodb.net/?appName=rebadion`
- `DB_NAME`
  - `quest_dashboard_4`
- `JWT_SECRET`
  - Generate a long random string (32+ chars)
- `ADMIN_USERNAME`
  - `Rebadion`
- `ADMIN_PASSWORD`
  - `Rebadion2010`

Optional:
- `NEXT_PUBLIC_APP_URL`
  - Your deployed URL (e.g., `https://<project>.vercel.app`)

## 3) Smoke tests after deploy
- `GET /api/healthz` should return `{ "status": "ok" }`
- Signup/login at `/auth` should redirect to `/dashboard`

## 4) Pages
- `/` landing
- `/auth` login/signup
- `/dashboard` main menu
- `/tasks`
- `/quests/daily` (and weekly/monthly/beginner/global)
- `/leaderboard`
- `/settings/background`
- `/modes` and `/modes/[mode]` (create + save + list entries)
- `/admin` and `/admin/quests`

## Notes
- Auth is implemented using secure **httpOnly cookies**.
- Music player uses YouTube embeds; user must click Play (no autoplay).
