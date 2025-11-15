# Binary Usage Implementation

## Overview
The backend now properly uses bundled binaries (yt-dlp and ffmpeg) with automatic fallback to system binaries.

## Implementation Details

### 1. Binary Manager Integration
- `BinaryManager` is initialized on server startup
- Verifies both yt-dlp and ffmpeg binaries
- Falls back to system binaries if bundled ones are not found
- Status is stored in `binaryStatus` and `binariesReady` variables

### 2. Custom Binary Paths
The `getYoutubedl()` helper function now:
- Creates a custom yt-dlp instance using `createYoutubeDl(ytdlpPath)` when a bundled binary is found
- Passes `ffmpegLocation` option to all yt-dlp calls for audio extraction and format conversion
- Falls back to default binaries if custom paths are not available

### 3. Binary Verification Middleware
- `checkBinariesReady()` middleware protects all download-related endpoints
- Returns 503 error with binary status if binaries are not available
- Applied to endpoints: `/api/info`, `/api/download`, `/api/search`, `/api/playlist`, `/api/channel`, `/api/download-subtitles`, `/api/download-thumbnail`, `/api/stream`, `/api/bulk-import`

### 4. Health Check Updates
- `/api/health` endpoint now includes `binariesReady` status
- Status is "ok" when binaries are ready, "degraded" otherwise

## Testing
Run the test script to verify binary usage:
```bash
node backend/test-binary-usage.js
```

## Binary Paths
- **Development**: Binaries are expected in `binaries/` directory
- **Production (Electron)**: Binaries are in `resources/binaries/` directory
- **Fallback**: System-installed yt-dlp and ffmpeg

## Error Handling
- Server starts even if binaries are missing (with warnings)
- Download endpoints return 503 error if binaries are unavailable
- Detailed error messages include binary status information
