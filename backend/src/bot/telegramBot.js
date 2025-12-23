import TelegramBot from 'node-telegram-bot-api';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';
import { downloadService } from '../services/downloadService.js';
import { validateUrl } from '../utils/validators.js';

class TelegramBotService {
  constructor() {
    this.bot = null;
    this.commands = new Map();
    this.userSessions = new Map();
    this.initializeCommands();
  }

  // Initialize the bot
  async initialize() {
    try {
      if (!config.telegram.botToken) {
        throw new Error('Telegram bot token not configured');
      }

      this.bot = new TelegramBot(config.telegram.botToken, { polling: true });
      this.setupEventHandlers();
      logger.info('Telegram bot initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Telegram bot:', error);
      throw error;
    }
  }

  // Command registration system
  initializeCommands() {
    // Basic commands
    this.registerCommand('start', this.handleStart.bind(this));
    this.registerCommand('help', this.handleHelp.bind(this));
    this.registerCommand('status', this.handleStatus.bind(this));
    
    // Download commands
    this.registerCommand('download', this.handleDownload.bind(this));
    this.registerCommand('audio', this.handleAudioDownload.bind(this));
    this.registerCommand('video', this.handleVideoDownload.bind(this));
    this.registerCommand('playlist', this.handlePlaylistDownload.bind(this));
    
    // User management
    this.registerCommand('settings', this.handleSettings.bind(this));
    this.registerCommand('history', this.handleHistory.bind(this));
    this.registerCommand('cancel', this.handleCancel.bind(this));
    
    // Admin commands
    this.registerCommand('stats', this.handleStats.bind(this));
    this.registerCommand('users', this.handleUsers.bind(this));
  }

  // Register a new command
  registerCommand(command, handler) {
    this.commands.set(command, {
      handler,
      description: this.getCommandDescription(command),
      usage: this.getCommandUsage(command)
    });
  }

  // Setup event handlers
  setupEventHandlers() {
    // Handle text messages
    this.bot.on('message', this.handleMessage.bind(this));
    
    // Handle callback queries (inline buttons)
    this.bot.on('callback_query', this.handleCallbackQuery.bind(this));
    
    // Handle errors
    this.bot.on('error', this.handleError.bind(this));
    
    // Handle polling errors
    this.bot.on('polling_error', this.handlePollingError.bind(this));
  }

  // Main message handler
  async handleMessage(msg) {
    try {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      const text = msg.text?.trim();

      if (!text) return;

      // Log user activity
      this.logUserActivity(userId, msg.from, text);

      // Handle commands
      if (text.startsWith('/')) {
        await this.handleCommand(msg);
      } else {
        // Handle non-command messages (URLs, etc.)
        await this.handleNonCommand(msg);
      }
    } catch (error) {
      logger.error('Error handling message:', error);
      await this.sendErrorMessage(msg.chat.id, 'An error occurred while processing your message.');
    }
  }

  // Handle command messages
  async handleCommand(msg) {
    const chatId = msg.chat.id;
    const text = msg.text;
    const [command, ...args] = text.slice(1).split(' ');

    if (this.commands.has(command)) {
      const commandObj = this.commands.get(command);
      await commandObj.handler(msg, args);
    } else {
      await this.sendMessage(chatId, `Unknown command: /${command}\nType /help for available commands.`);
    }
  }

  // Handle non-command messages (URLs, etc.)
  async handleNonCommand(msg) {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Check if it's a YouTube URL
    if (this.isYouTubeUrl(text)) {
      await this.handleQuickDownload(msg, text);
    } else {
      await this.sendMessage(chatId, 
        'Send me a YouTube URL to download, or use /help to see available commands.'
      );
    }
  }

  // Command Handlers
  async handleStart(msg, args) {
    const chatId = msg.chat.id;
    const userName = msg.from.first_name || 'User';
    
    const welcomeMessage = `
🎬 Welcome to YTStreamer007, ${userName}!

I can help you download YouTube videos and audio files.

🚀 Quick start:
• Send me any YouTube URL to download
• Use /download [URL] for more options
• Type /help for all commands

Let's get started! 🎵📹
    `;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '📖 Help', callback_data: 'help' },
          { text: '⚙️ Settings', callback_data: 'settings' }
        ]
      ]
    };

    await this.sendMessage(chatId, welcomeMessage, { reply_markup: keyboard });
  }

  async handleHelp(msg, args) {
    const chatId = msg.chat.id;
    
    const helpMessage = `
📖 Available Commands:

🎬 Download Commands:
/download [URL] - Download with options
/audio [URL] - Download audio only
/video [URL] - Download video only
/playlist [URL] - Download entire playlist

⚙️ User Commands:
/settings - Configure preferences
/history - View download history
/cancel - Cancel current download
/status - Check bot status

📊 Info Commands:
/help - Show this help message
/start - Welcome message

💡 Tips:
• You can also just send a YouTube URL directly
• Use inline buttons for quick actions
• Check /settings for quality preferences
    `;

    await this.sendMessage(chatId, helpMessage);
  }

  async handleDownload(msg, args) {
    const chatId = msg.chat.id;
    
    if (args.length === 0) {
      await this.sendMessage(chatId, 
        'Please provide a YouTube URL.\nUsage: /download [YouTube URL]'
      );
      return;
    }

    const url = args[0];
    if (!this.isYouTubeUrl(url)) {
      await this.sendMessage(chatId, 'Please provide a valid YouTube URL.');
      return;
    }

    await this.showDownloadOptions(chatId, url);
  }

  async handleAudioDownload(msg, args) {
    const chatId = msg.chat.id;
    
    if (args.length === 0) {
      await this.sendMessage(chatId, 
        'Please provide a YouTube URL.\nUsage: /audio [YouTube URL]'
      );
      return;
    }

    const url = args[0];
    if (!this.isYouTubeUrl(url)) {
      await this.sendMessage(chatId, 'Please provide a valid YouTube URL.');
      return;
    }

    await this.startDownload(chatId, url, { format: 'audio', quality: 'best' });
  }

  async handleVideoDownload(msg, args) {
    const chatId = msg.chat.id;
    
    if (args.length === 0) {
      await this.sendMessage(chatId, 
        'Please provide a YouTube URL.\nUsage: /video [YouTube URL]'
      );
      return;
    }

    const url = args[0];
    if (!this.isYouTubeUrl(url)) {
      await this.sendMessage(chatId, 'Please provide a valid YouTube URL.');
      return;
    }

    await this.startDownload(chatId, url, { format: 'video', quality: 'best' });
  }

  async handleStatus(msg, args) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const session = this.userSessions.get(userId);
    
    if (!session || !session.activeDownload) {
      await this.sendMessage(chatId, '✅ No active downloads.');
      return;
    }

    const status = `
📊 Download Status:

🎬 Video: ${session.activeDownload.title || 'Loading...'}
📈 Progress: ${session.activeDownload.progress || 0}%
⏱️ Status: ${session.activeDownload.status || 'Processing...'}
🕒 Started: ${new Date(session.activeDownload.startTime).toLocaleTimeString()}
    `;

    await this.sendMessage(chatId, status);
  }

  async handleCancel(msg, args) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const session = this.userSessions.get(userId);
    
    if (!session || !session.activeDownload) {
      await this.sendMessage(chatId, 'No active download to cancel.');
      return;
    }

    // Cancel the download
    if (session.activeDownload.cancelToken) {
      session.activeDownload.cancelToken();
    }

    // Clear session
    session.activeDownload = null;
    
    await this.sendMessage(chatId, '❌ Download cancelled.');
  }

  // Utility Methods
  async showDownloadOptions(chatId, url) {
    const keyboard = {
      inline_keyboard: [
        [
          { text: '🎵 Audio Only', callback_data: `download_audio_${url}` },
          { text: '🎬 Video', callback_data: `download_video_${url}` }
        ],
        [
          { text: '📱 Mobile Quality', callback_data: `download_mobile_${url}` },
          { text: '🖥️ HD Quality', callback_data: `download_hd_${url}` }
        ],
        [
          { text: '❌ Cancel', callback_data: 'cancel_download' }
        ]
      ]
    };

    await this.sendMessage(chatId, 
      '🎬 Choose download option:', 
      { reply_markup: keyboard }
    );
  }

  async handleQuickDownload(msg, url) {
    const chatId = msg.chat.id;
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: '🎵 Audio', callback_data: `quick_audio_${url}` },
          { text: '🎬 Video', callback_data: `quick_video_${url}` }
        ]
      ]
    };

    await this.sendMessage(chatId, 
      '🎬 Quick download - choose format:', 
      { reply_markup: keyboard }
    );
  }

  async startDownload(chatId, url, options = {}) {
    try {
      const userId = chatId; // Assuming chatId as userId for simplicity
      
      // Initialize user session
      if (!this.userSessions.has(userId)) {
        this.userSessions.set(userId, {});
      }
      
      const session = this.userSessions.get(userId);
      
      // Check if already downloading
      if (session.activeDownload) {
        await this.sendMessage(chatId, 'You already have an active download. Use /cancel to stop it first.');
        return;
      }

      // Send initial message
      const statusMsg = await this.sendMessage(chatId, '🔄 Starting download...');
      
      // Set up download session
      session.activeDownload = {
        url,
        options,
        startTime: Date.now(),
        progress: 0,
        status: 'initializing',
        messageId: statusMsg.message_id
      };

      // Start download with progress callback
      const downloadResult = await downloadService.downloadVideo(url, {
        ...options,
        onProgress: (progress) => this.updateDownloadProgress(chatId, userId, progress),
        onComplete: (result) => this.handleDownloadComplete(chatId, userId, result),
        onError: (error) => this.handleDownloadError(chatId, userId, error)
      });

    } catch (error) {
      logger.error('Download error:', error);
      await this.sendErrorMessage(chatId, 'Failed to start download. Please try again.');
    }
  }

  async updateDownloadProgress(chatId, userId, progress) {
    const session = this.userSessions.get(userId);
    if (!session || !session.activeDownload) return;

    session.activeDownload.progress = progress.percent || 0;
    session.activeDownload.status = progress.status || 'downloading';

    // Update message every 10% or significant status change
    if (progress.percent % 10 === 0 || progress.status !== session.lastStatus) {
      const progressText = `
🔄 Downloading...

📊 Progress: ${Math.round(progress.percent || 0)}%
⚡ Speed: ${progress.speed || 'N/A'}
📦 Size: ${progress.size || 'N/A'}
      `;

      await this.editMessage(chatId, session.activeDownload.messageId, progressText);
      session.lastStatus = progress.status;
    }
  }

  async handleDownloadComplete(chatId, userId, result) {
    const session = this.userSessions.get(userId);
    if (!session) return;

    // Clear active download
    session.activeDownload = null;

    // Send completion message
    await this.sendMessage(chatId, `
✅ Download Complete!

🎬 ${result.title}
📁 File: ${result.filename}
📊 Size: ${result.filesize}
⏱️ Duration: ${result.duration}

Your file is ready! 🎉
    `);

    // Send file if small enough
    if (result.filesize && result.filesize < 50 * 1024 * 1024) { // 50MB limit
      try {
        await this.bot.sendDocument(chatId, result.filepath);
      } catch (error) {
        logger.error('Failed to send file:', error);
        await this.sendMessage(chatId, 'File is ready but too large to send via Telegram.');
      }
    }
  }

  async handleDownloadError(chatId, userId, error) {
    const session = this.userSessions.get(userId);
    if (session) {
      session.activeDownload = null;
    }

    logger.error('Download error for user:', userId, error);
    await this.sendErrorMessage(chatId, 'Download failed. Please try again or check the URL.');
  }

  // Callback query handler
  async handleCallbackQuery(callbackQuery) {
    try {
      const chatId = callbackQuery.message.chat.id;
      const data = callbackQuery.data;

      // Answer callback query
      await this.bot.answerCallbackQuery(callbackQuery.id);

      // Handle different callback types
      if (data.startsWith('download_')) {
        await this.handleDownloadCallback(chatId, data);
      } else if (data.startsWith('quick_')) {
        await this.handleQuickCallback(chatId, data);
      } else {
        await this.handleGenericCallback(chatId, data);
      }

    } catch (error) {
      logger.error('Callback query error:', error);
    }
  }

  async handleDownloadCallback(chatId, data) {
    const [action, format, ...urlParts] = data.split('_');
    const url = urlParts.join('_');
    
    const options = {
      format: format === 'audio' ? 'audio' : 'video',
      quality: format === 'mobile' ? 'worst' : format === 'hd' ? 'best' : 'best'
    };

    await this.startDownload(chatId, url, options);
  }

  // Helper methods
  isYouTubeUrl(url) {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return youtubeRegex.test(url);
  }

  async sendMessage(chatId, text, options = {}) {
    try {
      return await this.bot.sendMessage(chatId, text, {
        parse_mode: 'HTML',
        ...options
      });
    } catch (error) {
      logger.error('Failed to send message:', error);
      throw error;
    }
  }

  async editMessage(chatId, messageId, text, options = {}) {
    try {
      return await this.bot.editMessageText(text, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'HTML',
        ...options
      });
    } catch (error) {
      // Ignore edit errors (message might be too old)
      logger.warn('Failed to edit message:', error.message);
    }
  }

  async sendErrorMessage(chatId, message) {
    await this.sendMessage(chatId, `❌ ${message}`);
  }

  logUserActivity(userId, user, message) {
    logger.info(`User activity - ID: ${userId}, Name: ${user.first_name}, Message: ${message.substring(0, 50)}`);
  }

  getCommandDescription(command) {
    const descriptions = {
      start: 'Start the bot and show welcome message',
      help: 'Show available commands and usage',
      download: 'Download YouTube video with options',
      audio: 'Download audio only',
      video: 'Download video with audio',
      playlist: 'Download entire playlist',
      status: 'Check current download status',
      cancel: 'Cancel active download',
      settings: 'Configure user preferences',
      history: 'View download history',
      stats: 'Show bot statistics (admin)',
      users: 'Show user list (admin)'
    };
    return descriptions[command] || 'No description available';
  }

  getCommandUsage(command) {
    const usages = {
      download: '/download [YouTube URL]',
      audio: '/audio [YouTube URL]',
      video: '/video [YouTube URL]',
      playlist: '/playlist [YouTube URL]'
    };
    return usages[command] || `/${command}`;
  }

  // Error handlers
  handleError(error) {
    logger.error('Telegram bot error:', error);
  }

  handlePollingError(error) {
    logger.error('Telegram polling error:', error);
  }

  // Shutdown
  async shutdown() {
    if (this.bot) {
      await this.bot.stopPolling();
      logger.info('Telegram bot stopped');
    }
  }
}

// Export singleton instance
export const telegramBot = new TelegramBotService();