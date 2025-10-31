import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Calendar, Clock, Plus, Trash2, Edit2, Check, X,
    Loader, Play, Pause, AlertCircle
} from 'lucide-react';

interface ScheduledDownload {
    id: string;
    url: string;
    title: string;
    scheduledTime: string;
    quality: string;
    type: string;
    status: 'pending' | 'completed' | 'failed';
    repeat?: 'none' | 'daily' | 'weekly';
}

interface ScheduleDownloaderProps {
    backend: string;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function ScheduleDownloader({ backend, showToast }: ScheduleDownloaderProps) {
    const [url, setUrl] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [quality, setQuality] = useState('best');
    const [type, setType] = useState<'video' | 'audio'>('video');
    const [repeat, setRepeat] = useState<'none' | 'daily' | 'weekly'>('none');
    const [schedules, setSchedules] = useState<ScheduledDownload[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        loadSchedules();
        const interval = setInterval(loadSchedules, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const loadSchedules = async () => {
        try {
            const response = await fetch(`${backend}/api/scheduled-downloads`);
            const data = await response.json();
            if (response.ok) {
                setSchedules(data.schedules || []);
            }
        } catch (err) {
            console.error('Failed to load schedules:', err);
        }
    };

    const scheduleDownload = async () => {
        if (!url || !scheduledDate || !scheduledTime) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        const scheduledDateTime = `${scheduledDate}T${scheduledTime}`;
        const scheduledTimestamp = new Date(scheduledDateTime).getTime();
        const now = Date.now();

        if (scheduledTimestamp <= now) {
            showToast('Scheduled time must be in the future', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${backend}/api/schedule-download`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url,
                    scheduledTime: scheduledDateTime,
                    quality,
                    type,
                    repeat
                })
            });

            const data = await response.json();

            if (response.ok) {
                showToast('Download scheduled successfully!', 'success');
                setUrl('');
                setScheduledDate('');
                setScheduledTime('');
                loadSchedules();
            } else {
                showToast(data.error || 'Failed to schedule download', 'error');
            }
        } catch (err) {
            showToast('Failed to schedule download', 'error');
        }
        setLoading(false);
    };

    const deleteSchedule = async (id: string) => {
        if (!confirm('Delete this scheduled download?')) return;

        try {
            const response = await fetch(`${backend}/api/scheduled-downloads/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showToast('Schedule deleted', 'success');
                loadSchedules();
            } else {
                showToast('Failed to delete schedule', 'error');
            }
        } catch (err) {
            showToast('Failed to delete schedule', 'error');
        }
    };

    const pauseSchedule = async (id: string) => {
        try {
            const response = await fetch(`${backend}/api/scheduled-downloads/${id}/pause`, {
                method: 'POST'
            });

            if (response.ok) {
                showToast('Schedule paused', 'success');
                loadSchedules();
            } else {
                showToast('Failed to pause schedule', 'error');
            }
        } catch (err) {
            showToast('Failed to pause schedule', 'error');
        }
    };

    const resumeSchedule = async (id: string) => {
        try {
            const response = await fetch(`${backend}/api/scheduled-downloads/${id}/resume`, {
                method: 'POST'
            });

            if (response.ok) {
                showToast('Schedule resumed', 'success');
                loadSchedules();
            } else {
                showToast('Failed to resume schedule', 'error');
            }
        } catch (err) {
            showToast('Failed to resume schedule', 'error');
        }
    };

    const formatDateTime = (dateTime: string) => {
        const date = new Date(dateTime);
        return date.toLocaleString();
    };

    const getTimeUntil = (scheduledTime: string) => {
        const now = Date.now();
        const scheduled = new Date(scheduledTime).getTime();
        const diff = scheduled - now;

        if (diff <= 0) return 'Starting soon...';

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 24) {
            const days = Math.floor(hours / 24);
            return `In ${days} day${days > 1 ? 's' : ''}`;
        }
        if (hours > 0) {
            return `In ${hours}h ${minutes}m`;
        }
        return `In ${minutes} minute${minutes > 1 ? 's' : ''}`;
    };

    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().slice(0, 5);

    return (
        <div className="main-card p-6">
            <div className="section-header-modern mb-6">
                <div className="icon">
                    <Calendar className="w-5 h-5" />
                </div>
                <h2>Schedule Downloads</h2>
            </div>

            {/* Schedule Form */}
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

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Date</label>
                        <input
                            type="date"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            min={today}
                            className="input-field-modern"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Time</label>
                        <input
                            type="time"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            className="input-field-modern"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as 'video' | 'audio')}
                            className="select-field"
                        >
                            <option value="video">Video</option>
                            <option value="audio">Audio</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Quality</label>
                        <select
                            value={quality}
                            onChange={(e) => setQuality(e.target.value)}
                            className="select-field"
                        >
                            <option value="best">Best</option>
                            <option value="1080">1080p</option>
                            <option value="720">720p</option>
                            <option value="480">480p</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Repeat</label>
                        <select
                            value={repeat}
                            onChange={(e) => setRepeat(e.target.value as any)}
                            className="select-field"
                        >
                            <option value="none">Once</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                        </select>
                    </div>
                </div>

                <button
                    onClick={scheduleDownload}
                    disabled={loading}
                    className="btn btn-primary w-full"
                >
                    {loading ? (
                        <>
                            <Loader className="w-4 h-4 animate-spin" />
                            Scheduling...
                        </>
                    ) : (
                        <>
                            <Plus className="w-4 h-4" />
                            Schedule Download
                        </>
                    )}
                </button>
            </div>

            {/* Scheduled Downloads List */}
            <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Scheduled Downloads ({schedules.length})
                </h3>

                {schedules.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📅</div>
                        <h3 className="empty-state-title">No Scheduled Downloads</h3>
                        <p className="empty-state-description">
                            Schedule downloads to start automatically at a specific time
                        </p>
                    </div>
                ) : (
                    schedules.map((schedule) => (
                        <motion.div
                            key={schedule.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="download-item-enhanced"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold mb-2 line-clamp-2">
                                        {schedule.title || 'Scheduled Download'}
                                    </h4>
                                    <div className="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <span className="badge-modern">
                                            {schedule.type}
                                        </span>
                                        <span className="badge-modern">
                                            {schedule.quality}
                                        </span>
                                        {schedule.repeat !== 'none' && (
                                            <span className="badge-modern success">
                                                Repeat: {schedule.repeat}
                                            </span>
                                        )}
                                        <span className={`badge-modern ${
                                            schedule.status === 'completed' ? 'success' :
                                            schedule.status === 'failed' ? 'error' : ''
                                        }`}>
                                            {schedule.status}
                                        </span>
                                    </div>
                                    <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">
                                        <Clock className="w-4 h-4 inline mr-1" />
                                        {formatDateTime(schedule.scheduledTime)}
                                    </p>
                                    {schedule.status === 'pending' && (
                                        <p className="text-sm mt-1 text-primary font-medium">
                                            {getTimeUntil(schedule.scheduledTime)}
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    {schedule.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => pauseSchedule(schedule.id)}
                                                className="action-btn"
                                                title="Pause"
                                            >
                                                <Pause className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setEditingId(schedule.id)}
                                                className="action-btn"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => deleteSchedule(schedule.id)}
                                        className="action-btn cancel"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                        <p className="font-semibold mb-1">💡 Pro Tips:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Schedule downloads during off-peak hours for faster speeds</li>
                            <li>Use repeat options for regular content updates</li>
                            <li>The server must be running at the scheduled time</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
