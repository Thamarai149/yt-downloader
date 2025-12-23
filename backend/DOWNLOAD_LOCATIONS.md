# Download File Locations Guide

## 📁 Where Your Files Are Saved

### Default Download Location
```
Windows: C:\Users\[Username]\Downloads\YT-Downloads\
Linux/Mac: /home/[username]/Downloads/YT-Downloads/
```

### Custom Location (via Environment Variable)
Set `DOWNLOAD_PATH` in your `.env` file:
```bash
DOWNLOAD_PATH=/path/to/your/custom/folder
```

## 📋 File Organization

### File Naming Convention
- **Video Title**: Sanitized and safe for file systems
- **Audio Files**: `.mp3` extension
- **Video Files**: `.mp4` extension
- **Example**: `Jana_Nayagan_Oru_Pere_Varalaaru_Lyrical.mp4`

### File Structure
```
YT-Downloads/
├── Video_Title_1.mp4 (720p video)
├── Audio_Title_2.mp3 (audio only)
├── Another_Video_3.mp4 (1080p video)
└── Music_Track_4.mp3 (audio only)
```

## 📊 File Size Handling

### Small Files (< 50MB)
- ✅ Can be sent via Telegram
- 💾 Also saved on server
- 📤 Available for immediate download

### Large Files (> 50MB)
- ❌ Cannot be sent via Telegram (bot limitation)
- 💾 Saved on server only
- 🗂️ Access via file manager or server interface

## 🔍 Finding Your Downloaded Files

### Via Telegram Bot Commands
```bash
/location          # Show download folder path
/status           # Check current download
```

### Via Server Access
1. **File Manager**: Navigate to download folder
2. **Command Line**: `ls /path/to/downloads`
3. **Web Interface**: If available on your server
4. **FTP/SFTP**: Remote file access

### Via Utility Script
```bash
cd backend
node check-downloads.js
```

## 📱 Telegram Bot File Location Features

### Location Command (`/location`)
Shows:
- 🗂️ Server download folder path
- 📋 File organization info
- 💾 Large file handling explanation
- 🔍 Access methods

### Download Completion Messages

#### Small Files
```
✅ Download Complete!
🎬 Video Title
📁 File: video_title.mp4
📊 Size: 45.2 MB
⏱️ Duration: 4:23
📺 Quality: 720p HD

📤 File is small enough to send via Telegram!
💾 Also saved on server: C:\Users\...\YT-Downloads
```

#### Large Files
```
✅ Download Complete!
🎬 Video Title
📁 File: video_title.mp4
📊 Size: 125.8 MB
⏱️ Duration: 12:45
📺 Quality: 1080p FHD

⚠️ Large File Notice:
This file (125.8 MB) is too large to send via Telegram (50MB limit).

📁 File Location: C:\Users\...\YT-Downloads
📋 File Name: video_title.mp4

💡 How to Access:
• Use server file manager
• Download via web interface
• Contact administrator for access
• Use /location command for more info
```

## 🛠️ Server Administration

### Checking Downloads
```bash
# List recent downloads
node backend/check-downloads.js

# Check folder size
du -sh /path/to/downloads

# Find large files
find /path/to/downloads -size +50M -ls
```

### Folder Management
```bash
# Create download folder
mkdir -p /path/to/downloads

# Set permissions
chmod 755 /path/to/downloads

# Clean old files (optional)
find /path/to/downloads -mtime +30 -delete
```

### Web Access Setup
If you want users to access files via web:
1. Configure web server to serve download folder
2. Add authentication for security
3. Provide download links to users

## 🔧 Configuration Options

### Environment Variables
```bash
# Custom download path
DOWNLOAD_PATH=/custom/path/downloads

# Telegram bot token
TELEGRAM_BOT_TOKEN=your_bot_token

# Server port
PORT=3001
```

### File Access Methods
1. **Direct Server Access**: SSH/RDP to server
2. **File Manager**: Web-based file browser
3. **FTP/SFTP**: Remote file transfer
4. **Shared Network Drive**: If configured
5. **Cloud Sync**: Sync folder to cloud storage

## 💡 Best Practices

### For Users
- Use `/location` to find download folder
- Check file sizes before downloading 4K content
- Use audio format for music to save space
- Contact admin for large file access

### For Administrators
- Monitor disk space regularly
- Set up automated cleanup for old files
- Provide clear access instructions to users
- Consider file size limits and storage capacity

### Storage Recommendations
- **Audio (MP3)**: ~3-10 MB per song
- **360p Video**: ~50-100 MB per 10 minutes
- **720p Video**: ~200-400 MB per 10 minutes
- **1080p Video**: ~400-800 MB per 10 minutes
- **4K Video**: ~1.5-3 GB per 10 minutes

This guide helps users understand where their downloaded files are located and how to access them, especially for large files that cannot be sent through Telegram.