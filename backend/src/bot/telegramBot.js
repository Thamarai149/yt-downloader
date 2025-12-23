import TelegramBot from 'node-telegram-bot-api';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { isValidYouTubeUrl } from '../utils/youtubeValidator.js';

class TelegramBotService {
  constructor(downloadService = null, videoInfoService = null) {
    this.bot = null;
    this.commands = new Map();
    this.userSessions = new Map();
    this.urlCache = new Map(); // Cache for storing URLs with short IDs
    this.downloadService = downloadService;
    this.videoInfoService = videoInfoService;
    this.initializeCommands();
  }

  // Set services after initialization to avoid circular dependency
  setServices(downloadService, videoInfoService) {
    this.downloadService = downloadService;
    this.videoInfoService = videoInfoService;
  }

  // Generate short ID for URL to avoid callback data limit
  generateUrlId(url) {
    const id = Math.random().toString(36).substring(2, 8); // 6 character ID
    this.urlCache.set(id, url);
    // Clean old entries to prevent memory leak (keep last 100)
    if (this.urlCache.size > 100) {
      const firstKey = this.urlCache.keys().next().value;
      this.urlCache.delete(firstKey);
    }
    return id;
  }

  // Get URL from short ID
  getUrlFromId(id) {
    return this.urlCache.get(id);
  }

  // Initialize the bot
  async initialize() {
    try {
      if (!config.telegramBotToken) {
        throw new Error('Telegram bot token not configured');
      }

      this.bot = new TelegramBot(config.telegramBotToken, { polling: true });
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
    this.registerCommand('resolutions', this.handleResolutions.bind(this));
    
    // User management
    this.registerCommand('settings', this.handleSettings.bind(this));
    this.registerCommand('history', this.handleHistory.bind(this));
    this.registerCommand('cancel', this.handleCancel.bind(this));
    this.registerCommand('location', this.handleLocation.bind(this));
    
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

I can help you download YouTube videos in multiple resolutions and audio files.

🚀 Quick start:
• Send me any YouTube URL to download
• Use /download [URL] for resolution options
• Type /resolutions to see all available qualities
• Use /help for all commands

📺 Available: 360p, 480p, 720p HD, 1080p FHD, 2K, 4K
🎵 Audio: MP3 format

Let's get started! 🎵📹
    `;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '📖 Help', callback_data: 'help' },
          { text: '📺 Resolutions', callback_data: 'resolutions' }
        ],
        [
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

    await this.startDownload(chatId, url, { 
      format: 'audio', 
      originalQuality: 'best',
      quality: 'best' 
    });
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

    await this.startDownload(chatId, url, { 
      format: 'video', 
      originalQuality: 'best',
      quality: 'best' 
    });
  }

  async handleResolutions(msg, args) {
    const chatId = msg.chat.id;
    
    const resolutionInfo = `
📺 Available Video Resolutions:

📱 **Mobile Quality:**
• 360p - Small file, fast download
• 480p - Standard mobile quality

🖥️ **Desktop Quality:**
• 720p HD - High definition
• 1080p FHD - Full high definition

🎬 **Premium Quality:**
• 1440p 2K - Ultra high definition
• 2160p 4K - Maximum quality

⚡ **Special Options:**
• Best Quality - Highest available
• Fastest - Lowest quality, quick download

🎵 **Audio Only:**
• MP3 format - Audio extraction

💡 **Usage Tips:**
• Higher resolutions = larger files
• 4K videos may take longer to process
• Audio-only is perfect for music
• Use /download [URL] to choose resolution
    `;

    await this.sendMessage(chatId, resolutionInfo);
  }

  async handlePlaylistDownload(msg, args) {
    const chatId = msg.chat.id;
    
    if (args.length === 0) {
      await this.sendMessage(chatId, 
        'Please provide a YouTube playlist URL.\nUsage: /playlist [YouTube Playlist URL]'
      );
      return;
    }

    const url = args[0];
    if (!this.isYouTubeUrl(url)) {
      await this.sendMessage(chatId, 'Please provide a valid YouTube playlist URL.');
      return;
    }

    await this.sendMessage(chatId, 'Playlist downloads are not yet implemented. Please download videos individually.');
  }

  async handleSettings(msg, args) {
    const chatId = msg.chat.id;
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: '🎵 Default: Audio', callback_data: 'setting_default_audio' },
          { text: '🎬 Default: Video', callback_data: 'setting_default_video' }
        ],
        [
          { text: '📱 Quality: Mobile', callback_data: 'setting_quality_mobile' },
          { text: '🖥️ Quality: HD', callback_data: 'setting_quality_hd' }
        ]
      ]
    };

    await this.sendMessage(chatId, 
      '⚙️ Settings (Coming Soon)\n\nThese settings will be implemented in a future update.', 
      { reply_markup: keyboard }
    );
  }

  async handleHistory(msg, args) {
    const chatId = msg.chat.id;
    await this.sendMessage(chatId, '📊 Download history feature is coming soon!');
  }

  async handleLocation(msg, args) {
    const chatId = msg.chat.id;
    
    // Get the download path from config
    const downloadPath = config.downloadPath || 'Unknown';
    
    const locationInfo = `
📁 Download Location Information:

🗂️ **Server Download Folder:**
\`${downloadPath}\`

📋 **File Organization:**
• All downloads saved in this folder
• Files named with sanitized video titles
• Audio files: .mp3 extension
• Video files: .mp4 extension

💾 **Large File Handling:**
• Files > 50MB cannot be sent via Telegram
• All files remain on server for access
• Use file manager or FTP to retrieve large files

🔍 **Finding Your Files:**
• Check the download folder on the server
• Files are named based on video title
• Recent downloads appear at the top

⚙️ **Server Access:**
• Contact server administrator for file access
• Files can be downloaded via web interface
• Or use direct server file access methods
    `;

    await this.sendMessage(chatId, locationInfo);
  }

  async handleStats(msg, args) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    // Simple admin check (you can implement proper admin system)
    const adminIds = process.env.TELEGRAM_ADMIN_IDS?.split(',') || [];
    if (!adminIds.includes(userId.toString())) {
      await this.sendMessage(chatId, '❌ This command is only available to administrators.');
      return;
    }

    const uptimeMinutes = Math.floor(process.uptime() / 60);
    const uptimeHours = Math.floor(uptimeMinutes / 60);
    const memoryUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    
    const stats = `
📊 Bot Statistics:

� Active Sessions: ${this.userSessions.size}
🔄 Active Downloads: ${Array.from(this.userSessions.values()).filter(s => s.activeDownload).length}
⏰ Uptime: ${uptimeHours}h ${uptimeMinutes % 60}m
💾 Memory Usage: ${memoryUsage} MB
📅 Current Date: ${this.formatCurrentDate()}
🕒 Current Time: ${new Date().toLocaleTimeString('en-GB', { hour12: false })}
    `;

    await this.sendMessage(chatId, stats);
  }

  async handleUsers(msg, args) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    // Simple admin check
    const adminIds = process.env.TELEGRAM_ADMIN_IDS?.split(',') || [];
    if (!adminIds.includes(userId.toString())) {
      await this.sendMessage(chatId, '❌ This command is only available to administrators.');
      return;
    }

    await this.sendMessage(chatId, '👥 User management feature is coming soon!');
  }

  async handleStatus(msg, args) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const session = this.userSessions.get(userId);
    
    if (!session || !session.activeDownload) {
      await this.sendMessage(chatId, '✅ No active downloads.');
      return;
    }

    const startTime = new Date(session.activeDownload.startTime);
    const status = `
📊 Download Status:

🎬 Video: ${session.activeDownload.title || 'Loading...'}
📈 Progress: ${session.activeDownload.progress || 0}%
⏱️ Status: ${session.activeDownload.status || 'Processing...'}
🕒 Started: ${this.formatDateTime(startTime)}
📺 Quality: ${this.getQualityLabel(session.activeDownload.options?.quality)}
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
    const urlId = this.generateUrlId(url);
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: '🎵 Audio Only (MP3)', callback_data: `dl_audio_best_${urlId}` }
        ],
        [
          { text: '📱 360p', callback_data: `dl_video_360_${urlId}` },
          { text: '📺 480p', callback_data: `dl_video_480_${urlId}` }
        ],
        [
          { text: '🖥️ 720p HD', callback_data: `dl_video_720_${urlId}` },
          { text: '📽️ 1080p FHD', callback_data: `dl_video_1080_${urlId}` }
        ],
        [
          { text: '🎬 1440p 2K', callback_data: `dl_video_1440_${urlId}` },
          { text: '🎭 2160p 4K', callback_data: `dl_video_2160_${urlId}` }
        ],
        [
          { text: '⭐ Best Quality', callback_data: `dl_video_best_${urlId}` },
          { text: '⚡ Fastest', callback_data: `dl_video_worst_${urlId}` }
        ],
        [
          { text: '❌ Cancel', callback_data: 'cancel_download' }
        ]
      ]
    };

    await this.sendMessage(chatId, 
      '🎬 Choose resolution and format:\n\n📱 Mobile: 360p, 480p\n🖥️ Desktop: 720p, 1080p\n🎬 Premium: 2K, 4K\n🎵 Audio: MP3 format', 
      { reply_markup: keyboard }
    );
  }

  async handleQuickDownload(msg, url) {
    const chatId = msg.chat.id;
    const urlId = this.generateUrlId(url);
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: '🎵 Audio', callback_data: `qk_audio_best_${urlId}` },
          { text: '🎬 Video Options', callback_data: `show_video_options_${urlId}` }
        ],
        [
          { text: '🖥️ 720p HD', callback_data: `qk_video_720_${urlId}` },
          { text: '📽️ 1080p FHD', callback_data: `qk_video_1080_${urlId}` }
        ],
        [
          { text: '🎬 1440p 2K', callback_data: `qk_video_1440_${urlId}` },
          { text: '🎭 2160p 4K', callback_data: `qk_video_2160_${urlId}` }
        ],
        [
          { text: '⭐ Best Quality', callback_data: `qk_video_best_${urlId}` }
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
      
      if (!this.downloadService) {
        await this.sendErrorMessage(chatId, 'Download service not available');
        return;
      }
      
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
      const statusMsg = await this.sendMessage(chatId, '🔄 Getting video information...');
      
      // Get video info first for better user experience
      let videoInfo = null;
      if (this.videoInfoService) {
        try {
          videoInfo = await this.videoInfoService.getVideoInfo(url);
          
          if (videoInfo) {
            const infoMessage = `
📺 Video Found!

🎬 ${videoInfo.title}
⏱️ Duration: ${this.formatDuration(videoInfo.duration)}
👁️ Views: ${videoInfo.view_count ? this.formatNumber(videoInfo.view_count) : 'N/A'}
📅 Upload: ${videoInfo.upload_date ? this.formatDate(videoInfo.upload_date) : 'N/A'}

🔄 Starting download...
            `;
            
            await this.editMessage(chatId, statusMsg.message_id, infoMessage);
          }
        } catch (error) {
          logger.warn('Could not get video info:', error.message);
          await this.editMessage(chatId, statusMsg.message_id, '🔄 Starting download...');
        }
      }
      
      // Set up download session
      session.activeDownload = {
        url,
        options,
        startTime: Date.now(),
        progress: 0,
        status: 'initializing',
        messageId: statusMsg.message_id,
        videoInfo
      };

      // Start download using the correct method
      const downloadType = options.format === 'audio' ? 'audio' : 'video';
      const quality = options.quality || 'best';
      
      // Set up progress monitoring
      const progressMonitor = setInterval(() => {
        if (this.downloadService && session.activeDownload) {
          const downloadInfo = this.downloadService.activeDownloads?.get?.(session.activeDownload.downloadId);
          if (downloadInfo) {
            this.updateDownloadProgress(chatId, userId, {
              percent: downloadInfo.progress || 0,
              status: downloadInfo.status || 'downloading'
            });
          }
        }
      }, 2000);
      
      const downloadResult = await this.downloadService.startDownload(url, downloadType, quality);
      
      // Store download ID for progress tracking
      session.activeDownload.downloadId = downloadResult.id;
      
      // Clear progress monitor
      clearInterval(progressMonitor);
      
      // Store additional info in the result
      downloadResult.videoInfo = videoInfo;
      downloadResult.originalQuality = quality; // Store original quality
      downloadResult.quality = quality;
      downloadResult.url = url;
      
      // Handle download completion
      await this.handleDownloadComplete(chatId, userId, downloadResult);

    } catch (error) {
      logger.error('Download error:', error);
      await this.sendErrorMessage(chatId, 'Failed to start download. Please try again.');
      
      // Clear session on error
      const session = this.userSessions.get(chatId);
      if (session) {
        session.activeDownload = null;
      }
    }
  }

  // Helper method to format numbers
  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  // Helper method to format upload date
  formatDate(dateString) {
    if (!dateString) return 'Unknown';
    
    try {
      // YouTube date format is usually YYYYMMDD
      const year = dateString.substring(0, 4);
      const month = dateString.substring(4, 6);
      const day = dateString.substring(6, 8);
      
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-GB', { 
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      }); // DD/MM/YYYY format
    } catch (error) {
      return dateString;
    }
  }

  // Helper method to format current date in DD/MM/YYYY
  formatCurrentDate(date = new Date()) {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // Helper method to format date and time in DD/MM/YYYY HH:MM
  formatDateTime(date = new Date()) {
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  async updateDownloadProgress(chatId, userId, progress) {
    const session = this.userSessions.get(userId);
    if (!session || !session.activeDownload) return;

    session.activeDownload.progress = progress.percent || 0;
    session.activeDownload.status = progress.status || 'downloading';

    // Update message every 20% or significant status change
    const currentPercent = Math.round(progress.percent || 0);
    const shouldUpdate = currentPercent % 20 === 0 || 
                        progress.status !== session.lastStatus ||
                        currentPercent === 100;

    if (shouldUpdate) {
      const videoInfo = session.activeDownload.videoInfo;
      const title = videoInfo?.title || 'Video';
      const duration = videoInfo?.duration ? this.formatDuration(videoInfo.duration) : 'Unknown';
      
      // Calculate estimated download size based on quality and duration
      const estimatedSize = this.estimateDownloadSize(
        session.activeDownload.options?.quality, 
        videoInfo?.duration,
        session.activeDownload.options?.format
      );
      
      const downloadedAmount = estimatedSize ? 
        this.formatFileSize((estimatedSize * currentPercent) / 100) : 
        'Calculating...';
      
      const progressText = `
🔄 Downloading...

🎬 ${title}
⏱️ Duration: ${duration}
📊 Progress: ${currentPercent}%
📦 Downloaded: ${downloadedAmount}
📈 Estimated Size: ${estimatedSize ? this.formatFileSize(estimatedSize) : 'Calculating...'}
📺 Quality: ${this.getQualityLabel(session.activeDownload.options?.originalQuality || session.activeDownload.options?.quality)}
⚡ Status: ${progress.status || 'Processing...'}

Please wait... 🎵
      `;

      await this.editMessage(chatId, session.activeDownload.messageId, progressText);
      session.lastStatus = progress.status;
    }
  }

  // Helper method to estimate download size based on quality and duration
  estimateDownloadSize(quality, duration, format) {
    if (!duration || !quality) return null;
    
    // Estimated bitrates in kbps (kilobits per second)
    const bitrates = {
      // Video bitrates (includes audio)
      '360': format === 'audio' ? 128 : 800,   // 800 kbps for 360p video
      '480': format === 'audio' ? 128 : 1200,  // 1.2 Mbps for 480p video
      '720': format === 'audio' ? 128 : 2500,  // 2.5 Mbps for 720p video
      '1080': format === 'audio' ? 128 : 4000, // 4 Mbps for 1080p video
      '1440': format === 'audio' ? 128 : 8000, // 8 Mbps for 1440p video
      '2160': format === 'audio' ? 128 : 15000, // 15 Mbps for 4K video
      'best': format === 'audio' ? 128 : 4000,
      'worst': format === 'audio' ? 128 : 800
    };
    
    // Audio-only bitrate
    if (format === 'audio') {
      const audioBitrate = 128; // 128 kbps for MP3
      return Math.round((audioBitrate * duration) / 8 * 1000); // Convert to bytes
    }
    
    const bitrate = bitrates[quality] || 2500;
    return Math.round((bitrate * duration) / 8 * 1000); // Convert kbps to bytes
  }

  async handleDownloadComplete(chatId, userId, result) {
    const session = this.userSessions.get(userId);
    if (!session) return;

    // Clear active download
    session.activeDownload = null;

    try {
      // Get file information if available
      let fileSize = 'Unknown';
      let duration = 'Unknown';
      let filename = result.filename || 'Downloaded';
      let title = result.title || 'Video';

      // Use video info if available from the session or result
      const videoInfo = result.videoInfo || session.activeDownload?.videoInfo;
      if (videoInfo) {
        title = videoInfo.title || title;
        if (videoInfo.duration) {
          duration = this.formatDuration(videoInfo.duration);
        }
      }

      // Try to get file stats if outputPath is available
      if (result.outputPath) {
        try {
          const fs = await import('fs');
          const path = await import('path');
          
          if (fs.existsSync(result.outputPath)) {
            const stats = fs.statSync(result.outputPath);
            fileSize = this.formatFileSize(stats.size);
            filename = path.basename(result.outputPath);
          }
        } catch (error) {
          logger.warn('Could not get file stats:', error.message);
        }
      }

      // If we still don't have duration, try to get it from video info service
      if (duration === 'Unknown' && this.videoInfoService && result.url) {
        try {
          const videoInfo = await this.videoInfoService.getVideoInfo(result.url);
          if (videoInfo && videoInfo.duration) {
            duration = this.formatDuration(videoInfo.duration);
          }
        } catch (error) {
          logger.warn('Could not get video duration:', error.message);
        }
      }

      // Send completion message with proper formatting
      const completionMessage = `
✅ Download Complete!

🎬 ${title}
📁 File: ${filename}
📊 Size: ${fileSize}
⏱️ Duration: ${duration}
📺 Quality: ${this.getQualityLabel(result.originalQuality || result.quality)}

Your file is ready! 🎉
      `;

      await this.sendMessage(chatId, completionMessage);

      // Add file location info for large files
      if (fileSize !== 'Unknown' && this.isLargeFile(fileSize)) {
        const locationMessage = `
⚠️ **Large File Notice:**

This file (${fileSize}) is too large to send via Telegram (50MB limit).

📁 **File Location:**
\`${config.downloadPath}\`

📋 **File Name:**
\`${filename}\`

💡 **How to Access:**
• Use server file manager
• Download via web interface
• Contact administrator for access
• Use /location command for more info
        `;
        
        await this.sendMessage(chatId, locationMessage);
      } else if (result.outputPath && fileSize !== 'Unknown') {
        // For smaller files, show they're available for download
        await this.sendMessage(chatId, 
          `📤 File is small enough to send via Telegram!\n` +
          `💾 Also saved on server: \`${config.downloadPath}\``
        );
      }

    } catch (error) {
      logger.error('Error in download completion handler:', error);
      await this.sendMessage(chatId, '✅ Download completed successfully!');
    }
  }

  // Helper method to check if file is too large for Telegram
  isLargeFile(fileSizeString) {
    try {
      const match = fileSizeString.match(/^([\d.]+)\s*(MB|GB)$/);
      if (!match) return false;
      
      const size = parseFloat(match[1]);
      const unit = match[2];
      
      if (unit === 'GB') return true;
      if (unit === 'MB' && size > 50) return true;
      
      return false;
    } catch (error) {
      return false;
    }
  }

  // Helper method to format file size
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Helper method to format duration
  formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return 'Unknown';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }

  // Helper method to get quality label
  getQualityLabel(quality) {
    const qualityLabels = {
      'worst[height<=360]': '360p (Mobile)',
      'worst[height<=480]': '480p (Mobile)', 
      'best[height<=720]': '720p HD',
      'best[height<=1080]': '1080p FHD',
      'best[height<=1440]': '1440p 2K',
      'best[height<=2160]': '2160p 4K',
      'best': 'Best Available',
      'worst': 'Fastest Download',
      // Handle the mapped qualities from our system
      '360': '360p (Mobile)',
      '480': '480p (Mobile)',
      '720': '720p HD', 
      '1080': '1080p FHD',
      '1440': '1440p 2K',
      '2160': '2160p 4K'
    };
    
    return qualityLabels[quality] || quality || 'Standard';
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
      if (data.startsWith('dl_')) {
        await this.handleDownloadCallback(chatId, data);
      } else if (data.startsWith('qk_')) {
        await this.handleQuickCallback(chatId, data);
      } else if (data.startsWith('show_video_options_')) {
        await this.handleShowVideoOptions(chatId, data);
      } else {
        await this.handleGenericCallback(chatId, data);
      }

    } catch (error) {
      logger.error('Callback query error:', error);
    }
  }

  // Handle "Video Options" button - shows all resolutions
  async handleShowVideoOptions(chatId, data) {
    const urlId = data.replace('show_video_options_', '');
    const url = this.getUrlFromId(urlId);
    
    if (!url) {
      await this.sendMessage(chatId, '❌ Download link expired. Please send the URL again.');
      return;
    }

    // Show full resolution menu
    await this.showDownloadOptions(chatId, url);
  }

  async handleDownloadCallback(chatId, data) {
    const parts = data.split('_');
    const action = parts[0]; // 'dl'
    const format = parts[1]; // 'audio' or 'video'
    const quality = parts[2]; // resolution or 'best'/'worst'
    const urlId = parts[3]; // short URL ID
    
    const url = this.getUrlFromId(urlId);
    if (!url) {
      await this.sendMessage(chatId, '❌ Download link expired. Please send the URL again.');
      return;
    }
    
    const options = {
      format: format === 'audio' ? 'audio' : 'video',
      originalQuality: quality, // Store original for display
      quality: this.mapQualityToYoutubeDl(quality)
    };

    await this.startDownload(chatId, url, options);
  }

  async handleQuickCallback(chatId, data) {
    const parts = data.split('_');
    const action = parts[0]; // 'qk'
    const format = parts[1]; // 'audio' or 'video'
    const quality = parts[2]; // resolution or 'best'/'worst'
    const urlId = parts[3]; // short URL ID
    
    const url = this.getUrlFromId(urlId);
    if (!url) {
      await this.sendMessage(chatId, '❌ Download link expired. Please send the URL again.');
      return;
    }
    
    const options = {
      format: format === 'audio' ? 'audio' : 'video',
      originalQuality: quality, // Store original for display
      quality: this.mapQualityToYoutubeDl(quality)
    };

    await this.startDownload(chatId, url, options);
  }

  // Map resolution to youtube-dl format
  mapQualityToYoutubeDl(quality) {
    const qualityMap = {
      '360': 'worst[height<=360]',
      '480': 'worst[height<=480]',
      '720': 'best[height<=720]',
      '1080': 'best[height<=1080]',
      '1440': 'best[height<=1440]',
      '2160': 'best[height<=2160]',
      'best': 'best',
      'worst': 'worst'
    };
    
    return qualityMap[quality] || 'best';
  }

  async handleGenericCallback(chatId, data) {
    switch (data) {
      case 'help':
        await this.sendMessage(chatId, this.getHelpMessage());
        break;
      case 'resolutions':
        await this.handleResolutionsCallback(chatId);
        break;
      case 'settings':
        await this.sendMessage(chatId, '⚙️ Settings feature coming soon!');
        break;
      case 'cancel_download':
        await this.sendMessage(chatId, '❌ Download cancelled.');
        break;
      default:
        await this.sendMessage(chatId, 'Unknown action.');
    }
  }

  async handleResolutionsCallback(chatId) {
    const resolutionInfo = `
📺 Available Video Resolutions:

📱 **Mobile Quality:**
• 360p - Small file, fast download
• 480p - Standard mobile quality

🖥️ **Desktop Quality:**
• 720p HD - High definition
• 1080p FHD - Full high definition

🎬 **Premium Quality:**
• 1440p 2K - Ultra high definition
• 2160p 4K - Maximum quality

⚡ **Special Options:**
• Best Quality - Highest available
• Fastest - Lowest quality, quick download

🎵 **Audio Only:**
• MP3 format - Audio extraction

💡 **Usage Tips:**
• Higher resolutions = larger files
• 4K videos may take longer to process
• Audio-only is perfect for music
• Use /download [URL] to choose resolution
    `;

    await this.sendMessage(chatId, resolutionInfo);
  }

  getHelpMessage() {
    return `
📖 Available Commands:

🎬 Download Commands:
/download [URL] - Download with resolution options
/audio [URL] - Download audio only (MP3)
/video [URL] - Download video (best quality)
/playlist [URL] - Download entire playlist
/resolutions - Show available video resolutions

⚙️ User Commands:
/settings - Configure preferences
/history - View download history
/cancel - Cancel current download
/status - Check bot status
/location - Show download folder location

📊 Info Commands:
/help - Show this help message
/start - Welcome message

📺 Available Resolutions:
• 360p, 480p (Mobile)
• 720p HD, 1080p FHD (Desktop)
• 1440p 2K, 2160p 4K (Premium)
• Best Quality, Fastest Download

💡 Tips:
• Send YouTube URLs directly for quick options
• Use /download for full resolution selection
• Higher resolutions = larger file sizes
• Audio-only perfect for music downloads
• Large files saved on server (use /location)
    `;
  }

  // Helper methods
  isYouTubeUrl(url) {
    return isValidYouTubeUrl(url);
  }

  async sendMessage(chatId, text, options = {}) {
    try {
      return await this.bot.sendMessage(chatId, text, {
        parse_mode: undefined, // Remove HTML parsing to avoid entity issues
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
      download: 'Download YouTube video with resolution options',
      audio: 'Download audio only (MP3)',
      video: 'Download video with best quality',
      playlist: 'Download entire playlist',
      resolutions: 'Show available video resolutions',
      status: 'Check current download status',
      cancel: 'Cancel active download',
      settings: 'Configure user preferences',
      history: 'View download history',
      location: 'Show server download folder location',
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
      playlist: '/playlist [YouTube URL]',
      resolutions: '/resolutions'
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

// Export the class, not a singleton instance
export { TelegramBotService };