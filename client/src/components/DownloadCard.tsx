import React from 'react';
import { motion } from 'framer-motion';
import { Download, X, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { DownloadItem } from '../types/index';
import { Button } from './Button';

interface DownloadCardProps {
  download: DownloadItem;
  onCancel?: (id: string) => void;
  onDownload?: (id: string) => void;
}

export const DownloadCard: React.FC<DownloadCardProps> = ({
  download,
  onCancel,
  onDownload
}) => {
  const getStatusIcon = () => {
    switch (download.status) {
      case 'pending':
      case 'starting':
      case 'downloading':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'cancelled':
        return <X className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (download.status) {
      case 'pending':
      case 'starting':
      case 'downloading':
        return 'text-blue-600 bg-blue-50';
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'cancelled':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'N/A';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (start: Date, end?: Date) => {
    const endTime = end || new Date();
    const duration = endTime.getTime() - start.getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);

    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="download-item"
    >
      <div className="flex items-center gap-4">
        {download.thumbnail && (
          <img
            src={download.thumbnail}
            alt={download.title}
            className="w-16 h-12 object-cover rounded flex-shrink-0"
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor()}`}>
              {getStatusIcon()}
              {download.status}
            </span>
            <span className="text-xs text-gray-500">
              {download.type === 'video' ? '📺' : '�'} d{download.quality}
            </span>
          </div>

          <h4 className="font-medium text-gray-800 truncate mb-1">
            {download.title}
          </h4>

          {download.status === 'downloading' && (
            <div className="mb-2">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>{download.progress}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${download.progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Started: {new Date(download.startTime).toLocaleTimeString()}</span>
            {download.endTime && (
              <span>Duration: {formatDuration(new Date(download.startTime), new Date(download.endTime))}</span>
            )}
            {(download.fileSize || download.filesize) && (
              <span>Size: {formatFileSize(download.fileSize || download.filesize || 0)}</span>
            )}
          </div>

          {download.error && (
            <div className="text-xs text-red-600 mt-1">
              Error: {download.error}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {download.status === 'completed' && onDownload && (
            <Button
              size="sm"
              variant="success"
              onClick={() => onDownload(download.id)}
              icon={<Download className="w-3 h-3" />}
            >
              Download
            </Button>
          )}

          {(download.status === 'pending' || download.status === 'starting' || download.status === 'downloading') && onCancel && (
            <Button
              size="sm"
              variant="danger"
              onClick={() => onCancel(download.id)}
              icon={<X className="w-3 h-3" />}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};