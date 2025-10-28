# 🚀 Deployment Guide

Complete guide for deploying YouTube Downloader Pro to production.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Frontend Deployment](#frontend-deployment)
- [Backend Deployment](#backend-deployment)
- [Environment Variables](#environment-variables)
- [Domain Configuration](#domain-configuration)
- [SSL/HTTPS Setup](#sslhttps-setup)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## ✅ Prerequisites

Before deploying, ensure you have:

- [ ] GitHub account
- [ ] Domain name (optional)
- [ ] yt-dlp installed on server
- [ ] Node.js 18+ on server
- [ ] SSL certificate (for HTTPS)

## 🎨 Frontend Deployment

### Option 1: Vercel (Recommended)

**Pros**: Free, automatic deployments, CDN, HTTPS

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Build the frontend**
   ```bash
   cd client
   npm run build
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Configure**
   - Set environment variable: `VITE_BACKEND_URL=https://your-backend.com`
   - Enable automatic deployments from GitHub

**Vercel Configuration** (`vercel.json`):
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### Option 2: Netlify

**Pros**: Free, easy setup, form handling

1. **Build the frontend**
   ```bash
   cd client
   npm run build
   ```

2. **Deploy via Netlify CLI**
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod
   ```

3. **Or connect GitHub**
   - Go to Netlify dashboard
   - Click "New site from Git"
   - Select your repository
   - Build command: `cd client && npm run build`
   - Publish directory: `client/dist`

**Netlify Configuration** (`netlify.toml`):
```toml
[build]
  base = "client"
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

### Option 3: GitHub Pages

**Pros**: Free, simple

1. **Update `vite.config.ts`**
   ```typescript
   export default defineConfig({
     base: '/youtube-downloader-pro/',
     // ... other config
   });
   ```

2. **Build and deploy**
   ```bash
   cd client
   npm run build
   npm run deploy
   ```

3. **Add deploy script to `package.json`**
   ```json
   {
     "scripts": {
       "deploy": "gh-pages -d dist"
     }
   }
   ```

## 🖥️ Backend Deployment

### Option 1: Railway (Recommended)

**Pros**: Free tier, easy setup, automatic deployments

1. **Create `railway.json`**
   ```json
   {
     "build": {
       "builder": "NIXPACKS"
     },
     "deploy": {
       "startCommand": "cd backend && npm start",
       "restartPolicyType": "ON_FAILURE",
       "restartPolicyMaxRetries": 10
     }
   }
   ```

2. **Deploy**
   - Go to [Railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect and deploy

3. **Configure**
   - Add environment variables
   - Set PORT (Railway provides this automatically)
   - Install yt-dlp in Nixpacks config

**Nixpacks Configuration** (`nixpacks.toml`):
```toml
[phases.setup]
nixPkgs = ["nodejs-18_x", "yt-dlp"]

[phases.install]
cmds = ["cd backend && npm install"]

[phases.build]
cmds = []

[start]
cmd = "cd backend && npm start"
```

### Option 2: Heroku

**Pros**: Established platform, add-ons available

1. **Create `Procfile`**
   ```
   web: cd backend && npm start
   ```

2. **Create `heroku.yml`**
   ```yaml
   build:
     docker:
       web: Dockerfile
   ```

3. **Create `Dockerfile`**
   ```dockerfile
   FROM node:18-alpine
   
   # Install yt-dlp
   RUN apk add --no-cache python3 py3-pip ffmpeg
   RUN pip3 install yt-dlp
   
   WORKDIR /app
   
   COPY backend/package*.json ./backend/
   RUN cd backend && npm install
   
   COPY backend ./backend
   
   EXPOSE 4000
   
   CMD ["node", "backend/server.js"]
   ```

4. **Deploy**
   ```bash
   heroku login
   heroku create your-app-name
   git push heroku main
   ```

### Option 3: DigitalOcean App Platform

**Pros**: Scalable, managed infrastructure

1. **Create `.do/app.yaml`**
   ```yaml
   name: youtube-downloader-pro
   services:
   - name: backend
     github:
       repo: yourusername/youtube-downloader-pro
       branch: main
       deploy_on_push: true
     source_dir: backend
     run_command: npm start
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
     http_port: 4000
     envs:
     - key: NODE_ENV
       value: production
   ```

2. **Deploy**
   - Go to DigitalOcean dashboard
   - Create new App
   - Connect GitHub repository
   - Configure build settings
   - Deploy

### Option 4: VPS (Ubuntu)

**Pros**: Full control, cost-effective for high traffic

1. **SSH into server**
   ```bash
   ssh user@your-server-ip
   ```

2. **Install dependencies**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # Install yt-dlp
   sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
   sudo chmod a+rx /usr/local/bin/yt-dlp
   
   # Install PM2
   sudo npm install -g pm2
   ```

3. **Clone and setup**
   ```bash
   git clone https://github.com/yourusername/youtube-downloader-pro.git
   cd youtube-downloader-pro/backend
   npm install
   ```

4. **Start with PM2**
   ```bash
   pm2 start server.js --name youtube-downloader
   pm2 save
   pm2 startup
   ```

5. **Setup Nginx reverse proxy**
   ```bash
   sudo apt install nginx
   sudo nano /etc/nginx/sites-available/youtube-downloader
   ```

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
   
       location / {
           proxy_pass http://localhost:4000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   ```bash
   sudo ln -s /etc/nginx/sites-available/youtube-downloader /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## 🔐 Environment Variables

### Frontend (.env)

```env
VITE_BACKEND_URL=https://api.your-domain.com
```

### Backend (.env)

```env
PORT=4000
NODE_ENV=production
CORS_ORIGIN=https://your-domain.com
DOWNLOAD_DIR=/path/to/downloads
```

## 🌐 Domain Configuration

### DNS Settings

1. **For Frontend (Vercel/Netlify)**
   ```
   Type: CNAME
   Name: www
   Value: your-app.vercel.app
   ```

2. **For Backend (Railway/Heroku)**
   ```
   Type: CNAME
   Name: api
   Value: your-app.railway.app
   ```

3. **For VPS**
   ```
   Type: A
   Name: @
   Value: your-server-ip
   
   Type: A
   Name: api
   Value: your-server-ip
   ```

## 🔒 SSL/HTTPS Setup

### Automatic (Vercel/Netlify/Railway)
SSL is automatically provided and configured.

### Manual (VPS with Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

## 📊 Monitoring

### Option 1: PM2 Monitoring (VPS)

```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs youtube-downloader

# Check status
pm2 status
```

### Option 2: Platform Monitoring

- **Vercel**: Built-in analytics
- **Railway**: Metrics dashboard
- **Heroku**: Heroku Metrics

### Option 3: External Monitoring

- **UptimeRobot**: Free uptime monitoring
- **Sentry**: Error tracking
- **LogRocket**: Session replay

## 🐛 Troubleshooting

### Issue: Build fails

**Solution**:
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Check Node version
node --version  # Should be 18+
```

### Issue: yt-dlp not found

**Solution**:
```bash
# Verify installation
yt-dlp --version

# Reinstall if needed
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp
```

### Issue: CORS errors

**Solution**:
Update backend CORS configuration:
```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
```

### Issue: Socket.IO connection fails

**Solution**:
1. Check backend URL in frontend
2. Verify WebSocket support
3. Check firewall rules

### Issue: Downloads fail

**Solution**:
1. Check yt-dlp is updated: `yt-dlp -U`
2. Verify download directory permissions
3. Check disk space

## 📈 Performance Optimization

### Frontend

1. **Enable compression**
   ```javascript
   // vite.config.ts
   export default defineConfig({
     build: {
       minify: 'terser',
       terserOptions: {
         compress: {
           drop_console: true
         }
       }
     }
   });
   ```

2. **Lazy load components**
   ```typescript
   const ExtraFeatures = lazy(() => import('./ExtraFeatures'));
   ```

3. **Optimize images**
   - Use WebP format
   - Compress images
   - Use CDN

### Backend

1. **Enable compression**
   ```javascript
   const compression = require('compression');
   app.use(compression());
   ```

2. **Add caching**
   ```javascript
   app.use((req, res, next) => {
     res.set('Cache-Control', 'public, max-age=3600');
     next();
   });
   ```

3. **Use PM2 cluster mode**
   ```bash
   pm2 start server.js -i max
   ```

## 🔄 CI/CD Setup

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: cd client && npm install && npm run build
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: cd backend && npm install
      # Deploy to your platform
```

## ✅ Post-Deployment Checklist

- [ ] Frontend is accessible
- [ ] Backend API is responding
- [ ] Socket.IO connection works
- [ ] Downloads are working
- [ ] SSL certificate is valid
- [ ] Domain is configured
- [ ] Environment variables are set
- [ ] Monitoring is setup
- [ ] Backups are configured
- [ ] Error tracking is enabled

## 📞 Support

If you encounter issues:
- Check logs first
- Review this guide
- Open an issue on GitHub
- Contact support

---

**Deployment Status**: ✅ Ready for Production

**Last Updated**: 2024
