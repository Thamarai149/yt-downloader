export interface VideoInfo {
  title: string;
  duration: number;
  uploader: string;
  view_count?: number;
  thumbnail: string;
  upload_date?: string;
  description?: string;
  qualities?: number[];
  formats?: any[];
}

export interface SearchResult extends VideoInfo {
  id: string;
  url: string;
}

export interface DownloadItem {
  id: string;
  title: string;
  url: string;
  type: DownloadType;
  quality: string;
  status: 'pending' | 'starting' | 'downloading' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startTime: Date;
  endTime?: Date;
  thumbnail?: string;
  filesize?: number;
  fileSize?: number;
  filePath?: string;
  fileName?: string;
  error?: string;
}

export type TabType =
  | 'single'
  | 'batch'
  | 'playlist'
  | 'search'
  | 'scheduler'
  | 'queue'
  | 'history'
  | 'balances'
  | 'analytics'
  | 'settings';

export type DownloadType = 'video' | 'audio';

export type QualityType = 'best' | '4k' | '2k' | '1080' | '720' | '480' | '360' | '240' | string;

export interface SocketEvents {
  downloadStarted: (download: DownloadItem) => void;
  downloadProgress: (download: DownloadItem) => void;
  downloadCompleted: (download: DownloadItem) => void;
  downloadFailed: (download: DownloadItem) => void;
  downloadCancelled: (download: DownloadItem) => void;
  activeDownloads: (downloads: DownloadItem[]) => void;
}

export interface PlaylistInfo {
  title: string;
  uploader: string;
  video_count: number;
  videos: PlaylistVideo[];
}

export interface PlaylistVideo {
  id: string;
  title: string;
  url: string;
  duration: number;
  thumbnail: string;
}

export interface ScheduledDownload {
  id: string;
  url: string;
  title: string;
  scheduledTime: Date;
  type: DownloadType;
  quality: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  recurring?: 'daily' | 'weekly' | 'monthly';
}

export interface DownloadStats {
  totalDownloads: number;
  totalSize: number;
  totalDuration: number;
  averageSpeed: number;
  successRate: number;
  topQuality: string;
  topType: DownloadType;
  dailyStats: { date: string; count: number; size: number }[];
  qualityBreakdown: { quality: string; count: number }[];
  typeBreakdown: { type: string; count: number }[];
  monthlyTrend: { month: string; downloads: number }[];
}