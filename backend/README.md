# YouTube Downloader Backend

Modern Node.js backend for YouTube video/audio downloading with real-time progress tracking.

## Features

- Video and audio downloads from YouTube
- Real-time progress tracking via Socket.IO
- Video information and search
- Playlist support
- File management
- Clean architecture with services and routes

## Installation

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
DOWNLOAD_PATH=
MAX_CONCURRENT_DOWNLOADS=3
```

## Usage

Development:
```bash
npm run dev
```

Production:
```bash
npm start
```

## API Endpoints

### Downloads
- `POST /api/download` - Start download
- `GET /api/download/active` - Get active downloads
- `GET /api/download/history` - Get download history
- `DELETE /api/download/:id` - Cancel download

### Batch Downloads
- `POST /api/batch` - Start batch download
- `GET /api/batch` - Get all batches
- `GET /api/batch/:batchId` - Get batch status
- `DELETE /api/batch/:batchId` - Cancel batch

### Videos
- `GET /api/video/info?url=` - Get video info
- `GET /api/video/search?query=` - Search videos
- `GET /api/video/playlist?url=` - Get playlist info

### Files
- `GET /api/files` - List downloaded files
- `DELETE /api/files/:filename` - Delete file
- `GET /api/files/path` - Get download path
- `POST /api/files/path` - Update download path

## Socket.IO Events

- `download:progress` - Download progress updates
- `batch:progress` - Batch download progress updates

## Requirements

- Node.js >= 18.0.0
- yt-dlp (installed globally or in PATH)
- ffmpeg (for audio conversion)
