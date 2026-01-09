import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { getThumbnailService } from '../services/index.js';

const router = Router();

// Get thumbnail by video ID
router.get('/:videoId.jpg', (req, res) => {
  try {
    const { videoId } = req.params;
    const thumbnailService = getThumbnailService();
    
    if (!thumbnailService) {
      return res.status(503).json({
        success: false,
        error: 'Thumbnail service not available'
      });
    }

    const thumbnailInfo = thumbnailService.getThumbnailInfo(videoId);
    
    if (!thumbnailInfo || !thumbnailInfo.exists) {
      return res.status(404).json({
        success: false,
        error: 'Thumbnail not found'
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    
    // Stream the file
    const fileStream = fs.createReadStream(thumbnailInfo.path);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Error serving thumbnail:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to serve thumbnail'
    });
  }
});

// Extract thumbnail from video URL
router.post('/extract', async (req, res, next) => {
  try {
    const { videoId, thumbnailUrl } = req.body;
    
    if (!videoId || !thumbnailUrl) {
      return res.status(400).json({
        success: false,
        error: 'Video ID and thumbnail URL are required'
      });
    }

    const thumbnailService = getThumbnailService();
    if (!thumbnailService) {
      return res.status(503).json({
        success: false,
        error: 'Thumbnail service not available'
      });
    }

    const result = await thumbnailService.extractThumbnail(videoId, thumbnailUrl);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// Get all thumbnails
router.get('/', (req, res, next) => {
  try {
    const thumbnailService = getThumbnailService();
    if (!thumbnailService) {
      return res.status(503).json({
        success: false,
        error: 'Thumbnail service not available'
      });
    }

    const thumbnails = thumbnailService.getAllThumbnails();
    
    res.json({
      success: true,
      data: {
        thumbnails,
        count: thumbnails.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// Clean old thumbnails
router.delete('/cleanup', (req, res, next) => {
  try {
    const thumbnailService = getThumbnailService();
    if (!thumbnailService) {
      return res.status(503).json({
        success: false,
        error: 'Thumbnail service not available'
      });
    }

    const result = thumbnailService.cleanOldThumbnails();
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

export default router;