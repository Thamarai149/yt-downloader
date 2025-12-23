// Test the formatting functions
import { TelegramBotService } from './src/bot/telegramBot.js';

const bot = new TelegramBotService();

console.log('Testing formatting functions...\n');

// Test file size formatting
console.log('📊 File Size Formatting:');
console.log('1024 bytes =', bot.formatFileSize(1024));
console.log('1048576 bytes =', bot.formatFileSize(1048576));
console.log('52428800 bytes =', bot.formatFileSize(52428800));
console.log('1073741824 bytes =', bot.formatFileSize(1073741824));

console.log('\n⏱️ Duration Formatting:');
console.log('65 seconds =', bot.formatDuration(65));
console.log('3661 seconds =', bot.formatDuration(3661));
console.log('7200 seconds =', bot.formatDuration(7200));

console.log('\n📺 Quality Labels:');
console.log('720 =', bot.getQualityLabel('720'));
console.log('1080 =', bot.getQualityLabel('1080'));
console.log('best =', bot.getQualityLabel('best'));
console.log('best[height<=1080] =', bot.getQualityLabel('best[height<=1080]'));
console.log('worst[height<=360] =', bot.getQualityLabel('worst[height<=360]'));

console.log('\n📱 Number Formatting:');
console.log('1500 =', bot.formatNumber(1500));
console.log('1500000 =', bot.formatNumber(1500000));
console.log('2500000 =', bot.formatNumber(2500000));

console.log('\n📅 Date Formatting:');
console.log('20231215 =', bot.formatDate('20231215'));
console.log('20240301 =', bot.formatDate('20240301'));
console.log('20251223 =', bot.formatDate('20251223'));

console.log('\n📦 Download Size Estimation:');
console.log('720p video (4:23) =', bot.formatFileSize(bot.estimateDownloadSize('720', 263, 'video')));
console.log('1080p video (4:23) =', bot.formatFileSize(bot.estimateDownloadSize('1080', 263, 'video')));
console.log('Audio only (4:23) =', bot.formatFileSize(bot.estimateDownloadSize('720', 263, 'audio')));
console.log('4K video (10:00) =', bot.formatFileSize(bot.estimateDownloadSize('2160', 600, 'video')));

console.log('\n⚠️ Large File Detection:');
console.log('45.5 MB =', bot.isLargeFile('45.5 MB'));
console.log('55.2 MB =', bot.isLargeFile('55.2 MB'));
console.log('1.2 GB =', bot.isLargeFile('1.2 GB'));

console.log('\n✅ All formatting functions tested!');