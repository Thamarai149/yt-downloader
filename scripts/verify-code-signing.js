/**
 * Code Signing Verification Script
 * Verifies that code signing is configured correctly
 * 
 * Requirements: 1.1
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
const ENV_SIGNING_FILE = path.join(ROOT_DIR, '.env.signing');
const ELECTRON_BUILDER_CONFIG = path.join(ROOT_DIR, 'electron-builder.json');

console.log('╔════════════════════════════════════════╗');
console.log('║   Code Signing Verification            ║');
console.log('╚════════════════════════════════════════╝\n');

let hasErrors = false;
const warnings = [];

/**
 * Check environment variables
 */
function checkEnvironmentVariables() {
  console.log('🔍 Checking environment variables...\n');
  
  const requiredVars = {
    windows: ['CSC_LINK', 'CSC_KEY_PASSWORD'],
    macos: ['CSC_NAME', 'APPLE_ID', 'APPLE_ID_PASSWORD']
  };
  
  // Check Windows variables
  console.log('Windows:');
  const hasWindowsVars = requiredVars.windows.every(varName => {
    const exists = !!process.env[varName];
    const status = exists ? '✅' : '⚠️';
    console.log(`  ${status} ${varName}: ${exists ? 'Set' : 'Not set'}`);
    return exists;
  });
  
  console.log('');
  
  // Check macOS variables
  console.log('macOS:');
  const hasMacVars = requiredVars.macos.every(varName => {
    const exists = !!process.env[varName];
    const status = exists ? '✅' : '⚠️';
    console.log(`  ${status} ${varName}: ${exists ? 'Set' : 'Not set'}`);
    return exists;
  });
  
  console.log('');
  
  if (!hasWindowsVars && !hasMacVars) {
    warnings.push('No code signing environment variables found');
    console.log('⚠️  No code signing configured for any platform\n');
  } else {
    if (hasWindowsVars) {
      console.log('✅ Windows code signing configured\n');
    }
    if (hasMacVars) {
      console.log('✅ macOS code signing configured\n');
    }
  }
}

/**
 * Check .env.signing file
 */
function checkEnvSigningFile() {
  console.log('🔍 Checking .env.signing file...\n');
  
  if (fs.existsSync(ENV_SIGNING_FILE)) {
    console.log('✅ .env.signing file exists');
    
    const content = fs.readFileSync(ENV_SIGNING_FILE, 'utf8');
    const lines = content.split('\n').filter(line => 
      line.trim() && !line.trim().startsWith('#')
    );
    
    console.log(`   Found ${lines.length} configuration lines\n`);
  } else {
    console.log('⚠️  .env.signing file not found');
    console.log('   Run: node scripts/setup-code-signing.js\n');
    warnings.push('.env.signing file not found');
  }
}

/**
 * Check certificate file (Windows)
 */
function checkCertificateFile() {
  console.log('🔍 Checking certificate file...\n');
  
  const certPath = process.env.CSC_LINK;
  
  if (!certPath) {
    console.log('⚠️  CSC_LINK not set\n');
    return;
  }
  
  // Check if it's a file path or base64
  if (certPath.startsWith('data:')) {
    console.log('✅ Using base64 encoded certificate\n');
    return;
  }
  
  // Check if file exists
  if (fs.existsSync(certPath)) {
    console.log(`✅ Certificate file found: ${certPath}`);
    
    const stats = fs.statSync(certPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`   Size: ${sizeMB} MB\n`);
  } else {
    console.log(`❌ Certificate file not found: ${certPath}\n`);
    hasErrors = true;
  }
}

/**
 * Check electron-builder configuration
 */
function checkElectronBuilderConfig() {
  console.log('🔍 Checking electron-builder.json...\n');
  
  if (!fs.existsSync(ELECTRON_BUILDER_CONFIG)) {
    console.log('❌ electron-builder.json not found\n');
    hasErrors = true;
    return;
  }
  
  const config = JSON.parse(fs.readFileSync(ELECTRON_BUILDER_CONFIG, 'utf8'));
  
  // Check Windows configuration
  if (config.win) {
    console.log('Windows configuration:');
    console.log(`  verifyUpdateCodeSignature: ${config.win.verifyUpdateCodeSignature}`);
    
    if (config.win.verifyUpdateCodeSignature === false) {
      warnings.push('verifyUpdateCodeSignature is disabled');
      console.log('  ⚠️  Code signature verification is disabled');
    }
    
    if (config.win.certificateFile) {
      warnings.push('Certificate file path in electron-builder.json');
      console.log('  ⚠️  Certificate file path in config (use environment variables instead)');
    }
    
    console.log('');
  }
  
  // Check macOS configuration
  if (config.mac) {
    console.log('macOS configuration:');
    console.log(`  hardenedRuntime: ${config.mac.hardenedRuntime}`);
    console.log(`  gatekeeperAssess: ${config.mac.gatekeeperAssess}`);
    
    if (config.mac.entitlements) {
      const entitlementsPath = path.join(ROOT_DIR, config.mac.entitlements);
      if (fs.existsSync(entitlementsPath)) {
        console.log(`  ✅ Entitlements file found`);
      } else {
        console.log(`  ⚠️  Entitlements file not found: ${config.mac.entitlements}`);
        warnings.push('macOS entitlements file missing');
      }
    }
    
    console.log('');
  }
}

/**
 * Check signing tools availability
 */
function checkSigningTools() {
  console.log('🔍 Checking signing tools...\n');
  
  if (process.platform === 'win32') {
    try {
      execSync('signtool /?', { stdio: 'ignore' });
      console.log('✅ SignTool available (Windows SDK)\n');
    } catch (error) {
      console.log('⚠️  SignTool not found');
      console.log('   Install Windows SDK for code signing\n');
      warnings.push('SignTool not available');
    }
  } else if (process.platform === 'darwin') {
    try {
      execSync('codesign --version', { stdio: 'ignore' });
      console.log('✅ codesign available (Xcode)\n');
    } catch (error) {
      console.log('⚠️  codesign not found');
      console.log('   Install Xcode Command Line Tools\n');
      warnings.push('codesign not available');
    }
  }
}

/**
 * Main verification
 */
function main() {
  checkEnvironmentVariables();
  checkEnvSigningFile();
  checkCertificateFile();
  checkElectronBuilderConfig();
  checkSigningTools();
  
  // Summary
  console.log('╔════════════════════════════════════════╗');
  console.log('║   Verification Summary                 ║');
  console.log('╚════════════════════════════════════════╝\n');
  
  if (hasErrors) {
    console.log('❌ Verification failed with errors');
    console.log('   Please fix the errors above before building\n');
    process.exit(1);
  } else if (warnings.length > 0) {
    console.log('⚠️  Verification completed with warnings:');
    warnings.forEach(w => console.log(`   • ${w}`));
    console.log('');
    console.log('The build will work but may not be fully signed.');
    console.log('See CODE_SIGNING.md for more information.\n');
    process.exit(0);
  } else {
    console.log('✅ All checks passed');
    console.log('');
    console.log('🚀 Ready to build signed application');
    console.log('   Run: npm run package:win (or package:mac)\n');
    process.exit(0);
  }
}

main();
