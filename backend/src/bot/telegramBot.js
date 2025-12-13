import TelegramBot from 'node-telegram-bot-api';
import { config } from '../config/index.js';
import fs from 'fs';

export class TelegramBotService {
  constructor(downloadService, videoInfoService) {
    this.downloadService = downloadService;
    this.videoInfoService = videoInfoService;
    this.bot = null;
    this.userDownloads = new Map();
    this.urlCache = new Map(); // Store URLs with short IDs
    this.urlIdCounter = 0;
    this.lastErrorTime = null;
    this.userHistory = new Map(); // Store download history per user
    this.userSettings = new Map(); // Store user settings
    this.pendingSplits = new Map(); // Store files pending split decision
    this.userFavorites = new Map(); // Store user favorites
    this.downloadQueue = new Map(); // Store download queue per user
    this.adminUsers = [
      5943799825  // Your Telegram user ID
      // Add more admin IDs here: 123456789, 987654321
    ];
    this.allUsers = new Set(); // Track all users
    this.customFilenames = new Map(); // Store custom filenames
    this.batchDownloads = new Map(); // Store batch download requests
    this.scheduledDownloads = new Map(); // Store scheduled downloads
    this.userPresets = new Map(); // Store user quality presets
    this.trimSettings = new Map(); // Store video trim settings
  }

  getDefaultSettings() {
    return {
      autoDelete: false,
      defaultQuality: 'best',
      notifications: true
    };
  }

  // Sanitize text for UTF-8 encoding (remove problematic characters)
  sanitizeText(text) {
    if (!text) return '';
    
    // Remove or replace problematic characters that cause UTF-8 encoding issues
    return text
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/[\uD800-\uDFFF]/g, '') // Remove unpaired surrogates
      .replace(/[\uFFFD\uFFFE\uFFFF]/g, '') // Remove replacement characters
      .replace(/[^\u0020-\u007E\u00A0-\uD7FF\uE000-\uFFFD]/g, '') // Keep only valid UTF-8 ranges
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  initialize() {
    if (!config.telegramBotToken) {
      console.warn('⚠️  Telegram bot token not configured. Bot will not start.');
      return;
    }

    try {
      this.bot = new TelegramBot(config.telegramBotToken, { 
        polling: {
          interval: 3000,
          autoStart: true,
          params: {
            timeout: 30
          }
        },
        request: {
          agentOptions: {
            keepAlive: true,
            family: 4 // Force IPv4 to avoid DNS issues
          },
          timeout: 30000
        },
        filepath: false
      });
      
      // Set bot commands for Telegram menu
      this.bot.setMyCommands([
        { command: 'start', description: 'Start the bot' },
        { command: 'help', description: 'Show all commands' },
        { command: 'search', description: 'Search videos' },
        { command: 'trending', description: 'View trending videos' },
        { command: 'formats', description: 'Show available formats' },
        { command: 'dl', description: 'Quick download (url quality)' },
        { command: 'info', description: 'Get video details' },
        { command: 'batch', description: 'Batch download multiple URLs' },
        { command: 'playlist', description: 'Download playlist' },
        { command: 'trim', description: 'Download with time range' },
        { command: 'preset', description: 'Save quality preset' },
        { command: 'favorites', description: 'View favorites' },
        { command: 'addfav', description: 'Add to favorites' },
        { command: 'queue', description: 'View download queue' },
        { command: 'addqueue', description: 'Add to queue' },
        { command: 'startqueue', description: 'Start queue download' },
        { command: 'history', description: 'View download history' },
        { command: 'stats', description: 'View statistics' },
        { command: 'settings', description: 'Bot settings' },
        { command: 'cancel', description: 'Cancel current download' }
      ]).then(() => {
        console.log('✅ Bot commands registered in Telegram menu');
      }).catch(err => {
        console.error('Failed to set bot commands:', err);
      });
      
      // Handle polling errors gracefully
      this.bot.on('polling_error', (error) => {
        // Only log network errors once to avoid spam
        if (error.code === 'EFATAL' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT' || error.code === 'EAI_AGAIN') {
          if (!this.lastErrorTime || Date.now() - this.lastErrorTime > 60000) {
            console.error('⚠️  Telegram connection issue:', error.code);
            console.log('💡 The bot will automatically reconnect...');
            this.lastErrorTime = Date.now();
          }
          // Don't throw - let polling continue
          return;
        } else if (error.message && error.message.includes('409')) {
          console.error('⚠️  Another bot instance is running. Please stop other instances.');
        } else {
          console.error('⚠️  Telegram error:', error.message);
        }
      });
      
      this.setupHandlers();
      console.log('🤖 Telegram bot initialized successfully');
      console.log('🔄 Connecting to Telegram...');
    } catch (error) {
      console.error('Failed to initialize Telegram bot:', error.message);
    }
  }

  setupHandlers() {
    // Start command
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      const username = msg.from.first_name || 'there';
      
      this.bot.sendMessage(chatId, 
        `🎬 StreamedV3 Bot\n` +
        `========================\n\n` +
        `👋 Hey ${username}! Welcome aboard!\n\n` +
        `🎯 What I Can Do:\n` +
        `------------------------\n` +
        `📥 Download videos in any quality\n` +
        `🎵 Extract audio from videos\n` +
        `📝 Download subtitles\n` +
        `🔍 Search and discover videos\n` +
        `⭐ Save your favorites\n` +
        `📋 Queue multiple downloads\n` +
        `✂️ Split large files automatically\n\n` +
        `🚀 Quick Start:\n` +
        `------------------------\n` +
        `1️⃣ Send me any video URL\n` +
        `2️⃣ Choose your quality\n` +
        `3️⃣ Get your file!\n\n` +
        `💡 Type /help to see all commands\n` +
        `🔥 Try /trending for popular videos`
      );
    });

    // Help command
    this.bot.onText(/\/help/, (msg) => {
      const chatId = msg.chat.id;
      this.bot.sendMessage(chatId,
        `📖 COMMAND GUIDE\n` +
        `========================\n\n` +
        
        `🎯 BASIC COMMANDS\n` +
        `• /info <url> - Video details\n` +
        `• /search <query> - Search videos\n` +
        `• /formats <url> - Available formats\n` +
        `• /cancel - Cancel download\n\n` +
        
        `⚡ QUICK DOWNLOAD\n` +
        `• /dl <url> <quality>\n` +
        `  💡 Example: /dl https://... 720\n\n` +
        
        `🆕 NEW FEATURES\n` +
        `• /batch - Download multiple URLs\n` +
        `• /playlist <url> - Download playlist\n` +
        `• /trim <url> <start> <end> - Trim video\n` +
        `• /preset - Save quality presets\n` +
        `• /quick - Quick actions menu\n\n` +
        
        `⭐ FAVORITES\n` +
        `• /favorites - View saved\n` +
        `• /addfav <url> - Add favorite\n\n` +
        
        `📋 QUEUE SYSTEM\n` +
        `• /queue - View queue\n` +
        `• /addqueue <url> - Add to queue\n` +
        `• /startqueue - Start downloads\n\n` +
        
        `📊 HISTORY & STATS\n` +
        `• /history - Recent downloads\n` +
        `• /stats - Your statistics\n` +
        `• /clear - Clear history\n\n` +
        
        `🔥 DISCOVER\n` +
        `• /trending - Popular videos\n\n` +
        
        `⚙️ SETTINGS\n` +
        `• /settings - Configure bot\n` +
        `• /rename <name> - Custom filename\n` +
        `• /about - Bot info\n\n` +
        
        `========================\n` +
        `💡 TIP: Just send a video URL\n` +
        `   to start downloading!`
      );
    });

    // Search command
    this.bot.onText(/\/search (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const query = match[1];
      
      try {
        const statusMsg = await this.bot.sendMessage(chatId, `🔍 Searching for: "${query}"...`);
        
        const youtubedl = (await import('youtube-dl-exec')).default;
        const results = await youtubedl(query, {
          dumpSingleJson: true,
          defaultSearch: 'ytsearch5',
          noCheckCertificates: true,
          noWarnings: true
        });
        
        if (results.entries && results.entries.length > 0) {
          const buttons = results.entries.map((video, idx) => {
            const urlId = this.urlIdCounter++;
            this.urlCache.set(urlId, { url: video.webpage_url, info: video });
            
            // Sanitize title for UTF-8 encoding
            const sanitizedTitle = this.sanitizeText(video.title || 'Untitled');
            const truncatedTitle = sanitizedTitle.substring(0, 50);
            
            return [{
              text: `${idx + 1}. ${truncatedTitle}${sanitizedTitle.length > 50 ? '...' : ''}`,
              callback_data: `search:${urlId}`
            }];
          });
          
          await this.bot.editMessageText(
            `🔍 Search results for: "${query}"\n\nSelect a video:`,
            {
              chat_id: chatId,
              message_id: statusMsg.message_id,
              reply_markup: { inline_keyboard: buttons }
            }
          );
        } else {
          await this.bot.editMessageText(
            `❌ No results found for: "${query}"`,
            {
              chat_id: chatId,
              message_id: statusMsg.message_id
            }
          );
        }
      } catch (error) {
        this.bot.sendMessage(chatId, `❌ Search failed: ${error.message}`);
      }
    });

    // Settings command
    this.bot.onText(/\/settings/, (msg) => {
      const chatId = msg.chat.id;
      const settings = this.userSettings.get(chatId) || this.getDefaultSettings();
      
      this.bot.sendMessage(chatId,
        `⚙️ *Bot Settings:*\n\n` +
        `Auto-delete files: ${settings.autoDelete ? '✅' : '❌'}\n` +
        `Default quality: ${settings.defaultQuality}\n` +
        `Notifications: ${settings.notifications ? '✅' : '❌'}\n\n` +
        `Use buttons below to change settings:`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: settings.autoDelete ? '✅ Auto-delete ON' : '❌ Auto-delete OFF', callback_data: 'setting:autodelete' }
              ],
              [
                { text: '🎬 Default: Best', callback_data: 'setting:quality:best' },
                { text: '🎬 Default: 1080p', callback_data: 'setting:quality:1080' }
              ],
              [
                { text: settings.notifications ? '🔔 Notifications ON' : '🔕 Notifications OFF', callback_data: 'setting:notifications' }
              ]
            ]
          }
        }
      );
    });

    // About command
    this.bot.onText(/\/about/, (msg) => {
      const chatId = msg.chat.id;
      this.bot.sendMessage(chatId,
        `🤖 ABOUT STREAMEDV3\n` +
        `===========================\n\n` +
        
        `✨ FEATURES\n` +
        `========================\n` +
        `📥 Multi-platform video downloads\n` +
        `🎵 High-quality audio extraction\n` +
        `📝 Subtitle downloads\n` +
        `� Smatrt search & discovery\n` +
        `� Dmownload history tracking\n` +
        `✂️ Automatic file splitting\n` +
        `⭐ Favorites management\n` +
        `📋 Queue system\n` +
        `⚙️ Customizable settings\n\n` +
        
        `🎯 QUALITY OPTIONS\n` +
        `========================\n` +
        `🎬 360p, 480p, 720p, 1080p\n` +
        `�  Audio: Best & Medium\n\n` +
        
        `⚡ POWERED BY\n` +
        `========================\n` +
        `🔧 yt-dlp (Latest)\n` +
        `🎬 FFmpeg (Video processing)\n` +
        `⚡ Node.js (Backend)\n\n` +
        
        `📊 STATS\n` +
        `========================\n` +
        `🚀 Version: 1.0.0\n` +
        `� Platiform: Telegram\n` +
        `🌐 Multi-platform support\n\n` +
        
        `💡 Type /help for all commands`
      );
    });

    // Quick download command
    this.bot.onText(/\/dl (.+) (\w+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const url = match[1];
      const quality = match[2];
      
      try {
        const statusMsg = await this.bot.sendMessage(chatId, '🚀 Quick download starting...');
        const info = await this.videoInfoService.getVideoInfo(url);
        
        await this.startDownload(chatId, statusMsg.message_id, url, 'video', quality, info);
      } catch (error) {
        this.bot.sendMessage(chatId, `❌ Error: ${error.message}`);
      }
    });

    // Favorites command
    this.bot.onText(/\/favorites/, (msg) => {
      const chatId = msg.chat.id;
      const favorites = this.userFavorites.get(chatId) || [];
      
      if (favorites.length === 0) {
        this.bot.sendMessage(chatId, '⭐ No favorites yet.\n\nUse /addfav <url> to add favorites!');
        return;
      }
      
      const favText = favorites.map((fav, idx) => 
        `${idx + 1}. ${fav.title.substring(0, 40)}...\n   ${fav.url}`
      ).join('\n\n');
      
      this.bot.sendMessage(chatId, `⭐ Your Favorites:\n\n${favText}`);
    });

    // Add favorite command
    this.bot.onText(/\/addfav (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const url = match[1];
      
      try {
        const info = await this.videoInfoService.getVideoInfo(url);
        
        if (!this.userFavorites.has(chatId)) {
          this.userFavorites.set(chatId, []);
        }
        
        const favorites = this.userFavorites.get(chatId);
        favorites.push({ url, title: info.title, date: new Date() });
        
        this.bot.sendMessage(chatId, `⭐ Added to favorites!\n\n${info.title}`);
      } catch (error) {
        this.bot.sendMessage(chatId, `❌ Error: ${error.message}`);
      }
    });

    // Queue command
    this.bot.onText(/\/queue/, (msg) => {
      const chatId = msg.chat.id;
      const queue = this.downloadQueue.get(chatId) || [];
      
      if (queue.length === 0) {
        this.bot.sendMessage(chatId, '📋 Queue is empty.\n\nUse /addqueue <url> to add videos!');
        return;
      }
      
      const queueText = queue.map((item, idx) => 
        `${idx + 1}. ${item.title.substring(0, 40)}...`
      ).join('\n');
      
      this.bot.sendMessage(chatId, `📋 Download Queue (${queue.length}):\n\n${queueText}`);
    });

    // Add to queue command
    this.bot.onText(/\/addqueue (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const url = match[1];
      
      try {
        const info = await this.videoInfoService.getVideoInfo(url);
        
        if (!this.downloadQueue.has(chatId)) {
          this.downloadQueue.set(chatId, []);
        }
        
        const queue = this.downloadQueue.get(chatId);
        queue.push({ url, title: info.title, quality: '720' });
        
        this.bot.sendMessage(chatId, `📋 Added to queue!\n\n${info.title}\n\nUse /startqueue to begin downloading`);
      } catch (error) {
        this.bot.sendMessage(chatId, `❌ Error: ${error.message}`);
      }
    });

    // Start queue command
    this.bot.onText(/\/startqueue/, async (msg) => {
      const chatId = msg.chat.id;
      const queue = this.downloadQueue.get(chatId) || [];
      
      if (queue.length === 0) {
        this.bot.sendMessage(chatId, '📋 Queue is empty!');
        return;
      }
      
      this.bot.sendMessage(chatId, `🚀 Starting queue download (${queue.length} videos)...`);
      
      for (const item of queue) {
        try {
          const statusMsg = await this.bot.sendMessage(chatId, `⏬ Downloading: ${item.title.substring(0, 40)}...`);
          const info = await this.videoInfoService.getVideoInfo(item.url);
          await this.startDownload(chatId, statusMsg.message_id, item.url, 'video', item.quality, info);
        } catch (error) {
          this.bot.sendMessage(chatId, `❌ Failed: ${item.title}\n${error.message}`);
        }
      }
      
      this.downloadQueue.set(chatId, []);
      this.bot.sendMessage(chatId, '✅ Queue completed!');
    });

    // Formats command
    this.bot.onText(/\/formats (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const url = match[1];
      
      try {
        const statusMsg = await this.bot.sendMessage(chatId, '🔍 Fetching available formats...');
        
        // Get detailed format info using youtube-dl
        const youtubedl = (await import('youtube-dl-exec')).default;
        const info = await youtubedl(url, {
          dumpSingleJson: true,
          noCheckCertificates: true,
          noWarnings: true
        });
        
        // Extract video formats
        const formats = info.formats || [];
        const videoFormats = formats
          .filter(f => f.vcodec !== 'none' && f.height)
          .sort((a, b) => b.height - a.height)
          .slice(0, 10);
        
        if (videoFormats.length === 0) {
          await this.bot.editMessageText(
            `📹 *${info.title}*\n\n` +
            `No detailed format information available.\n\n` +
            `Available qualities:\n` +
            `• 4K (2160p)\n` +
            `• 2K (1440p)\n` +
            `• 1080p\n` +
            `• 720p\n` +
            `• 480p\n` +
            `• 360p`,
            {
              chat_id: chatId,
              message_id: statusMsg.message_id,
              parse_mode: 'Markdown'
            }
          );
          return;
        }
        
        const formatText = videoFormats.map(f => {
          const size = f.filesize ? this.formatBytes(f.filesize) : 'Unknown';
          const fps = f.fps ? `${f.fps}fps` : '';
          return `• ${f.height}p ${fps} - ${f.ext.toUpperCase()} - ${size}`;
        }).join('\n');
        
        await this.bot.editMessageText(
          `📹 *${info.title}*\n\n` +
          `⏱️ Duration: ${this.formatDuration(info.duration || 0)}\n\n` +
          `Available formats:\n\n${formatText}`,
          {
            chat_id: chatId,
            message_id: statusMsg.message_id,
            parse_mode: 'Markdown'
          }
        );
      } catch (error) {
        console.error('Formats error:', error);
        this.bot.sendMessage(chatId, `❌ Error: ${error.message}`);
      }
    });

    // History command
    this.bot.onText(/\/history/, (msg) => {
      const chatId = msg.chat.id;
      const history = this.userHistory.get(chatId) || [];
      
      if (history.length === 0) {
        this.bot.sendMessage(chatId, '📭 No download history yet.\n\nStart by sending me a video URL!');
        return;
      }
      
      const historyText = history.slice(-10).reverse().map((item) => {
        const status = item.status === 'completed' ? '✅' : '❌';
        const date = new Date(item.date).toLocaleDateString();
        return `${status} ${item.title.substring(0, 40)}...\n   ${item.type} • ${item.quality} • ${date}`;
      }).join('\n\n');
      
      this.bot.sendMessage(chatId, `📚 Your Recent Downloads (Last 10):\n\n${historyText}`);
    });

    // Stats command
    this.bot.onText(/\/stats/, (msg) => {
      const chatId = msg.chat.id;
      const history = this.userHistory.get(chatId) || [];
      
      if (history.length === 0) {
        this.bot.sendMessage(chatId, 
          `📊 STATISTICS\n` +
          `=======================\n\n` +
          `📭 No downloads yet!\n\n` +
          `� Send a lvideo URL to start`
        );
        return;
      }
      
      const completed = history.filter(h => h.status === 'completed').length;
      const failed = history.filter(h => h.status === 'failed').length;
      const videos = history.filter(h => h.type === 'video').length;
      const audios = history.filter(h => h.type === 'audio').length;
      const successRate = history.length > 0 ? Math.round((completed / history.length) * 100) : 0;
      
      this.bot.sendMessage(chatId,
        `📊 YOUR STATS\n` +
        `=======================\n\n` +
        
        `📈 OVERVIEW\n` +
        `====================\n` +
        `� Total DWownloads: ${history.length}\n` +
        `✅ Completed: ${completed}\n` +
        `❌ Failed: ${failed}\n` +
        `🎯 Success Rate: ${successRate}%\n\n` +
        
        `�  BY TYPE\n` +
        `====================\n` +
        `� VideYos: ${videos}\n` +
        `🎵 Audios: ${audios}\n\n` +
        
        `💡 Keep downloading!`
      );
    });

    // Clear history command
    this.bot.onText(/\/clear/, (msg) => {
      const chatId = msg.chat.id;
      this.userHistory.delete(chatId);
      this.bot.sendMessage(chatId, '🗑️ History cleared!');
    });

    // Playlist command
    this.bot.onText(/\/playlist (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const url = match[1];
      
      await this.bot.sendMessage(chatId, 
        '🎬 Playlist detected!\n\n' +
        '⚠️ Note: Playlist downloads may take a long time.\n' +
        'Each video will be processed separately.\n\n' +
        'Feature coming soon! For now, send individual video URLs.'
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
          `👤 Channel: ${this.getUploader(info)}\n` +
          `⏱️ Duration: ${this.formatDuration(info.duration || 0)}\n` +
          `👁️ Views: ${this.formatNumber(info.viewCount || info.view_count || 0)}\n` +
          `📅 Upload: ${this.formatUploadDate(info.uploadDate || info.upload_date)}\n\n` +
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

    // Trending command
    this.bot.onText(/\/trending/, async (msg) => {
      const chatId = msg.chat.id;
      
      try {
        const statusMsg = await this.bot.sendMessage(chatId, '🔥 Fetching trending videos...');
        const trending = await this.videoInfoService.getTrendingVideos(10);
        
        if (trending.length === 0) {
          await this.bot.editMessageText('No trending videos found.', {
            chat_id: chatId,
            message_id: statusMsg.message_id
          });
          return;
        }
        
        const buttons = trending.map((video, idx) => {
          const urlId = this.urlIdCounter++;
          this.urlCache.set(urlId, { url: video.url, info: video });
          
          // Sanitize title for UTF-8 encoding
          const sanitizedTitle = this.sanitizeText(video.title || 'Untitled');
          const truncatedTitle = sanitizedTitle.substring(0, 50);
          
          return [{
            text: `${idx + 1}. ${truncatedTitle}${sanitizedTitle.length > 50 ? '...' : ''}`,
            callback_data: `search:${urlId}`
          }];
        });
        
        await this.bot.editMessageText(
          '🔥 Trending Videos:\n\nSelect a video to download:',
          {
            chat_id: chatId,
            message_id: statusMsg.message_id,
            reply_markup: { inline_keyboard: buttons }
          }
        );
      } catch (error) {
        console.error('Trending command error:', error);
        this.bot.sendMessage(chatId, `❌ Error fetching trending videos: ${error.message}`);
      }
    });

    // Rename command
    this.bot.onText(/\/rename (.+)/, (msg, match) => {
      const chatId = msg.chat.id;
      const filename = match[1];
      
      this.customFilenames.set(chatId, filename);
      this.bot.sendMessage(chatId, `✅ Next download will be saved as:\n${filename}\n\nNow send the video URL.`);
    });

    // Batch download command
    this.bot.onText(/\/batch/, async (msg) => {
      const chatId = msg.chat.id;
      
      this.bot.sendMessage(chatId,
        `📦 Batch Download Mode\n\n` +
        `Send multiple video URLs (one per line)\n` +
        `Example:\n` +
        `https://youtube.com/watch?v=xxx\n` +
        `https://youtube.com/watch?v=yyy\n` +
        `https://youtube.com/watch?v=zzz\n\n` +
        `💡 I'll download all of them with your default quality setting.\n\n` +
        `Send the URLs now:`
      );
      
      this.batchDownloads.set(chatId, { waiting: true, urls: [] });
    });

    // Playlist download command
    this.bot.onText(/\/playlist (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const url = match[1];
      
      try {
        const statusMsg = await this.bot.sendMessage(chatId, '🎬 Analyzing playlist...');
        
        const youtubedl = (await import('youtube-dl-exec')).default;
        const playlistInfo = await youtubedl(url, {
          dumpSingleJson: true,
          flatPlaylist: true,
          noCheckCertificates: true,
          noWarnings: true
        });
        
        if (!playlistInfo.entries || playlistInfo.entries.length === 0) {
          await this.bot.editMessageText(
            `❌ No videos found in playlist`,
            {
              chat_id: chatId,
              message_id: statusMsg.message_id
            }
          );
          return;
        }
        
        const videoCount = playlistInfo.entries.length;
        const playlistTitle = playlistInfo.title || 'Playlist';
        
        await this.bot.editMessageText(
          `🎬 Playlist Found!\n\n` +
          `📝 ${playlistTitle}\n` +
          `📊 Videos: ${videoCount}\n\n` +
          `⚠️ This will download ${videoCount} videos.\n` +
          `Estimated time: ${Math.ceil(videoCount * 2)} minutes\n\n` +
          `Choose an option:`,
          {
            chat_id: chatId,
            message_id: statusMsg.message_id,
            reply_markup: {
              inline_keyboard: [
                [
                  { text: `✅ Download All (${videoCount})`, callback_data: `playlist:all:${url}` }
                ],
                [
                  { text: '🔢 Select Videos', callback_data: `playlist:select:${url}` }
                ],
                [
                  { text: '❌ Cancel', callback_data: 'playlist:cancel' }
                ]
              ]
            }
          }
        );
      } catch (error) {
        this.bot.sendMessage(chatId, `❌ Error: ${error.message}`);
      }
    });

    // Trim/Time range download command
    this.bot.onText(/\/trim (.+) (\d+:\d+) (\d+:\d+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const url = match[1];
      const startTime = match[2];
      const endTime = match[3];
      
      this.trimSettings.set(chatId, { url, startTime, endTime });
      
      this.bot.sendMessage(chatId, 
        `✂️ Video Trimming\n\n` +
        `📹 URL: ${url.substring(0, 50)}...\n` +
        `⏱️ Start: ${startTime}\n` +
        `⏱️ End: ${endTime}\n\n` +
        `Select quality to download:`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '⭐ 720p', callback_data: `trim:720:${chatId}` },
                { text: '📱 480p', callback_data: `trim:480:${chatId}` }
              ],
              [
                { text: '📺 1080p', callback_data: `trim:1080:${chatId}` },
                { text: '💾 360p', callback_data: `trim:360:${chatId}` }
              ]
            ]
          }
        }
      );
    });

    // Quality preset command
    this.bot.onText(/\/preset/, (msg) => {
      const chatId = msg.chat.id;
      const preset = this.userPresets.get(chatId) || { video: '720', audio: 'best' };
      
      this.bot.sendMessage(chatId,
        `⚙️ Quality Presets\n\n` +
        `Current Settings:\n` +
        `🎬 Video: ${preset.video}p\n` +
        `🎵 Audio: ${preset.audio}\n\n` +
        `Choose preset to change:`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '🎬 Video Quality', callback_data: 'preset:video' }
              ],
              [
                { text: '🎵 Audio Quality', callback_data: 'preset:audio' }
              ],
              [
                { text: '💾 Save Current', callback_data: 'preset:save' }
              ]
            ]
          }
        }
      );
    });

    // Quick actions command
    this.bot.onText(/\/quick/, (msg) => {
      const chatId = msg.chat.id;
      
      this.bot.sendMessage(chatId,
        `⚡ Quick Actions\n\n` +
        `Choose a quick action:`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '🔥 Trending', callback_data: 'quick:trending' },
                { text: '🔍 Search', callback_data: 'quick:search' }
              ],
              [
                { text: '⭐ Favorites', callback_data: 'quick:favorites' },
                { text: '📊 Stats', callback_data: 'quick:stats' }
              ],
              [
                { text: '📋 Queue', callback_data: 'quick:queue' },
                { text: '📜 History', callback_data: 'quick:history' }
              ],
              [
                { text: '⚙️ Settings', callback_data: 'quick:settings' }
              ]
            ]
          }
        }
      );
    });

    // Admin: Broadcast command
    this.bot.onText(/\/broadcast (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      
      if (!this.adminUsers.includes(chatId)) {
        this.bot.sendMessage(chatId, '❌ Admin only command');
        return;
      }
      
      const message = match[1];
      let sent = 0;
      let failed = 0;
      
      for (const userId of this.allUsers) {
        try {
          await this.bot.sendMessage(userId, `📢 Broadcast:\n\n${message}`);
          sent++;
        } catch (error) {
          failed++;
        }
      }
      
      this.bot.sendMessage(chatId, `✅ Broadcast complete!\n\nSent: ${sent}\nFailed: ${failed}`);
    });

    // Admin: Bot stats command
    this.bot.onText(/\/botstats/, (msg) => {
      const chatId = msg.chat.id;
      
      if (!this.adminUsers.includes(chatId)) {
        this.bot.sendMessage(chatId, '❌ Admin only command');
        return;
      }
      
      let totalDownloads = 0;
      let totalCompleted = 0;
      let totalFailed = 0;
      
      for (const history of this.userHistory.values()) {
        totalDownloads += history.length;
        totalCompleted += history.filter(h => h.status === 'completed').length;
        totalFailed += history.filter(h => h.status === 'failed').length;
      }
      
      const activeDownloads = this.downloadService.activeDownloads.size;
      
      this.bot.sendMessage(chatId,
        `📊 *Bot Statistics:*\n\n` +
        `👥 Total Users: ${this.allUsers.size}\n` +
        `📥 Total Downloads: ${totalDownloads}\n` +
        `✅ Completed: ${totalCompleted}\n` +
        `❌ Failed: ${totalFailed}\n` +
        `⏬ Active: ${activeDownloads}\n` +
        `⭐ Total Favorites: ${Array.from(this.userFavorites.values()).reduce((sum, favs) => sum + favs.length, 0)}\n` +
        `📋 Queued: ${Array.from(this.downloadQueue.values()).reduce((sum, queue) => sum + queue.length, 0)}`,
        { parse_mode: 'Markdown' }
      );
    });

    // Admin: User list command
    this.bot.onText(/\/users/, (msg) => {
      const chatId = msg.chat.id;
      
      if (!this.adminUsers.includes(chatId)) {
        this.bot.sendMessage(chatId, '❌ Admin only command');
        return;
      }
      
      const userList = Array.from(this.allUsers).slice(0, 50).join('\n');
      this.bot.sendMessage(chatId, `👥 Users (showing first 50):\n\n${userList || 'No users yet'}`);
    });

    // Handle URLs
    this.bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      const text = msg.text;

      // Track user
      this.allUsers.add(chatId);

      // Skip if it's a command
      if (!text || text.startsWith('/')) return;

      // Check if in batch download mode
      const batchMode = this.batchDownloads.get(chatId);
      if (batchMode && batchMode.waiting) {
        // Check if message contains multiple URLs
        const urls = text.split('\n').filter(line => this.isValidUrl(line.trim()));
        
        if (urls.length > 0) {
          this.bot.sendMessage(chatId, 
            `📦 Found ${urls.length} URLs\n\n` +
            `Starting batch download with ${this.userSettings.get(chatId)?.defaultQuality || '720p'} quality...\n\n` +
            `This may take a while.`
          );
          
          this.batchDownloads.delete(chatId);
          
          // Download each URL
          for (const [index, url] of urls.entries()) {
            try {
              const statusMsg = await this.bot.sendMessage(chatId, 
                `⏬ Downloading ${index + 1}/${urls.length}\n\n` +
                `${url.substring(0, 50)}...`
              );
              
              const info = await this.videoInfoService.getVideoInfo(url);
              const quality = this.userSettings.get(chatId)?.defaultQuality || '720';
              await this.startDownload(chatId, statusMsg.message_id, url, 'video', quality, info);
              
              // Small delay between downloads
              await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
              this.bot.sendMessage(chatId, `❌ Failed: ${url.substring(0, 30)}...`);
            }
          }
          
          this.bot.sendMessage(chatId, `✅ Batch download complete! Downloaded ${urls.length} videos.`);
          return;
        }
      }

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
      
      // Store URL with short ID
      const urlId = this.urlIdCounter++;
      this.urlCache.set(urlId, { url, info });
      
      // Send thumbnail with video info and download button
      if (info.thumbnail) {
        try {
          const caption = `📹 *${info.title}*\n\n` +
            `👤 ${this.getUploader(info)}\n` +
            `⏱️ Duration: ${this.formatDuration(info.duration || 0)}\n` +
            `👁️ Views: ${this.formatNumber(info.viewCount || info.view_count || 0)}\n` +
            `📅 ${this.formatUploadDate(info.uploadDate || info.upload_date)}`;
          
          // Validate thumbnail URL
          if (info.thumbnail && info.thumbnail.startsWith('http')) {
            await this.bot.sendPhoto(chatId, info.thumbnail, {
              caption: caption,
              parse_mode: 'Markdown'
            });
          } else {
            // Send text only if thumbnail is invalid
            await this.bot.sendMessage(chatId, caption, {
              parse_mode: 'Markdown'
            });
          }
        } catch (photoError) {
          console.log('Could not send thumbnail:', photoError.message);
          // Send text only as fallback
          try {
            const caption = `📹 *${info.title}*\n\n` +
              `👤 ${this.getUploader(info)}\n` +
              `⏱️ Duration: ${this.formatDuration(info.duration || 0)}\n` +
              `👁️ Views: ${this.formatNumber(info.viewCount || info.view_count || 0)}\n` +
              `📅 ${this.formatUploadDate(info.uploadDate || info.upload_date)}`;
            
            await this.bot.sendMessage(chatId, caption, {
              parse_mode: 'Markdown'
            });
          } catch (e) {
            console.error('Failed to send video info:', e);
          }
        }
      }
      
      // Show download button to start the download process
      await this.bot.editMessageText(
        `✅ Video found!\n\n` +
        `📹 ${info.title.substring(0, 60)}...\n\n` +
        `⏱️ Duration: ${this.formatDuration(info.duration || 0)}\n` +
        `👁️ Views: ${this.formatNumber(info.viewCount || info.view_count || 0)}\n\n` +
        `Click the button below to start downloading:`,
        {
          chat_id: chatId,
          message_id: statusMsg.message_id,
          reply_markup: {
            inline_keyboard: [
              [
                { text: '📥 Download Video', callback_data: `download:${urlId}` }
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
      // Answer callback query immediately to prevent timeout
      // This must be done within 30 seconds of the button click
      try {
        await this.bot.answerCallbackQuery(query.id);
      } catch (answerError) {
        // Ignore timeout errors - query is too old
        if (!answerError.message.includes('query is too old')) {
          console.error('Error answering callback query:', answerError.message);
        }
        // Continue processing even if answer fails
      }

      if (data.startsWith('download:')) {
        const urlId = parseInt(data.split(':')[1]);
        const cached = this.urlCache.get(urlId);
        
        if (!cached) {
          throw new Error('URL expired. Please send the link again.');
        }
        
        // Show format selection (Video/Audio/Subtitles)
        await this.bot.editMessageText(
          `📹 *${cached.info.title.substring(0, 60)}...*\n\n` +
          `Choose download format:`,
          {
            chat_id: chatId,
            message_id: query.message.message_id,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '🎬 Video', callback_data: `format:video:${urlId}` }
                ],
                [
                  { text: '🎵 Audio', callback_data: `format:audio:${urlId}` }
                ],
                [
                  { text: '📝 Subtitles', callback_data: `format:subtitles:${urlId}` }
                ]
              ]
            }
          }
        );
      } else if (data.startsWith('search:')) {
        const urlId = parseInt(data.split(':')[1]);
        const cached = this.urlCache.get(urlId);
        
        if (!cached) {
          throw new Error('Search result expired. Please search again.');
        }
        
        // Show download button for search results
        await this.bot.editMessageText(
          `📹 *${cached.info.title}*\n\nClick to download:`,
          {
            chat_id: chatId,
            message_id: query.message.message_id,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '📥 Download Video', callback_data: `download:${urlId}` }
                ]
              ]
            }
          }
        );
      } else if (data.startsWith('playlist:')) {
        const [, action, urlOrData] = data.split(':');
        
        if (action === 'cancel') {
          await this.bot.editMessageText(
            `❌ Playlist download cancelled`,
            {
              chat_id: chatId,
              message_id: query.message.message_id
            }
          );
          return;
        }
        
        if (action === 'all') {
          await this.bot.editMessageText(
            `🚀 Starting playlist download...\n\n` +
            `This may take a while. I'll send each video as it completes.`,
            {
              chat_id: chatId,
              message_id: query.message.message_id
            }
          );
          
          // Start playlist download in background
          this.downloadPlaylist(chatId, urlOrData);
        }
        
        return;
      } else if (data.startsWith('trim:')) {
        const [, quality, userId] = data.split(':');
        const trimData = this.trimSettings.get(chatId);
        
        if (!trimData) {
          throw new Error('Trim settings expired. Please use /trim command again.');
        }
        
        await this.bot.editMessageText(
          `✂️ Trimming video...\n\n` +
          `⏱️ ${trimData.startTime} - ${trimData.endTime}\n` +
          `📊 Quality: ${quality}p\n\n` +
          `This may take a few minutes...`,
          {
            chat_id: chatId,
            message_id: query.message.message_id
          }
        );
        
        // Start trim download
        await this.downloadTrimmed(chatId, trimData.url, quality, trimData.startTime, trimData.endTime);
        this.trimSettings.delete(chatId);
        
        return;
      } else if (data.startsWith('preset:')) {
        const [, action] = data.split(':');
        const preset = this.userPresets.get(chatId) || { video: '720', audio: 'best' };
        
        if (action === 'video') {
          await this.bot.editMessageText(
            `🎬 Select Video Quality Preset:`,
            {
              chat_id: chatId,
              message_id: query.message.message_id,
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: '360p', callback_data: 'preset:video:360' },
                    { text: '480p', callback_data: 'preset:video:480' }
                  ],
                  [
                    { text: '720p', callback_data: 'preset:video:720' },
                    { text: '1080p', callback_data: 'preset:video:1080' }
                  ],
                  [
                    { text: '2K', callback_data: 'preset:video:2k' },
                    { text: '4K', callback_data: 'preset:video:4k' }
                  ]
                ]
              }
            }
          );
        } else if (action === 'audio') {
          await this.bot.editMessageText(
            `🎵 Select Audio Quality Preset:`,
            {
              chat_id: chatId,
              message_id: query.message.message_id,
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: 'Best Quality', callback_data: 'preset:audio:best' }
                  ],
                  [
                    { text: 'Medium (128kbps)', callback_data: 'preset:audio:medium' }
                  ]
                ]
              }
            }
          );
        } else if (action === 'save') {
          this.userPresets.set(chatId, preset);
          await this.bot.editMessageText(
            `✅ Preset saved!\n\n` +
            `🎬 Video: ${preset.video}p\n` +
            `🎵 Audio: ${preset.audio}`,
            {
              chat_id: chatId,
              message_id: query.message.message_id
            }
          );
        } else {
          // Saving preset value
          const [, type, value] = data.split(':');
          preset[type] = value;
          this.userPresets.set(chatId, preset);
          
          await this.bot.editMessageText(
            `✅ ${type === 'video' ? '🎬 Video' : '🎵 Audio'} preset updated to: ${value}\n\n` +
            `Current Presets:\n` +
            `🎬 Video: ${preset.video}p\n` +
            `🎵 Audio: ${preset.audio}`,
            {
              chat_id: chatId,
              message_id: query.message.message_id
            }
          );
        }
        
        return;
      } else if (data.startsWith('quick:')) {
        const [, action] = data.split(':');
        
        // Handle quick actions
        if (action === 'trending') {
          // Trigger trending command
          this.bot.sendMessage(chatId, '🔥 Fetching trending videos...');
          // Reuse trending logic
        } else if (action === 'search') {
          this.bot.sendMessage(chatId, '🔍 Send your search query:');
        } else if (action === 'favorites') {
          // Trigger favorites command
          const favorites = this.userFavorites.get(chatId) || [];
          if (favorites.length === 0) {
            this.bot.sendMessage(chatId, '⭐ No favorites yet.');
          } else {
            const favText = favorites.map((fav, idx) => 
              `${idx + 1}. ${fav.title.substring(0, 40)}...`
            ).join('\n');
            this.bot.sendMessage(chatId, `⭐ Your Favorites:\n\n${favText}`);
          }
        } else if (action === 'stats') {
          // Trigger stats command
          const history = this.userHistory.get(chatId) || [];
          const completed = history.filter(h => h.status === 'completed').length;
          this.bot.sendMessage(chatId, 
            `📊 Quick Stats:\n\n` +
            `📦 Total: ${history.length}\n` +
            `✅ Completed: ${completed}`
          );
        } else if (action === 'queue') {
          const queue = this.downloadQueue.get(chatId) || [];
          this.bot.sendMessage(chatId, 
            `📋 Queue: ${queue.length} videos\n\n` +
            `Use /startqueue to begin`
          );
        } else if (action === 'history') {
          const history = this.userHistory.get(chatId) || [];
          const recent = history.slice(-5).reverse();
          const historyText = recent.map(h => 
            `${h.status === 'completed' ? '✅' : '❌'} ${h.title.substring(0, 30)}...`
          ).join('\n');
          this.bot.sendMessage(chatId, `📜 Recent:\n\n${historyText || 'No history'}`);
        } else if (action === 'settings') {
          // Trigger settings
          const settings = this.userSettings.get(chatId) || this.getDefaultSettings();
          this.bot.sendMessage(chatId,
            `⚙️ Settings:\n\n` +
            `Auto-delete: ${settings.autoDelete ? 'ON' : 'OFF'}\n` +
            `Quality: ${settings.defaultQuality}\n` +
            `Notifications: ${settings.notifications ? 'ON' : 'OFF'}`
          );
        }
        
        return;
      } else if (data.startsWith('setting:')) {
        const parts = data.split(':');
        const setting = parts[1];
        
        const settings = this.userSettings.get(chatId) || this.getDefaultSettings();
        
        if (setting === 'autodelete') {
          settings.autoDelete = !settings.autoDelete;
          this.userSettings.set(chatId, settings);
        } else if (setting === 'quality') {
          settings.defaultQuality = parts[2];
          this.userSettings.set(chatId, settings);
        } else if (setting === 'notifications') {
          settings.notifications = !settings.notifications;
          this.userSettings.set(chatId, settings);
        }
        
        // Refresh settings display
        await this.bot.editMessageText(
          `⚙️ *Bot Settings:*\n\n` +
          `Auto-delete files: ${settings.autoDelete ? '✅' : '❌'}\n` +
          `Default quality: ${settings.defaultQuality}\n` +
          `Notifications: ${settings.notifications ? '✅' : '❌'}\n\n` +
          `Use buttons below to change settings:`,
          {
            chat_id: chatId,
            message_id: query.message.message_id,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: settings.autoDelete ? '✅ Auto-delete ON' : '❌ Auto-delete OFF', callback_data: 'setting:autodelete' }
                ],
                [
                  { text: '🎬 Default: Best', callback_data: 'setting:quality:best' },
                  { text: '🎬 Default: 1080p', callback_data: 'setting:quality:1080' }
                ],
                [
                  { text: settings.notifications ? '🔔 Notifications ON' : '🔕 Notifications OFF', callback_data: 'setting:notifications' }
                ]
              ]
            }
          }
        );
        return;
      } else if (data.startsWith('format:')) {
        const [, type, urlId] = data.split(':');
        
        // Handle subtitles separately
        if (type === 'subtitles') {
          const cached = this.urlCache.get(parseInt(urlId));
          if (!cached) {
            throw new Error('URL expired. Please send the link again.');
          }
          await this.downloadSubtitles(chatId, query.message.message_id, cached.url, cached.info);
          this.urlCache.delete(parseInt(urlId));
          return;
        }
        
        // Show quality/resolution selection (removed 2K and 4K options)
        const keyboard = type === 'video' 
          ? [
              [
                { text: '⭐ 720p (Recommended)', callback_data: `quality:${type}:720:${urlId}` },
                { text: '📱 480p', callback_data: `quality:${type}:480:${urlId}` }
              ],
              [
                { text: '💾 360p (Small)', callback_data: `quality:${type}:360:${urlId}` },
                { text: '📺 1080p (HD)', callback_data: `quality:${type}:1080:${urlId}` }
              ],
              [
                { text: '🎥 2K (1440p)', callback_data: `quality:${type}:2k:${urlId}` },
                { text: '🎬 4K (2160p)', callback_data: `quality:${type}:4k:${urlId}` }
              ],
              [
                { text: '🌟 Best Available', callback_data: `quality:${type}:best:${urlId}` }
              ]
            ]
          : [
              [
                { text: '🎵 Best Quality', callback_data: `quality:${type}:best:${urlId}` }
              ],
              [
                { text: '🎶 Medium (128kbps)', callback_data: `quality:${type}:medium:${urlId}` }
              ]
            ];

        await this.bot.editMessageText(
          `🎬 SELECT QUALITY\n` +
          `========================\n\n` +
          `${type === 'video' ? '📹 Video Quality:' : '🎵 Audio Quality:'}\n\n` +
          `💡 RECOMMENDATIONS\n` +
          `⭐ 720p - Best balance\n` +
          `� 480p M- Small & fast\n` +
          `💾 360p - Smallest size\n` +
          `� 1080p - Faull HD\n\n` +
          `⚠️ Files >50MB will be split`,
          {
            chat_id: chatId,
            message_id: query.message.message_id,
            reply_markup: { inline_keyboard: keyboard }
          }
        );
      } else if (data.startsWith('split:')) {
        const downloadId = data.split(':')[1];
        const splitInfo = this.pendingSplits.get(downloadId);
        
        if (!splitInfo) {
          throw new Error('Split request expired. Please download again.');
        }
        
        await this.splitAndSendFile(splitInfo.chatId, splitInfo.messageId, splitInfo.filePath, splitInfo.downloadInfo);
        this.pendingSplits.delete(downloadId);
        
      } else if (data.startsWith('link:')) {
        const downloadId = data.split(':')[1];
        const splitInfo = this.pendingSplits.get(downloadId);
        
        if (!splitInfo) {
          throw new Error('Link request expired. Please download again.');
        }
        
        const path = await import('path');
        const fileName = path.basename(splitInfo.filePath);
        
        await this.bot.editMessageText(
          `✅ Download completed!\n\n` +
          `📦 ${splitInfo.downloadInfo.title.substring(0, 50)}...\n\n` +
          `⚠️ File saved on server\n` +
          `📁 ${fileName}\n\n` +
          `💡 Get file from web interface`,
          {
            chat_id: splitInfo.chatId,
            message_id: splitInfo.messageId
          }
        );
        
        this.pendingSplits.delete(downloadId);
        
      } else if (data.startsWith('quality:')) {
        const [, type, quality, urlId] = data.split(':');
        const cached = this.urlCache.get(parseInt(urlId));
        
        if (!cached) {
          throw new Error('URL expired. Please send the link again.');
        }
        
        // Warn about 2K and 4K downloads
        if (quality === '2k' || quality === '4k') {
          await this.bot.editMessageText(
            `⚠️ ${quality.toUpperCase()} Download Warning\n\n` +
            `📦 Large file size (100MB-2GB)\n` +
            `⏱️ Download time: 5-15 minutes\n` +
            `✂️ Will be split if >50MB\n\n` +
            `Starting download...`,
            {
              chat_id: chatId,
              message_id: query.message.message_id
            }
          );
        }
        
        await this.startDownload(chatId, query.message.message_id, cached.url, type, quality, cached.info);
        
        // Clean up URL from cache after use
        this.urlCache.delete(parseInt(urlId));
      }

    } catch (error) {
      console.error('Callback error:', error.message);
      
      // Try to notify user via message instead of callback
      try {
        const errorText = error.message.length > 180 
          ? error.message.substring(0, 180) + '...' 
          : error.message;
        
        await this.bot.sendMessage(chatId, `❌ Error: ${errorText}`);
      } catch (sendError) {
        console.error('Failed to send error message:', sendError.message);
      }
    }
  }

  async startDownload(chatId, messageId, url, type, quality, info) {
    try {
      // Check for custom filename
      const customFilename = this.customFilenames.get(chatId);
      if (customFilename) {
        await this.bot.editMessageText(
          `⏬ Starting download...\n\n` +
          `📹 ${info.title.substring(0, 50)}...\n` +
          `Type: ${type}\n` +
          `Quality: ${quality}\n` +
          `📝 Custom name: ${customFilename}`,
          {
            chat_id: chatId,
            message_id: messageId
          }
        );
        this.customFilenames.delete(chatId);
      } else {
        await this.bot.editMessageText(
          `⏬ Starting download...\n\n` +
          `📹 ${info.title.substring(0, 50)}...\n` +
          `Type: ${type}\n` +
          `Quality: ${quality}`,
          {
            chat_id: chatId,
            message_id: messageId
          }
        );
      }

      // Start download
      const downloadInfo = await this.downloadService.startDownload(url, type, quality);
      this.userDownloads.set(chatId, downloadInfo.id);

      // Add to user history
      this.addToHistory(chatId, {
        title: info.title,
        type,
        quality,
        status: 'started',
        date: new Date()
      });

      // Monitor progress
      this.monitorDownload(chatId, messageId, downloadInfo.id, info.title);
    } catch (error) {
      await this.bot.editMessageText(
        `❌ Download failed: ${error.message}`,
        {
          chat_id: chatId,
          message_id: messageId
        }
      );
      
      // Update history
      this.updateHistoryStatus(chatId, 'failed');
    }
  }

  async downloadSubtitles(chatId, messageId, url, info) {
    try {
      await this.bot.editMessageText(
        `📝 Downloading subtitles...\n\n${info.title.substring(0, 50)}...`,
        {
          chat_id: chatId,
          message_id: messageId
        }
      );

      const youtubedl = (await import('youtube-dl-exec')).default;
      const sanitize = (await import('sanitize-filename')).default;
      const path = (await import('path')).default;
      
      const filename = sanitize(info.title);
      const outputPath = path.join(this.downloadService.downloadPath, `${filename}.srt`);

      await youtubedl(url, {
        output: outputPath,
        writeAutoSub: true,
        subLang: 'en',
        skipDownload: true,
        noCheckCertificates: true
      });

      if (fs.existsSync(outputPath)) {
        await this.bot.sendDocument(chatId, outputPath, {
          caption: `📝 Subtitles: ${info.title}`
        });
        
        await this.bot.editMessageText(
          `✅ Subtitles downloaded!`,
          {
            chat_id: chatId,
            message_id: messageId
          }
        );
        
        // Clean up
        fs.unlinkSync(outputPath);
      } else {
        throw new Error('No subtitles available for this video');
      }
    } catch (error) {
      await this.bot.editMessageText(
        `❌ Subtitles not available: ${error.message}`,
        {
          chat_id: chatId,
          message_id: messageId
        }
      );
    }
  }

  addToHistory(chatId, item) {
    if (!this.userHistory.has(chatId)) {
      this.userHistory.set(chatId, []);
    }
    const history = this.userHistory.get(chatId);
    history.push(item);
    
    // Keep only last 50 items
    if (history.length > 50) {
      history.shift();
    }
  }

  updateHistoryStatus(chatId, status) {
    const history = this.userHistory.get(chatId);
    if (history && history.length > 0) {
      history[history.length - 1].status = status;
    }
  }

  monitorDownload(chatId, messageId, downloadId, title) {
    let lastProgress = 0;
    let checkCount = 0;
    const maxChecks = 300; // 10 minutes max (300 * 2 seconds)
    
    const interval = setInterval(async () => {
      checkCount++;
      
      // Timeout after max checks
      if (checkCount > maxChecks) {
        clearInterval(interval);
        await this.bot.editMessageText(
          `⏱️ Download timeout. Please try again.`,
          {
            chat_id: chatId,
            message_id: messageId
          }
        ).catch(() => {});
        return;
      }
      
      const download = this.downloadService.activeDownloads.get(downloadId);
      
      if (!download) {
        clearInterval(interval);
        
        // Wait a bit for history to update
        setTimeout(async () => {
          // Check if completed
          const completed = this.downloadService.downloadHistory.find(d => d.id === downloadId);
          
          if (completed) {
            if (completed.status === 'completed') {
              console.log(`Download completed: ${downloadId}, sending file...`);
              this.updateHistoryStatus(chatId, 'completed');
              await this.sendFile(chatId, messageId, completed);
            } else if (completed.status === 'failed') {
              console.log(`Download failed: ${downloadId}`);
              this.updateHistoryStatus(chatId, 'failed');
              await this.bot.editMessageText(
                `❌ Download failed: ${completed.error || 'Unknown error'}`,
                {
                  chat_id: chatId,
                  message_id: messageId
                }
              ).catch(() => {});
            }
          } else {
            console.log(`Download not found in history: ${downloadId}`);
            await this.bot.editMessageText(
              `❌ Download status unknown. Please try again.`,
              {
                chat_id: chatId,
                message_id: messageId
              }
            ).catch(() => {});
          }
        }, 1000);
        
        return;
      }

      // Calculate speed and ETA
      const progressDiff = download.progress - lastProgress;
      const speed = progressDiff / 2; // progress per second
      const remaining = 100 - download.progress;
      const eta = speed > 0 ? Math.round(remaining / speed) : 0;
      
      lastProgress = download.progress;

      // Update progress with more details
      const progressBar = this.createProgressBar(download.progress);
      await this.bot.editMessageText(
        `⏬ Downloading...\n\n` +
        `📹 ${title.substring(0, 40)}...\n\n` +
        `${progressBar} ${Math.round(download.progress)}%\n\n` +
        `Status: ${download.status}\n` +
        `⏱️ ETA: ${this.formatTime(eta)}`,
        {
          chat_id: chatId,
          message_id: messageId
        }
      ).catch(() => {}); // Ignore edit errors
    }, 2000);
  }

  async sendFile(chatId, messageId, downloadInfo) {
    try {
      console.log(`Sending file to chat ${chatId}: ${downloadInfo.title}`);
      
      await this.bot.editMessageText(
        `✅ Download completed!\n\nChecking file...`,
        {
          chat_id: chatId,
          message_id: messageId
        }
      );

      const filePath = downloadInfo.outputPath;
      console.log(`File path: ${filePath}`);
      
      if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        throw new Error('File not found');
      }
      
      console.log(`File exists, size check...`);

      const fileSize = fs.statSync(filePath).size;
      console.log(`File size: ${this.formatBytes(fileSize)}`);
      
      const maxBotApiSize = 50 * 1024 * 1024; // 50MB - Bot API limit (Telegram restriction)
      const maxSplitSize = 2000 * 1024 * 1024; // 2GB - Max size for splitting

      // Check if file is too large for Bot API
      if (fileSize > maxBotApiSize) {
        console.log(`File over 50MB (${this.formatBytes(fileSize)})`);
        
        // If file is under 200MB, offer to split it
        if (fileSize <= maxSplitSize) {
          await this.bot.editMessageText(
            `✅ Download completed!\n\n` +
            `📦 ${downloadInfo.title}\n` +
            `📊 Size: ${this.formatBytes(fileSize)}\n\n` +
            `⚠️ File exceeds 50MB limit\n\n` +
            `Choose an option:`,
            {
              chat_id: chatId,
              message_id: messageId,
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: '✂️ Split & Send Parts', callback_data: `split:${downloadInfo.id}` }
                  ],
                  [
                    { text: '🌐 Download Link', callback_data: `link:${downloadInfo.id}` }
                  ]
                ]
              }
            }
          );
          
          // Store download info for callback
          this.pendingSplits.set(downloadInfo.id, { chatId, messageId, downloadInfo, filePath });
        } else {
          // File too large even for splitting
          const path = await import('path');
          const fileName = path.basename(filePath);
          
          await this.bot.editMessageText(
            `✅ Download completed!\n\n` +
            `📦 ${downloadInfo.title.substring(0, 50)}...\n` +
            `📊 Size: ${this.formatBytes(fileSize)}\n\n` +
            `⚠️ File too large to split (max 2GB)\n\n` +
            `📁 ${fileName}\n` +
            `💡 Get file from web interface`,
            {
              chat_id: chatId,
              message_id: messageId
            }
          );
        }
        
        this.userDownloads.delete(chatId);
        return;
      }

      // Normal upload for files under 50MB
      if (fileSize <= maxBotApiSize) {
        console.log(`File under 50MB, sending as ${downloadInfo.type}...`);
        
        // Check file extension
        const path = await import('path');
        const ext = path.extname(filePath).toLowerCase();
        const validVideoExts = ['.mp4', '.mkv', '.avi', '.mov', '.webm'];
        const validAudioExts = ['.mp3', '.m4a', '.aac', '.ogg', '.wav'];
        
        await this.bot.editMessageText(
          `✅ Download completed!\n\nSending file...`,
          {
            chat_id: chatId,
            message_id: messageId
          }
        );

        // Send file based on type and extension
        if (downloadInfo.type === 'audio' || validAudioExts.includes(ext)) {
          console.log(`Sending audio...`);
          
          const fileName = path.basename(filePath);
          const fileExt = ext.toUpperCase().replace('.', '');
          
          const caption = `${downloadInfo.title}\n\n` +
            `📊 ${this.formatBytes(fileSize)}\n\n` +
            `DOWNLOAD\n\n` +
            `${fileName}\n\n` +
            `🎵 Audio  📁 ${fileExt}`;
          
          await this.bot.sendAudio(chatId, filePath, {
            caption: caption,
            title: downloadInfo.title
          });
        } else if (validVideoExts.includes(ext)) {
          console.log(`Sending video...`);
          
          // Get file details
          const fileName = path.basename(filePath);
          const fileExt = ext.toUpperCase().replace('.', '');
          
          // Build detailed caption like the example
          const qualityText = downloadInfo.quality === '4k' ? '2160p' :
                             downloadInfo.quality === '2k' ? '1440p' :
                             downloadInfo.quality === '1080' ? '1080p' :
                             downloadInfo.quality === '720' ? '720p' :
                             downloadInfo.quality === '480' ? '480p' :
                             downloadInfo.quality === '360' ? '360p' : 'HD';
          
          const caption = `${downloadInfo.title}\n\n` +
            `📊 ${this.formatBytes(fileSize)}\n\n` +
            `DOWNLOAD\n\n` +
            `${fileName}\n\n` +
            `🎬 ${qualityText}  ⏱️ Duration\n` +
            `📁 ${fileExt}`;
          
          await this.bot.sendVideo(chatId, filePath, {
            caption: caption,
            supports_streaming: true
          });
        } else {
          // Send as document if format is uncertain
          console.log(`Sending as document (unknown format)...`);
          
          const fileName = path.basename(filePath);
          const fileExt = ext.toUpperCase().replace('.', '');
          
          const caption = `${downloadInfo.title}\n\n` +
            `📊 ${this.formatBytes(fileSize)}\n\n` +
            `DOWNLOAD\n\n` +
            `${fileName}\n\n` +
            `📁 ${fileExt}`;
          
          await this.bot.sendDocument(chatId, filePath, {
            caption: caption
          });
        }
        
        console.log(`File sent successfully`);

        // Send completion message with details
        const qualityText = downloadInfo.quality === '4k' ? '4K (2160p)' :
                           downloadInfo.quality === '2k' ? '2K (1440p)' :
                           downloadInfo.quality === '1080' ? '1080p (Full HD)' :
                           downloadInfo.quality === '720' ? '720p (HD)' :
                           downloadInfo.quality === '480' ? '480p' :
                           downloadInfo.quality === '360' ? '360p' : 'Best';
        
        const typeEmoji = downloadInfo.type === 'audio' ? '🎵' : '🎬';
        
        await this.bot.editMessageText(
          `✅ Download Complete!\n\n` +
          `${typeEmoji} ${downloadInfo.title.substring(0, 50)}...\n\n` +
          `📊 Quality: ${qualityText}\n` +
          `📦 Size: ${this.formatBytes(fileSize)}\n` +
          `⏱️ Type: ${downloadInfo.type.toUpperCase()}\n\n` +
          `✨ File sent successfully!`,
          {
            chat_id: chatId,
            message_id: messageId
          }
        );
      }

      this.userDownloads.delete(chatId);
      
      // Auto-delete if enabled
      const settings = this.userSettings.get(chatId) || this.getDefaultSettings();
      if (settings.autoDelete) {
        setTimeout(() => {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Auto-deleted: ${filePath}`);
          }
        }, 60000); // Delete after 1 minute
      }
    } catch (error) {
      console.error('Error sending file:', error);
      
      const filePath = downloadInfo.outputPath;
      const fileSize = fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;
      
      // Provide more specific error messages
      let errorMsg = '❌ Error sending file\n\n';
      
      if (error.message.includes('Too Large') || error.message.includes('413') || error.message.includes('too large')) {
        errorMsg += `📦 File size: ${this.formatBytes(fileSize)}\n` +
                   `⚠️ Exceeds Telegram's 50MB limit\n\n` +
                   `💡 Solutions:\n` +
                   `1. Try 720p, 480p, or 360p quality\n` +
                   `2. Download audio only (smaller)\n` +
                   `3. Use the download link provided`;
      } else if (error.message.includes('unsupported format') || error.message.includes('ETELEGRAM')) {
        errorMsg += `⚠️ File format or size issue\n\n` +
                   `📦 Size: ${this.formatBytes(fileSize)}\n` +
                   `📁 File: ${downloadInfo.title}\n\n` +
                   `💡 Try:\n` +
                   `• Lower quality (720p or below)\n` +
                   `• Audio format instead\n` +
                   `• Download from web interface`;
      } else {
        errorMsg += error.message;
      }
      
      await this.bot.sendMessage(chatId, errorMsg);
      
      // If file exists and is over 50MB, provide download link
      if (fs.existsSync(filePath) && fileSize > 50 * 1024 * 1024) {
        const path = await import('path');
        const fileName = path.basename(filePath);
        const downloadLink = `http://localhost:3001/api/files/download/${encodeURIComponent(fileName)}`;
        
        await this.bot.sendMessage(chatId, 
          `🌐 Download link:\n${downloadLink}`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '⬇️ Download File', url: downloadLink }]
              ]
            }
          }
        );
      }
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
    if (!num || isNaN(num)) return 'N/A';
    return new Intl.NumberFormat().format(num);
  }

  formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  formatTime(seconds) {
    if (!seconds || seconds < 60) return `${seconds || 0}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  }

  formatUploadDate(dateString) {
    if (!dateString) {
      console.log('No date string provided');
      return 'Unknown';
    }
    
    console.log('Formatting date:', dateString, 'Type:', typeof dateString);
    
    try {
      // Handle YYYYMMDD format (e.g., "20231225")
      if (typeof dateString === 'string' && dateString.length === 8 && /^\d{8}$/.test(dateString)) {
        const year = dateString.substring(0, 4);
        const month = dateString.substring(4, 6);
        const day = dateString.substring(6, 8);
        console.log(`Parsed YYYYMMDD: ${year}/${month}/${day}`);
        return `${year}/${month}/${day}`;
      }
      
      // Handle YYYY-MM-DD format
      if (typeof dateString === 'string' && dateString.includes('-')) {
        const parts = dateString.split('-');
        if (parts.length === 3) {
          console.log(`Parsed YYYY-MM-DD: ${parts[0]}/${parts[1]}/${parts[2]}`);
          return `${parts[0]}/${parts[1]}/${parts[2]}`;
        }
      }
      
      // Handle standard date formats
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        console.log(`Parsed standard date: ${year}/${month}/${day}`);
        return `${year}/${month}/${day}`;
      }
      
      console.log('Could not parse date, returning Unknown');
      return 'Unknown';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown';
    }
  }

  async downloadPlaylist(chatId, playlistUrl) {
    try {
      const youtubedl = (await import('youtube-dl-exec')).default;
      const playlistInfo = await youtubedl(playlistUrl, {
        dumpSingleJson: true,
        flatPlaylist: true,
        noCheckCertificates: true,
        noWarnings: true
      });
      
      if (!playlistInfo.entries) {
        this.bot.sendMessage(chatId, '❌ No videos found in playlist');
        return;
      }
      
      const settings = this.userSettings.get(chatId) || this.getDefaultSettings();
      const quality = settings.defaultQuality;
      
      let completed = 0;
      let failed = 0;
      
      for (const [index, video] of playlistInfo.entries.entries()) {
        try {
          const statusMsg = await this.bot.sendMessage(chatId, 
            `⏬ Downloading ${index + 1}/${playlistInfo.entries.length}\n\n` +
            `📹 ${video.title.substring(0, 50)}...`
          );
          
          const info = await this.videoInfoService.getVideoInfo(video.webpage_url);
          await this.startDownload(chatId, statusMsg.message_id, video.webpage_url, 'video', quality, info);
          completed++;
          
          // Small delay between downloads
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          failed++;
          this.bot.sendMessage(chatId, `❌ Failed: ${video.title.substring(0, 30)}...`);
        }
      }
      
      this.bot.sendMessage(chatId, 
        `✅ Playlist download complete!\n\n` +
        `✅ Completed: ${completed}\n` +
        `❌ Failed: ${failed}\n` +
        `📊 Total: ${playlistInfo.entries.length}`
      );
    } catch (error) {
      this.bot.sendMessage(chatId, `❌ Playlist error: ${error.message}`);
    }
  }

  async downloadTrimmed(chatId, url, quality, startTime, endTime) {
    try {
      const youtubedl = (await import('youtube-dl-exec')).default;
      const sanitize = (await import('sanitize-filename')).default;
      const path = (await import('path')).default;
      
      // Get video info
      const info = await youtubedl(url, {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true
      });
      
      const filename = sanitize(info.title);
      const outputPath = path.join(this.downloadService.downloadPath, `${filename}_trimmed.mp4`);
      
      // Download with time range using FFmpeg
      await youtubedl(url, {
        output: outputPath,
        format: `bestvideo[height<=${quality}]+bestaudio/best[height<=${quality}]`,
        downloadSections: `*${startTime}-${endTime}`,
        forceKeyframesAtCuts: true,
        noCheckCertificates: true,
        noWarnings: true
      });
      
      // Send the trimmed file
      if (fs.existsSync(outputPath)) {
        const fileSize = fs.statSync(outputPath).size;
        
        if (fileSize < 50 * 1024 * 1024) {
          await this.bot.sendVideo(chatId, outputPath, {
            caption: `✂️ Trimmed: ${info.title}\n\n` +
                    `⏱️ ${startTime} - ${endTime}\n` +
                    `📊 ${quality}p\n` +
                    `📦 ${this.formatBytes(fileSize)}`
          });
          
          this.bot.sendMessage(chatId, `✅ Trimmed video sent!`);
        } else {
          this.bot.sendMessage(chatId, 
            `⚠️ Trimmed file is ${this.formatBytes(fileSize)}\n\n` +
            `Too large to send via Telegram.\n` +
            `Try a shorter time range.`
          );
        }
        
        // Clean up
        fs.unlinkSync(outputPath);
      }
    } catch (error) {
      this.bot.sendMessage(chatId, `❌ Trim failed: ${error.message}`);
    }
  }

  getUploader(info) {
    // Try multiple possible field names for uploader
    return info.uploader || 
           info.channel || 
           info.uploader_id || 
           info.channel_id || 
           'Unknown Channel';
  }

  async splitAndSendFile(chatId, messageId, filePath, downloadInfo) {
    try {
      await this.bot.editMessageText(
        `✂️ Splitting file into parts...\n\nPlease wait...`,
        {
          chat_id: chatId,
          message_id: messageId
        }
      );

      const fileSize = fs.statSync(filePath).size;
      const chunkSize = 45 * 1024 * 1024; // 45MB chunks (safe margin under 50MB)
      const totalParts = Math.ceil(fileSize / chunkSize);

      console.log(`Splitting file into ${totalParts} parts...`);

      const path = await import('path');
      const fileName = path.basename(filePath, path.extname(filePath));
      const fileExt = path.extname(filePath);
      const tempDir = path.join(path.dirname(filePath), 'temp_splits');

      // Create temp directory
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Split file into chunks
      const readStream = fs.createReadStream(filePath, { highWaterMark: chunkSize });
      const parts = [];
      let partNumber = 1;

      for await (const chunk of readStream) {
        const partPath = path.join(tempDir, `${fileName}.part${partNumber}${fileExt}`);
        fs.writeFileSync(partPath, chunk);
        parts.push(partPath);
        partNumber++;
      }

      console.log(`File split into ${parts.length} parts`);

      // Send each part
      await this.bot.editMessageText(
        `✂️ File split into ${totalParts} parts\n\nSending parts...`,
        {
          chat_id: chatId,
          message_id: messageId
        }
      );

      for (let i = 0; i < parts.length; i++) {
        const partPath = parts[i];
        const partSize = fs.statSync(partPath).size;

        await this.bot.sendDocument(chatId, partPath, {
          caption: `📦 ${downloadInfo.title}\n\n` +
                   `Part ${i + 1}/${totalParts}\n` +
                   `Size: ${this.formatBytes(partSize)}\n\n` +
                   `💡 Download all parts to reassemble`
        });

        console.log(`Sent part ${i + 1}/${totalParts}`);
      }

      // Clean up temp files
      for (const partPath of parts) {
        if (fs.existsSync(partPath)) {
          fs.unlinkSync(partPath);
        }
      }
      if (fs.existsSync(tempDir)) {
        fs.rmdirSync(tempDir);
      }

      await this.bot.editMessageText(
        `✅ All ${totalParts} parts sent successfully!\n\n` +
        `📦 ${downloadInfo.title}\n` +
        `📊 Total size: ${this.formatBytes(fileSize)}\n\n` +
        `💡 To reassemble:\n` +
        `1. Download all parts\n` +
        `2. Use a file joiner tool\n` +
        `3. Or use: copy /b part1+part2+... output.mp4`,
        {
          chat_id: chatId,
          message_id: messageId
        }
      );

    } catch (error) {
      console.error('Error splitting file:', error);
      await this.bot.sendMessage(chatId, `❌ Error splitting file: ${error.message}`);
    }
  }
}
