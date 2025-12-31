# YTStreamer007 Setup Application

A Windows desktop application for configuring and managing the YTStreamer007 YouTube downloader bot.

## Features

- **Settings Management**: Configure backend path, server port, Telegram token, and download location
- **Server Control**: Start/stop the backend server with real-time status monitoring
- **Dependency Installation**: Automatically install required Node.js packages
- **User-Friendly Interface**: Modern, intuitive GUI with tabbed navigation

## Building the Application

### Prerequisites
- Node.js 18.0.0 or higher
- NPM package manager

### Build Steps

1. Navigate to the setup-app directory:
   ```cmd
   cd setup-app
   ```

2. Install dependencies:
   ```cmd
   npm install
   ```

3. Build the Windows executable:
   ```cmd
   npm run build-win
   ```

   Or use the provided batch file:
   ```cmd
   build.bat
   ```

4. The installer will be created in the `dist` folder

## Development

To run the application in development mode:

```cmd
npm run dev
```

## Application Structure

- **Settings Tab**: Configure all application settings
- **Server Control Tab**: Start/stop backend server and monitor status
- **Installation Tab**: Install backend dependencies

## Usage

1. Run the built installer to install the application
2. Launch YTStreamer007 Setup from the Start Menu or Desktop
3. Configure your settings in the Settings tab:
   - Set the backend path (where your backend folder is located)
   - Configure server port (default: 3000)
   - Enter your Telegram bot token
   - Set download location
4. Install dependencies in the Installation tab
5. Start the server from the Server Control tab

## Settings Storage

Settings are automatically saved using Electron Store and persist between application restarts.

## Troubleshooting

- Ensure Node.js is installed and accessible from the command line
- Make sure the backend path points to a valid backend directory
- Check that the Telegram bot token is correct
- Verify that the specified port is not in use by another application