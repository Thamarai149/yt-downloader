import fs from 'fs';
import path from 'path';
import { AppError } from '../middleware/errorHandler.js';
import { config } from '../config/index.js';

export class ThumbnailService {
  constructor() {
    this.thumbnailsDir = path.join(config.downloadPath, 'thumbnails');
    this.ensureThumbnailsDirectory();
  }

  // Ensure thumbnails directory exists
  ensureThumbnailsDirectory() {
    try {
      if (!fs.existsSync(this.thumbnailsDir)) {
        fs.mkdirSync(this.thumbnailsDir, { recursive: true });
      }
    } catch (error) {
      console.warn('Could not create thumbnails directory:', error.message);
    }
  }

  // Extract and save thumbnail from video URL
  async extractThumbnail(videoId, thumbnailUrl) {
    try {
      if (!thumbnailUrl) {
        throw new AppError('No thumbnail URL provided', 400);
      }

      const thumbnailPath = path.join(this.thumbnailsDir, `${videoId}.jpg`);
      
      // Check if thumbnail already exists
      if (fs.existsSync(thumbnailPath)) {
        return {
          success: true,
          path: thumbnailPath,
          url: `/api/thumbnails/${videoId}.jpg`,
          cached: true
        };
      }

      // Download thumbnail
      const response = await fetch(thumbnailUrl);
      if (!response.ok) {
        throw new AppError(`Failed to download thumbnail: ${response.statusText}`, 500);
      }

      const buffer = await response.arrayBuffer();
      fs.writeFileSync(thumbnailPath, Buffer.from(buffer));

      return {
        success: true,
        path: thumbnailPath,
        url: `/api/thumbnails/${videoId}.jpg`,
        cached: false
      };
    } catch (error) {
      console.error('Thumbnail extraction error:', error);
      throw new AppError(`Failed to extract thumbnail: ${error.message}`, 500);
    }
  }

  // Get thumbnail info
  getThumbnailInfo(videoId) {
    const thumbnailPath = path.join(this.thumbnailsDir, `${videoId}.jpg`);
    
    if (!fs.existsSync(thumbnailPath)) {
      return null;
    }

    const stats = fs.statSync(thumbnailPath);
    return {
      exists: true,
      path: thumbnailPath,
      url: `/api/thumbnails/${videoId}.jpg`,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    };
  }

  // Clean old thumbnails (older than 7 days)
  cleanOldThumbnails() {
    try {
      const files = fs.readdirSync(this.thumbnailsDir);
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

      let cleaned = 0;
      files.forEach(file => {
        const filePath = path.join(this.thumbnailsDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime.getTime() < sevenDaysAgo) {
          fs.unlinkSync(filePath);
          cleaned++;
        }
      });

      return { cleaned, total: files.length };
    } catch (error) {
      console.error('Error cleaning thumbnails:', error);
      return { cleaned: 0, total: 0, error: error.message };
    }
  }

  // Get all thumbnails
  getAllThumbnails() {
    try {
      const files = fs.readdirSync(this.thumbnailsDir);
      return files.map(file => {
        const filePath = path.join(this.thumbnailsDir, file);
        const stats = fs.statSync(filePath);
        const videoId = path.parse(file).name;
        
        return {
          videoId,
          filename: file,
          url: `/api/thumbnails/${file}`,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      });
    } catch (error) {
      console.error('Error getting thumbnails:', error);
      return [];
    }
  }
}