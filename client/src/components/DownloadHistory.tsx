import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, 
  Download, 
  Trash2, 
  Search, 
  Filter, 
  Calendar,
  FileText,
  Play,
  Music,
  BarChart3,
  RefreshCw,
  X
} from 'lucide-react';
import { DownloadItem } from '../types/index';
import { Button } from './Button';
import { Input } from './Input';
import { DownloadCard } from './DownloadCard';

interface DownloadHistoryProps {
  downloadHistory: DownloadItem[];
  onClearHistory: () => void;
  onRefreshHistory: () => void;
  onDownloadFile: (id: string) => void;
  onDeleteHistoryItem: (id: string) => void;
}

type FilterType = 'all' | 'video' | 'audio' | 'completed' | 'failed';
type SortType = 'newest' | 'oldest' | 'title' | 'size';

export const DownloadHistory: React.FC<DownloadHistoryProps> = ({
  downloadHistory,
  onClearHistory,
  onRefreshHistory,
  onDownloadFile,
  onDeleteHistoryItem
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('newest');
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort downloads
  const filteredAndSortedDownloads = useMemo(() => {
    let filtered = downloadHistory.filter(download => {
      // Search filter
      const matchesSearch = download.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           download.url.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Type filter
      const matchesFilter = filterType === 'all' || 
                           filterType === download.type ||
                           filterType === download.status;
      
      return matchesSearch && matchesFilter;
    });

    // Sort downloads
    filtered.sort((a, b) => {
      switch (sortType) {
        case 'newest':
          return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
        case 'oldest':
          return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'size':
          return (b.fileSize || b.filesize || 0) - (a.fileSize || a.filesize || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [downloadHistory, searchQuery, filterType, sortType]);

  // Statistics
  const stats = useMemo(() => {
    const total = downloadHistory.length;
    const completed = downloadHistory.filter(d => d.status === 'completed').length;
    const failed = downloadHistory.filter(d => d.status === 'failed').length;
    const videos = downloadHistory.filter(d => d.type === 'video').length;
    const audio = downloadHistory.filter(d => d.type === 'audio').length;
    const totalSize = downloadHistory.reduce((sum, d) => sum + (d.fileSize || d.filesize || 0), 0);

    return { total, completed, failed, videos, audio, totalSize };
  }, [downloadHistory]);

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'N/A';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFilterIcon = (filter: FilterType) => {
    switch (filter) {
      case 'video': return <Play className="w-4 h-4" />;
      case 'audio': return <Music className="w-4 h-4" />;
      case 'completed': return <Download className="w-4 h-4" />;
      case 'failed': return <X className="w-4 h-4" />;
      default: return <Filter className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-white rounded-xl p-6 shadow-lg border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <History className="w-6 h-6" />
            Download History
          </h2>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={onRefreshHistory}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh
            </Button>
            {downloadHistory.length > 0 && (
              <Button
                size="sm"
                variant="danger"
                onClick={onClearHistory}
                icon={<Trash2 className="w-4 h-4" />}
              >
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-blue-700">Total</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-green-700">Completed</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-red-700">Failed</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.videos}</div>
            <div className="text-sm text-purple-700">Videos</div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.audio}</div>
            <div className="text-sm text-orange-700">Audio</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-gray-600">{formatFileSize(stats.totalSize)}</div>
            <div className="text-sm text-gray-700">Total Size</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search downloads..."
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <Button
              variant="secondary"
              onClick={() => setShowFilters(!showFilters)}
              icon={<Filter className="w-4 h-4" />}
            >
              Filters
            </Button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as FilterType)}
                    className="select-field"
                  >
                    <option value="all">All Types</option>
                    <option value="video">Videos Only</option>
                    <option value="audio">Audio Only</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
                  <select
                    value={sortType}
                    onChange={(e) => setSortType(e.target.value as SortType)}
                    className="select-field"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="title">Title A-Z</option>
                    <option value="size">File Size</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setSearchQuery('');
                      setFilterType('all');
                      setSortType('newest');
                    }}
                    icon={<X className="w-4 h-4" />}
                  >
                    Clear Filters
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Downloads List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            {filteredAndSortedDownloads.length} Downloads
            {searchQuery && ` matching "${searchQuery}"`}
          </h3>
          {filterType !== 'all' && (
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              {getFilterIcon(filterType)}
              {filterType}
            </div>
          )}
        </div>

        <AnimatePresence>
          {filteredAndSortedDownloads.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 bg-white rounded-xl border"
            >
              <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {searchQuery || filterType !== 'all' ? 'No matching downloads' : 'No download history'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || filterType !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Downloads will appear here once you start downloading videos'
                }
              </p>
              {(searchQuery || filterType !== 'all') && (
                <Button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType('all');
                  }}
                  icon={<X className="w-4 h-4" />}
                >
                  Clear Filters
                </Button>
              )}
            </motion.div>
          ) : (
            <div className="space-y-3">
              {filteredAndSortedDownloads.map((download) => (
                <motion.div
                  key={download.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-lg border shadow-sm"
                >
                  <DownloadCard
                    download={download}
                    onDownload={onDownloadFile}
                    onCancel={onDeleteHistoryItem}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};