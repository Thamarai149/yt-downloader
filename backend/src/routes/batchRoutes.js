import { Router } from 'express';
import { getBatchService } from '../services/index.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const { urls, type, quality } = req.body;
    
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'URLs array is required'
      });
    }

    const batchService = getBatchService();
    const result = await batchService.startBatchDownload(urls, type, quality);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:batchId', (req, res) => {
  const { batchId } = req.params;
  const batchService = getBatchService();
  
  const batch = batchService.getBatchStatus(batchId);
  
  if (batch) {
    res.json({
      success: true,
      data: batch
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Batch not found'
    });
  }
});

router.get('/', (req, res) => {
  const batchService = getBatchService();
  const batches = batchService.getAllBatches();
  
  res.json({
    success: true,
    data: batches
  });
});

router.delete('/:batchId', (req, res) => {
  const { batchId } = req.params;
  const batchService = getBatchService();
  
  const cancelled = batchService.cancelBatch(batchId);
  
  if (cancelled) {
    res.json({
      success: true,
      message: 'Batch cancelled'
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Batch not found'
    });
  }
});

export default router;
