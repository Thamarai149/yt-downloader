import { DownloadService } from './downloadService.js';
import { VideoInfoService } from './videoInfoService.js';
import { FileService } from './fileService.js';
import { BatchService } from './batchService.js';
import { PlaylistService } from './playlistService.js';
import { UpdateService } from './updateService.js';
import { TelegramBotService } from '../bot/telegramBot.js';

let downloadService;
let videoInfoService;
let fileService;
let batchService;
let playlistService;
let updateService;
let telegramBotService;

export const initializeServices = (io) => {
  downloadService = new DownloadService(io);
  videoInfoService = new VideoInfoService();
  fileService = new FileService();
  batchService = new BatchService(downloadService, io);
  playlistService = new PlaylistService(downloadService, io);
  updateService = new UpdateService();
  
  // Disable Telegram bot for now to avoid conflicts
  console.log('📱 Telegram bot disabled to prevent conflicts');
  console.log('🌐 Web interface is fully functional without Telegram bot');
  telegramBotService = null;
  
  console.log('✅ Services initialized');
};

export const getDownloadService = () => downloadService;
export const getVideoInfoService = () => videoInfoService;
export const getFileService = () => fileService;
export const getBatchService = () => batchService;
export const getPlaylistService = () => playlistService;
export const getUpdateService = () => updateService;
export const getTelegramBotService = () => {
  if (!telegramBotService) {
    console.warn('Telegram bot service not available');
    return null;
  }
  return telegramBotService;
};
