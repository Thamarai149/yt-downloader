import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import os from 'os';
import fs from 'fs';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * PathResolver utility for Electron environment detection and path resolution
 * Handles different paths for development vs production and bundled binaries
 * 
 * Requirements: 6.1, 6.2, 6.3
 */
class PathResolver {
    /**
     * Detect if running in Electron environment
     * Multiple detection methods for reliability
     * @returns {boolean} True if running in Electron
     */
    static isElectron() {
        // Method 1: Check for Electron-specific process properties
        if (process.versions && process.versions.electron) {
            return true;
        }
        
        // Method 2: Check for Electron environment variables
        if (process.env.ELECTRON_RUN_AS_NODE || process.env.IS_ELECTRON === 'true') {
            return true;
        }
        
        // Method 3: Check for Electron-specific global objects
        if (typeof process !== 'undefined' && process.type === 'renderer') {
            return true;
        }
        
        // Method 4: Check if running from app.asar
        if (process.mainModule && process.mainModule.filename.indexOf('app.asar') !== -1) {
            return true;
        }
        
        return false;
    }

    /**
     * Check if running in development mode
     * @returns {boolean} True if in development
     */
    static isDevelopment() {
        return process.env.NODE_ENV === 'development' || 
               process.env.ELECTRON_DEV === 'true' ||
               !this.isPackaged();
    }

    /**
     * Check if application is packaged (production build)
     * @returns {boolean} True if packaged
     */
    static isPackaged() {
        if (this.isElectron()) {
            // In Electron, check if running from app.asar
            return process.mainModule && process.mainModule.filename.indexOf('app.asar') !== -1;
        }
        return false;
    }

    /**
     * Get the application's root directory
     * @returns {string} Application root path
     */
    static getAppPath() {
        if (this.isElectron()) {
            // In Electron, use app.getAppPath() equivalent
            if (process.env.ELECTRON_APP_PATH) {
                return process.env.ELECTRON_APP_PATH;
            }
            
            if (this.isPackaged()) {
                // In production, app is in resources/app.asar
                return path.dirname(process.execPath);
            } else {
                // In development, use current working directory
                return process.cwd();
            }
        }
        return process.cwd();
    }

    /**
     * Get the application's resources path
     * In production: extraResources directory (outside app.asar)
     * In development: project root/binaries
     * @returns {string} Resources directory path
     */
    static getResourcesPath() {
        if (this.isElectron()) {
            // Check if Electron main process provided the resources path
            if (process.env.ELECTRON_RESOURCES_PATH) {
                return path.join(process.env.ELECTRON_RESOURCES_PATH, 'binaries');
            }
            
            if (this.isDevelopment()) {
                // In development, binaries are in project root
                return path.join(process.cwd(), 'binaries');
            } else {
                // In production, check for process.resourcesPath (set by Electron main process)
                if (process.resourcesPath) {
                    return process.resourcesPath;
                }
                
                // Fallback: calculate from executable location
                // Electron structure: app/resources/app.asar
                const execDir = path.dirname(process.execPath);
                return path.join(execDir, 'resources');
            }
        }
        
        // Not in Electron, use current directory
        return path.join(process.cwd(), 'binaries');
    }

    /**
     * Get user data directory path
     * Platform-specific application data directory
     * @returns {string} User data directory path
     */
    static getUserDataPath() {
        // First check if Electron main process provided the path
        if (this.isElectron() && process.env.ELECTRON_USER_DATA) {
            return process.env.ELECTRON_USER_DATA;
        }
        
        // Fallback to OS-specific app data directory
        const homeDir = os.homedir();
        const appName = 'yt-downloader';
        
        if (process.platform === 'win32') {
            // Windows: %APPDATA%\yt-downloader
            const appData = process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming');
            return path.join(appData, appName);
        } else if (process.platform === 'darwin') {
            // macOS: ~/Library/Application Support/yt-downloader
            return path.join(homeDir, 'Library', 'Application Support', appName);
        } else {
            // Linux: ~/.config/yt-downloader
            return path.join(homeDir, '.config', appName);
        }
    }

    /**
     * Get downloads directory path
     * @returns {string} Downloads directory path
     */
    static getDownloadsPath() {
        // Check if Electron main process provided a custom path
        if (this.isElectron() && process.env.ELECTRON_DOWNLOADS_PATH) {
            return process.env.ELECTRON_DOWNLOADS_PATH;
        }
        
        // Default to user's Downloads folder with app subdirectory
        const homeDir = os.homedir();
        return path.join(homeDir, 'Downloads', 'YT-Downloads');
    }

    /**
     * Get path to bundled binary (yt-dlp or ffmpeg)
     * Handles platform-specific extensions and paths
     * @param {string} binaryName - Name of binary ('yt-dlp' or 'ffmpeg')
     * @returns {string} Full path to binary
     */
    static getBinaryPath(binaryName) {
        const resourcesPath = this.getResourcesPath();
        
        // Add platform-specific extension
        const extension = process.platform === 'win32' ? '.exe' : '';
        const binaryFileName = `${binaryName}${extension}`;
        
        if (this.isElectron() && !this.isDevelopment()) {
            // In production Electron, binaries are in resources/binaries
            return path.join(resourcesPath, 'binaries', binaryFileName);
        } else {
            // In development or standalone, binaries are in binaries directory
            return path.join(resourcesPath, binaryFileName);
        }
    }

    /**
     * Get temporary directory path
     * @returns {string} Temporary directory path
     */
    static getTempPath() {
        return os.tmpdir();
    }

    /**
     * Get logs directory path
     * @returns {string} Logs directory path
     */
    static getLogsPath() {
        const userDataPath = this.getUserDataPath();
        return path.join(userDataPath, 'logs');
    }

    /**
     * Get cache directory path
     * @returns {string} Cache directory path
     */
    static getCachePath() {
        const userDataPath = this.getUserDataPath();
        return path.join(userDataPath, 'cache');
    }

    /**
     * Verify if a binary exists at the expected path
     * @param {string} binaryName - Name of binary to check
     * @returns {boolean} True if binary exists
     */
    static binaryExists(binaryName) {
        const binaryPath = this.getBinaryPath(binaryName);
        try {
            return fs.existsSync(binaryPath);
        } catch (error) {
            return false;
        }
    }

    /**
     * Ensure a directory exists, create if it doesn't
     * @param {string} dirPath - Directory path to ensure
     * @returns {boolean} True if directory exists or was created
     */
    static ensureDirectory(dirPath) {
        try {
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
            return true;
        } catch (error) {
            console.error(`Failed to create directory ${dirPath}:`, error.message);
            return false;
        }
    }

    /**
     * Get all application paths
     * @returns {Object} Object containing all application paths
     */
    static getAllPaths() {
        return {
            isElectron: this.isElectron(),
            isDevelopment: this.isDevelopment(),
            isPackaged: this.isPackaged(),
            app: this.getAppPath(),
            resources: this.getResourcesPath(),
            userData: this.getUserDataPath(),
            downloads: this.getDownloadsPath(),
            temp: this.getTempPath(),
            logs: this.getLogsPath(),
            cache: this.getCachePath(),
            ytdlp: this.getBinaryPath('yt-dlp'),
            ffmpeg: this.getBinaryPath('ffmpeg'),
            ytdlpExists: this.binaryExists('yt-dlp'),
            ffmpegExists: this.binaryExists('ffmpeg')
        };
    }

    /**
     * Initialize application directories
     * Creates necessary directories if they don't exist
     * @returns {Object} Status of directory creation
     */
    static initializeDirectories() {
        const results = {
            userData: this.ensureDirectory(this.getUserDataPath()),
            downloads: this.ensureDirectory(this.getDownloadsPath()),
            logs: this.ensureDirectory(this.getLogsPath()),
            cache: this.ensureDirectory(this.getCachePath())
        };
        
        return results;
    }

    /**
     * Log all paths for debugging
     * @param {boolean} verbose - Include additional details
     */
    static logPaths(verbose = false) {
        const paths = this.getAllPaths();
        console.log('📁 Application Paths:');
        console.log(`  Environment:`);
        console.log(`    Electron: ${paths.isElectron}`);
        console.log(`    Development: ${paths.isDevelopment}`);
        console.log(`    Packaged: ${paths.isPackaged}`);
        console.log(`    Platform: ${process.platform}`);
        console.log(`  Directories:`);
        console.log(`    App: ${paths.app}`);
        console.log(`    Resources: ${paths.resources}`);
        console.log(`    User Data: ${paths.userData}`);
        console.log(`    Downloads: ${paths.downloads}`);
        console.log(`    Logs: ${paths.logs}`);
        console.log(`    Cache: ${paths.cache}`);
        console.log(`    Temp: ${paths.temp}`);
        console.log(`  Binaries:`);
        console.log(`    yt-dlp: ${paths.ytdlp} ${paths.ytdlpExists ? '✓' : '✗'}`);
        console.log(`    ffmpeg: ${paths.ffmpeg} ${paths.ffmpegExists ? '✓' : '✗'}`);
        
        if (verbose) {
            console.log(`  Process Info:`);
            console.log(`    CWD: ${process.cwd()}`);
            console.log(`    Exec Path: ${process.execPath}`);
            console.log(`    Node Version: ${process.version}`);
            if (process.versions.electron) {
                console.log(`    Electron Version: ${process.versions.electron}`);
            }
        }
    }
}

export default PathResolver;
