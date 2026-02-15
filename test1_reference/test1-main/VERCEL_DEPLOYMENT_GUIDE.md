# Vercel Deployment Guide for SPA

## 🎯 Problem Solved
This configuration fixes the "NOT_FOUND" error when accessing SPA routes like `/dashboard`, `/predict`, etc. on Vercel.

## 📁 File Placement

**Place `vercel.json` in your project root directory** (same level as your frontend folder):

```
your-project/
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
├── vercel.json        ← Place here
└── README.md
```

## 🚀 Deployment Steps

### Option 1: Deploy via Vercel CLI

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Navigate to your project root**:
   ```bash
   cd your-project
   ```

3. **Login to Vercel**:
   ```bash
   vercel login
   ```

4. **Deploy**:
   ```bash
   vercel
   ```

5. **Deploy to production**:
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via Vercel Dashboard

1. **Push your code to GitHub/GitLab/Bitbucket**
   - Make sure `vercel.json` is in the repository root

2. **Import project to Vercel**:
   - Go to https://vercel.com/new
   - Click "Import Project"
   - Select your repository

3. **Configure build settings** (auto-detected from vercel.json):
   - **Build Command**: `cd frontend && yarn install && yarn build`
   - **Output Directory**: `frontend/build`
   - **Framework**: Create React App (auto-detected)

4. **Deploy**:
   - Click "Deploy"
   - Vercel will build and deploy automatically

## 🔧 How It Works

### The SPA Routing Problem
- When you visit `/dashboard` directly, the server looks for a file at that path
- Since it doesn't exist (React Router handles it client-side), you get 404

### The Solution
The `vercel.json` configuration:

1. **Rewrites all routes to index.html**:
   ```json
   {
     "source": "/(.*)",
     "destination": "/index.html"
   }
   ```
   - Any route that doesn't match a static file serves `index.html`
   - React app loads and React Router handles the routing

2. **Preserves API routes** (if you have them):
   ```json
   {
     "source": "/api/(.*)",
     "destination": "/api/$1"
   }
   ```
   - API routes are preserved and forwarded correctly

3. **Optimizes caching**:
   - Static assets cached for 1 year
   - HTML files not cached (to get latest version)

## ✅ What Works After Deployment

All these routes will work correctly:
- ✅ `/` - Home page
- ✅ `/dashboard` - Dashboard
- ✅ `/tasks` - Tasks page
- ✅ `/predict` - Predictions
- ✅ `/ai-coach` - AI Coach
- ✅ `/focus` - Focus mode
- ✅ `/analytics` - Analytics
- ✅ `/profile` - Profile
- ✅ Any other React Router route

### Direct URL Access
- ✅ Type `yourapp.vercel.app/dashboard` in browser → Works!
- ✅ Refresh page on any route → Works!
- ✅ Share deep link → Works!

## 🔌 If You Have API Routes (Optional)

### Scenario 1: Separate Backend (Current Setup)
If your backend is deployed separately (e.g., on Heroku, AWS, etc.):

1. **Update environment variable** in Vercel:
   - Dashboard → Settings → Environment Variables
   - Add `REACT_APP_BACKEND_URL` with your backend URL
   - Example: `https://your-backend.herokuapp.com`

2. **Redeploy** for changes to take effect

### Scenario 2: Serverless Functions on Vercel
If you want to add API routes directly in Vercel:

1. **Create `api` directory** in project root:
   ```
   your-project/
   ├── api/
   │   └── hello.js
   ├── frontend/
   └── vercel.json
   ```

2. **Example API function** (`api/hello.js`):
   ```javascript
   export default function handler(req, res) {
     res.status(200).json({ message: 'Hello from API' });
   }
   ```

3. **Access**: `https://your-app.vercel.app/api/hello`

The `vercel.json` already has API route preservation configured!

## 🧪 Testing After Deployment

### 1. Test Direct Access
```bash
# Test various routes
curl -I https://your-app.vercel.app/
curl -I https://your-app.vercel.app/dashboard
curl -I https://your-app.vercel.app/predict
```

All should return `200 OK`

### 2. Test in Browser
1. Visit `https://your-app.vercel.app/dashboard` directly
2. Refresh the page
3. Navigate between pages
4. Share a deep link with someone

Everything should work without 404 errors!

## 📝 Configuration Breakdown

### Rewrites
```json
"rewrites": [
  {
    "source": "/api/(.*)",
    "destination": "/api/$1"
  },
  {
    "source": "/(.*)",
    "destination": "/index.html"
  }
]
```
- **First rule**: Preserve API routes (optional, for future use)
- **Second rule**: All other routes serve index.html

### Routes (Legacy, but included for compatibility)
```json
"routes": [
  {
    "src": "/static/(.*)",
    "dest": "/static/$1"
  },
  {
    "src": "/(.*)",
    "dest": "/index.html"
  }
]
```
- Ensures static files are served correctly
- Fallback to index.html for all other routes

## 🎨 Custom Domain (Optional)

After deployment, add a custom domain:

1. **Go to** Vercel Dashboard → Your Project → Settings → Domains
2. **Add domain**: `yourdomain.com`
3. **Configure DNS**:
   - Type: `CNAME`
   - Name: `@` (or `www`)
   - Value: `cname.vercel-dns.com`
4. **Wait** for DNS propagation (5-10 minutes)

## 🐛 Troubleshooting

### Still Getting 404?
1. **Check vercel.json location**: Must be in project root
2. **Rebuild**: `vercel --prod --force`
3. **Clear cache**: Vercel Dashboard → Deployments → ... → Redeploy

### Build Failing?
1. **Check build command** matches your package.json scripts
2. **Verify dependencies**: Make sure all packages are in package.json
3. **Check logs**: Vercel Dashboard → Deployment → View Logs

### Environment Variables Not Working?
1. **Redeploy after adding** environment variables
2. **Prefix with `REACT_APP_`** for Create React App
3. **Check spelling** and case sensitivity

## 📊 Comparison: Before vs After

| Scenario | Before (No vercel.json) | After (With vercel.json) |
|----------|------------------------|--------------------------|
| Visit `/` | ✅ Works | ✅ Works |
| Visit `/dashboard` directly | ❌ 404 Error | ✅ Works |
| Refresh `/tasks` page | ❌ 404 Error | ✅ Works |
| Share link `/profile` | ❌ 404 Error | ✅ Works |
| Static assets | ✅ Works | ✅ Works (cached better) |

## 🎉 Summary

With the `vercel.json` file:
- ✅ All SPA routes work on Vercel
- ✅ Direct URL access works
- ✅ Page refresh works
- ✅ Deep linking works
- ✅ Optimal caching configured
- ✅ Security headers included
- ✅ API routes preserved (for future use)

**Your SPA is now fully functional on Vercel!** 🚀

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [vercel.json Reference](https://vercel.com/docs/project-configuration)
- [React Router Documentation](https://reactrouter.com/)
- [Create React App Deployment](https://create-react-app.dev/docs/deployment)

---

**Need help?** Contact me or check Vercel's support documentation.
