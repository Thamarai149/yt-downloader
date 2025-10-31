import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Video, Scissors, Wand2, Palette, Zap, FileVideo,
    Download, Loader, Check, X, Settings, Sliders
} from 'lucide-react';

interface AdvancedFeaturesProps {
    backend: string;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function AdvancedFeatures({ backend, showToast }: AdvancedFeaturesProps) {
    const [activeFeature, setActiveFeature] = useState<'trim' | 'convert' | 'compress' | 'watermark'>('trim');
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Trim settings
    const [startTime, setStartTime] = useState('00:00:00');
    const [endTime, setEndTime] = useState('00:00:10');
    
    // Convert settings
    const [outputFormat, setOutputFormat] = useState('mp4');
    const [videoCodec, setVideoCodec] = useState('h264');
    const [audioCodec, setAudioCodec] = useState('aac');
    
    // Compress settings
    const [compressionLevel, setCompressionLevel] = useState('medium');
    const [targetSize, setTargetSize] = useState('50');
    
    // Watermark settings
    const [watermarkText, setWatermarkText] = useState('');
    const [watermarkPosition, setWatermarkPosition] = useState('bottom-right');
    const [watermarkOpacity, setWatermarkOpacity] = useState('0.5');

    const trimVideo = async () => {
        if (!url) {
            showToast('Please enter a YouTube URL', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${backend}/api/trim-video`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, startTime, endTime })
            });

            const data = await response.json();

            if (response.ok) {
                showToast(`Video trimmed successfully: ${data.filename}`, 'success');
            } else {
                showToast(data.error || 'Failed to trim video', 'error');
            }
        } catch (err) {
            showToast('Failed to trim video', 'error');
        }
        setLoading(false);
    };

    const convertVideo = async () => {
        if (!url) {
            showToast('Please enter a YouTube URL', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${backend}/api/convert-video`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, format: outputFormat, videoCodec, audioCodec })
            });

            const data = await response.json();

            if (response.ok) {
                showToast(`Video converted to ${outputFormat.toUpperCase()}: ${data.filename}`, 'success');
            } else {
                showToast(data.error || 'Failed to convert video', 'error');
            }
        } catch (err) {
            showToast('Failed to convert video', 'error');
        }
        setLoading(false);
    };

    const compressVideo = async () => {
        if (!url) {
            showToast('Please enter a YouTube URL', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${backend}/api/compress-video`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, level: compressionLevel, targetSize })
            });

            const data = await response.json();

            if (response.ok) {
                showToast(`Video compressed successfully: ${data.filename}`, 'success');
            } else {
                showToast(data.error || 'Failed to compress video', 'error');
            }
        } catch (err) {
            showToast('Failed to compress video', 'error');
        }
        setLoading(false);
    };

    const addWatermark = async () => {
        if (!url) {
            showToast('Please enter a YouTube URL', 'error');
            return;
        }

        if (!watermarkText) {
            showToast('Please enter watermark text', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${backend}/api/add-watermark`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    url, 
                    text: watermarkText, 
                    position: watermarkPosition,
                    opacity: watermarkOpacity
                })
            });

            const data = await response.json();

            if (response.ok) {
                showToast(`Watermark added successfully: ${data.filename}`, 'success');
            } else {
                showToast(data.error || 'Failed to add watermark', 'error');
            }
        } catch (err) {
            showToast('Failed to add watermark', 'error');
        }
        setLoading(false);
    };

    return (
        <div className="main-card p-6">
            <div className="section-header-modern mb-6">
                <div className="icon">
                    <Wand2 className="w-5 h-5" />
                </div>
                <h2>Advanced Video Tools</h2>
            </div>

            {/* Feature Tabs */}
            <div className="tab-nav-modern mb-6">
                <button
                    className={`tab-button-modern ${activeFeature === 'trim' ? 'active' : ''}`}
                    onClick={() => setActiveFeature('trim')}
                >
                    <Scissors className="w-4 h-4" />
                    <span>Trim</span>
                </button>
                <button
                    className={`tab-button-modern ${activeFeature === 'convert' ? 'active' : ''}`}
                    onClick={() => setActiveFeature('convert')}
                >
                    <FileVideo className="w-4 h-4" />
                    <span>Convert</span>
                </button>
                <button
                    className={`tab-button-modern ${activeFeature === 'compress' ? 'active' : ''}`}
                    onClick={() => setActiveFeature('compress')}
                >
                    <Zap className="w-4 h-4" />
                    <span>Compress</span>
                </button>
                <button
                    className={`tab-button-modern ${activeFeature === 'watermark' ? 'active' : ''}`}
                    onClick={() => setActiveFeature('watermark')}
                >
                    <Palette className="w-4 h-4" />
                    <span>Watermark</span>
                </button>
            </div>

            {/* Trim Video Feature */}
            {activeFeature === 'trim' && (
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

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Start Time (HH:MM:SS)</label>
                            <input
                                type="text"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                placeholder="00:00:00"
                                className="input-field-modern"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">End Time (HH:MM:SS)</label>
                            <input
                                type="text"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                placeholder="00:00:10"
                                className="input-field-modern"
                            />
                        </div>
                    </div>

                    <button
                        onClick={trimVideo}
                        disabled={loading}
                        className="btn btn-primary w-full"
                    >
                        {loading ? (
                            <>
                                <Loader className="w-4 h-4 animate-spin" />
                                Trimming...
                            </>
                        ) : (
                            <>
                                <Scissors className="w-4 h-4" />
                                Trim Video
                            </>
                        )}
                    </button>

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p>💡 Extract a specific portion of the video</p>
                        <p>⏱️ Format: HH:MM:SS (e.g., 00:01:30 for 1 minute 30 seconds)</p>
                    </div>
                </motion.div>
            )}

            {/* Convert Video Feature */}
            {activeFeature === 'convert' && (
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
                        <label className="block text-sm font-medium mb-2">Output Format</label>
                        <select
                            value={outputFormat}
                            onChange={(e) => setOutputFormat(e.target.value)}
                            className="select-field"
                        >
                            <option value="mp4">MP4</option>
                            <option value="avi">AVI</option>
                            <option value="mkv">MKV</option>
                            <option value="mov">MOV</option>
                            <option value="webm">WebM</option>
                            <option value="flv">FLV</option>
                            <option value="wmv">WMV</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Video Codec</label>
                            <select
                                value={videoCodec}
                                onChange={(e) => setVideoCodec(e.target.value)}
                                className="select-field"
                            >
                                <option value="h264">H.264</option>
                                <option value="h265">H.265 (HEVC)</option>
                                <option value="vp9">VP9</option>
                                <option value="av1">AV1</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Audio Codec</label>
                            <select
                                value={audioCodec}
                                onChange={(e) => setAudioCodec(e.target.value)}
                                className="select-field"
                            >
                                <option value="aac">AAC</option>
                                <option value="mp3">MP3</option>
                                <option value="opus">Opus</option>
                                <option value="vorbis">Vorbis</option>
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={convertVideo}
                        disabled={loading}
                        className="btn btn-primary w-full"
                    >
                        {loading ? (
                            <>
                                <Loader className="w-4 h-4 animate-spin" />
                                Converting...
                            </>
                        ) : (
                            <>
                                <FileVideo className="w-4 h-4" />
                                Convert Video
                            </>
                        )}
                    </button>

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p>💡 Convert video to different formats and codecs</p>
                        <p>🎬 Supports MP4, AVI, MKV, MOV, WebM, and more</p>
                    </div>
                </motion.div>
            )}

            {/* Compress Video Feature */}
            {activeFeature === 'compress' && (
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
                        <label className="block text-sm font-medium mb-2">Compression Level</label>
                        <select
                            value={compressionLevel}
                            onChange={(e) => setCompressionLevel(e.target.value)}
                            className="select-field"
                        >
                            <option value="low">Low (Better Quality)</option>
                            <option value="medium">Medium (Balanced)</option>
                            <option value="high">High (Smaller Size)</option>
                            <option value="extreme">Extreme (Smallest Size)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Target Size (MB)</label>
                        <input
                            type="number"
                            value={targetSize}
                            onChange={(e) => setTargetSize(e.target.value)}
                            placeholder="50"
                            className="input-field-modern"
                        />
                    </div>

                    <button
                        onClick={compressVideo}
                        disabled={loading}
                        className="btn btn-primary w-full"
                    >
                        {loading ? (
                            <>
                                <Loader className="w-4 h-4 animate-spin" />
                                Compressing...
                            </>
                        ) : (
                            <>
                                <Zap className="w-4 h-4" />
                                Compress Video
                            </>
                        )}
                    </button>

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p>💡 Reduce video file size while maintaining quality</p>
                        <p>📦 Perfect for sharing or storage</p>
                    </div>
                </motion.div>
            )}

            {/* Watermark Feature */}
            {activeFeature === 'watermark' && (
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
                        <label className="block text-sm font-medium mb-2">Watermark Text</label>
                        <input
                            type="text"
                            value={watermarkText}
                            onChange={(e) => setWatermarkText(e.target.value)}
                            placeholder="© Your Name 2024"
                            className="input-field-modern"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Position</label>
                            <select
                                value={watermarkPosition}
                                onChange={(e) => setWatermarkPosition(e.target.value)}
                                className="select-field"
                            >
                                <option value="top-left">Top Left</option>
                                <option value="top-right">Top Right</option>
                                <option value="bottom-left">Bottom Left</option>
                                <option value="bottom-right">Bottom Right</option>
                                <option value="center">Center</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Opacity</label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={watermarkOpacity}
                                onChange={(e) => setWatermarkOpacity(e.target.value)}
                                className="w-full"
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {(parseFloat(watermarkOpacity) * 100).toFixed(0)}%
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={addWatermark}
                        disabled={loading}
                        className="btn btn-primary w-full"
                    >
                        {loading ? (
                            <>
                                <Loader className="w-4 h-4 animate-spin" />
                                Adding Watermark...
                            </>
                        ) : (
                            <>
                                <Palette className="w-4 h-4" />
                                Add Watermark
                            </>
                        )}
                    </button>

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p>💡 Add custom text watermark to protect your content</p>
                        <p>🎨 Customize position and opacity</p>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
