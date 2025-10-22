import React from 'react';
import { motion } from 'framer-motion';
import { Clock, User, Eye, CheckSquare, Square } from 'lucide-react';
import { VideoInfo, SearchResult } from '../types';

interface VideoCardProps {
  video: VideoInfo | SearchResult;
  onSelect?: (video: VideoInfo | SearchResult) => void;
  selected?: boolean;
  showCheckbox?: boolean;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  onSelect,
  selected = false,
  showCheckbox = false
}) => {
  const formatDuration = (seconds: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (views: number) => {
    if (!views) return 'N/A';
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={`video-card cursor-pointer transition-all ${
        selected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
      }`}
      onClick={() => onSelect?.(video)}
    >
      <div className="flex gap-4">
        {showCheckbox && (
          <div className="flex-shrink-0 pt-2">
            {selected ? (
              <CheckSquare className="w-5 h-5 text-blue-600" />
            ) : (
              <Square className="w-5 h-5 text-gray-400" />
            )}
          </div>
        )}
        
        <div className="flex-shrink-0">
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-32 h-20 object-cover rounded-lg"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-800 line-clamp-2 mb-2">
            {video.title}
          </h4>
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {video.uploader}
            </span>
            
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(video.duration)}
            </span>
            
            {video.view_count && (
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {formatViews(video.view_count)}
              </span>
            )}
          </div>
          
          {video.upload_date && (
            <div className="text-xs text-gray-500 mt-1">
              {new Date(video.upload_date).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};