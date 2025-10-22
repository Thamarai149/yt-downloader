import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Download, HardDrive, Calendar, Zap, Award } from 'lucide-react';

interface DownloadStats {
  totalDownloads: number;
  totalSize: number;
  totalDuration: number;
  averageSpeed: number;
  successRate: number;
  topQuality: string;
  topType: 'video' | 'audio';
  dailyStats: { date: string; count: number; size: number }[];
  qualityBreakdown: { quality: string; count: number }[];
  typeBreakdown: { type: string; count: number }[];
  monthlyTrend: { month: string; downloads: number }[];
}

interface AnalyticsProps {
  downloadHistory: any[];
}

export const Analytics: React.FC<AnalyticsProps> = ({ downloadHistory }) => {
  const [stats, setStats] = useState<DownloadStats | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    calculateStats();
  }, [downloadHistory, timeRange]);

  const calculateStats = () => {
    if (!downloadHistory.length) {
      setStats(null);
      return;
    }

    // Filter by time range
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (timeRange) {
      case '7d':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        cutoffDate.setDate(now.getDate() - 90);
        break;
      case 'all':
        cutoffDate.setFullYear(2000);
        break;
    }

    const filteredHistory = downloadHistory.filter(item => 
      new Date(item.startTime) >= cutoffDate
    );

    // Calculate basic stats
    const totalDownloads = filteredHistory.length;
    const completedDownloads = filteredHistory.filter(item => item.status === 'completed');
    const totalSize = completedDownloads.reduce((sum, item) => sum + (item.fileSize || 0), 0);
    const totalDuration = completedDownloads.reduce((sum, item) => {
      if (item.endTime && item.startTime) {
        return sum + (new Date(item.endTime).getTime() - new Date(item.startTime).getTime());
      }
      return sum;
    }, 0);

    const averageSpeed = totalDuration > 0 ? (totalSize / (totalDuration / 1000)) : 0; // bytes per second
    const successRate = totalDownloads > 0 ? (completedDownloads.length / totalDownloads) * 100 : 0;

    // Quality and type breakdown
    const qualityCount: { [key: string]: number } = {};
    const typeCount: { [key: string]: number } = {};

    filteredHistory.forEach(item => {
      qualityCount[item.quality] = (qualityCount[item.quality] || 0) + 1;
      typeCount[item.type] = (typeCount[item.type] || 0) + 1;
    });

    const topQuality = Object.entries(qualityCount).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';
    const topType = Object.entries(typeCount).sort(([,a], [,b]) => b - a)[0]?.[0] as 'video' | 'audio' || 'video';

    // Daily stats for the last 7 days
    const dailyStats: { date: string; count: number; size: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayDownloads = filteredHistory.filter(item => 
        new Date(item.startTime).toISOString().split('T')[0] === dateStr
      );
      
      dailyStats.push({
        date: dateStr,
        count: dayDownloads.length,
        size: dayDownloads.reduce((sum, item) => sum + (item.fileSize || 0), 0)
      });
    }

    // Monthly trend for the last 6 months
    const monthlyTrend: { month: string; downloads: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toISOString().slice(0, 7); // YYYY-MM
      
      const monthDownloads = downloadHistory.filter(item => 
        new Date(item.startTime).toISOString().slice(0, 7) === monthStr
      );
      
      monthlyTrend.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        downloads: monthDownloads.length
      });
    }

    setStats({
      totalDownloads,
      totalSize,
      totalDuration,
      averageSpeed,
      successRate,
      topQuality,
      topType,
      dailyStats,
      qualityBreakdown: Object.entries(qualityCount).map(([quality, count]) => ({ quality, count })),
      typeBreakdown: Object.entries(typeCount).map(([type, count]) => ({ type, count })),
      monthlyTrend
    });
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number) => {
    return formatBytes(bytesPerSecond) + '/s';
  };

  const formatDuration = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  if (!stats) {
    return (
      <div className="text-center py-12 text-gray-500">
        <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p className="text-lg">No download data available</p>
        <p className="text-sm">Start downloading to see analytics</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          Download Analytics
        </h2>
        <div className="flex bg-gray-100 rounded-lg p-1">
          {[
            { value: '7d', label: '7 Days' },
            { value: '30d', label: '30 Days' },
            { value: '90d', label: '90 Days' },
            { value: 'all', label: 'All Time' }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value as any)}
              className={`px-3 py-1 rounded-md text-sm transition-all ${
                timeRange === option.value
                  ? 'bg-white shadow-sm text-blue-600 font-medium'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Downloads</p>
              <p className="text-3xl font-bold">{stats.totalDownloads}</p>
            </div>
            <Download className="w-8 h-8 text-blue-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Size</p>
              <p className="text-3xl font-bold">{formatBytes(stats.totalSize)}</p>
            </div>
            <HardDrive className="w-8 h-8 text-green-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Avg Speed</p>
              <p className="text-3xl font-bold">{formatSpeed(stats.averageSpeed)}</p>
            </div>
            <Zap className="w-8 h-8 text-purple-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Success Rate</p>
              <p className="text-3xl font-bold">{stats.successRate.toFixed(1)}%</p>
            </div>
            <Award className="w-8 h-8 text-orange-200" />
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl p-6 shadow-lg border"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Daily Activity (Last 7 Days)
          </h3>
          <div className="space-y-3">
            {stats.dailyStats.map((day, index) => {
              const maxCount = Math.max(...stats.dailyStats.map(d => d.count));
              const percentage = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
              
              return (
                <div key={day.date} className="flex items-center gap-3">
                  <div className="w-16 text-sm text-gray-600">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                      {day.count} downloads
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Quality Breakdown */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl p-6 shadow-lg border"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Quality Preferences
          </h3>
          <div className="space-y-3">
            {stats.qualityBreakdown.map((item, index) => {
              const maxCount = Math.max(...stats.qualityBreakdown.map(q => q.count));
              const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
              
              return (
                <div key={item.quality} className="flex items-center gap-3">
                  <div className="w-16 text-sm text-gray-600 font-medium">
                    {item.quality}
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                      {item.count} downloads
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Monthly Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white rounded-xl p-6 shadow-lg border"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Monthly Trend (Last 6 Months)
        </h3>
        <div className="flex items-end justify-between gap-2 h-40">
          {stats.monthlyTrend.map((month, index) => {
            const maxDownloads = Math.max(...stats.monthlyTrend.map(m => m.downloads));
            const height = maxDownloads > 0 ? (month.downloads / maxDownloads) * 100 : 0;
            
            return (
              <div key={month.month} className="flex-1 flex flex-col items-center gap-2">
                <div className="flex-1 flex items-end w-full">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                    className="w-full bg-gradient-to-t from-purple-500 to-purple-600 rounded-t-lg min-h-[4px] flex items-end justify-center pb-2"
                  >
                    <span className="text-white text-xs font-medium">
                      {month.downloads}
                    </span>
                  </motion.div>
                </div>
                <div className="text-xs text-gray-600 text-center">
                  {month.month}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white rounded-xl p-6 shadow-lg border"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{stats.topType}</p>
            <p className="text-sm text-blue-700">Most Downloaded Type</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{stats.topQuality}</p>
            <p className="text-sm text-green-700">Preferred Quality</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">
              {formatDuration(stats.totalDuration)}
            </p>
            <p className="text-sm text-purple-700">Total Download Time</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};