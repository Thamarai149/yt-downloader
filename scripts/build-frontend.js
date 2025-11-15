/**
 * Build Frontend Script
 * Builds the React frontend using Vite
 * 
 * Requirements: 1.1, 1.2
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const CLIENT_DIR = path.join(__dirname, '../client');
const DIST_DIR = path.join(CLIENT_DIR, 'dist');

console.log('╔════════════════════════════════════════╗');
console.log('║   Frontend Build Script                ║');
console.log('╚════════════════════════════════════════╝\n');

console.log('📁 Client directory:', CLIENT_DIR);
console.log('📦 Output directory:', DIST_DIR);
console.log('');

try {
  // Check if client directory exists
  if (!fs.existsSync(CLIENT_DIR)) {
    throw new Error(`Client directory not found: ${CLIENT_DIR}`);
  }

  // Check if package.json exists
  const packageJsonPath = path.join(CLIENT_DIR, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`package.json not found in client directory`);
  }

  console.log('🔍 Checking dependencies...');
  const nodeModulesPath = path.join(CLIENT_DIR, 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    console.log('📦 Installing dependencies...');
    execSync('npm install', {
      cwd: CLIENT_DIR,
      stdio: 'inherit'
    });
  } else {
    console.log('✅ Dependencies already installed');
  }

  console.log('\n🏗️  Building frontend with Vite...');
  execSync('npm run build', {
    cwd: CLIENT_DIR,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production'
    }
  });

  // Verify build output
  if (!fs.existsSync(DIST_DIR)) {
    throw new Error('Build failed: dist directory not created');
  }

  const indexHtmlPath = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(indexHtmlPath)) {
    throw new Error('Build failed: index.html not found in dist');
  }

  // Get build size
  const getDirectorySize = (dir) => {
    let size = 0;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        size += getDirectorySize(filePath);
      } else {
        size += stats.size;
      }
    }
    return size;
  };

  const buildSize = getDirectorySize(DIST_DIR);
  const buildSizeMB = (buildSize / (1024 * 1024)).toFixed(2);

  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   Build Summary                        ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`✅ Frontend built successfully`);
  console.log(`📦 Build size: ${buildSizeMB} MB`);
  console.log(`📁 Output: ${DIST_DIR}`);
  console.log('');

  process.exit(0);
} catch (error) {
  console.error('\n❌ Frontend build failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}
