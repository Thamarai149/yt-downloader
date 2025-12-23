// Utility script to check download folder and recent files
import fs from 'fs';
import path from 'path';
import { config } from './src/config/index.js';

console.log('📁 Download Folder Information\n');

const downloadPath = config.downloadPath;
console.log(`🗂️ Download Path: ${downloadPath}`);

// Check if folder exists
if (!fs.existsSync(downloadPath)) {
  console.log('❌ Download folder does not exist yet');
  console.log('💡 It will be created when first download starts');
} else {
  console.log('✅ Download folder exists');
  
  try {
    // List files in download folder
    const files = fs.readdirSync(downloadPath);
    
    if (files.length === 0) {
      console.log('📂 Folder is empty - no downloads yet');
    } else {
      console.log(`\n📋 Found ${files.length} files:`);
      
      // Get file details and sort by modification time
      const fileDetails = files.map(file => {
        const filePath = path.join(downloadPath, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: formatFileSize(stats.size),
          modified: stats.mtime,
          isDirectory: stats.isDirectory()
        };
      }).filter(f => !f.isDirectory) // Only show files, not directories
        .sort((a, b) => b.modified - a.modified); // Sort by newest first
      
      // Show recent files (max 10)
      const recentFiles = fileDetails.slice(0, 10);
      
      recentFiles.forEach((file, index) => {
        const timeAgo = getTimeAgo(file.modified);
        console.log(`${index + 1}. ${file.name}`);
        console.log(`   📊 Size: ${file.size} | ⏰ ${timeAgo}`);
      });
      
      if (fileDetails.length > 10) {
        console.log(`\n... and ${fileDetails.length - 10} more files`);
      }
      
      // Show total folder size
      const totalSize = fileDetails.reduce((sum, file) => {
        const filePath = path.join(downloadPath, file.name);
        const stats = fs.statSync(filePath);
        return sum + stats.size;
      }, 0);
      
      console.log(`\n📊 Total folder size: ${formatFileSize(totalSize)}`);
    }
  } catch (error) {
    console.log('❌ Error reading download folder:', error.message);
  }
}

console.log('\n💡 Tips:');
console.log('• Large files (>50MB) are saved here and cannot be sent via Telegram');
console.log('• Use file manager or FTP to access files from this folder');
console.log('• Files are named based on sanitized video titles');
console.log('• Audio files have .mp3 extension, videos have .mp4 extension');

// Helper functions
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  
  // Use DD/MM/YYYY format for older dates
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}