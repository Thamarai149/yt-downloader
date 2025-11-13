# ✅ Render Deployment Checklist

## Your Current Status:
- ✅ Frontend deployed: `yt-downloader-re1o.onrender.com`
- ❌ Backend not connected (showing "Not Found")

## Fix in 3 Steps:

### Step 1: Push Updated Code to GitHub
```cmd
git add .
git commit -m "Fix CORS and add health endpoints for Render"
git push origin main
```

### Step 2: Create Backend Service on Render

1. Go to: https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Select your GitHub repository
4. Configure:

```
Name: yt-downloader-backend
Root Directory: backend
Environment: Node
Build Command: npm install
Start Command: npm start
Plan: Free
```

5. Add Environment Variables (click "Advanced"):
```
PORT=10000
NODE_ENV=production
FRONTEND_URL=https://yt-downloader-re1o.onrender.com
```

6. Click "Create Web Service"
7. **WAIT 2-3 minutes** for deployment
8. **COPY the backend URL** (e.g., `https://yt-downloader-backend-abc.onrender.com`)

### Step 3: Update Frontend Environment Variable

1. Go to your frontend service: `yt-downloader-re1o`
2. Click "Environment" in left sidebar
3. Add/Update this variable:
```
VITE_BACKEND_URL=https://[YOUR-BACKEND-URL].onrender.com
```
Replace `[YOUR-BACKEND-URL]` with the URL from Step 2

4. Click "Save Changes"
5. Go to "Manual Deploy" → "Clear build cache & deploy"

### Step 4: Test Your App

Wait 3-5 minutes, then visit:
```
https://yt-downloader-re1o.onrender.com
```

Your app should now work! 🎉

---

## Troubleshooting:

### Still showing "Not Found"?
- Check frontend logs: Dashboard → yt-downloader-re1o → Logs
- Verify build succeeded (look for "Build successful")
- Verify "Publish Directory" is set to `dist`

### Backend not responding?
- Check backend logs: Dashboard → yt-downloader-backend → Logs
- Test health endpoint: `https://[backend-url].onrender.com/api/health`
- Should return: `{"status":"ok"}`

### CORS errors in browser console?
- Verify `FRONTEND_URL` environment variable in backend
- Check backend logs for CORS errors
- Make sure you pushed the updated code with CORS fix

### Free tier limitations:
- Backend sleeps after 15 min of inactivity
- First request takes 30 seconds to wake up
- Use https://uptimerobot.com to keep it awake (free)

---

## Alternative: Single Service Deployment

If you want simpler deployment (one service instead of two):

1. Delete both current services
2. Create ONE "Web Service"
3. Configure:
```
Root Directory: (leave empty)
Build Command: npm run install:all && npm run build
Start Command: npm start
```

This serves both frontend and backend together, but uses more resources.

---

## After Deployment Works:

### Add Your Logo:
1. Create logo files (see ADD_LOGO.md)
2. Place in `client/public/` folder
3. Push to GitHub
4. Render auto-deploys

### Custom Domain (Optional):
1. Buy domain from Namecheap ($10/year)
2. In Render: Settings → Custom Domain
3. Add your domain and follow DNS instructions
4. Your app will be at: `https://yourapp.com`

---

## Cost to Keep Running 24/7:

| Service | Free Tier | Paid |
|---------|-----------|------|
| Backend | Sleeps after 15min | $7/mo always on |
| Frontend | Always on | $7/mo faster |
| **Total** | **$0** (with sleep) | **$7-14/mo** |

**Recommendation**: Start with free tier, upgrade backend if needed.

---

## Questions?

Check your Render dashboard:
- https://dashboard.render.com

View logs for any errors and let me know what you see!
