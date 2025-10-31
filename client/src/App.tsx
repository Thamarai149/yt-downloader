import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import {
    Download,
    Search,
    List,
    Sun,
    Moon,
    Plus,
    Trash2,
    RefreshCw,
    Link,
    Play,
    Music,
    History,
    Settings
} from 'lucide-react';

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

type TabType = 'single' | 'batch' | 'search' | 'queue' | 'history' | 'settings' | 'playlist' | 'scheduler' | 'analytics';
type DownloadType = 'video' | 'audio';
type QualityType = 'best' | '4k' | '2k' | '1080' | '720' | '480' | '360' | '240';

interface PlaylistInfo {
    id: string;
    title: string;
    videoCount: number;
    videos: SearchResult[];
}

interface ScheduledDownload {
    id: string;
    url: string;
    title: string;
    type: DownloadType;
    quality: QualityType;
    scheduledTime: Date;
    status: 'pending' | 'running' | 'completed' | 'failed';
}

// Components
const Button: React.FC<{
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    disabled?: boolean;
    onClick?: () => void;
    type?: 'button' | 'submit';
    icon?: React.ReactNode;
    className?: string;
}> = ({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    onClick,
    type = 'button',
    icon,
    className = ''
}) => {
        const baseClasses = 'grand-btn';
        const variantClasses = {
            primary: 'grand-btn-primary',
            secondary: 'grand-btn-glass',
            danger: 'grand-btn-secondary',
            success: 'grand-btn-accent'
        };

        return (
            <button
                type={type}
                className={`${baseClasses} ${variantClasses[variant]} ${className}`}
                onClick={onClick}
                disabled={disabled || loading}
            >
                {loading ? (
                    <div className="icon-spin">⏳</div>
                ) : icon}
                {children}
            </button>
        );
    };

const Input: React.FC<{
    type?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    label?: string;
    icon?: React.ReactNode;
    required?: boolean;
    className?: string;
}> = ({
    type = 'text',
    value,
    onChange,
    placeholder,
    label,
    icon,
    required = false,
    className = ''
}) => {
        return (
            <div className={`grand-input-group ${icon ? 'grand-input-icon' : ''} ${className}`}>
                {label && (
                    <label className="grand-input-label">
                        {label}
                    </label>
                )}
                {icon && <span className="grand-input-icon-left">{icon}</span>}
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    className="grand-input"
                />
            </div>
        );
    };

const VideoCard: React.FC<{
    video: VideoInfo | SearchResult;
    onDownload?: () => void;
    onSelect?: () => void;
    selected?: boolean;
    showCheckbox?: boolean;
}> = ({ video, onDownload, onSelect, selected = false, showCheckbox = false }) => {
    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`video-card ${selected ? 'selected' : ''}`}>
            <img src={video.thumbnail} alt={video.title} className="video-thumbnail" />
            <div className="video-info">
                <h4 className="video-title">{video.title}</h4>
                <p className="video-meta">
                    {video.uploader} • {formatDuration(video.duration)}
                    {video.view_count && ` • ${video.view_count.toLocaleString()} views`}
                </p>
            </div>
            <div className="video-actions">
                {showCheckbox && onSelect && (
                    <input
                        type="checkbox"
                        checked={selected}
                        onChange={onSelect}
                        className="checkbox"
                    />
                )}
                {onDownload && (
                    <Button size="sm" onClick={onDownload} icon={<Download className="w-4 h-4" />}>
                        Download
                    </Button>
                )}
            </div>
        </div>
    );
};

export default function App() {
    const backend = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

    // Helper function to format YouTube date
    const formatYouTubeDate = (dateString: string): string => {
        if (!dateString) return 'Unknown';

        try {
            // YouTube date format is usually YYYYMMDD
            if (dateString.length === 8) {
                const year = dateString.substring(0, 4);
                const month = dateString.substring(4, 6);
                const day = dateString.substring(6, 8);
                const date = new Date(`${year}-${month}-${day}`);

                if (!isNaN(date.getTime())) {
                    return date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });
                }
            }

            // Try parsing as regular date
            const date = new Date(dateString);
            if (!isNaN(date.getTime())) {
                return date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            }

            return dateString; // Return original if can't parse
        } catch {
            return 'Unknown';
        }
    };

    // State
    const [darkMode, setDarkMode] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('single');
    const [url, setUrl] = useState('');
    const [urls, setUrls] = useState(['']);
    const [type, setType] = useState<DownloadType>('video');
    const [quality, setQuality] = useState<QualityType>('best');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
    const [downloadHistory, setDownloadHistory] = useState<DownloadItem[]>([]);
    const [activeDownloads, setActiveDownloads] = useState<DownloadItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [selectedVideos, setSelectedVideos] = useState<SearchResult[]>([]);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [scheduledDownloads, setScheduledDownloads] = useState<ScheduledDownload[]>([]);
    const [playlistUrl, setPlaylistUrl] = useState('');
    const [playlistInfo, setPlaylistInfo] = useState<PlaylistInfo | null>(null);
    const [selectedPlaylistVideos, setSelectedPlaylistVideos] = useState<string[]>([]);
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');

    // Socket.IO connection
    useEffect(() => {
        const newSocket = io(backend);

        newSocket.on('downloadStarted', (download: DownloadItem) => {
            setActiveDownloads(prev => [...prev, download]);
        });

        newSocket.on('downloadProgress', (download: DownloadItem) => {
            setActiveDownloads(prev =>
                prev.map(d => d.id === download.id ? download : d)
            );
        });

        newSocket.on('downloadCompleted', (download: DownloadItem) => {
            setActiveDownloads(prev => prev.filter(d => d.id !== download.id));
            setDownloadHistory(prev => [download, ...prev]);
        });

        newSocket.on('downloadFailed', (download: DownloadItem) => {
            setActiveDownloads(prev => prev.filter(d => d.id !== download.id));
        });

        const interval = setInterval(() => {
            fetchActiveDownloads();
        }, 5000);

        return () => {
            newSocket.close();
            clearInterval(interval);
        };
    }, [backend]);

    // Fetch video info when URL changes
    useEffect(() => {
        if (url && isValidYouTubeUrl(url)) {
            fetchVideoInfo();
        } else {
            setVideoInfo(null);
        }
    }, [url]);

    // Load history on mount
    useEffect(() => {
        fetchHistory();
    }, []);

    // Apply dark mode
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    }, [darkMode]);

    // Utility functions
    const isValidYouTubeUrl = (url: string): boolean => {
        const regex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)/;
        return regex.test(url);
    };

    const fetchVideoInfo = useCallback(async () => {
        if (!url || !isValidYouTubeUrl(url)) return;

        setLoading(true);
        try {
            const response = await fetch(`${backend}/api/info?url=${encodeURIComponent(url)}`);
            const data = await response.json();

            if (response.ok) {
                setVideoInfo(data);
                setStatus('');
            } else {
                setStatus(data.error || 'Failed to get video info');
                setVideoInfo(null);
            }
        } catch (err) {
            setStatus('Failed to connect to server');
            setVideoInfo(null);
        }
        setLoading(false);
    }, [url, backend]);

    const fetchHistory = useCallback(async () => {
        try {
            const response = await fetch(`${backend}/api/history`);
            const data = await response.json();
            setDownloadHistory(data);
        } catch (err) {
            console.error('Failed to fetch history:', err);
        }
    }, [backend]);

    const fetchActiveDownloads = useCallback(async () => {
        try {
            const response = await fetch(`${backend}/api/downloads/active`);
            const data = await response.json();
            setActiveDownloads(data);
        } catch (err) {
            console.error('Failed to fetch active downloads:', err);
        }
    }, [backend]);

    // Download handlers
    const handleDownload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return setStatus('Please paste a YouTube URL');
        if (!isValidYouTubeUrl(url)) return setStatus('Please enter a valid YouTube URL');

        setLoading(true);
        try {
            const response = await fetch(`${backend}/api/download`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, type, quality })
            });

            const data = await response.json();

            if (response.ok) {
                setStatus(`Download started: ${data.title}`);
                setActiveTab('queue');
                fetchActiveDownloads();
            } else {
                setStatus(data.error || 'Download failed');
            }
        } catch (err) {
            setStatus('Failed to start download');
        }
        setLoading(false);
    };

    const handleBatchDownload = async () => {
        const validUrls = urls.filter(u => u && isValidYouTubeUrl(u));
        if (validUrls.length === 0) return setStatus('Please add valid YouTube URLs');

        setLoading(true);
        let successCount = 0;

        for (const batchUrl of validUrls) {
            try {
                const response = await fetch(`${backend}/api/download`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: batchUrl, type, quality })
                });

                if (response.ok) successCount++;
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (err) {
                console.error('Batch download error:', err);
            }
        }

        setStatus(`Started ${successCount}/${validUrls.length} downloads`);
        setActiveTab('queue');
        fetchActiveDownloads();
        setLoading(false);
    };

    const cancelDownload = async (downloadId: string) => {
        try {
            const response = await fetch(`${backend}/api/download/${downloadId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setStatus('Download cancelled');
                fetchActiveDownloads();
            }
        } catch (err) {
            setStatus('Failed to cancel download');
        }
    };

    const clearHistory = async () => {
        try {
            await fetch(`${backend}/api/history`, { method: 'DELETE' });
            setDownloadHistory([]);
            setStatus('History cleared');
        } catch (err) {
            setStatus('Failed to clear history');
        }
    };

    const downloadFile = async (downloadId: string) => {
        try {
            const response = await fetch(`${backend}/api/download/${downloadId}`);
            if (response.ok) {
                const blob = await response.blob();
                const download = downloadHistory.find(d => d.id === downloadId);
                const filename = download?.fileName || `download_${downloadId}`;

                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                setStatus(`Downloaded: ${filename}`);
            } else {
                setStatus('File not found or download failed');
            }
        } catch (err) {
            setStatus('Failed to download file');
        }
    };

    const deleteHistoryItem = async (downloadId: string) => {
        try {
            const response = await fetch(`${backend}/api/history/${downloadId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setDownloadHistory(prev => prev.filter(d => d.id !== downloadId));
                setStatus('Download removed from history');
            } else {
                setStatus('Failed to remove download');
            }
        } catch (err) {
            setStatus('Failed to remove download');
        }
    };

    // URL management
    const addUrlField = () => setUrls([...urls, '']);
    const removeUrlField = (index: number) => setUrls(urls.filter((_, i) => i !== index));
    const updateUrl = (index: number, value: string) => {
        const newUrls = [...urls];
        newUrls[index] = value;
        setUrls(newUrls);
    };

    // Search functionality
    const searchVideos = async () => {
        if (!searchQuery.trim()) return;

        setLoading(true);
        try {
            const response = await fetch(`${backend}/api/search?query=${encodeURIComponent(searchQuery)}&limit=20`);
            const data = await response.json();

            if (response.ok) {
                setSearchResults(data.videos);
                setStatus(`Found ${data.videos.length} videos`);
            } else {
                setStatus(data.error || 'Search failed');
                setSearchResults([]);
            }
        } catch (err) {
            setStatus('Failed to search videos');
            setSearchResults([]);
        }
        setLoading(false);
    };

    const toggleVideoSelection = (video: VideoInfo | SearchResult) => {
        if ('url' in video) {
            setSelectedVideos(prev => {
                const isSelected = prev.find(v => v.id === video.id);
                if (isSelected) {
                    return prev.filter(v => v.id !== video.id);
                } else {
                    return [...prev, video as SearchResult];
                }
            });
        }
    };

    const downloadSelectedVideos = async () => {
        if (selectedVideos.length === 0) return setStatus('Please select videos to download');

        setLoading(true);
        let successCount = 0;

        for (const video of selectedVideos) {
            try {
                const response = await fetch(`${backend}/api/download`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: video.url, type, quality })
                });

                if (response.ok) successCount++;
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (err) {
                console.error('Download error:', err);
            }
        }

        setStatus(`Started ${successCount}/${selectedVideos.length} downloads`);
        setSelectedVideos([]);
        setActiveTab('queue');
        fetchActiveDownloads();
        setLoading(false);
    };

    // Playlist functionality
    const fetchPlaylistInfo = async () => {
        if (!playlistUrl.trim()) return;

        setLoading(true);
        try {
            const response = await fetch(`${backend}/api/playlist?url=${encodeURIComponent(playlistUrl)}`);
            const data = await response.json();

            if (response.ok) {
                setPlaylistInfo(data);
                setStatus(`Found ${data.videoCount} videos in playlist`);
            } else {
                setStatus(data.error || 'Failed to fetch playlist');
                setPlaylistInfo(null);
            }
        } catch (err) {
            setStatus('Failed to fetch playlist');
            setPlaylistInfo(null);
        }
        setLoading(false);
    };

    const togglePlaylistVideoSelection = (videoId: string) => {
        setSelectedPlaylistVideos(prev =>
            prev.includes(videoId)
                ? prev.filter(id => id !== videoId)
                : [...prev, videoId]
        );
    };

    const downloadPlaylistVideos = async () => {
        if (!playlistInfo || selectedPlaylistVideos.length === 0) {
            return setStatus('Please select videos to download');
        }

        setLoading(true);
        let successCount = 0;

        const videosToDownload = playlistInfo.videos.filter(v =>
            selectedPlaylistVideos.includes(v.id)
        );

        for (const video of videosToDownload) {
            try {
                const response = await fetch(`${backend}/api/download`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: video.url, type, quality })
                });

                if (response.ok) successCount++;
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (err) {
                console.error('Playlist download error:', err);
            }
        }

        setStatus(`Started ${successCount}/${videosToDownload.length} playlist downloads`);
        setSelectedPlaylistVideos([]);
        setActiveTab('queue');
        fetchActiveDownloads();
        setLoading(false);
    };

    // Scheduler functionality
    const scheduleDownload = () => {
        if (!url || !scheduleDate || !scheduleTime) {
            return setStatus('Please provide URL, date, and time');
        }

        const scheduledTime = new Date(`${scheduleDate}T${scheduleTime}`);
        if (scheduledTime <= new Date()) {
            return setStatus('Scheduled time must be in the future');
        }

        const newScheduled: ScheduledDownload = {
            id: Date.now().toString(),
            url,
            title: videoInfo?.title || url,
            type,
            quality,
            scheduledTime,
            status: 'pending'
        };

        setScheduledDownloads(prev => [...prev, newScheduled]);
        setStatus('Download scheduled successfully');
        setUrl('');
        setScheduleDate('');
        setScheduleTime('');
    };

    const cancelScheduledDownload = (id: string) => {
        setScheduledDownloads(prev => prev.filter(d => d.id !== id));
        setStatus('Scheduled download cancelled');
    };

    const runScheduledNow = async (id: string) => {
        const scheduled = scheduledDownloads.find(d => d.id === id);
        if (!scheduled) return;

        setLoading(true);
        try {
            const response = await fetch(`${backend}/api/download`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: scheduled.url,
                    type: scheduled.type,
                    quality: scheduled.quality
                })
            });

            if (response.ok) {
                setStatus(`Started: ${scheduled.title}`);
                setScheduledDownloads(prev =>
                    prev.map(d => d.id === id ? { ...d, status: 'running' as const } : d)
                );
                setActiveTab('queue');
                fetchActiveDownloads();
            } else {
                setStatus('Failed to start download');
            }
        } catch (err) {
            setStatus('Failed to start download');
        }
        setLoading(false);
    };

    // Analytics calculations
    const getAnalytics = () => {
        const totalDownloads = downloadHistory.length;
        const videoDownloads = downloadHistory.filter(d => d.type === 'video').length;
        const audioDownloads = downloadHistory.filter(d => d.type === 'audio').length;
        const completedDownloads = downloadHistory.filter(d => d.status === 'completed').length;
        const failedDownloads = downloadHistory.filter(d => d.status === 'failed').length;
        const totalSize = downloadHistory.reduce((acc, d) => acc + (d.fileSize || 0), 0);

        return {
            totalDownloads,
            videoDownloads,
            audioDownloads,
            completedDownloads,
            failedDownloads,
            totalSize,
            successRate: totalDownloads > 0 ? ((completedDownloads / totalDownloads) * 100).toFixed(1) : '0'
        };
    };

    return (
        <div className="app-container" data-theme={darkMode ? 'dark' : 'light'}>
            <div className="container min-h-screen p-6">
                {/* Desktop Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grand-header"
                >
                    <div className="grand-logo">
                        <span className="grand-logo-icon">🎥</span>
                        YT Downloader Pro
                    </div>
                    <Button
                        variant="secondary"
                        onClick={() => setDarkMode(!darkMode)}
                        icon={darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    >
                        {darkMode ? 'Light' : 'Dark'}
                    </Button>
                </motion.div>

                {/* Navigation Tabs */}
                <div className="grand-tabs">
                    <button
                        className={`grand-tab ${activeTab === 'single' ? 'active' : ''}`}
                        onClick={() => setActiveTab('single')}
                    >
                        <Download className="grand-tab-icon" size={18} />
                        <span className="grand-tab-text">Single</span>
                    </button>
                    <button
                        className={`grand-tab ${activeTab === 'batch' ? 'active' : ''}`}
                        onClick={() => setActiveTab('batch')}
                    >
                        <List className="grand-tab-icon" size={18} />
                        <span className="grand-tab-text">Batch</span>
                    </button>
                    <button
                        className={`grand-tab ${activeTab === 'search' ? 'active' : ''}`}
                        onClick={() => setActiveTab('search')}
                    >
                        <Search className="grand-tab-icon" size={18} />
                        <span className="grand-tab-text">Search</span>
                    </button>
                    <button
                        className={`grand-tab ${activeTab === 'queue' ? 'active' : ''}`}
                        onClick={() => setActiveTab('queue')}
                    >
                        <Play className="grand-tab-icon" size={18} />
                        <span className="grand-tab-text">Queue {activeDownloads.length > 0 && `(${activeDownloads.length})`}</span>
                    </button>
                    <button
                        className={`grand-tab ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        <History className="grand-tab-icon" size={18} />
                        <span className="grand-tab-text">History</span>
                    </button>
                    <button
                        className={`grand-tab ${activeTab === 'playlist' ? 'active' : ''}`}
                        onClick={() => setActiveTab('playlist')}
                    >
                        <List className="grand-tab-icon" size={18} />
                        <span className="grand-tab-text">Playlist</span>
                    </button>
                    <button
                        className={`grand-tab ${activeTab === 'scheduler' ? 'active' : ''}`}
                        onClick={() => setActiveTab('scheduler')}
                    >
                        <RefreshCw className="grand-tab-icon" size={18} />
                        <span className="grand-tab-text">Scheduler</span>
                    </button>
                    <button
                        className={`grand-tab ${activeTab === 'analytics' ? 'active' : ''}`}
                        onClick={() => setActiveTab('analytics')}
                    >
                        <History className="grand-tab-icon" size={18} />
                        <span className="grand-tab-text">Analytics</span>
                    </button>
                    <Button
                        variant={activeTab === 'settings' ? 'primary' : 'secondary'}
                        onClick={() => setActiveTab('settings')}
                        icon={<Settings className="w-4 h-4" />}
                    >
                        Settings
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        <AnimatePresence mode="wait">
                            {activeTab === 'single' && (
                                <motion.div
                                    key="single"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="grand-card single-download-section p-6 fade-in"
                                >
                                    <div className="section-header">
                                        <Download className="w-5 h-5" />
                                        <h2>Single Video Download</h2>
                                    </div>

                                    <form onSubmit={handleDownload} className="space-y-4">
                                        <Input
                                            type="url"
                                            value={url}
                                            onChange={(e) => setUrl(e.target.value)}
                                            placeholder="https://www.youtube.com/watch?v=..."
                                            label="🔗 YouTube URL"
                                            icon={<Link className="w-4 h-4 animated-icon" />}
                                            required
                                        />

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-2">📁 Type</label>
                                                <div className="radio-group">
                                                    <label className="radio-item">
                                                        <input
                                                            type="radio"
                                                            name="type"
                                                            value="audio"
                                                            checked={type === 'audio'}
                                                            onChange={() => setType('audio')}
                                                            className="radio-input"
                                                        />
                                                        <Music className="w-4 h-4" />
                                                        <span>Audio</span>
                                                    </label>
                                                    <label className="radio-item">
                                                        <input
                                                            type="radio"
                                                            name="type"
                                                            value="video"
                                                            checked={type === 'video'}
                                                            onChange={() => setType('video')}
                                                            className="radio-input"
                                                        />
                                                        <Play className="w-4 h-4" />
                                                        <span>Video</span>
                                                    </label>
                                                </div>
                                            </div>

                                            {type === 'video' && videoInfo?.qualities && (
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">⚙️ Quality</label>
                                                    <select
                                                        value={quality}
                                                        onChange={(e) => setQuality(e.target.value as QualityType)}
                                                        className="select-field"
                                                    >
                                                        <option value="best">🏆 Best Available</option>
                                                        <option value="4k">🎬 4K (2160p)</option>
                                                        <option value="2k">🎥 2K (1440p)</option>
                                                        <option value="1080">📺 1080p (Full HD)</option>
                                                        <option value="720">📺 720p (HD)</option>
                                                        <option value="480">📺 480p</option>
                                                        <option value="360">📺 360p</option>
                                                        <option value="240">📺 240p</option>
                                                    </select>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-3">
                                            <Button
                                                type="submit"
                                                variant="primary"
                                                loading={loading}
                                                disabled={!url}
                                                className="flex-1"
                                                icon={<Download className="w-4 h-4" />}
                                            >
                                                {loading ? 'Processing...' : 'Download'}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                onClick={() => {
                                                    setUrl('');
                                                    setStatus('');
                                                    setVideoInfo(null);
                                                }}
                                                icon={<RefreshCw className="w-4 h-4" />}
                                            >
                                                Reset
                                            </Button>
                                        </div>
                                    </form>
                                </motion.div>
                            )}

                            {activeTab === 'batch' && (
                                <motion.div
                                    key="batch"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="grand-card batch-download-section p-6 fade-in"
                                >
                                    <div className="section-header">
                                        <List className="w-5 h-5" />
                                        <h2>Batch Download</h2>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">🔗 YouTube URLs</label>
                                            {urls.map((batchUrl, index) => (
                                                <div key={index} className="flex gap-2 mb-2">
                                                    <Input
                                                        type="url"
                                                        value={batchUrl}
                                                        onChange={(e) => updateUrl(index, e.target.value)}
                                                        placeholder="https://www.youtube.com/watch?v=..."
                                                        className="flex-1"
                                                    />
                                                    {urls.length > 1 && (
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            onClick={() => removeUrlField(index)}
                                                            icon={<Trash2 className="w-4 h-4" />}
                                                        >
                                                            Remove
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                            <Button
                                                variant="secondary"
                                                onClick={addUrlField}
                                                icon={<Plus className="w-4 h-4" />}
                                            >
                                                Add URL
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-2">📁 Type</label>
                                                <div className="radio-group">
                                                    <label className="radio-item">
                                                        <input
                                                            type="radio"
                                                            name="batchType"
                                                            value="audio"
                                                            checked={type === 'audio'}
                                                            onChange={() => setType('audio')}
                                                            className="radio-input"
                                                        />
                                                        <Music className="w-4 h-4" />
                                                        <span>Audio</span>
                                                    </label>
                                                    <label className="radio-item">
                                                        <input
                                                            type="radio"
                                                            name="batchType"
                                                            value="video"
                                                            checked={type === 'video'}
                                                            onChange={() => setType('video')}
                                                            className="radio-input"
                                                        />
                                                        <Play className="w-4 h-4" />
                                                        <span>Video</span>
                                                    </label>
                                                </div>
                                            </div>

                                            {type === 'video' && (
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">⚙️ Quality</label>
                                                    <select
                                                        value={quality}
                                                        onChange={(e) => setQuality(e.target.value as QualityType)}
                                                        className="select-field"
                                                    >
                                                        <option value="best">🏆 Best Available</option>
                                                        <option value="4k">🎬 4K (2160p)</option>
                                                        <option value="2k">🎥 2K (1440p)</option>
                                                        <option value="1080">📺 1080p (Full HD)</option>
                                                        <option value="720">📺 720p (HD)</option>
                                                        <option value="480">📺 480p</option>
                                                        <option value="360">📺 360p</option>
                                                        <option value="240">📺 240p</option>
                                                    </select>
                                                </div>
                                            )}
                                        </div>

                                        <Button
                                            onClick={handleBatchDownload}
                                            variant="success"
                                            loading={loading}
                                            disabled={urls.filter(u => u).length === 0}
                                            className="w-full"
                                            icon={<Download className="w-4 h-4" />}
                                        >
                                            {loading ? 'Processing...' : `Download All (${urls.filter(u => u && isValidYouTubeUrl(u)).length})`}
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'search' && (
                                <motion.div
                                    key="search"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="grand-card search-section p-6 fade-in"
                                >
                                    <div className="section-header">
                                        <Search className="w-5 h-5" />
                                        <h2>Search Videos</h2>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex gap-2">
                                            <Input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Search for videos..."
                                                className="flex-1"
                                                icon={<Search className="w-4 h-4" />}
                                            />
                                            <Button
                                                onClick={searchVideos}
                                                variant="primary"
                                                loading={loading}
                                                disabled={!searchQuery.trim()}
                                                icon={<Search className="w-4 h-4" />}
                                            >
                                                Search
                                            </Button>
                                        </div>

                                        {selectedVideos.length > 0 && (
                                            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                                                <span className="text-sm text-blue-700">
                                                    {selectedVideos.length} video(s) selected
                                                </span>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        onClick={() => setSelectedVideos([])}
                                                    >
                                                        Clear
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="success"
                                                        onClick={downloadSelectedVideos}
                                                        loading={loading}
                                                        icon={<Download className="w-4 h-4" />}
                                                    >
                                                        Download Selected
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-3 max-h-96 overflow-y-auto">
                                            {searchResults.map(video => (
                                                <VideoCard
                                                    key={video.id}
                                                    video={video}
                                                    onSelect={() => toggleVideoSelection(video)}
                                                    selected={selectedVideos.some(v => v.id === video.id)}
                                                    showCheckbox
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'queue' && (
                                <motion.div
                                    key="queue"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="grand-card queue-section p-6 fade-in"
                                >
                                    <div className="section-header">
                                        <Play className="w-5 h-5" />
                                        <h2>Active Downloads</h2>
                                    </div>
                                    {activeDownloads.length === 0 ? (
                                        <p className="text-gray-500 text-center py-8">No active downloads</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {activeDownloads.map(download => (
                                                <div key={download.id} className="download-item">
                                                    <div className="download-info">
                                                        <h4>{download.title}</h4>
                                                        <div className="progress-bar">
                                                            <div
                                                                className="progress-fill"
                                                                style={{ width: `${download.progress}%` }}
                                                            />
                                                        </div>
                                                        <p>{download.progress}% - {download.status}</p>
                                                    </div>
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={() => cancelDownload(download.id)}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'history' && (
                                <motion.div
                                    key="history"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="grand-card history-section p-6 fade-in"
                                >
                                    <div className="section-header flex-between">
                                        <div className="flex items-center gap-2">
                                            <History className="w-5 h-5" />
                                            <h2>Download History</h2>
                                        </div>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={clearHistory}
                                            icon={<Trash2 className="w-4 h-4" />}
                                        >
                                            Clear All
                                        </Button>
                                    </div>
                                    {downloadHistory.length === 0 ? (
                                        <p className="text-gray-500 text-center py-8">No download history</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {downloadHistory.map(download => (
                                                <div key={download.id} className="download-item">
                                                    <div className="download-info">
                                                        <h4>{download.title}</h4>
                                                        <p className="text-sm text-gray-600">
                                                            {download.type} - {download.quality} - {download.status}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            onClick={() => downloadFile(download.id)}
                                                            icon={<Download className="w-4 h-4" />}
                                                        >
                                                            Download
                                                        </Button>
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            onClick={() => deleteHistoryItem(download.id)}
                                                            icon={<Trash2 className="w-4 h-4" />}
                                                        >
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'playlist' && (
                                <motion.div
                                    key="playlist"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="grand-card playlist-section p-6 fade-in"
                                >
                                    <div className="section-header">
                                        <List className="w-5 h-5" />
                                        <h2>Playlist Download</h2>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex gap-2">
                                            <Input
                                                type="url"
                                                value={playlistUrl}
                                                onChange={(e) => setPlaylistUrl(e.target.value)}
                                                placeholder="https://www.youtube.com/playlist?list=..."
                                                className="flex-1"
                                                label="🎵 Playlist URL"
                                            />
                                            <Button
                                                onClick={fetchPlaylistInfo}
                                                variant="primary"
                                                loading={loading}
                                                disabled={!playlistUrl.trim()}
                                                icon={<Search className="w-4 h-4" />}
                                            >
                                                Load
                                            </Button>
                                        </div>

                                        {playlistInfo && (
                                            <>
                                                <div className="p-4 bg-blue-50 rounded-lg">
                                                    <h3 className="font-semibold mb-2">{playlistInfo.title}</h3>
                                                    <p className="text-sm text-gray-600">
                                                        {playlistInfo.videoCount} videos • {selectedPlaylistVideos.length} selected
                                                    </p>
                                                </div>

                                                <div className="flex gap-2 mb-2">
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        onClick={() => setSelectedPlaylistVideos(playlistInfo.videos.map(v => v.id))}
                                                    >
                                                        Select All
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        onClick={() => setSelectedPlaylistVideos([])}
                                                    >
                                                        Clear All
                                                    </Button>
                                                </div>

                                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                                    {playlistInfo.videos.map(video => (
                                                        <div key={video.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedPlaylistVideos.includes(video.id)}
                                                                onChange={() => togglePlaylistVideoSelection(video.id)}
                                                                className="checkbox"
                                                            />
                                                            <img src={video.thumbnail} alt={video.title} className="w-20 h-12 object-cover rounded" />
                                                            <div className="flex-1">
                                                                <h4 className="text-sm font-medium">{video.title}</h4>
                                                                <p className="text-xs text-gray-500">{video.uploader}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <Button
                                                    onClick={downloadPlaylistVideos}
                                                    variant="success"
                                                    loading={loading}
                                                    disabled={selectedPlaylistVideos.length === 0}
                                                    className="w-full"
                                                    icon={<Download className="w-4 h-4" />}
                                                >
                                                    Download Selected ({selectedPlaylistVideos.length})
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'scheduler' && (
                                <motion.div
                                    key="scheduler"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="grand-card scheduler-section p-6 fade-in"
                                >
                                    <div className="section-header">
                                        <RefreshCw className="w-5 h-5" />
                                        <h2>Schedule Downloads</h2>
                                    </div>

                                    <div className="space-y-4">
                                        <Input
                                            type="url"
                                            value={url}
                                            onChange={(e) => setUrl(e.target.value)}
                                            placeholder="https://www.youtube.com/watch?v=..."
                                            label="🔗 YouTube URL"
                                        />

                                        <div className="grid grid-cols-2 gap-4">
                                            <Input
                                                type="date"
                                                value={scheduleDate}
                                                onChange={(e) => setScheduleDate(e.target.value)}
                                                label="📅 Date"
                                            />
                                            <Input
                                                type="time"
                                                value={scheduleTime}
                                                onChange={(e) => setScheduleTime(e.target.value)}
                                                label="⏰ Time"
                                            />
                                        </div>

                                        <Button
                                            onClick={scheduleDownload}
                                            variant="primary"
                                            disabled={!url || !scheduleDate || !scheduleTime}
                                            className="w-full"
                                            icon={<Plus className="w-4 h-4" />}
                                        >
                                            Schedule Download
                                        </Button>

                                        <div className="mt-6">
                                            <h3 className="font-semibold mb-3">Scheduled Downloads ({scheduledDownloads.length})</h3>
                                            {scheduledDownloads.length === 0 ? (
                                                <p className="text-gray-500 text-center py-4">No scheduled downloads</p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {scheduledDownloads.map(download => (
                                                        <div key={download.id} className="p-3 border rounded-lg">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div className="flex-1">
                                                                    <h4 className="font-medium text-sm">{download.title}</h4>
                                                                    <p className="text-xs text-gray-500">
                                                                        {new Date(download.scheduledTime).toLocaleString()}
                                                                    </p>
                                                                    <span className={`text-xs px-2 py-1 rounded ${download.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                                        download.status === 'running' ? 'bg-blue-100 text-blue-700' :
                                                                            download.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                                                'bg-red-100 text-red-700'
                                                                        }`}>
                                                                        {download.status}
                                                                    </span>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="primary"
                                                                        onClick={() => runScheduledNow(download.id)}
                                                                        disabled={download.status !== 'pending'}
                                                                    >
                                                                        Run Now
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="danger"
                                                                        onClick={() => cancelScheduledDownload(download.id)}
                                                                        icon={<Trash2 className="w-4 h-4" />}
                                                                    >
                                                                        Cancel
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'analytics' && (
                                <motion.div
                                    key="analytics"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="grand-card analytics-section p-6 fade-in"
                                >
                                    <div className="section-header">
                                        <History className="w-5 h-5" />
                                        <h2>Download Analytics</h2>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {(() => {
                                            const analytics = getAnalytics();
                                            return (
                                                <>
                                                    <div className="p-4 bg-blue-50 rounded-lg">
                                                        <p className="text-sm text-gray-600">Total Downloads</p>
                                                        <p className="text-2xl font-bold text-blue-600">{analytics.totalDownloads}</p>
                                                    </div>
                                                    <div className="p-4 bg-green-50 rounded-lg">
                                                        <p className="text-sm text-gray-600">Success Rate</p>
                                                        <p className="text-2xl font-bold text-green-600">{analytics.successRate}%</p>
                                                    </div>
                                                    <div className="p-4 bg-purple-50 rounded-lg">
                                                        <p className="text-sm text-gray-600">Video Downloads</p>
                                                        <p className="text-2xl font-bold text-purple-600">{analytics.videoDownloads}</p>
                                                    </div>
                                                    <div className="p-4 bg-orange-50 rounded-lg">
                                                        <p className="text-sm text-gray-600">Audio Downloads</p>
                                                        <p className="text-2xl font-bold text-orange-600">{analytics.audioDownloads}</p>
                                                    </div>
                                                    <div className="p-4 bg-green-50 rounded-lg">
                                                        <p className="text-sm text-gray-600">Completed</p>
                                                        <p className="text-2xl font-bold text-green-600">{analytics.completedDownloads}</p>
                                                    </div>
                                                    <div className="p-4 bg-red-50 rounded-lg">
                                                        <p className="text-sm text-gray-600">Failed</p>
                                                        <p className="text-2xl font-bold text-red-600">{analytics.failedDownloads}</p>
                                                    </div>
                                                    <div className="p-4 bg-indigo-50 rounded-lg col-span-2">
                                                        <p className="text-sm text-gray-600">Total Size</p>
                                                        <p className="text-2xl font-bold text-indigo-600">
                                                            {(analytics.totalSize / (1024 * 1024 * 1024)).toFixed(2)} GB
                                                        </p>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>

                                    <div className="mt-6">
                                        <h3 className="font-semibold mb-3">Recent Activity</h3>
                                        <div className="space-y-2">
                                            {downloadHistory.slice(0, 5).map(download => (
                                                <div key={download.id} className="p-3 border rounded-lg flex justify-between items-center">
                                                    <div>
                                                        <p className="text-sm font-medium">{download.title}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {download.type} • {download.quality} • {download.status}
                                                        </p>
                                                    </div>
                                                    <span className={`text-xs px-2 py-1 rounded ${download.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                        download.status === 'failed' ? 'bg-red-100 text-red-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {download.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'settings' && (
                                <motion.div
                                    key="settings"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="grand-card settings-section p-6 fade-in"
                                >
                                    <div className="section-header">
                                        <Settings className="w-5 h-5" />
                                        <h2>Settings & Preferences</h2>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Appearance Section */}
                                        <div className="border-b pb-4">
                                            <h3 className="text-md font-semibold mb-3">🎨 Appearance</h3>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">Theme Mode</label>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant={!darkMode ? 'primary' : 'secondary'}
                                                            onClick={() => setDarkMode(false)}
                                                            icon={<Sun className="w-4 h-4" />}
                                                        >
                                                            Light
                                                        </Button>
                                                        <Button
                                                            variant={darkMode ? 'primary' : 'secondary'}
                                                            onClick={() => setDarkMode(true)}
                                                            icon={<Moon className="w-4 h-4" />}
                                                        >
                                                            Dark
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Download Settings */}
                                        <div className="border-b pb-4">
                                            <h3 className="text-md font-semibold mb-3">⚙️ Download Settings</h3>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">Default Quality</label>
                                                    <select
                                                        value={quality}
                                                        onChange={(e) => setQuality(e.target.value as QualityType)}
                                                        className="select-field"
                                                    >
                                                        <option value="best">🏆 Best Available</option>
                                                        <option value="4k">🎬 4K (2160p)</option>
                                                        <option value="2k">🎥 2K (1440p)</option>
                                                        <option value="1080">📺 1080p (Full HD)</option>
                                                        <option value="720">📺 720p (HD)</option>
                                                        <option value="480">📺 480p</option>
                                                        <option value="360">📺 360p</option>
                                                        <option value="240">📺 240p</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">Default Type</label>
                                                    <div className="radio-group">
                                                        <label className="radio-item">
                                                            <input
                                                                type="radio"
                                                                name="defaultType"
                                                                value="video"
                                                                checked={type === 'video'}
                                                                onChange={() => setType('video')}
                                                                className="radio-input"
                                                            />
                                                            <Play className="w-4 h-4" />
                                                            <span>Video</span>
                                                        </label>
                                                        <label className="radio-item">
                                                            <input
                                                                type="radio"
                                                                name="defaultType"
                                                                value="audio"
                                                                checked={type === 'audio'}
                                                                onChange={() => setType('audio')}
                                                                className="radio-input"
                                                            />
                                                            <Music className="w-4 h-4" />
                                                            <span>Audio</span>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Connection Info */}
                                        <div className="border-b pb-4">
                                            <h3 className="text-md font-semibold mb-3">🔗 Connection</h3>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-medium">Backend URL:</span>
                                                    <span className="text-sm text-gray-600">{backend}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-medium">Status:</span>
                                                    <span className="text-sm text-green-600 font-semibold">● Connected</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Statistics */}
                                        <div className="border-b pb-4">
                                            <h3 className="text-md font-semibold mb-3">📊 Statistics</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                                    <div className="text-2xl font-bold text-blue-600">{activeDownloads.length}</div>
                                                    <div className="text-sm text-gray-600">Active Downloads</div>
                                                </div>
                                                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                                                    <div className="text-2xl font-bold text-green-600">{downloadHistory.length}</div>
                                                    <div className="text-sm text-gray-600">Total Downloads</div>
                                                </div>
                                                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                                                    <div className="text-2xl font-bold text-purple-600">{scheduledDownloads.length}</div>
                                                    <div className="text-sm text-gray-600">Scheduled</div>
                                                </div>
                                                <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                                                    <div className="text-2xl font-bold text-orange-600">{searchResults.length}</div>
                                                    <div className="text-sm text-gray-600">Search Results</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Data Management */}
                                        <div className="border-b pb-4">
                                            <h3 className="text-md font-semibold mb-3">🗑️ Data Management</h3>
                                            <div className="space-y-2">
                                                <Button
                                                    variant="danger"
                                                    onClick={clearHistory}
                                                    icon={<Trash2 className="w-4 h-4" />}
                                                    className="w-full"
                                                >
                                                    Clear Download History
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => {
                                                        setSearchResults([]);
                                                        setStatus('Search results cleared');
                                                    }}
                                                    icon={<RefreshCw className="w-4 h-4" />}
                                                    className="w-full"
                                                >
                                                    Clear Search Results
                                                </Button>
                                            </div>
                                        </div>

                                        {/* App Info */}
                                        <div>
                                            <h3 className="text-md font-semibold mb-3">ℹ️ About</h3>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="font-medium">App Name:</span>
                                                    <span className="text-gray-600">YouTube Downloader</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="font-medium">Version:</span>
                                                    <span className="text-gray-600">2.0.0</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="font-medium">Design:</span>
                                                    <span className="text-gray-600">YouTube Style</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="font-medium">Features:</span>
                                                    <span className="text-gray-600">4K/2K Support</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Quick Actions */}
                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                            <h4 className="font-semibold mb-2">💡 Quick Tips</h4>
                                            <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                                                <li>• Use 4K/2K for highest quality videos</li>
                                                <li>• Audio mode extracts MP3 from videos</li>
                                                <li>• Batch download multiple videos at once</li>
                                                <li>• Schedule downloads for later</li>
                                                <li>• Search YouTube directly in the app</li>
                                            </ul>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Sidebar - Video Preview */}
                    <div className="lg:col-span-1">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="grand-card sticky top-6 overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, rgba(255, 0, 0, 0.05) 0%, rgba(6, 95, 212, 0.05) 100%)',
                                borderLeft: '4px solid var(--yt-red)'
                            }}
                        >
                            <div className="section-header">
                                <Play className="w-5 h-5" />
                                <h3>Video Preview</h3>
                            </div>

                            <div className="p-6">
                                {videoInfo ? (
                                    <div className="space-y-4 fade-in">
                                        {/* Thumbnail with hover effect */}
                                        <div className="relative group overflow-hidden rounded-lg">
                                            <img
                                                src={videoInfo.thumbnail}
                                                alt={videoInfo.title}
                                                className="w-full rounded-lg transition-transform duration-300 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                                                <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                            </div>
                                        </div>

                                        {/* Video Info Card */}
                                        <div className="feature-card">
                                            <h4 className="font-semibold text-base mb-3 line-clamp-2">{videoInfo.title}</h4>

                                            {/* Stats Grid */}
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                                        {videoInfo.uploader?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-medium truncate">{videoInfo.uploader}</span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 mt-3">
                                                    <div className="info-box-info p-2 rounded-lg">
                                                        <div className="text-xs opacity-75">Duration</div>
                                                        <div className="font-semibold">
                                                            {Math.floor(videoInfo.duration / 60)}:{(videoInfo.duration % 60).toString().padStart(2, '0')}
                                                        </div>
                                                    </div>

                                                    {videoInfo.view_count && (
                                                        <div className="info-box-success p-2 rounded-lg">
                                                            <div className="text-xs opacity-75">Views</div>
                                                            <div className="font-semibold text-xs">
                                                                {videoInfo.view_count.toLocaleString()}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {videoInfo.upload_date && (
                                                    <div className="flex items-center gap-2 text-xs text-gray-600 mt-2">
                                                        <span className="badge badge-secondary">
                                                            📅 {formatYouTubeDate(videoInfo.upload_date)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Available Qualities */}
                                            {videoInfo.qualities && videoInfo.qualities.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-gray-200">
                                                    <div className="text-xs font-medium mb-2 text-gray-600 flex items-center justify-between">
                                                        <span>Available Qualities:</span>
                                                        <span className="badge badge-secondary">{videoInfo.qualities.length} options</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {videoInfo.qualities.map((q) => (
                                                            <span
                                                                key={q}
                                                                className={`badge ${q >= 2160 ? 'badge-error' :
                                                                    q >= 1440 ? 'badge-warning' :
                                                                        q >= 1080 ? 'badge-primary' :
                                                                            q >= 720 ? 'badge-success' :
                                                                                'badge-secondary'
                                                                    } text-xs font-semibold`}
                                                            >
                                                                {q >= 2160 ? '4K ' : q >= 1440 ? '2K ' : ''}{q}p
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Quick Actions */}
                                        <div className="flex gap-2">
                                            <button className="btn btn-primary flex-1 text-sm">
                                                <Download className="w-4 h-4" />
                                                Download
                                            </button>
                                        </div>
                                    </div>
                                ) : loading ? (
                                    <div className="empty-state">
                                        <div className="skeleton-avatar mx-auto mb-4"></div>
                                        <div className="skeleton-title mx-auto mb-2"></div>
                                        <div className="skeleton-text mx-auto"></div>
                                        <div className="skeleton-text mx-auto w-3/4"></div>
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <div className="empty-state-icon">
                                            <Link className="w-16 h-16 mx-auto opacity-30" />
                                        </div>
                                        <div className="empty-state-title">No Video Selected</div>
                                        <div className="empty-state-description">
                                            Paste a YouTube URL in the input field to see video details and preview
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Quick Stats Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="grand-card mt-4 p-4"
                        >
                            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                <History className="w-4 h-4" />
                                Quick Stats
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="stat-card p-3">
                                    <div className="stat-value text-xl">{activeDownloads.length}</div>
                                    <div className="stat-label text-xs">Active</div>
                                </div>
                                <div className="stat-card p-3">
                                    <div className="stat-value text-xl">{downloadHistory.length}</div>
                                    <div className="stat-label text-xs">Total</div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Status Message */}
                <AnimatePresence>
                    {status && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className={`fixed bottom-6 right-6 p-4 rounded-lg shadow-lg ${status.includes('failed') || status.includes('error')
                                ? 'bg-red-500 text-white'
                                : status.includes('started') || status.includes('completed')
                                    ? 'bg-green-500 text-white'
                                    : 'bg-blue-500 text-white'
                                }`}
                        >
                            {status}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

