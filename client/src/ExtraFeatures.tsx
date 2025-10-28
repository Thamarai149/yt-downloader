import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Download, FileText, Image, Users, RefreshCw, Upload,
    Check, X, Loader, Copy, Sparkles
} from 'lucide-react';

interface ExtraFeaturesProps {
    backend: string;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function ExtraFeatures({ backend, showToast }: ExtraFeaturesProps) {
    const [activeFeature, setActiveFeature] = useState<'subtitles' | 'thumbnail' | 'channel' | 'bulk'>('subtitles');
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['en']);
    const [channelVideos, setChannelVideos] = useState<any[]>([]);
    const [bulkUrls, setBulkUrls] = useState('');

    const availableLanguages = [
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
        { code: 'de', name: 'German' },
        { code: 'it', name: 'Italian' },
        { code: 'pt', name: 'Portuguese' },
        { code: 'ru', name: 'Russian' },
        { code: 'ja', name: 'Japanese' },
        { code: 'ko', name: 'Korean' },
        { code: 'zh', name: 'Chinese' },
        { code: 'ar', name: 'Arabic' },
        { code: 'hi', name: 'Hindi' }
    ];

    const toggleLanguage = (code: string) => {
        setSelectedLanguages(prev =>
            prev.includes(code)
                ? prev.filter(l => l !== code)
                : [...prev, code]
        );
    };

    const downloadSubtitles = async () => {
        if (!url) {
            showToast('Please enter a YouTube URL', 'error');
            return;
        }

        if (selectedLanguages.length === 0) {
            showToast('Please select at least one language', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${backend}/api/download-subtitles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, languages: selectedLanguages })
            });

            const data = await response.json();

            if (response.ok) {
                showToast(`Downloaded ${data.subtitles.length} subtitle(s) for: ${data.title}`, 'success');
            } else {
                showToast(data.error || 'Failed to download subtitles', 'error');
            }
        } catch (err) {
            showToast('Failed to download subtitles', 'error');
        }
        setLoading(false);
    };

    const downloadThumbnail = async () => {
        if (!url) {
            showToast('Please enter a YouTube URL', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${backend}/api/download-thumbnail`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const data = await response.json();

            if (response.ok) {
                showToast(`Thumbnail downloaded: ${data.filename}`, 'success');
            } else {
                showToast(data.error || 'Failed to download thumbnail', 'error');
            }
        } catch (err) {
            showToast('Failed to download thumbnail', 'error');
        }
        setLoading(false);
    };

    const fetchChannelVideos = async () => {
        if (!url) {
            showToast('Please enter a channel URL', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${backend}/api/channel?url=${encodeURIComponent(url)}&limit=50`);
            const data = await response.json();

            if (response.ok) {
                setChannelVideos(data.videos);
                showToast(`Found ${data.videos.length} videos from ${data.channel}`, 'success');
            } else {
                showToast(data.error || 'Failed to fetch channel videos', 'error');
                setChannelVideos([]);
            }
        } catch (err) {
            showToast('Failed to fetch channel videos', 'error');
            setChannelVideos([]);
        }
        setLoading(false);
    };

    const bulkImport = async () => {
        const urls = bulkUrls.split('\n').filter(u => u.trim());

        if (urls.length === 0) {
            showToast('Please enter at least one URL', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${backend}/api/bulk-import`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ urls, type: 'video', quality: 'best' })
            });

            const data = await response.json();

            if (response.ok) {
                showToast(data.message, 'success');
                setBulkUrls('');
            } else {
                showToast(data.error || 'Failed to import URLs', 'error');
            }
        } catch (err) {
            showToast('Failed to import URLs', 'error');
        }
        setLoading(false);
    };

    return (
        <div className="main-card p-6">
            <div className="section-header-modern mb-6">
                <div className="icon">
                    <Sparkles className="w-5 h-5" />
                </div>
                <h2>Extra Features</h2>
            </div>

            {/* Feature Tabs */}
            <div className="tab-nav-modern mb-6">
                <button
                    className={`tab-button-modern ${activeFeature === 'subtitles' ? 'active' : ''}`}
                    onClick={() => setActiveFeature('subtitles')}
                >
                    <FileText className="w-4 h-4" />
                    <span>Subtitles</span>
                </button>
                <button
                    className={`tab-button-modern ${activeFeature === 'thumbnail' ? 'active' : ''}`}
                    onClick={() => setActiveFeature('thumbnail')}
                >
                    <Image className="w-4 h-4" />
                    <span>Thumbnail</span>
                </button>
                <button
                    className={`tab-button-modern ${activeFeature === 'channel' ? 'active' : ''}`}
                    onClick={() => setActiveFeature('channel')}
                >
                    <Users className="w-4 h-4" />
                    <span>Channel</span>
                </button>
                <button
                    className={`tab-button-modern ${activeFeature === 'bulk' ? 'active' : ''}`}
                    onClick={() => setActiveFeature('bulk')}
                >
                    <Upload className="w-4 h-4" />
                    <span>Bulk Import</span>
                </button>
            </div>

            {/* Subtitles Feature */}
            {activeFeature === 'subtitles' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                >
                    <div>
                        <label className="block text-sm font-medium mb-2">Video URL</label>
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="input-field-modern"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Select Languages</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {availableLanguages.map(lang => (
                                <label 
                                    key={lang.code} 
                                    className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                        selectedLanguages.includes(lang.code)
                                            ? 'border-primary bg-primary/10 shadow-md'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedLanguages.includes(lang.code)}
                                        onChange={() => toggleLanguage(lang.code)}
                                        className="checkbox"
                                    />
                                    <span className="text-sm font-medium">{lang.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={downloadSubtitles}
                        disabled={loading}
                        className="btn btn-primary w-full"
                    >
                        {loading ? (
                            <>
                                <Loader className="w-4 h-4 animate-spin" />
                                Downloading...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4" />
                                Download Subtitles
                            </>
                        )}
                    </button>
                </motion.div>
            )}

            {/* Thumbnail Feature */}
            {activeFeature === 'thumbnail' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                >
                    <div>
                        <label className="block text-sm font-medium mb-2">Video URL</label>
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="input-field-modern"
                        />
                    </div>

                    <button
                        onClick={downloadThumbnail}
                        disabled={loading}
                        className="btn btn-primary w-full"
                    >
                        {loading ? (
                            <>
                                <Loader className="w-4 h-4 animate-spin" />
                                Downloading...
                            </>
                        ) : (
                            <>
                                <Image className="w-4 h-4" />
                                Download Thumbnail
                            </>
                        )}
                    </button>

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p>💡 This will download the highest quality thumbnail available</p>
                    </div>
                </motion.div>
            )}

            {/* Channel Feature */}
            {activeFeature === 'channel' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                >
                    <div>
                        <label className="block text-sm font-medium mb-2">Channel URL</label>
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://www.youtube.com/@channelname"
                            className="input-field-modern"
                        />
                    </div>

                    <button
                        onClick={fetchChannelVideos}
                        disabled={loading}
                        className="btn btn-primary w-full"
                    >
                        {loading ? (
                            <>
                                <Loader className="w-4 h-4 animate-spin" />
                                Loading...
                            </>
                        ) : (
                            <>
                                <Users className="w-4 h-4" />
                                Fetch Channel Videos
                            </>
                        )}
                    </button>

                    {channelVideos.length > 0 && (
                        <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                            <p className="text-sm font-medium">{channelVideos.length} videos found</p>
                            {channelVideos.map((video, index) => (
                                <div key={index} className="p-3 border rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <p className="text-sm font-medium">{video.title}</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{video.url}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}

            {/* Bulk Import Feature */}
            {activeFeature === 'bulk' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                >
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Paste URLs (one per line)
                        </label>
                        <textarea
                            value={bulkUrls}
                            onChange={(e) => setBulkUrls(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=...&#10;https://www.youtube.com/watch?v=...&#10;https://www.youtube.com/watch?v=..."
                            className="input-field-modern min-h-[200px]"
                            rows={10}
                        />
                    </div>

                    <button
                        onClick={bulkImport}
                        disabled={loading}
                        className="btn btn-primary w-full"
                    >
                        {loading ? (
                            <>
                                <Loader className="w-4 h-4 animate-spin" />
                                Importing...
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4" />
                                Import & Download All
                            </>
                        )}
                    </button>

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p>💡 Downloads will start automatically with 2-second intervals</p>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
