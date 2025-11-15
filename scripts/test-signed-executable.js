/**
 * Test Signed Executable Script
 * Verifies that the built executable is properly signed
 * 
 * Requirements: 1.1
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist-electron');

console.log('╔════════════════════════════════════════╗');
console.log('║   Test Signed Executable               ║');
console.log('╚════════════════════════════════════════╝\n');

/**
 * Find the installer executable
 */
function findInstaller() {
  if (!fs.existsSync(DIST_DIR)) {
    console.log('❌ dist-electron directory not found');
    console.log('   Run: npm run package:win\n');
    return null;
  }

  const files = fs.readdirSync(DIST_DIR);
  const installer = files.find(f => f.endsWith('.exe') && f.includes('Setup'));

  if (!installer) {
    console.log('❌ No installer found in dist-electron');
    console.log('   Run: npm run package:win\n');
    return null;
  }

  return path.join(DIST_DIR, installer);
}

/**
 * Check if file is signed (Windows)
 */
function checkWindowsSignature(filePath) {
  console.log(`🔍 Checking signature: ${path.basename(filePath)}\n`);

  try {
    // Use PowerShell to check signature
    const command = `powershell -Command "Get-AuthenticodeSignature '${filePath}' | Select-Object Status, SignerCertificate | Format-List"`;
    const output = execSync(command, { encoding: 'utf8' });

    console.log('Signature Information:');
    console.log('─────────────────────────');
    console.log(output);

    // Parse status
    const statusMatch = output.match(/Status\s*:\s*(\w+)/);
    const status = statusMatch ? statusMatch[1] : 'Unknown';

    if (status === 'Valid') {
      console.log('✅ Signature is VALID\n');
      
      // Get certificate details
      try {
        const certCommand = `powershell -Command "Get-AuthenticodeSignature '${filePath}' | Select-Object -ExpandProperty SignerCertificate | Select-Object Subject, Issuer, NotAfter | Format-List"`;
        const certOutput = execSync(certCommand, { encoding: 'utf8' });
        console.log('Certificate Details:');
        console.log('─────────────────────────');
        console.log(certOutput);
      } catch (error) {
        // Certificate details not critical
      }

      return true;
    } else if (status === 'NotSigned') {
      console.log('⚠️  File is NOT SIGNED\n');
      console.log('This is expected if you haven\'t configured code signing.');
      console.log('See CODE_SIGNING.md for setup instructions.\n');
      return false;
    } else {
      console.log(`⚠️  Signature status: ${status}\n`);
      return false;
    }
  } catch (error) {
    console.log('❌ Error checking signature:', error.message);
    console.log('\nNote: This requires PowerShell on Windows.\n');
    return false;
  }
}

/**
 * Check file properties
 */
function checkFileProperties(filePath) {
  console.log('📊 File Properties:');
  console.log('─────────────────────────');

  const stats = fs.statSync(filePath);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

  console.log(`Size: ${sizeMB} MB`);
  console.log(`Created: ${stats.birthtime.toLocaleString()}`);
  console.log(`Modified: ${stats.mtime.toLocaleString()}\n`);
}

/**
 * Test executable launch (optional)
 */
function testExecutableLaunch(filePath) {
  console.log('🚀 Launch Test:');
  console.log('─────────────────────────');
  console.log('To test the installer, run:');
  console.log(`   "${filePath}"\n`);
  console.log('⚠️  This will install the application on your system.\n');
}

/**
 * Main test function
 */
function main() {
  // Check platform
  if (process.platform !== 'win32') {
    console.log('⚠️  This script is designed for Windows');
    console.log('   For macOS, use: codesign -dv --verbose=4 <file>\n');
    process.exit(0);
  }

  // Find installer
  const installerPath = findInstaller();
  if (!installerPath) {
    process.exit(1);
  }

  console.log(`Found installer: ${path.basename(installerPath)}\n`);

  // Check file properties
  checkFileProperties(installerPath);

  // Check signature
  const isSigned = checkWindowsSignature(installerPath);

  // Test launch instructions
  testExecutableLaunch(installerPath);

  // Summary
  console.log('╔════════════════════════════════════════╗');
  console.log('║   Test Summary                         ║');
  console.log('╚════════════════════════════════════════╝\n');

  if (isSigned) {
    console.log('✅ Executable is properly signed');
    console.log('   Users will not see SmartScreen warnings');
    console.log('   Auto-updates will work correctly\n');
  } else {
    console.log('⚠️  Executable is not signed');
    console.log('   Users may see SmartScreen warnings');
    console.log('   Consider setting up code signing for production\n');
    console.log('📖 See CODE_SIGNING.md for setup instructions\n');
  }

  process.exit(0);
}

main();
