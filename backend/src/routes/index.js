import { Router } from 'express';
import downloadRoutes from './downloadRoutes.js';
import videoRoutes from './videoRoutes.js';
import fileRoutes from './fileRoutes.js';
import batchRoutes from './batchRoutes.js';
import playlistRoutes from './playlistRoutes.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    name: 'StreamedV3 API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      download: '/api/download',
      video: '/api/video',
      files: '/api/files',
      batch: '/api/batch',
      playlist: '/api/playlist'
    },
    telegram: {
      bot: 'Active',
      features: ['Video Download', 'Audio Download', 'Playlist Download', 'Subtitles', 'File Splitting']
    }
  });
});

// Routes
router.use('/download', downloadRoutes);
router.use('/video', videoRoutes);
router.use('/files', fileRoutes);
router.use('/batch', batchRoutes);
router.use('/playlist', playlistRoutes);

export default router;
