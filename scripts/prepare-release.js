/**
 * Prepare Release Script
 * Validates and prepares everything needed for a release
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✓ ${description}`, 'green');
    return true;
  } else {
    log(`✗ ${description} - NOT FOUND`, 'red');
    return false;
  }
}

function checkVersion() {
  const packageJson = require('../package.json');
  const electronBuilderJson = require('../electron-builder.json');
  
  log('\n📦 Version Check', 'cyan');
  log(`Package.json version: ${packageJson.version}`, 'blue');
  
  // Check if version follows semver
  const semverRegex = /^\d+\.\d+\.\d+$/;
  if (semverRegex.test(packageJson.version)) {
    log('✓ Version format is valid (semver)', 'green');
    return true;
  } else {
    log('✗ Version format is invalid (should be X.Y.Z)', 'red');
    return false;
  }
}

function checkDependencies() {
  log('\n📚 Dependencies Check', 'cyan');
  
  const checks = [
    { dir: 'node_modules', desc: 'Root dependencies' },
    { dir: 'backend/node_modules', desc: 'Backend dependencies' },
    { dir: 'client/node_modules', desc: 'Client dependencies' }
  ];
  
  let allGood = true;
  for (const check of checks) {
    if (!checkFile(check.dir, check.desc)) {
      allGood = false;
    }
  }
  
  return allGood;
}

function checkBinaries() {
  log('\n🔧 Binaries Check', 'cyan');
  
  const binaries = [
    { file: 'binaries/yt-dlp.exe', desc: 'yt-dlp binary' },
    { file: 'binaries/ffmpeg.exe', desc: 'ffmpeg binary' },
    { file: 'binaries/checksums.json', desc: 'Binary checksums' }
  ];
  
  let allGood = true;
  for (const binary of binaries) {
    if (!checkFile(binary.file, binary.desc)) {
      allGood = false;
    }
  }
  
  if (!allGood) {
    log('\n💡 Run "npm run download:binaries" to download missing binaries', 'yellow');
  }
  
  return allGood;
}

function checkDocumentation() {
  log('\n📖 Documentation Check', 'cyan');
  
  const docs = [
    { file: 'README.md', desc: 'README' },
    { file: 'LICENSE', desc: 'LICENSE' },
    { file: 'CHANGELOG.md', desc: 'CHANGELOG' },
    { file: 'RELEASE_NOTES_v1.0.0.md', desc: 'Release Notes' },
    { file: 'docs/USER_GUIDE.md', desc: 'User Guide' },
    { file: 'docs/TESTING_CHECKLIST.md', desc: 'Testing Checklist' }
  ];
  
  let allGood = true;
  for (const doc of docs) {
    if (!checkFile(doc.file, doc.desc)) {
      allGood = false;
    }
  }
  
  return allGood;
}

function checkBuildResources() {
  log('\n🎨 Build Resources Check', 'cyan');
  
  const resources = [
    { file: 'build-resources/icon.ico', desc: 'Windows icon' },
    { file: 'build-resources/installer.nsh', desc: 'NSIS installer script' }
  ];
  
  let allGood = true;
  for (const resource of resources) {
    if (!checkFile(resource.file, resource.desc)) {
      allGood = false;
    }
  }
  
  return allGood;
}

function checkConfiguration() {
  log('\n⚙️  Configuration Check', 'cyan');
  
  const configs = [
    { file: 'electron-builder.json', desc: 'Electron Builder config' },
    { file: 'package.json', desc: 'Package.json' },
    { file: '.github/workflows/release.yml', desc: 'Release workflow' }
  ];
  
  let allGood = true;
  for (const config of configs) {
    if (!checkFile(config.file, config.desc)) {
      allGood = false;
    }
  }
  
  // Check electron-builder publish config
  const electronBuilder = require('../electron-builder.json');
  if (electronBuilder.publish && electronBuilder.publish.length > 0) {
    const publish = electronBuilder.publish[0];
    if (publish.owner === 'yourusername' || publish.repo === 'youtube-downloader-pro') {
      log('⚠ Update GitHub owner/repo in electron-builder.json', 'yellow');
    } else {
      log('✓ GitHub publish config looks good', 'green');
    }
  }
  
  return allGood;
}

function checkGitStatus() {
  log('\n🔀 Git Status Check', 'cyan');
  
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    
    if (status.trim() === '') {
      log('✓ Working directory is clean', 'green');
      return true;
    } else {
      log('⚠ Working directory has uncommitted changes:', 'yellow');
      console.log(status);
      log('💡 Commit or stash changes before release', 'yellow');
      return false;
    }
  } catch (error) {
    log('⚠ Could not check git status (not a git repository?)', 'yellow');
    return true;
  }
}

function checkBuild() {
  log('\n🏗️  Build Check', 'cyan');
  
  const buildDirs = [
    { dir: 'client/dist', desc: 'Frontend build' }
  ];
  
  let allGood = true;
  for (const build of buildDirs) {
    if (fs.existsSync(build.dir)) {
      log(`✓ ${build.desc} exists`, 'green');
    } else {
      log(`⚠ ${build.desc} not found - will be built during release`, 'yellow');
    }
  }
  
  return allGood;
}

function printSummary(results) {
  log('\n' + '='.repeat(50), 'cyan');
  log('📊 Release Readiness Summary', 'cyan');
  log('='.repeat(50), 'cyan');
  
  const allPassed = Object.values(results).every(r => r);
  
  for (const [check, passed] of Object.entries(results)) {
    const status = passed ? '✓' : '✗';
    const color = passed ? 'green' : 'red';
    log(`${status} ${check}`, color);
  }
  
  log('\n' + '='.repeat(50), 'cyan');
  
  if (allPassed) {
    log('✅ All checks passed! Ready for release.', 'green');
    log('\n📝 Next steps:', 'cyan');
    log('1. Run: npm run release', 'blue');
    log('2. Test the installer on a clean system', 'blue');
    log('3. Generate checksums: node scripts/generate-checksums.js', 'blue');
    log('4. Create GitHub release with tag v1.0.0', 'blue');
    log('5. Upload installer and checksums', 'blue');
    return 0;
  } else {
    log('❌ Some checks failed. Please fix the issues above.', 'red');
    return 1;
  }
}

function main() {
  log('🚀 YouTube Downloader Pro - Release Preparation', 'cyan');
  log('='.repeat(50), 'cyan');
  
  const results = {
    'Version': checkVersion(),
    'Dependencies': checkDependencies(),
    'Binaries': checkBinaries(),
    'Documentation': checkDocumentation(),
    'Build Resources': checkBuildResources(),
    'Configuration': checkConfiguration(),
    'Git Status': checkGitStatus(),
    'Build': checkBuild()
  };
  
  const exitCode = printSummary(results);
  process.exit(exitCode);
}

// Run the script
main();
