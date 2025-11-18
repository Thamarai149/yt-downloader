import { Router } from 'express';
import downloadRoutes from './downloadRoutes.js';
import videoRoutes from './videoRoutes.js';
import fileRoutes from './fileRoutes.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes
router.use('/download', downloadRoutes);
router.use('/video', videoRoutes);
router.use('/files', fileRoutes);

export default router;
