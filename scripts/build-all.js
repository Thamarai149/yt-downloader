/**
 * Build All Script
 * Orchestrates the complete build process for the Electron application
 * 
 * Steps:
 * 1. Download binaries (yt-dlp, ffmpeg)
 * 2. Build frontend (React + Vite)
 * 3. Prepare backend (production dependencies)
 * 4. Package with Electron Builder
 * 
 * Requirements: 1.1, 1.2
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT_DIR = path.join(__dirname, '..');

console.log('╔════════════════════════════════════════╗');
console.log('║   Complete Build Script                ║');
console.log('╚════════════════════════════════════════╝\n');

const startTime = Date.now();

/**
 * Execute a build step
 */
function executeStep(stepName, command, options = {}) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🚀 ${stepName}`);
  console.log('='.repeat(50));
  
  const stepStart = Date.now();
  
  try {
    execSync(command, {
      cwd: options.cwd || ROOT_DIR,
      stdio: 'inherit',
      env: {
        ...process.env,
        ...options.env
      }
    });
    
    const stepDuration = ((Date.now() - stepStart) / 1000).toFixed(1);
    console.log(`✅ ${stepName} completed in ${stepDuration}s`);
    return true;
  } catch (error) {
    console.error(`❌ ${stepName} failed:`, error.message);
    return false;
  }
}

/**
 * Main build process
 */
async function main() {
  const steps = [
    {
      name: 'Step 1: Download Binaries',
      command: 'node scripts/download-binaries.js',
      required: true
    },
    {
      name: 'Step 2: Build Frontend',
      command: 'node scripts/build-frontend.js',
      required: true
    },
    {
      name: 'Step 3: Prepare Backend',
      command: 'node scripts/build-backend.js',
      required: true
    }
  ];

  const results = [];

  // Execute all steps
  for (const step of steps) {
    const success = executeStep(step.name, step.command);
    results.push({ name: step.name, success, required: step.required });
    
    if (!success && step.required) {
      console.error(`\n❌ Build failed at: ${step.name}`);
      console.error('   This is a required step. Aborting build.');
      process.exit(1);
    }
  }

  // Summary
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log('\n' + '='.repeat(50));
  console.log('╔════════════════════════════════════════╗');
  console.log('║   Build Summary                        ║');
  console.log('╚════════════════════════════════════════╝');
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
  });
  
  console.log('');
  console.log(`⏱️  Total build time: ${totalDuration}s`);
  
  const allSuccess = results.every(r => !r.required || r.success);
  
  if (allSuccess) {
    console.log('\n🎉 Build completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('  • Run "npm run package:win" to create Windows installer');
    console.log('  • Run "npm run electron:build" to build for all platforms');
    console.log('');
    process.exit(0);
  } else {
    console.log('\n⚠️  Build completed with errors');
    console.log('   Please check the errors above and try again.');
    console.log('');
    process.exit(1);
  }
}

// Run the build
main().catch((error) => {
  console.error('\n❌ Fatal error:', error.message);
  console.error(error.stack);
  process.exit(1);
});
