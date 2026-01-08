import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class UpdateService {
  constructor() {
    this.currentVersion = this.getCurrentVersion();
    this.updateCheckUrl = 'https://api.github.com/repos/ytstreamer/ytstreamer-pro/releases/latest'; // Replace with your repo
    this.lastUpdateCheck = null;
    this.updateInfo = null;
  }

  getCurrentVersion() {
    try {
      // Read version from backend package.json
      const packagePath = path.join(__dirname, '../../package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      return packageJson.version;
    } catch (error) {
      console.error('Error reading current version:', error);
      return '1.0.0';
    }
  }

  async checkForUpdates(force = false) {
    try {
      // Don't check more than once per hour unless forced
      if (!force && this.lastUpdateCheck && 
          Date.now() - this.lastUpdateCheck < 3600000) {
        return this.updateInfo;
      }

      console.log('Checking for updates...');
      
      // For demo purposes, simulate update check
      // In production, you would fetch from GitHub releases or your update server
      const updateInfo = await this.fetchUpdateInfo();
      
      this.lastUpdateCheck = Date.now();
      this.updateInfo = updateInfo;
      
      return updateInfo;
    } catch (error) {
      console.error('Error checking for updates:', error);
      return {
        hasUpdate: false,
        error: error.message,
        currentVersion: this.currentVersion
      };
    }
  }

  async fetchUpdateInfo() {
    // Simulate fetching from GitHub releases or update server
    // In a real implementation, you would make an HTTP request
    
    // For demo, simulate different scenarios
    const scenarios = [
      {
        hasUpdate: true,
        latestVersion: '3.1.0',
        releaseDate: new Date().toISOString(),
        releaseNotes: [
          '🎉 Added playlist downloader functionality',
          '🔧 Fixed memory leaks in download service',
          '⚡ Improved download speed by 25%',
          '🎨 Updated UI with better progress indicators',
          '🛡️ Enhanced security and error handling'
        ],
        downloadUrl: 'https://github.com/ytstreamer/ytstreamer-pro/releases/latest',
        isSecurityUpdate: false,
        size: '45.2 MB'
      },
      {
        hasUpdate: true,
        latestVersion: '3.0.1',
        releaseDate: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        releaseNotes: [
          '🛡️ Critical security update',
          '🐛 Fixed playlist download issues',
          '⚡ Performance improvements'
        ],
        downloadUrl: 'https://github.com/ytstreamer/ytstreamer-pro/releases/latest',
        isSecurityUpdate: true,
        size: '44.8 MB'
      },
      {
        hasUpdate: false,
        currentVersion: this.currentVersion,
        message: 'You are running the latest version!'
      }
    ];

    // Randomly select a scenario for demo (in production, this would be real data)
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    
    // Add current version info
    scenario.currentVersion = this.currentVersion;
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return scenario;
  }

  compareVersions(version1, version2) {
    const v1parts = version1.split('.').map(Number);
    const v2parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
      const v1part = v1parts[i] || 0;
      const v2part = v2parts[i] || 0;
      
      if (v1part < v2part) return -1;
      if (v1part > v2part) return 1;
    }
    
    return 0;
  }

  getUpdateSummary() {
    if (!this.updateInfo) {
      return null;
    }

    return {
      hasUpdate: this.updateInfo.hasUpdate,
      currentVersion: this.currentVersion,
      latestVersion: this.updateInfo.latestVersion,
      isSecurityUpdate: this.updateInfo.isSecurityUpdate,
      lastChecked: this.lastUpdateCheck ? new Date(this.lastUpdateCheck).toISOString() : null
    };
  }

  // Get detailed changelog for a version
  getChangelogForVersion(version) {
    // In production, this would fetch from your changelog API or files
    const changelogs = {
      '3.1.0': {
        version: '3.1.0',
        releaseDate: '2024-01-08',
        features: [
          'Added comprehensive playlist downloader',
          'Real-time progress tracking for playlists',
          'Enhanced Telegram bot with playlist support',
          'Improved error handling and recovery'
        ],
        bugFixes: [
          'Fixed memory leaks in download service',
          'Resolved Socket.IO connection issues',
          'Fixed file path handling on Windows'
        ],
        improvements: [
          'Increased download speed by 25%',
          'Better progress indicators',
          'Enhanced UI responsiveness',
          'Optimized resource usage'
        ]
      },
      '3.0.1': {
        version: '3.0.1',
        releaseDate: '2024-01-07',
        features: [],
        bugFixes: [
          'Critical security vulnerability patched',
          'Fixed playlist URL validation',
          'Resolved download cancellation issues'
        ],
        improvements: [
          'Performance optimizations',
          'Better error messages',
          'Improved logging'
        ]
      }
    };

    return changelogs[version] || null;
  }
}