import youtubedl from 'youtube-dl-exec';
import sanitize from 'sanitize-filename';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';
import { AppError } from '../middleware/errorHandler.js';

export class DownloadService {
  constructor(io) {
    this.io = io;
    this.activeDownloads = new Map();
    this.downloadHistory = [];
    this.downloadPath = config.downloadPath;
    
    // Ensure download directory exists
    if (!fs.existsSync(this.downloadPath)) {
      fs.mkdirSync(this.downloadPath, { recursive: true });
    }
  }

  async startDownload(url, type, quality = 'best') {
    const downloadId = uuidv4();
    
    try {
      // Get video info first
      const info = await youtubedl(url, {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true
      });

      const filename = sanitize(info.title);
      const ext = type === 'audio' ? 'mp3' : 'mp4';
      const outputPath = path.join(this.downloadPath, `${filename}.${ext}`);

      const downloadInfo = {
        id: downloadId,
        url,
        title: info.title,
        type,
        quality,
        status: 'downloading',
        progress: 0,
        startTime: new Date(),
        outputPath
      };

      this.activeDownloads.set(downloadId, downloadInfo);
      this.emitProgress(downloadId, downloadInfo);

      // Start download
      await this.executeDownload(url, type, quality, outputPath, downloadId);

      // Update status
      downloadInfo.status = 'completed';
      downloadInfo.progress = 100;
      downloadInfo.endTime = new Date();
      
      this.downloadHistory.push(downloadInfo);
      this.activeDownloads.delete(downloadId);
      this.emitProgress(downloadId, downloadInfo);

      return downloadInfo;
    } catch (error) {
      const downloadInfo = this.activeDownloads.get(downloadId);
      if (downloadInfo) {
        downloadInfo.status = 'failed';
        downloadInfo.error = error.message;
        this.downloadHistory.push(downloadInfo);
        this.activeDownloads.delete(downloadId);
        this.emitProgress(downloadId, downloadInfo);
      }
      throw new AppError(`Download failed: ${error.message}`, 500);
    }
  }

  async executeDownload(url, type, quality, outputPath, downloadId) {
    const options = {
      output: outputPath,
      noCheckCertificates: true,
      noWarnings: true,
      addHeader: ['referer:youtube.com', 'user-agent:googlebot']
    };

    if (type === 'audio') {
      options.extractAudio = true;
      options.audioFormat = 'mp3';
      options.audioQuality = 0;
    } else {
      if (quality === '4k') {
        options.format = 'bestvideo[height<=2160]+bestaudio/best';
      } else if (quality === '1080') {
        options.format = 'bestvideo[height<=1080]+bestaudio/best';
      } else if (quality === '720') {
        options.format = 'bestvideo[height<=720]+bestaudio/best';
      } else {
        options.format = 'best';
      }
    }

    // Execute download with progress tracking
    const process = youtubedl.exec(url, options);
    
    process.stdout.on('data', (data) => {
      const output = data.toString();
      const progressMatch = output.match(/(\d+\.?\d*)%/);
      
      if (progressMatch) {
        const progress = parseFloat(progressMatch[1]);
        const downloadInfo = this.activeDownloads.get(downloadId);
        if (downloadInfo) {
          downloadInfo.progress = progress;
          this.emitProgress(downloadId, downloadInfo);
        }
      }
    });

    await process;
  }

  emitProgress(downloadId, downloadInfo) {
    this.io.emit('download:progress', {
      downloadId,
      ...downloadInfo
    });
  }

  getActiveDownloads() {
    return Array.from(this.activeDownloads.values());
  }

  getDownloadHistory() {
    return this.downloadHistory;
  }

  cancelDownload(downloadId) {
    const download = this.activeDownloads.get(downloadId);
    if (download) {
      download.status = 'cancelled';
      this.activeDownloads.delete(downloadId);
      this.downloadHistory.push(download);
      this.emitProgress(downloadId, download);
      return true;
    }
    return false;
  }
}
