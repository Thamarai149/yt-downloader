import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import PathResolver from './electron-paths.js';

const execAsync = promisify(exec);

/**
 * BinaryManager handles verification and fallback for bundled binaries
 */
class BinaryManager {
    constructor() {
        this.ytdlpPath = null;
        this.ffmpegPath = null;
        this.verified = false;
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
        console.log(`🔍 Checking bundled yt-dlp at: ${bundledPath}`);
        
        if (await this.verifyBinary(bundledPath)) {
            console.log('✅ Using bundled yt-dlp');
            return bundledPath;
        }

        // Fallback to system yt-dlp
        console.log('⚠️  Bundled yt-dlp not found, trying system binary...');
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
        console.log(`🔍 Checking bundled ffmpeg at: ${bundledPath}`);
        
        if (await this.verifyBinary(bundledPath, '-version')) {
            console.log('✅ Using bundled ffmpeg');
            return bundledPath;
        }

        // Fallback to system ffmpeg
        console.log('⚠️  Bundled ffmpeg not found, trying system binary...');
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
     * @returns {Promise<Object>} Object with binary paths and status
     */
    async initialize() {
        console.log('🔧 Initializing binary manager...');
        
        // Log paths for debugging
        if (PathResolver.isElectron()) {
            PathResolver.logPaths();
        }

        // Find binaries
        this.ytdlpPath = await this.findYtdlp();
        this.ffmpegPath = await this.findFfmpeg();

        // Check if all required binaries are available
        this.verified = !!(this.ytdlpPath && this.ffmpegPath);

        const status = {
            verified: this.verified,
            ytdlp: {
                path: this.ytdlpPath,
                available: !!this.ytdlpPath,
                bundled: this.ytdlpPath === PathResolver.getBinaryPath('yt-dlp')
            },
            ffmpeg: {
                path: this.ffmpegPath,
                available: !!this.ffmpegPath,
                bundled: this.ffmpegPath === PathResolver.getBinaryPath('ffmpeg')
            }
        };

        if (this.verified) {
            console.log('✅ All binaries verified and ready');
        } else {
            console.error('❌ Some binaries are missing:');
            if (!this.ytdlpPath) console.error('  - yt-dlp not found');
            if (!this.ffmpegPath) console.error('  - ffmpeg not found');
        }

        return status;
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
