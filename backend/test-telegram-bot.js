// Simple test script to verify Telegram bot functionality
import { config } from './src/config/index.js';
import { TelegramBotService } from './src/bot/telegramBot.js';

console.log('Testing Telegram Bot Configuration...');

// Check if bot token is configured
if (config.telegramBotToken) {
  console.log('✅ Telegram bot token is configured');
} else {
  console.log('❌ Telegram bot token is NOT configured');
  console.log('💡 Add TELEGRAM_BOT_TOKEN to your .env file');
}

// Test bot initialization
try {
  const botService = new TelegramBotService();
  console.log('✅ TelegramBotService class instantiated successfully');
  
  // Test command registration
  const commands = Array.from(botService.commands.keys());
  console.log('✅ Commands registered:', commands.join(', '));
  
} catch (error) {
  console.log('❌ Error testing bot service:', error.message);
}

console.log('\n📋 Bot Features:');
console.log('• Command system with /start, /help, /download, etc.');
console.log('• Interactive buttons for quick actions');
console.log('• Session management for tracking downloads');
console.log('• YouTube URL validation');
console.log('• Integration with download service');
console.log('• Admin commands for statistics');

console.log('\n🔧 To use the bot:');
console.log('1. Get a bot token from @BotFather on Telegram');
console.log('2. Add TELEGRAM_BOT_TOKEN=your_token to backend/.env');
console.log('3. Restart the server');
console.log('4. Start chatting with your bot!');