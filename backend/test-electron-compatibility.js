/**
 * Test script to verify Electron compatibility features
 * Run with: node backend/test-electron-compatibility.js
 */

import PathResolver from './electron-paths.js';
import BinaryManager from './binary-manager.js';

console.log('═══════════════════════════════════════════════════════');
console.log('🧪 Testing Electron Compatibility Features');
console.log('═══════════════════════════════════════════════════════\n');

// Test 1: PathResolver
console.log('📁 Test 1: PathResolver');
console.log('─────────────────────────────────────────────────────');
PathResolver.logPaths(false);
console.log('');

// Test 2: Directory Initialization
console.log('📂 Test 2: Directory Initialization');
console.log('─────────────────────────────────────────────────────');
const dirResults = PathResolver.initializeDirectories();
console.log('Directory creation results:');
console.log(`  User Data: ${dirResults.userData ? '✅' : '❌'}`);
console.log(`  Downloads: ${dirResults.downloads ? '✅' : '❌'}`);
console.log(`  Logs: ${dirResults.logs ? '✅' : '❌'}`);
console.log(`  Cache: ${dirResults.cache ? '✅' : '❌'}`);
console.log('');

// Test 3: BinaryManager
console.log('🔧 Test 3: BinaryManager');
console.log('─────────────────────────────────────────────────────');
const binaryManager = new BinaryManager();

(async () => {
    try {
        const status = await binaryManager.initialize();
        
        console.log('Binary verification results:');
        console.log(`  Overall Status: ${status.verified ? '✅ Verified' : '⚠️  Incomplete'}`);
        console.log('');
        console.log('  yt-dlp:');
        console.log(`    Available: ${status.ytdlp.available ? '✅' : '❌'}`);
        console.log(`    Path: ${status.ytdlp.path || 'Not found'}`);
        console.log(`    Bundled: ${status.ytdlp.bundled ? 'Yes' : 'No (system)'}`);
        console.log('');
        console.log('  ffmpeg:');
        console.log(`    Available: ${status.ffmpeg.available ? '✅' : '❌'}`);
        console.log(`    Path: ${status.ffmpeg.path || 'Not found'}`);
        console.log(`    Bundled: ${status.ffmpeg.bundled ? 'Yes' : 'No (system)'}`);
        console.log('');
        
        // Test 4: Environment Variables
        console.log('🌍 Test 4: Environment Variables');
        console.log('─────────────────────────────────────────────────────');
        console.log(`  PORT: ${process.env.PORT || 'Not set (will use 4000)'}`);
        console.log(`  BACKEND_PORT: ${process.env.BACKEND_PORT || 'Not set'}`);
        console.log(`  IS_ELECTRON: ${process.env.IS_ELECTRON || 'Not set'}`);
        console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`);
        console.log('');
        
        // Summary
        console.log('═══════════════════════════════════════════════════════');
        console.log('📊 Summary');
        console.log('═══════════════════════════════════════════════════════');
        console.log(`✅ PathResolver: Working`);
        console.log(`${dirResults.userData && dirResults.downloads ? '✅' : '⚠️ '} Directories: ${dirResults.userData && dirResults.downloads ? 'Created' : 'Partial'}`);
        console.log(`${status.verified ? '✅' : '⚠️ '} Binaries: ${status.verified ? 'All verified' : 'Some missing'}`);
        console.log('');
        
        if (!status.verified) {
            console.log('⚠️  Note: Missing binaries will use system versions if available.');
            console.log('   For full functionality, ensure binaries are in the binaries/ directory.');
        } else {
            console.log('🎉 All Electron compatibility features are working correctly!');
        }
        
        console.log('═══════════════════════════════════════════════════════');
        
    } catch (error) {
        console.error('❌ Error during testing:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
})();
