import { Router } from 'express';
import { getPlaylistService } from '../services/index.js';
import { validate, schemas } from '../middleware/validator.js';

const router = Router();

// Get playlist information
router.get('/info', validate(schemas.playlistInfo), async (req, res, next) => {
  try {
    const { url } = req.query;
    const playlistService = getPlaylistService();
    
    const info = await playlistService.getPlaylistInfo(url);
    
    res.json({
      success: true,
      data: info
    });
  } catch (error) {
    next(error);
  }
});

// Start playlist download
router.post('/', validate(schemas.playlistDownload), async (req, res, next) => {
  try {
    const { url, type, quality, options } = req.body;
    const playlistService = getPlaylistService();
    
    const result = await playlistService.startPlaylistDownload(url, type, quality, options);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// Get active playlists
router.get('/active', (req, res) => {
  const playlistService = getPlaylistService();
  const activePlaylists = playlistService.getActivePlaylists();
  
  res.json({
    success: true,
    data: activePlaylists
  });
});

// Get playlist history
router.get('/history', (req, res) => {
  const playlistService = getPlaylistService();
  const history = playlistService.getPlaylistHistory();
  
  res.json({
    success: true,
    data: history
  });
});

// Get specific playlist status
router.get('/:playlistId', (req, res) => {
  const { playlistId } = req.params;
  const playlistService = getPlaylistService();
  
  const playlist = playlistService.getActivePlaylist(playlistId);
  
  if (playlist) {
    res.json({
      success: true,
      data: playlist
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Playlist not found'
    });
  }
});

// Cancel playlist download
router.delete('/:playlistId', (req, res) => {
  const { playlistId } = req.params;
  const playlistService = getPlaylistService();
  
  const cancelled = playlistService.cancelPlaylistDownload(playlistId);
  
  if (cancelled) {
    res.json({
      success: true,
      message: 'Playlist download cancelled'
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Playlist not found'
    });
  }
});

export default router;