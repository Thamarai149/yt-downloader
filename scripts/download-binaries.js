/**
 * Download Binaries Script
 * Downloads yt-dlp and ffmpeg binaries for the current platform
 * Includes checksum verification for integrity
 * 
 * Requirements: 6.1, 6.2, 6.4
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const BINARIES_DIR = path.join(__dirname, '../binaries');
const CHECKSUMS_FILE = path.join(BINARIES_DIR, 'checksums.json');

// Binary configurations
const binaries = {
  'yt-dlp': {
    win32: {
      url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe',
      filename: 'yt-dlp.exe',
      checksumUrl: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/SHA2-256SUMS',
    },
    darwin: {
      url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos',
      filename: 'yt-dlp',
      checksumUrl: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/SHA2-256SUMS',
    },
    linux: {
      url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp',
      filename: 'yt-dlp',
      checksumUrl: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/SHA2-256SUMS',
    },
  },
  'ffmpeg': {
    win32: {
      url: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip',
      filename: 'ffmpeg.exe',
      extract: true,
      extractPath: 'ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe',
    },
    darwin: {
      url: 'https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip',
      filename: 'ffmpeg',
      extract: true,
    },
    linux: {
      url: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz',
      filename: 'ffmpeg',
      extract: true,
      extractPath: 'ffmpeg-*-amd64-static/ffmpeg',
    },
  },
};

/**
 * Calculate SHA256 checksum of a file
 */
function calculateChecksum(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * Download a file from URL with progress indication
 */
async function downloadFile(url, destination, redirectCount = 0) {
  if (redirectCount > 5) {
    throw new Error('Too many redirects');
  }
  
  return new Promise((resolve, reject) => {
    console.log(`📥 Downloading: ${url}`);
    
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
      // Handle redirects (including 303)
      if (response.statusCode === 302 || response.statusCode === 301 || response.statusCode === 303 || response.statusCode === 307 || response.statusCode === 308) {
        const redirectUrl = response.headers.location;
        if (!redirectUrl) {
          reject(new Error('Redirect without location header'));
          return;
        }
        downloadFile(redirectUrl, destination, redirectCount + 1)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode} ${response.statusMessage}`));
        return;
      }
      
      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloadedSize = 0;
      
      const fileStream = fs.createWriteStream(destination);
      
      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        if (totalSize) {
          const percent = ((downloadedSize / totalSize) * 100).toFixed(1);
          process.stdout.write(`\r   Progress: ${percent}%`);
        }
      });
      
      response.pipe(fileStream);
      
      fileStream.on('finish', () => {
        fileStream.close();
        if (totalSize) {
          process.stdout.write('\r   Progress: 100%\n');
        }
        console.log(`✅ Downloaded: ${path.basename(destination)}`);
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
 * Fetch checksum from URL
 */
async function fetchChecksum(url, filename) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        fetchChecksum(response.headers.location, filename)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        resolve(null); // Checksum not available
        return;
      }
      
      let data = '';
      response.on('data', (chunk) => data += chunk);
      response.on('end', () => {
        // Parse checksum file (format: "checksum filename")
        const lines = data.split('\n');
        for (const line of lines) {
          if (line.includes(filename)) {
            const checksum = line.split(/\s+/)[0];
            resolve(checksum);
            return;
          }
        }
        resolve(null);
      });
    }).on('error', () => resolve(null));
  });
}

/**
 * Verify file checksum
 */
async function verifyChecksum(filePath, expectedChecksum) {
  if (!expectedChecksum) {
    console.log('⚠️  No checksum available for verification');
    return true;
  }
  
  console.log('🔍 Verifying checksum...');
  const actualChecksum = await calculateChecksum(filePath);
  
  if (actualChecksum.toLowerCase() === expectedChecksum.toLowerCase()) {
    console.log('✅ Checksum verified');
    return true;
  } else {
    console.error('❌ Checksum mismatch!');
    console.error(`   Expected: ${expectedChecksum}`);
    console.error(`   Actual:   ${actualChecksum}`);
    return false;
  }
}

/**
 * Extract file from archive
 */
async function extractArchive(archivePath, extractPath, targetFilename) {
  console.log(`📦 Extracting: ${path.basename(archivePath)}`);
  
  const ext = path.extname(archivePath).toLowerCase();
  const destDir = path.dirname(archivePath);
  const tempExtractDir = path.join(destDir, 'temp_extract');
  
  try {
    // Create temp extraction directory
    if (!fs.existsSync(tempExtractDir)) {
      fs.mkdirSync(tempExtractDir, { recursive: true });
    }
    
    if (ext === '.zip') {
      // Use PowerShell on Windows, unzip on Unix
      if (process.platform === 'win32') {
        await execAsync(`powershell -command "Expand-Archive -Path '${archivePath}' -DestinationPath '${tempExtractDir}' -Force"`);
      } else {
        await execAsync(`unzip -o "${archivePath}" -d "${tempExtractDir}"`);
      }
    } else if (ext === '.xz' || archivePath.endsWith('.tar.xz')) {
      // Use tar for .tar.xz files
      await execAsync(`tar -xf "${archivePath}" -C "${tempExtractDir}"`);
    }
    
    // Find and move the extracted binary
    if (extractPath) {
      const destination = path.join(destDir, targetFilename);
      let found = false;
      
      // Search for the binary in the extracted directory
      function findBinary(dir, pattern) {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            const result = findBinary(fullPath, pattern);
            if (result) return result;
          } else if (stat.isFile()) {
            // Check if this matches our target binary
            const relativePath = path.relative(tempExtractDir, fullPath);
            if (relativePath.endsWith(pattern.split('/').pop()) || 
                (pattern.includes('*') && relativePath.includes(pattern.split('/').pop()))) {
              return fullPath;
            }
          }
        }
        return null;
      }
      
      const binaryPath = findBinary(tempExtractDir, extractPath);
      
      if (binaryPath) {
        fs.copyFileSync(binaryPath, destination);
        console.log(`✅ Extracted: ${targetFilename}`);
        found = true;
      } else {
        // Debug: list what we found
        console.log(`⚠️  Could not find binary matching pattern: ${extractPath}`);
        console.log(`   Searching in: ${tempExtractDir}`);
        const allFiles = [];
        function listAll(dir, indent = '') {
          const files = fs.readdirSync(dir);
          files.forEach(file => {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
              allFiles.push(`${indent}${file}/`);
              listAll(fullPath, indent + '  ');
            } else {
              allFiles.push(`${indent}${file}`);
            }
          });
        }
        listAll(tempExtractDir);
        console.log(`   Found files:\n${allFiles.slice(0, 20).join('\n')}`);
        throw new Error(`Could not find binary matching pattern: ${extractPath}`);
      }
    }
    
    // Clean up
    if (fs.existsSync(tempExtractDir)) {
      fs.rmSync(tempExtractDir, { recursive: true, force: true });
    }
    fs.unlinkSync(archivePath);
    console.log('✅ Extraction complete');
  } catch (error) {
    // Clean up on error
    if (fs.existsSync(tempExtractDir)) {
      fs.rmSync(tempExtractDir, { recursive: true, force: true });
    }
    console.error(`❌ Extraction failed: ${error.message}`);
    throw error;
  }
}

/**
 * Make file executable (Unix systems)
 */
function makeExecutable(filePath) {
  if (process.platform !== 'win32') {
    try {
      fs.chmodSync(filePath, 0o755);
      console.log(`🔧 Made executable: ${path.basename(filePath)}`);
    } catch (error) {
      console.error(`❌ Failed to make executable: ${error.message}`);
    }
  }
}

/**
 * Save checksums to file
 */
function saveChecksums(checksums) {
  try {
    fs.writeFileSync(CHECKSUMS_FILE, JSON.stringify(checksums, null, 2));
    console.log(`💾 Saved checksums to: ${CHECKSUMS_FILE}`);
  } catch (error) {
    console.error(`⚠️  Failed to save checksums: ${error.message}`);
  }
}

/**
 * Load saved checksums
 */
function loadChecksums() {
  try {
    if (fs.existsSync(CHECKSUMS_FILE)) {
      return JSON.parse(fs.readFileSync(CHECKSUMS_FILE, 'utf8'));
    }
  } catch (error) {
    console.error(`⚠️  Failed to load checksums: ${error.message}`);
  }
  return {};
}

/**
 * Download and verify a binary
 */
async function downloadBinary(name, config, platform) {
  console.log(`\n📦 Processing ${name}...`);
  
  const destination = path.join(BINARIES_DIR, config.filename);
  const checksums = loadChecksums();
  
  // Check if binary already exists
  if (fs.existsSync(destination)) {
    console.log(`✓ ${name} already exists: ${config.filename}`);
    
    // Verify existing binary if checksum is available
    if (checksums[config.filename]) {
      const isValid = await verifyChecksum(destination, checksums[config.filename]);
      if (isValid) {
        return true;
      } else {
        console.log(`⚠️  Existing binary failed verification, re-downloading...`);
        fs.unlinkSync(destination);
      }
    } else {
      return true;
    }
  }
  
  try {
    // Download the file
    let downloadPath = destination;
    if (config.extract) {
      // Use appropriate extension for archive
      const urlExt = path.extname(new URL(config.url).pathname);
      downloadPath = destination + (urlExt || '.tmp');
    }
    await downloadFile(config.url, downloadPath);
    
    // Fetch checksum if available
    let checksum = null;
    if (config.checksumUrl) {
      checksum = await fetchChecksum(config.checksumUrl, config.filename);
      if (checksum) {
        checksums[config.filename] = checksum;
      }
    }
    
    // Extract if needed
    if (config.extract) {
      await extractArchive(downloadPath, config.extractPath, config.filename);
    }
    
    // Verify checksum
    if (checksum) {
      const isValid = await verifyChecksum(destination, checksum);
      if (!isValid) {
        fs.unlinkSync(destination);
        throw new Error('Checksum verification failed');
      }
    } else {
      // Calculate and store checksum for future verification
      const calculatedChecksum = await calculateChecksum(destination);
      checksums[config.filename] = calculatedChecksum;
      console.log(`💾 Stored checksum for future verification`);
    }
    
    // Make executable on Unix systems
    makeExecutable(destination);
    
    // Save checksums
    saveChecksums(checksums);
    
    console.log(`✅ ${name} ready: ${config.filename}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to download ${name}: ${error.message}`);
    return false;
  }
}

/**
 * Main download function
 */
async function main() {
  const platform = process.platform;
  
  console.log('╔════════════════════════════════════════╗');
  console.log('║   Binary Download Script               ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`\n🖥️  Platform: ${platform}`);
  console.log(`📁 Binaries directory: ${BINARIES_DIR}\n`);
  
  // Create binaries directory if it doesn't exist
  if (!fs.existsSync(BINARIES_DIR)) {
    fs.mkdirSync(BINARIES_DIR, { recursive: true });
    console.log('✅ Created binaries directory\n');
  }
  
  const results = {
    'yt-dlp': false,
    'ffmpeg': false
  };
  
  // Download yt-dlp
  const ytdlpConfig = binaries['yt-dlp'][platform];
  if (ytdlpConfig) {
    results['yt-dlp'] = await downloadBinary('yt-dlp', ytdlpConfig, platform);
  } else {
    console.warn(`⚠️  No yt-dlp binary configuration for platform: ${platform}`);
  }
  
  // Download ffmpeg
  const ffmpegConfig = binaries['ffmpeg'][platform];
  if (ffmpegConfig) {
    results['ffmpeg'] = await downloadBinary('ffmpeg', ffmpegConfig, platform);
  } else {
    console.warn(`⚠️  No ffmpeg binary configuration for platform: ${platform}`);
  }
  
  // Summary
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   Download Summary                     ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`yt-dlp:  ${results['yt-dlp'] ? '✅ Success' : '❌ Failed'}`);
  console.log(`ffmpeg:  ${results['ffmpeg'] ? '✅ Success' : '❌ Failed'}`);
  
  const allSuccess = Object.values(results).every(r => r);
  
  if (allSuccess) {
    console.log('\n🎉 All binaries downloaded successfully!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some binaries failed to download.');
    console.log('   Please check the errors above and try again.');
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error('\n❌ Fatal error:', error.message);
  console.error(error.stack);
  process.exit(1);
});
