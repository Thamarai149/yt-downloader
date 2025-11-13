# 🌐 Deploy Your App Online - Step by Step Guide

## Option 1: Render.com (Recommended - FREE)

### Step 1: Prepare Your App
1. Make sure your code is on GitHub
2. Add your custom logo files to `client/public/` folder:
   - `logo.svg` or `logo.png` (main logo)
   - `logo-32.png` (32x32 favicon)
   - `logo-180.png` (180x180 for mobile)

### Step 2: Deploy Backend
1. Go to https://render.com and sign up (free)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: yt-downloader-backend
   - **Root Directory**: backend
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free
5. Add Environment Variables:
   - `PORT`: 5000
   - `NODE_ENV`: production
6. Click "Create Web Service"
7. **Copy the backend URL** (e.g., https://yt-downloader-backend.onrender.com)

### Step 3: Deploy Frontend
1. Click "New +" → "Static Site"
2. Connect same GitHub repository
3. Configure:
   - **Name**: yt-downloader
   - **Root Directory**: client
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: dist
4. Add Environment Variable:
   - `VITE_BACKEND_URL`: [Your backend URL from Step 2]
5. Click "Create Static Site"

### Step 4: Access Your App
- Your app will be live at: https://yt-downloader.onrender.com
- Share this URL with anyone - it works on all PCs!

---

## Option 2: Vercel + Railway (Alternative)

### Backend on Railway:
1. Go to https://railway.app
2. "New Project" → "Deploy from GitHub"
3. Select your repo → backend folder
4. Add environment variables
5. Copy the backend URL

### Frontend on Vercel:
1. Go to https://vercel.com
2. "New Project" → Import your GitHub repo
3. Configure:
   - Root Directory: client
   - Framework: Vite
   - Environment Variable: `VITE_BACKEND_URL`
4. Deploy

---

## Option 3: Self-Host on Your PC (24/7 Access)

### Requirements:
- Windows PC that stays on
- Port forwarding on your router
- Dynamic DNS service (free from NoIP.com or DuckDNS.org)

### Steps:
1. **Get a Free Domain**:
   - Sign up at https://www.noip.com or https://www.duckdns.org
   - Create a hostname (e.g., mydownloader.ddns.net)

2. **Configure Port Forwarding**:
   - Open your router settings (usually 192.168.1.1)
   - Forward port 5000 to your PC's local IP
   - Forward port 3000 to your PC's local IP

3. **Update Backend**:
   - Edit `backend/server.js`
   - Change CORS to allow your domain

4. **Run Your App**:
   ```cmd
   START.bat
   ```

5. **Access Online**:
   - Your app is now at: http://mydownloader.ddns.net:3000

---

## Adding Your Logo

### Create Logo Files:
1. **Main Logo** (logo.svg or logo.png):
   - Size: 512x512px recommended
   - Format: PNG or SVG
   - Place in: `client/public/logo.svg`

2. **Favicons**:
   - Use https://favicon.io to generate all sizes
   - Download and place in `client/public/`:
     - logo-16.png (16x16)
     - logo-32.png (32x32)
     - logo-180.png (180x180)
     - logo.ico

3. **Update App Logo**:
   - Edit `client/src/App.tsx`
   - Find: `<span className="grand-logo-icon">🎥</span>`
   - Replace with: `<img src="/logo.svg" alt="Logo" style="width: 32px; height: 32px;" />`

---

## Custom Domain (Optional)

### After deploying to Render/Vercel:
1. Buy a domain from Namecheap/GoDaddy ($10/year)
2. Add custom domain in Render/Vercel settings
3. Update DNS records as instructed
4. Your app will be at: https://yourapp.com

---

## Keeping It Running Daily

### Render Free Tier:
- Automatically restarts if it crashes
- Sleeps after 15 min of inactivity
- Wakes up when someone visits (takes 30 seconds)

### To Keep It Always Active:
1. Use a free uptime monitor: https://uptimerobot.com
2. Ping your app every 10 minutes
3. This keeps it awake 24/7

---

## Troubleshooting

### Backend Not Connecting:
- Check CORS settings in `backend/server.js`
- Verify `VITE_BACKEND_URL` in frontend

### Downloads Not Working:
- Render free tier has limited storage
- Consider upgrading or using external storage

### App Sleeping:
- Use UptimeRobot to keep it awake
- Or upgrade to paid plan ($7/month)

---

## Cost Summary

| Option | Cost | Uptime | Speed |
|--------|------|--------|-------|
| Render Free | $0 | 99% (sleeps) | Good |
| Render Paid | $7/mo | 99.9% | Fast |
| Vercel + Railway | $0-5/mo | 99% | Fast |
| Self-Host | $0 | Depends on PC | Varies |

---

## Next Steps

1. ✅ Add your logo files to `client/public/`
2. ✅ Push code to GitHub
3. ✅ Deploy to Render (follow steps above)
4. ✅ Share your URL with the world!

Your app will be accessible from any PC, anywhere in the world! 🌍
