import { Router } from 'express';
import { getUpdateService } from '../services/index.js';

const router = Router();

// Check for updates
router.get('/check', async (req, res, next) => {
  try {
    const { force } = req.query;
    const updateService = getUpdateService();
    
    const updateInfo = await updateService.checkForUpdates(force === 'true');
    
    res.json({
      success: true,
      data: updateInfo
    });
  } catch (error) {
    next(error);
  }
});

// Get current version info
router.get('/version', (req, res) => {
  const updateService = getUpdateService();
  
  res.json({
    success: true,
    data: {
      currentVersion: updateService.currentVersion,
      lastUpdateCheck: updateService.lastUpdateCheck,
      hasUpdateInfo: !!updateService.updateInfo
    }
  });
});

// Get update summary
router.get('/summary', (req, res) => {
  const updateService = getUpdateService();
  const summary = updateService.getUpdateSummary();
  
  res.json({
    success: true,
    data: summary
  });
});

// Get changelog for specific version
router.get('/changelog/:version', (req, res) => {
  const { version } = req.params;
  const updateService = getUpdateService();
  
  const changelog = updateService.getChangelogForVersion(version);
  
  if (changelog) {
    res.json({
      success: true,
      data: changelog
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Changelog not found for this version'
    });
  }
});

export default router;