# Migration Guide: v2.0 → v3.0

## What Changed?

The backend has been completely rewritten with a modern, clean architecture.

## Breaking Changes

### 1. API Response Format
**Old:**
```json
{
  "message": "Success",
  "downloadId": "123"
}
```

**New:**
```json
{
  "success": true,
  "data": {
    "downloadId": "123"
  }
}
```

### 2. Endpoint Changes

| Old Endpoint | New Endpoint | Notes |
|-------------|--------------|-------|
| `/api/info` | `/api/video/info` | Moved under `/video` |
| `/api/search` | `/api/video/search` | Moved under `/video` |
| `/api/playlist` | `/api/video/playlist` | Moved under `/video` |
| `/api/download-path` | `/api/files/path` | Moved under `/files` |
| N/A | `/api/batch` | New batch download feature |
| N/A | `/api/video/trending` | New trending videos |

### 3. Configuration
**Old:** `download-config.json`
**New:** `.env` file

### 4. Dependencies
- Removed: Electron-specific code
- Changed: Using native `crypto.randomUUID()` instead of uuid package
- Added: Joi for validation

## New Features

### ✨ Batch Downloads
Download multiple videos at once:
```javascript
POST /api/batch
{
  "urls": ["url1", "url2", "url3"],
  "type": "video",
  "quality": "best"
}
```

### ✨ Enhanced Search
- Better search results with more metadata
- Trending videos endpoint
- Improved error handling

### ✨ Real-time Progress
Socket.IO events for both single and batch downloads:
- `download:progress`
- `batch:progress`

### ✨ Better Error Handling
- Consistent error format
- Detailed error messages
- Proper HTTP status codes

## Installation Steps

1. **Backup your old backend** (optional)
```bash
move backend backend-old
```

2. **Install dependencies**
```bash
cd backend
npm install
```

3. **Create .env file**
```bash
copy .env.example .env
```

4. **Configure .env**
```env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
DOWNLOAD_PATH=C:\Users\YourUsername\Downloads\YT-Downloads
```

5. **Start the server**
```bash
npm run dev
```

## Code Structure

### Old Structure:
```
backend/
├── server.js (1000+ lines)
├── binary-manager.js
├── electron-paths.js
└── package.json
```

### New Structure:
```
backend/
├── src/
│   ├── config/
│   │   └── index.js
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   ├── validator.js
│   │   └── logger.js
│   ├── routes/
│   │   ├── index.js
│   │   ├── downloadRoutes.js
│   │   ├── videoRoutes.js
│   │   ├── fileRoutes.js
│   │   └── batchRoutes.js
│   ├── services/
│   │   ├── index.js
│   │   ├── downloadService.js
│   │   ├── videoInfoService.js
│   │   ├── fileService.js
│   │   └── batchService.js
│   ├── utils/
│   │   └── youtubeValidator.js
│   └── server.js
└── package.json
```

## Frontend Integration

### Update API Calls

**Old:**
```javascript
const response = await fetch('http://localhost:3001/api/info?url=' + url);
const data = await response.json();
console.log(data.title);
```

**New:**
```javascript
const response = await fetch('http://localhost:3001/api/video/info?url=' + url);
const data = await response.json();
if (data.success) {
  console.log(data.data.title);
} else {
  console.error(data.error);
}
```

### Socket.IO Connection

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

socket.on('download:progress', (data) => {
  console.log(`Download ${data.downloadId}: ${data.progress}%`);
});

socket.on('batch:progress', (data) => {
  console.log(`Batch ${data.batchId}: ${data.completed}/${data.total}`);
});
```

## Benefits

✅ **Cleaner Code** - Modular, maintainable structure
✅ **Better Errors** - Detailed error messages
✅ **Type Safety** - Input validation with Joi
✅ **Scalability** - Easy to add new features
✅ **Testing** - Easier to write tests
✅ **Documentation** - Better organized
✅ **Performance** - Optimized request handling

## Rollback

If you need to rollback:
```bash
move backend backend-v3
move backend-old backend
cd backend
npm install
npm start
```

## Support

For issues or questions:
1. Check QUICK_START.md
2. Check README.md
3. Review CHANGELOG.md
