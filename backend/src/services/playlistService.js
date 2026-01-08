import youtubedl from 'youtube-dl-exec';
import crypto from 'crypto';
import { AppError } from '../middleware/errorHandler.js';

const uuidv4 = () => crypto.randomUUID();

export class PlaylistService {
  constructor(downloadService, io) {
    this.downloadService = downloadService;
    this.io = io;
    this.activePlaylists = new Map();
    this.playlistHistory = [];
  }

  async getPlaylistInfo(playlistUrl) {
    try {
      console.log(`Getting playlist info for: ${playlistUrl}`);
      
      const info = await youtubedl(playlistUrl, {
        dumpSingleJson: true,
        flatPlaylist: true,
        noCheckCertificates: true,
        noWarnings: true,
        addHeader: ['referer:youtube.com', 'user-agent:googlebot']
      });

      if (!info.entries || info.entries.length === 0) {
        throw new AppError('No videos found in playlist', 400);
      }

      return {
        id: info.id,
        title: info.title || 'Unknown Playlist',
        uploader: info.uploader || 'Unknown',
        videoCount: info.entries.length,
        videos: info.entries.map(entry => ({
          id: entry.id,
          title: entry.title || 'Unknown Title',
          url: entry.url || `https://www.youtube.com/watch?v=${entry.id}`,
          duration: entry.duration || 0,
          uploader: entry.uploader || 'Unknown'
        }))
      };
    } catch (error) {
      console.error('Error getting playlist info:', error);
      throw new AppError(`Failed to get playlist info: ${error.message}`, 500);
    }
  }

  async startPlaylistDownload(playlistUrl, type = 'video', quality = 'best', options = {}) {
    const playlistId = uuidv4();
    
    try {
      // Get playlist information
      const playlistInfo = await this.getPlaylistInfo(playlistUrl);
      
      const playlist = {
        id: playlistId,
        url: playlistUrl,
        title: playlistInfo.title,
        uploader: playlistInfo.uploader,
        type,
        quality,
        status: 'starting',
        progress: 0,
        total: playlistInfo.videoCount,
        completed: 0,
        failed: 0,
        skipped: 0,
        downloads: [],
        startTime: new Date(),
        options: {
          maxVideos: options.maxVideos || null,
          skipExisting: options.skipExisting || false,
          continueOnError: options.continueOnError !== false
        }
      };

      this.activePlaylists.set(playlistId, playlist);
      this.emitPlaylistProgress(playlistId, playlist);

      // Start processing playlist in background
      this.processPlaylist(playlistId, playlistInfo.videos, type, quality, options);

      return {
        playlistId,
        title: playlistInfo.title,
        total: playlistInfo.videoCount,
        message: 'Playlist download started'
      };
    } catch (error) {
      console.error('Error starting playlist download:', error);
      throw new AppError(`Failed to start playlist download: ${error.message}`, 500);
    }
  }

  async processPlaylist(playlistId, videos, type, quality, options) {
    const playlist = this.activePlaylists.get(playlistId);
    if (!playlist) return;

    playlist.status = 'downloading';
    this.emitPlaylistProgress(playlistId, playlist);

    // Limit videos if specified
    const videosToDownload = options.maxVideos 
      ? videos.slice(0, options.maxVideos)
      : videos;

    let processedCount = 0;

    for (const video of videosToDownload) {
      if (playlist.status === 'cancelled') break;

      try {
        // Update current video being processed
        playlist.currentVideo = {
          title: video.title,
          index: processedCount + 1
        };
        this.emitPlaylistProgress(playlistId, playlist);

        // Check if file already exists (if skipExisting is enabled)
        if (options.skipExisting && await this.checkFileExists(video.title, type)) {
          playlist.downloads.push({
            videoId: video.id,
            title: video.title,
            url: video.url,
            status: 'skipped',
            reason: 'File already exists'
          });
          playlist.skipped++;
        } else {
          // Start individual download
          const download = await this.downloadService.startDownload(video.url, type, quality);
          
          // Wait for download to complete
          await this.waitForDownloadCompletion(download.id);
          
          const downloadResult = this.downloadService.getDownloadById(download.id) || 
                               this.downloadService.getDownloadFromHistory(download.id);

          if (downloadResult && downloadResult.status === 'completed') {
            playlist.downloads.push({
              videoId: video.id,
              title: video.title,
              url: video.url,
              status: 'completed',
              downloadId: download.id,
              filePath: downloadResult.outputPath
            });
            playlist.completed++;
          } else {
            throw new Error(downloadResult?.error || 'Download failed');
          }
        }
      } catch (error) {
        console.error(`Error downloading video ${video.title}:`, error);
        
        playlist.downloads.push({
          videoId: video.id,
          title: video.title,
          url: video.url,
          status: 'failed',
          error: error.message
        });
        playlist.failed++;

        // Stop processing if continueOnError is false
        if (!options.continueOnError) {
          playlist.status = 'failed';
          playlist.error = `Failed on video: ${video.title}`;
          break;
        }
      }

      processedCount++;
      playlist.progress = Math.round((processedCount / videosToDownload.length) * 100);
      this.emitPlaylistProgress(playlistId, playlist);

      // Small delay between downloads to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Update final status
    if (playlist.status !== 'cancelled' && playlist.status !== 'failed') {
      playlist.status = playlist.failed === 0 ? 'completed' : 'completed_with_errors';
    }
    
    playlist.endTime = new Date();
    playlist.currentVideo = null;
    
    // Move to history
    this.playlistHistory.push({ ...playlist });
    this.activePlaylists.delete(playlistId);
    
    this.emitPlaylistProgress(playlistId, playlist);
  }

  async waitForDownloadCompletion(downloadId, timeout = 300000) { // 5 minutes timeout
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkStatus = () => {
        const download = this.downloadService.getDownloadById(downloadId);
        
        if (!download) {
          // Check history
          const historyDownload = this.downloadService.getDownloadFromHistory(downloadId);
          if (historyDownload) {
            resolve(historyDownload);
            return;
          }
        }

        if (download) {
          if (download.status === 'completed' || download.status === 'failed') {
            resolve(download);
            return;
          }
        }

        // Check timeout
        if (Date.now() - startTime > timeout) {
          reject(new Error('Download timeout'));
          return;
        }

        // Check again in 2 seconds
        setTimeout(checkStatus, 2000);
      };

      checkStatus();
    });
  }

  async checkFileExists(title, type) {
    // This would check if a file with the same title already exists
    // Implementation depends on your file system structure
    return false; // Simplified for now
  }

  cancelPlaylistDownload(playlistId) {
    const playlist = this.activePlaylists.get(playlistId);
    if (!playlist) {
      return false;
    }

    playlist.status = 'cancelled';
    playlist.endTime = new Date();
    
    // Cancel any active individual downloads
    playlist.downloads.forEach(download => {
      if (download.downloadId && download.status === 'downloading') {
        this.downloadService.cancelDownload(download.downloadId);
      }
    });

    this.emitPlaylistProgress(playlistId, playlist);
    return true;
  }

  getActivePlaylist(playlistId) {
    return this.activePlaylists.get(playlistId);
  }

  getActivePlaylists() {
    return Array.from(this.activePlaylists.values());
  }

  getPlaylistHistory() {
    return this.playlistHistory;
  }

  emitPlaylistProgress(playlistId, playlist) {
    this.io.emit('playlist:progress', {
      playlistId,
      ...playlist
    });
  }

  // Utility method to validate playlist URLs
  static isPlaylistUrl(url) {
    const playlistPatterns = [
      /(?:youtube\.com\/playlist\?list=|youtube\.com\/watch\?.*list=)/i,
      /youtu\.be\/.*\?.*list=/i
    ];
    
    return playlistPatterns.some(pattern => pattern.test(url));
  }

  // Extract playlist ID from URL
  static extractPlaylistId(url) {
    const match = url.match(/[?&]list=([^&]+)/);
    return match ? match[1] : null;
  }
}