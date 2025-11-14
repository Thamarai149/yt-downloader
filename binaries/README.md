# Binaries Directory

This directory contains external binaries bundled with the application.

## Required Binaries

### Windows
- `yt-dlp.exe` - YouTube downloader binary
- `ffmpeg.exe` - Video/audio processing binary

### macOS
- `yt-dlp` - YouTube downloader binary
- `ffmpeg` - Video/audio processing binary

### Linux
- `yt-dlp` - YouTube downloader binary
- `ffmpeg` - Video/audio processing binary

## Downloading Binaries

Run the download script to automatically fetch the latest binaries:

```bash
npm run download:binaries
```

Or download manually:
- **yt-dlp**: https://github.com/yt-dlp/yt-dlp/releases
- **ffmpeg**: https://github.com/BtbN/FFmpeg-Builds/releases

## Notes

- Binaries are platform-specific
- Make sure to download the correct architecture (x64, arm64, etc.)
- Binaries should be executable (chmod +x on Unix systems)
