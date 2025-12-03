# Telegram Bot - Complete Command Reference

## 🚀 Quick Start Commands

### `/start`
**Description:** Welcome message and bot introduction
**Usage:** `/start`
**Response:** Shows welcome message with basic instructions

### `/help`
**Description:** Display all available commands with examples
**Usage:** `/help`
**Response:** Complete command list organized by category

---

## 📥 Download Commands

### Direct URL Download
**Usage:** Just send a video URL
**Example:** `https://youtube.com/watch?v=...`
**Response:** Shows all quality options (360p, 480p, 720p, 1080p, 2K, 4K, Audio, Subtitles)

### `/dl` - Quick Download
**Description:** Download video with specified quality in one command
**Usage:** `/dl <url> <quality>`
**Example:** `/dl https://youtube.com/watch?v=... 720`
**Quality Options:** `360`, `480`, `720`, `1080`, `2k`, `4k`, `best`

### `/cancel`
**Description:** Cancel current download
**Usage:** `/cancel`

---

## 🔍 Search & Discovery

### `/search` - Search Videos
**Description:** Search for videos by keyword
**Usage:** `/search <query>`
**Example:** `/search funny cats`
**Response:** Shows top 5 results with download buttons

### `/trending`
**Description:** View trending/popular videos
**Usage:** `/trending`
**Response:** Shows top 10 trending videos

### `/info` - Video Information
**Description:** Get detailed video information
**Usage:** `/info <url>`
**Example:** `/info https://youtube.com/watch?v=...`
**Response:** Shows title, channel, duration, views, upload date

### `/formats` - Available Formats
**Description:** Show all available video formats and sizes
**Usage:** `/formats <url>`
**Example:** `/formats https://youtube.com/watch?v=...`
**Response:** Lists all resolutions with file sizes and formats

---

## ⭐ Favorites

### `/favorites`
**Description:** View your saved favorite videos
**Usage:** `/favorites`
**Response:** List of up to 50 saved favorites

### `/addfav` - Add to Favorites
**Description:** Save a video to favorites
**Usage:** `/addfav <url>`
**Example:** `/addfav https://youtube.com/watch?v=...`

---

## 📋 Queue Management

### `/queue`
**Description:** View current download queue
**Usage:** `/queue`
**Response:** Shows all queued videos

### `/addqueue` - Add to Queue
**Description:** Add video to download queue
**Usage:** `/addqueue <url>`
**Example:** `/addqueue https://youtube.com/watch?v=...`

### `/startqueue`
**Description:** Start downloading all videos in queue
**Usage:** `/startqueue`
**Response:** Processes all queued downloads sequentially

---

## 📊 History & Statistics

### `/history`
**Description:** View your download history
**Usage:** `/history`
**Response:** Shows last 10 downloads with status

### `/stats`
**Description:** View your download statistics
**Usage:** `/stats`
**Response:** Shows total downloads, completed, failed, videos, audios

### `/clear`
**Description:** Clear download history
**Usage:** `/clear`
**Response:** Removes all history entries

---

## ⚙️ Settings & Customization

### `/settings`
**Description:** Configure bot preferences
**Usage:** `/settings`
**Response:** Interactive settings menu with buttons
**Options:**
- Auto-delete files (ON/OFF)
- Default quality (Best/1080p)
- Notifications (ON/OFF)

### `/rename` - Custom Filename
**Description:** Set custom filename for next download
**Usage:** `/rename <filename>`
**Example:** `/rename MyVideo.mp4`
**Note:** Next download will use this filename

---

## 🎬 Advanced Features

### `/clip` - Time Range Download (Coming Soon)
**Description:** Download specific part of video
**Usage:** `/clip <url> <start> <end>`
**Example:** `/clip https://youtube.com/watch?v=... 0:30 2:45`
**Note:** Feature placeholder - downloads full video currently

### `/playlist` - Playlist Download (Coming Soon)
**Description:** Download entire playlist
**Usage:** `/playlist <url>`
**Example:** `/playlist https://youtube.com/playlist?list=...`

---

## 👑 Admin Commands

### `/broadcast` - Send Message to All Users
**Description:** Send announcement to all bot users
**Usage:** `/broadcast <message>`
**Example:** `/broadcast New features added!`
**Access:** Admin only

### `/botstats` - Bot Statistics
**Description:** View complete bot usage statistics
**Usage:** `/botstats`
**Response:** Total users, downloads, success rate, active downloads
**Access:** Admin only

### `/users` - User List
**Description:** View list of all bot users
**Usage:** `/users`
**Response:** Shows first 50 user IDs
**Access:** Admin only

---

## 📖 Information Commands

### `/about`
**Description:** About the bot
**Usage:** `/about`
**Response:** Bot features and capabilities

---

## 💡 Tips & Tricks

### Quality Recommendations
- **720p** - Best balance (usually under 50MB)
- **480p** - Small files, good quality
- **360p** - Smallest files
- **1080p** - Large files (may need splitting)
- **2K/4K** - Very large (requires FFmpeg, will be split)

### File Size Limits
- **Under 50MB** - Sent directly in Telegram
- **50MB - 2GB** - Split into 45MB parts
- **Over 2GB** - Web download link provided

### Download Flow
1. Send video URL
2. Bot shows thumbnail and info
3. Choose quality from buttons
4. Download starts with progress bar
5. File sent automatically when complete

### Splitting Large Files
When file is over 50MB:
1. Bot asks: Split or Download Link?
2. Choose "Split & Send Parts"
3. Receives multiple 45MB parts
4. Reassemble: `copy /b part1+part2+... output.mp4`

---

## 🔧 Troubleshooting

### Bot Not Responding
- Check if bot is online
- Try `/start` command
- Restart bot if needed

### Download Failed
- Try lower quality (720p or 480p)
- Check if URL is valid
- Some videos may be restricted

### File Too Large
- Choose lower quality
- Use split feature
- Download from web interface

### Commands Not Showing
- Type `/` in chat
- Commands should appear in menu
- If not, restart Telegram app

---

## 📱 Quick Reference

**Most Used Commands:**
```
/start          - Start bot
/help           - Show help
<URL>           - Download video
/search <query> - Search videos
/trending       - Popular videos
/history        - View history
/settings       - Bot settings
```

**Quality Shortcuts:**
```
/dl <url> 720   - Quick 720p download
/dl <url> 480   - Quick 480p download
/dl <url> 1080  - Quick 1080p download
```

---

## 🎯 Example Workflows

### Simple Download
```
1. Send: https://youtube.com/watch?v=...
2. Click: 🎥 720p (Recommended)
3. Wait for download
4. Receive file
```

### Batch Download
```
1. /addqueue https://youtube.com/watch?v=...
2. /addqueue https://youtube.com/watch?v=...
3. /addqueue https://youtube.com/watch?v=...
4. /startqueue
5. All videos download automatically
```

### Search and Download
```
1. /search funny cats
2. Click on result
3. Choose quality
4. Download starts
```

---

## 📞 Support

For issues or questions:
- Use `/help` for command list
- Check `/about` for bot info
- Review this documentation

---

**Bot Version:** 1.0.0
**Last Updated:** 2025
**Features:** 30+ commands, Multi-platform support, File splitting, Queue system
