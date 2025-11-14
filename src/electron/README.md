# Electron Main Process

This directory contains the Electron main process code for the YouTube Downloader Pro desktop application.

## Structure

```
src/electron/
├── main.js              # Main process entry point
├── preload.js           # Preload script (secure bridge)
├── backend-manager.js   # Backend server lifecycle management
├── ipc-handler.js       # IPC communication handlers
├── types.d.ts           # TypeScript type definitions
├── tsconfig.json        # TypeScript configuration
└── README.md            # This file
```

## Components

### main.js
- Application lifecycle management
- Window creation and management
- Integration with backend-manager and ipc-handler
- Error handling

### preload.js
- Secure bridge between renderer and main process
- Exposes safe APIs via contextBridge
- No direct Node.js access from renderer

### backend-manager.js
- Manages Express backend server as child process
- Dynamic port allocation
- Health monitoring
- Graceful startup/shutdown

### ipc-handler.js
- Handles IPC communication
- Settings management
- File system operations
- Native dialogs

### types.d.ts
- TypeScript definitions for Electron API
- Type safety for renderer process

## Development

### Running in Development Mode

```bash
npm run electron:dev
```

This will:
1. Start the backend server
2. Start the Vite dev server (frontend)
3. Launch Electron with hot reload

### Building for Production

```bash
npm run electron:build
```

This will:
1. Build the frontend (Vite)
2. Prepare backend files
3. Package with Electron Builder
4. Create installer

## Environment Variables

- `NODE_ENV` - Set to 'production' for production builds
- `PORT` - Backend server port (auto-assigned if not set)

## Security

- **Context Isolation**: Enabled
- **Node Integration**: Disabled
- **Preload Script**: Used for secure API exposure
- **CSP**: Content Security Policy enforced

## IPC Channels

### App Information
- `app:get-version` - Get application version
- `app:get-paths` - Get application paths
- `backend:get-url` - Get backend server URL

### Settings
- `settings:get` - Get user settings
- `settings:set` - Update user settings

### File Operations
- `download:select-folder` - Open folder picker dialog
- `file:open-folder` - Open folder in system explorer
- `file:open-file` - Open file with default application

### Notifications
- `notification:show` - Show native notification

### Updates (Future)
- `update:check` - Check for updates
- `update:download` - Download update
- `update:install` - Install update
- `update:progress` - Update download progress

## Notes

- Main process runs Node.js
- Renderer process runs Chromium
- Communication via IPC only
- Backend runs as separate child process
