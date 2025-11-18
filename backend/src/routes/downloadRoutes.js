import { Router } from 'express';
import { getDownloadService } from '../services/index.js';
import { validate, schemas } from '../middleware/validator.js';

const router = Router();

router.post('/', validate(schemas.download), async (req, res, next) => {
  try {
    const { url, type, quality } = req.body;
    const downloadService = getDownloadService();
    
    const result = await downloadService.startDownload(url, type, quality);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

router.get('/active', (req, res) => {
  const downloadService = getDownloadService();
  const activeDownloads = downloadService.getActiveDownloads();
  
  res.json({
    success: true,
    data: activeDownloads
  });
});

router.get('/history', (req, res) => {
  const downloadService = getDownloadService();
  const history = downloadService.getDownloadHistory();
  
  res.json({
    success: true,
    data: history
  });
});

router.delete('/:downloadId', (req, res) => {
  const { downloadId } = req.params;
  const downloadService = getDownloadService();
  
  const cancelled = downloadService.cancelDownload(downloadId);
  
  if (cancelled) {
    res.json({
      success: true,
      message: 'Download cancelled'
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Download not found'
    });
  }
});

export default router;
