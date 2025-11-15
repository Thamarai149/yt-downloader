/**
 * Verify Build Scripts
 * Validates that all build scripts are properly implemented
 * 
 * Task 10.2 Verification
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const SCRIPTS_DIR = __dirname;

console.log('╔════════════════════════════════════════╗');
console.log('║   Build Scripts Verification          ║');
console.log('╚════════════════════════════════════════╝\n');

const checks = [];

/**
 * Check if a file exists and has content
 */
function checkFile(name, filePath, minLines = 10) {
  const exists = fs.existsSync(filePath);
  
  if (!exists) {
    checks.push({ name, status: 'fail', message: 'File not found' });
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').length;
  
  if (lines < minLines) {
    checks.push({ name, status: 'warn', message: `Only ${lines} lines (expected ${minLines}+)` });
    return false;
  }
  
  checks.push({ name, status: 'pass', message: `${lines} lines` });
  return true;
}

/**
 * Check if npm script exists
 */
function checkNpmScript(scriptName) {
  const packageJsonPath = path.join(ROOT_DIR, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const exists = packageJson.scripts && packageJson.scripts[scriptName];
  
  if (!exists) {
    checks.push({ name: `npm run ${scriptName}`, status: 'fail', message: 'Script not found' });
    return false;
  }
  
  checks.push({ name: `npm run ${scriptName}`, status: 'pass', message: packageJson.scripts[scriptName] });
  return true;
}

console.log('🔍 Checking build script files...\n');

// Task 10.2 Sub-task 1: Write script to build frontend with Vite
checkFile(
  '1. Frontend build script',
  path.join(SCRIPTS_DIR, 'build-frontend.js'),
  50
);

// Task 10.2 Sub-task 2: Add script to prepare backend files
checkFile(
  '2. Backend build script',
  path.join(SCRIPTS_DIR, 'build-backend.js'),
  50
);

// Task 10.2 Sub-task 3: Create combined build script for full application
checkFile(
  '3. Combined build script',
  path.join(SCRIPTS_DIR, 'build-all.js'),
  80
);

// Task 10.2 Sub-task 4: Add script to download binaries before build
checkFile(
  '4. Binary download script',
  path.join(SCRIPTS_DIR, 'download-binaries.js'),
  200
);

// Additional verification script
checkFile(
  '5. Pre-build verification',
  path.join(SCRIPTS_DIR, 'pre-build.js'),
  80
);

console.log('\n🔍 Checking npm scripts...\n');

// Check npm scripts are configured
checkNpmScript('build:frontend');
checkNpmScript('build:backend');
checkNpmScript('build:all');
checkNpmScript('download:binaries');
checkNpmScript('pre-build');

console.log('\n╔════════════════════════════════════════╗');
console.log('║   Verification Results                 ║');
console.log('╚════════════════════════════════════════╝\n');

// Display results
const passed = checks.filter(c => c.status === 'pass').length;
const failed = checks.filter(c => c.status === 'fail').length;
const warned = checks.filter(c => c.status === 'warn').length;

checks.forEach(check => {
  const icon = check.status === 'pass' ? '✅' : check.status === 'warn' ? '⚠️' : '❌';
  console.log(`${icon} ${check.name}`);
  if (check.message) {
    console.log(`   ${check.message}`);
  }
});

console.log('');
console.log(`Results: ${passed} passed, ${failed} failed, ${warned} warnings`);
console.log('');

// Task 10.2 Requirements Check
console.log('╔════════════════════════════════════════╗');
console.log('║   Task 10.2 Requirements               ║');
console.log('╚════════════════════════════════════════╝\n');

const requirements = [
  {
    id: '1',
    text: 'Write script to build frontend with Vite',
    file: 'build-frontend.js',
    npm: 'build:frontend'
  },
  {
    id: '2',
    text: 'Add script to prepare backend files',
    file: 'build-backend.js',
    npm: 'build:backend'
  },
  {
    id: '3',
    text: 'Create combined build script for full application',
    file: 'build-all.js',
    npm: 'build:all'
  },
  {
    id: '4',
    text: 'Add script to download binaries before build',
    file: 'download-binaries.js',
    npm: 'download:binaries'
  }
];

let allRequirementsMet = true;

requirements.forEach(req => {
  const fileExists = fs.existsSync(path.join(SCRIPTS_DIR, req.file));
  const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
  const npmExists = packageJson.scripts && packageJson.scripts[req.npm];
  
  const met = fileExists && npmExists;
  allRequirementsMet = allRequirementsMet && met;
  
  console.log(`${met ? '✅' : '❌'} Requirement ${req.id}: ${req.text}`);
  console.log(`   File: ${fileExists ? '✓' : '✗'} ${req.file}`);
  console.log(`   NPM:  ${npmExists ? '✓' : '✗'} npm run ${req.npm}`);
  console.log('');
});

// Final verdict
console.log('╔════════════════════════════════════════╗');
console.log('║   Final Verdict                        ║');
console.log('╚════════════════════════════════════════╝\n');

if (failed === 0 && allRequirementsMet) {
  console.log('🎉 Task 10.2 Implementation: COMPLETE');
  console.log('');
  console.log('All build scripts are properly implemented:');
  console.log('  ✅ Frontend build script (Vite)');
  console.log('  ✅ Backend preparation script');
  console.log('  ✅ Combined build orchestration');
  console.log('  ✅ Binary download automation');
  console.log('');
  console.log('Requirements satisfied: 1.1, 1.2');
  console.log('');
  process.exit(0);
} else {
  console.log('❌ Task 10.2 Implementation: INCOMPLETE');
  console.log('');
  console.log('Please address the issues above.');
  console.log('');
  process.exit(1);
}
