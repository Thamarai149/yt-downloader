# 🔧 Fix Your Render Deployment - "Not Found" Error

## Problem
Your app is deployed at `yt-downloader-re1o.onrender.com` but showing "Not Found"

## Solution - Follow These Steps:

### Step 1: Check Your Render Services

Go to https://dashboard.render.com and verify you have TWO services:

1. **Backend Service** (Web Service)
   - Should be running Node.js
   - URL example: `yt-downloader-backend-xxx.onrender.com`

2. **Frontend Service** (Static Site)
   - Should be serving the React app
   - URL: `yt-downloader-re1o.onrender.com`

---

### Step 2: Fix Backend Service

If you don't have a backend service, create one:

1. Click "New +" → "Web Service"
2. Connect your GitHub repo
3. Configure:
   ```
   Name: yt-downloader-backend
   Root Directory: backend
   Build Command: npm install
   Start Command: npm start
   ```
4. Add Environment Variables:
   ```
   PORT=10000
   NODE_ENV=production
   ALLOWED_ORIGINS=https://yt-downloader-re1o.onrender.com
   ```
5. Deploy and **COPY THE BACKEND URL**

---

### Step 3: Fix Frontend Service

Update your existing frontend service:

1. Go to your frontend service settings
2. Check "Build & Deploy" settings:
   ```
   Root Directory: client
   Build Command: npm install && npm run build
   Publish Directory: dist
   ```

3. Add Environment Variable:
   ```
   VITE_BACKEND_URL=https://[YOUR-BACKEND-URL].onrender.com
   ```
   Replace `[YOUR-BACKEND-URL]` with your actual backend URL from Step 2

4. Click "Manual Deploy" → "Clear build cache & deploy"

---

### Step 4: Update Backend CORS (Important!)

Your backend needs to allow requests from your frontend domain.

In `backend/server.js`, find the CORS configuration and update it:

```javascript
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://yt-downloader-re1o.onrender.com',  // Add your frontend URL
    process.env.ALLOWED_ORIGINS
].filter(Boolean);

app.use(cors({
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
```

Commit and push this change to GitHub - Render will auto-deploy.

---

### Step 5: Wait for Deployment

- Backend: Takes 2-5 minutes
- Frontend: Takes 1-3 minutes
- Check the "Logs" tab to see progress

---

## Alternative: Deploy Both Together (Simpler)

If the above is too complex, deploy as a single service:

### Create a New Web Service:

1. Delete your current services
2. Create ONE "Web Service"
3. Configure:
   ```
   Root Directory: (leave empty)
   Build Command: npm run install:all && npm run build
   Start Command: npm start
   ```
4. This will serve both backend and frontend together

---

## Verify It's Working

After deployment, test these URLs:

1. **Backend Health Check**:
   ```
   https://[backend-url].onrender.com/api/health
   ```
   Should return: `{"status":"ok"}`

2. **Frontend**:
   ```
   https://yt-downloader-re1o.onrender.com
   ```
   Should show your app!

---

## Common Issues:

### "Not Found" Error:
- Frontend build failed
- Check "Logs" tab for errors
- Verify `Publish Directory` is set to `dist`

### "Cannot connect to backend":
- Backend URL not set in environment variables
- CORS not configured properly
- Backend service is sleeping (free tier)

### Backend Sleeping:
- Free tier sleeps after 15 min inactivity
- First request takes 30 seconds to wake up
- Use UptimeRobot.com to keep it awake

---

## Need Help?

Check your Render dashboard logs:
1. Go to your service
2. Click "Logs" tab
3. Look for errors in red

Common error fixes:
- `Module not found`: Run "Clear build cache & deploy"
- `Port already in use`: Backend should use `process.env.PORT`
- `CORS error`: Update CORS origins in backend

---

Your app should be live in 5-10 minutes! 🚀
