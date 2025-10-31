import { useState } from 'react';
import {
    Share2, Loader, Scissors, Crop, Maximize2, 
    Film, Sparkles, Video, Camera, MessageCircle
} from 'lucide-react';

interface SocialMediaOptimizerProps {
    backend: string;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function SocialMediaOptimizer({ backend, showToast }: SocialMediaOptimizerProps) {
    const [url, setUrl] = useState('');
    const [platform, setPlatform] = useState<'instagram' | 'tiktok' | 'youtube-shorts' | 'twitter' | 'facebook'>('instagram');
    const [loading, setLoading] = useState(false);
    const [optimizationType, setOptimizationType] = useState<'resize' | 'clip' | 'caption'>('resize');

    // Clip settings
    const [clipStart, setClipStart] = useState('00:00:00');
    const [clipDuration, setClipDuration] = useState('00:00:15');

    const platformSpecs = {
        instagram: {
            name: 'Instagram',
            icon: Camera,
            formats: [
                { name: 'Story', ratio: '9:16', duration: '15s', size: '1080x1920' },
                { name: 'Reel', ratio: '9:16', duration: '90s', size: '1080x1920' },
                { name: 'Feed', ratio: '1:1', duration: '60s', size: '1080x1080' },
                { name: 'IGTV', ratio: '9:16', duration: '60min', size: '1080x1920' }
            ]
        },
        tiktok: {
            name: 'TikTok',
            icon: Video,
            formats: [
                { name: 'Video', ratio: '9:16', duration: '10min', size: '1080x1920' },
                { name: 'Short', ratio: '9:16', duration: '60s', size: '1080x1920' }
            ]
        },
        'youtube-shorts': {
            name: 'YouTube Shorts',
            icon: Video,
            formats: [
                { name: 'Short', ratio: '9:16', duration: '60s', size: '1080x1920' }
            ]
        },
        twitter: {
            name: 'Twitter/X',
            icon: MessageCircle,
            formats: [
                { name: 'Video', ratio: '16:9', duration: '2min20s', size: '1280x720' },
                { name: 'Square', ratio: '1:1', duration: '2min20s', size: '720x720' }
            ]
        },
        facebook: {
            name: 'Facebook',
            icon: Share2,
            formats: [
                { name: 'Feed', ratio: '16:9', duration: '240min', size: '1280x720' },
                { name: 'Story', ratio: '9:16', duration: '20s', size: '1080x1920' }
            ]
        }
    };

    const optimizeForPlatform = async () => {
        if (!url) {
            showToast('Please enter a YouTube URL', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${backend}/api/social-optimize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url,
                    platform,
                    type: optimizationType,
                    clipStart,
                    clipDuration
                })
            });

            const data = await response.json();

            if (response.ok) {
                showToast(`Video optimized for ${platformSpecs[platform].name}!`, 'success');
            } else {
                showToast(data.error || 'Failed to optimize video', 'error');
            }
        } catch (err) {
            showToast('Failed to optimize video', 'error');
        }
        setLoading(false);
    };

    const generateCaptions = async () => {
        if (!url) {
            showToast('Please enter a YouTube URL', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${backend}/api/generate-captions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, platform })
            });

            const data = await response.json();

            if (response.ok) {
                showToast('Captions generated successfully!', 'success');
            } else {
                showToast(data.error || 'Failed to generate captions', 'error');
            }
        } catch (err) {
            showToast('Failed to generate captions', 'error');
        }
        setLoading(false);
    };

    const PlatformIcon = platformSpecs[platform].icon;

    return (
        <div className="main-card p-6">
            <div className="section-header-modern mb-6">
                <div className="icon">
                    <Share2 className="w-5 h-5" />
                </div>
                <h2>Social Media Optimizer</h2>
            </div>

            {/* Video URL */}
            <div className="space-y-4 mb-6">
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

                {/* Platform Selection */}
                <div>
                    <label className="block text-sm font-medium mb-2">Target Platform</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.entries(platformSpecs).map(([key, spec]) => {
                            const Icon = spec.icon;
                            return (
                                <button
                                    key={key}
                                    onClick={() => setPlatform(key as any)}
                                    className={`p-4 rounded-lg border-2 transition-all ${platform === key
                                            ? 'border-primary bg-primary/10'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                                        }`}
                                >
                                    <Icon className="w-6 h-6 mx-auto mb-2" />
                                    <p className="text-sm font-medium">{spec.name}</p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Optimization Type */}
                <div>
                    <label className="block text-sm font-medium mb-2">Optimization Type</label>
                    <div className="grid grid-cols-3 gap-3">
                        <button
                            onClick={() => setOptimizationType('resize')}
                            className={`p-3 rounded-lg border-2 transition-all ${optimizationType === 'resize'
                                    ? 'border-primary bg-primary/10'
                                    : 'border-gray-200 dark:border-gray-700'
                                }`}
                        >
                            <Crop className="w-5 h-5 mx-auto mb-1" />
                            <p className="text-xs font-medium">Resize</p>
                        </button>
                        <button
                            onClick={() => setOptimizationType('clip')}
                            className={`p-3 rounded-lg border-2 transition-all ${optimizationType === 'clip'
                                    ? 'border-primary bg-primary/10'
                                    : 'border-gray-200 dark:border-gray-700'
                                }`}
                        >
                            <Scissors className="w-5 h-5 mx-auto mb-1" />
                            <p className="text-xs font-medium">Clip</p>
                        </button>
                        <button
                            onClick={() => setOptimizationType('caption')}
                            className={`p-3 rounded-lg border-2 transition-all ${optimizationType === 'caption'
                                    ? 'border-primary bg-primary/10'
                                    : 'border-gray-200 dark:border-gray-700'
                                }`}
                        >
                            <Sparkles className="w-5 h-5 mx-auto mb-1" />
                            <p className="text-xs font-medium">Caption</p>
                        </button>
                    </div>
                </div>

                {/* Clip Settings */}
                {optimizationType === 'clip' && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Start Time</label>
                            <input
                                type="text"
                                value={clipStart}
                                onChange={(e) => setClipStart(e.target.value)}
                                placeholder="00:00:00"
                                className="input-field-modern"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Duration</label>
                            <input
                                type="text"
                                value={clipDuration}
                                onChange={(e) => setClipDuration(e.target.value)}
                                placeholder="00:00:15"
                                className="input-field-modern"
                            />
                        </div>
                    </div>
                )}

                {/* Platform Specs */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                        <PlatformIcon className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold">{platformSpecs[platform].name} Specifications</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {platformSpecs[platform].formats.map((format, i) => (
                            <div key={i} className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                                <p className="font-semibold text-sm mb-1">{format.name}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    Ratio: {format.ratio}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    Max: {format.duration}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    Size: {format.size}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={optimizeForPlatform}
                        disabled={loading}
                        className="btn btn-primary"
                    >
                        {loading ? (
                            <>
                                <Loader className="w-4 h-4 animate-spin" />
                                Optimizing...
                            </>
                        ) : (
                            <>
                                <Maximize2 className="w-4 h-4" />
                                Optimize Video
                            </>
                        )}
                    </button>
                    <button
                        onClick={generateCaptions}
                        disabled={loading}
                        className="btn btn-secondary"
                    >
                        {loading ? (
                            <>
                                <Loader className="w-4 h-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Generate Captions
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Tips */}
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Film className="w-4 h-4" />
                    💡 Optimization Tips
                </h4>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <li>• <strong>Instagram Reels:</strong> 9:16 vertical, max 90 seconds</li>
                    <li>• <strong>TikTok:</strong> 9:16 vertical, up to 10 minutes</li>
                    <li>• <strong>YouTube Shorts:</strong> 9:16 vertical, max 60 seconds</li>
                    <li>• <strong>Twitter:</strong> 16:9 horizontal, max 2:20</li>
                    <li>• <strong>Facebook:</strong> Multiple formats supported</li>
                </ul>
            </div>
        </div>
    );
}
