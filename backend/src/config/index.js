import os from 'os';
import path from 'path';

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  downloadPath: process.env.DOWNLOAD_PATH || path.join(os.homedir(), 'Downloads', 'YT-Downloads'),
  maxConcurrentDownloads: parseInt(process.env.MAX_CONCURRENT_DOWNLOADS) || 3,
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000 || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100
  },
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN
};
