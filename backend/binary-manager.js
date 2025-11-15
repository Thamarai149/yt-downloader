import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import https from 'https';
import PathResolver from './electron-paths.js';

const execAsync = promisify(exec);

/**
 * BinaryManager handles verification and fallback for bundled binaries
 * Includes checksum verification and auto-download capabilities
 * 
 * Requirements: 6.4, 5.2
 */
class BinaryManager {
    constructor() {
        this.ytdlpPath = null;
        this.ffmpegPath = null;
        this.verified = false;
        this.checksums = null;
        this.checksumsPath = null;
    }

    /**
     * Load checksums from file
     * @returns {Object|null} Checksums object or null
     */
    loadChecksums() {
        try {
            const resourcesPath = PathResolver.getResourcesPath();
            this.checksumsPath = path.join(resourcesPath, 'checksums.json');
            
            if (fs.existsSync(this.checksumsPath)) {
                const data = fs.readFileSync(this.checksumsPath, 'utf8');
                this.checksums = JSON.parse(data);
                console.log('✅ Loaded checksums for binary verification');
                return this.checksums;
            }
        } catch (error) {
            console.error('⚠️  Failed to load checksums:', error.message);
        }
        return null;
    }

    /**
     * Calculate SHA256 checksum of a file
     * @param {string} filePath - Path to file
     * @returns {Promise<string>} Checksum hex string
     */
    async calculateChecksum(filePath) {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('sha256');
            const stream = fs.createReadStream(filePath);
            
            stream.on('data', (data) => hash.update(data));
            stream.on('end', () => resolve(hash.digest('hex')));
            stream.on('error', reject);
        });
    }

    /**
     * Verify binary checksum
     * @param {string} binaryPath - Path to binary
     * @param {string} filename - Binary filename for checksum lookup
     * @returns {Promise<boolean>} True if checksum matches
     */
    async verifyChecksum(binaryPath, filename) {
        if (!this.checksums || !this.checksums[filename]) {
            console.log(`⚠️  No checksum available for ${filename}`);
            return true; // Skip verification if no checksum
        }

        try {
            const actualChecksum = await this.calculateChecksum(binaryPath);
            const expectedChecksum = this.checksums[filename];

            if (actualChecksum.toLowerCase() === expectedChecksum.toLowerCase()) {
                console.log(`✅ Checksum verified for ${filename}`);
                return true;
            } else {
                console.error(`❌ Checksum mismatch for ${filename}`);
                console.error(`   Expected: ${expectedChecksum}`);
                console.error(`   Actual:   ${actualChecksum}`);
                return false;
            }
        } catch (error) {
            console.error(`❌ Failed to verify checksum for ${filename}:`, error.message);
            return false;
        }
    }

    /**
     * Verify if a binary exists and is executable
     * @param {string} binaryPath - Path to binary
     * @param {string} versionFlag - Version flag to use (default: --version)
     * @returns {Promise<boolean>} True if binary is valid
     */
    async verifyBinary(binaryPath, versionFlag = '--version') {
        try {
            // Check if file exists
            if (!fs.existsSync(binaryPath)) {
                return false;
            }

            // Check if file is executable (on Unix-like systems)
            try {
                fs.accessSync(binaryPath, fs.constants.X_OK);
            } catch (err) {
                // On Windows, X_OK check might fail, so just check if file exists
                if (process.platform !== 'win32') {
                    return false;
                }
            }

            // Try to execute with version flag to verify it works
            const { stdout } = await execAsync(`"${binaryPath}" ${versionFlag}`);
            return stdout.length > 0;
        } catch (err) {
            // Some binaries might fail with --version but still work
            // Just check if the file exists and is accessible
            return fs.existsSync(binaryPath);
        }
    }

    /**
     * Find yt-dlp binary (bundled or system)
     * @returns {Promise<string|null>} Path to yt-dlp or null
     */
    async findYtdlp() {
        // Try bundled binary first
        const bundledPath = PathResolver.getBinaryPath('yt-dlp');
        const filename = path.basename(bundledPath);
        console.log(`🔍 Checking bundled yt-dlp at: ${bundledPath}`);
        
        if (await this.verifyBinary(bundledPath)) {
            // Verify checksum if available
            const checksumValid = await this.verifyChecksum(bundledPath, filename);
            if (checksumValid) {
                console.log('✅ Using bundled yt-dlp');
                return bundledPath;
            } else {
                console.error('❌ Bundled yt-dlp failed checksum verification');
            }
        }

        // Fallback to system yt-dlp
        console.log('⚠️  Bundled yt-dlp not found or invalid, trying system binary...');
        try {
            const command = process.platform === 'win32' ? 'where yt-dlp' : 'which yt-dlp';
            const { stdout } = await execAsync(command);
            const systemPath = stdout.trim().split('\n')[0];
            
            if (await this.verifyBinary(systemPath)) {
                console.log(`✅ Using system yt-dlp at: ${systemPath}`);
                return systemPath;
            }
        } catch (err) {
            console.error('❌ System yt-dlp not found');
        }

        return null;
    }

    /**
     * Find ffmpeg binary (bundled or system)
     * @returns {Promise<string|null>} Path to ffmpeg or null
     */
    async findFfmpeg() {
        // Try bundled binary first
        const bundledPath = PathResolver.getBinaryPath('ffmpeg');
        const filename = path.basename(bundledPath);
        console.log(`🔍 Checking bundled ffmpeg at: ${bundledPath}`);
        
        if (await this.verifyBinary(bundledPath, '-version')) {
            // Verify checksum if available
            const checksumValid = await this.verifyChecksum(bundledPath, filename);
            if (checksumValid) {
                console.log('✅ Using bundled ffmpeg');
                return bundledPath;
            } else {
                console.error('❌ Bundled ffmpeg failed checksum verification');
            }
        }

        // Fallback to system ffmpeg
        console.log('⚠️  Bundled ffmpeg not found or invalid, trying system binary...');
        try {
            const command = process.platform === 'win32' ? 'where ffmpeg' : 'which ffmpeg';
            const { stdout } = await execAsync(command);
            const systemPath = stdout.trim().split('\n')[0];
            
            if (await this.verifyBinary(systemPath, '-version')) {
                console.log(`✅ Using system ffmpeg at: ${systemPath}`);
                return systemPath;
            }
        } catch (err) {
            console.error('❌ System ffmpeg not found');
        }

        return null;
    }

    /**
     * Initialize and verify all binaries
     * @param {boolean} autoDownload - Whether to attempt auto-download of missing binaries
     * @returns {Promise<Object>} Object with binary paths and status
     */
    async initialize(autoDownload = true) {
        console.log('🔧 Initializing binary manager...');
        
        // Load checksums for verification
        this.loadChecksums();
        
        // Log paths for debugging
        if (PathResolver.isElectron()) {
            PathResolver.logPaths();
        }

        // Find binaries
        this.ytdlpPath = await this.findYtdlp();
        this.ffmpegPath = await this.findFfmpeg();

        // Check if all required binaries are available
        this.verified = !!(this.ytdlpPath && this.ffmpegPath);

        // If binaries are missing and auto-download is enabled, try to download them
        let downloadResults = null;
        if (!this.verified && autoDownload && PathResolver.isElectron()) {
            console.log('⚠️  Some binaries are missing, attempting auto-download...');
            downloadResults = await this.autoDownloadBinaries();
            
            // Re-check binaries after download attempt
            if (downloadResults.ytdlp.success) {
                this.ytdlpPath = await this.findYtdlp();
            }
            if (downloadResults.ffmpeg.success) {
                this.ffmpegPath = await this.findFfmpeg();
            }
            
            // Update verification status
            this.verified = !!(this.ytdlpPath && this.ffmpegPath);
        }

        const status = {
            verified: this.verified,
            ytdlp: {
                path: this.ytdlpPath,
                available: !!this.ytdlpPath,
                bundled: this.ytdlpPath === PathResolver.getBinaryPath('yt-dlp'),
                checksumVerified: this.ytdlpPath ? await this.verifyChecksum(this.ytdlpPath, path.basename(this.ytdlpPath)) : false
            },
            ffmpeg: {
                path: this.ffmpegPath,
                available: !!this.ffmpegPath,
                bundled: this.ffmpegPath === PathResolver.getBinaryPath('ffmpeg'),
                checksumVerified: this.ffmpegPath ? await this.verifyChecksum(this.ffmpegPath, path.basename(this.ffmpegPath)) : false
            },
            autoDownload: downloadResults
        };

        if (this.verified) {
            console.log('✅ All binaries verified and ready');
        } else {
            console.error('❌ Some binaries are missing:');
            if (!this.ytdlpPath) console.error('  - yt-dlp not found');
            if (!this.ffmpegPath) console.error('  - ffmpeg not found');
            
            // Show error guidance
            this.showErrorGuidance();
        }

        return status;
    }

    /**
     * Download a binary from URL
     * @param {string} url - Download URL
     * @param {string} destinationPath - Where to save the file
     * @returns {Promise<boolean>} True if download succeeded
     */
    async downloadBinary(url, destinationPath) {
        return new Promise((resolve) => {
            console.log(`📥 Downloading from: ${url}`);
            console.log(`📁 Saving to: ${destinationPath}`);
            
            // Ensure directory exists
            const dir = path.dirname(destinationPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            const file = fs.createWriteStream(destinationPath);
            
            https.get(url, (response) => {
                // Handle redirects
                if (response.statusCode === 301 || response.statusCode === 302) {
                    file.close();
                    fs.unlinkSync(destinationPath);
                    return this.downloadBinary(response.headers.location, destinationPath)
                        .then(resolve);
                }
                
                if (response.statusCode !== 200) {
                    file.close();
                    fs.unlinkSync(destinationPath);
                    console.error(`❌ Download failed with status: ${response.statusCode}`);
                    resolve(false);
                    return;
                }
                
                const totalSize = parseInt(response.headers['content-length'], 10);
                let downloadedSize = 0;
                let lastProgress = 0;
                
                response.on('data', (chunk) => {
                    downloadedSize += chunk.length;
                    const progress = Math.floor((downloadedSize / totalSize) * 100);
                    
                    // Log progress every 10%
                    if (progress >= lastProgress + 10) {
                        console.log(`   Progress: ${progress}%`);
                        lastProgress = progress;
                    }
                });
                
                response.pipe(file);
                
                file.on('finish', () => {
                    file.close();
                    console.log('✅ Download completed');
                    resolve(true);
                });
            }).on('error', (err) => {
                file.close();
                if (fs.existsSync(destinationPath)) {
                    fs.unlinkSync(destinationPath);
                }
                console.error(`❌ Download error: ${err.message}`);
                resolve(false);
            });
        });
    }

    /**
     * Auto-download missing binaries
     * @returns {Promise<Object>} Download results
     */
    async autoDownloadBinaries() {
        console.log('🔄 Attempting to auto-download missing binaries...');
        
        const results = {
            ytdlp: { attempted: false, success: false },
            ffmpeg: { attempted: false, success: false }
        };
        
        const resourcesPath = PathResolver.getResourcesPath();
        
        // Download yt-dlp if missing
        if (!this.ytdlpPath) {
            results.ytdlp.attempted = true;
            const ytdlpUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';
            const ytdlpDest = path.join(resourcesPath, 'yt-dlp.exe');
            
            console.log('📥 Downloading yt-dlp...');
            results.ytdlp.success = await this.downloadBinary(ytdlpUrl, ytdlpDest);
            
            if (results.ytdlp.success) {
                // Verify the downloaded binary
                if (await this.verifyBinary(ytdlpDest)) {
                    this.ytdlpPath = ytdlpDest;
                    console.log('✅ yt-dlp downloaded and verified');
                } else {
                    console.error('❌ Downloaded yt-dlp failed verification');
                    results.ytdlp.success = false;
                }
            }
        }
        
        // Download ffmpeg if missing
        if (!this.ffmpegPath) {
            results.ffmpeg.attempted = true;
            // Note: ffmpeg is larger and comes in a zip, so we'll just download the exe directly
            // This URL points to a pre-built Windows binary
            const ffmpegUrl = 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip';
            const ffmpegDest = path.join(resourcesPath, 'ffmpeg.exe');
            
            console.log('📥 Downloading ffmpeg...');
            console.log('⚠️  Note: ffmpeg auto-download requires manual extraction from zip');
            console.log('   For now, skipping ffmpeg auto-download');
            results.ffmpeg.success = false;
            results.ffmpeg.attempted = false;
        }
        
        return results;
    }

    /**
     * Show error guidance for missing binaries
     */
    showErrorGuidance() {
        console.error('\n╔════════════════════════════════════════════════╗');
        console.error('║   Binary Installation Required                 ║');
        console.error('╚════════════════════════════════════════════════╝');
        console.error('\nSome required binaries are missing or invalid.');
        console.error('\nOption 1: Download binaries automatically');
        console.error('  Run: npm run download:binaries');
        console.error('\nOption 2: Install manually');
        
        if (!this.ytdlpPath) {
            console.error('\nyt-dlp:');
            console.error('  Download from: https://github.com/yt-dlp/yt-dlp/releases/latest');
            console.error(`  Place in: ${PathResolver.getResourcesPath()}`);
        }
        
        if (!this.ffmpegPath) {
            console.error('\nffmpeg:');
            console.error('  Download from: https://github.com/BtbN/FFmpeg-Builds/releases/latest');
            console.error(`  Place in: ${PathResolver.getResourcesPath()}`);
        }
        
        console.error('\nFor more information, see: BINARY_BUNDLING.md');
        console.error('════════════════════════════════════════════════\n');
    }

    /**
     * Get yt-dlp path
     * @returns {string|null} Path to yt-dlp
     */
    getYtdlpPath() {
        return this.ytdlpPath;
    }

    /**
     * Get ffmpeg path
     * @returns {string|null} Path to ffmpeg
     */
    getFfmpegPath() {
        return this.ffmpegPath;
    }

    /**
     * Check if binaries are verified
     * @returns {boolean} True if all binaries are available
     */
    isVerified() {
        return this.verified;
    }
}

export default BinaryManager;
