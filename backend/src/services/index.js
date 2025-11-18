import { DownloadService } from './downloadService.js';
import { VideoInfoService } from './videoInfoService.js';
import { FileService } from './fileService.js';
import { BatchService } from './batchService.js';

let downloadService;
let videoInfoService;
let fileService;
let batchService;

export const initializeServices = (io) => {
  downloadService = new DownloadService(io);
  videoInfoService = new VideoInfoService();
  fileService = new FileService();
  batchService = new BatchService(downloadService, io);
  
  console.log('✅ Services initialized');
};

export const getDownloadService = () => downloadService;
export const getVideoInfoService = () => videoInfoService;
export const getFileService = () => fileService;
export const getBatchService = () => batchService;
