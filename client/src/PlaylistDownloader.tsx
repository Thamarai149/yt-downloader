import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    List, Download, Play, Check, X, Loader, 
    CheckSquare, Square, Filter, SortAsc
} from 'lucide-react';

interface PlaylistVideo {
    id: string;
    title: string;
    duration: number;
    thumbnail: string;
    url: string;
    selected: boolean;
}

interface PlaylistDownloaderProps {
    backend: string;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function PlaylistDownloader({ backend, showToast }: PlaylistDownloaderProps) {
    const [playlistUrl, setPlaylistUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [videos, setVideos] = useState<PlaylistVideo[]>([]);
    const [quality, setQuality] = useState('best');
    const [type, setType] = useState<'video' | 'audio'>('video');
    const [sortBy, setSortBy] = useState<'default' | 'title' | 'duration'>('default');
    const [filterDuration, setFilterDuration] = useState<'all' | 'short' | 'medium' | 'long'>('all');

    const fetchPlaylist = async () => {
        if (!playlistUrl) {
            showToast('Please enter a playlist URL', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${backend}/api/playlist?url=${encodeURIComponent(playlistUrl)}`);
            const data = await response.json();

            if (response.ok) {
                const videosWithSelection = data.videos.map((v: any) => ({
                    ...v,
                    selected: true
                }));
                setVideos(videosWithSelection);
                showToast(`Found ${data.videos.length} videos in playlist`, 'success');
            } else {
                showToast(data.error || 'Failed to fetch playlist', 'error');
                setVideos([]);
            }
        } catch (err) {
            showToast('Failed to fetch playlist', 'error');
            setVideos([]);
        }
        setLoading(false);
    };

    const toggleVideo = (id: string) => {
        setVideos(videos.map(v => 
            v.id === id ? { ...v, selected: !v.selected } : v
        ));
    };

    const selectAll = () => {
        setVideos(videos.map(v => ({ ...v, selected: true })));
    };

    const deselectAll = () => {
        setVideos(videos.map(v => ({ ...v, selected: false })));
    };

    const downloadSelected = async () => {
        const selectedVideos = videos.filter(v => v.selected);
        
        if (selectedVideos.length === 0) {
            showToast('Please select at least one video', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${backend}/api/playlist-download`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    videos: selectedVideos.map(v => v.url),
                    quality,
                    type
                })
            });

            const data = await response.json();

            if (response.ok) {
                showToast(`Started downloading ${selectedVideos.length} videos`, 'success');
            } else {
                showToast(data.error || 'Failed to start downloads', 'error');
            }
        } catch (err) {
            showToast('Failed to start downloads', 'error');
        }
        setLoading(false);
    };

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    const getSortedVideos = () => {
        let sorted = [...videos];
        
        // Apply filter
        if (filterDuration !== 'all') {
            sorted = sorted.filter(v => {
                if (filterDuration === 'short') return v.duration < 300; // < 5 min
                if (filterDuration === 'medium') return v.duration >= 300 && v.duration < 1200; // 5-20 min
                if (filterDuration === 'long') return v.duration >= 1200; // > 20 min
                return true;
            });
        }
        
        // Apply sort
        if (sortBy === 'title') {
            sorted.sort((a, b) => a.title.localeCompare(b.title));
        } else if (sortBy === 'duration') {
            sorted.sort((a, b) => a.duration - b.duration);
        }
        
        return sorted;
    };

    const selectedCount = videos.filter(v => v.selected).length;
    const sortedVideos = getSortedVideos();

    return (
        <div className="main-card p-6">
            <div className="section-header-modern mb-6">
                <div className="icon">
                    <List className="w-5 h-5" />
                </div>
                <h2>Playlist Downloader</h2>
            </div>

            {/* Playlist URL Input */}
            <div className="space-y-4 mb-6">
                <div>
                    <label className="block text-sm font-medium mb-2">Playlist URL</label>
                    <div className="flex gap-2">
                        <input
                            type="url"
                            value={playlistUrl}
                            onChange={(e) => setPlaylistUrl(e.target.value)}
                            placeholder="https://www.youtube.com/playlist?list=..."
                            className="input-field-modern flex-1"
                        />
                        <button
                            onClick={fetchPlaylist}
                            disabled={loading}
                            className="btn btn-primary"
                        >
                            {loading ? (
                                <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                                <Play className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                </div>

                {videos.length > 0 && (
                    <>
                        {/* Download Settings */}
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
                                            onChange={(e) => setType(e.target.value as 'video' | 'audio')}
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
                                            onChange={(e) => setType(e.target.value as 'video' | 'audio')}
                                            className="radio-input"
                                        />
                                        <Download className="w-4 h-4" />
                                        Audio
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Quality</label>
                                <select
                                    value={quality}
                                    onChange={(e) => setQuality(e.target.value)}
                                    className="select-field"
                                >
                                    <option value="best">Best Quality</option>
                                    <option value="1080">1080p</option>
                                    <option value="720">720p</option>
                                    <option value="480">480p</option>
                                </select>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex flex-wrap gap-2">
                            <button onClick={selectAll} className="btn btn-secondary">
                                <CheckSquare className="w-4 h-4" />
                                Select All
                            </button>
                            <button onClick={deselectAll} className="btn btn-secondary">
                                <Square className="w-4 h-4" />
                                Deselect All
                            </button>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="select-field"
                            >
                                <option value="default">Default Order</option>
                                <option value="title">Sort by Title</option>
                                <option value="duration">Sort by Duration</option>
                            </select>
                            <select
                                value={filterDuration}
                                onChange={(e) => setFilterDuration(e.target.value as any)}
                                className="select-field"
                            >
                                <option value="all">All Durations</option>
                                <option value="short">Short (&lt; 5 min)</option>
                                <option value="medium">Medium (5-20 min)</option>
                                <option value="long">Long (&gt; 20 min)</option>
                            </select>
                        </div>

                        {/* Download Button */}
                        <button
                            onClick={downloadSelected}
                            disabled={loading || selectedCount === 0}
                            className="btn btn-primary w-full glow-effect"
                        >
                            {loading ? (
                                <>
                                    <Loader className="w-4 h-4 animate-spin" />
                                    Starting Downloads...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    Download Selected ({selectedCount})
                                </>
                            )}
                        </button>
                    </>
                )}
            </div>

            {/* Video List */}
            {sortedVideos.length > 0 && (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Showing {sortedVideos.length} of {videos.length} videos
                    </p>
                    {sortedVideos.map((video) => (
                        <motion.div
                            key={video.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`video-card-modern hover-lift-modern cursor-pointer ${
                                video.selected ? 'border-2 border-primary' : ''
                            }`}
                            onClick={() => toggleVideo(video.id)}
                        >
                            <div className="flex gap-4 p-4">
                                <div className="flex-shrink-0">
                                    <div className="relative">
                                        <img
                                            src={video.thumbnail}
                                            alt={video.title}
                                            className="w-32 h-20 object-cover rounded-lg"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="128" height="80" viewBox="0 0 128 80"%3E%3Crect fill="%236366f1" width="128" height="80"/%3E%3Ctext fill="white" font-family="Arial" font-size="12" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3E🎬%3C/text%3E%3C/svg%3E';
                                                target.onerror = null;
                                            }}
                                        />
                                        <div className="absolute top-2 right-2">
                                            {video.selected ? (
                                                <Check className="w-5 h-5 text-green-500 bg-white rounded-full p-1" />
                                            ) : (
                                                <Square className="w-5 h-5 text-gray-400 bg-white rounded-full p-1" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm mb-1 line-clamp-2">
                                        {video.title}
                                    </h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                        Duration: {formatDuration(video.duration)}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {videos.length === 0 && !loading && (
                <div className="empty-state">
                    <div className="empty-state-icon">📋</div>
                    <h3 className="empty-state-title">No Playlist Loaded</h3>
                    <p className="empty-state-description">
                        Enter a YouTube playlist URL above to get started
                    </p>
                </div>
            )}
        </div>
    );
}
