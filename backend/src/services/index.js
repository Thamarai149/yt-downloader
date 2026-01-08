import { DownloadService } from './downloadService.js';
import { VideoInfoService } from './videoInfoService.js';
import { FileService } from './fileService.js';
import { BatchService } from './batchService.js';
import { PlaylistService } from './playlistService.js';
import { TelegramBotService } from '../bot/telegramBot.js';

let downloadService;
let videoInfoService;
let fileService;
let batchService;
let playlistService;
let telegramBotService;

export const initializeServices = (io) => {
  downloadService = new DownloadService(io);
  videoInfoService = new VideoInfoService();
  fileService = new FileService();
  batchService = new BatchService(downloadService, io);
  playlistService = new PlaylistService(downloadService, io);
  
  // Initialize Telegram bot
  telegramBotService = new TelegramBotService(downloadService, videoInfoService);
  telegramBotService.setPlaylistService(playlistService);
  telegramBotService.initialize();
  
  console.log('✅ Services initialized');
};

export const getDownloadService = () => downloadService;
export const getVideoInfoService = () => videoInfoService;
export const getFileService = () => fileService;
export const getBatchService = () => batchService;
export const getPlaylistService = () => playlistService;
export const getTelegramBotService = () => telegramBotService;
