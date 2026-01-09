// New Features for YouTube Downloader Pro
// Thumbnail Gallery, Advanced Settings, and Enhanced UI

class ThumbnailGallery {
    constructor() {
        this.thumbnails = [];
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.init();
    }

    init() {
        this.createGalleryModal();
        this.loadThumbnails();
    }

    createGalleryModal() {
        const modal = document.createElement('div');
        modal.id = 'thumbnailGallery';
        modal.className = 'modal hidden';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>
                        <img src="assets/icons/gallery.svg" alt="Gallery" width="20" height="20">
                        Thumbnail Gallery
                    </h3>
                    <button class="close-btn" onclick="thumbnailGallery.close()">&times;</button>
                </div>
                <div class="gallery-controls">
                    <button class="btn btn-secondary" onclick="thumbnailGallery.refresh()">
                        <img src="assets/icons/refresh.svg" alt="Refresh" width="16" height="16">
                        Refresh
                    </button>
                    <button class="btn btn-secondary" onclick="thumbnailGallery.cleanup()">
                        <img src="assets/icons/delete.svg" alt="Cleanup" width="16" height="16">
                        Cleanup Old
                    </button>
                </div>
                <div class="gallery-grid" id="galleryGrid">
                    <div class="loading">Loading thumbnails...</div>
                </div>
                <div class="gallery-pagination" id="galleryPagination"></div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    async loadThumbnails() {
        try {
            const response = await fetch(`${API_URL}/api/thumbnails`);
            const data = await response.json();
            
            if (data.success) {
                this.thumbnails = data.data.thumbnails;
                this.renderGallery();
            }
        } catch (error) {
            console.error('Error loading thumbnails:', error);
            this.showError('Failed to load thumbnails');
        }
    }

    renderGallery() {
        const grid = document.getElementById('galleryGrid');
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageThumbnails = this.thumbnails.slice(startIndex, endIndex);

        if (pageThumbnails.length === 0) {
            grid.innerHTML = '<div class="empty-state">No thumbnails found</div>';
            return;
        }

        grid.innerHTML = pageThumbnails.map(thumb => `
            <div class="gallery-item">
                <img src="${API_URL}${thumb.url}" alt="Thumbnail" loading="lazy">
                <div class="gallery-item-info">
                    <div class="video-id">${thumb.videoId}</div>
                    <div class="file-size">${this.formatFileSize(thumb.size)}</div>
                    <div class="created-date">${new Date(thumb.created).toLocaleDateString()}</div>
                </div>
            </div>
        `).join('');

        this.renderPagination();
    }

    renderPagination() {
        const pagination = document.getElementById('galleryPagination');
        const totalPages = Math.ceil(this.thumbnails.length / this.itemsPerPage);

        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        
        if (this.currentPage > 1) {
            paginationHTML += `<button class="btn btn-secondary" onclick="thumbnailGallery.goToPage(${this.currentPage - 1})">Previous</button>`;
        }

        for (let i = 1; i <= totalPages; i++) {
            const active = i === this.currentPage ? 'active' : '';
            paginationHTML += `<button class="btn btn-secondary ${active}" onclick="thumbnailGallery.goToPage(${i})">${i}</button>`;
        }

        if (this.currentPage < totalPages) {
            paginationHTML += `<button class="btn btn-secondary" onclick="thumbnailGallery.goToPage(${this.currentPage + 1})">Next</button>`;
        }

        pagination.innerHTML = paginationHTML;
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderGallery();
    }

    async refresh() {
        await this.loadThumbnails();
        showToast('Thumbnails refreshed', 'success');
    }

    async cleanup() {
        try {
            const response = await fetch(`${API_URL}/api/thumbnails/cleanup`, {
                method: 'DELETE'
            });
            const data = await response.json();
            
            if (data.success) {
                showToast(`Cleaned ${data.data.cleaned} old thumbnails`, 'success');
                await this.loadThumbnails();
            }
        } catch (error) {
            console.error('Error cleaning thumbnails:', error);
            showToast('Failed to cleanup thumbnails', 'error');
        }
    }

    formatFileSize(bytes) {
        const sizes = ['B', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    open() {
        document.getElementById('thumbnailGallery').classList.remove('hidden');
        this.loadThumbnails();
    }

    close() {
        document.getElementById('thumbnailGallery').classList.add('hidden');
    }

    showError(message) {
        const grid = document.getElementById('galleryGrid');
        grid.innerHTML = `<div class="error-state">${message}</div>`;
    }
}

class WallpaperManager {
    constructor() {
        this.presets = [
            {
                name: 'Gradient Blue',
                type: 'gradient',
                value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            },
            {
                name: 'Gradient Purple',
                type: 'gradient', 
                value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
            },
            {
                name: 'Gradient Green',
                type: 'gradient',
                value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
            },
            {
                name: 'Dark Pattern',
                type: 'pattern',
                value: 'radial-gradient(circle at 25% 25%, #333 0%, #000 50%)'
            }
        ];
        this.init();
    }

    init() {
        this.addPresetButtons();
        this.addWallpaperHistory();
    }

    addPresetButtons() {
        const wallpaperOptions = document.querySelector('.wallpaper-options');
        if (!wallpaperOptions) return;

        const presetContainer = document.createElement('div');
        presetContainer.className = 'wallpaper-presets';
        presetContainer.innerHTML = `
            <label>Preset Wallpapers</label>
            <div class="preset-grid">
                ${this.presets.map((preset, index) => `
                    <button type="button" class="preset-btn" onclick="wallpaperManager.applyPreset(${index})" title="${preset.name}">
                        <div class="preset-preview" style="background: ${preset.value}"></div>
                        <span>${preset.name}</span>
                    </button>
                `).join('')}
            </div>
        `;
        
        wallpaperOptions.appendChild(presetContainer);
    }

    addWallpaperHistory() {
        const wallpaperSection = document.querySelector('.setting-group:has(#uploadWallpaper)');
        if (!wallpaperSection) return;

        const historyContainer = document.createElement('div');
        historyContainer.className = 'wallpaper-history';
        historyContainer.innerHTML = `
            <label>Recent Wallpapers</label>
            <div class="history-grid" id="wallpaperHistory">
                <div class="empty-history">No recent wallpapers</div>
            </div>
        `;
        
        wallpaperSection.appendChild(historyContainer);
        this.loadWallpaperHistory();
    }

    applyPreset(index) {
        const preset = this.presets[index];
        if (!preset) return;

        // Apply gradient/pattern as CSS background
        document.body.classList.add('has-wallpaper');
        document.body.style.setProperty('--wallpaper-url', preset.value);
        
        // Save as wallpaper setting
        settings.wallpaper = preset.value;
        settings.wallpaperType = preset.type;
        saveSettings();
        
        // Update preview
        const wallpaperPreview = document.getElementById('wallpaperPreview');
        const wallpaperImg = document.getElementById('wallpaperImg');
        if (wallpaperPreview && wallpaperImg) {
            wallpaperPreview.classList.remove('hidden');
            wallpaperImg.style.background = preset.value;
            wallpaperImg.src = ''; // Clear src for gradient backgrounds
        }
        
        this.saveToHistory(preset);
        showToast(`Applied ${preset.name} wallpaper`, 'success');
    }

    saveToHistory(wallpaper) {
        let history = JSON.parse(localStorage.getItem('ytd_wallpaper_history') || '[]');
        
        // Remove if already exists
        history = history.filter(item => item.value !== wallpaper.value);
        
        // Add to beginning
        history.unshift({
            ...wallpaper,
            timestamp: Date.now()
        });
        
        // Keep only last 6
        history = history.slice(0, 6);
        
        localStorage.setItem('ytd_wallpaper_history', JSON.stringify(history));
        this.loadWallpaperHistory();
    }

    loadWallpaperHistory() {
        const historyGrid = document.getElementById('wallpaperHistory');
        if (!historyGrid) return;

        const history = JSON.parse(localStorage.getItem('ytd_wallpaper_history') || '[]');
        
        if (history.length === 0) {
            historyGrid.innerHTML = '<div class="empty-history">No recent wallpapers</div>';
            return;
        }

        historyGrid.innerHTML = history.map((item, index) => `
            <button type="button" class="history-btn" onclick="wallpaperManager.applyFromHistory(${index})" title="${item.name}">
                <div class="history-preview" style="background: ${item.value}"></div>
            </button>
        `).join('');
    }

    applyFromHistory(index) {
        const history = JSON.parse(localStorage.getItem('ytd_wallpaper_history') || '[]');
        const wallpaper = history[index];
        if (!wallpaper) return;

        this.applyPreset(this.presets.findIndex(p => p.value === wallpaper.value) || 0);
    }

    clearHistory() {
        localStorage.removeItem('ytd_wallpaper_history');
        this.loadWallpaperHistory();
        showToast('Wallpaper history cleared', 'info');
    }
}

class AdvancedFeatures {
    constructor() {
        this.init();
    }

    init() {
        this.addKeyboardShortcuts();
        this.addContextMenu();
        this.addAdvancedSettings();
    }

    addKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+G - Open thumbnail gallery
            if (e.ctrlKey && e.key === 'g') {
                e.preventDefault();
                thumbnailGallery.open();
            }
            
            // Ctrl+Shift+C - Clear all data
            if (e.ctrlKey && e.shiftKey && e.key === 'C') {
                e.preventDefault();
                this.clearAllData();
            }
            
            // Ctrl+Shift+E - Export settings
            if (e.ctrlKey && e.shiftKey && e.key === 'E') {
                e.preventDefault();
                this.exportSettings();
            }
        });
    }

    addContextMenu() {
        document.addEventListener('contextmenu', (e) => {
            if (e.target.closest('.download-item')) {
                e.preventDefault();
                this.showDownloadContextMenu(e, e.target.closest('.download-item'));
            }
        });
    }

    addAdvancedSettings() {
        const settingsContent = document.querySelector('.settings-content');
        if (!settingsContent) return;

        const advancedSection = document.createElement('div');
        advancedSection.className = 'setting-group advanced-settings';
        advancedSection.innerHTML = `
            <label>Advanced Features</label>
            <div class="advanced-buttons">
                <button type="button" class="btn btn-secondary btn-small" onclick="thumbnailGallery.open()">
                    <img src="assets/icons/gallery.svg" alt="Gallery" width="16" height="16">
                    Thumbnail Gallery
                </button>
                <button type="button" class="btn btn-secondary btn-small" onclick="advancedFeatures.exportSettings()">
                    <img src="assets/icons/download.svg" alt="Export" width="16" height="16">
                    Export Settings
                </button>
                <button type="button" class="btn btn-secondary btn-small" onclick="advancedFeatures.importSettings()">
                    <img src="assets/icons/upload.svg" alt="Import" width="16" height="16">
                    Import Settings
                </button>
                <button type="button" class="btn btn-danger btn-small" onclick="advancedFeatures.clearAllData()">
                    <img src="assets/icons/delete.svg" alt="Clear" width="16" height="16">
                    Clear All Data
                </button>
            </div>
            <input type="file" id="settingsImport" accept=".json" style="display: none;">
        `;
        
        settingsContent.appendChild(advancedSection);
        
        // Add import handler
        document.getElementById('settingsImport').addEventListener('change', (e) => {
            this.handleSettingsImport(e);
        });
    }

    exportSettings() {
        const exportData = {
            settings: settings,
            history: downloadHistory,
            timestamp: Date.now(),
            version: '3.0.0'
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ytd-settings-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        showToast('Settings exported successfully', 'success');
    }

    importSettings() {
        document.getElementById('settingsImport').click();
    }

    handleSettingsImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importData = JSON.parse(event.target.result);
                
                if (importData.settings) {
                    Object.assign(settings, importData.settings);
                    saveSettings();
                    applyTheme(settings.theme);
                    applyWallpaper();
                }
                
                if (importData.history) {
                    downloadHistory = importData.history;
                    saveHistory();
                }
                
                showToast('Settings imported successfully', 'success');
                location.reload(); // Reload to apply all changes
            } catch (error) {
                showToast('Failed to import settings: Invalid file', 'error');
            }
        };
        reader.readAsText(file);
    }

    clearAllData() {
        if (!confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            return;
        }
        
        // Clear localStorage
        localStorage.removeItem('ytd_settings');
        localStorage.removeItem('ytd_history');
        localStorage.removeItem('ytd_wallpaper_history');
        localStorage.removeItem('ytd_wallpaper_cache');
        
        showToast('All data cleared', 'info');
        setTimeout(() => location.reload(), 1000);
    }

    showDownloadContextMenu(e, downloadItem) {
        // Implementation for download context menu
        console.log('Context menu for download item:', downloadItem);
    }
}

// Initialize new features
let thumbnailGallery, wallpaperManager, advancedFeatures;

document.addEventListener('DOMContentLoaded', () => {
    // Wait for main app to initialize
    setTimeout(() => {
        thumbnailGallery = new ThumbnailGallery();
        wallpaperManager = new WallpaperManager();
        advancedFeatures = new AdvancedFeatures();
    }, 1000);
});