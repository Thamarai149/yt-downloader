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
      addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
      progress: true
    };

    if (type === 'audio') {
      options.extractAudio = true;
      options.audioFormat = 'mp3';
      options.audioQuality = 0;
    } else {
      // For 2K/4K, download video and audio separately, then merge with FFmpeg
      const needsMerging = quality === '4k' || quality === '2k';
      
      if (needsMerging) {
        await this.downloadAndMerge(url, quality, outputPath, downloadId);
        return;
      }
      
      // For 1080p and below, use muxed streams (video+audio combined)
      if (quality === '1080') {
        options.format = 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080]';
      } else if (quality === '720') {
        options.format = 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720]';
      } else {
        options.format = 'best';
      }
    }

    // Execute download - youtube-dl-exec returns a promise
    try {
      await youtubedl(url, options);
      
      // Update progress to 100% on completion
      const downloadInfo = this.activeDownloads.get(downloadId);
      if (downloadInfo) {
        downloadInfo.progress = 100;
        this.emitProgress(downloadId, downloadInfo);
      }
    } catch (error) {
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

      const videoFormat = quality === '4k' ? 'bestvideo[height<=2160][ext=mp4]' : 'bestvideo[height<=1440][ext=mp4]';
      await youtubedl(url, {
        output: videoTemp,
        format: videoFormat,
        noCheckCertificates: true,
        noWarnings: true
      });

      // Download audio
      if (downloadInfo) {
        downloadInfo.status = 'downloading audio';
        downloadInfo.progress = 50;
        this.emitProgress(downloadId, downloadInfo);
      }

      await youtubedl(url, {
        output: audioTemp,
        format: 'bestaudio[ext=m4a]',
        noCheckCertificates: true,
        noWarnings: true
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
      // Clean up temp files on error
      if (fs.existsSync(videoTemp)) fs.unlinkSync(videoTemp);
      if (fs.existsSync(audioTemp)) fs.unlinkSync(audioTemp);
      throw error;
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
}
