/**
 * Build Backend Script
 * Prepares the backend for packaging by installing production dependencies
 * 
 * Requirements: 1.1, 1.2
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const BACKEND_DIR = path.join(__dirname, '../backend');
const NODE_MODULES_DIR = path.join(BACKEND_DIR, 'node_modules');

console.log('╔════════════════════════════════════════╗');
console.log('║   Backend Build Script                 ║');
console.log('╚════════════════════════════════════════╝\n');

console.log('📁 Backend directory:', BACKEND_DIR);
console.log('');

try {
  // Check if backend directory exists
  if (!fs.existsSync(BACKEND_DIR)) {
    throw new Error(`Backend directory not found: ${BACKEND_DIR}`);
  }

  // Check if package.json exists
  const packageJsonPath = path.join(BACKEND_DIR, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`package.json not found in backend directory`);
  }

  console.log('🧹 Cleaning old dependencies...');
  if (fs.existsSync(NODE_MODULES_DIR)) {
    console.log('   Removing existing node_modules...');
    fs.rmSync(NODE_MODULES_DIR, { recursive: true, force: true });
  }

  const packageLockPath = path.join(BACKEND_DIR, 'package-lock.json');
  if (fs.existsSync(packageLockPath)) {
    console.log('   Removing package-lock.json...');
    fs.unlinkSync(packageLockPath);
  }

  console.log('✅ Cleanup complete\n');

  console.log('📦 Installing production dependencies...');
  execSync('npm install --production --no-optional', {
    cwd: BACKEND_DIR,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      YOUTUBE_DL_SKIP_PYTHON_CHECK: '1'
    }
  });

  // Verify installation
  if (!fs.existsSync(NODE_MODULES_DIR)) {
    throw new Error('Installation failed: node_modules not created');
  }

  // Get dependencies size
  const getDirectorySize = (dir) => {
    let size = 0;
    try {
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
    } catch (error) {
      // Ignore errors (e.g., permission issues)
    }
    return size;
  };

  const depsSize = getDirectorySize(NODE_MODULES_DIR);
  const depsSizeMB = (depsSize / (1024 * 1024)).toFixed(2);

  // Count packages
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const depCount = Object.keys(packageJson.dependencies || {}).length;

  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   Build Summary                        ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`✅ Backend prepared successfully`);
  console.log(`📦 Dependencies: ${depCount} packages`);
  console.log(`💾 Size: ${depsSizeMB} MB`);
  console.log(`📁 Location: ${NODE_MODULES_DIR}`);
  console.log('');

  process.exit(0);
} catch (error) {
  console.error('\n❌ Backend build failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}
