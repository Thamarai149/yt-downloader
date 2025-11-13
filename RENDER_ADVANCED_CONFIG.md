# 🔧 Render Advanced Configuration Guide

## For Your Backend Service (yt-downloader-backend)

### 1. Health Check Path
```
/api/health
```
This endpoint returns service status and helps Render monitor your app.

### 2. Pre-Deploy Command (Optional)
Leave empty or use:
```
npm audit fix
```
This runs before deployment to fix security issues.

### 3. Auto-Deploy
```
On Commit (recommended)
```
Automatically deploys when you push to GitHub.

### 4. Build Filters - Included Paths
Add these to only rebuild when backend changes:
```
backend/**
package.json
```

### 5. Build Filters - Ignored Paths
Add these to skip rebuilds for frontend-only changes:
```
client/**
*.md
.gitignore
```

---

## For Your Frontend Service (yt-downloader-re1o)

### 1. Health Check Path
Leave empty (static sites don't need health checks)

### 2. Pre-Deploy Command
Leave empty

### 3. Auto-Deploy
```
On Commit (recommended)
```

### 4. Build Filters - Included Paths
```
client/**
package.json
```

### 5. Build Filters - Ignored Paths
```
backend/**
*.md
.gitignore
```

---

## Environment Variables (Backend)

Click "Environment" tab and add:

```
PORT=10000
NODE_ENV=production
FRONTEND_URL=https://yt-downloader-re1o.onrender.com
ALLOWED_ORIGINS=https://yt-downloader-re1o.onrender.com
MAX_DOWNLOAD_SIZE=500
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### What each variable does:
- `PORT`: Render assigns this automatically (10000 is default)
- `NODE_ENV`: Tells app it's in production mode
- `FRONTEND_URL`: Your frontend URL for CORS
- `ALLOWED_ORIGINS`: Additional allowed origins
- `MAX_DOWNLOAD_SIZE`: Max file size in MB (optional)
- `RATE_LIMIT_WINDOW`: Rate limit window in minutes (optional)
- `RATE_LIMIT_MAX`: Max requests per window (optional)

---

## Environment Variables (Frontend)

```
VITE_BACKEND_URL=https://[YOUR-BACKEND-URL].onrender.com
```

Replace `[YOUR-BACKEND-URL]` with your actual backend URL.

---

## Secret Files (Optional)

If you need to store sensitive data like API keys:

### Backend Secret File:
1. Click "+ Add Secret File"
2. Filename: `.env`
3. Contents:
```
YOUTUBE_API_KEY=your_api_key_here
ENCRYPTION_KEY=your_secret_key_here
```

### When to use:
- API keys for YouTube Data API
- Database credentials
- OAuth secrets
- Encryption keys

**Note**: For this YouTube downloader, secret files are NOT required since we use yt-dlp which doesn't need API keys.

---

## Disk Storage (Important!)

### Free Tier Limitations:
- Ephemeral storage (resets on each deploy)
- Limited to ~512MB
- Files deleted when service restarts

### Solutions:

#### Option 1: Stream Downloads (Recommended)
Don't store files on server - stream directly to user's browser.
Already implemented in your `/api/stream` endpoint!

#### Option 2: External Storage
Use cloud storage for downloads:
- AWS S3 (free tier: 5GB)
- Cloudflare R2 (free: 10GB)
- Google Cloud Storage

#### Option 3: Upgrade to Persistent Disk
Render paid plan: $7/mo + $0.25/GB/month

---

## Performance Optimization

### 1. Enable HTTP/2
Automatically enabled by Render ✅

### 2. Enable Compression
Already added in your server.js:
```javascript
import compression from 'compression';
app.use(compression());
```

### 3. Add Caching Headers
For static assets in frontend, Render handles this automatically.

### 4. Use CDN
Render provides global CDN for static sites automatically ✅

---

## Monitoring & Alerts

### 1. Set Up Notifications
Dashboard → Service → Settings → Notifications
- Email on deploy failures
- Slack/Discord webhooks
- PagerDuty integration

### 2. Monitor Logs
Dashboard → Service → Logs
- Real-time log streaming
- Filter by severity
- Download logs for debugging

### 3. Metrics
Dashboard → Service → Metrics
- CPU usage
- Memory usage
- Request count
- Response times

---

## Scaling (If Needed)

### Free Tier:
- 512MB RAM
- 0.1 CPU
- Good for 10-50 concurrent users

### Paid Tiers:
- Starter: $7/mo (512MB RAM, 0.5 CPU)
- Standard: $25/mo (2GB RAM, 1 CPU)
- Pro: $85/mo (4GB RAM, 2 CPU)

### When to upgrade:
- App frequently crashes (out of memory)
- Slow response times (>2 seconds)
- Many concurrent downloads (>20)

---

## Custom Domain Setup

### 1. Buy Domain
- Namecheap: ~$10/year
- Google Domains: ~$12/year
- Cloudflare: ~$10/year

### 2. Add to Render
Dashboard → Service → Settings → Custom Domain
1. Click "Add Custom Domain"
2. Enter: `yourapp.com`
3. Copy the DNS records shown

### 3. Update DNS
In your domain registrar:
```
Type: CNAME
Name: @
Value: [render-provided-value]

Type: CNAME  
Name: www
Value: [render-provided-value]
```

### 4. Wait for SSL
Render automatically provisions SSL certificate (5-10 minutes)

---

## Security Best Practices

### 1. Environment Variables
✅ Never commit secrets to GitHub
✅ Use Render's environment variables
✅ Rotate keys regularly

### 2. CORS Configuration
✅ Already configured in your server.js
✅ Only allows your frontend domain
✅ Blocks unauthorized origins

### 3. Rate Limiting
✅ Already implemented in your server
✅ Prevents abuse
✅ Configurable via environment variables

### 4. Input Validation
✅ Sanitize filenames
✅ Validate YouTube URLs
✅ Limit file sizes

---

## Backup Strategy

### 1. Code Backup
✅ GitHub (automatic)
✅ Multiple branches
✅ Version control

### 2. Database Backup (if you add one)
- Render managed databases have automatic backups
- Daily snapshots
- Point-in-time recovery

### 3. Download History
Currently stored in memory (resets on restart)

To persist:
- Add Redis (free tier available)
- Add PostgreSQL (free tier available)
- Use JSON file with persistent disk

---

## Troubleshooting Common Issues

### Service Won't Start
1. Check logs for errors
2. Verify build command succeeded
3. Check environment variables
4. Test locally first

### Out of Memory
1. Reduce concurrent downloads
2. Clear old files regularly
3. Upgrade to larger instance
4. Use streaming instead of storing

### Slow Performance
1. Enable compression ✅
2. Use CDN ✅
3. Optimize video quality selection
4. Add caching layer (Redis)

### CORS Errors
1. Verify FRONTEND_URL is correct
2. Check ALLOWED_ORIGINS
3. Test with browser dev tools
4. Check backend logs

---

## Cost Optimization

### Stay on Free Tier:
✅ Use build filters (avoid unnecessary rebuilds)
✅ Use streaming (no storage costs)
✅ Accept 15-min sleep time
✅ Use UptimeRobot to keep awake

### Minimize Costs:
- Start with free tier
- Monitor usage
- Upgrade only backend if needed
- Use external storage for files

### Expected Costs:
```
Free Tier:        $0/month
Backend Only:     $7/month
Backend + Storage: $10/month
Full Production:  $15-30/month
```

---

## Next Steps

1. ✅ Configure health check path: `/api/health`
2. ✅ Set auto-deploy to "On Commit"
3. ✅ Add build filters to optimize rebuilds
4. ✅ Add environment variables
5. ✅ Test deployment
6. ✅ Monitor logs for errors
7. ✅ Add custom domain (optional)
8. ✅ Set up monitoring alerts

Your app will be production-ready! 🚀
