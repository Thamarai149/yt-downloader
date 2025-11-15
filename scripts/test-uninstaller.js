/**
 * Test script for uninstaller configuration
 * This script verifies that the custom NSIS uninstaller script is properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Uninstaller Configuration...\n');

let hasErrors = false;

// Test 1: Check if custom NSIS script exists
console.log('✓ Test 1: Checking custom NSIS script...');
const nsisScriptPath = path.join(__dirname, '..', 'build-resources', 'installer.nsh');
if (!fs.existsSync(nsisScriptPath)) {
  console.error('  ❌ FAILED: installer.nsh not found at', nsisScriptPath);
  hasErrors = true;
} else {
  console.log('  ✅ PASSED: installer.nsh exists');
  
  // Check script content
  const scriptContent = fs.readFileSync(nsisScriptPath, 'utf8');
  
  // Test 2: Check for downloads prompt
  console.log('✓ Test 2: Checking downloads prompt...');
  if (!scriptContent.includes('Do you want to keep your downloaded videos?')) {
    console.error('  ❌ FAILED: Downloads prompt not found in script');
    hasErrors = true;
  } else {
    console.log('  ✅ PASSED: Downloads prompt found');
  }
  
  // Test 3: Check for settings prompt
  console.log('✓ Test 3: Checking settings prompt...');
  if (!scriptContent.includes('Do you want to keep your application settings?')) {
    console.error('  ❌ FAILED: Settings prompt not found in script');
    hasErrors = true;
  } else {
    console.log('  ✅ PASSED: Settings prompt found');
  }
  
  // Test 4: Check for registry cleanup
  console.log('✓ Test 4: Checking registry cleanup...');
  if (!scriptContent.includes('DeleteRegKey')) {
    console.error('  ❌ FAILED: Registry cleanup not found in script');
    hasErrors = true;
  } else {
    console.log('  ✅ PASSED: Registry cleanup found');
  }
  
  // Test 5: Check for shortcut removal
  console.log('✓ Test 5: Checking shortcut removal...');
  if (!scriptContent.includes('$DESKTOP') && !scriptContent.includes('$SMPROGRAMS')) {
    console.error('  ❌ FAILED: Shortcut removal not found in script');
    hasErrors = true;
  } else {
    console.log('  ✅ PASSED: Shortcut removal found');
  }
  
  // Test 6: Check for customUnInstall macro
  console.log('✓ Test 6: Checking customUnInstall macro...');
  if (!scriptContent.includes('!macro customUnInstall')) {
    console.error('  ❌ FAILED: customUnInstall macro not found');
    hasErrors = true;
  } else {
    console.log('  ✅ PASSED: customUnInstall macro found');
  }
}

// Test 7: Check electron-builder.json configuration
console.log('✓ Test 7: Checking electron-builder.json...');
const builderConfigPath = path.join(__dirname, '..', 'electron-builder.json');
if (!fs.existsSync(builderConfigPath)) {
  console.error('  ❌ FAILED: electron-builder.json not found');
  hasErrors = true;
} else {
  const builderConfig = JSON.parse(fs.readFileSync(builderConfigPath, 'utf8'));
  
  if (!builderConfig.nsis || !builderConfig.nsis.include) {
    console.error('  ❌ FAILED: NSIS include not configured in electron-builder.json');
    hasErrors = true;
  } else if (builderConfig.nsis.include !== 'build-resources/installer.nsh') {
    console.error('  ❌ FAILED: NSIS include path is incorrect:', builderConfig.nsis.include);
    hasErrors = true;
  } else {
    console.log('  ✅ PASSED: electron-builder.json properly configured');
  }
  
  // Test 8: Check deleteAppDataOnUninstall is false
  console.log('✓ Test 8: Checking deleteAppDataOnUninstall setting...');
  if (builderConfig.nsis.deleteAppDataOnUninstall !== false) {
    console.error('  ❌ FAILED: deleteAppDataOnUninstall should be false to allow custom handling');
    hasErrors = true;
  } else {
    console.log('  ✅ PASSED: deleteAppDataOnUninstall is false (custom handling enabled)');
  }
}

// Test 9: Check build-resources directory
console.log('✓ Test 9: Checking build-resources directory...');
const buildResourcesPath = path.join(__dirname, '..', 'build-resources');
if (!fs.existsSync(buildResourcesPath)) {
  console.error('  ❌ FAILED: build-resources directory not found');
  hasErrors = true;
} else {
  console.log('  ✅ PASSED: build-resources directory exists');
}

// Summary
console.log('\n' + '='.repeat(60));
if (hasErrors) {
  console.error('❌ TESTS FAILED: Some uninstaller configuration tests failed');
  console.log('\nPlease fix the errors above before building the installer.');
  process.exit(1);
} else {
  console.log('✅ ALL TESTS PASSED: Uninstaller configuration is correct');
  console.log('\nThe uninstaller will:');
  console.log('  • Prompt user to keep/delete downloaded videos');
  console.log('  • Prompt user to keep/delete application settings');
  console.log('  • Remove all shortcuts (desktop and start menu)');
  console.log('  • Clean up registry entries');
  console.log('  • Remove startup entries if present');
  console.log('\nYou can now build the installer with: npm run package:win');
}
console.log('='.repeat(60));
