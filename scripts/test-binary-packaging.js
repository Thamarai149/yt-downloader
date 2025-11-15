/**
 * Test Binary Packaging
 * Verifies that binaries are correctly accessible in both development and production
 */

const path = require('path');
const fs = require('fs');

// Simulate different environments
function testBinaryAccess(environment) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Testing ${environment} environment`);
  console.log('='.repeat(50));
  
  // Set environment
  if (environment === 'development') {
    process.env.NODE_ENV = 'development';
    process.env.ELECTRON_DEV = 'true';
    delete process.env.ELECTRON_RESOURCES_PATH;
  } else {
    process.env.NODE_ENV = 'production';
    delete process.env.ELECTRON_DEV;
    // Simulate production resources path
    process.env.ELECTRON_RESOURCES_PATH = path.join(__dirname, '..');
  }
  
  // Clear require cache to reload PathResolver
  const pathResolverPath = path.join(__dirname, '../backend/electron-paths.js');
  delete require.cache[require.resolve(pathResolverPath)];
  
  // Load PathResolver
  const PathResolver = require('../backend/electron-paths.js').default;
  
  // Test paths
  console.log('\nPath Resolution:');
  console.log(`  Resources Path: ${PathResolver.getResourcesPath()}`);
  console.log(`  yt-dlp Path: ${PathResolver.getBinaryPath('yt-dlp')}`);
  console.log(`  ffmpeg Path: ${PathResolver.getBinaryPath('ffmpeg')}`);
  
  // Check if binaries exist
  console.log('\nBinary Existence:');
  const ytdlpPath = PathResolver.getBinaryPath('yt-dlp');
  const ffmpegPath = PathResolver.getBinaryPath('ffmpeg');
  
  const ytdlpExists = fs.existsSync(ytdlpPath);
  const ffmpegExists = fs.existsSync(ffmpegPath);
  
  console.log(`  yt-dlp: ${ytdlpExists ? '✅ Found' : '❌ Not Found'}`);
  console.log(`  ffmpeg: ${ffmpegExists ? '✅ Found' : '❌ Not Found'}`);
  
  return ytdlpExists && ffmpegExists;
}

// Run tests
console.log('╔════════════════════════════════════════════════╗');
console.log('║   Binary Packaging Test                       ║');
console.log('╚════════════════════════════════════════════════╝');

const devResult = testBinaryAccess('development');
const prodResult = testBinaryAccess('production');

console.log('\n' + '='.repeat(50));
console.log('Test Results:');
console.log('='.repeat(50));
console.log(`Development: ${devResult ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Production:  ${prodResult ? '✅ PASS' : '❌ FAIL'}`);

if (devResult && prodResult) {
  console.log('\n🎉 All tests passed! Binaries are correctly configured.');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Please check the binary paths.');
  process.exit(1);
}
