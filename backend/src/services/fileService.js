import fs from 'fs';
import path from 'path';
import { config } from '../config/index.js';
import { AppError } from '../middleware/errorHandler.js';

export class FileService {
  constructor() {
    this.downloadPath = config.downloadPath;
  }

  listFiles() {
    try {
      if (!fs.existsSync(this.downloadPath)) {
        return [];
      }

      const files = fs.readdirSync(this.downloadPath)
        .filter(file => {
          const ext = path.extname(file).toLowerCase();
          return ext === '.mp4' || ext === '.mp3';
        })
        .map(file => {
          const filePath = path.join(this.downloadPath, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            ext: path.extname(file).toLowerCase()
          };
        })
        .sort((a, b) => b.modified - a.modified);

      return files;
    } catch (error) {
      throw new AppError(`Failed to list files: ${error.message}`, 500);
    }
  }

  deleteFile(filename) {
    try {
      const filePath = path.join(this.downloadPath, filename);

      if (!fs.existsSync(filePath)) {
        throw new AppError('File not found', 404);
      }

      fs.unlinkSync(filePath);
      return true;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to delete file: ${error.message}`, 500);
    }
  }

  getDownloadPath() {
    return this.downloadPath;
  }

  setDownloadPath(newPath) {
    try {
      if (!fs.existsSync(newPath)) {
        fs.mkdirSync(newPath, { recursive: true });
      }
      this.downloadPath = newPath;
      return true;
    } catch (error) {
      throw new AppError(`Failed to set download path: ${error.message}`, 500);
    }
  }
}
