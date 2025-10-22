import React from 'react';
import { motion } from 'framer-motion';
import { Play, Clock, Eye, User } from 'lucide-react';

interface VideoPreviewProps {
  thumbnail: string;
  title: string;
  uploader?: string;
  duration?: number;
  viewCount?: number;
  uploadDate?: string;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  thumbnail,
  title,
  uploader,
  duration,
  viewCount,
  uploadDate
}) => {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="video-card-modern"
    >
      <div className="relative group">
        <img 
          src={thumbnail} 
          alt={title} 
          className="w-full aspect-video object-cover"
        />
        {duration && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs font-semibold">
            {formatDuration(duration)}
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play className="w-12 h-12 text-white" />
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-sm line-clamp-2 mb-2">{title}</h3>
        
        <div className="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-400">
          {uploader && (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{uploader}</span>
            </div>
          )}
          
          <div className="flex items-center gap-3">
            {viewCount && (
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{formatViews(viewCount)} views</span>
              </div>
            )}
            {uploadDate && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{uploadDate}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
