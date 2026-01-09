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
  
  // Initialize Telegram bot only if token is provided and not in conflict
  try {
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_TOKEN.trim() !== '') {
      telegramBotService = new TelegramBotService(downloadService, videoInfoService);
      telegramBotService.setPlaylistService(playlistService);
      telegramBotService.initialize().catch(error => {
        console.warn('⚠️ Telegram bot initialization failed:', error.message);
        console.log('📱 Web interface will work without Telegram bot');
        telegramBotService = null;
      });
    } else {
      console.log('📱 Telegram bot disabled - no token provided');
      telegramBotService = null;
    }
  } catch (error) {
    console.warn('⚠️ Telegram bot setup failed:', error.message);
    telegramBotService = null;
  }
  
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
