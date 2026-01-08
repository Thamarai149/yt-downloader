# YTStreamer Pro Manager

A professional YouTube downloader system with Telegram bot integration and desktop management interface.

## 🚀 Features

- **Telegram Bot Integration**: Download YouTube videos directly through Telegram
- **Playlist Support**: Download entire YouTube playlists with progress tracking
- **Desktop Management App**: Electron-based control panel for easy configuration
- **Auto-Update System**: Built-in update checker with changelog display
- **Real-time Progress Tracking**: Live download progress updates via WebSocket
- **Multiple Format Support**: Download videos in various qualities and formats
- **Batch Operations**: Download multiple videos or entire playlists
- **Rate Limiting**: Built-in protection against API abuse
- **Cross-platform**: Works on Windows, macOS, and Linux
- **Cloud Deployment Ready**: Configured for Render.com deployment

## 📁 Project Structure

```
├── backend/                 # Node.js backend server
│   ├── src/                # Server source code
│   ├── downloads/          # Downloaded files storage
│   └── package.json        # Backend dependencies
├── setup-app/              # Electron desktop application
│   ├── src/                # Electron app source
│   ├── assets/             # App icons and resources
│   └── package.json        # Desktop app dependencies
├── web-frontend/           # Web interface (if applicable)
└── package.json            # Root project configuration
```

## 🛠️ Installation

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager
- Telegram Bot Token (from @BotFather)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ytstreamer-pro-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd backend && npm install
   cd ../setup-app && npm install
   ```

3. **Configure environment**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the backend server**
   ```bash
   cd backend
   npm start
   ```

5. **Launch the desktop app**
   ```bash
   cd setup-app
   npm start
   ```

## ⚙️ Configuration

### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```env
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
DOWNLOAD_PATH=/path/to/downloads
MAX_CONCURRENT_DOWNLOADS=3
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
```

### Desktop App Configuration

The Electron app provides a user-friendly interface to:
- Set backend server path
- Configure Telegram bot token
- Set download directory
- Manage server startup options
- Monitor download progress
- **Check for updates with detailed changelogs**
- **View version history and release notes**

## 🤖 Telegram Bot Setup

1. Create a new bot with @BotFather on Telegram
2. Get your bot token
3. Add the token to your `.env` file
4. Start the backend server
5. Your bot is ready to accept YouTube links!

### Bot Commands

**Single Video Downloads:**
- `/download [URL]` - Show resolution options
- `/audio [URL]` - Download audio only (MP3)
- `/video [URL]` - Download video (best quality)

**Playlist Downloads:**
- `/playlist [URL]` - Download entire playlist
- Supports quality selection (360p to 4K)
- Option to limit downloads (first 10/20 videos)
- Real-time progress tracking
- Continues on errors (skips private/deleted videos)

**Utility Commands:**
- `/status` - Check active downloads/playlists
- `/cancel` - Cancel current operation
- `/location` - Show download folder path
- `/help` - Show all commands

### Playlist Features

- **Smart Processing**: Downloads videos sequentially to avoid overwhelming the system
- **Progress Tracking**: Real-time updates showing completed/failed/total videos
- **Error Handling**: Continues downloading even if some videos fail
- **Flexible Limits**: Download entire playlist or limit to first N videos
- **Quality Options**: Same quality options as single videos (360p to 4K)
- **Format Support**: Both video (MP4) and audio-only (MP3) downloads

## 🔄 Update System

The application includes a built-in update checker that helps keep your software current:

### Features
- **Automatic Update Detection**: Checks for new versions from your configured source
- **Detailed Changelogs**: View what's new in each version with categorized changes
- **Security Updates**: Special highlighting for security-critical updates
- **Version History**: Browse previous versions and their release notes
- **One-Click Downloads**: Direct links to download new versions

### Update Categories
- **🎉 Feature Updates**: New functionality and enhancements
- **🛡️ Security Updates**: Critical security patches (highlighted in orange)
- **🐛 Bug Fixes**: Resolved issues and stability improvements
- **⚡ Performance**: Speed and efficiency improvements

### Desktop App Integration
- **Updates Tab**: Dedicated interface for checking and viewing updates
- **Version Display**: Current version shown in the interface
- **Last Check Time**: Timestamp of the most recent update check
- **Manual Check**: Force check for updates with a single click

### API Integration
The update system provides REST endpoints for programmatic access:
```bash
# Check for updates
GET /api/updates/check

# Get current version
GET /api/updates/version

# Get changelog for specific version
GET /api/updates/changelog/3.1.0
```

## 🚀 Deployment

### Local Development

```bash
# Start backend in development mode
cd backend && npm run dev

# Start desktop app in development mode
cd setup-app && npm run dev
```

### Production Deployment (Render.com)

The project includes a `render.yaml` configuration for easy deployment:

1. Connect your repository to Render.com
2. Set up environment variables in Render dashboard
3. Deploy automatically with git push

### Building Desktop App

```bash
cd setup-app
npm run build        # Build for current platform
npm run build-win    # Build for Windows
```

## 📡 API Endpoints

### Download Endpoints
- `POST /api/download` - Start a new download
- `GET /api/download/:id` - Get download status
- `DELETE /api/download/:id` - Cancel download

### Playlist Endpoints
- `GET /api/playlist/info?url=` - Get playlist information
- `POST /api/playlist` - Start playlist download
- `GET /api/playlist/active` - Get active playlists
- `GET /api/playlist/history` - Get playlist history
- `GET /api/playlist/:id` - Get specific playlist status
- `DELETE /api/playlist/:id` - Cancel playlist download

### Update Endpoints
- `GET /api/updates/check` - Check for available updates
- `GET /api/updates/version` - Get current version info
- `GET /api/updates/summary` - Get update summary
- `GET /api/updates/changelog/:version` - Get changelog for specific version

### System Endpoints
- `GET /api/health` - Health check
- `GET /api/status` - Server status

## 🔧 Development

### Backend Development

```bash
cd backend
npm run dev          # Start with nodemon
npm test            # Run tests
npm run lint        # Lint code
npm run format      # Format code
```

### Desktop App Development

```bash
cd setup-app
npm run dev         # Start in development mode
npm run build       # Build for production
```

## 📋 Requirements

- **Node.js**: >= 18.0.0
- **RAM**: Minimum 512MB, Recommended 1GB+
- **Storage**: Varies based on download volume
- **Network**: Stable internet connection for YouTube API

## 🛡️ Security Features

- Rate limiting to prevent abuse
- Input validation and sanitization
- CORS protection
- Helmet.js security headers
- Environment variable protection

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Kill processes on port 3000
   npx kill-port 3000
   ```

2. **Download failures**
   - Check internet connection
   - Verify YouTube URL is valid
   - Ensure sufficient disk space

3. **Telegram bot not responding**
   - Verify bot token is correct
   - Check backend server is running
   - Ensure webhook is properly configured

### Logs

- Backend logs: Check console output or log files
- Desktop app logs: Check Electron developer tools
- Download progress: Monitor via WebSocket connection

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions:
- Check the troubleshooting section
- Review existing issues
- Create a new issue with detailed information

## 🔄 Version History

- **v3.0.0**: Modern architecture with real-time progress
- **v2.x.x**: Enhanced Telegram integration
- **v1.x.x**: Initial release

---

**Note**: This software is for educational purposes. Ensure you comply with YouTube's Terms of Service and respect content creators' rights.