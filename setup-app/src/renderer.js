// Global variables
let currentSettings = {};
let downloadQueue = [];
let activeDownloads = [];
let completedDownloads = [];
let currentTheme = 'dark';

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    // Hide loading screen after a short delay
    setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            setTimeout(() => {
                loadingScreen.remove();
            }, 500);
        }
    }, 1000);
    
    await loadSettings();
    await checkServerStatus();
    setupEventListeners();
    setupKeyboardShortcuts();
    initializeTheme();
    loadWallpaperSettings();
    loadUISettings();
    updateStats();
    initializeTabs(); // Initialize tab functionality
    loadVersionInfo(); // Load version info on startup
    setupResponsiveHandlers(); // Setup responsive behavior
});

// Setup responsive handlers
function setupResponsiveHandlers() {
    // Handle window resize
    window.addEventListener('resize', debounce(() => {
        handleWindowResize();
    }, 250));
    
    // Handle orientation change on mobile
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            handleWindowResize();
        }, 100);
    });
    
    // Initial resize check
    handleWindowResize();
}

// Handle window resize events
function handleWindowResize() {
    const width = window.innerWidth;
    
    // Close panels on mobile when switching to landscape
    if (width <= 768) {
        const openPanels = document.querySelectorAll('.side-panel:not(.hidden)');
        if (openPanels.length > 0 && window.innerHeight < 500) {
            closeAllPanels();
        }
    }
    
    // Adjust FAB position if needed
    adjustFabPosition();
}

// Adjust FAB position for different screen sizes
function adjustFabPosition() {
    const fab = document.querySelector('.fab-container');
    if (!fab) return;
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Move FAB higher on very small screens
    if (width <= 480 || height <= 600) {
        fab.style.bottom = '20px';
        fab.style.right = '20px';
    } else {
        fab.style.bottom = '30px';
        fab.style.right = '30px';
    }
}

// Debounce utility function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl+Enter to search/download
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            const urlInput = document.getElementById('urlInput');
            if (urlInput.value.trim()) {
                searchVideo();
            }
        }
        
        // F5 to refresh status
        if (e.key === 'F5') {
            e.preventDefault();
            checkServerStatus();
        }
        
        // Ctrl+S to save settings
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveSettings();
        }
        
        // Escape to close panels
        if (e.key === 'Escape') {
            e.preventDefault();
            closeAllPanels();
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    // Backend status updates
    window.electronAPI.onBackendStatus((data) => {
        updateServerStatus(data.running, data.error);
    });

    // Backend log updates
    window.electronAPI.onBackendLog((data) => {
        appendToServerLog(data);
    });

    // Installation progress updates
    window.electronAPI.onInstallProgress((data) => {
        appendToInstallOutput(data);
    });

    // UI Event Listeners
    setupUIEventListeners();
}

function setupUIEventListeners() {
    // Search button
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', searchVideo);
    }

    // URL input enter key
    const urlInput = document.getElementById('urlInput');
    if (urlInput) {
        urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchVideo();
            }
        });
    }

    // Download buttons
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadVideo);
    }

    const addToQueueBtn = document.getElementById('addToQueueBtn');
    if (addToQueueBtn) {
        addToQueueBtn.addEventListener('click', addToQueue);
    }

    // Panel buttons
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            togglePanel('settingsPanel');
        });
    }

    const historyBtn = document.getElementById('historyBtn');
    if (historyBtn) {
        historyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            togglePanel('historyPanel');
        });
    }

    // FAB button
    const fabBtn = document.getElementById('fabBtn');
    if (fabBtn) {
        fabBtn.addEventListener('click', toggleFabMenu);
    }

    // Close buttons
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const panel = e.target.closest('.side-panel');
            if (panel) {
                panel.classList.add('hidden');
                document.getElementById('overlay').classList.add('hidden');
            }
        });
    });

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Clear completed button
    const clearCompletedBtn = document.getElementById('clearCompletedBtn');
    if (clearCompletedBtn) {
        clearCompletedBtn.addEventListener('click', clearCompleted);
    }

    // Save settings button (Settings Panel - UI settings only)
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', saveUISettings);
    }

    // Save control panel button (Control Panel - Electron settings)
    const saveControlPanelBtn = document.getElementById('saveControlPanelBtn');
    if (saveControlPanelBtn) {
        saveControlPanelBtn.addEventListener('click', saveSettings);
    }

    // FAB Action buttons
    const fabControl = document.getElementById('fabControl');
    if (fabControl) {
        fabControl.addEventListener('click', () => {
            togglePanel('controlPanel');
            closeFabMenu();
        });
    }

    const fabSchedule = document.getElementById('fabSchedule');
    if (fabSchedule) {
        fabSchedule.addEventListener('click', () => {
            showToast('Schedule Download - Coming Soon!', 'info');
            closeFabMenu();
        });
    }

    const fabShare = document.getElementById('fabShare');
    if (fabShare) {
        fabShare.addEventListener('click', () => {
            shareCurrentVideo();
            closeFabMenu();
        });
    }
    const uploadWallpaper = document.getElementById('uploadWallpaper');
    if (uploadWallpaper) {
        uploadWallpaper.addEventListener('click', () => {
            document.getElementById('wallpaperInput').click();
        });
    }

    // Remove wallpaper button
    const removeWallpaper = document.getElementById('removeWallpaper');
    if (removeWallpaper) {
        removeWallpaper.addEventListener('click', removeWallpaperImage);
    }

    // Wallpaper input change
    const wallpaperInput = document.getElementById('wallpaperInput');
    if (wallpaperInput) {
        wallpaperInput.addEventListener('change', handleWallpaperUpload);
    }

    // Opacity slider
    const opacitySlider = document.getElementById('wallpaperOpacity');
    if (opacitySlider) {
        opacitySlider.addEventListener('input', updateWallpaperOpacity);
    }

    // Blur slider
    const blurSlider = document.getElementById('wallpaperBlur');
    if (blurSlider) {
        blurSlider.addEventListener('input', updateWallpaperBlur);
    }

    // Data management buttons
    const thumbnailGallery = document.getElementById('thumbnailGallery');
    if (thumbnailGallery) {
        thumbnailGallery.addEventListener('click', openThumbnailGallery);
    }

    const exportSettings = document.getElementById('exportSettings');
    if (exportSettings) {
        exportSettings.addEventListener('click', exportSettingsData);
    }

    const importSettings = document.getElementById('importSettings');
    if (importSettings) {
        importSettings.addEventListener('click', importSettingsData);
    }

    const clearAllData = document.getElementById('clearAllData');
    if (clearAllData) {
        clearAllData.addEventListener('click', clearAllDataConfirm);
    }

    // Theme select
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
        themeSelect.addEventListener('change', (e) => {
            if (e.target.value !== 'auto') {
                currentTheme = e.target.value;
                document.documentElement.setAttribute('data-theme', currentTheme);
                localStorage.setItem('theme', currentTheme);
                showToast(`Switched to ${currentTheme} mode`, 'info');
            }
        });
    }

    // Auto download checkbox
    const autoDownload = document.getElementById('autoDownload');
    if (autoDownload) {
        autoDownload.addEventListener('change', (e) => {
            localStorage.setItem('autoDownload', e.target.checked);
        });
    }

    // Show notifications checkbox
    const showNotifications = document.getElementById('showNotifications');
    if (showNotifications) {
        showNotifications.addEventListener('change', (e) => {
            localStorage.setItem('showNotifications', e.target.checked);
        });
    }

    // Overlay click to close
    const overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.addEventListener('click', closeAllPanels);
    }

    // Check updates button
    const checkUpdatesBtn = document.getElementById('checkUpdatesBtn');
    if (checkUpdatesBtn) {
        checkUpdatesBtn.addEventListener('click', checkForUpdates);
    }
}

// Panel management
function togglePanel(panelId) {
    const panel = document.getElementById(panelId);
    const overlay = document.getElementById('overlay');
    
    // Close FAB menu first
    closeFabMenu();
    
    if (!panel) {
        console.error(`Panel with id '${panelId}' not found`);
        return;
    }
    
    if (panel.classList.contains('hidden')) {
        // Close all other panels first
        closeAllPanels();
        // Open this panel
        panel.classList.remove('hidden');
        if (overlay) {
            overlay.classList.remove('hidden');
        }
    } else {
        // Close this panel
        panel.classList.add('hidden');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }
}

function closeAllPanels() {
    document.querySelectorAll('.side-panel').forEach(panel => {
        panel.classList.add('hidden');
    });
    const overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

// Theme management
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    currentTheme = savedTheme;
    document.documentElement.setAttribute('data-theme', currentTheme);
}

function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    showToast(`Switched to ${currentTheme} mode`, 'info');
}

// Panel management
function closeAllPanels() {
    document.querySelectorAll('.side-panel').forEach(panel => {
        panel.classList.add('hidden');
    });
    document.getElementById('overlay').classList.add('hidden');
    closeFabMenu();
}

// Video search and download functionality
async function searchVideo() {
    const urlInput = document.getElementById('urlInput');
    const url = urlInput.value.trim();
    
    if (!url) {
        showToast('Please enter a YouTube URL', 'warning');
        return;
    }

    if (!isValidYouTubeUrl(url)) {
        showToast('Please enter a valid YouTube URL', 'error');
        return;
    }

    const searchBtn = document.getElementById('searchBtn');
    const originalText = searchBtn.innerHTML;
    searchBtn.innerHTML = '<img src="../assets/icons/search.svg" alt="Searching" width="16" height="16"> Searching...';
    searchBtn.disabled = true;

    try {
        // Check if backend server is running
        const serverStatus = await window.electronAPI.getBackendStatus();
        console.log('Backend status:', serverStatus);
        
        if (!serverStatus.running) {
            showToast('Backend server is not running. Please start it from Control Panel.', 'warning');
            
            // Still try to show basic video info
            const videoId = extractVideoId(url);
            if (videoId) {
                const fallbackData = {
                    title: 'YouTube Video (Start backend for full info)',
                    thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                    duration: null,
                    viewCount: null,
                    uploader: 'Unknown Channel',
                    id: videoId
                };
                
                displayVideoInfo(fallbackData);
                showDownloadOptions();
            }
            return;
        }

        // Make API call to backend server to get video info
        const serverPort = currentSettings.serverPort || 3000;
        const apiUrl = `http://localhost:${serverPort}/api/video/info?url=${encodeURIComponent(url)}`;
        console.log('Making API request to:', apiUrl);
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 10000 // 10 second timeout
        });

        console.log('API response status:', response.status);

        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }

        const videoData = await response.json();
        console.log('API response data:', videoData);
        
        if (!videoData.success) {
            throw new Error(videoData.error || 'Failed to fetch video information');
        }

        // Use real video data from backend (videoData.data contains the actual video info)
        displayVideoInfo(videoData.data);
        showDownloadOptions();
        showToast('Video information loaded!', 'success');
        
    } catch (error) {
        console.error('Search failed:', error);
        
        // Fallback to basic video info extraction from URL
        const videoId = extractVideoId(url);
        if (videoId) {
            const fallbackData = {
                title: 'YouTube Video',
                thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                duration: null,
                viewCount: null,
                uploader: 'Unknown Channel',
                id: videoId
            };
            
            displayVideoInfo(fallbackData);
            showDownloadOptions();
            showToast('Video loaded (limited info - start backend for full details)', 'info');
        } else {
            showToast('Failed to fetch video information. Please check the URL and ensure backend is running.', 'error');
        }
    } finally {
        searchBtn.innerHTML = originalText;
        searchBtn.disabled = false;
    }
}

function displayVideoInfo(videoData) {
    const videoInfo = document.getElementById('videoInfo');
    const thumbnail = document.getElementById('videoThumbnail');
    const title = document.getElementById('videoTitle');
    const meta = document.getElementById('videoMeta');

    // Handle different thumbnail sources
    if (videoData.thumbnail) {
        thumbnail.src = videoData.thumbnail;
        thumbnail.onerror = function() {
            // Fallback to YouTube thumbnail if custom thumbnail fails
            if (videoData.id) {
                this.src = `https://img.youtube.com/vi/${videoData.id}/maxresdefault.jpg`;
            }
        };
    }
    
    // Set title with fallback
    title.textContent = videoData.title || 'YouTube Video';
    
    // Build meta information
    const metaParts = [];
    
    // Format duration
    if (videoData.duration) {
        const duration = formatDuration(videoData.duration);
        metaParts.push(duration);
    }
    
    // Format view count
    if (videoData.viewCount) {
        const views = formatViewCount(videoData.viewCount);
        metaParts.push(views);
    }
    
    // Add uploader/channel
    if (videoData.uploader) {
        metaParts.push(videoData.uploader);
    }
    
    meta.textContent = metaParts.join(' • ') || 'Video information';

    videoInfo.classList.remove('hidden');
}

// Helper function to format duration from seconds to HH:MM:SS or MM:SS
function formatDuration(seconds) {
    if (!seconds || seconds === 0) return 'Unknown';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
}

// Helper function to format view count
function formatViewCount(count) {
    if (!count || count === 0) return 'No views';
    
    if (count >= 1000000) {
        return `${(count / 1000000).toFixed(1)}M views`;
    } else if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}K views`;
    } else {
        return `${count} views`;
    }
}

function showDownloadOptions() {
    const downloadOptions = document.getElementById('downloadOptions');
    downloadOptions.classList.remove('hidden');
}

function isValidYouTubeUrl(url) {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return youtubeRegex.test(url);
}

function extractVideoId(url) {
    // Extract video ID from various YouTube URL formats
    const regexPatterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];
    
    for (const pattern of regexPatterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}

async function downloadVideo() {
    const urlInput = document.getElementById('urlInput');
    const qualitySelect = document.getElementById('qualitySelect');
    const typeRadios = document.querySelectorAll('input[name="type"]');
    
    if (!urlInput.value.trim()) {
        showToast('Please enter a YouTube URL first', 'warning');
        return;
    }
    
    let selectedType = 'video';
    typeRadios.forEach(radio => {
        if (radio.checked) selectedType = radio.value;
    });

    const downloadData = {
        url: urlInput.value.trim(),
        quality: qualitySelect.value,
        type: selectedType
    };

    console.log('Starting download with data:', downloadData);

    try {
        // Check if backend server is running
        const serverStatus = await window.electronAPI.getBackendStatus();
        if (!serverStatus.running) {
            showToast('Backend server is not running. Please start it from Control Panel.', 'error');
            return;
        }

        // Make API call to backend server to start download
        const serverPort = currentSettings.serverPort || 3000;
        const response = await fetch(`http://localhost:${serverPort}/api/download`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(downloadData)
        });

        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Download API response:', result);

        if (!result.success) {
            throw new Error(result.error || 'Failed to start download');
        }

        // Add to active downloads with real download info from backend
        const download = {
            id: result.data.id,
            url: result.data.url,
            title: result.data.title,
            type: result.data.type,
            quality: result.data.quality,
            progress: result.data.progress || 0,
            status: result.data.status || 'downloading',
            startTime: new Date(result.data.startTime),
            outputPath: result.data.outputPath
        };

        activeDownloads.push(download);
        updateDownloadsList();
        updateStats();
        
        showToast(`Download started: ${download.title}`, 'success');
        
        // Set up Socket.IO listener for this download if not already set up
        setupDownloadProgressListener();
        
    } catch (error) {
        console.error('Download failed:', error);
        showToast(`Download failed: ${error.message}`, 'error');
    }
}

async function addToQueue() {
    const urlInput = document.getElementById('urlInput');
    const qualitySelect = document.getElementById('qualitySelect');
    const typeRadios = document.querySelectorAll('input[name="type"]');
    
    if (!urlInput.value.trim()) {
        showToast('Please enter a YouTube URL first', 'warning');
        return;
    }
    
    let selectedType = 'video';
    typeRadios.forEach(radio => {
        if (radio.checked) selectedType = radio.value;
    });

    const queueItem = {
        id: Date.now().toString(),
        url: urlInput.value.trim(),
        quality: qualitySelect.value,
        type: selectedType,
        title: document.getElementById('videoTitle').textContent || 'Unknown Video',
        addedTime: new Date()
    };

    downloadQueue.push(queueItem);
    updateStats();
    showToast('Added to download queue!', 'info');
    
    // Auto-start download if no active downloads
    if (activeDownloads.length === 0) {
        processQueue();
    }
}

// Process download queue
async function processQueue() {
    if (downloadQueue.length === 0 || activeDownloads.length > 0) {
        return; // No items in queue or already downloading
    }
    
    const nextItem = downloadQueue.shift();
    
    try {
        // Check if backend server is running
        const serverStatus = await window.electronAPI.getBackendStatus();
        if (!serverStatus.running) {
            showToast('Backend server is not running. Queue paused.', 'warning');
            // Put item back at front of queue
            downloadQueue.unshift(nextItem);
            return;
        }

        // Start download
        const downloadData = {
            url: nextItem.url,
            quality: nextItem.quality,
            type: nextItem.type
        };

        const serverPort = currentSettings.serverPort || 3000;
        const response = await fetch(`http://localhost:${serverPort}/api/download`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(downloadData)
        });

        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to start download');
        }

        // Add to active downloads
        const download = {
            id: result.data.id,
            url: result.data.url,
            title: result.data.title,
            type: result.data.type,
            quality: result.data.quality,
            progress: result.data.progress || 0,
            status: result.data.status || 'downloading',
            startTime: new Date(result.data.startTime),
            outputPath: result.data.outputPath
        };

        activeDownloads.push(download);
        updateDownloadsList();
        updateStats();
        
        showToast(`Started from queue: ${download.title}`, 'success');
        
        // Set up Socket.IO listener
        setupDownloadProgressListener();
        
    } catch (error) {
        console.error('Queue processing failed:', error);
        showToast(`Queue download failed: ${error.message}`, 'error');
        
        // Continue processing queue after a delay
        setTimeout(() => {
            processQueue();
        }, 2000);
    }
}

// IPC-based download progress listener (replaces direct Socket.IO)
let progressListenerSetup = false;

function setupDownloadProgressListener() {
    if (progressListenerSetup) return;
    
    try {
        // Use IPC to communicate with main process for Socket.IO
        window.electronAPI.setupDownloadListener();
        
        // Listen for download progress from main process
        window.electronAPI.onDownloadProgress((data) => {
            console.log('Download progress update:', data);
            updateDownloadProgress(data);
        });
        
        progressListenerSetup = true;
        console.log('Download progress listener setup complete');
    } catch (error) {
        console.error('Failed to setup download progress listener:', error);
    }
}

function updateDownloadProgress(progressData) {
    const { downloadId, title, progress, status, error } = progressData;
    
    // Find the download in active downloads
    const downloadIndex = activeDownloads.findIndex(d => d.id === downloadId);
    
    if (downloadIndex !== -1) {
        const download = activeDownloads[downloadIndex];
        download.progress = progress || 0;
        download.status = status || 'downloading';
        
        if (error) {
            download.error = error;
        }
        
        // If download is completed, failed, or cancelled, move to completed downloads
        if (status === 'completed' || status === 'failed' || status === 'cancelled') {
            download.endTime = new Date();
            
            // Move to completed
            activeDownloads.splice(downloadIndex, 1);
            completedDownloads.unshift(download);
            
            if (status === 'completed') {
                showToast(`Download completed: ${title}`, 'success');
            } else if (status === 'failed') {
                showToast(`Download failed: ${title}`, 'error');
            } else if (status === 'cancelled') {
                showToast(`Download cancelled: ${title}`, 'info');
            }
            
            // Process next item in queue if available
            setTimeout(() => {
                processQueue();
            }, 1000);
        }
        
        updateDownloadsList();
        updateStats();
    }
}

// Real download function (replaces simulateDownload)
async function startRealDownload(downloadData) {
    try {
        const serverPort = currentSettings.serverPort || 3000;
        const response = await fetch(`http://localhost:${serverPort}/api/download`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(downloadData)
        });

        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to start download');
        }

        return result.data;
    } catch (error) {
        console.error('Real download failed:', error);
        throw error;
    }
}

function updateDownloadsList() {
    const downloadsList = document.getElementById('downloadsList');
    const allDownloads = [...activeDownloads, ...completedDownloads];
    
    if (allDownloads.length === 0) {
        downloadsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📥</div>
                <p>No downloads yet</p>
            </div>
        `;
        return;
    }

    downloadsList.innerHTML = allDownloads.map(download => `
        <div class="download-card">
            <div class="download-header">
                <div class="download-title">${download.title}</div>
                <div class="download-actions">
                    <div class="download-status status-${download.status}">
                        <img src="../assets/icons/${getStatusIcon(download.status)}.svg" alt="${download.status}" width="12" height="12">
                        ${formatStatus(download.status)}
                    </div>
                    ${download.status === 'downloading' || download.status === 'initializing' || download.status === 'processing' || download.status === 'finalizing' ? `
                        <button class="cancel-btn" onclick="cancelDownload('${download.id}')" title="Cancel Download">
                            <img src="../assets/icons/delete.svg" alt="Cancel" width="14" height="14">
                        </button>
                    ` : ''}
                </div>
            </div>
            <div class="download-meta">
                <img src="../assets/icons/${download.type}.svg" alt="${download.type}" width="12" height="12">
                ${download.type} • ${download.quality}p • ${formatTime(download.startTime)}
            </div>
            ${(download.status === 'downloading' || download.status === 'initializing' || download.status === 'processing' || download.status === 'finalizing') ? `
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${download.progress || 0}%"></div>
                </div>
                <div class="progress-text">${Math.round(download.progress || 0)}%</div>
            ` : ''}
            ${download.status === 'failed' && download.error ? `
                <div class="error-message">
                    <img src="../assets/icons/error.svg" alt="Error" width="12" height="12">
                    ${download.error}
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Helper function to get appropriate status icon
function getStatusIcon(status) {
    switch (status) {
        case 'downloading':
        case 'initializing':
        case 'processing':
        case 'finalizing':
            return 'download';
        case 'completed':
            return 'success';
        case 'failed':
        case 'cancelled':
            return 'error';
        default:
            return 'info';
    }
}

// Helper function to format status text
function formatStatus(status) {
    switch (status) {
        case 'initializing':
            return 'Initializing';
        case 'downloading':
            return 'Downloading';
        case 'processing':
            return 'Processing';
        case 'finalizing':
            return 'Finalizing';
        case 'completed':
            return 'Completed';
        case 'failed':
            return 'Failed';
        case 'cancelled':
            return 'Cancelled';
        default:
            return status;
    }
}

function updateStats() {
    document.getElementById('queueCount').textContent = `${downloadQueue.length} Queue`;
    document.getElementById('activeDownloads').textContent = `${activeDownloads.length} Active`;
    document.getElementById('completedDownloads').textContent = `${completedDownloads.length} Completed`;
}

function clearCompleted() {
    completedDownloads.length = 0;
    updateDownloadsList();
    updateStats();
    showToast('Completed downloads cleared', 'info');
}

// Cancel download function
async function cancelDownload(downloadId) {
    try {
        console.log('Cancelling download:', downloadId);
        
        // Find the download in active downloads
        const downloadIndex = activeDownloads.findIndex(d => d.id === downloadId);
        if (downloadIndex === -1) {
            showToast('Download not found', 'error');
            return;
        }
        
        const download = activeDownloads[downloadIndex];
        
        // Check if backend server is running
        const serverStatus = await window.electronAPI.getBackendStatus();
        if (!serverStatus.running) {
            // If backend is not running, just remove from local list
            download.status = 'cancelled';
            download.endTime = new Date();
            
            activeDownloads.splice(downloadIndex, 1);
            completedDownloads.unshift(download);
            
            updateDownloadsList();
            updateStats();
            showToast(`Download cancelled: ${download.title}`, 'info');
            return;
        }

        // Make API call to backend to cancel download
        const serverPort = currentSettings.serverPort || 3000;
        const response = await fetch(`http://localhost:${serverPort}/api/download/${downloadId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Cancel API response:', result);

        if (!result.success) {
            throw new Error(result.error || 'Failed to cancel download');
        }

        // Update local download status
        download.status = 'cancelled';
        download.endTime = new Date();
        
        // Move to completed downloads
        activeDownloads.splice(downloadIndex, 1);
        completedDownloads.unshift(download);
        
        updateDownloadsList();
        updateStats();
        showToast(`Download cancelled: ${download.title}`, 'info');
        
        // Process next item in queue if available
        setTimeout(() => {
            processQueue();
        }, 1000);
        
    } catch (error) {
        console.error('Cancel download failed:', error);
        showToast(`Failed to cancel download: ${error.message}`, 'error');
    }
}

function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Settings management (existing functionality)
async function loadSettings() {
    try {
        currentSettings = await window.electronAPI.getSettings();
        
        // Update form fields if they exist
        const backendPath = document.getElementById('backendPath');
        const serverPort = document.getElementById('serverPort');
        const downloadPath = document.getElementById('downloadPath');
        const autoStart = document.getElementById('autoStart');
        
        if (backendPath) backendPath.value = currentSettings.backendPath || '';
        if (serverPort) serverPort.value = currentSettings.serverPort || 3000;
        if (downloadPath) downloadPath.value = currentSettings.downloadPath || '';
        if (autoStart) autoStart.checked = currentSettings.autoStart || false;
        
    } catch (error) {
        console.error('Failed to load settings:', error);
        showToast('Failed to load settings', 'error');
    }
}

async function saveSettings() {
    try {
        console.log('Saving Control Panel settings...');
        
        const backendPath = document.getElementById('backendPath');
        const serverPort = document.getElementById('serverPort');
        const autoStart = document.getElementById('autoStart');
        
        // Only get values from elements that exist in Control Panel
        const settings = {
            backendPath: backendPath ? backendPath.value.trim() : (currentSettings.backendPath || ''),
            serverPort: serverPort ? parseInt(serverPort.value) || 3000 : (currentSettings.serverPort || 3000),
            autoStart: autoStart ? autoStart.checked : (currentSettings.autoStart || false)
        };
        
        console.log('Settings to save:', settings);
        
        const result = await window.electronAPI.saveSettings(settings);
        console.log('Save result:', result);
        
        if (result) {
            currentSettings = { ...currentSettings, ...settings };
            showToast('Control Panel settings saved successfully!', 'success');
        } else {
            throw new Error('Save operation returned false');
        }
    } catch (error) {
        console.error('Failed to save Control Panel settings:', error);
        showToast(`Failed to save settings: ${error.message}`, 'error');
    }
}

async function selectBackendPath() {
    try {
        const path = await window.electronAPI.selectFolder();
        if (path) {
            document.getElementById('backendPath').value = path;
        }
    } catch (error) {
        console.error('Failed to select backend path:', error);
        showToast('Failed to select folder', 'error');
    }
}

async function selectDownloadPath() {
    try {
        const path = await window.electronAPI.selectFolder();
        if (path) {
            document.getElementById('downloadPath').value = path;
        }
    } catch (error) {
        console.error('Failed to select download path:', error);
        showToast('Failed to select folder', 'error');
    }
}

// Server management (existing functionality)
async function startServer() {
    try {
        const result = await window.electronAPI.startBackend();
        if (result.success) {
            showToast('Server starting...', 'info');
            updateServerStatus(true);
        } else {
            showToast(`Failed to start server: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Failed to start server:', error);
        showToast('Failed to start server', 'error');
    }
}

async function stopServer() {
    try {
        const result = await window.electronAPI.stopBackend();
        if (result.success) {
            showToast('Server stopped', 'info');
            updateServerStatus(false);
        } else {
            showToast(`Failed to stop server: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Failed to stop server:', error);
        showToast('Failed to stop server', 'error');
    }
}

async function checkServerStatus() {
    try {
        const status = await window.electronAPI.getBackendStatus();
        updateServerStatus(status.running);
        
        // Also try to ping the actual server
        if (status.running) {
            try {
                const response = await fetch('http://localhost:3000/api', { 
                    method: 'GET',
                    timeout: 5000 
                });
                if (response.ok) {
                    console.log('✅ Server is responding at http://localhost:3000');
                }
            } catch (fetchError) {
                console.log('⚠️ Server process running but connection failed');
            }
        }
    } catch (error) {
        console.error('Failed to check server status:', error);
    }
}

function updateServerStatus(running, error = null) {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    
    if (statusDot && statusText) {
        if (running) {
            statusDot.className = 'status-dot running';
            statusText.textContent = 'Server Running';
        } else {
            statusDot.className = 'status-dot stopped';
            statusText.textContent = error ? `Server Error: ${error}` : 'Server Stopped';
        }
    }
    
    if (startBtn && stopBtn) {
        startBtn.disabled = running;
        stopBtn.disabled = !running;
    }
}

// Toast notifications
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Utility functions
function appendToServerLog(text) {
    console.log('Server log:', text);
}

function appendToInstallOutput(text) {
    console.log('Install output:', text);
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.electronAPI && window.electronAPI.removeAllListeners) {
        window.electronAPI.removeAllListeners('backend-status');
        window.electronAPI.removeAllListeners('backend-log');
        window.electronAPI.removeAllListeners('install-progress');
        window.electronAPI.removeAllListeners('download-progress');
    }
});

// Wallpaper functionality
function handleWallpaperUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const imageUrl = e.target.result;
        
        // Show preview
        const preview = document.getElementById('wallpaperPreview');
        const img = document.getElementById('wallpaperImg');
        img.src = imageUrl;
        preview.classList.remove('hidden');
        
        // Apply wallpaper
        document.documentElement.style.setProperty('--wallpaper-url', `url(${imageUrl})`);
        document.body.classList.add('has-wallpaper');
        
        // Save to localStorage
        localStorage.setItem('wallpaperImage', imageUrl);
        
        showToast('Wallpaper uploaded successfully!', 'success');
    };
    
    reader.readAsDataURL(file);
}

function removeWallpaperImage() {
    // Remove wallpaper
    document.documentElement.style.removeProperty('--wallpaper-url');
    document.body.classList.remove('has-wallpaper');
    
    // Hide preview
    const preview = document.getElementById('wallpaperPreview');
    preview.classList.add('hidden');
    
    // Clear from localStorage
    localStorage.removeItem('wallpaperImage');
    
    showToast('Wallpaper removed', 'info');
}

function updateWallpaperOpacity(event) {
    const opacity = event.target.value;
    document.documentElement.style.setProperty('--wallpaper-opacity', opacity / 100);
    document.getElementById('opacityValue').textContent = `${opacity}%`;
    localStorage.setItem('wallpaperOpacity', opacity);
}

function updateWallpaperBlur(event) {
    const blur = event.target.value;
    document.documentElement.style.setProperty('--wallpaper-blur', `${blur}px`);
    document.getElementById('blurValue').textContent = `${blur}px`;
    localStorage.setItem('wallpaperBlur', blur);
}

// Load wallpaper settings
function loadWallpaperSettings() {
    // Load wallpaper image
    const savedWallpaper = localStorage.getItem('wallpaperImage');
    if (savedWallpaper) {
        document.documentElement.style.setProperty('--wallpaper-url', `url(${savedWallpaper})`);
        document.body.classList.add('has-wallpaper');
        
        const preview = document.getElementById('wallpaperPreview');
        const img = document.getElementById('wallpaperImg');
        if (preview && img) {
            img.src = savedWallpaper;
            preview.classList.remove('hidden');
        }
    }
    
    // Load opacity
    const savedOpacity = localStorage.getItem('wallpaperOpacity') || '20';
    const opacitySlider = document.getElementById('wallpaperOpacity');
    const opacityValue = document.getElementById('opacityValue');
    if (opacitySlider && opacityValue) {
        opacitySlider.value = savedOpacity;
        opacityValue.textContent = `${savedOpacity}%`;
        document.documentElement.style.setProperty('--wallpaper-opacity', savedOpacity / 100);
    }
    
    // Load blur
    const savedBlur = localStorage.getItem('wallpaperBlur') || '5';
    const blurSlider = document.getElementById('wallpaperBlur');
    const blurValue = document.getElementById('blurValue');
    if (blurSlider && blurValue) {
        blurSlider.value = savedBlur;
        blurValue.textContent = `${savedBlur}px`;
        document.documentElement.style.setProperty('--wallpaper-blur', `${savedBlur}px`);
    }
}

// Load other UI settings
function loadUISettings() {
    // Load theme
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
        themeSelect.value = currentTheme;
    }
    
    // Load auto download
    const autoDownload = document.getElementById('autoDownload');
    if (autoDownload) {
        autoDownload.checked = localStorage.getItem('autoDownload') === 'true';
    }
    
    // Load show notifications
    const showNotifications = document.getElementById('showNotifications');
    if (showNotifications) {
        showNotifications.checked = localStorage.getItem('showNotifications') !== 'false';
    }
    
    // Load default quality settings
    const defaultQuality = document.getElementById('defaultQuality');
    if (defaultQuality) {
        defaultQuality.value = localStorage.getItem('defaultQuality') || '1080';
    }
    
    const defaultAudioQuality = document.getElementById('defaultAudioQuality');
    if (defaultAudioQuality) {
        defaultAudioQuality.value = localStorage.getItem('defaultAudioQuality') || '256';
    }
    
    const defaultType = document.getElementById('defaultType');
    if (defaultType) {
        defaultType.value = localStorage.getItem('defaultType') || 'video';
    }
}

// UI settings save (for Settings Panel)
function saveUISettings() {
    try {
        console.log('Saving UI settings...');
        
        // Save UI settings to localStorage
        const elements = [
            'defaultQuality', 'defaultAudioQuality', 'defaultType',
            'autoDownload', 'showNotifications'
        ];
        
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                const value = element.type === 'checkbox' ? element.checked : element.value;
                localStorage.setItem(id, value);
                console.log(`Saved ${id}:`, value);
            }
        });
        
        // Save wallpaper settings
        const wallpaperOpacity = document.getElementById('wallpaperOpacity');
        if (wallpaperOpacity) {
            localStorage.setItem('wallpaperOpacity', wallpaperOpacity.value);
        }
        
        const wallpaperBlur = document.getElementById('wallpaperBlur');
        if (wallpaperBlur) {
            localStorage.setItem('wallpaperBlur', wallpaperBlur.value);
        }
        
        // Save theme setting
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            localStorage.setItem('theme', themeSelect.value);
        }
        
        // Save download path if it exists in settings panel (this is UI preference, not Electron setting)
        const downloadPath = document.getElementById('downloadPath');
        if (downloadPath) {
            localStorage.setItem('downloadPath', downloadPath.value);
            console.log('Saved downloadPath:', downloadPath.value);
        }
        
        showToast('UI settings saved successfully!', 'success');
        console.log('UI settings saved successfully');
    } catch (error) {
        console.error('Failed to save UI settings:', error);
        showToast('UI settings saved locally', 'info');
    }
}

// Enhanced settings save
// Enhanced settings save (legacy function - now just calls saveUISettings)
async function saveAllSettings() {
    saveUISettings();
}
// Share functionality
function shareCurrentVideo() {
    const urlInput = document.getElementById('urlInput');
    const videoTitle = document.getElementById('videoTitle');
    
    if (!urlInput.value.trim()) {
        showToast('No video to share', 'warning');
        return;
    }

    const shareData = {
        title: videoTitle.textContent || 'YouTube Video',
        url: urlInput.value.trim()
    };

    // Try native sharing first (if supported)
    if (navigator.share) {
        navigator.share(shareData).then(() => {
            showToast('Video shared successfully!', 'success');
        }).catch(() => {
            // Fallback to clipboard
            copyToClipboard(shareData.url);
        });
    } else {
        // Fallback to clipboard
        copyToClipboard(shareData.url);
    }
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Video URL copied to clipboard!', 'success');
        }).catch(() => {
            // Fallback for older browsers
            fallbackCopyToClipboard(text);
        });
    } else {
        fallbackCopyToClipboard(text);
    }
}

function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showToast('Video URL copied to clipboard!', 'success');
    } catch (err) {
        showToast('Failed to copy URL', 'error');
    }
    
    document.body.removeChild(textArea);
}
// FAB Menu functionality
function toggleFabMenu() {
    const fabBtn = document.getElementById('fabBtn');
    const fabMenu = document.getElementById('fabMenu');
    
    if (!fabMenu || !fabBtn) return;
    
    if (fabMenu.classList.contains('hidden')) {
        // Open menu
        fabMenu.classList.remove('hidden');
        fabBtn.classList.add('active');
        fabBtn.title = 'Close Quick Actions';
    } else {
        // Close menu
        closeFabMenu();
    }
}

function closeFabMenu() {
    const fabBtn = document.getElementById('fabBtn');
    const fabMenu = document.getElementById('fabMenu');
    
    if (!fabMenu || !fabBtn) return;
    
    fabMenu.classList.add('hidden');
    fabBtn.classList.remove('active');
    fabBtn.title = 'Quick Actions';
}

// Close FAB menu when clicking outside
document.addEventListener('click', (e) => {
    const fabContainer = document.querySelector('.fab-container');
    const fabMenu = document.getElementById('fabMenu');
    
    if (fabContainer && !fabContainer.contains(e.target) && fabMenu && !fabMenu.classList.contains('hidden')) {
        closeFabMenu();
    }
});
// Tab functionality
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            button.classList.add('active');
            document.getElementById(targetTab + 'Tab').classList.add('active');
            
            // If switching to updates tab, load version info
            if (targetTab === 'updates') {
                loadVersionInfo();
            }
        });
    });
}

// Update functionality
async function loadVersionInfo() {
    try {
        const versionInfo = await window.electronAPI.getVersionInfo();
        
        const currentVersionEl = document.getElementById('currentVersion');
        const lastCheckedEl = document.getElementById('lastChecked');
        
        if (currentVersionEl) {
            currentVersionEl.textContent = versionInfo.currentVersion || 'Unknown';
        }
        
        if (lastCheckedEl && versionInfo.lastUpdateCheck) {
            const lastChecked = new Date(versionInfo.lastUpdateCheck);
            lastCheckedEl.textContent = `Last checked: ${lastChecked.toLocaleString()}`;
        }
    } catch (error) {
        console.error('Error loading version info:', error);
        showToast('Failed to load version information', 'error');
    }
}

async function checkForUpdates() {
    const checkBtn = document.getElementById('checkUpdatesBtn');
    const updateStatus = document.getElementById('updateStatus');
    const updateDetails = document.getElementById('updateDetails');
    const changelogSection = document.getElementById('changelogSection');
    
    if (!checkBtn || !updateStatus) return;
    
    // Show loading state
    checkBtn.disabled = true;
    checkBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 4v6h6"/>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
        </svg>
        Checking...
    `;
    
    updateStatus.innerHTML = `
        <div class="update-loading">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 4v6h6"/>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
            </svg>
            Checking for updates...
        </div>
    `;
    updateStatus.classList.remove('hidden');
    
    try {
        const updateInfo = await window.electronAPI.checkForUpdates();
        
        // Update last checked time
        const lastCheckedEl = document.getElementById('lastChecked');
        if (lastCheckedEl) {
            lastCheckedEl.textContent = `Last checked: ${new Date().toLocaleString()}`;
        }
        
        if (updateInfo.error) {
            showUpdateError(updateInfo.error);
        } else if (updateInfo.hasUpdate) {
            showUpdateAvailable(updateInfo);
            await showUpdateDetails(updateInfo);
            await showChangelog(updateInfo.latestVersion);
        } else {
            showNoUpdates(updateInfo);
        }
        
    } catch (error) {
        console.error('Error checking for updates:', error);
        showUpdateError(error.message);
    } finally {
        // Reset button
        checkBtn.disabled = false;
        checkBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 4v6h6"/>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
            </svg>
            Check Now
        `;
    }
}

function showUpdateAvailable(updateInfo) {
    const updateStatus = document.getElementById('updateStatus');
    const isSecurityUpdate = updateInfo.isSecurityUpdate;
    
    updateStatus.innerHTML = `
        <div class="update-available ${isSecurityUpdate ? 'update-security' : ''}">
            <h3>
                ${isSecurityUpdate ? '🛡️ Security Update Available' : '🎉 Update Available'}
            </h3>
            <p>
                Version ${updateInfo.latestVersion} is now available. 
                ${isSecurityUpdate ? 'This update includes important security fixes.' : 'This update includes new features and improvements.'}
            </p>
            <div class="update-actions">
                <button class="btn" onclick="openDownloadPage('${updateInfo.downloadUrl}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7,10 12,15 17,10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Download Update
                </button>
                <button class="btn" onclick="showChangelog('${updateInfo.latestVersion}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10,9 9,9 8,9"/>
                    </svg>
                    View Changes
                </button>
            </div>
        </div>
    `;
}

function showNoUpdates(updateInfo) {
    const updateStatus = document.getElementById('updateStatus');
    
    updateStatus.innerHTML = `
        <div class="no-updates">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22,4 12,14.01 9,11.01"/>
            </svg>
            <h3>You're up to date!</h3>
            <p>You are running the latest version (${updateInfo.currentVersion})</p>
        </div>
    `;
}

function showUpdateError(error) {
    const updateStatus = document.getElementById('updateStatus');
    
    updateStatus.innerHTML = `
        <div class="update-error">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <h3>Update Check Failed</h3>
            <p>${error}</p>
            <button class="btn btn-secondary" onclick="checkForUpdates()" style="margin-top: 12px;">
                Try Again
            </button>
        </div>
    `;
}

async function showUpdateDetails(updateInfo) {
    const updateDetails = document.getElementById('updateDetails');
    
    if (!updateDetails) return;
    
    const releaseDate = updateInfo.releaseDate ? 
        new Date(updateInfo.releaseDate).toLocaleDateString() : 'Unknown';
    
    updateDetails.innerHTML = `
        <h3>Update Details</h3>
        <div class="update-info">
            <div class="info-item">
                <span class="info-label">Current Version:</span>
                <span class="info-value">${updateInfo.currentVersion}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Latest Version:</span>
                <span class="info-value">${updateInfo.latestVersion}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Release Date:</span>
                <span class="info-value">${releaseDate}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Download Size:</span>
                <span class="info-value">${updateInfo.size || 'Unknown'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Update Type:</span>
                <span class="info-value">${updateInfo.isSecurityUpdate ? 'Security Update' : 'Feature Update'}</span>
            </div>
        </div>
    `;
    
    updateDetails.classList.remove('hidden');
}

async function showChangelog(version) {
    const changelogSection = document.getElementById('changelogSection');
    const changelogContent = document.getElementById('changelogContent');
    
    if (!changelogSection || !changelogContent) return;
    
    try {
        const changelog = await window.electronAPI.getChangelog(version);
        
        if (changelog) {
            changelogContent.innerHTML = `
                <div class="changelog-version">
                    <div class="changelog-header">
                        <span class="changelog-version-number">v${changelog.version}</span>
                        <span class="changelog-date">${changelog.releaseDate}</span>
                    </div>
                    
                    ${changelog.features && changelog.features.length > 0 ? `
                        <div class="changelog-category">
                            <h4>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <polyline points="16,12 12,8 8,12"/>
                                    <line x1="12" y1="16" x2="12" y2="8"/>
                                </svg>
                                New Features
                            </h4>
                            <ul>
                                ${changelog.features.map(feature => `<li>${feature}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${changelog.improvements && changelog.improvements.length > 0 ? `
                        <div class="changelog-category">
                            <h4>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                                </svg>
                                Improvements
                            </h4>
                            <ul>
                                ${changelog.improvements.map(improvement => `<li>${improvement}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${changelog.bugFixes && changelog.bugFixes.length > 0 ? `
                        <div class="changelog-category">
                            <h4>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="m8 2 1.88 1.88"/>
                                    <path d="M14.12 3.88 16 2"/>
                                    <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/>
                                    <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/>
                                    <path d="M12 20v-9"/>
                                    <path d="M6.53 9C4.6 8.8 3 7.1 3 5"/>
                                    <path d="M6 13H2"/>
                                    <path d="M3 21c0-2.1 1.7-3.9 3.8-4"/>
                                    <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/>
                                    <path d="M22 13h-4"/>
                                    <path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/>
                                </svg>
                                Bug Fixes
                            </h4>
                            <ul>
                                ${changelog.bugFixes.map(fix => `<li>${fix}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            `;
        } else {
            changelogContent.innerHTML = `
                <div class="no-updates">
                    <p>No changelog available for this version.</p>
                </div>
            `;
        }
        
        changelogSection.classList.remove('hidden');
    } catch (error) {
        console.error('Error loading changelog:', error);
        changelogContent.innerHTML = `
            <div class="update-error">
                <p>Failed to load changelog: ${error.message}</p>
            </div>
        `;
        changelogSection.classList.remove('hidden');
    }
}

function openDownloadPage(url) {
    // Open the download URL in the default browser
    if (window.electronAPI && window.electronAPI.openExternal) {
        window.electronAPI.openExternal(url).then((result) => {
            if (result.success) {
                showToast('Opening download page...', 'info');
            } else {
                showToast('Failed to open download page', 'error');
                console.log('Download URL:', url);
            }
        }).catch((error) => {
            console.error('Error opening external URL:', error);
            showToast('Download link: ' + url, 'info');
        });
    } else {
        console.log('Would open:', url);
        showToast('Download link: ' + url, 'info');
    }
}
// Handle uncaught errors
window.addEventListener('error', (event) => {
    console.error('Uncaught error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});
// Data Management Functions
function openThumbnailGallery() {
    // Create thumbnail gallery modal
    const modal = document.createElement('div');
    modal.className = 'thumbnail-gallery-modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeThumbnailGallery()"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3>
                    <img src="../assets/icons/gallery.svg" alt="Gallery" width="20" height="20">
                    Thumbnail Gallery
                </h3>
                <button class="close-btn" onclick="closeThumbnailGallery()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="thumbnail-grid" id="thumbnailGrid">
                    <div class="empty-state">
                        <img src="../assets/icons/gallery.svg" alt="No thumbnails" width="48" height="48" style="opacity: 0.3;">
                        <p>No thumbnails cached yet</p>
                        <small>Thumbnails will appear here after downloading videos</small>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="clearThumbnailCache()">
                    <img src="../assets/icons/delete.svg" alt="Clear" width="16" height="16">
                    Clear Cache
                </button>
                <button class="btn btn-primary" onclick="closeThumbnailGallery()">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    showToast('Thumbnail gallery opened', 'info');
}

function closeThumbnailGallery() {
    const modal = document.querySelector('.thumbnail-gallery-modal');
    if (modal) {
        modal.remove();
    }
}

function clearThumbnailCache() {
    // Clear thumbnail cache
    localStorage.removeItem('thumbnailCache');
    showToast('Thumbnail cache cleared', 'info');
    closeThumbnailGallery();
}

function exportSettingsData() {
    try {
        const settings = {
            theme: localStorage.getItem('theme'),
            wallpaperImage: localStorage.getItem('wallpaperImage'),
            wallpaperOpacity: localStorage.getItem('wallpaperOpacity'),
            wallpaperBlur: localStorage.getItem('wallpaperBlur'),
            defaultQuality: localStorage.getItem('defaultQuality'),
            defaultAudioQuality: localStorage.getItem('defaultAudioQuality'),
            defaultType: localStorage.getItem('defaultType'),
            autoDownload: localStorage.getItem('autoDownload'),
            showNotifications: localStorage.getItem('showNotifications'),
            downloadPath: localStorage.getItem('downloadPath')
        };
        
        const dataStr = JSON.stringify(settings, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `ytd-settings-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        showToast('Settings exported successfully', 'success');
    } catch (error) {
        console.error('Export failed:', error);
        showToast('Failed to export settings', 'error');
    }
}

function importSettingsData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const settings = JSON.parse(e.target.result);
                
                // Import settings
                Object.keys(settings).forEach(key => {
                    if (settings[key] !== null && settings[key] !== undefined) {
                        localStorage.setItem(key, settings[key]);
                    }
                });
                
                showToast('Settings imported successfully. Please restart the app.', 'success');
            } catch (error) {
                console.error('Import failed:', error);
                showToast('Failed to import settings', 'error');
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

function clearAllDataConfirm() {
    if (confirm('Are you sure you want to clear all data? This will reset all settings and cannot be undone.')) {
        clearAllData();
    }
}

function clearAllData() {
    try {
        // Clear all localStorage data
        localStorage.clear();
        
        // Reset theme
        currentTheme = 'dark';
        document.documentElement.setAttribute('data-theme', currentTheme);
        
        // Clear downloads
        downloadQueue.length = 0;
        activeDownloads.length = 0;
        completedDownloads.length = 0;
        
        // Update UI
        updateDownloadsList();
        updateStats();
        loadUISettings();
        
        showToast('All data cleared successfully', 'success');
    } catch (error) {
        console.error('Clear data failed:', error);
        showToast('Failed to clear data', 'error');
    }
} 