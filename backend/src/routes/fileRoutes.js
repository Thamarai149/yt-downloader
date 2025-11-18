import { Router } from 'express';
import { getFileService } from '../services/index.js';

const router = Router();

router.get('/', (req, res, next) => {
  try {
    const fileService = getFileService();
    const files = fileService.listFiles();
    
    res.json({
      success: true,
      data: {
        files,
        downloadPath: fileService.getDownloadPath()
      }
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:filename', (req, res, next) => {
  try {
    const { filename } = req.params;
    const fileService = getFileService();
    
    fileService.deleteFile(filename);
    
    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

router.get('/path', (req, res) => {
  const fileService = getFileService();
  
  res.json({
    success: true,
    data: {
      downloadPath: fileService.getDownloadPath()
    }
  });
});

router.post('/path', (req, res, next) => {
  try {
    const { downloadPath } = req.body;
    
    if (!downloadPath) {
      return res.status(400).json({
        success: false,
        error: 'Download path is required'
      });
    }

    const fileService = getFileService();
    fileService.setDownloadPath(downloadPath);
    
    res.json({
      success: true,
      message: 'Download path updated',
      data: {
        downloadPath: fileService.getDownloadPath()
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
