// Configuration
const API_URL = 'http://localhost:3000';
const socket = io(API_URL);

// State
let currentVideoInfo = null;
let downloads = new Map();
let downloadQueue = [];
let downloadHistory = [];
let settings = {
    defaultQuality: '1080',
    defaultAudioQuality: '256',
    defaultType: 'video',
    autoDownload: false,
    showNotifications: true,
    theme: 'dark',
    downloadPath: '',
    wallpaper: null,
    wallpaperOpacity: 20,
    wallpaperBlur: 5
};

let scheduledDownloads = [];
let currentPlaylist = null;

// Quality options
const videoQualities = [
    { value: '2160', label: '4K (2160p)' },
    { value: '1440', label: '2K (1440p)' },
    { value: '1080', label: '1080p' },
    { value: '720', label: '720p' },
    { value: '480', label: '480p' },
    { value: '360', label: '360p' }
];

const audioQualities = [
    { value: '320', label: '320 kbps (Best)' },
    { value: '256', label: '256 kbps (High)' },
    { value: '192', label: '192 kbps (Medium)' },
    { value: '128', label: '128 kbps (Standard)' }
];

// Load settings and history from localStorage
function loadSettings() {
    const saved = localStorage.getItem('ytd_settings');
    if (saved) settings = { ...settings, ...JSON.parse(saved) };
    
    const history = localStorage.getItem('ytd_history');
    if (history) downloadHistory = JSON.parse(history);
}

function saveSettings() {
    localStorage.setItem('ytd_settings', JSON.stringify(settings));
}

function saveHistory() {
    localStorage.setItem('ytd_history', JSON.stringify(downloadHistory));
}

// DOM Elements
const urlInput = document.getElementById('urlInput');
const searchBtn = document.getElementById('searchBtn');
const videoInfo = document.getElementById('videoInfo');
const videoThumbnail = document.getElementById('videoThumbnail');
const videoTitle = document.getElementById('videoTitle');
const videoMeta = document.getElementById('videoMeta');
const downloadOptions = document.getElementById('downloadOptions');
const downloadBtn = document.getElementById('downloadBtn');
const addToQueueBtn = document.getElementById('addToQueueBtn');
const qualitySelect = document.getElementById('qualitySelect');
const qualityGroup = document.getElementById('qualityGroup');
const downloadsList = document.getElementById('downloadsList');
const activeDownloadsEl = document.getElementById('activeDownloads');
const completedDownloadsEl = document.getElementById('completedDownloads');
const queueCountEl = document.getElementById('queueCount');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');

// Panel elements
const historyBtn = document.getElementById('historyBtn');
const settingsBtn = document.getElementById('settingsBtn');
const queuePanel = document.getElementById('queuePanel');
const historyPanel = document.getElementById('historyPanel');
const settingsPanel = document.getElementById('settingsPanel');
const overlay = document.getElementById('overlay');
const closeQueueBtn = document.getElementById('closeQueueBtn');
const closeHistoryBtn = document.getElementById('closeHistoryBtn');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const queueList = document.getElementById('queueList');
const historyList = document.getElementById('historyList');
const startQueueBtn = document.getElementById('startQueueBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const downloadPathInput = document.getElementById('downloadPath');
const uploadWallpaperBtn = document.getElementById('uploadWallpaper');
const removeWallpaperBtn = document.getElementById('removeWallpaper');
const wallpaperInput = document.getElementById('wallpaperInput');
const wallpaperPreview = document.getElementById('wallpaperPreview');
const wallpaperImg = document.getElementById('wallpaperImg');
const wallpaperOpacitySlider = document.getElementById('wallpaperOpacity');
const wallpaperBlurSlider = document.getElementById('wallpaperBlur');
const opacityValue = document.getElementById('opacityValue');
const blurValue = document.getElementById('blurValue');

// New feature elements
const fabBtn = document.getElementById('fabBtn');
const fabMenu = document.getElementById('fabMenu');
const fabSchedule = document.getElementById('fabSchedule');
const fabPlaylist = document.getElementById('fabPlaylist');
const fabShare = document.getElementById('fabShare');
const playlistBtn = document.getElementById('playlistBtn');
const playlistPanel = document.getElementById('playlistPanel');
const closePlaylistBtn = document.getElementById('closePlaylistBtn');
const schedulerPanel = document.getElementById('schedulerPanel');
const closeSchedulerBtn = document.getElementById('closeSchedulerBtn');

// Socket.IO Events
socket.on('connect', () => {
    console.log('Connected to server');
    if (settings.showNotifications) {
        showToast('Connected to server', 'success');
    }
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    showToast('Disconnected from server', 'error');
});

socket.on('download:progress', (data) => {
    console.log('Progress update received:', data);
    updateDownloadProgress(data);
});

// Quality Options Management
function updateQualityOptions(type) {
    const qualitySelect = document.getElementById('qualitySelect');
    const qualityLabel = document.getElementById('qualityLabel');
    const qualityGroup = document.getElementById('qualityGroup');
    
    qualityGroup.style.display = 'flex';
    
    if (type === 'audio') {
        qualityLabel.textContent = 'Audio Quality:';
        qualitySelect.innerHTML = audioQualities.map(q => 
            `<option value="${q.value}">${q.label}</option>`
        ).join('');
        qualitySelect.value = settings.defaultAudioQuality;
    } else {
        qualityLabel.textContent = 'Video Quality:';
        qualitySelect.innerHTML = videoQualities.map(q => 
            `<option value="${q.value}">${q.label}</option>`
        ).join('');
        qualitySelect.value = settings.defaultQuality;
    }
}

// Panel Management
function openPanel(panelName) {
    closeAllPanels();
    
    if (panelName === 'history') {
        historyPanel.classList.remove('hidden');
        renderHistory();
    } else if (panelName === 'settings') {
        settingsPanel.classList.remove('hidden');
        loadSettingsToUI();
    } else if (panelName === 'queue') {
        queuePanel.classList.remove('hidden');
        renderQueue();
    }
    
    overlay.classList.remove('hidden');
}

function closeAllPanels() {
    queuePanel.classList.add('hidden');
    historyPanel.classList.add('hidden');
    settingsPanel.classList.add('hidden');
    playlistPanel.classList.add('hidden');
    schedulerPanel.classList.add('hidden');
    overlay.classList.add('hidden');
    fabMenu.classList.add('hidden');
    fabBtn.classList.remove('active');
}

// Search Function
async function handleSearch() {
    const url = urlInput.value.trim();
    if (!url) {
        showToast('Please enter a YouTube URL', 'error');
        return;
    }

    searchBtn.disabled = true;
    searchBtn.innerHTML = '<span class="spinner"></span> Searching...';

    try {
        const response = await fetch(`${API_URL}/api/video/info?url=${encodeURIComponent(url)}`);

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch video info');
        }

        currentVideoInfo = data.data;
        displayVideoInfo(currentVideoInfo);
        
        if (settings.showNotifications) {
            showToast('Video info loaded', 'success');
        }
        
        if (settings.autoDownload) {
            setTimeout(() => handleDownload(), 500);
        }
    } catch (error) {
        showToast(error.message, 'error');
        console.error('Search error:', error);
    } finally {
        searchBtn.disabled = false;
        searchBtn.innerHTML = `
            <img src="assets/icons/search.svg" alt="Search" width="20" height="20">
            Search
        `;
    }
}

function displayVideoInfo(info) {
    videoThumbnail.src = info.thumbnail || 'assets/images/placeholder_thumbnail.png';
    videoThumbnail.onerror = () => {
        videoThumbnail.src = 'assets/images/placeholder_thumbnail.png';
    };
    videoTitle.textContent = info.title;
    
    const duration = formatDuration(info.duration);
    const views = formatNumber(info.viewCount);
    videoMeta.textContent = `${info.uploader} • ${duration} • ${views} views`;

    videoInfo.classList.remove('hidden');
    downloadOptions.classList.remove('hidden');
    
    // Apply default settings
    document.querySelector(`input[name="type"][value="${settings.defaultType}"]`).checked = true;
    updateQualityOptions(settings.defaultType);
}

// Download Functions
async function handleDownload() {
    if (!currentVideoInfo) {
        showToast('Please search for a video first', 'error');
        return;
    }

    const type = document.querySelector('input[name="type"]:checked').value;
    const quality = qualitySelect.value;

    downloadBtn.disabled = true;
    downloadBtn.innerHTML = '<span class="spinner"></span> Starting...';

    try {
        const response = await fetch(`${API_URL}/api/download`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: urlInput.value.trim(),
                type,
                quality: type === 'video' ? `${quality}p` : `${quality}k`
            })
        });

        const data = await response.json();

        console.log('Download API response:', data);

        if (!response.ok) {
            throw new Error(data.message || 'Failed to start download');
        }

        if (settings.showNotifications) {
            showToast('Download started', 'success');
        }
        
        if (data.success && data.data) {
            console.log('Adding download card with data:', data.data);
            addDownloadCard(data.data);
            addToHistory(currentVideoInfo, type, quality);
        } else {
            console.error('Invalid response data:', data);
            showToast('Download started but card creation failed', 'warning');
        }
    } catch (error) {
        showToast(error.message, 'error');
        console.error('Download error:', error);
    } finally {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = `
            <img src="assets/icons/download.svg" alt="Download" width="20" height="20">
            Download Now
        `;
    }
}

function handleAddToQueue() {
    if (!currentVideoInfo) {
        showToast('Please search for a video first', 'error');
        return;
    }

    const type = document.querySelector('input[name="type"]:checked').value;
    const quality = qualitySelect.value;

    const queueItem = {
        id: Date.now(),
        url: urlInput.value.trim(),
        videoInfo: currentVideoInfo,
        type,
        quality: type === 'video' ? `${quality}p` : `${quality}k`
    };

    downloadQueue.push(queueItem);
    updateQueueCount();
    renderQueue();
    showToast('Added to queue', 'success');
    
    // Clear form
    urlInput.value = '';
    videoInfo.classList.add('hidden');
    downloadOptions.classList.add('hidden');
    currentVideoInfo = null;
}

async function processQueue() {
    if (downloadQueue.length === 0) {
        showToast('Queue is empty', 'warning');
        return;
    }

    showToast(`Processing ${downloadQueue.length} items...`, 'info');
    
    while (downloadQueue.length > 0) {
        const item = downloadQueue.shift();
        updateQueueCount();
        renderQueue();
        
        try {
            const response = await fetch(`${API_URL}/api/download`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: item.url,
                    type: item.type,
                    quality: item.quality
                })
            });

            const data = await response.json();
            if (response.ok) {
                addDownloadCard(data.data);
                addToHistory(item.videoInfo, item.type, item.quality);
            }
        } catch (error) {
            console.error('Queue processing error:', error);
        }
        
        // Wait a bit between downloads
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    showToast('Queue processed', 'success');
}

function removeFromQueue(id) {
    downloadQueue = downloadQueue.filter(item => item.id !== id);
    updateQueueCount();
    renderQueue();
    showToast('Removed from queue', 'info');
}

function renderQueue() {
    if (downloadQueue.length === 0) {
        queueList.innerHTML = '<div class="empty-state-small"><p>Queue is empty</p></div>';
        return;
    }

    queueList.innerHTML = downloadQueue.map(item => `
        <div class="queue-item">
            <div class="queue-item-info">
                <div class="queue-item-title">${item.videoInfo.title}</div>
                <div class="queue-item-meta">${item.type} • ${item.quality}</div>
            </div>
            <div class="queue-item-actions">
                <button class="btn-icon" onclick="removeFromQueue(${item.id})" title="Remove">
                    <img src="assets/icons/delete.svg" alt="Delete" width="16" height="16">
                </button>
            </div>
        </div>
    `).join('');
}

// Download Card Management
function addDownloadCard(downloadInfo) {
    // Check if card already exists
    const existingCard = document.getElementById(`download-${downloadInfo.id}`);
    if (existingCard) {
        console.log('Download card already exists:', downloadInfo.id);
        return;
    }

    const emptyState = downloadsList.querySelector('.empty-state');
    if (emptyState) emptyState.remove();

    const card = document.createElement('div');
    card.className = 'download-card';
    card.id = `download-${downloadInfo.id}`;
    card.innerHTML = `
        <div class="download-header">
            <div class="download-title">${downloadInfo.title || 'Downloading...'}</div>
            <span class="download-status status-downloading">
                <span class="spinner"></span>
                Downloading
            </span>
        </div>
        <div class="download-meta">
            ${downloadInfo.type || 'video'} • ${downloadInfo.quality || 'best'}
        </div>
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${downloadInfo.progress || 0}%"></div>
        </div>
        <div class="progress-text">${downloadInfo.progress || 0}%</div>
        <div class="download-actions">
            <button class="btn-action btn-cancel" onclick="cancelDownload('${downloadInfo.id}')" title="Cancel Download">
                <img src="assets/icons/pause.svg" alt="Cancel" width="16" height="16">
                <span>Cancel</span>
            </button>
        </div>
        <div class="download-actions-completed hidden">
            <button class="btn-action btn-delete" onclick="deleteDownload('${downloadInfo.id}')" title="Delete">
                <img src="assets/icons/delete.svg" alt="Delete" width="16" height="16">
                <span>Delete</span>
            </button>
            <button class="btn-action btn-share" onclick="shareDownload('${downloadInfo.id}')" title="Share">
                <img src="assets/icons/share.svg" alt="Share" width="16" height="16">
                <span>Share</span>
            </button>
        </div>
    `;

    downloadsList.insertBefore(card, downloadsList.firstChild);
    downloads.set(downloadInfo.id, downloadInfo);
    updateStats();
    
    console.log('Download card added:', downloadInfo.id, downloadInfo);
}

function updateDownloadProgress(data) {
    const card = document.getElementById(`download-${data.downloadId}`);
    if (!card) {
        console.log('Card not found for download:', data.downloadId);
        // Try to create the card if it doesn't exist
        if (data.title) {
            addDownloadCard(data);
        }
        return;
    }

    const progressFill = card.querySelector('.progress-fill');
    const progressText = card.querySelector('.progress-text');
    const statusEl = card.querySelector('.download-status');
    const actionsEl = card.querySelector('.download-actions');
    const actionsCompletedEl = card.querySelector('.download-actions-completed');

    progressFill.style.width = `${data.progress}%`;
    progressText.textContent = `${Math.round(data.progress)}%`;

    if (data.status === 'completed') {
        statusEl.className = 'download-status status-completed';
        statusEl.innerHTML = '<img src="assets/icons/success.svg" alt="Success" width="16" height="16"> Completed';
        actionsEl.classList.add('hidden');
        actionsCompletedEl.classList.remove('hidden');
        if (settings.showNotifications) {
            showToast(`Download completed: ${data.title}`, 'success');
        }
    } else if (data.status === 'failed' || data.status === 'cancelled') {
        statusEl.className = 'download-status status-failed';
        const statusText = data.status === 'cancelled' ? 'Cancelled' : 'Failed';
        statusEl.innerHTML = `<img src="assets/icons/error.svg" alt="Error" width="16" height="16"> ${statusText}`;
        actionsEl.classList.add('hidden');
        actionsCompletedEl.classList.remove('hidden');
        showToast(`Download ${statusText.toLowerCase()}: ${data.title}`, data.status === 'cancelled' ? 'warning' : 'error');
    } else if (data.status === 'downloading video') {
        statusEl.innerHTML = '<span class="spinner"></span> Downloading video...';
    } else if (data.status === 'downloading audio') {
        statusEl.innerHTML = '<span class="spinner"></span> Downloading audio...';
    } else if (data.status === 'merging') {
        statusEl.innerHTML = '<span class="spinner"></span> Merging...';
    }

    downloads.set(data.downloadId, data);
    updateStats();
}

async function cancelDownload(id) {
    if (!confirm('Are you sure you want to cancel this download?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/download/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Download cancelled', 'info');
            
            // Update the card status
            const downloadData = downloads.get(id);
            if (downloadData) {
                downloadData.status = 'cancelled';
                updateDownloadProgress({ downloadId: id, ...downloadData });
            }
        } else {
            throw new Error(data.error || 'Failed to cancel download');
        }
    } catch (error) {
        showToast(error.message, 'error');
        console.error('Cancel error:', error);
    }
}

function shareDownload(id) {
    const download = downloads.get(id);
    if (!download) return;

    const shareData = {
        title: download.title,
        text: `Check out this video: ${download.title}`,
        url: download.url || window.location.href
    };

    if (navigator.share) {
        navigator.share(shareData).catch(() => {});
    } else {
        // Fallback: copy title to clipboard
        navigator.clipboard.writeText(download.title);
        showToast('Title copied to clipboard!', 'success');
    }
}

function deleteDownload(id) {
    const card = document.getElementById(`download-${id}`);
    if (card) {
        card.remove();
        downloads.delete(id);
        updateStats();
        showToast('Download removed', 'info');
        
        if (downloads.size === 0) {
            downloadsList.innerHTML = `
                <div class="empty-state">
                    <img src="assets/images/empty_state.png" alt="No downloads" width="120" height="120">
                    <p>No downloads yet</p>
                </div>
            `;
        }
    }
}

function clearCompleted() {
    const completed = Array.from(downloads.values()).filter(d => d.status === 'completed');
    completed.forEach(d => deleteDownload(d.id));
    showToast(`Cleared ${completed.length} completed downloads`, 'info');
}

// History Management
function addToHistory(videoInfo, type, quality) {
    const historyItem = {
        id: Date.now(),
        videoInfo,
        type,
        quality,
        timestamp: new Date().toISOString()
    };
    
    downloadHistory.unshift(historyItem);
    if (downloadHistory.length > 50) downloadHistory.pop();
    saveHistory();
}

function renderHistory() {
    if (downloadHistory.length === 0) {
        historyList.innerHTML = '<div class="empty-state-small"><p>No history yet</p></div>';
        return;
    }

    historyList.innerHTML = downloadHistory.map(item => `
        <div class="history-item">
            <div class="history-item-info">
                <div class="history-item-title">${item.videoInfo.title}</div>
                <div class="history-item-meta">${item.type} • ${item.quality} • ${formatDate(item.timestamp)}</div>
            </div>
        </div>
    `).join('');
}

function clearHistory() {
    if (confirm('Clear all download history?')) {
        downloadHistory = [];
        saveHistory();
        renderHistory();
        showToast('History cleared', 'info');
    }
}

// Theme Management
function applyTheme(theme) {
    if (theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        theme = prefersDark ? 'dark' : 'light';
    }
    
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
}

function updateThemeIcon(theme) {
    if (theme === 'light') {
        themeIcon.innerHTML = `
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        `;
    } else {
        themeIcon.innerHTML = `
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        `;
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    settings.theme = newTheme;
    applyTheme(newTheme);
    saveSettings();
    showToast(`Switched to ${newTheme} mode`, 'info');
}

// Wallpaper Management
function handleWallpaperUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
        settings.wallpaper = event.target.result;
        applyWallpaper();
        wallpaperPreview.classList.remove('hidden');
        wallpaperImg.src = settings.wallpaper;
        saveSettings(); // Save settings after uploading wallpaper
        showToast('Wallpaper uploaded', 'success');
    };
    reader.readAsDataURL(file);
}

function removeWallpaper() {
    settings.wallpaper = null;
    document.body.classList.remove('has-wallpaper');
    document.body.style.setProperty('--wallpaper-url', 'none');
    wallpaperPreview.classList.add('hidden');
    wallpaperInput.value = '';
    // Clear any cached wallpaper
    localStorage.removeItem('ytd_wallpaper_cache');
    saveSettings(); // Save settings after removing wallpaper
    showToast('Wallpaper removed', 'info');
}

function applyWallpaper() {
    if (settings.wallpaper) {
        document.body.classList.add('has-wallpaper');
        // Add timestamp to prevent caching issues
        const wallpaperUrl = settings.wallpaper.includes('data:') 
            ? settings.wallpaper 
            : `${settings.wallpaper}?t=${Date.now()}`;
        document.body.style.setProperty('--wallpaper-url', `url(${wallpaperUrl})`);
        // Apply current opacity and blur settings
        document.documentElement.style.setProperty('--wallpaper-opacity', settings.wallpaperOpacity / 100);
        document.documentElement.style.setProperty('--wallpaper-blur', `${settings.wallpaperBlur}px`);
    } else {
        document.body.classList.remove('has-wallpaper');
        document.body.style.setProperty('--wallpaper-url', 'none');
    }
}

function updateWallpaperOpacity(e) {
    const value = e.target.value;
    settings.wallpaperOpacity = value;
    opacityValue.textContent = `${value}%`;
    document.documentElement.style.setProperty('--wallpaper-opacity', value / 100);
    saveSettings(); // Save settings when opacity changes
}

function updateWallpaperBlur(e) {
    const value = e.target.value;
    settings.wallpaperBlur = value;
    blurValue.textContent = `${value}px`;
    document.documentElement.style.setProperty('--wallpaper-blur', `${value}px`);
    saveSettings(); // Save settings when blur changes
}

// Settings Management
function loadSettingsToUI() {
    document.getElementById('defaultQuality').value = settings.defaultQuality;
    document.getElementById('defaultAudioQuality').value = settings.defaultAudioQuality;
    document.getElementById('defaultType').value = settings.defaultType;
    document.getElementById('autoDownload').checked = settings.autoDownload;
    document.getElementById('showNotifications').checked = settings.showNotifications;
    document.getElementById('themeSelect').value = settings.theme;
    document.getElementById('downloadPath').value = settings.downloadPath;
    wallpaperOpacitySlider.value = settings.wallpaperOpacity;
    wallpaperBlurSlider.value = settings.wallpaperBlur;
    opacityValue.textContent = `${settings.wallpaperOpacity}%`;
    blurValue.textContent = `${settings.wallpaperBlur}px`;
    
    if (settings.wallpaper) {
        wallpaperPreview.classList.remove('hidden');
        wallpaperImg.src = settings.wallpaper;
    }
}

function handleSaveSettings() {
    settings.defaultQuality = document.getElementById('defaultQuality').value;
    settings.defaultAudioQuality = document.getElementById('defaultAudioQuality').value;
    settings.defaultType = document.getElementById('defaultType').value;
    settings.autoDownload = document.getElementById('autoDownload').checked;
    settings.showNotifications = document.getElementById('showNotifications').checked;
    settings.theme = document.getElementById('themeSelect').value;
    settings.downloadPath = document.getElementById('downloadPath').value;
    
    applyTheme(settings.theme);
    saveSettings();
    
    // Update backend download path if provided
    if (settings.downloadPath) {
        updateDownloadPath(settings.downloadPath);
    }
    
    showToast('Settings saved', 'success');
    closeAllPanels();
}

async function updateDownloadPath(path) {
    try {
        const response = await fetch(`${API_URL}/api/settings/download-path`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path })
        });
        
        if (response.ok) {
            console.log('Download path updated on server');
        }
    } catch (error) {
        console.error('Failed to update download path:', error);
    }
}

// Stats Update
function updateStats() {
    const active = Array.from(downloads.values()).filter(d => 
        d.status === 'downloading' || d.status === 'downloading video' || 
        d.status === 'downloading audio' || d.status === 'merging'
    ).length;
    const completed = Array.from(downloads.values()).filter(d => d.status === 'completed').length;
    
    activeDownloadsEl.textContent = `${active} Active`;
    completedDownloadsEl.textContent = `${completed} Completed`;
}

function updateQueueCount() {
    queueCountEl.textContent = `${downloadQueue.length} Queue`;
}

// Toast Notifications
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    const container = document.getElementById('toastContainer');
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Utility Functions
function formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatNumber(num) {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
}

// Event Listeners Setup
function setupEventListeners() {
    searchBtn.addEventListener('click', handleSearch);
    downloadBtn.addEventListener('click', handleDownload);
    addToQueueBtn.addEventListener('click', handleAddToQueue);
    clearCompletedBtn.addEventListener('click', clearCompleted);

    historyBtn.addEventListener('click', () => openPanel('history'));
    settingsBtn.addEventListener('click', () => openPanel('settings'));
    closeQueueBtn.addEventListener('click', closeAllPanels);
    closeHistoryBtn.addEventListener('click', closeAllPanels);
    closeSettingsBtn.addEventListener('click', closeAllPanels);
    overlay.addEventListener('click', closeAllPanels);

    startQueueBtn.addEventListener('click', processQueue);
    clearHistoryBtn.addEventListener('click', clearHistory);
    saveSettingsBtn.addEventListener('click', handleSaveSettings);
    themeToggle.addEventListener('click', toggleTheme);
    uploadWallpaperBtn.addEventListener('click', () => wallpaperInput.click());
    removeWallpaperBtn.addEventListener('click', removeWallpaper);
    wallpaperInput.addEventListener('change', handleWallpaperUpload);
    wallpaperOpacitySlider.addEventListener('input', updateWallpaperOpacity);
    wallpaperBlurSlider.addEventListener('input', updateWallpaperBlur);

    // New feature listeners
    fabBtn.addEventListener('click', toggleFabMenu);
    fabSchedule.addEventListener('click', () => {
        toggleFabMenu();
        openSchedulerPanel();
    });
    fabPlaylist.addEventListener('click', () => {
        toggleFabMenu();
        openPlaylistPanel();
    });
    fabShare.addEventListener('click', () => {
        toggleFabMenu();
        shareApp();
    });
    playlistBtn.addEventListener('click', openPlaylistPanel);
    closePlaylistBtn.addEventListener('click', closeAllPanels);
    closeSchedulerBtn.addEventListener('click', closeAllPanels);
    
    const loadPlaylistBtn = document.getElementById('loadPlaylistBtn');
    const addScheduleBtn = document.getElementById('addScheduleBtn');
    if (loadPlaylistBtn) loadPlaylistBtn.addEventListener('click', loadPlaylist);
    if (addScheduleBtn) addScheduleBtn.addEventListener('click', scheduleDownload);

    document.querySelectorAll('input[name="type"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            updateQualityOptions(e.target.value);
        });
    });

    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (settings.theme === 'auto') {
            applyTheme('auto');
        }
    });
}

// New Features Functions
function toggleFabMenu() {
    fabMenu.classList.toggle('hidden');
    fabBtn.classList.toggle('active');
}

function openPlaylistPanel() {
    closeAllPanels();
    playlistPanel.classList.remove('hidden');
    overlay.classList.remove('hidden');
}

function openSchedulerPanel() {
    closeAllPanels();
    schedulerPanel.classList.remove('hidden');
    overlay.classList.remove('hidden');
}

async function loadPlaylist() {
    const url = document.getElementById('playlistUrl').value.trim();
    if (!url) {
        showToast('Please enter a playlist URL', 'error');
        return;
    }
    
    showToast('Loading playlist...', 'info');
    // Playlist loading logic would go here
    // For now, show a demo
    showToast('Playlist feature coming soon!', 'info');
}

function scheduleDownload() {
    const url = document.getElementById('scheduleUrl').value.trim();
    const time = document.getElementById('scheduleTime').value;
    const type = document.getElementById('scheduleType').value;
    const quality = document.getElementById('scheduleQuality').value;
    
    if (!url || !time) {
        showToast('Please fill all fields', 'error');
        return;
    }
    
    const scheduled = {
        id: Date.now(),
        url,
        time: new Date(time),
        type,
        quality,
        status: 'pending'
    };
    
    scheduledDownloads.push(scheduled);
    renderScheduledDownloads();
    showToast('Download scheduled successfully', 'success');
    
    // Clear form
    document.getElementById('scheduleUrl').value = '';
    document.getElementById('scheduleTime').value = '';
}

function renderScheduledDownloads() {
    const container = document.getElementById('scheduledItems');
    if (scheduledDownloads.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">No scheduled downloads</p>';
        return;
    }
    
    container.innerHTML = scheduledDownloads.map(item => `
        <div class="scheduled-item">
            <div class="scheduled-item-header">
                <div class="scheduled-item-title">${item.url}</div>
                <div class="scheduled-item-time">${new Date(item.time).toLocaleString()}</div>
            </div>
            <div class="scheduled-item-meta">${item.type} • ${item.quality}p</div>
            <div class="scheduled-item-actions">
                <button class="btn-icon" onclick="removeScheduled(${item.id})">
                    <img src="assets/icons/delete.svg" alt="Delete" width="16" height="16">
                </button>
            </div>
        </div>
    `).join('');
}

function removeScheduled(id) {
    scheduledDownloads = scheduledDownloads.filter(item => item.id !== id);
    renderScheduledDownloads();
    showToast('Scheduled download removed', 'info');
}

function shareApp() {
    const shareData = {
        title: 'YouTube Downloader Pro',
        text: 'Check out this amazing YouTube downloader!',
        url: window.location.href
    };
    
    if (navigator.share) {
        navigator.share(shareData).catch(() => {});
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(window.location.href);
        showToast('Link copied to clipboard!', 'success');
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K: Focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        urlInput.focus();
    }
    
    // Ctrl/Cmd + Enter: Start download
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (currentVideoInfo) {
            handleDownload();
        }
    }
    
    // Ctrl/Cmd + H: Open history
    if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        openPanel('history');
    }
    
    // Ctrl/Cmd + ,: Open settings
    if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        openPanel('settings');
    }
    
    // Escape: Close panels
    if (e.key === 'Escape') {
        closeAllPanels();
    }
});

// Initialize
loadSettings();
applyTheme(settings.theme);
applyWallpaper();
// Load wallpaper preview in settings if wallpaper exists
if (settings.wallpaper) {
    // Ensure DOM elements are available
    const wallpaperPreview = document.getElementById('wallpaperPreview');
    const wallpaperImg = document.getElementById('wallpaperImg');
    if (wallpaperPreview && wallpaperImg) {
        wallpaperPreview.classList.remove('hidden');
        wallpaperImg.src = settings.wallpaper;
    }
}
updateQueueCount();
setupEventListeners();
renderScheduledDownloads();

// Apply wallpaper settings
document.documentElement.style.setProperty('--wallpaper-opacity', settings.wallpaperOpacity / 100);
document.documentElement.style.setProperty('--wallpaper-blur', `${settings.wallpaperBlur}px`);
document.documentElement.style.setProperty('--wallpaper-blur', `${settings.wallpaperBlur}px`);

console.log('YouTube Downloader Pro initialized with enhanced features');
