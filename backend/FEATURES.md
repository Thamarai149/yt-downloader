# Backend Features Documentation

## 🎯 Core Features

### 1. Video Downloads
Download YouTube videos in various qualities.

**Endpoint:** `POST /api/download`

**Request:**
```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "type": "video",
  "quality": "best" // or "1080", "720", "4k"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "download-id",
    "title": "Video Title",
    "status": "downloading",
    "progress": 0
  }
}
```

### 2. Audio Downloads
Extract and download audio from YouTube videos.

**Endpoint:** `POST /api/download`

**Request:**
```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "type": "audio",
  "quality": "best"
}
```

### 3. Batch Downloads
Download multiple videos/audios at once.

**Endpoint:** `POST /api/batch`

**Request:**
```json
{
  "urls": [
    "https://www.youtube.com/watch?v=VIDEO_ID_1",
    "https://www.youtube.com/watch?v=VIDEO_ID_2",
    "https://www.youtube.com/watch?v=VIDEO_ID_3"
  ],
  "type": "video",
  "quality": "best"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "batchId": "batch-id",
    "total": 3,
    "message": "Batch download started"
  }
}
```

**Real-time Updates:**
```javascript
socket.on('batch:progress', (data) => {
  console.log(`Batch: ${data.completed}/${data.total} completed`);
  console.log(`Failed: ${data.failed}`);
  console.log(`Status: ${data.status}`);
});
```

### 4. Video Search
Search for YouTube videos.

**Endpoint:** `GET /api/video/search?query=music&limit=10`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "video-id",
      "title": "Video Title",
      "url": "https://www.youtube.com/watch?v=VIDEO_ID",
      "duration": 240,
      "thumbnail": "https://...",
      "uploader": "Channel Name",
      "viewCount": 1000000,
      "uploadDate": "20240101"
    }
  ]
}
```

### 5. Trending Videos
Get trending/popular videos.

**Endpoint:** `GET /api/video/trending?limit=20`

### 6. Video Information
Get detailed information about a video.

**Endpoint:** `GET /api/video/info?url=VIDEO_URL`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "video-id",
    "title": "Video Title",
    "duration": 240,
    "uploader": "Channel Name",
    "viewCount": 1000000,
    "thumbnail": "https://...",
    "description": "Video description...",
    "uploadDate": "20240101",
    "url": "https://...",
    "formats": [2160, 1080, 720, 480, 360]
  }
}
```

### 7. Playlist Support
Get information about YouTube playlists.

**Endpoint:** `GET /api/video/playlist?url=PLAYLIST_URL`

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "Playlist Title",
    "uploader": "Channel Name",
    "videoCount": 50,
    "videos": [
      {
        "id": "video-id",
        "title": "Video Title",
        "url": "https://...",
        "duration": 240,
        "thumbnail": "https://..."
      }
    ]
  }
}
```

### 8. File Management
Manage downloaded files.

**List Files:**
```
GET /api/files
```

**Response:**
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "name": "video.mp4",
        "size": 10485760,
        "created": "2024-01-01T00:00:00.000Z",
        "modified": "2024-01-01T00:00:00.000Z",
        "ext": ".mp4"
      }
    ],
    "downloadPath": "C:\\Downloads\\YT-Downloads"
  }
}
```

**Delete File:**
```
DELETE /api/files/video.mp4
```

**Get Download Path:**
```
GET /api/files/path
```

**Update Download Path:**
```
POST /api/files/path
{
  "downloadPath": "C:\\New\\Path"
}
```

### 9. Real-time Progress Tracking
Monitor download progress via Socket.IO.

**Connect:**
```javascript
import io from 'socket.io-client';
const socket = io('http://localhost:3001');
```

**Listen for Progress:**
```javascript
socket.on('download:progress', (data) => {
  console.log(`Download ${data.id}: ${data.progress}%`);
  console.log(`Status: ${data.status}`);
  console.log(`Title: ${data.title}`);
});
```

**Events:**
- `download:progress` - Single download progress
- `batch:progress` - Batch download progress

### 10. Download Management

**Get Active Downloads:**
```
GET /api/download/active
```

**Get Download History:**
```
GET /api/download/history
```

**Cancel Download:**
```
DELETE /api/download/:downloadId
```

**Cancel Batch:**
```
DELETE /api/batch/:batchId
```

## 🔒 Security Features

### 1. Input Validation
All inputs are validated using Joi schemas:
- URL validation
- Type validation (video/audio)
- Quality validation
- Query parameter validation

### 2. Error Handling
Comprehensive error handling with proper HTTP status codes:
- 400: Bad Request (invalid input)
- 404: Not Found
- 500: Internal Server Error

### 3. CORS Protection
Configurable CORS settings via environment variables.

### 4. Helmet Security
HTTP security headers via Helmet middleware.

### 5. Request Logging
All requests are logged with timing information.

## 📊 Quality Options

### Video Quality
- `best` - Best available quality
- `4k` - 2160p (if available)
- `1080` - 1080p Full HD
- `720` - 720p HD
- `480` - 480p SD
- `360` - 360p

### Audio Quality
- `best` - Best available audio quality (320kbps MP3)

## 🎨 Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

## 🚀 Performance Features

### 1. Compression
Response compression via compression middleware.

### 2. Concurrent Downloads
Configurable maximum concurrent downloads (default: 3).

### 3. Sequential Batch Processing
Batch downloads are processed sequentially to avoid system overload.

### 4. Progress Streaming
Real-time progress updates via Socket.IO.

## 🛠️ Configuration

All features are configurable via `.env`:

```env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
DOWNLOAD_PATH=C:\Downloads\YT-Downloads
MAX_CONCURRENT_DOWNLOADS=3
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

## 📝 Usage Examples

### Example 1: Download a Video
```javascript
const response = await fetch('http://localhost:3001/api/download', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    type: 'video',
    quality: '1080'
  })
});

const data = await response.json();
console.log(data.data.id); // Download ID
```

### Example 2: Search and Download
```javascript
// Search
const searchRes = await fetch('http://localhost:3001/api/video/search?query=music&limit=5');
const searchData = await searchRes.json();

// Download first result
const downloadRes = await fetch('http://localhost:3001/api/download', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: searchData.data[0].url,
    type: 'audio',
    quality: 'best'
  })
});
```

### Example 3: Batch Download with Progress
```javascript
// Start batch
const batchRes = await fetch('http://localhost:3001/api/batch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    urls: ['url1', 'url2', 'url3'],
    type: 'video',
    quality: 'best'
  })
});

const batchData = await batchRes.json();
const batchId = batchData.data.batchId;

// Monitor progress
socket.on('batch:progress', (data) => {
  if (data.batchId === batchId) {
    console.log(`Pr