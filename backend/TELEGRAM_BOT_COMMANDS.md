# Telegram Bot Commands

## Setup
1. Create a bot with @BotFather on Telegram
2. Add `TELEGRAM_BOT_TOKEN=your_token` to `backend/.env`
3. Optionally add `TELEGRAM_ADMIN_IDS=user_id1,user_id2` for admin commands

## Available Commands

### Basic Commands
- `/start` - Welcome message with quick action buttons
- `/help` - Show all available commands and usage tips

### Download Commands
- `/download [URL]` - Download with format selection options
- `/audio [URL]` - Download audio only (MP3)
- `/video [URL]` - Download video with audio (MP4)
- `/playlist [URL]` - Download playlist (coming soon)

### User Commands
- `/status` - Check current download progress
- `/cancel` - Cancel active download
- `/settings` - Configure preferences (coming soon)
- `/history` - View download history (coming soon)

### Admin Commands (requires TELEGRAM_ADMIN_IDS)
- `/stats` - Show bot statistics and usage
- `/users` - User management (coming soon)

## Features

### Smart URL Detection
- Send any YouTube URL directly without commands
- Bot will show quick download options

### Interactive Buttons
- Format selection (Audio/Video)
- Quality options (Mobile/HD)
- Quick actions for common tasks

### Session Management
- Tracks active downloads per user
- Prevents multiple simultaneous downloads
- Progress updates and status tracking

### Error Handling
- User-friendly error messages
- Graceful handling of invalid URLs
- Automatic session cleanup on errors

## Usage Examples

```
User: /start
Bot: Welcome message with buttons

User: https://youtube.com/watch?v=example
Bot: Quick download options (Audio/Video)

User: /download https://youtube.com/watch?v=example
Bot: Full download options with quality selection

User: /audio https://youtube.com/watch?v=example
Bot: Direct audio download

User: /status
Bot: Shows current download progress
```

## Integration

The bot integrates with:
- `DownloadService` for video processing
- `VideoInfoService` for metadata
- YouTube URL validation
- File management system
- Real-time progress updates via Socket.IO

## Architecture

- **Command Pattern**: Extensible command registration system
- **Session Management**: Per-user download tracking
- **Event-Driven**: Handles messages, callbacks, and errors
- **Modular Design**: Easy to add new commands and features