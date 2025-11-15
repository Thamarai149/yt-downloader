/**
 * Code Signing Configuration Module
 * Provides utilities for code signing configuration
 * 
 * Requirements: 1.1
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const ENV_SIGNING_FILE = path.join(ROOT_DIR, '.env.signing');

/**
 * Load environment variables from .env.signing file
 */
function loadSigningEnv() {
  if (!fs.existsSync(ENV_SIGNING_FILE)) {
    return false;
  }

  const content = fs.readFileSync(ENV_SIGNING_FILE, 'utf8');
  const lines = content.split('\n');

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }

    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=');
    
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });

  return true;
}

/**
 * Check if code signing is configured
 */
function isSigningConfigured() {
  // Check for Windows signing
  const hasWindowsSigning = !!(process.env.CSC_LINK && process.env.CSC_KEY_PASSWORD);
  
  // Check for macOS signing
  const hasMacSigning = !!(process.env.CSC_NAME || 
    (process.env.APPLE_ID && process.env.APPLE_ID_PASSWORD));

  return {
    windows: hasWindowsSigning,
    macos: hasMacSigning,
    any: hasWindowsSigning || hasMacSigning
  };
}

/**
 * Get signing configuration for electron-builder
 */
function getSigningConfig() {
  const signing = isSigningConfigured();
  
  if (!signing.any) {
    return null;
  }

  const config = {};

  // Windows configuration
  if (signing.windows) {
    config.win = {
      certificateFile: process.env.CSC_LINK,
      certificatePassword: process.env.CSC_KEY_PASSWORD,
      signingHashAlgorithms: ['sha256'],
      signDlls: false,
      rfc3161TimeStampServer: 'http://timestamp.digicert.com'
    };
  }

  // macOS configuration
  if (signing.macos) {
    config.mac = {
      identity: process.env.CSC_NAME,
      hardenedRuntime: true,
      gatekeeperAssess: false
    };

    if (process.env.APPLE_ID && process.env.APPLE_ID_PASSWORD) {
      config.afterSign = 'scripts/notarize.js';
    }
  }

  return config;
}

/**
 * Validate certificate file
 */
function validateCertificate() {
  const certPath = process.env.CSC_LINK;
  
  if (!certPath) {
    return { valid: false, error: 'CSC_LINK not set' };
  }

  // Check if it's base64 encoded
  if (certPath.startsWith('data:')) {
    return { valid: true, type: 'base64' };
  }

  // Check if file exists
  if (!fs.existsSync(certPath)) {
    return { valid: false, error: `Certificate file not found: ${certPath}` };
  }

  // Check file extension
  const ext = path.extname(certPath).toLowerCase();
  if (ext !== '.pfx' && ext !== '.p12') {
    return { 
      valid: false, 
      error: `Invalid certificate format: ${ext}. Expected .pfx or .p12` 
    };
  }

  return { valid: true, type: 'file', path: certPath };
}

/**
 * Print signing status
 */
function printSigningStatus() {
  const signing = isSigningConfigured();
  
  console.log('\n📝 Code Signing Status:');
  console.log('─────────────────────────');
  
  if (signing.windows) {
    console.log('✅ Windows: Configured');
    const cert = validateCertificate();
    if (cert.valid) {
      console.log(`   Certificate: ${cert.type === 'base64' ? 'Base64 encoded' : cert.path}`);
    } else {
      console.log(`   ⚠️  ${cert.error}`);
    }
  } else {
    console.log('⚠️  Windows: Not configured');
  }
  
  if (signing.macos) {
    console.log('✅ macOS: Configured');
    if (process.env.CSC_NAME) {
      console.log(`   Identity: ${process.env.CSC_NAME}`);
    }
  } else {
    console.log('⚠️  macOS: Not configured');
  }
  
  if (!signing.any) {
    console.log('\n💡 To enable code signing:');
    console.log('   1. Run: npm run setup:signing');
    console.log('   2. Or set environment variables manually');
    console.log('   3. See CODE_SIGNING.md for details');
  }
  
  console.log('');
}

module.exports = {
  loadSigningEnv,
  isSigningConfigured,
  getSigningConfig,
  validateCertificate,
  printSigningStatus
};
