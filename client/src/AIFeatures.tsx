import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Brain, Sparkles, FileText, Image, Mic, Video,
    Loader, Download, Wand2, Zap, MessageSquare
} from 'lucide-react';

interface AIFeaturesProps {
    backend: string;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function AIFeatures({ backend, showToast }: AIFeaturesProps) {
    const [activeFeature, setActiveFeature] = useState<'summary' | 'transcript' | 'translate' | 'tags' | 'chapters'>('summary');
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [targetLanguage, setTargetLanguage] = useState('es');

    const generateSummary = async () => {
        if (!url) {
            showToast('Please enter a YouTube URL', 'error');
            return;
        }

        setLoading(true);
        setResult(null);
        try {
            const response = await fetch(`${backend}/api/ai/summary`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const data = await response.json();

            if (response.ok) {
                setResult(data);
                showToast('Summary generated successfully!', 'success');
            } else {
                showToast(data.error || 'Failed to generate summary', 'error');
            }
        } catch (err) {
            showToast('Failed to generate summary', 'error');
        }
        setLoading(false);
    };

    const generateTranscript = async () => {
        if (!url) {
            showToast('Please enter a YouTube URL', 'error');
            return;
        }

        setLoading(true);
        setResult(null);
        try {
            const response = await fetch(`${backend}/api/ai/transcript`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const data = await response.json();

            if (response.ok) {
                setResult(data);
                showToast('Transcript generated successfully!', 'success');
            } else {
                showToast(data.error || 'Failed to generate transcript', 'error');
            }
        } catch (err) {
            showToast('Failed to generate transcript', 'error');
        }
        setLoading(false);
    };

    const translateVideo = async () => {
        if (!url) {
            showToast('Please enter a YouTube URL', 'error');
            return;
        }

        setLoading(true);
        setResult(null);
        try {
            const response = await fetch(`${backend}/api/ai/translate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, targetLanguage })
            });

            const data = await response.json();

            if (response.ok) {
                setResult(data);
                showToast('Translation completed!', 'success');
            } else {
                showToast(data.error || 'Failed to translate', 'error');
            }
        } catch (err) {
            showToast('Failed to translate', 'error');
        }
        setLoading(false);
    };

    const generateTags = async () => {
        if (!url) {
            showToast('Please enter a YouTube URL', 'error');
            return;
        }

        setLoading(true);
        setResult(null);
        try {
            const response = await fetch(`${backend}/api/ai/tags`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const data = await response.json();

            if (response.ok) {
                setResult(data);
                showToast('Tags generated successfully!', 'success');
            } else {
                showToast(data.error || 'Failed to generate tags', 'error');
            }
        } catch (err) {
            showToast('Failed to generate tags', 'error');
        }
        setLoading(false);
    };

    const generateChapters = async () => {
        if (!url) {
            showToast('Please enter a YouTube URL', 'error');
            return;
        }

        setLoading(true);
        setResult(null);
        try {
            const response = await fetch(`${backend}/api/ai/chapters`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const data = await response.json();

            if (response.ok) {
                setResult(data);
                showToast('Chapters generated successfully!', 'success');
            } else {
                showToast(data.error || 'Failed to generate chapters', 'error');
            }
        } catch (err) {
            showToast('Failed to generate chapters', 'error');
        }
        setLoading(false);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied to clipboard!', 'success');
        });
    };

    return (
        <div className="main-card p-6">
            <div className="section-header-modern mb-6">
                <div className="icon">
                    <Brain className="w-5 h-5" />
                </div>
                <h2>AI-Powered Tools</h2>
            </div>

            {/* Feature Tabs */}
            <div className="tab-nav-modern mb-6">
                <button
                    className={`tab-button-modern ${activeFeature === 'summary' ? 'active' : ''}`}
                    onClick={() => setActiveFeature('summary')}
                >
                    <Sparkles className="w-4 h-4" />
                    <span>Summary</span>
                </button>
                <button
                    className={`tab-button-modern ${activeFeature === 'transcript' ? 'active' : ''}`}
                    onClick={() => setActiveFeature('transcript')}
                >
                    <FileText className="w-4 h-4" />
                    <span>Transcript</span>
                </button>
                <button
                    className={`tab-button-modern ${activeFeature === 'translate' ? 'active' : ''}`}
                    onClick={() => setActiveFeature('translate')}
                >
                    <MessageSquare className="w-4 h-4" />
                    <span>Translate</span>
                </button>
                <button
                    className={`tab-button-modern ${activeFeature === 'tags' ? 'active' : ''}`}
                    onClick={() => setActiveFeature('tags')}
                >
                    <Zap className="w-4 h-4" />
                    <span>Tags</span>
                </button>
                <button
                    className={`tab-button-modern ${activeFeature === 'chapters' ? 'active' : ''}`}
                    onClick={() => setActiveFeature('chapters')}
                >
                    <Video className="w-4 h-4" />
                    <span>Chapters</span>
                </button>
            </div>

            {/* AI Summary */}
            {activeFeature === 'summary' && (
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
                        onClick={generateSummary}
                        disabled={loading}
                        className="btn btn-primary w-full"
                    >
                        {loading ? (
                            <>
                                <Loader className="w-4 h-4 animate-spin" />
                                Generating Summary...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Generate AI Summary
                            </>
                        )}
                    </button>

                    {result && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="font-semibold text-lg">📝 AI Summary</h3>
                                <button
                                    onClick={() => copyToClipboard(result.summary)}
                                    className="btn btn-secondary text-sm"
                                >
                                    Copy
                                </button>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {result.summary}
                            </p>
                            {result.keyPoints && (
                                <div className="mt-4">
                                    <h4 className="font-semibold mb-2">🎯 Key Points:</h4>
                                    <ul className="list-disc list-inside space-y-1">
                                        {result.keyPoints.map((point: string, i: number) => (
                                            <li key={i} className="text-gray-700 dark:text-gray-300">
                                                {point}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p>🤖 AI-powered video summarization</p>
                        <p>📊 Get key points and main ideas instantly</p>
                    </div>
                </motion.div>
            )}

            {/* Transcript */}
            {activeFeature === 'transcript' && (
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
                        onClick={generateTranscript}
                        disabled={loading}
                        className="btn btn-primary w-full"
                    >
                        {loading ? (
                            <>
                                <Loader className="w-4 h-4 animate-spin" />
                                Generating Transcript...
                            </>
                        ) : (
                            <>
                                <FileText className="w-4 h-4" />
                                Generate Transcript
                            </>
                        )}
                    </button>

                    {result && (
                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg max-h-96 overflow-y-auto">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="font-semibold text-lg">📄 Full Transcript</h3>
                                <button
                                    onClick={() => copyToClipboard(result.transcript)}
                                    className="btn btn-secondary text-sm"
                                >
                                    Copy
                                </button>
                            </div>
                            <div className="space-y-2">
                                {result.transcript.split('\n').map((line: string, i: number) => (
                                    <p key={i} className="text-gray-700 dark:text-gray-300">
                                        {line}
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p>📝 Extract full video transcript</p>
                        <p>🔍 Searchable and copyable text</p>
                    </div>
                </motion.div>
            )}

            {/* Translate */}
            {activeFeature === 'translate' && (
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
                        <label className="block text-sm font-medium mb-2">Target Language</label>
                        <select
                            value={targetLanguage}
                            onChange={(e) => setTargetLanguage(e.target.value)}
                            className="select-field"
                        >
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                            <option value="de">German</option>
                            <option value="it">Italian</option>
                            <option value="pt">Portuguese</option>
                            <option value="ru">Russian</option>
                            <option value="ja">Japanese</option>
                            <option value="ko">Korean</option>
                            <option value="zh">Chinese</option>
                            <option value="ar">Arabic</option>
                            <option value="hi">Hindi</option>
                        </select>
                    </div>

                    <button
                        onClick={translateVideo}
                        disabled={loading}
                        className="btn btn-primary w-full"
                    >
                        {loading ? (
                            <>
                                <Loader className="w-4 h-4 animate-spin" />
                                Translating...
                            </>
                        ) : (
                            <>
                                <MessageSquare className="w-4 h-4" />
                                Translate Video
                            </>
                        )}
                    </button>

                    {result && (
                        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="font-semibold text-lg">🌍 Translation</h3>
                                <button
                                    onClick={() => copyToClipboard(result.translation)}
                                    className="btn btn-secondary text-sm"
                                >
                                    Copy
                                </button>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {result.translation}
                            </p>
                        </div>
                    )}

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p>🌐 AI-powered translation</p>
                        <p>🗣️ Supports 11+ languages</p>
                    </div>
                </motion.div>
            )}

            {/* Tags */}
            {activeFeature === 'tags' && (
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
                        onClick={generateTags}
                        disabled={loading}
                        className="btn btn-primary w-full"
                    >
                        {loading ? (
                            <>
                                <Loader className="w-4 h-4 animate-spin" />
                                Generating Tags...
                            </>
                        ) : (
                            <>
                                <Zap className="w-4 h-4" />
                                Generate SEO Tags
                            </>
                        )}
                    </button>

                    {result && (
                        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="font-semibold text-lg">🏷️ Generated Tags</h3>
                                <button
                                    onClick={() => copyToClipboard(result.tags.join(', '))}
                                    className="btn btn-secondary text-sm"
                                >
                                    Copy All
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {result.tags.map((tag: string, i: number) => (
                                    <span
                                        key={i}
                                        className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-sm font-medium border-2 border-primary cursor-pointer hover:bg-primary hover:text-white transition-colors"
                                        onClick={() => copyToClipboard(tag)}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p>🎯 AI-generated SEO tags</p>
                        <p>📈 Improve video discoverability</p>
                    </div>
                </motion.div>
            )}

            {/* Chapters */}
            {activeFeature === 'chapters' && (
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
                        onClick={generateChapters}
                        disabled={loading}
                        className="btn btn-primary w-full"
                    >
                        {loading ? (
                            <>
                                <Loader className="w-4 h-4 animate-spin" />
                                Generating Chapters...
                            </>
                        ) : (
                            <>
                                <Video className="w-4 h-4" />
                                Generate Chapters
                            </>
                        )}
                    </button>

                    {result && (
                        <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="font-semibold text-lg">📑 Video Chapters</h3>
                                <button
                                    onClick={() => copyToClipboard(
                                        result.chapters.map((c: any) => `${c.timestamp} - ${c.title}`).join('\n')
                                    )}
                                    className="btn btn-secondary text-sm"
                                >
                                    Copy
                                </button>
                            </div>
                            <div className="space-y-3">
                                {result.chapters.map((chapter: any, i: number) => (
                                    <div key={i} className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                                        <span className="font-mono text-sm font-semibold text-primary">
                                            {chapter.timestamp}
                                        </span>
                                        <div className="flex-1">
                                            <h4 className="font-semibold">{chapter.title}</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {chapter.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p>📖 AI-generated video chapters</p>
                        <p>⏱️ Automatic timestamp detection</p>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
