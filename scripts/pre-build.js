/**
 * Pre-Build Script
 * Runs before Electron Builder to ensure everything is ready
 * 
 * Checks:
 * - Frontend is built
 * - Backend dependencies are installed
 * - Binaries are downloaded
 * - Required files exist
 * - Code signing configuration (optional)
 * 
 * Requirements: 1.1, 1.2
 */

const path = require('path');
const fs = require('fs');
const signConfig = require('./sign-config');

const ROOT_DIR = path.join(__dirname, '..');
const CLIENT_DIST = path.join(ROOT_DIR, 'client', 'dist');
const BACKEND_NODE_MODULES = path.join(ROOT_DIR, 'backend', 'node_modules');
const BINARIES_DIR = path.join(ROOT_DIR, 'binaries');

console.log('╔════════════════════════════════════════╗');
console.log('║   Pre-Build Verification               ║');
console.log('╚════════════════════════════════════════╝\n');

let hasErrors = false;
const warnings = [];

/**
 * Check if a path exists
 */
function checkPath(name, path, required = true) {
  const exists = fs.existsSync(path);
  const status = exists ? '✅' : (required ? '❌' : '⚠️');
  console.log(`${status} ${name}: ${exists ? 'Found' : 'Missing'}`);
  
  if (!exists && required) {
    hasErrors = true;
  } else if (!exists && !required) {
    warnings.push(`${name} is missing but optional`);
  }
  
  return exists;
}

/**
 * Check if directory has files
 */
function checkDirectory(name, path, required = true) {
  if (!fs.existsSync(path)) {
    const status = required ? '❌' : '⚠️';
    console.log(`${status} ${name}: Directory not found`);
    if (required) hasErrors = true;
    return false;
  }
  
  const files = fs.readdirSync(path);
  const hasFiles = files.length > 0;
  const status = hasFiles ? '✅' : (required ? '❌' : '⚠️');
  console.log(`${status} ${name}: ${hasFiles ? `${files.length} files` : 'Empty'}`);
  
  if (!hasFiles && required) {
    hasErrors = true;
  }
  
  return hasFiles;
}

console.log('🔍 Checking build prerequisites...\n');

// Check frontend build
console.log('Frontend:');
checkPath('  Client dist directory', CLIENT_DIST, true);
if (fs.existsSync(CLIENT_DIST)) {
  checkPath('  index.html', path.join(CLIENT_DIST, 'index.html'), true);
}

console.log('');

// Check backend
console.log('Backend:');
checkPath('  server.js', path.join(ROOT_DIR, 'backend', 'server.js'), true);
checkDirectory('  node_modules', BACKEND_NODE_MODULES, true);

console.log('');

// Check binaries
console.log('Binaries:');
checkDirectory('  Binaries directory', BINARIES_DIR, true);
if (fs.existsSync(BINARIES_DIR)) {
  const platform = process.platform;
  const ytdlpName = platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
  const ffmpegName = platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
  
  checkPath(`  ${ytdlpName}`, path.join(BINARIES_DIR, ytdlpName), true);
  checkPath(`  ${ffmpegName}`, path.join(BINARIES_DIR, ffmpegName), true);
}

console.log('');

// Check Electron files
console.log('Electron:');
checkPath('  main.js', path.join(ROOT_DIR, 'src', 'electron', 'main.js'), true);
checkPath('  preload.ts', path.join(ROOT_DIR, 'src', 'electron', 'preload.ts'), true);

console.log('');

// Check configuration files
console.log('Configuration:');
checkPath('  package.json', path.join(ROOT_DIR, 'package.json'), true);
checkPath('  electron-builder.json', path.join(ROOT_DIR, 'electron-builder.json'), true);

console.log('');

// Check code signing (optional)
console.log('Code Signing (Optional):');
signConfig.loadSigningEnv();
const signing = signConfig.isSigningConfigured();

if (signing.windows) {
  console.log('  ✅ Windows signing configured');
} else {
  console.log('  ⚠️  Windows signing not configured');
  warnings.push('Code signing not configured - users may see SmartScreen warnings');
}

if (signing.macos) {
  console.log('  ✅ macOS signing configured');
} else {
  console.log('  ⚠️  macOS signing not configured');
}

if (!signing.any) {
  console.log('');
  console.log('  💡 To enable code signing:');
  console.log('     Run: npm run setup:signing');
  console.log('     See: CODE_SIGNING.md');
}

console.log('');

// Summary
console.log('╔════════════════════════════════════════╗');
console.log('║   Verification Summary                 ║');
console.log('╚════════════════════════════════════════╝');

if (hasErrors) {
  console.log('❌ Pre-build verification failed');
  console.log('');
  console.log('Missing required files. Please run:');
  console.log('  npm run build:all');
  console.log('');
  process.exit(1);
} else {
  console.log('✅ All required files present');
  
  if (warnings.length > 0) {
    console.log('');
    console.log('Warnings:');
    warnings.forEach(w => console.log(`  ⚠️  ${w}`));
  }
  
  console.log('');
  console.log('🚀 Ready to build Electron application');
  console.log('');
  process.exit(0);
}
