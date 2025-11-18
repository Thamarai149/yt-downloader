# Complete Setup Guide

## Prerequisites

1. **Node.js** (v18 or higher)
   - Download: https://nodejs.org/

2. **Flutter SDK**
   - Download: https://flutter.dev/docs/get-started/install

3. **yt-dlp**
   ```bash
   winget install yt-dlp
   ```

4. **ffmpeg**
   ```bash
   winget install ffmpeg
   ```

## Setup Steps

### 1. Check Requirements
```bash
# In backend folder
cd backend
.\check-requirements.bat
cd ..
```

### 2. Setup Backend
```bash
# In backend folder
cd backend
.\install.bat
cd ..
```

### 3. Setup Flutter
```bash
# In root folder
flutter pub get
```

## Running the Application

### Method 1: Run Everything at Once (Recommended)
Double-click **`run-all.bat`** in the root folder.

This will:
1. Start the backend server
2. Start the Flutter app

### Method 2: Run Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Flutter:**
```bash
flutter run
```

### Method 3: Using Scripts

**Backend only:**
```bash
cd backend
.\start.bat
```

**Flutter only:**
```bash
.\run-flutter.bat
```

## Verify Everything is Working

1. **Backend Health Check:**
   Open browser: http://localhost:3001/api/health
   
   Should see:
   ```json
   {
     "status": "ok",
     "timestamp": "...",
     "uptime": 123
   }
   ```

2. **Flutter App:**
   - Should launch and show the main screen
   - Try searching for a video
   - Try downloading a video

## Troubleshooting

### Backend Issues

**Error: Cannot find package 'uuid'**
```bash
cd backend
npm install
```

**Error: yt-dlp not found**
```bash
winget install yt-dlp
# Restart terminal after installation
```

**Error: ffmpeg not found**
```bash
winget install ffmpeg
# Restart terminal after installation
```

**Port 3001 already in use**
- Edit `backend/.env` and change PORT to 3002
- Update Flutter app to use new port

### Flutter Issues

**Error: No devices found**
```bash
flutter devices
# Make sure you have a device/emulator running
```

**Error: Packages not found**
```bash
flutter pub get
flutter clean
flutter pub get
```

**Error: Cannot connect to backend**
- Make sure backend is running on http://localhost:3001
- Check backend/.env CORS_ORIGIN setting
- Check Flutter app API endpoint configuration

## Project Structure

```
ytdownloader/
├── backend/                    # Node.js backend
│   ├── src/
│   │   ├── config/            # Configuration
│   │   ├── middleware/        # Middleware
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   └── server.js          # Entry point
│   ├── .env                   # Environment config
│   ├── package.json           # Dependencies
│   ├── check-requirements.bat # Check script
│   ├── install.bat            # Install script
│   └── start.bat              # Start script
├── lib/                       # Flutter app
│   └── main.dart             # Flutter entry point
├── pubspec.yaml              # Flutter dependencies
├── run-flutter.bat           # Run Flutter script
└── run-all.bat               # Run everything script
```

## Development Workflow

1. **Start Backend** (Terminal 1):
   ```bash
   cd backend
   npm run dev
   ```
   - Backend runs on http://localhost:3001
   - Auto-reloads on file changes

2. **Start Flutter** (Terminal 2):
   ```bash
   flutter run
   ```
   - Hot reload: Press `r`
   - Hot restart: Press `R`
   - Quit: Press `q`

3. **Make Changes:**
   - Backend: Edit files in `backend/src/`
   - Flutter: Edit files in `lib/`
   - Both support hot reload!

## API Endpoints

Backend provides these endpoints:

- `GET /api/health` - Health check
- `GET /api/video/search?query=` - Search videos
- `GET /api/video/info?url=` - Get video info
- `POST /api/download` - Start download
- `POST /api/batch` - Batch download
- `GET /api/files` - List files

See `backend/README.md` for complete API documentation.

## Testing

### Test Backend API:
```bash
# Health check
curl http://localhost:3001/api/health

# Search
curl "http://localhost:3001/api/video/search?query=music&limit=5"
```

Or use the `backend/test-api.http` file with REST Client extension.

### Test Flutter App:
```bash
flutter test
```

## Production Build

### Backend:
```bash
cd backend
npm start
```

### Flutter:
```bash
# Windows
flutter build windows

# The executable will be in: build/windows/runner/Release/
```

## Need Help?

- Backend docs: `backend/README.md`
- Features: `backend/FEATURES.md`
- API tests: `backend/test-api.http`
- Migration guide: `backend/MIGRATION_GUIDE.md`
