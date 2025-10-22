import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Calendar, Plus, Trash2, Play, RotateCcw } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';

interface ScheduledDownload {
  id: string;
  url: string;
  title: string;
  scheduledTime: Date;
  type: 'video' | 'audio';
  quality: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  recurring?: 'daily' | 'weekly' | 'monthly';
}

interface DownloadSchedulerProps {
  onScheduleDownload: (download: Omit<ScheduledDownload, 'id' | 'status'>) => void;
  scheduledDownloads: ScheduledDownload[];
  onCancelScheduled: (id: string) => void;
  onRunNow: (id: string) => void;
}

export const DownloadScheduler: React.FC<DownloadSchedulerProps> = ({
  onScheduleDownload,
  scheduledDownloads,
  onCancelScheduled,
  onRunNow
}) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [type, setType] = useState<'video' | 'audio'>('video');
  const [quality, setQuality] = useState('best');
  const [recurring, setRecurring] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSchedule = () => {
    if (!url || !scheduledDate || !scheduledTime) return;

    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);

    if (scheduledDateTime <= new Date()) {
      alert('Scheduled time must be in the future');
      return;
    }

    const download: Omit<ScheduledDownload, 'id' | 'status'> = {
      url,
      title: title || 'Scheduled Download',
      scheduledTime: scheduledDateTime,
      type,
      quality,
      recurring: recurring === 'none' ? undefined : recurring
    };

    onScheduleDownload(download);

    // Reset form
    setUrl('');
    setTitle('');
    setScheduledDate('');
    setScheduledTime('');
    setRecurring('none');
  };

  const formatTimeUntil = (scheduledTime: Date) => {
    const now = currentTime;
    const diff = scheduledTime.getTime() - now.getTime();

    if (diff <= 0) return 'Overdue';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusColor = (status: ScheduledDownload['status']) => {
    switch (status) {
      case 'pending': return 'text-blue-600 bg-blue-50';
      case 'running': return 'text-green-600 bg-green-50';
      case 'completed': return 'text-gray-600 bg-gray-50';
      case 'failed': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: ScheduledDownload['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'running': return <Play className="w-4 h-4" />;
      case 'completed': return <div className="w-4 h-4 rounded-full bg-green-500" />;
      case 'failed': return <div className="w-4 h-4 rounded-full bg-red-500" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Set default date and time to 1 hour from now
  useEffect(() => {
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    setScheduledDate(oneHourFromNow.toISOString().split('T')[0]);
    setScheduledTime(oneHourFromNow.toTimeString().slice(0, 5));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Schedule New Download */}
      <div className="bg-white rounded-xl p-6 shadow-lg border">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Schedule Download
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="YouTube URL"
              label="🔗 Video URL"
              required
            />
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Optional custom title"
              label="📝 Title (optional)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              label="📅 Date"
              required
            />
            <Input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              label="⏰ Time"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">📁 Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'video' | 'audio')}
                className="select-field"
              >
                <option value="video">📺 Video</option>
                <option value="audio">🎵 Audio</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">⚙️ Quality</label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">🔄 Recurring</label>
              <select
                value={recurring}
                onChange={(e) => setRecurring(e.target.value as any)}
                className="select-field"
              >
                <option value="none">One-time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          <Button
            onClick={handleSchedule}
            variant="primary"
            disabled={!url || !scheduledDate || !scheduledTime}
            icon={<Plus className="w-4 h-4" />}
            className="w-full"
          >
            Schedule Download
          </Button>
        </div>
      </div>

      {/* Scheduled Downloads List */}
      <div className="bg-white rounded-xl p-6 shadow-lg border">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Scheduled Downloads ({scheduledDownloads.length})
        </h3>

        <div className="space-y-3">
          <AnimatePresence>
            {scheduledDownloads.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No scheduled downloads</p>
              </div>
            ) : (
              scheduledDownloads.map((download) => (
                <motion.div
                  key={download.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(download.status)}`}>
                        {getStatusIcon(download.status)}
                        {download.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        {download.type === 'video' ? '📺' : '🎵'} {download.quality}
                      </span>
                      {download.recurring && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex items-center gap-1">
                          <RotateCcw className="w-3 h-3" />
                          {download.recurring}
                        </span>
                      )}
                    </div>

                    <h4 className="font-medium text-gray-800 truncate mb-1">{download.title}</h4>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {download.scheduledTime.toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {download.scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {download.status === 'pending' && (
                        <span className="text-blue-600 font-medium">
                          in {formatTimeUntil(download.scheduledTime)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {download.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onRunNow(download.id)}
                        icon={<Play className="w-3 h-3" />}
                      >
                        Run Now
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => onCancelScheduled(download.id)}
                      icon={<Trash2 className="w-3 h-3" />}
                    >
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};