// Test callback data length to ensure it's within Telegram's 64-byte limit
import { TelegramBotService } from './src/bot/telegramBot.js';

const bot = new TelegramBotService();

console.log('Testing callback data length...\n');

// Test URL
const testUrl = 'https://youtu.be/ip8o5hDFLhI?si=x1fyKXX0CDF499zw';
console.log('Test URL:', testUrl);
console.log('URL length:', testUrl.length, 'characters\n');

// Generate short ID
const urlId = bot.generateUrlId(testUrl);
console.log('Generated URL ID:', urlId);
console.log('URL ID length:', urlId.length, 'characters\n');

// Test callback data formats
const callbackExamples = [
  `dl_audio_best_${urlId}`,
  `dl_video_720_${urlId}`,
  `dl_video_1080_${urlId}`,
  `dl_video_1440_${urlId}`,
  `dl_video_2160_${urlId}`,
  `qk_audio_best_${urlId}`,
  `qk_video_best_${urlId}`,
  `qk_video_1440_${urlId}`,
  `qk_video_2160_${urlId}`,
  `show_video_options_${urlId}`
];

console.log('Callback data examples:');
callbackExamples.forEach((callback, index) => {
  const byteLength = Buffer.byteLength(callback, 'utf8');
  const status = byteLength <= 64 ? '✅' : '❌';
  console.log(`${index + 1}. "${callback}"`);
  console.log(`   Length: ${byteLength} bytes ${status}`);
});

console.log('\n📋 Telegram Limits:');
console.log('• Callback data: 64 bytes maximum');
console.log('• Our longest callback:', Math.max(...callbackExamples.map(c => Buffer.byteLength(c, 'utf8'))), 'bytes');

// Test URL retrieval
console.log('\n🔄 URL Retrieval Test:');
const retrievedUrl = bot.getUrlFromId(urlId);
console.log('Original URL:', testUrl);
console.log('Retrieved URL:', retrievedUrl);
console.log('Match:', testUrl === retrievedUrl ? '✅' : '❌');

console.log('\n✅ Callback data length test completed!');