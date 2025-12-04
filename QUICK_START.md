# 🚀 Quick Start Guide

## ✅ Server is Running!

Your StreamedV3 bot is now running on:
- **Backend:** http://localhost:3001
- **Telegram Bot:** Active and connected

## 📱 Test Your Bot

Open Telegram and send these commands to your bot:

### Basic Commands
```
/start     - Welcome message
/help      - See all commands
/trending  - View trending videos
```

### Download a Video
1. Send any YouTube URL to the bot
2. Click "📥 Download Video"
3. Choose format (Video/Audio)
4. Select quality (360p, 480p, 720p, 1080p)
5. Wait for download and receive file!

### Search Videos
```
/search music 2024
/search your favorite song
```

## 🎯 Available Quality Options

### Video
- 360p - Smallest size
- 480p - Small & fast
- 720p - **Recommended**
- 1080p - Full HD
- Best - Auto-select best (max 1080p)

### Audio
- Best Quality
- Medium (128kbps)

## 🛠️ Helper Scripts

### Check if server is running
```bash
check-status.bat
```

### Restart server
```bash
restart-server.bat
```

### Stop server
```bash
stop-server.bat
```

## 📊 What's Fixed

✅ **Connection Issues** - Stable, auto-reconnects
✅ **UTF-8 Errors** - All text properly sanitized
✅ **2K/4K Downloads** - Blocked (too large for Telegram)
✅ **All Commands** - Working perfectly

## 🎮 All Commands

| Command | Description |
|---------|-------------|
| `/start` | Start the bot |
| `/help` | Show all commands |
| `/trending` | View trending videos |
| `/search <query>` | Search videos |
| `/info <url>` | Get video details |
| `/formats <url>` | Show available formats |
| `/dl <url> <quality>` | Quick download |
| `/favorites` | View saved favorites |
| `/addfav <url>` | Add to favorites |
| `/queue` | View download queue |
| `/addqueue <url>` | Add to queue |
| `/startqueue` | Start queue downloads |
| `/history` | View download history |
| `/stats` | Your statistics |
| `/settings` | Bot settings |
| `/cancel` | Cancel current download |

## 💡 Tips

1. **Best Quality:** Use 720p for best balance of quality and file size
2. **Large Files:** Files over 50MB will be offered for splitting
3. **Audio Only:** Use audio format for music (smaller files)
4. **Queue System:** Add multiple videos to queue and download all at once

## 🔧 Troubleshooting

### Bot not responding?
```bash
restart-server.bat
```

### Port already in use?
```bash
stop-server.bat
# Then start again
start-dev.bat
```

### Need to reinstall packages?
```bash
install-dependencies.bat
```

## 📝 Configuration

Edit `backend/.env` to change settings:
```env
PORT=3001
TELEGRAM_BOT_TOKEN=your_token_here
DOWNLOAD_PATH=C:\Users\YourName\Downloads\YT-Downloads
```

## 🌐 Web Interface

Access the web interface at:
```
http://localhost:8080
```

## 📚 More Information

- **Setup Guide:** `SETUP_GUIDE.md`
- **Testing Guide:** `TESTING_GUIDE.md`
- **Fixes Applied:** `FIXES_SUMMARY.md`
- **UTF-8 Fixes:** `UTF8_FIXES.md`

## ✨ Features

- 📥 Multi-platform video downloads
- 🎵 High-quality audio extraction
- 📝 Subtitle downloads
- 🔍 Smart search & discovery
- 📊 Download history tracking
- ✂️ Automatic file splitting
- ⭐ Favorites management
- 📋 Queue system
- ⚙️ Customizable settings

## 🎉 You're All Set!

Your bot is ready to use. Start by sending `/start` to your Telegram bot!

---

**Need Help?** Check the other documentation files or review the console logs for any errors.
