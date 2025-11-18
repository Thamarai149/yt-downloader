# Backend Quick Start Guide

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
copy .env.example .env
```

3. Configure your `.env`:
```env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
DOWNLOAD_PATH=C:\Users\YourUsername\Downloads\YT-Downloads
MAX_CONCURRENT_DOWNLOADS=3
```

## Running the Server

### Development Mode (with auto-reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

## Testing the API

### Health Check:
```bash
curl http://localhost:3001/api/health
```

### Search Videos:
```bash
curl "http://localhost:3001/api/video/search?query=music&limit=5"
```

### Get Video Info:
```bash
curl "http://localhost:3001/api/video/info?url=https://www.youtube.com/watch?v=VIDEO_ID"
```

### Start Download:
```bash
curl -X POST http://localhost:3001/api/download \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"https://www.youtube.com/watch?v=VIDEO_ID\",\"type\":\"video\",\"quality\":\"best\"}"
```

### Batch Download:
```bash
curl -X POST http://localhost:3001/api/batch \
  -H "Content-Type: application/json" \
  -d "{\"urls\":[\"URL1\",\"URL2\"],\"type\":\"video\",\"quality\":\"best\"}"
```

## Features

✅ Single video/audio downloads
✅ Batch downloads (multiple URLs)
✅ Video search
✅ Trending videos
✅ Playlist support
✅ Real-time progress via Socket.IO
✅ File management
✅ Custom download path

## Requirements

- Node.js >= 18.0.0
- yt-dlp (must be installed and in PATH)
- ffmpeg (for audio conversion)

### Installing yt-dlp:

**Windows:**
```bash
winget install yt-dlp
```

**Or download from:** https://github.com/yt-dlp/yt-dlp/releases

### Installing ffmpeg:

**Windows:**
```bash
winget install ffmpeg
```

**Or download from:** https://ffmpeg.org/download.html

## Troubleshooting

### Error: Cannot find package 'uuid'
Run: `npm install`

### Error: yt-dlp not found
Install yt-dlp and ensure it's in your PATH

### Error: CORS issues
Update `CORS_ORIGIN` in `.env` to match your frontend URL

### Port already in use
Change `PORT` in `.env` to a different port (e.g., 3002)

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration
│   ├── middleware/      # Error handling, validation, logging
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utilities
│   └── server.js        # Entry point
├── .env                 # Environment variables
├── package.json         # Dependencies
└── README.md           # Documentation
```

## Socket.IO Events

Connect to `ws://localhost:3001` to receive real-time updates:

- `download:progress` - Download progress updates
- `batch:progress` - Batch download progress

## API Response Format

### Success:
```json
{
  "success": true,
  "data": { ... }
}
```

### Error:
```json
{
  "success": false,
  "error": "Error message"
}
```
