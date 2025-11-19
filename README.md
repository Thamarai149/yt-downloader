# 🌐 YouTube Downloader Pro - Web Application

A modern, full-stack web application for downloading YouTube videos with real-time progress tracking.

## ✨ Features

- 🎥 **Video Downloads**: 4K, 2K, 1080p, 720p, 480p, 360p
- 🎵 **Audio Downloads**: MP3 format, highest quality
- 📊 **Real-time Progress**: Live download tracking via WebSocket
- 🎨 **Modern UI**: Dark theme, responsive design
- 📱 **Mobile-Friendly**: Works on any device
- ⚡ **Fast**: No framework overhead, pure JavaScript
- 🔧 **FFmpeg Integration**: Automatic merging for 2K/4K videos

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Install FFmpeg (Required for 2K/4K)

**Windows (Chocolatey):**
```bash
choco install ffmpeg
```

**Windows (Manual):**
- Download from: https://www.gyan.dev/ffmpeg/builds/
- Extract and add to PATH

**Mac:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt install ffmpeg
```

### 3. Start the Server

**Quick Start:**
```bash
start-web-app.bat
```

**Or manually:**
```bash
cd backend
npm start
```

### 4. Open in Browser

Navigate to: **http://localhost:3000**

## 📁 Project Structure

```
youtube-downloader-pro/
├── backend/                   # Node.js backend
│   ├── src/
│   │   ├── services/         # Download service with FFmpeg
│   │   ├── routes/           # API endpoints
│   │   ├── middleware/       # Error handling, logging
│   │   └── server.js         # Main server
│   ├── downloads/            # Downloaded files
│   └── package.json
│
├── web-frontend/             # Web interface
│   ├── index.html           # Main page
│   ├── styles.css           # Dark theme styling
│   └── app.js               # Frontend logic
│
├── start-web-app.bat        # Quick start script
└── README.md                # This file
```

## 🎯 How It Works

### Download Quality Strategy:

- **240p - 1080p**: Downloads single file (video+audio combined)
- **2K (1440p)**: Downloads video + audio separately, merges with FFmpeg
- **4K (2160p)**: Downloads video + audio separately, merges with FFmpeg

### Technology Stack:

**Frontend:**
- HTML5, CSS3, JavaScript ES6+
- Socket.IO client for real-time updates
- Fetch API for HTTP requests

**Backend:**
- Node.js + Express
- Socket.IO for WebSocket communication
- youtube-dl-exec for video downloads
- FFmpeg for video/audio merging

## 📡 API Endpoints

### POST `/api/video/info`
Get video information
```json
{
  "url": "https://youtube.com/watch?v=..."
}
```

### POST `/api/download/start`
Start download
```json
{
  "url": "https://youtube.com/watch?v=...",
  "type": "video",
  "quality": "1080p"
}
```

### GET `/api/download/active`
Get active downloads

### GET `/api/download/history`
Get download history

## 🌐 Access from Other Devices

### Local Network Access:

1. Start the server on your PC
2. Find your IP address:
   ```bash
   ipconfig  # Windows
   ifconfig  # Mac/Linux
   ```
3. On other devices, open: `http://YOUR_IP:3000`

## 🔧 Configuration

Create `backend/.env` file:
```env
PORT=3000
NODE_ENV=development
DOWNLOAD_PATH=./downloads
```

## 🎨 Customization

### Change Theme Colors

Edit `web-frontend/styles.css`:
```css
:root {
    --primary: #FF0000;        /* Red */
    --secondary: #065FD4;      /* Blue */
    --bg-primary: #0F0F0F;     /* Dark background */
}
```

### Change Port

Edit `backend/.env`:
```env
PORT=8080
```

Update `web-frontend/app.js`:
```javascript
const API_URL = 'http://localhost:8080';
```

## 🚀 Deployment

### Heroku:
```bash
heroku create youtube-downloader-pro
git push heroku main
```

### DigitalOcean/AWS:
1. Deploy Node.js app
2. Install FFmpeg on server
3. Set environment variables
4. Open port 3000

### Docker:
```dockerfile
FROM node:18
RUN apt-get update && apt-get install -y ffmpeg
WORKDIR /app
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
COPY web-frontend/ ./web-frontend/
EXPOSE 3000
CMD ["npm", "start"]
```

## 🐛 Troubleshooting

### Port already in use:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill
```

### FFmpeg not found:
- Install FFmpeg and add to PATH
- Restart terminal/server
- Test: `ffmpeg -version`

### CORS errors:
- Check `CORS_ORIGIN` in `.env`
- Ensure frontend URL matches backend

### Socket.IO not connecting:
- Check firewall settings
- Verify server is running
- Check browser console for errors

## 📊 Performance

- **Lightweight**: ~50KB frontend (HTML+CSS+JS)
- **Fast**: No framework overhead
- **Real-time**: WebSocket for instant updates
- **Efficient**: Stream-based downloads

## 🔒 Security

- CORS configured for localhost
- Helmet.js for security headers
- Input validation
- Safe file handling
- No sensitive data stored

## 🎯 Browser Support

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Opera
- ✅ Mobile browsers

## 📝 License

MIT License - feel free to use for personal or commercial projects

## 🤝 Contributing

Contributions welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## 📞 Support

For issues or questions:
- Check troubleshooting section
- Review API documentation
- Check browser console for errors

## 🎉 Credits

Built with:
- [youtube-dl-exec](https://github.com/microlinkhq/youtube-dl-exec)
- [Express](https://expressjs.com/)
- [Socket.IO](https://socket.io/)
- [FFmpeg](https://ffmpeg.org/)

---

**Start downloading now:**
```bash
start-web-app.bat
```

**Then open:** http://localhost:3000

Enjoy! 🚀✨
