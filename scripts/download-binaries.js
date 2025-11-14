/**
 * Download Binaries Script
 * Downloads yt-dlp and ffmpeg binaries for the current platform
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');

const BINARIES_DIR = path.join(__dirname, '../binaries');

// Binary configurations
const binaries = {
  'yt-dlp': {
    win32: {
      url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe',
      filename: 'yt-dlp.exe',
    },
    darwin: {
      url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos',
      filename: 'yt-dlp',
    },
    linux: {
      url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp',
      filename: 'yt-dlp',
    },
  },
  'ffmpeg': {
    win32: {
      url: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip',
      filename: 'ffmpeg.exe',
      note: 'Manual extraction required from ZIP',
    },
    darwin: {
      url: 'https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip',
      filename: 'ffmpeg',
      note: 'Manual extraction required from ZIP',
    },
    linux: {
      url: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz',
      filename: 'ffmpeg',
      note: 'Manual extraction required from archive',
    },
  },
};

/**
 * Download a file from URL
 */
async function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading: ${url}`);
    
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
      // Handle redirects
      if (response.statusCode === 302 || response.statusCode === 301) {
        downloadFile(response.headers.location, destination)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      const fileStream = fs.createWriteStream(destination);
      
      response.pipe(fileStream);
      
      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`Downloaded: ${destination}`);
        resolve();
      });
      
      fileStream.on('error', (err) => {
        fs.unlink(destination, () => {});
        reject(err);
      });
    }).on('error', reject);
  });
}

/**
 * Make file executable (Unix systems)
 */
function makeExecutable(filePath) {
  if (process.platform !== 'win32') {
    try {
      fs.chmodSync(filePath, 0o755);
      console.log(`Made executable: ${filePath}`);
    } catch (error) {
      console.error(`Failed to make executable: ${error.message}`);
    }
  }
}

/**
 * Main download function
 */
async function main() {
  const platform = process.platform;
  
  console.log(`Platform: ${platform}`);
  console.log(`Binaries directory: ${BINARIES_DIR}`);
  
  // Create binaries directory if it doesn't exist
  if (!fs.existsSync(BINARIES_DIR)) {
    fs.mkdirSync(BINARIES_DIR, { recursive: true });
    console.log('Created binaries directory');
  }
  
  // Download yt-dlp
  try {
    const ytdlpConfig = binaries['yt-dlp'][platform];
    if (ytdlpConfig) {
      const destination = path.join(BINARIES_DIR, ytdlpConfig.filename);
      
      if (fs.existsSync(destination)) {
        console.log(`yt-dlp already exists: ${destination}`);
      } else {
        await downloadFile(ytdlpConfig.url, destination);
        makeExecutable(destination);
      }
    } else {
      console.warn(`No yt-dlp binary configuration for platform: ${platform}`);
    }
  } catch (error) {
    console.error(`Failed to download yt-dlp: ${error.message}`);
  }
  
  // Note about ffmpeg
  const ffmpegConfig = binaries['ffmpeg'][platform];
  if (ffmpegConfig) {
    console.log('\n⚠️  FFmpeg Download Note:');
    console.log(`   ${ffmpegConfig.note}`);
    console.log(`   Download from: ${ffmpegConfig.url}`);
    console.log(`   Extract and place '${ffmpegConfig.filename}' in: ${BINARIES_DIR}`);
  }
  
  console.log('\n✅ Binary download process complete!');
  console.log('   Note: You may need to manually download and extract ffmpeg.');
}

// Run the script
main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
