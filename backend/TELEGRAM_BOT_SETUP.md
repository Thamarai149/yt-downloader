# Telegram Bot Setup Guide

## 1. Create Your Bot

1. Open Telegram and search for **@BotFather**
2. Send `/newbot` command
3. Choose a name for your bot (e.g., "VidFetch Bot")
4. Choose a username (must end in 'bot', e.g., "vidfetch_bot")
5. BotFather will give you a **token** - save this!

## 2. Configure the Bot

1. Copy `backend/.env.example` to `backend/.env` if you haven't already
2. Add your bot token to `.env`:
   ```
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   ```

## 3. Start the Server

```bash
cd backend
npm start
```

The bot will automatically initialize when the server starts.

## 4. Using the Bot

### Commands:
- `/start` - Welcome message and instructions
- `/help` - Show help and available commands
- `/info <url>` - Get video information without downloading
- `/cancel` - Cancel current download

### Download Process:
1. Send a video URL to the bot
2. Choose format (Video or Audio)
3. Select quality
4. Wait for download to complete
5. Bot will send the file directly to you

### Supported Features:
- ✅ Video downloads (4K, 2K, 1080p, 720p, Best)
- ✅ Audio extraction (MP3)
- ✅ Real-time progress updates
- ✅ Video information preview
- ✅ Download cancellation
- ✅ File size checking (max 2GB for Telegram)

## 5. Limitations

- Telegram has a 2GB file size limit for bots
- Files larger than 2GB will show a message to download from web interface
- Bot uses polling mode (suitable for development)

## 6. Production Deployment

For production, consider:
- Using webhook mode instead of polling
- Setting up a reverse proxy with SSL
- Configuring webhook URL in BotFather

## Troubleshooting

**Bot not responding:**
- Check if TELEGRAM_BOT_TOKEN is set correctly
- Verify the server is running
- Check server logs for errors

**Downloads failing:**
- Ensure yt-dlp/youtube-dl is installed
- Check download path permissions
- Verify FFmpeg is installed (for video merging)

**File sending errors:**
- Check file size (must be under 2GB)
- Verify file exists in download directory
- Check bot permissions
- Large files may take time to upload
