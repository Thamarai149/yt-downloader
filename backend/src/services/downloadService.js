import youtubedl from 'youtube-dl-exec';
import sanitize from 'sanitize-filename';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import { config } from '../config/index.js';
import { AppError } from '../middleware/errorHandler.js';

const execPromise = promisify(exec);

const uuidv4 = () => crypto.randomUUID();

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
      console.log(`Starting download: ${url}, type: ${type}, quality: ${quality}`);
      
      // Log 2K and 4K downloads (large files)
      if (quality === '2k' || quality === '4k') {
        console.log(`⚠️ Large file download requested: ${quality.toUpperCase()}`);
      }
      
      // Get video info first
      const info = await youtubedl(url, {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true,
        addHeader: ['referer:youtube.com', 'user-agent:googlebot']
      });
      
      console.log(`Video info retrieved: ${info.title}`);

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

      // Start download in background - don't await here
      this.executeDownload(url, type, quality, outputPath, downloadId)
        .then(() => {
          // Update status on completion
          const download = this.activeDownloads.get(downloadId);
          if (download) {
            download.status = 'completed';
            download.progress = 100;
            download.endTime = new Date();
            
            this.downloadHistory.push(download);
            this.activeDownloads.delete(downloadId);
            this.emitProgress(downloadId, download);
          }
        })
        .catch((error) => {
          const download = this.activeDownloads.get(downloadId);
          if (download) {
            download.status = 'failed';
            download.error = error.message;
            this.downloadHistory.push(download);
            this.activeDownloads.delete(downloadId);
            this.emitProgress(downloadId, download);
          }
        });

      // Return immediately with download info
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
      // For 2K/4K, download video and audio separately, then merge with FFmpeg
      const needsMerging = quality.includes('1440') || quality.includes('2160') || quality === '2k' || quality === '4k';
      
      if (needsMerging) {
        await this.downloadAndMerge(url, quality, outputPath, downloadId);
        return;
      }
      
      // For 1080p and below, use muxed streams (video+audio combined)
      if (quality.includes('1080')) {
        options.format = 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080]';
      } else if (quality.includes('720')) {
        options.format = 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720]';
      } else if (quality.includes('480')) {
        options.format = 'bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480]';
      } else if (quality.includes('360')) {
        options.format = 'bestvideo[height<=360][ext=mp4]+bestaudio[ext=m4a]/best[height<=360]';
      } else {
        options.format = quality || 'best'; // Use the provided format or best available
      }
    }

    // Enhanced progress tracking with realistic updates
    let currentProgress = 0;
    const progressSteps = [5, 15, 25, 40, 55, 70, 85, 95];
    let stepIndex = 0;
    
    const progressInterval = setInterval(() => {
      const downloadInfo = this.activeDownloads.get(downloadId);
      if (downloadInfo && stepIndex < progressSteps.length) {
        currentProgress = progressSteps[stepIndex];
        downloadInfo.progress = currentProgress;
        
        // Update status based on progress
        if (currentProgress < 20) {
          downloadInfo.status = 'initializing';
        } else if (currentProgress < 50) {
          downloadInfo.status = 'downloading';
        } else if (currentProgress < 90) {
          downloadInfo.status = 'processing';
        } else {
          downloadInfo.status = 'finalizing';
        }
        
        this.emitProgress(downloadId, downloadInfo);
        stepIndex++;
      }
    }, 1500); // Update every 1.5 seconds for more realistic feel

    // Execute download - youtube-dl-exec returns a promise
    try {
      await youtubedl(url, options);
      
      clearInterval(progressInterval);
      
      // Update progress to 100% on completion
      const downloadInfo = this.activeDownloads.get(downloadId);
      if (downloadInfo) {
        downloadInfo.progress = 100;
        downloadInfo.status = 'completed';
        this.emitProgress(downloadId, downloadInfo);
      }
    } catch (error) {
      clearInterval(progressInterval);
      
      // Update status to failed
      const downloadInfo = this.activeDownloads.get(downloadId);
      if (downloadInfo) {
        downloadInfo.status = 'failed';
        downloadInfo.error = error.message;
        this.emitProgress(downloadId, downloadInfo);
      }
      
      console.error('Download execution error:', error);
      throw error;
    }
  }

  async downloadAndMerge(url, quality, outputPath, downloadId) {
    const tempDir = path.join(this.downloadPath, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const videoTemp = path.join(tempDir, `video_${downloadId}.mp4`);
    const audioTemp = path.join(tempDir, `audio_${downloadId}.m4a`);

    try {
      // Download video
      const downloadInfo = this.activeDownloads.get(downloadId);
      if (downloadInfo) {
        downloadInfo.status = 'downloading video';
        this.emitProgress(downloadId, downloadInfo);
      }

      const videoFormat = quality === '4k' 
        ? 'bestvideo[height<=2160][ext=mp4]/bestvideo[height<=2160]' 
        : 'bestvideo[height<=1440][ext=mp4]/bestvideo[height<=1440]';
      
      console.log(`Downloading ${quality} video with format: ${videoFormat}`);
      
      await youtubedl(url, {
        output: videoTemp,
        format: videoFormat,
        noCheckCertificates: true,
        noWarnings: true,
        addHeader: ['referer:youtube.com', 'user-agent:googlebot']
      });

      // Download audio
      if (downloadInfo) {
        downloadInfo.status = 'downloading audio';
        downloadInfo.progress = 50;
        this.emitProgress(downloadId, downloadInfo);
      }

      console.log('Downloading audio...');
      
      await youtubedl(url, {
        output: audioTemp,
        format: 'bestaudio[ext=m4a]/bestaudio',
        noCheckCertificates: true,
        noWarnings: true,
        addHeader: ['referer:youtube.com', 'user-agent:googlebot']
      });

      // Merge with FFmpeg
      if (downloadInfo) {
        downloadInfo.status = 'merging';
        downloadInfo.progress = 75;
        this.emitProgress(downloadId, downloadInfo);
      }

      await this.mergeWithFFmpeg(videoTemp, audioTemp, outputPath);

      // Clean up temp files
      fs.unlinkSync(videoTemp);
      fs.unlinkSync(audioTemp);

      // Update progress
      if (downloadInfo) {
        downloadInfo.progress = 100;
        this.emitProgress(downloadId, downloadInfo);
      }
    } catch (error) {
      console.error(`Error in downloadAndMerge for ${quality}:`, error.message);
      
      // Clean up temp files on error
      if (fs.existsSync(videoTemp)) {
        try { fs.unlinkSync(videoTemp); } catch (e) {}
      }
      if (fs.existsSync(audioTemp)) {
        try { fs.unlinkSync(audioTemp); } catch (e) {}
      }
      
      // Provide helpful error message
      if (error.message.includes('ffmpeg')) {
        throw new Error(`FFmpeg not found. Install FFmpeg to download ${quality} videos.`);
      } else if (error.message.includes('format')) {
        throw new Error(`${quality} quality not available for this video. Try a lower quality.`);
      } else {
        throw error;
      }
    }
  }

  async mergeWithFFmpeg(videoPath, audioPath, outputPath) {
    const ffmpegCommand = `ffmpeg -i "${videoPath}" -i "${audioPath}" -c:v copy -c:a aac -strict experimental "${outputPath}"`;
    
    try {
      await execPromise(ffmpegCommand);
    } catch (error) {
      throw new Error(`FFmpeg merge failed: ${error.message}`);
    }
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

  getDownloadById(downloadId) {
    return this.activeDownloads.get(downloadId);
  }

  getDownloadFromHistory(downloadId) {
    return this.downloadHistory.find(download => download.id === downloadId);
  }
}
