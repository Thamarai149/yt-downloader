import { Router } from 'express';
import { getVideoInfoService } from '../services/index.js';

const router = Router();

router.get('/info', async (req, res, next) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }

    const videoInfoService = getVideoInfoService();
    const info = await videoInfoService.getVideoInfo(url);
    
    res.json({
      success: true,
      data: info
    });
  } catch (error) {
    next(error);
  }
});

router.get('/search', async (req, res, next) => {
  try {
    const { query, limit } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const videoInfoService = getVideoInfoService();
    const results = await videoInfoService.searchVideos(query, limit);
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
});

router.get('/playlist', async (req, res, next) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Playlist URL is required'
      });
    }

    const videoInfoService = getVideoInfoService();
    const info = await videoInfoService.getPlaylistInfo(url);
    
    res.json({
      success: true,
      data: info
    });
  } catch (error) {
    next(error);
  }
});

export default router;
