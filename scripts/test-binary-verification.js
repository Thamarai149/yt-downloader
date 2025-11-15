/**
 * Test Binary Verification
 * Tests runtime binary verification, checksum validation, and error handling
 */

const path = require('path');
const fs = require('fs');

console.log('╔════════════════════════════════════════════════╗');
console.log('║   Binary Verification Test                    ║');
console.log('╚════════════════════════════════════════════════╝\n');

// Test 1: Load and verify checksums
console.log('Test 1: Checksum Loading');
console.log('─'.repeat(50));

const checksumsPath = path.join(__dirname, '../binaries/checksums.json');
if (fs.existsSync(checksumsPath)) {
  const checksums = JSON.parse(fs.readFileSync(checksumsPath, 'utf8'));
  console.log('✅ Checksums file found');
  console.log(`   Entries: ${Object.keys(checksums).length}`);
  Object.entries(checksums).forEach(([file, checksum]) => {
    console.log(`   ${file}: ${checksum.substring(0, 16)}...`);
  });
} else {
  console.log('❌ Checksums file not found');
}

// Test 2: Binary existence
console.log('\nTest 2: Binary Existence');
console.log('─'.repeat(50));

const binariesDir = path.join(__dirname, '../binaries');
const ytdlpPath = path.join(binariesDir, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
const ffmpegPath = path.join(binariesDir, process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');

const ytdlpExists = fs.existsSync(ytdlpPath);
const ffmpegExists = fs.existsSync(ffmpegPath);

console.log(`yt-dlp:  ${ytdlpExists ? '✅ Found' : '❌ Not Found'} (${ytdlpPath})`);
console.log(`ffmpeg:  ${ffmpegExists ? '✅ Found' : '❌ Not Found'} (${ffmpegPath})`);

if (ytdlpExists) {
  const stats = fs.statSync(ytdlpPath);
  console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
}

if (ffmpegExists) {
  const stats = fs.statSync(ffmpegPath);
  console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
}

// Test 3: Binary Manager Integration
console.log('\nTest 3: Binary Manager Integration');
console.log('─'.repeat(50));

async function testBinaryManager() {
  try {
    // Dynamically import the ES module
    const { default: BinaryManager } = await import('../backend/binary-manager.js');
    const binaryManager = new BinaryManager();
    
    console.log('Initializing binary manager...');
    const status = await binaryManager.initialize();
    
    console.log('\nBinary Status:');
    console.log(`  Overall: ${status.verified ? '✅ Verified' : '❌ Failed'}`);
    console.log(`  yt-dlp:`);
    console.log(`    Available: ${status.ytdlp.available ? '✅' : '❌'}`);
    console.log(`    Bundled: ${status.ytdlp.bundled ? '✅' : '❌'}`);
    console.log(`    Checksum: ${status.ytdlp.checksumVerified ? '✅' : '❌'}`);
    console.log(`    Path: ${status.ytdlp.path || 'N/A'}`);
    console.log(`  ffmpeg:`);
    console.log(`    Available: ${status.ffmpeg.available ? '✅' : '❌'}`);
    console.log(`    Bundled: ${status.ffmpeg.bundled ? '✅' : '❌'}`);
    console.log(`    Checksum: ${status.ffmpeg.checksumVerified ? '✅' : '❌'}`);
    console.log(`    Path: ${status.ffmpeg.path || 'N/A'}`);
    
    return status.verified;
  } catch (error) {
    console.error('❌ Binary manager test failed:', error.message);
    return false;
  }
}

// Test 4: Path Resolution
console.log('\nTest 4: Path Resolution');
console.log('─'.repeat(50));

async function testPathResolution() {
  try {
    const { default: PathResolver } = await import('../backend/electron-paths.js');
    
    console.log('Environment:');
    console.log(`  Electron: ${PathResolver.isElectron()}`);
    console.log(`  Development: ${PathResolver.isDevelopment()}`);
    console.log(`  Platform: ${process.platform}`);
    
    console.log('\nPaths:');
    console.log(`  Resources: ${PathResolver.getResourcesPath()}`);
    console.log(`  yt-dlp: ${PathResolver.getBinaryPath('yt-dlp')}`);
    console.log(`  ffmpeg: ${PathResolver.getBinaryPath('ffmpeg')}`);
    
    console.log('\nBinary Existence Check:');
    console.log(`  yt-dlp: ${PathResolver.binaryExists('yt-dlp') ? '✅' : '❌'}`);
    console.log(`  ffmpeg: ${PathResolver.binaryExists('ffmpeg') ? '✅' : '❌'}`);
    
    return true;
  } catch (error) {
    console.error('❌ Path resolution test failed:', error.message);
    return false;
  }
}

// Run all tests
(async () => {
  const test3Result = await testBinaryManager();
  const test4Result = await testPathResolution();
  
  // Summary
  console.log('\n' + '═'.repeat(50));
  console.log('Test Summary');
  console.log('═'.repeat(50));
  console.log(`Checksum Loading:        ${fs.existsSync(checksumsPath) ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Binary Existence:        ${ytdlpExists && ffmpegExists ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Binary Manager:          ${test3Result ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Path Resolution:         ${test4Result ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = fs.existsSync(checksumsPath) && ytdlpExists && ffmpegExists && test3Result && test4Result;
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! Binary verification is working correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please check the output above.');
    process.exit(1);
  }
})();
