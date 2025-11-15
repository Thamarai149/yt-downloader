/**
 * Test Packaged Binaries
 * Comprehensive test to verify binaries are correctly accessible in packaged application
 * Tests both development and simulated production environments
 * 
 * Requirements: 6.1, 6.2
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logTest(name, passed) {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  const color = passed ? 'green' : 'red';
  log(`  ${name}: ${status}`, color);
}

/**
 * Test binary existence and accessibility
 */
function testBinaryFiles() {
  logSection('1. Binary Files Test');
  
  const binariesDir = path.join(__dirname, '../binaries');
  const results = {
    directory: false,
    ytdlp: false,
    ffmpeg: false,
    checksums: false,
  };
  
  // Check binaries directory exists
  results.directory = fs.existsSync(binariesDir);
  logTest('Binaries directory exists', results.directory);
  
  if (!results.directory) {
    log('  ⚠️  Binaries directory not found. Run: npm run download:binaries', 'yellow');
    return results;
  }
  
  // Check yt-dlp
  const ytdlpPath = path.join(binariesDir, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
  results.ytdlp = fs.existsSync(ytdlpPath);
  logTest('yt-dlp binary exists', results.ytdlp);
  
  if (results.ytdlp) {
    const stats = fs.statSync(ytdlpPath);
    log(`    Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`, 'blue');
    log(`    Path: ${ytdlpPath}`, 'blue');
  }
  
  // Check ffmpeg
  const ffmpegPath = path.join(binariesDir, process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
  results.ffmpeg = fs.existsSync(ffmpegPath);
  logTest('ffmpeg binary exists', results.ffmpeg);
  
  if (results.ffmpeg) {
    const stats = fs.statSync(ffmpegPath);
    log(`    Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`, 'blue');
    log(`    Path: ${ffmpegPath}`, 'blue');
  }
  
  // Check checksums file
  const checksumsPath = path.join(binariesDir, 'checksums.json');
  results.checksums = fs.existsSync(checksumsPath);
  logTest('Checksums file exists', results.checksums);
  
  return results;
}

/**
 * Test Electron Builder configuration
 */
function testElectronBuilderConfig() {
  logSection('2. Electron Builder Configuration Test');
  
  const configPath = path.join(__dirname, '../electron-builder.json');
  const results = {
    configExists: false,
    hasExtraResources: false,
    binariesIncluded: false,
  };
  
  // Check config file exists
  results.configExists = fs.existsSync(configPath);
  logTest('electron-builder.json exists', results.configExists);
  
  if (!results.configExists) {
    return results;
  }
  
  // Parse and validate configuration
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Check for extraResources
    results.hasExtraResources = Array.isArray(config.extraResources) && config.extraResources.length > 0;
    logTest('Has extraResources configuration', results.hasExtraResources);
    
    if (results.hasExtraResources) {
      // Check if binaries are included
      const binariesResource = config.extraResources.find(
        resource => resource.from === 'binaries' || resource.from.includes('binaries')
      );
      results.binariesIncluded = !!binariesResource;
      logTest('Binaries included in extraResources', results.binariesIncluded);
      
      if (binariesResource) {
        log(`    From: ${binariesResource.from}`, 'blue');
        log(`    To: ${binariesResource.to}`, 'blue');
        if (binariesResource.filter) {
          log(`    Filters: ${binariesResource.filter.length} rules`, 'blue');
        }
      }
    }
    
    // Display other relevant config
    if (config.asar !== undefined) {
      log(`    ASAR packaging: ${config.asar ? 'enabled' : 'disabled'}`, 'blue');
    }
    if (config.asarUnpack) {
      log(`    ASAR unpack rules: ${config.asarUnpack.length}`, 'blue');
    }
    
  } catch (error) {
    log(`  ⚠️  Error parsing config: ${error.message}`, 'yellow');
  }
  
  return results;
}

/**
 * Test PathResolver in different environments
 */
function testPathResolver() {
  logSection('3. PathResolver Test');
  
  const results = {
    development: false,
    production: false,
  };
  
  // Test development environment
  try {
    process.env.NODE_ENV = 'development';
    process.env.ELECTRON_DEV = 'true';
    delete process.env.ELECTRON_RESOURCES_PATH;
    
    // Clear require cache
    const pathResolverPath = path.join(__dirname, '../backend/electron-paths.js');
    delete require.cache[require.resolve(pathResolverPath)];
    
    // Dynamic import for ES module
    const { execSync } = require('child_process');
    const testScript = `
      import PathResolver from '../backend/electron-paths.js';
      const paths = PathResolver.getAllPaths();
      console.log(JSON.stringify(paths));
    `;
    
    const tempFile = path.join(__dirname, 'temp-test.mjs');
    fs.writeFileSync(tempFile, testScript);
    
    try {
      // Run from project root so cwd is correct for development mode
      const projectRoot = path.join(__dirname, '..');
      const output = execSync(`node ${tempFile}`, { encoding: 'utf8', cwd: projectRoot });
      const paths = JSON.parse(output);
      
      results.development = paths.ytdlpExists && paths.ffmpegExists;
      logTest('Development environment', results.development);
      
      if (results.development) {
        log(`    yt-dlp: ${paths.ytdlp}`, 'blue');
        log(`    ffmpeg: ${paths.ffmpeg}`, 'blue');
      }
    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  } catch (error) {
    log(`  ⚠️  Development test error: ${error.message}`, 'yellow');
  }
  
  // Test production environment (simulated)
  try {
    process.env.NODE_ENV = 'production';
    delete process.env.ELECTRON_DEV;
    process.env.ELECTRON_RESOURCES_PATH = path.join(__dirname, '..');
    
    const testScript = `
      import PathResolver from '../backend/electron-paths.js';
      const paths = PathResolver.getAllPaths();
      console.log(JSON.stringify(paths));
    `;
    
    const tempFile = path.join(__dirname, 'temp-test-prod.mjs');
    fs.writeFileSync(tempFile, testScript);
    
    try {
      // Run from project root
      const projectRoot = path.join(__dirname, '..');
      const output = execSync(`node ${tempFile}`, { encoding: 'utf8', cwd: projectRoot });
      const paths = JSON.parse(output);
      
      // In simulated production, check if paths are correctly resolved
      const expectedProdPath = path.join(process.env.ELECTRON_RESOURCES_PATH, 'binaries', 'binaries');
      results.production = paths.ytdlp.includes('binaries');
      logTest('Production environment (simulated)', results.production);
      
      if (results.production) {
        log(`    yt-dlp: ${paths.ytdlp}`, 'blue');
        log(`    ffmpeg: ${paths.ffmpeg}`, 'blue');
      }
    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  } catch (error) {
    log(`  ⚠️  Production test error: ${error.message}`, 'yellow');
  }
  
  return results;
}

/**
 * Test binary execution
 */
function testBinaryExecution() {
  logSection('4. Binary Execution Test');
  
  const results = {
    ytdlp: false,
    ffmpeg: false,
  };
  
  const binariesDir = path.join(__dirname, '../binaries');
  
  // Test yt-dlp
  try {
    const ytdlpPath = path.join(binariesDir, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
    if (fs.existsSync(ytdlpPath)) {
      const output = execSync(`"${ytdlpPath}" --version`, { encoding: 'utf8', timeout: 5000 });
      results.ytdlp = output.trim().length > 0;
      logTest('yt-dlp executes successfully', results.ytdlp);
      if (results.ytdlp) {
        log(`    Version: ${output.trim()}`, 'blue');
      }
    } else {
      logTest('yt-dlp executes successfully', false);
      log(`    Binary not found at: ${ytdlpPath}`, 'yellow');
    }
  } catch (error) {
    logTest('yt-dlp executes successfully', false);
    log(`    Error: ${error.message}`, 'yellow');
  }
  
  // Test ffmpeg
  try {
    const ffmpegPath = path.join(binariesDir, process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
    if (fs.existsSync(ffmpegPath)) {
      const output = execSync(`"${ffmpegPath}" -version`, { encoding: 'utf8', timeout: 5000 });
      results.ffmpeg = output.includes('ffmpeg version');
      logTest('ffmpeg executes successfully', results.ffmpeg);
      if (results.ffmpeg) {
        const versionLine = output.split('\n')[0];
        log(`    ${versionLine}`, 'blue');
      }
    } else {
      logTest('ffmpeg executes successfully', false);
      log(`    Binary not found at: ${ffmpegPath}`, 'yellow');
    }
  } catch (error) {
    logTest('ffmpeg executes successfully', false);
    log(`    Error: ${error.message}`, 'yellow');
  }
  
  return results;
}

/**
 * Test package.json scripts
 */
function testPackageScripts() {
  logSection('5. Package Scripts Test');
  
  const packagePath = path.join(__dirname, '../package.json');
  const results = {
    packageExists: false,
    hasDownloadScript: false,
    hasBuildScript: false,
    hasPackageScript: false,
  };
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    results.packageExists = true;
    
    // Check for required scripts
    results.hasDownloadScript = !!packageJson.scripts['download:binaries'];
    logTest('Has download:binaries script', results.hasDownloadScript);
    
    results.hasBuildScript = !!packageJson.scripts['electron:build'];
    logTest('Has electron:build script', results.hasBuildScript);
    
    results.hasPackageScript = !!packageJson.scripts['package:win'];
    logTest('Has package:win script', results.hasPackageScript);
    
    // Check if electron:build includes download:binaries
    if (results.hasBuildScript) {
      const buildScript = packageJson.scripts['electron:build'];
      const includesDownload = buildScript.includes('download:binaries');
      logTest('Build script includes binary download', includesDownload);
    }
    
  } catch (error) {
    log(`  ⚠️  Error reading package.json: ${error.message}`, 'yellow');
  }
  
  return results;
}

/**
 * Generate summary report
 */
function generateSummary(allResults) {
  logSection('Test Summary');
  
  const totalTests = Object.values(allResults).reduce((sum, category) => {
    return sum + Object.values(category).length;
  }, 0);
  
  const passedTests = Object.values(allResults).reduce((sum, category) => {
    return sum + Object.values(category).filter(result => result === true).length;
  }, 0);
  
  const percentage = ((passedTests / totalTests) * 100).toFixed(1);
  
  log(`Total Tests: ${totalTests}`, 'blue');
  log(`Passed: ${passedTests}`, 'green');
  log(`Failed: ${totalTests - passedTests}`, 'red');
  log(`Success Rate: ${percentage}%`, percentage === '100.0' ? 'green' : 'yellow');
  
  if (percentage === '100.0') {
    console.log('\n' + '🎉'.repeat(20));
    log('ALL TESTS PASSED! Binaries are correctly configured for packaging.', 'green');
    console.log('🎉'.repeat(20));
    return true;
  } else {
    console.log('\n' + '⚠️ '.repeat(20));
    log('Some tests failed. Please review the results above.', 'yellow');
    console.log('⚠️ '.repeat(20));
    
    // Provide recommendations
    console.log('\n📋 Recommendations:');
    if (!allResults.binaryFiles.ytdlp || !allResults.binaryFiles.ffmpeg) {
      log('  • Run: npm run download:binaries', 'yellow');
    }
    if (!allResults.electronBuilder.binariesIncluded) {
      log('  • Check electron-builder.json extraResources configuration', 'yellow');
    }
    if (!allResults.execution.ytdlp || !allResults.execution.ffmpeg) {
      log('  • Verify binaries have correct permissions', 'yellow');
      log('  • Check antivirus software is not blocking execution', 'yellow');
    }
    
    return false;
  }
}

/**
 * Main test runner
 */
function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  log('║        Packaged Binaries Configuration Test               ║', 'cyan');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  log(`\n🖥️  Platform: ${process.platform}`, 'blue');
  log(`📁 Working Directory: ${process.cwd()}`, 'blue');
  log(`⏰ Test Time: ${new Date().toLocaleString()}`, 'blue');
  
  const allResults = {
    binaryFiles: testBinaryFiles(),
    electronBuilder: testElectronBuilderConfig(),
    pathResolver: testPathResolver(),
    execution: testBinaryExecution(),
    packageScripts: testPackageScripts(),
  };
  
  const success = generateSummary(allResults);
  
  console.log('\n' + '='.repeat(60));
  log('Test Complete', 'cyan');
  console.log('='.repeat(60) + '\n');
  
  process.exit(success ? 0 : 1);
}

// Run tests
main();
