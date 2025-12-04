# StreamedV3 Setup Guide

## Quick Start

### 1. Install Dependencies

Run this command to install all required packages:

```bash
install-dependencies.bat
```

Or manually:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../web-frontend
npm install
```

### 2. Configure Environment

Edit `backend/.env` file with your settings:

```env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:8080
DOWNLOAD_PATH=C:\Users\YourUsername\Downloads\YT-Downloads
MAX_CONCURRENT_DOWNLOADS=3
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

### 3. Start Server

```bash
start-dev.bat
```

Or use the new restart script:
```bash
restart-server.bat
```

## Helper Scripts

### ✅ check-status.bat
Check if servers are running and environment is configured correctly.

```bash
check-status.bat
```

**Shows:**
- Backend server status (port 3001)
- Frontend server status (port 8080)
- Node.js version
- Environment file status
- Dependencies status

### 🔄 restart-server.bat
Stop existing server and start fresh.

```bash
restart-server.bat
```

**Does:**
1. Stops any process on port 3001
2. Checks if dependencies are installed
3. Starts the backend server

### 🛑 stop-server.bat
Stop the running server.

```bash
stop-server.bat
```

### 📦 install-dependencies.bat
Install all required npm packages.

```bash
install-dependencies.bat
```

## Required Packages

All packages are already defined in `package.json`:

### Backend Dependencies
```json
{
  "compression": "^1.7.4",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "express": "^4.18.2",
  "helmet": "^7.1.0",
  "joi": "^17.11.0",
  "node-telegram-bot-api": "^0.66.0",
  "sanitize-filename": "^1.6.3",
  "socket.io": "^4.6.1",
  "uuid": "^9.0.1",
  "youtube-dl-exec": "^2.4.13"
}
```

### Dev Dependencies
```json
{
  "eslint": "^8.55.0",
  "jest": "^29.7.0",
  "nodemon": "^3.0.2",
  "prettier": "^3.1.1"
}
```

## Troubleshooting

### Error: EADDRINUSE (Port Already in Use)

**Problem:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution 1:** Use the stop script
```bash
stop-server.bat
```

**Solution 2:** Manual kill
```bash
# Find process
netstat -ano | findstr :3001

# Kill process (replace PID with actual number)
taskkill /F /PID <PID>
```

**Solution 3:** Use restart script
```bash
restart-server.bat
```

### Error: Cannot find module

**Problem:**
```
Error: Cannot find module 'express'
```

**Solution:**
```bash
install-dependencies.bat
```

Or:
```bash
cd backend
npm install
```

### Error: Telegram bot not starting

**Problem:**
```
⚠️  Telegram bot token not configured
```

**Solution:**
1. Get bot token from [@BotFather](https://t.me/BotFather)
2. Add to `backend/.env`:
   ```
   TELEGRAM_BOT_TOKEN=your_token_here
   ```
3. Restart server

### Error: EFATAL (Telegram Connection)

**Problem:**
```
⚠️  Telegram connection issue: EFATAL
```

**Solution:**
- This is normal during startup
- Bot will automatically reconnect
- Wait 30-60 seconds
- If persists, check internet connection

### Error: UTF-8 Encoding

**Problem:**
```
❌ Error: ETELEGRAM: 400 Bad Request: inline keyboard button text must be encoded in UTF-8
```

**Solution:**
- Already fixed in latest version
- Make sure you have the latest code
- Text sanitization is now automatic

## Manual Installation

If you prefer to install packages manually:

### Backend
```bash
cd backend

# Core dependencies
npm install express cors dotenv socket.io
npm install compression helmet joi
npm install node-telegram-bot-api
npm install youtube-dl-exec sanitize-filename uuid

# Dev dependencies
npm install --save-dev nodemon eslint prettier jest
```

### Frontend
```bash
cd web-frontend
npm install
```

## Verification

After installation, verify everything is working:

### 1. Check Status
```bash
check-status.bat
```

Should show:
- ✅ Backend .env file exists
- ✅ Backend dependencies installed
- ✅ Frontend dependencies installed

### 2. Start Server
```bash
start-dev.bat
```

Should show:
```
✅ Services initialized
🚀 Backend API running on port 3001
🤖 Telegram bot initialized successfully
```

### 3. Test Endpoints

**Backend API:**
```
http://localhost:3001/api/health
```

**Frontend:**
```
http://localhost:8080
```

### 4. Test Telegram Bot

Send to your bot:
```
/start
/help
/trending
```

All commands should work without errors.

## Development Workflow

### Starting Development
```bash
# Option 1: Use helper script
start-dev.bat

# Option 2: Manual start
cd backend
npm run dev
```

### Stopping Server
```bash
# Option 1: Press Ctrl+C in terminal
# Option 2: Use helper script
stop-server.bat
```

### Restarting After Changes
```bash
restart-server.bat
```

### Checking Logs
Watch the console output for:
- ✅ Success messages
- ⚠️ Warnings
- ❌ Errors

## Production Deployment

For production (e.g., Render.com):

### 1. Environment Variables
Set these in your hosting platform:
```
NODE_ENV=production
PORT=3001
TELEGRAM_BOT_TOKEN=your_token
DOWNLOAD_PATH=/tmp/downloads
```

### 2. Start Command
```bash
npm start
```

### 3. Build Command (if needed)
```bash
npm install
```

## Additional Tools

### Update Dependencies
```bash
cd backend
npm update

cd ../web-frontend
npm update
```

### Check for Outdated Packages
```bash
npm outdated
```

### Audit Security
```bash
npm audit
npm audit fix
```

## System Requirements

- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **OS:** Windows 10/11, Linux, macOS
- **RAM:** 2GB minimum, 4GB recommended
- **Disk:** 500MB for dependencies + space for downloads

## Getting Help

1. Check console logs for errors
2. Run `check-status.bat` to verify setup
3. Review `TESTING_GUIDE.md` for testing
4. Check `FIXES_SUMMARY.md` for known issues

## Quick Reference

| Command | Purpose |
|---------|---------|
| `install-dependencies.bat` | Install all packages |
| `start-dev.bat` | Start development server |
| `restart-server.bat` | Restart server |
| `stop-server.bat` | Stop server |
| `check-status.bat` | Check system status |

## Next Steps

After setup:
1. ✅ Test all Telegram commands
2. ✅ Try downloading a video
3. ✅ Check web interface
4. ✅ Review logs for errors
5. ✅ Configure settings as needed

---

**Status:** All packages are already in package.json. Just run `install-dependencies.bat` to install everything!
