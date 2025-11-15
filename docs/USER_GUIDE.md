# YT Downloader Pro - User Guide

## Table of Contents
1. [Installation](#installation)
2. [Getting Started](#getting-started)
3. [Features](#features)
4. [Keyboard Shortcuts](#keyboard-shortcuts)
5. [Settings](#settings)
6. [Troubleshooting](#troubleshooting)
7. [FAQ](#faq)

## Installation

### System Requirements
- Windows 10 (21H2 or later) or Windows 11
- 4 GB RAM minimum (8 GB recommended)
- 500 MB free disk space for installation
- Internet connection for downloading videos

### Installation Steps

1. **Download the Installer**
   - Download `YT-Downloader-Pro-Setup-1.0.0.exe` from the releases page
   - Save it to your Downloads folder

2. **Run the Installer**
   - Double-click the installer file
   - If Windows SmartScreen appears, click "More info" then "Run anyway"
   - Accept the license agreement
   - Choose installation directory (default: `C:\Program Files\YT Downloader Pro`)
   - Select additional options:
     - ✓ Create desktop shortcut
     - ✓ Create Start Menu shortcut
   - Click "Install"

3. **First Launch**
   - The application will verify required binaries (yt-dlp and ffmpeg)
   - If binaries are missing, the app will attempt to download them automatically
   - Wait for the initialization to complete

## Getting Started

### Basic Download

1. **Single Video Download**
   - Copy a YouTube video URL
   - Paste it into the URL field on the "Single" tab
   - Select download type (Video or Audio)
   - Choose quality (Best, 4K, 1080p, 720p, etc.)
   - Click "Download"
   - Monitor progress in the "Queue" tab

2. **Batch Download**
   - Go to the "Batch" tab
   - Add multiple URLs (one per field)
   - Click "+" to add more URL fields
   - Select type and quality
   - Click "Download All"

3. **Search and Download**
   - Go to the "Search" tab
   - Enter search keywords
   - Click "Search"
   - Select videos from results
   - Click "Download Selected"

### System Tray

The application minimizes to the system tray by default:
- **Left-click tray icon**: Show/hide window
- **Right-click tray icon**: Open context menu
  - Show: Restore window
  - Hide: Minimize to tray
  - Quit: Exit application

## Features

### Download Types
- **Video**: Download video with audio (MP4 format)
- **Audio**: Extract audio only (MP3 format)

### Quality Options
- **Best**: Highest available quality
- **4K**: 2160p (if available)
- **2K**: 1440p (if available)
- **1080p**: Full HD
- **720p**: HD
- **480p**: Standard definition
- **360p**: Low quality
- **240p**: Minimum quality

### Playlist Support
- Download entire playlists
- Select specific videos from playlist
- Batch download with custom quality per video

### Download Scheduler
- Schedule downloads for later
- Set specific date and time
- Automatic execution at scheduled time

### Download History
- View all completed downloads
- Open downloaded files
- Open containing folder
- Delete from history

### Analytics
- Total downloads count
- Success rate
- Total file size
- Video vs Audio breakdown

## Keyboard Shortcuts

### Global Shortcuts
- `Ctrl+Q`: Quit application
- `Ctrl+,`: Open settings
- `F11`: Toggle fullscreen
- `Alt+F4`: Force close window

### Application Menu
- `Ctrl+O`: Open downloads folder
- `Ctrl+T`: Toggle theme (light/dark)
- `Ctrl+R`: Reload application
- `Ctrl+Shift+I`: Toggle developer tools

### Editing
- `Ctrl+Z`: Undo
- `Ctrl+Shift+Z`: Redo
- `Ctrl+X`: Cut
- `Ctrl+C`: Copy
- `Ctrl+V`: Paste
- `Ctrl+A`: Select all

## Settings

### General Settings
- **Theme**: Light, Dark, or System
- **Default Download Type**: Video or Audio
- **Default Quality**: Best, 4K, 1080p, etc.
- **Download Path**: Choose where files are saved

### Behavior Settings
- **Close to Tray**: Minimize to tray instead of closing
- **Start on Boot**: Launch application at Windows startup
- **Notifications**: Enable/disable download notifications

### Update Settings
- **Auto-check for Updates**: Automatically check for new versions
- **Auto-download Updates**: Download updates in background
- **Auto-install Updates**: Install updates automatically

### Advanced Settings
- **Concurrent Downloads**: Number of simultaneous downloads (1-5)
- **Download Timeout**: Maximum time per download (seconds)
- **Retry Failed Downloads**: Automatically retry failed downloads

## Troubleshooting

### Missing Binaries Error

**Problem**: "Missing required binaries: yt-dlp, ffmpeg"

**Solutions**:
1. Click "Retry" to attempt auto-download again
2. Manual installation:
   - Download yt-dlp from: https://github.com/yt-dlp/yt-dlp/releases/latest
   - Download ffmpeg from: https://github.com/BtbN/FFmpeg-Builds/releases
   - Place files in: `C:\Program Files\YT Downloader Pro\binaries\`
3. Restart the application

### Download Fails

**Problem**: Downloads fail or get stuck

**Solutions**:
1. Check internet connection
2. Verify the video URL is valid
3. Try a different quality setting
4. Check if video is region-restricted
5. View logs: Help → View Logs

### Port Already in Use

**Problem**: "Backend server failed to start"

**Solutions**:
1. The app will automatically try different ports
2. Close other applications using port 4000-4010
3. Restart the application

### Application Won't Start

**Problem**: Application crashes on startup

**Solutions**:
1. Check system requirements
2. Run as administrator
3. Reinstall the application
4. Check logs in: `%APPDATA%\YT Downloader Pro\logs\`

### High Memory Usage

**Problem**: Application uses too much memory

**Solutions**:
1. Reduce concurrent downloads in settings
2. Clear download history
3. Restart the application
4. Close other memory-intensive applications

## FAQ

### Q: Is this application free?
A: Yes, YT Downloader Pro is completely free and open-source.

### Q: Can I download from platforms other than YouTube?
A: Currently, the application is optimized for YouTube, but yt-dlp supports many platforms.

### Q: Where are my downloads saved?
A: By default, downloads are saved to `C:\Users\[YourName]\Downloads\YT-Downloads\`. You can change this in Settings.

### Q: Can I download age-restricted videos?
A: Age-restricted videos may require authentication, which is not currently supported.

### Q: How do I update the application?
A: The application checks for updates automatically. When an update is available, you'll see a notification. Click "Download Update" to install.

### Q: Can I use this on Mac or Linux?
A: Currently, only Windows is supported. Mac and Linux versions may be added in the future.

### Q: Is my data collected or shared?
A: No. The application runs entirely on your computer and does not collect or share any data.

### Q: Can I download entire channels?
A: Not directly, but you can use the playlist feature to download channel playlists.

### Q: What video formats are supported?
A: Videos are downloaded in MP4 format, and audio in MP3 format.

### Q: Can I pause and resume downloads?
A: Currently, downloads cannot be paused. You can cancel and restart them.

### Q: How do I uninstall the application?
A: Use Windows Settings → Apps → YT Downloader Pro → Uninstall. You'll be asked if you want to keep your downloads and settings.

## Support

### Getting Help
- **Documentation**: https://github.com/Thamarai149/yt-downloader#readme
- **Report Issues**: https://github.com/Thamarai149/yt-downloader/issues
- **View Logs**: Help menu → View Logs

### Logs Location
Logs are stored in: `%APPDATA%\YT Downloader Pro\logs\`

Include log files when reporting issues for faster resolution.

---

**Version**: 1.0.0  
**Last Updated**: November 2025
