import TelegramBot from 'node-telegram-bot-api';
import { config } from '../config/index.js';
import fs from 'fs';

export class TelegramBotService {
  constructor(downloadService, videoInfoService) {
    this.downloadService = downloadService;
    this.videoInfoService = videoInfoService;
    this.bot = null;
    this.userDownloads = new Map();
  }

  initialize() {
    if (!config.telegramBotToken) {
      console.warn('⚠️  Telegram bot token not configured. Bot will not start.');
      return;
    }

    try {
      this.bot = new TelegramBot(config.telegramBotToken, { polling: true });
      this.setupHandlers();
      console.log('🤖 Telegram bot initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Telegram bot:', error.message);
    }
  }

  setupHandlers() {
    // Start command
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      this.bot.sendMessage(chatId, 
        '👋 Welcome to VidFetch Bot!\n\n' +
        'Send me a video URL and I\'ll help you download it.\n\n' +
        'Commands:\n' +
        '/help - Show help\n' +
        '/info <url> - Get video information\n' +
        '/cancel - Cancel current download'
      );
    });

    // Help command
    this.bot.onText(/\/help/, (msg) => {
      const chatId = msg.chat.id;
      this.bot.sendMessage(chatId,
        '📖 How to use:\n\n' +
        '1. Send me a video URL (YouTube, etc.)\n' +
        '2. Choose format (video/audio)\n' +
        '3. Select quality\n' +
        '4. Wait for download to complete\n\n' +
        'Commands:\n' +
        '/info <url> - Get video details\n' +
        '/cancel - Cancel current download\n' +
        '/start - Show welcome message'
      );
    });

    // Info command
    this.bot.onText(/\/info (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const url = match[1];

      try {
        const statusMsg = await this.bot.sendMessage(chatId, '🔍 Fetching video info...');
        const info = await this.videoInfoService.getVideoInfo(url);
        
        await this.bot.editMessageText(
          `📹 *${info.title}*\n\n` +
          `👤 Channel: ${info.uploader}\n` +
          `⏱️ Duration: ${this.formatDuration(info.duration)}\n` +
          `👁️ Views: ${this.formatNumber(info.view_count)}\n` +
          `📅 Upload: ${new Date(info.upload_date).toLocaleDateString()}\n\n` +
          `Send the URL to download!`,
          {
            chat_id: chatId,
            message_id: statusMsg.message_id,
            parse_mode: 'Markdown'
          }
        );
      } catch (error) {
        this.bot.sendMessage(chatId, `❌ Error: ${error.message}`);
      }
    });

    // Cancel command
    this.bot.onText(/\/cancel/, (msg) => {
      const chatId = msg.chat.id;
      const downloadId = this.userDownloads.get(chatId);
      
      if (downloadId) {
        this.downloadService.cancelDownload(downloadId);
        this.userDownloads.delete(chatId);
        this.bot.sendMessage(chatId, '✅ Download cancelled');
      } else {
        this.bot.sendMessage(chatId, 'No active download to cancel');
      }
    });

    // Handle URLs
    this.bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      const text = msg.text;

      // Skip if it's a command
      if (!text || text.startsWith('/')) return;

      // Check if it's a URL
      if (this.isValidUrl(text)) {
        await this.handleVideoUrl(chatId, text);
      }
    });

    // Handle callback queries (button clicks)
    this.bot.on('callback_query', async (query) => {
      await this.handleCallback(query);
    });
  }

  async handleVideoUrl(chatId, url) {
    try {
      const statusMsg = await this.bot.sendMessage(chatId, '🔍 Analyzing video...');
      
      // Get video info
      const info = await this.videoInfoService.getVideoInfo(url);
      
      // Show format selection
      await this.bot.editMessageText(
        `📹 *${info.title}*\n\n` +
        `Choose download format:`,
        {
          chat_id: chatId,
          message_id: statusMsg.message_id,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '🎥 Video', callback_data: `format:video:${url}` },
                { text: '🎵 Audio', callback_data: `format:audio:${url}` }
              ]
            ]
          }
        }
      );
    } catch (error) {
      this.bot.sendMessage(chatId, `❌ Error: ${error.message}`);
    }
  }

  async handleCallback(query) {
    const chatId = query.message.chat.id;
    const data = query.data;

    try {
      if (data.startsWith('format:')) {
        const [, type, url] = data.split(':');
        const fullUrl = url + (data.split(':').slice(3).join(':') || '');
        
        // Show quality selection
        const keyboard = type === 'video' 
          ? [
              [{ text: '4K', callback_data: `quality:${type}:4k:${fullUrl}` }],
              [{ text: '2K', callback_data: `quality:${type}:2k:${fullUrl}` }],
              [{ text: '1080p', callback_data: `quality:${type}:1080:${fullUrl}` }],
              [{ text: '720p', callback_data: `quality:${type}:720:${fullUrl}` }],
              [{ text: 'Best', callback_data: `quality:${type}:best:${fullUrl}` }]
            ]
          : [
              [{ text: 'Best Quality', callback_data: `quality:${type}:best:${fullUrl}` }]
            ];

        await this.bot.editMessageText(
          `Select quality:`,
          {
            chat_id: chatId,
            message_id: query.message.message_id,
            reply_markup: { inline_keyboard: keyboard }
          }
        );
      } else if (data.startsWith('quality:')) {
        const parts = data.split(':');
        const type = parts[1];
        const quality = parts[2];
        const url = parts.slice(3).join(':');
        
        await this.startDownload(chatId, query.message.message_id, url, type, quality);
      }

      await this.bot.answerCallbackQuery(query.id);
    } catch (error) {
      await this.bot.answerCallbackQuery(query.id, { text: `Error: ${error.message}` });
    }
  }

  async startDownload(chatId, messageId, url, type, quality) {
    try {
      await this.bot.editMessageText(
        `⏬ Starting download...\n\n` +
        `Type: ${type}\n` +
        `Quality: ${quality}`,
        {
          chat_id: chatId,
          message_id: messageId
        }
      );

      // Start download
      const downloadInfo = await this.downloadService.startDownload(url, type, quality);
      this.userDownloads.set(chatId, downloadInfo.id);

      // Monitor progress
      this.monitorDownload(chatId, messageId, downloadInfo.id);
    } catch (error) {
      await this.bot.editMessageText(
        `❌ Download failed: ${error.message}`,
        {
          chat_id: chatId,
          message_id: messageId
        }
      );
    }
  }

  monitorDownload(chatId, messageId, downloadId) {
    const interval = setInterval(async () => {
      const download = this.downloadService.activeDownloads.get(downloadId);
      
      if (!download) {
        clearInterval(interval);
        
        // Check if completed
        const completed = this.downloadService.downloadHistory.find(d => d.id === downloadId);
        if (completed && completed.status === 'completed') {
          await this.sendFile(chatId, messageId, completed);
        }
        return;
      }

      // Update progress
      const progressBar = this.createProgressBar(download.progress);
      await this.bot.editMessageText(
        `⏬ Downloading...\n\n` +
        `${progressBar} ${Math.round(download.progress)}%\n\n` +
        `Status: ${download.status}`,
        {
          chat_id: chatId,
          message_id: messageId
        }
      ).catch(() => {}); // Ignore edit errors
    }, 2000);
  }

  async sendFile(chatId, messageId, downloadInfo) {
    try {
      await this.bot.editMessageText(
        `✅ Download completed!\n\nSending file...`,
        {
          chat_id: chatId,
          message_id: messageId
        }
      );

      const filePath = downloadInfo.outputPath;
      
      if (!fs.existsSync(filePath)) {
        throw new Error('File not found');
      }

      const fileSize = fs.statSync(filePath).size;
      const maxSize = 2000 * 1024 * 1024; // 2000MB (2GB) Telegram limit

      if (fileSize > maxSize) {
        await this.bot.sendMessage(chatId, 
          `⚠️ File is too large for Telegram (${this.formatBytes(fileSize)}).\n\n` +
          `Maximum size: 2GB\n` +
          `Please download from the web interface.`
        );
        return;
      }

      // Send file
      if (downloadInfo.type === 'audio') {
        await this.bot.sendAudio(chatId, filePath, {
          caption: downloadInfo.title
        });
      } else {
        await this.bot.sendVideo(chatId, filePath, {
          caption: downloadInfo.title,
          supports_streaming: true
        });
      }

      await this.bot.editMessageText(
        `✅ Download completed and sent!`,
        {
          chat_id: chatId,
          message_id: messageId
        }
      );

      this.userDownloads.delete(chatId);
    } catch (error) {
      await this.bot.sendMessage(chatId, `❌ Error sending file: ${error.message}`);
    }
  }

  isValidUrl(text) {
    try {
      const url = new URL(text);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  createProgressBar(progress) {
    const filled = Math.round(progress / 10);
    const empty = 10 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` 
                 : `${m}:${s.toString().padStart(2, '0')}`;
  }

  formatNumber(num) {
    return new Intl.NumberFormat().format(num);
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
