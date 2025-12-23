# Telegram Bot - Video Resolutions Guide

## 📺 Available Video Resolutions

### 📱 Mobile Quality
- **360p** - Small file size, fast download, basic quality (~50-100MB for 10min video)
- **480p** - Standard mobile quality, good for phones (~100-200MB for 10min video)

### 🖥️ Desktop Quality  
- **720p HD** - High definition, perfect for laptops/desktops (~200-400MB for 10min video)
- **1080p FHD** - Full HD, excellent quality for large screens (~400-800MB for 10min video)

### 🎬 Premium Quality
- **1440p 2K** - Ultra high definition, very large files (~800MB-1.5GB for 10min video)
- **2160p 4K** - Maximum quality, extremely large files (~1.5GB-3GB for 10min video)

### ⚡ Special Options
- **Best Quality** - Automatically selects highest available resolution
- **Fastest Download** - Selects lowest quality for quick downloads

### 🎵 Audio Only
- **MP3 Format** - Audio extraction, perfect for music (~10-20MB for 10min audio)

## 🎛️ Resolution Selection Interface

### Full Download Menu (`/download [URL]`)
```
🎬 Choose resolution and format:

📱 Mobile: 360p, 480p
🖥️ Desktop: 720p, 1080p  
🎬 Premium: 2K, 4K
🎵 Audio: MP3 format

[🎵 Audio Only (MP3)]
[📱 360p] [📺 480p]
[🖥️ 720p HD] [📽️ 1080p FHD]
[🎬 1440p 2K] [🎭 2160p 4K]
[⭐ Best Quality] [⚡ Fastest]
[❌ Cancel]
```

### Quick Download Menu (Direct URL)
```
🎬 Quick download - choose format:

[🎵 Audio] [🎬 720p HD]
[📽️ 1080p FHD] [⭐ Best Quality]
```

## 🔧 Technical Implementation

### Resolution Mapping
The bot maps user selections to youtube-dl format strings:

```javascript
const qualityMap = {
  '360': 'worst[height<=360]',
  '480': 'worst[height<=480]', 
  '720': 'best[height<=720]',
  '1080': 'best[height<=1080]',
  '1440': 'best[height<=1440]',
  '2160': 'best[height<=2160]',
  'best': 'best',
  'worst': 'worst'
};
```

### Callback Data Format
- Full menu: `download_video_720_[URL]`
- Quick menu: `quick_audio_best_[URL]`
- Audio only: `download_audio_best_[URL]`

## 💡 Usage Tips

### File Size Considerations
- **360p-480p**: Good for mobile data, quick sharing
- **720p-1080p**: Best balance of quality and file size
- **2K-4K**: Only for high-end displays, large storage

### Download Speed
- Lower resolutions download faster
- Audio-only is quickest option
- 4K may require significant processing time

### Quality Recommendations
- **Music/Podcasts**: Use Audio Only (MP3)
- **Mobile viewing**: 360p or 480p
- **Computer/TV**: 720p or 1080p
- **Professional use**: 2K or 4K (if available)

## 🚀 Commands for Resolution Selection

```bash
# Show all available resolutions
/resolutions

# Download with resolution menu
/download https://youtube.com/watch?v=example

# Quick audio download
/audio https://youtube.com/watch?v=example

# Quick best quality video
/video https://youtube.com/watch?v=example

# Send URL directly for quick options
https://youtube.com/watch?v=example
```

## 🎯 Resolution Availability

Not all videos support all resolutions:
- **360p-720p**: Available on most videos
- **1080p**: Available on most modern uploads
- **1440p-2160p**: Only on high-quality uploads
- **Audio**: Always available

The bot will automatically select the best available quality if the requested resolution isn't available.