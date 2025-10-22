export interface VideoInfo {
  id: string;
  title: string;
  uploader: string;
  duration: number;
  thumbnail: string;
  description?: string;
  view_count?: number;
  upload_date?: string;
  qualities?: string[];
  formats?: VideoFormat[];
}

export interface VideoFormat {
  format_id: string;
  ext: string;
  quality: string;
  filesize?: number;
  fps?: number;
  vcodec?: string;
  acodec?: string;
}

export interface PlaylistInfo {
  id: string;
  title: string;
  uploader: string;
  video_count: number;
  description?: string;
  videos?: VideoInfo[];
}

export interface DownloadItem {
  id: string;
  url: string;
  title: string;
  type: 'video' | 'audio';
  quality: string;
  status: 'pending' | 'starting' | 'downloading' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  speed?: string;
  eta?: string;
  filesize?: number;
  fileSize?: number;
  filename?: string;
  fileName?: string;
  thumbnail?: string;
  startTime: Date;
  endTime?: Date;
  created_at?: string;
  completed_at?: string;
  filePath?: string;
  error?: string;
}

export interface SearchResult {
  id: string;
  title: string;
  uploader: string;
  duration: number;
  thumbnail: string;
  url: string;
  view_count?: number;
  upload_date?: string;
}

export type TabType = 'single' | 'batch' | 'playlist' | 'search' | 'queue' | 'history' | 'scheduler' | 'analytics' | 'settings' | 'balances';

export type QualityType = 'best' | '4k' | '2k' | '1080' | '720' | '480' | '360' | '240';

export type DownloadType = 'video' | 'audio';

export interface AppState {
  url: string;
  urls: string[];
  type: DownloadType;
  quality: QualityType;
  status: string;
  videoInfo: VideoInfo | null;
  loading: boolean;
  darkMode: boolean;
  activeTab: TabType;
  downloadHistory: DownloadItem[];
  activeDownloads: DownloadItem[];
  playlistInfo: PlaylistInfo | null;
  searchQuery: string;
  searchResults: SearchResult[];
  selectedVideos: SearchResult[];
}

export interface SocketEvents {
  downloadStarted: (download: DownloadItem) => void;
  downloadProgress: (download: DownloadItem) => void;
  downloadCompleted: (download: DownloadItem) => void;
  downloadFailed: (download: DownloadItem) => void;
  downloadCancelled: (download: DownloadItem) => void;
  activeDownloads: (downloads: DownloadItem[]) => void;
}

export interface Balance {
  id: string;
  name: string;
  amount: number;
  currency: string;
  type: 'credit' | 'subscription' | 'premium';
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BalanceTransaction {
  id: string;
  balanceId: string;
  type: 'debit' | 'credit' | 'refund';
  amount: number;
  description: string;
  downloadId?: string;
  createdAt: Date;
}