import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  X, 
  Download, 
  Clock, 
  BarChart3,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { DownloadItem } from '../types/index';
import { Button } from './Button';
import { DownloadCard } from './DownloadCard';

interface DownloadQueueProps {
  activeDownloads: DownloadItem[];
  onCancelDownload: (id: string) => void;
  onRefreshQueue: () => void;
  onDownloadFile: (id: string) => void;
}

export const DownloadQueue: React.FC<DownloadQueueProps> = ({
  activeDownloads,
  onCancelDownload,
  onRefreshQueue,
  onDownloadFile
}) => {
  const [sortBy, setSortBy] = useState<'newest' | 'progress' | 'title'>('newest');

  // Sort downloads
  const sortedDownloads = [...activeDownloads].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
      case 'progress':
        return b.progress - a.progress;
      case 'title':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  // Statistics
  const stats = {
    total: activeDownloads.length,
    downloading: activeDownloads.filter(d => d.status === 'downloading').length,
    pending: activeDownloads.filter(d => d.status === 'pending' || d.status === 'starting').length,
    completed: activeDownloads.filter(d => d.status === 'completed').length,
    failed: activeDownloads.filter(d => d.status === 'failed').length,
    avgProgress: activeDownloads.length > 0 
      ? Math.round(activeDownloads.reduce((sum, d) => sum + d.progress, 0) / activeDownloads.length)
      : 0
  };

  const getStatusIcon = (status: DownloadItem['status']) => {
    switch (status) {
      case 'downloading':
        return <Play className="w-4 h-4 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
      case 'starting':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-white rounded-xl p-6 shadow-lg border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Download className="w-6 h-6" />
            Download Queue
          </h2>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={onRefreshQueue}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-blue-700">Total</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{stats.downloading}</div>
            <div className="text-sm text-green-700">Active</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-yellow-700">Pending</div>
          </div>
          <div className="bg-emerald-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-emerald-600">{stats.completed}</div>
            <div className="text-sm text-emerald-700">Completed</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-red-700">Failed</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.avgProgress}%</div>
            <div className="text-sm text-purple-700">Avg Progress</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="select-field"
              >
                <option value="newest">Newest First</option>
                <option value="progress">Progress</option>
                <option value="title">Title A-Z</option>
              </select>
            </div>
          </div>

          {stats.total > 0 && (
            <div className="text-sm text-gray-600">
              {stats.downloading > 0 && (
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  {stats.downloading} downloading
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Downloads List */}
      <div className="space-y-4">
        <AnimatePresence>
          {sortedDownloads.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 bg-white rounded-xl border"
            >
              <Download className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                No active downloads
              </h3>
              <p className="text-gray-600">
                Start downloading videos to see them here
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {sortedDownloads.map((download) => (
                <motion.div
                  key={download.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-lg border shadow-sm"
                >
                  <DownloadCard
                    download={download}
                    onCancel={onCancelDownload}
                    onDownload={onDownloadFile}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Overall Progress Bar */}
      {stats.total > 0 && stats.downloading > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-lg border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm text-gray-600">{stats.avgProgress}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill transition-all duration-300" 
              style={{ width: `${stats.avgProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};