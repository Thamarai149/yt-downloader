import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import {
  Download, Search, List, Sun, Moon, Play, Music, History,
  BarChart3, Sparkles, Zap, X, Check, AlertCircle, Trash2, RefreshCw,
  Pause, XCircle, Copy, Share2, Clock, Gauge, Settings, Keyboard
} from 'lucide-react';

// Import styles
import './index.css';
import './modern-styles.css';

// Import components
import ExtraFeatures from './ExtraFeatures';
import AdvancedFeatures from './AdvancedFeatures';
import PlaylistDownloader from './PlaylistDownloader';
import ScheduleDownloader from './ScheduleDownloader';
import AIFeatures from './AIFeatures';
import SocialMediaOptimizer from './SocialMediaOptimizer';

// Types
interface VideoInfo {
  title: string;
  duration: number;
  uploader: string;
  view_count: number;
  thumbnail: string;
  upload_date: string;
  description: string;
  qualities: number[];
  formats: any[];
}

interface DownloadItem {
  id: string;
  title: string;
  url: string;
  type: string;
  quality: string;
  status: string;
  progress: number;
  startTime: Date;
  endTime?: Date;
  thumbnail?: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
  speed?: number;
  eta?: number;
  downloadedSize?: number;
}

interface SearchResult {
  id: string;
  title: string;
  url: string;
  duration: number;
  thumbnail: string;
  uploader: string;
  view_count: number;
}

type TabType = 'single' | 'batch' | 'search' | 'queue' | 'history' | 'analytics' | 'settings' | 'extras' | 'advanced' | 'playlist' | 'schedule' | 'ai' | 'social';
type DownloadType = 'video' | 'audio';
type QualityType = 'best' | '4k' | '2k' | '1080' | '720' | '480' | '360' | '240';

// Toast Notification Component
const Toast: React.FC<{ message: string; type: 'success' | 'error' | 'info'; onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <Check className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Sparkles className="w-5 h-5 text-blue-500" />
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="toast"
    >
      {icons[type]}
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="hover:opacity-70">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

// Main App Component
export default function AppEnhanced() {
  const backend = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

  // State
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('single');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<DownloadType>('video');
  const [quality, setQuality] = useState<QualityType>('best');
  const [loading, setLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [downloadHistory, setDownloadHistory] = useState<DownloadItem[]>([]);
  const [activeDownloads, setActiveDownloads] = useState<DownloadItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [downloadedFiles, setDownloadedFiles] = useState<any[]>([]);
  const [downloadPath, setDownloadPath] = useState('');
  const [userPresets, setUserPresets] = useState({
    downloads: '',
    videos: '',
    music: '',
    desktop: ''
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showFolderInstructions, setShowFolderInstructions] = useState(false);

  // Toast functions
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Socket.IO connection
  useEffect(() => {
    const socket = io(backend);

    socket.on('downloadStarted', (download: DownloadItem) => {
      setActiveDownloads(prev => [...prev, download]);
      showToast(`Download started: ${download.title}`, 'info');
    });

    socket.on('downloadProgress', (download: DownloadItem) => {
      setActiveDownloads(prev =>
        prev.map(d => d.id === download.id ? download : d)
      );
    });

    socket.on('downloadCompleted', (download: DownloadItem) => {
      setActiveDownloads(prev => prev.filter(d => d.id !== download.id));
      setDownloadHistory(prev => [download, ...prev]);
      showToast(`Download completed: ${download.title}`, 'success');
      playNotificationSound();
      showDesktopNotification('Download Complete!', `${download.title} has been downloaded successfully`);
      browseFiles(); // Refresh file list
    });

    socket.on('downloadFailed', (download: DownloadItem) => {
      setActiveDownloads(prev => prev.filter(d => d.id !== download.id));
      showToast(`Download failed: ${download.title}`, 'error');
    });

    return () => {
      socket.close();
    };
  }, [backend]);

  // Apply dark mode
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Fetch video info
  const fetchVideoInfo = useCallback(async () => {
    if (!url || !url.includes('youtube.com') && !url.includes('youtu.be')) return;

    setLoading(true);
    try {
      const response = await fetch(`${backend}/api/info?url=${encodeURIComponent(url)}`);
      const data = await response.json();

      if (response.ok) {
        setVideoInfo(data);
      } else {
        showToast(data.error || 'Failed to get video info', 'error');
        setVideoInfo(null);
      }
    } catch (err) {
      showToast('Failed to connect to server', 'error');
      setVideoInfo(null);
    }
    setLoading(false);
  }, [url, backend]);

  // Download handler
  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      showToast('Please paste a YouTube URL', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${backend}/api/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, type, quality })
      });

      const data = await response.json();

      if (response.ok) {
        showToast(`Download started: ${data.title}`, 'success');
        setActiveTab('queue');
      } else {
        showToast(data.error || 'Download failed', 'error');
      }
    } catch (err) {
      showToast('Failed to start download', 'error');
    }
    setLoading(false);
  };

  // Search videos
  const searchVideos = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`${backend}/api/search?query=${encodeURIComponent(searchQuery)}&limit=20`);
      const data = await response.json();

      if (response.ok) {
        setSearchResults(data.videos);
        showToast(`Found ${data.videos.length} videos`, 'success');

        // Add to recent searches
        if (!recentSearches.includes(searchQuery)) {
          const updated = [searchQuery, ...recentSearches].slice(0, 5);
          setRecentSearches(updated);
          localStorage.setItem('recentSearches', JSON.stringify(updated));
        }
      } else {
        showToast(data.error || 'Search failed', 'error');
        setSearchResults([]);
      }
    } catch (err) {
      showToast('Failed to search videos', 'error');
      setSearchResults([]);
    }
    setLoading(false);
  };

  // Load recent searches
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Copy URL to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast('URL copied to clipboard!', 'success');
    }).catch(() => {
      showToast('Failed to copy URL', 'error');
    });
  };

  // Format speed
  const formatSpeed = (bytesPerSecond: number) => {
    if (!bytesPerSecond) return '0 KB/s';
    const k = 1024;
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
    return Math.round((bytesPerSecond / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Format ETA
  const formatETA = (seconds: number) => {
    if (!seconds || seconds === Infinity) return 'Calculating...';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K - Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setActiveTab('search');
      }
      // Ctrl/Cmd + D - Go to downloads
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        setActiveTab('queue');
      }
      // Ctrl/Cmd + H - Go to history
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        setActiveTab('history');
      }
      // Ctrl/Cmd + / - Show shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setShowKeyboardShortcuts(true);
      }
      // Escape - Close modals
      if (e.key === 'Escape') {
        setShowKeyboardShortcuts(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Play notification sound
  const playNotificationSound = () => {
    if (!soundEnabled) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (err) {
      console.error('Failed to play notification sound:', err);
    }
  };

  // Clear history
  const clearHistory = async () => {
    try {
      await fetch(`${backend}/api/history`, { method: 'DELETE' });
      setDownloadHistory([]);
      showToast('History cleared', 'success');
    } catch (err) {
      showToast('Failed to clear history', 'error');
    }
  };

  // Browse downloaded files
  const browseFiles = async () => {
    try {
      const response = await fetch(`${backend}/api/files`);
      const data = await response.json();

      if (response.ok) {
        setDownloadedFiles(data.files);
        setDownloadPath(data.downloadPath);
        showToast(`Found ${data.files.length} files`, 'success');
      } else {
        showToast('Failed to browse files', 'error');
      }
    } catch (err) {
      showToast('Failed to browse files', 'error');
    }
  };

  // Update download path
  const updateDownloadPath = async () => {
    if (!downloadPath.trim()) {
      showToast('Please enter a valid path', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${backend}/api/download-path`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ downloadPath: downloadPath.trim() })
      });

      const data = await response.json();

      if (response.ok) {
        showToast('Download location updated successfully!', 'success');
        setDownloadPath(data.downloadPath);
        browseFiles(); // Refresh file list
      } else {
        showToast(data.error || 'Failed to update download location', 'error');
      }
    } catch (err) {
      showToast('Failed to update download location', 'error');
    }
    setLoading(false);
  };

  // Load files and download path on mount
  useEffect(() => {
    browseFiles();
    requestNotificationPermission();
    loadDownloadPath();
    loadUserPresets();
  }, []);

  // Load current download path from backend
  const loadDownloadPath = async () => {
    try {
      const response = await fetch(`${backend}/api/download-path`);
      const data = await response.json();
      if (response.ok && data.downloadPath) {
        setDownloadPath(data.downloadPath);
      }
    } catch (err) {
      console.error('Failed to load download path:', err);
    }
  };

  // Load user-specific path presets
  const loadUserPresets = async () => {
    try {
      const response = await fetch(`${backend}/api/user-info`);
      const data = await response.json();
      if (response.ok && data.presets) {
        setUserPresets(data.presets);
      }
    } catch (err) {
      console.error('Failed to load user presets:', err);
    }
  };

  // Request notification permission
  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  // Show desktop notification
  const showDesktopNotification = (title: string, body: string) => {
    if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    }
  };

  // Open file location - Show instructions
  const openFileLocation = () => {
    // Copy path to clipboard
    navigator.clipboard.writeText(downloadPath).then(() => {
      showToast('✅ Path copied to clipboard!', 'success');
    }).catch(() => {
      showToast('❌ Failed to copy path', 'error');
    });

    // Show instructions modal
    setShowFolderInstructions(true);
  };

  // Delete file
  const deleteFile = async (fileName: string) => {
    if (!confirm(`Delete ${fileName}?`)) return;

    try {
      const response = await fetch(`${backend}/api/files/${encodeURIComponent(fileName)}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showToast('File deleted successfully', 'success');
        browseFiles(); // Refresh list
      } else {
        showToast('Failed to delete file', 'error');
      }
    } catch (err) {
      showToast('Failed to delete file', 'error');
    }
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Get analytics
  const getAnalytics = () => {
    const totalDownloads = downloadHistory.length;
    const videoDownloads = downloadHistory.filter(d => d.type === 'video').length;
    const audioDownloads = downloadHistory.filter(d => d.type === 'audio').length;
    const completedDownloads = downloadHistory.filter(d => d.status === 'completed').length;
    const totalSize = downloadHistory.reduce((acc, d) => acc + (d.fileSize || 0), 0);

    return {
      totalDownloads,
      videoDownloads,
      audioDownloads,
      completedDownloads,
      totalSize,
      successRate: totalDownloads > 0 ? ((completedDownloads / totalDownloads) * 100).toFixed(1) : '0'
    };
  };

  const analytics = getAnalytics();

  return (
    <div className="app-container" data-theme={darkMode ? 'dark' : 'light'}>
      {/* Toast Container */}
      <div className="toast-container">
        <AnimatePresence>
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Floating Download Counter */}
      {activeDownloads.length > 0 && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="floating-download-counter"
          onClick={() => setActiveTab('queue')}
        >
          <div className="counter-icon">
            <Download className="w-6 h-6" />
            <span className="counter-badge">{activeDownloads.length}</span>
          </div>
          <div className="counter-text">
            <span className="counter-label">Active Downloads</span>
            <span className="counter-value">{activeDownloads.length} in progress</span>
          </div>
        </motion.div>
      )}



      <div className="container min-h-screen p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-6"
        >
          <h1 className="gradient-text">
            <span className="animated-icon">🎥</span> YT Downloader Pro
          </h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="btn btn-secondary"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="tab-nav-modern mb-6">
          <button
            className={`tab-button-modern ${activeTab === 'single' ? 'active' : ''}`}
            onClick={() => setActiveTab('single')}
          >
            <Download className="w-4 h-4" />
            Single
          </button>
          <button
            className={`tab-button-modern ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            <Search className="w-4 h-4" />
            Search
          </button>
          <button
            className={`tab-button-modern ${activeTab === 'queue' ? 'active' : ''}`}
            onClick={() => setActiveTab('queue')}
          >
            <Play className="w-4 h-4" />
            Queue {activeDownloads.length > 0 && `(${activeDownloads.length})`}
          </button>
          <button
            className={`tab-button-modern ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History className="w-4 h-4" />
            History
          </button>
          <button
            className={`tab-button-modern ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </button>
          <button
            className={`tab-button-modern ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <button
            className={`tab-button-modern ${activeTab === 'extras' ? 'active' : ''}`}
            onClick={() => setActiveTab('extras')}
          >
            <Sparkles className="w-4 h-4" />
            Extras
          </button>
          <button
            className={`tab-button-modern ${activeTab === 'advanced' ? 'active' : ''}`}
            onClick={() => setActiveTab('advanced')}
          >
            <Zap className="w-4 h-4" />
            Advanced
          </button>
          <button
            className={`tab-button-modern ${activeTab === 'playlist' ? 'active' : ''}`}
            onClick={() => setActiveTab('playlist')}
          >
            <List className="w-4 h-4" />
            Playlist
          </button>
          <button
            className={`tab-button-modern ${activeTab === 'schedule' ? 'active' : ''}`}
            onClick={() => setActiveTab('schedule')}
          >
            <Clock className="w-4 h-4" />
            Schedule
          </button>
          <button
            className={`tab-button-modern ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            <Sparkles className="w-4 h-4" />
            AI Tools
          </button>
          <button
            className={`tab-button-modern ${activeTab === 'social' ? 'active' : ''}`}
            onClick={() => setActiveTab('social')}
          >
            <Share2 className="w-4 h-4" />
            Social
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {/* Single Download Tab */}
              {activeTab === 'single' && (
                <motion.div
                  key="single"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="main-card p-6"
                >
                  <div className="section-header-modern">
                    <div className="icon">
                      <Download className="w-5 h-5" />
                    </div>
                    <h2>Single Video Download</h2>
                  </div>

                  <form onSubmit={handleDownload} className="space-y-4">
                    <div className="input-group">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onBlur={fetchVideoInfo}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="input-field-modern"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Type</label>
                        <div className="radio-group">
                          <label className="radio-item">
                            <input
                              type="radio"
                              name="type"
                              value="video"
                              checked={type === 'video'}
                              onChange={(e) => setType(e.target.value as DownloadType)}
                              className="radio-input"
                            />
                            <Play className="w-4 h-4" />
                            Video
                          </label>
                          <label className="radio-item">
                            <input
                              type="radio"
                              name="type"
                              value="audio"
                              checked={type === 'audio'}
                              onChange={(e) => setType(e.target.value as DownloadType)}
                              className="radio-input"
                            />
                            <Music className="w-4 h-4" />
                            Audio
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Quality</label>
                        <select
                          value={quality}
                          onChange={(e) => setQuality(e.target.value as QualityType)}
                          className="select-field"
                        >
                          <option value="best">Best Quality</option>
                          <option value="4k">4K (2160p)</option>
                          <option value="2k">2K (1440p)</option>
                          <option value="1080">1080p</option>
                          <option value="720">720p</option>
                          <option value="480">480p</option>
                          <option value="360">360p</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !url}
                      className="btn btn-primary w-full glow-effect"
                    >
                      {loading ? (
                        <>
                          <div className="spinner-modern" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Zap className="w-5 h-5" />
                          Download Now
                        </>
                      )}
                    </button>
                  </form>

                  {/* Video Info Preview */}
                  {videoInfo && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 video-card-modern"
                    >
                      <img
                        src={videoInfo.thumbnail}
                        alt={videoInfo.title}
                        className="video-thumbnail"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"%3E%3Crect fill="%236366f1" width="320" height="180"/%3E%3Ctext fill="white" font-family="Arial" font-size="20" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3E🎬 Video%3C/text%3E%3C/svg%3E';
                          target.onerror = null;
                        }}
                      />
                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-2">{videoInfo.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {videoInfo.uploader} • {formatDuration(videoInfo.duration)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          {videoInfo.view_count?.toLocaleString()} views
                        </p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Search Tab */}
              {activeTab === 'search' && (
                <motion.div
                  key="search"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="main-card p-6"
                >
                  <div className="section-header-modern">
                    <div className="icon">
                      <Search className="w-5 h-5" />
                    </div>
                    <h2>Search YouTube</h2>
                  </div>

                  <div className="flex gap-2 mb-6">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchVideos()}
                      placeholder="Search for videos..."
                      className="input-field-modern flex-1"
                    />
                    <button
                      onClick={searchVideos}
                      disabled={loading}
                      className="btn btn-primary"
                    >
                      <Search className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {searchResults.map((video) => (
                      <div key={video.id} className="video-card-modern hover-lift-modern">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="video-thumbnail"
                          onError={(e) => {
                            // Fallback to a placeholder if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"%3E%3Crect fill="%236366f1" width="320" height="180"/%3E%3Ctext fill="white" font-family="Arial" font-size="20" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3E🎬 Video%3C/text%3E%3C/svg%3E';
                            target.onerror = null; // Prevent infinite loop
                          }}
                        />
                        <div className="p-4">
                          <h3 className="font-semibold mb-2">{video.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {video.uploader} • {formatDuration(video.duration)}
                          </p>
                          <button
                            onClick={() => {
                              setUrl(video.url);
                              setActiveTab('single');
                            }}
                            className="btn btn-primary mt-3"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Queue Tab */}
              {activeTab === 'queue' && (
                <motion.div
                  key="queue"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="main-card p-6"
                >
                  <div className="section-header-modern">
                    <div className="icon">
                      <Play className="w-5 h-5" />
                    </div>
                    <h2>Download Queue</h2>
                  </div>

                  {activeDownloads.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">📭</div>
                      <h3 className="empty-state-title">No active downloads</h3>
                      <p className="empty-state-description">Start downloading to see progress here</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeDownloads.map((download) => (
                        <div key={download.id} className="download-item-enhanced">
                          <div className="download-header">
                            {download.thumbnail && (
                              <img
                                src={download.thumbnail}
                                alt={download.title}
                                className="download-thumbnail"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"%3E%3Crect fill="%236366f1" width="120" height="80"/%3E%3Ctext fill="white" font-family="Arial" font-size="12" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3E🎬%3C/text%3E%3C/svg%3E';
                                  target.onerror = null;
                                }}
                              />
                            )}
                            <div className="download-info">
                              <h4 className="download-title">{download.title}</h4>
                              <div className="download-meta">
                                <span className="badge-modern">{download.type}</span>
                                <span className="badge-modern">{download.quality || 'best'}</span>
                                <span className="status-badge">{download.status}</span>
                              </div>
                            </div>
                          </div>

                          <div className="progress-container-enhanced">
                            <div className="progress-info">
                              <span className="progress-percentage">{download.progress}%</span>
                              <span className="progress-status">
                                {download.progress < 100 ? 'Downloading...' : 'Complete'}
                              </span>
                            </div>
                            <div className="progress-bar-enhanced">
                              <div
                                className="progress-fill-enhanced"
                                style={{ width: `${download.progress}%` }}
                              >
                                <div className="progress-shine"></div>
                              </div>
                              <div className="progress-glow" style={{ width: `${download.progress}%` }}></div>
                            </div>
                            <div className="progress-details">
                              <span className="detail-item">
                                <Gauge className="w-4 h-4" />
                                {download.speed ? formatSpeed(download.speed) : '0 KB/s'}
                              </span>
                              <span className="detail-item">
                                <Clock className="w-4 h-4" />
                                {download.eta ? formatETA(download.eta) : 'Calculating...'}
                              </span>
                              {download.fileSize && (
                                <span className="detail-item">
                                  <Download className="w-4 h-4" />
                                  {formatFileSize(download.downloadedSize || 0)} / {formatFileSize(download.fileSize)}
                                </span>
                              )}
                            </div>
                            <div className="download-actions">
                              <button className="action-btn" title="Copy URL" onClick={() => copyToClipboard(download.url)}>
                                <Copy className="w-4 h-4" />
                              </button>
                              <button className="action-btn pause" title="Pause">
                                <Pause className="w-4 h-4" />
                              </button>
                              <button className="action-btn cancel" title="Cancel">
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* History Tab */}
              {activeTab === 'history' && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="main-card p-6"
                >
                  <div className="section-header-modern">
                    <div className="icon">
                      <History className="w-5 h-5" />
                    </div>
                    <h2>Download History</h2>
                    {downloadHistory.length > 0 && (
                      <button onClick={clearHistory} className="btn btn-danger ml-auto">
                        <Trash2 className="w-4 h-4" />
                        Clear
                      </button>
                    )}
                  </div>

                  {downloadHistory.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">📜</div>
                      <h3 className="empty-state-title">No download history</h3>
                      <p className="empty-state-description">Your completed downloads will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {downloadHistory.map((download) => (
                        <div key={download.id} className="history-item-enhanced">
                          <div className="history-header">
                            {download.thumbnail && (
                              <img
                                src={download.thumbnail}
                                alt={download.title}
                                className="history-thumbnail"
                              />
                            )}
                            <div className="history-info">
                              <h4 className="history-title">{download.title}</h4>
                              <div className="history-meta">
                                <span className="meta-item">
                                  <span className="meta-icon">📁</span>
                                  {download.fileName}
                                </span>
                                {download.fileSize && (
                                  <span className="meta-item">
                                    <span className="meta-icon">📦</span>
                                    {formatFileSize(download.fileSize)}
                                  </span>
                                )}
                                <span className="meta-item">
                                  <span className="meta-icon">🎬</span>
                                  {download.type}
                                </span>
                              </div>
                            </div>
                            <div className="history-actions">
                              <span className={`status-badge-large ${download.status === 'completed' ? 'success' : 'error'}`}>
                                {download.status === 'completed' ? '✓ Completed' : '✗ Failed'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Analytics Tab */}
              {activeTab === 'analytics' && (
                <motion.div
                  key="analytics"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="main-card p-6"
                >
                  <div className="section-header-modern">
                    <div className="icon">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <h2>Analytics</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="stat-card-modern">
                      <div className="stat-value-modern">{analytics.totalDownloads}</div>
                      <div className="stat-label-modern">Total Downloads</div>
                    </div>
                    <div className="stat-card-modern">
                      <div className="stat-value-modern">{analytics.videoDownloads}</div>
                      <div className="stat-label-modern">Videos</div>
                    </div>
                    <div className="stat-card-modern">
                      <div className="stat-value-modern">{analytics.audioDownloads}</div>
                      <div className="stat-label-modern">Audio</div>
                    </div>
                    <div className="stat-card-modern">
                      <div className="stat-value-modern">{analytics.successRate}%</div>
                      <div className="stat-label-modern">Success Rate</div>
                    </div>
                  </div>

                  <div className="mt-6 stat-card-modern">
                    <div className="stat-label-modern mb-2">Total Size Downloaded</div>
                    <div className="stat-value-modern">{formatFileSize(analytics.totalSize)}</div>
                  </div>
                </motion.div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="main-card p-6"
                >
                  <div className="section-header-modern">
                    <div className="icon">
                      <Settings className="w-5 h-5" />
                    </div>
                    <h2>Settings</h2>
                  </div>

                  <div className="space-y-6">
                    {/* Appearance Settings */}
                    <div className="settings-section">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        Appearance
                      </h3>
                      <div className="settings-item">
                        <div className="settings-item-info">
                          <label className="settings-label">Dark Mode</label>
                          <p className="settings-description">Toggle between light and dark theme</p>
                        </div>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={darkMode}
                            onChange={(e) => setDarkMode(e.target.checked)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    </div>

                    {/* Notification Settings */}
                    <div className="settings-section">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        Notifications
                      </h3>
                      <div className="settings-item">
                        <div className="settings-item-info">
                          <label className="settings-label">Sound Notifications</label>
                          <p className="settings-description">Play sound when downloads complete</p>
                        </div>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={soundEnabled}
                            onChange={(e) => setSoundEnabled(e.target.checked)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                      <div className="settings-item">
                        <div className="settings-item-info">
                          <label className="settings-label">Desktop Notifications</label>
                          <p className="settings-description">Show browser notifications when downloads complete</p>
                        </div>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={notificationsEnabled}
                            onChange={(e) => setNotificationsEnabled(e.target.checked)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                      <div className="settings-item">
                        <div className="settings-item-info">
                          <label className="settings-label">Test Sound</label>
                          <p className="settings-description">Preview notification sound</p>
                        </div>
                        <button
                          onClick={playNotificationSound}
                          className="btn btn-secondary"
                        >
                          <Music className="w-4 h-4" />
                          Play Sound
                        </button>
                      </div>
                    </div>

                    {/* Download Settings */}
                    <div className="settings-section">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Download className="w-5 h-5" />
                        Downloads
                      </h3>
                      <div className="settings-item">
                        <div className="settings-item-info">
                          <label className="settings-label">Default Quality</label>
                          <p className="settings-description">Set default video quality</p>
                        </div>
                        <select
                          value={quality}
                          onChange={(e) => setQuality(e.target.value as QualityType)}
                          className="select-field"
                        >
                          <option value="best">Best Quality</option>
                          <option value="4k">4K (2160p)</option>
                          <option value="2k">2K (1440p)</option>
                          <option value="1080">1080p</option>
                          <option value="720">720p</option>
                          <option value="480">480p</option>
                          <option value="360">360p</option>
                        </select>
                      </div>
                      <div className="settings-item">
                        <div className="settings-item-info">
                          <label className="settings-label">Default Type</label>
                          <p className="settings-description">Set default download type</p>
                        </div>
                        <div className="radio-group">
                          <label className="radio-item">
                            <input
                              type="radio"
                              name="default-type"
                              value="video"
                              checked={type === 'video'}
                              onChange={(e) => setType(e.target.value as DownloadType)}
                              className="radio-input"
                            />
                            <Play className="w-4 h-4" />
                            Video
                          </label>
                          <label className="radio-item">
                            <input
                              type="radio"
                              name="default-type"
                              value="audio"
                              checked={type === 'audio'}
                              onChange={(e) => setType(e.target.value as DownloadType)}
                              className="radio-input"
                            />
                            <Music className="w-4 h-4" />
                            Audio
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Data Management */}
                    <div className="settings-section">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Trash2 className="w-5 h-5" />
                        Data Management
                      </h3>
                      <div className="settings-item">
                        <div className="settings-item-info">
                          <label className="settings-label">Clear History</label>
                          <p className="settings-description">Remove all download history</p>
                        </div>
                        <button
                          onClick={clearHistory}
                          className="btn btn-danger"
                          disabled={downloadHistory.length === 0}
                        >
                          <Trash2 className="w-4 h-4" />
                          Clear History
                        </button>
                      </div>
                      <div className="settings-item">
                        <div className="settings-item-info">
                          <label className="settings-label">Clear Search History</label>
                          <p className="settings-description">Remove recent searches</p>
                        </div>
                        <button
                          onClick={() => {
                            setRecentSearches([]);
                            localStorage.removeItem('recentSearches');
                            showToast('Search history cleared', 'success');
                          }}
                          className="btn btn-danger"
                          disabled={recentSearches.length === 0}
                        >
                          <Trash2 className="w-4 h-4" />
                          Clear Searches
                        </button>
                      </div>
                    </div>

                    {/* Download Location */}
                    <div className="settings-section">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <List className="w-5 h-5" />
                        Download Location
                      </h3>
                      <div className="settings-item download-location-item">
                        <div className="w-full mb-3">
                          <label className="settings-label">Current Save Path</label>
                          <p className="settings-description text-xs break-all font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded mt-2">
                            {downloadPath || 'Loading...'}
                          </p>
                        </div>
                        <div className="w-full space-y-3">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={downloadPath}
                              onChange={(e) => setDownloadPath(e.target.value)}
                              placeholder="Enter custom download path..."
                              className="input-field-modern flex-1"
                            />
                            <button
                              onClick={updateDownloadPath}
                              className="btn btn-primary"
                              disabled={loading}
                            >
                              <Check className="w-4 h-4" />
                              Update
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={browseFiles}
                              className="btn btn-secondary"
                            >
                              <RefreshCw className="w-4 h-4" />
                              Refresh Files
                            </button>
                            <button
                              onClick={openFileLocation}
                              className="btn btn-secondary"
                            >
                              <List className="w-4 h-4" />
                              Open Folder
                            </button>
                          </div>

                          {/* Quick Path Presets */}
                          <div className="mt-4">
                            <label className="text-sm font-medium mb-2 block">Quick Presets (Your PC):</label>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => setDownloadPath(userPresets.downloads)}
                                className="btn btn-secondary text-xs"
                                disabled={!userPresets.downloads}
                              >
                                📥 Default Downloads
                              </button>
                              <button
                                onClick={() => setDownloadPath(userPresets.videos)}
                                className="btn btn-secondary text-xs"
                                disabled={!userPresets.videos}
                              >
                                🎬 Videos Folder
                              </button>
                              <button
                                onClick={() => setDownloadPath(userPresets.music)}
                                className="btn btn-secondary text-xs"
                                disabled={!userPresets.music}
                              >
                                🎵 Music Folder
                              </button>
                              <button
                                onClick={() => setDownloadPath(userPresets.desktop)}
                                className="btn btn-secondary text-xs"
                                disabled={!userPresets.desktop}
                              >
                                🖥️ Desktop
                              </button>
                            </div>
                          </div>

                          {/* Path Instructions */}
                          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-xs text-blue-800 dark:text-blue-200">
                              💡 <strong>Tip:</strong> Click a preset button to use your PC's folders, or type a custom path.
                              The folder will be created automatically if it doesn't exist.
                            </p>
                            {userPresets.downloads && (
                              <p className="text-xs text-blue-600 dark:text-blue-300 mt-2">
                                📁 Your Downloads: <code className="bg-white dark:bg-gray-800 px-1 rounded">{userPresets.downloads}</code>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      {downloadedFiles.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-2">📂 Downloaded Files ({downloadedFiles.length})</p>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {downloadedFiles.slice(0, 10).map((file, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                                <span className="text-2xl">{file.ext === '.mp4' ? '🎬' : '🎵'}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{file.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                                  </p>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${file.ext === '.mp4'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                  : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  }`}>
                                  {file.ext.toUpperCase().replace('.', '')}
                                </span>
                                <button
                                  onClick={() => deleteFile(file.name)}
                                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                                  title="Delete file"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                              </div>
                            ))}
                          </div>
                          {downloadedFiles.length > 10 && (
                            <p className="text-xs text-gray-500 mt-2 text-center">
                              Showing 10 of {downloadedFiles.length} files
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Keyboard Shortcuts */}
                    <div className="settings-section">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Keyboard className="w-5 h-5" />
                        Keyboard Shortcuts
                      </h3>
                      <div className="settings-item">
                        <div className="settings-item-info">
                          <label className="settings-label">View Shortcuts</label>
                          <p className="settings-description">See all available keyboard shortcuts</p>
                        </div>
                        <button
                          onClick={() => setShowKeyboardShortcuts(true)}
                          className="btn btn-secondary"
                        >
                          <Keyboard className="w-4 h-4" />
                          Show Shortcuts
                        </button>
                      </div>
                    </div>

                    {/* About */}
                    <div className="settings-section">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        About
                      </h3>
                      <div className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/20">
                        <h4 className="font-semibold mb-2">YT Downloader Pro</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Version 1.0.0
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          A modern, feature-rich YouTube downloader with real-time progress tracking,
                          search capabilities, and analytics.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Extras Tab */}
              {activeTab === 'extras' && (
                <motion.div
                  key="extras"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <ExtraFeatures backend={backend} showToast={showToast} />
                </motion.div>
              )}

              {/* Advanced Tools Tab */}
              {activeTab === 'advanced' && (
                <motion.div
                  key="advanced"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <AdvancedFeatures backend={backend} showToast={showToast} />
                </motion.div>
              )}

              {/* Playlist Downloader Tab */}
              {activeTab === 'playlist' && (
                <motion.div
                  key="playlist"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <PlaylistDownloader backend={backend} showToast={showToast} />
                </motion.div>
              )}

              {/* Schedule Downloader Tab */}
              {activeTab === 'schedule' && (
                <motion.div
                  key="schedule"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <ScheduleDownloader backend={backend} showToast={showToast} />
                </motion.div>
              )}

              {/* AI Tools Tab */}
              {activeTab === 'ai' && (
                <motion.div
                  key="ai"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <AIFeatures backend={backend} showToast={showToast} />
                </motion.div>
              )}

              {/* Social Media Optimizer Tab */}
              {activeTab === 'social' && (
                <motion.div
                  key="social"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <SocialMediaOptimizer backend={backend} showToast={showToast} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="main-card p-6"
            >
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                Quick Stats
              </h3>
              <div className="space-y-4">
                <div className="stat-item-mini">
                  <div className="stat-icon-mini active">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="stat-content-mini">
                    <span className="stat-label-mini">Active</span>
                    <span className="stat-value-mini">{activeDownloads.length}</span>
                  </div>
                </div>
                <div className="stat-item-mini">
                  <div className="stat-icon-mini success">
                    <Check className="w-4 h-4" />
                  </div>
                  <div className="stat-content-mini">
                    <span className="stat-label-mini">Completed</span>
                    <span className="stat-value-mini">{analytics.completedDownloads}</span>
                  </div>
                </div>
                <div className="stat-item-mini">
                  <div className="stat-icon-mini total">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div className="stat-content-mini">
                    <span className="stat-label-mini">Total</span>
                    <span className="stat-value-mini">{analytics.totalDownloads}</span>
                  </div>
                </div>
                <div className="stat-item-mini">
                  <div className="stat-icon-mini storage">
                    <Download className="w-4 h-4" />
                  </div>
                  <div className="stat-content-mini">
                    <span className="stat-label-mini">Downloaded</span>
                    <span className="stat-value-mini">{formatFileSize(analytics.totalSize)}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="main-card p-6"
            >
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-500" />
                Features
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="feature-item">
                  <div className="feature-icon">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>4K/2K Support</span>
                </li>
                <li className="feature-item">
                  <div className="feature-icon">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>Audio Extraction</span>
                </li>
                <li className="feature-item">
                  <div className="feature-icon">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>Real-time Progress</span>
                </li>
                <li className="feature-item">
                  <div className="feature-icon">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>Search & Download</span>
                </li>
                <li className="feature-item">
                  <div className="feature-icon">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>Download History</span>
                </li>
                <li className="feature-item">
                  <div className="feature-icon">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>Dark Mode</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Folder Instructions Modal */}
      <AnimatePresence>
        {showFolderInstructions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowFolderInstructions(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <List className="w-6 h-6" />
                  📂 Open Download Folder
                </h2>
                <button
                  onClick={() => setShowFolderInstructions(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="text-sm font-semibold mb-2">📍 Folder Location:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-white dark:bg-gray-700 p-2 rounded break-all">
                      {downloadPath}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(downloadPath);
                        showToast('✅ Copied!', 'success');
                      }}
                      className="btn btn-secondary p-2"
                      title="Copy path"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">🔧 How to Open:</h3>

                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                      1
                    </div>
                    <div>
                      <p className="font-semibold">Press Win + R</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Opens the "Run" dialog on Windows
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                      2
                    </div>
                    <div>
                      <p className="font-semibold">Paste the Path</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Press Ctrl + V (path is already copied!)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">
                      3
                    </div>
                    <div>
                      <p className="font-semibold">Press Enter</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Folder will open in File Explorer!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <p className="text-sm text-center">
                    ✅ <strong>Path copied to clipboard!</strong> Ready to paste.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(downloadPath);
                    showToast('✅ Path copied!', 'success');
                  }}
                  className="btn btn-secondary flex-1"
                >
                  <Copy className="w-4 h-4" />
                  Copy Path Again
                </button>
                <button
                  onClick={() => setShowFolderInstructions(false)}
                  className="btn btn-primary flex-1"
                >
                  Got it!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Modal */}
      <AnimatePresence>
        {showKeyboardShortcuts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowKeyboardShortcuts(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Keyboard className="w-6 h-6" />
                  Keyboard Shortcuts
                </h2>
                <button
                  onClick={() => setShowKeyboardShortcuts(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="text-sm font-medium">Search Videos</span>
                  <kbd className="px-2 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-xs font-mono">
                    Ctrl + K
                  </kbd>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="text-sm font-medium">Go to Downloads</span>
                  <kbd className="px-2 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-xs font-mono">
                    Ctrl + D
                  </kbd>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="text-sm font-medium">Go to History</span>
                  <kbd className="px-2 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-xs font-mono">
                    Ctrl + H
                  </kbd>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="text-sm font-medium">Show Shortcuts</span>
                  <kbd className="px-2 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-xs font-mono">
                    Ctrl + /
                  </kbd>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="text-sm font-medium">Close Modal</span>
                  <kbd className="px-2 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-xs font-mono">
                    Esc
                  </kbd>
                </div>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowKeyboardShortcuts(false)}
                  className="btn btn-primary"
                >
                  Got it!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}