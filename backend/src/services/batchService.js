import crypto from 'crypto';
import { AppError } from '../middleware/errorHandler.js';

const uuidv4 = () => crypto.randomUUID();

export class BatchService {
  constructor(downloadService, io) {
    this.downloadService = downloadService;
    this.io = io;
    this.batches = new Map();
  }

  async startBatchDownload(urls, type = 'video', quality = 'best') {
    const batchId = uuidv4();
    
    const batch = {
      id: batchId,
      urls: urls,
      type,
      quality,
      status: 'processing',
      total: urls.length,
      completed: 0,
      failed: 0,
      downloads: [],
      startTime: new Date()
    };

    this.batches.set(batchId, batch);
    this.emitBatchUpdate(batchId, batch);

    // Process downloads sequentially to avoid overwhelming the system
    this.processBatch(batchId, urls, type, quality);

    return {
      batchId,
      total: urls.length,
      message: 'Batch download started'
    };
  }

  async processBatch(batchId, urls, type, quality) {
    const batch = this.batches.get(batchId);
    if (!batch) return;

    for (const url of urls) {
      if (batch.status === 'cancelled') break;

      try {
        const download = await this.downloadService.startDownload(url, type, quality);
        batch.downloads.push({
          url,
          status: 'completed',
          downloadId: download.id,
          title: download.title
        });
        batch.completed++;
      } catch (error) {
        batch.downloads.push({
          url,
          status: 'failed',
          error: error.message
        });
        batch.failed++;
      }

      this.emitBatchUpdate(batchId, batch);
    }

    batch.status = batch.failed === batch.total ? 'failed' : 'completed';
    batch.endTime = new Date();
    this.emitBatchUpdate(batchId, batch);
  }

  emitBatchUpdate(batchId, batch) {
    this.io.emit('batch:progress', {
      batchId,
      ...batch
    });
  }

  getBatchStatus(batchId) {
    return this.batches.get(batchId);
  }

  getAllBatches() {
    return Array.from(this.batches.values());
  }

  cancelBatch(batchId) {
    const batch = this.batches.get(batchId);
    if (batch && batch.status === 'processing') {
      batch.status = 'cancelled';
      this.emitBatchUpdate(batchId, batch);
      return true;
    }
    return false;
  }
}
