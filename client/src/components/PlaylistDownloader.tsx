import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { List, Download, Play, Clock, User, CheckSquare, Square } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';

interface PlaylistVideo {
  id: string;
  title: string;
  url: string;
  duration: number;
  thumbnail: string;
}

interface PlaylistInfo {
  title: string;
  uploader: string;
  video_count: number;
  videos: PlaylistVideo[];
}

interface PlaylistDownloaderProps {
  backend: string;
  onDownload: (urls: string[], type: string, quality: string) => void;
  loading: boolean;
}

export const PlaylistDownloader: React.FC<PlaylistDownloaderProps> = ({
  backend,
  onDownload,
  loading
}) => {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [playlistInfo, setPlaylistInfo] = useState<PlaylistInfo | null>(null);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [fetchingPlaylist, setFetchingPlaylist] = useState(false);
  const [downloadType, setDownloadType] = useState<'video' | 'audio'>('video');
  const [quality, setQuality] = useState('best');

  const isValidPlaylistUrl = (url: string) => {
    return url.includes('playlist?list=') || url.includes('&list=');
  };

  const fetchPlaylistInfo = async () => {
    if (!playlistUrl || !isValidPlaylistUrl(playlistUrl)) return;

    setFetchingPlaylist(true);
    try {
      const response = await fetch(`${backend}/api/playlist?url=${encodeURIComponent(playlistUrl)}`);
      const data = await response.json();
      
      if (response.ok) {
        setPlaylistInfo(data);
        setSelectedVideos(new Set(data.videos.map((v: PlaylistVideo) => v.id)));
      } else {
        console.error('Failed to fetch playlist:', data.error);
      }
    } catch (error) {
      console.error('Playlist fetch error:', error);
    }
    setFetchingPlaylist(false);
  };

  const toggleVideoSelection = (videoId: string) => {
    const newSelected = new Set(selectedVideos);
    if (newSelected.has(videoId)) {
      newSelected.delete(videoId);
    } else {
      newSelected.add(videoId);
    }
    setSelectedVideos(newSelected);
  };

  const selectAll = () => {
    if (playlistInfo) {
      setSelectedVideos(new Set(playlistInfo.videos.map(v => v.id)));
    }
  };

  const selectNone = () => {
    setSelectedVideos(new Set());
  };

  const handleDownloadSelected = () => {
    if (!playlistInfo || selectedVideos.size === 0) return;
    
    const selectedUrls = playlistInfo.videos
      .filter(video => selectedVideos.has(video.id))
      .map(video => video.url);
    
    onDownload(selectedUrls, downloadType, quality);
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Playlist URL Input */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="url"
            value={playlistUrl}
            onChange={(e) => setPlaylistUrl(e.target.value)}
            placeholder="https://www.youtube.com/playlist?list=..."
            className="flex-1"
            icon={<List className="w-4 h-4" />}
          />
          <Button
            onClick={fetchPlaylistInfo}
            variant="primary"
            loading={fetchingPlaylist}
            disabled={!playlistUrl || !isValidPlaylistUrl(playlistUrl)}
            icon={<List className="w-4 h-4" />}
          >
            Load Playlist
          </Button>
        </div>

        {/* Download Options */}
        {playlistInfo && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">📁 Type</label>
              <div className="flex gap-2">
                <label className="radio-item flex-1">
                  <input
                    type="radio"
                    name="playlistType"
                    value="video"
                    checked={downloadType === 'video'}
                    onChange={() => setDownloadType('video')}
                    className="radio-input"
                  />
                  <Play className="w-4 h-4" />
                  <span>Video</span>
                </label>
                <label className="radio-item flex-1">
                  <input
                    type="radio"
                    name="playlistType"
                    value="audio"
                    checked={downloadType === 'audio'}
                    onChange={() => setDownloadType('audio')}
                    className="radio-input"
                  />
                  <span>🎵</span>
                  <span>Audio</span>
                </label>
              </div>
            </div>

            {downloadType === 'video' && (
              <div>
                <label className="block text-sm font-medium mb-2">⚙️ Quality</label>
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
            )}
          </div>
        )}
      </div>

      {/* Playlist Info */}
      {playlistInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-lg border"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{playlistInfo.title}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {playlistInfo.uploader}
                </span>
                <span className="flex items-center gap-1">
                  <List className="w-4 h-4" />
                  {playlistInfo.video_count} videos
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={selectAll}>
                Select All
              </Button>
              <Button size="sm" variant="secondary" onClick={selectNone}>
                Select None
              </Button>
            </div>
          </div>

          {/* Selection Summary */}
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-blue-700 font-medium">
                {selectedVideos.size} of {playlistInfo.videos.length} videos selected
              </span>
              <Button
                onClick={handleDownloadSelected}
                variant="success"
                loading={loading}
                disabled={selectedVideos.size === 0}
                icon={<Download className="w-4 h-4" />}
              >
                Download Selected ({selectedVideos.size})
              </Button>
            </div>
          </div>

          {/* Video List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {playlistInfo.videos.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
                  selectedVideos.has(video.id) 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
                onClick={() => toggleVideoSelection(video.id)}
              >
                <div className="flex-shrink-0">
                  {selectedVideos.has(video.id) ? (
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-16 h-12 object-cover rounded flex-shrink-0"
                />
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-800 truncate">{video.title}</h4>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(video.duration)}
                    </span>
                    <span>#{index + 1}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};