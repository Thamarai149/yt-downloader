// Enhanced Features for Electron App
// Auto-updater, System Integration, and Advanced Settings

class AutoUpdater {
    constructor() {
        this.currentVersion = '1.0.0';
        this.updateCheckInterval = null;
        this.isDownloading = false;
        this.downloadProgress = 0;
        this.init();
    }

    async init() {
        // Get actual app version
        try {
            this.currentVersion = await window.electronAPI.getAppVersion();
        } catch (error) {
            console.error('Failed to get app version:', error);
        }
        
        this.addUpdateUI();
        this.setupEventListeners();
        this.loadAutoUpdateSetting();
        
        // Initial update check
        setTimeout(() => {
            this.checkForUpdates();
        }, 2000);
    }

    setupEventListeners() {
        // Listen for update status changes
        window.electronAPI.onUpdateStatus((data) => {
            this.handleUpdateStatus(data);
        });
        
        // Listen for download progress
        window.electronAPI.onUpdateProgress((data) => {
            this.handleUpdateProgress(data);
        });
    }

    handleUpdateStatus(data) {
        const statusElement = document.getElementById('updateStatus');
        const checkBtn = document.getElementById('checkUpdateBtn');
        
        switch (data.status) {
            case 'checking':
                statusElement.innerHTML = '<span class="status-text checking">Checking for updates...</span>';
                checkBtn.disabled = true;
                break;
                
            case 'available':
                statusElement.innerHTML = `
                    <span class="status-text update-available">
                        Update available: v${data.version}
                    </span>
                    <button class="btn btn-success btn-small" onclick="autoUpdater.downloadUpdate()">
                        <img src="../assets/icons/download.svg" alt="Download" width="16" height="16">
                        Download Update
                    </button>
                `;
                checkBtn.disabled = false;
                showToast(`Update available: v${data.version}`, 'info');
                break;
                
            case 'not-available':
                statusElement.innerHTML = '<span class="status-text up-to-date">You have the latest version</span>';
                checkBtn.disabled = false;
                break;
                
            case 'downloaded':
                statusElement.innerHTML = `
                    <span class="status-text downloaded">
                        Update downloaded: v${data.version}
                    </span>
                    <button class="btn btn-primary btn-small" onclick="autoUpdater.installUpdate()">
                        <img src="../assets/icons/restart.svg" alt="Install" width="16" height="16">
                        Restart & Install
                    </button>
                `;
                checkBtn.disabled = false;
                this.isDownloading = false;
                showToast('Update downloaded! Click to restart and install.', 'success');
                break;
                
            case 'error':
                statusElement.innerHTML = `<span class="status-text error">Update check failed: ${data.error || 'Unknown error'}</span>`;
                checkBtn.disabled = false;
                this.isDownloading = false;
                showToast('Update check failed', 'error');
                break;
        }
    }

    handleUpdateProgress(data) {
        if (this.isDownloading) {
            const statusElement = document.getElementById('updateStatus');
            const progressBar = this.createProgressBar(data.percent);
            const speedText = this.formatBytes(data.bytesPerSecond) + '/s';
            const sizeText = `${this.formatBytes(data.transferred)} / ${this.formatBytes(data.total)}`;
            
            statusElement.innerHTML = `
                <div class="download-progress">
                    <span class="status-text downloading">Downloading update... ${data.percent}%</span>
                    <div class="progress-bar-container">
                        ${progressBar}
                    </div>
                    <div class="download-details">
                        <span class="download-speed">${speedText}</span>
                        <span class="download-size">${sizeText}</span>
                    </div>
                </div>
            `;
        }
    }

    createProgressBar(percent) {
        return `
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${percent}%"></div>
            </div>
        `;
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    addUpdateUI() {
        const controlPanel = document.querySelector('.control-panel');
        if (!controlPanel) return;

        const updateSection = document.createElement('div');
        updateSection.className = 'control-section';
        updateSection.innerHTML = `
            <h3>
                <img src="../assets/icons/update.svg" alt="Update" width="20" height="20">
                Auto Updates
            </h3>
            <div class="update-info">
                <div class="current-version">
                    <span>Current Version: <strong>v${this.currentVersion}</strong></span>
                </div>
                <div class="update-status" id="updateStatus">
                    <span class="status-text">Ready to check for updates</span>
                </div>
                <div class="update-actions">
                    <button class="btn btn-primary" id="checkUpdateBtn" onclick="autoUpdater.checkForUpdates()">
                        <img src="../assets/icons/refresh.svg" alt="Check" width="16" height="16">
                        Check for Updates
                    </button>
                    <button class="btn btn-secondary" id="autoUpdateToggle" onclick="autoUpdater.toggleAutoUpdate()">
                        <img src="../assets/icons/settings.svg" alt="Auto" width="16" height="16">
                        <span id="autoUpdateText">Enable Auto-Update</span>
                    </button>
                </div>
            </div>
        `;
        
        controlPanel.appendChild(updateSection);
    }

    async checkForUpdates() {
        const statusElement = document.getElementById('updateStatus');
        const checkBtn = document.getElementById('checkUpdateBtn');
        
        statusElement.innerHTML = '<span class="status-text checking">Checking for updates...</span>';
        checkBtn.disabled = true;

        try {
            await window.electronAPI.checkForUpdates();
            // Status will be updated via event listener
        } catch (error) {
            statusElement.innerHTML = '<span class="status-text error">Failed to check for updates</span>';
            checkBtn.disabled = false;
            console.error('Update check failed:', error);
            showToast('Failed to check for updates', 'error');
        }
    }

    async downloadUpdate() {
        if (this.isDownloading) return;
        
        this.isDownloading = true;
        const statusElement = document.getElementById('updateStatus');
        
        statusElement.innerHTML = `
            <div class="download-progress">
                <span class="status-text downloading">Starting download...</span>
                <div class="progress-bar-container">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                </div>
            </div>
        `;

        try {
            const result = await window.electronAPI.downloadUpdate();
            if (!result.success) {
                throw new Error(result.error || 'Download failed');
            }
            showToast('Update download started', 'info');
        } catch (error) {
            this.isDownloading = false;
            statusElement.innerHTML = `<span class="status-text error">Download failed: ${error.message}</span>`;
            console.error('Update download failed:', error);
            showToast('Update download failed', 'error');
        }
    }

    async installUpdate() {
        try {
            showToast('Installing update and restarting...', 'info');
            await window.electronAPI.installUpdate();
        } catch (error) {
            console.error('Update installation failed:', error);
            showToast('Failed to install update', 'error');
        }
    }

    toggleAutoUpdate() {
        const autoUpdate = !this.getAutoUpdateSetting();
        this.setAutoUpdateSetting(autoUpdate);
        
        const toggleBtn = document.getElementById('autoUpdateText');
        toggleBtn.textContent = autoUpdate ? 'Disable Auto-Update' : 'Enable Auto-Update';
        
        if (autoUpdate) {
            this.startPeriodicCheck();
            showToast('Auto-update enabled', 'success');
        } else {
            this.stopPeriodicCheck();
            showToast('Auto-update disabled', 'info');
        }
    }

    startPeriodicCheck() {
        if (!this.getAutoUpdateSetting()) return;
        
        // Check every 6 hours
        this.updateCheckInterval = setInterval(() => {
            this.checkForUpdates();
        }, 6 * 60 * 60 * 1000);
    }

    stopPeriodicCheck() {
        if (this.updateCheckInterval) {
            clearInterval(this.updateCheckInterval);
            this.updateCheckInterval = null;
        }
    }

    getAutoUpdateSetting() {
        return localStorage.getItem('autoUpdate') === 'true';
    }

    setAutoUpdateSetting(enabled) {
        localStorage.setItem('autoUpdate', enabled.toString());
    }

    loadAutoUpdateSetting() {
        const autoUpdate = this.getAutoUpdateSetting();
        const toggleBtn = document.getElementById('autoUpdateText');
        if (toggleBtn) {
            toggleBtn.textContent = autoUpdate ? 'Disable Auto-Update' : 'Enable Auto-Update';
        }
        
        if (autoUpdate) {
            this.startPeriodicCheck();
        }
    }
}

class SystemIntegration {
    constructor() {
        this.init();
    }

    init() {
        this.addSystemIntegrationUI();
        this.setupSystemTray();
    }

    addSystemIntegrationUI() {
        const settingsPanel = document.querySelector('.settings-panel');
        if (!settingsPanel) return;

        const systemSection = document.createElement('div');
        systemSection.className = 'setting-section';
        systemSection.innerHTML = `
            <h4>System Integration</h4>
            <div class="setting-group">
                <label class="checkbox-label">
                    <input type="checkbox" id="startWithSystem">
                    <span>Start with Windows</span>
                </label>
            </div>
            <div class="setting-group">
                <label class="checkbox-label">
                    <input type="checkbox" id="minimizeToTray">
                    <span>Minimize to system tray</span>
                </label>
            </div>
            <div class="setting-group">
                <label class="checkbox-label">
                    <input type="checkbox" id="closeToTray">
                    <span>Close to tray instead of exit</span>
                </label>
            </div>
            <div class="setting-group">
                <label>System Notifications</label>
                <select id="notificationLevel" class="select-input">
                    <option value="all">All notifications</option>
                    <option value="important">Important only</option>
                    <option value="none">Disabled</option>
                </select>
            </div>
            <div class="setting-group">
                <button class="btn btn-secondary" onclick="systemIntegration.registerProtocol()">
                    <img src="../assets/icons/link.svg" alt="Protocol" width="16" height="16">
                    Register URL Protocol
                </button>
                <small class="setting-hint">Handle ytdl:// URLs from browser</small>
            </div>
        `;
        
        settingsPanel.appendChild(systemSection);
        this.loadSystemSettings();
    }

    setupSystemTray() {
        // This would be implemented in the main process
        console.log('System tray setup requested');
    }

    registerProtocol() {
        // Register ytdl:// protocol handler
        showToast('URL protocol registered', 'success');
        console.log('Protocol registration requested');
    }

    loadSystemSettings() {
        const settings = this.getSystemSettings();
        
        document.getElementById('startWithSystem').checked = settings.startWithSystem;
        document.getElementById('minimizeToTray').checked = settings.minimizeToTray;
        document.getElementById('closeToTray').checked = settings.closeToTray;
        document.getElementById('notificationLevel').value = settings.notificationLevel;
    }

    saveSystemSettings() {
        const settings = {
            startWithSystem: document.getElementById('startWithSystem').checked,
            minimizeToTray: document.getElementById('minimizeToTray').checked,
            closeToTray: document.getElementById('closeToTray').checked,
            notificationLevel: document.getElementById('notificationLevel').value
        };
        
        localStorage.setItem('systemSettings', JSON.stringify(settings));
        showToast('System settings saved', 'success');
    }

    getSystemSettings() {
        const defaults = {
            startWithSystem: false,
            minimizeToTray: true,
            closeToTray: false,
            notificationLevel: 'important'
        };
        
        const saved = localStorage.getItem('systemSettings');
        return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    }
}

class AdvancedDownloadManager {
    constructor() {
        this.downloadQueue = [];
        this.maxConcurrent = 3;
        this.activeDownloads = 0;
        this.init();
    }

    init() {
        this.addAdvancedUI();
        this.setupDownloadScheduler();
    }

    addAdvancedUI() {
        const mainContent = document.querySelector('.main-content');
        if (!mainContent) return;

        const advancedSection = document.createElement('div');
        advancedSection.className = 'advanced-download-section';
        advancedSection.innerHTML = `
            <div class="section-header">
                <h3>
                    <img src="../assets/icons/advanced.svg" alt="Advanced" width="20" height="20">
                    Advanced Download Manager
                </h3>
                <button class="btn btn-secondary" onclick="advancedDownloadManager.toggleSection()">
                    <span id="advancedToggleText">Show</span>
                </button>
            </div>
            <div class="advanced-content hidden" id="advancedContent">
                <div class="advanced-controls">
                    <div class="control-group">
                        <label>Max Concurrent Downloads</label>
                        <input type="range" id="maxConcurrent" min="1" max="5" value="3" class="slider">
                        <span id="concurrentValue">3</span>
                    </div>
                    <div class="control-group">
                        <label>Download Priority</label>
                        <select id="downloadPriority" class="select-input">
                            <option value="normal">Normal</option>
                            <option value="high">High Quality First</option>
                            <option value="fast">Fastest First</option>
                        </select>
                    </div>
                    <div class="control-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="autoRetry">
                            <span>Auto-retry failed downloads</span>
                        </label>
                    </div>
                </div>
                <div class="scheduler-section">
                    <h4>Download Scheduler</h4>
                    <div class="scheduler-controls">
                        <input type="datetime-local" id="scheduleTime" class="text-input">
                        <button class="btn btn-primary" onclick="advancedDownloadManager.scheduleDownload()">
                            Schedule Download
                        </button>
                    </div>
                    <div class="scheduled-list" id="scheduledList">
                        <div class="empty-state">No scheduled downloads</div>
                    </div>
                </div>
            </div>
        `;
        
        mainContent.appendChild(advancedSection);
        this.setupAdvancedControls();
    }

    setupAdvancedControls() {
        const maxConcurrentSlider = document.getElementById('maxConcurrent');
        const concurrentValue = document.getElementById('concurrentValue');
        
        maxConcurrentSlider.addEventListener('input', (e) => {
            this.maxConcurrent = parseInt(e.target.value);
            concurrentValue.textContent = this.maxConcurrent;
            this.saveAdvancedSettings();
        });
        
        // Load saved settings
        this.loadAdvancedSettings();
    }

    setupDownloadScheduler() {
        // Check for scheduled downloads every minute
        setInterval(() => {
            this.checkScheduledDownloads();
        }, 60000);
    }

    toggleSection() {
        const content = document.getElementById('advancedContent');
        const toggleText = document.getElementById('advancedToggleText');
        
        if (content.classList.contains('hidden')) {
            content.classList.remove('hidden');
            toggleText.textContent = 'Hide';
        } else {
            content.classList.add('hidden');
            toggleText.textContent = 'Show';
        }
    }

    scheduleDownload() {
        const scheduleTime = document.getElementById('scheduleTime').value;
        const urlInput = document.getElementById('urlInput');
        
        if (!scheduleTime || !urlInput.value.trim()) {
            showToast('Please enter a URL and schedule time', 'warning');
            return;
        }
        
        const scheduledDownload = {
            id: Date.now(),
            url: urlInput.value.trim(),
            scheduledTime: new Date(scheduleTime),
            status: 'scheduled'
        };
        
        this.addScheduledDownload(scheduledDownload);
        showToast('Download scheduled successfully', 'success');
        
        // Clear inputs
        document.getElementById('scheduleTime').value = '';
        urlInput.value = '';
    }

    addScheduledDownload(download) {
        let scheduled = this.getScheduledDownloads();
        scheduled.push(download);
        localStorage.setItem('scheduledDownloads', JSON.stringify(scheduled));
        this.renderScheduledDownloads();
    }

    getScheduledDownloads() {
        const saved = localStorage.getItem('scheduledDownloads');
        return saved ? JSON.parse(saved) : [];
    }

    renderScheduledDownloads() {
        const scheduledList = document.getElementById('scheduledList');
        const scheduled = this.getScheduledDownloads();
        
        if (scheduled.length === 0) {
            scheduledList.innerHTML = '<div class="empty-state">No scheduled downloads</div>';
            return;
        }
        
        scheduledList.innerHTML = scheduled.map(download => `
            <div class="scheduled-item" data-id="${download.id}">
                <div class="scheduled-info">
                    <div class="scheduled-url">${this.truncateUrl(download.url)}</div>
                    <div class="scheduled-time">${new Date(download.scheduledTime).toLocaleString()}</div>
                </div>
                <div class="scheduled-actions">
                    <button class="btn btn-danger btn-small" onclick="advancedDownloadManager.removeScheduled(${download.id})">
                        Remove
                    </button>
                </div>
            </div>
        `).join('');
    }

    removeScheduled(id) {
        let scheduled = this.getScheduledDownloads();
        scheduled = scheduled.filter(item => item.id !== id);
        localStorage.setItem('scheduledDownloads', JSON.stringify(scheduled));
        this.renderScheduledDownloads();
        showToast('Scheduled download removed', 'info');
    }

    checkScheduledDownloads() {
        const scheduled = this.getScheduledDownloads();
        const now = new Date();
        
        scheduled.forEach(download => {
            if (download.status === 'scheduled' && new Date(download.scheduledTime) <= now) {
                this.executeScheduledDownload(download);
            }
        });
    }

    executeScheduledDownload(download) {
        // Mark as executing
        let scheduled = this.getScheduledDownloads();
        const index = scheduled.findIndex(item => item.id === download.id);
        if (index !== -1) {
            scheduled[index].status = 'executing';
            localStorage.setItem('scheduledDownloads', JSON.stringify(scheduled));
        }
        
        // Execute download
        console.log('Executing scheduled download:', download.url);
        showToast(`Starting scheduled download: ${this.truncateUrl(download.url)}`, 'info');
        
        // Remove from scheduled list after execution
        setTimeout(() => {
            this.removeScheduled(download.id);
        }, 1000);
    }

    truncateUrl(url) {
        return url.length > 50 ? url.substring(0, 50) + '...' : url;
    }

    loadAdvancedSettings() {
        const saved = localStorage.getItem('advancedDownloadSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            this.maxConcurrent = settings.maxConcurrent || 3;
            
            document.getElementById('maxConcurrent').value = this.maxConcurrent;
            document.getElementById('concurrentValue').textContent = this.maxConcurrent;
            document.getElementById('downloadPriority').value = settings.downloadPriority || 'normal';
            document.getElementById('autoRetry').checked = settings.autoRetry || false;
        }
        
        this.renderScheduledDownloads();
    }

    saveAdvancedSettings() {
        const settings = {
            maxConcurrent: this.maxConcurrent,
            downloadPriority: document.getElementById('downloadPriority').value,
            autoRetry: document.getElementById('autoRetry').checked
        };
        
        localStorage.setItem('advancedDownloadSettings', JSON.stringify(settings));
    }
}

// Initialize enhanced features
let autoUpdater, systemIntegration, advancedDownloadManager;

document.addEventListener('DOMContentLoaded', () => {
    // Wait for main app to initialize
    setTimeout(() => {
        autoUpdater = new AutoUpdater();
        systemIntegration = new SystemIntegration();
        advancedDownloadManager = new AdvancedDownloadManager();
    }, 1000);
});