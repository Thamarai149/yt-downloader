// Configuration
const API_URL = 'http://localhost:3000';
const socket = io(API_URL);

// State
let currentVideoInfo = null;
let downloads = new Map();

// DOM Elements
const urlInput = document.getElementById('urlInput');
const searchBtn = document.getElementById('searchBtn');
const videoInfo = document.getElementById('videoInfo');
const videoThumbnail = document.getElementById('videoThumbnail');
const videoTitle = document.getElementById('videoTitle');
const videoMeta = document.getElementById('videoMeta');
const downloadOptions = document.getElementById('downloadOptions');
const downloadBtn = document.getElementById('downloadBtn');
const qualitySelect = document.getElementById('qualitySelect');
const qualityGroup = document.getElementById('qualityGroup');
const downloadsList = document.getElementById('downloadsList');
const activeDownloadsEl = document.getElementById('activeDownloads');
const completedDownloadsEl = document.getElementById('completedDownloads');

// Event Listeners
searchBtn.addEventListener('click', handleSearch);
downloadBtn.addEventListener('click', handleDownload);

document.querySelectorAll('input[name="type"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        qualityGroup.style.display = e.target.value === 'video' ? 'flex' : 'none';
    });
});

urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

// Socket.IO Events
socket.on('connect', () => {
    console.log('Connected to server');
    showToast('Connected to server', 'success');
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    showToast('Disconnected from server', 'error');
});

socket.on('download:progress', (data) => {
    updateDownloadProgress(data);
});

// Functions
async function handleSearch() {
    const url = urlInput.value.trim();
    if (!url) {
        showToast('Please enter a YouTube URL', 'error');
        return;
    }

    searchBtn.disabled = true;
    searchBtn.innerHTML = '<span class="spinner"></span> Searching...';

    try {
        const response = await fetch(`${API_URL}/api/video/info`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch video info');
        }

        currentVideoInfo = data.data;
        displayVideoInfo(currentVideoInfo);
        showToast('Video info loaded', 'success');
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
}

async function handleDownload() {
    if (!currentVideoInfo) {
        showToast('Please search for a video first', 'error');
        return;
    }

    const type = document.querySelector('input[name="type"]:checked').value;
    const quality = type === 'video' ? qualitySelect.value : null;

    downloadBtn.disabled = true;
    downloadBtn.innerHTML = '<span class="spinner"></span> Starting...';

    try {
        const response = await fetch(`${API_URL}/api/download/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: urlInput.value.trim(),
                type,
                quality: quality ? `${quality}p` : 'best'
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to start download');
        }

        showToast('Download started', 'success');
        addDownloadCard(data.data);
    } catch (error) {
        showToast(error.message, 'error');
        console.error('Download error:', error);
    } finally {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = `
            <img src="assets/icons/download.svg" alt="Download" width="20" height="20">
            Download
        `;
    }
}

function addDownloadCard(downloadInfo) {
    // Remove empty state
    const emptyState = downloadsList.querySelector('.empty-state');
    if (emptyState) emptyState.remove();

    const card = document.createElement('div');
    card.className = 'download-card';
    card.id = `download-${downloadInfo.id}`;
    card.innerHTML = `
        <div class="download-header">
            <div class="download-title">${downloadInfo.title}</div>
            <span class="download-status status-downloading">
                <span class="spinner"></span>
                Downloading
            </span>
        </div>
        <div class="download-meta">
            ${downloadInfo.type} • ${downloadInfo.quality}
        </div>
        <div class="progress-bar">
            <div class="progress-fill" style="width: 0%"></div>
        </div>
        <div class="progress-text">0%</div>
    `;

    downloadsList.insertBefore(card, downloadsList.firstChild);
    downloads.set(downloadInfo.id, downloadInfo);
    updateStats();
}

function updateDownloadProgress(data) {
    const card = document.getElementById(`download-${data.downloadId}`);
    if (!card) return;

    const progressFill = card.querySelector('.progress-fill');
    const progressText = card.querySelector('.progress-text');
    const statusEl = card.querySelector('.download-status');

    progressFill.style.width = `${data.progress}%`;
    progressText.textContent = `${Math.round(data.progress)}%`;

    if (data.status === 'completed') {
        statusEl.className = 'download-status status-completed';
        statusEl.innerHTML = '<img src="assets/icons/success.svg" alt="Success" width="16" height="16"> Completed';
        showToast(`Download completed: ${data.title}`, 'success');
    } else if (data.status === 'failed') {
        statusEl.className = 'download-status status-failed';
        statusEl.innerHTML = '<img src="assets/icons/error.svg" alt="Error" width="16" height="16"> Failed';
        showToast(`Download failed: ${data.title}`, 'error');
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

function updateStats() {
    const active = Array.from(downloads.values()).filter(d => d.status === 'downloading').length;
    const completed = Array.from(downloads.values()).filter(d => d.status === 'completed').length;
    
    activeDownloadsEl.textContent = `${active} Active`;
    completedDownloadsEl.textContent = `${completed} Completed`;
}

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

// Initialize
console.log('YouTube Downloader Pro initialized');
