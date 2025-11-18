import { DownloadService } from './downloadService.js';
import { VideoInfoService } from './videoInfoService.js';
import { FileService } from './fileService.js';

let downloadService;
let videoInfoService;
let fileService;

export const initializeServices = (io) => {
  downloadService = new DownloadService(io);
  videoInfoService = new VideoInfoService();
  fileService = new FileService();
  
  console.log('✅ Services initialized');
};

export const getDownloadService = () => downloadService;
export const getVideoInfoService = () => videoInfoService;
export const getFileService = () => fileService;
