#!/usr/bin/env node

/**
 * Validation script for electron-builder.json configuration
 * Checks that all required fields are present and valid
 */

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'electron-builder.json');
const PACKAGE_PATH = path.join(__dirname, '..', 'package.json');

console.log('🔍 Validating Electron Builder Configuration...\n');

// Load configuration
let config;
try {
  const configContent = fs.readFileSync(CONFIG_PATH, 'utf8');
  config = JSON.parse(configContent);
  console.log('✅ electron-builder.json is valid JSON');
} catch (error) {
  console.error('❌ Failed to parse electron-builder.json:', error.message);
  process.exit(1);
}

// Load package.json
let packageJson;
try {
  const packageContent = fs.readFileSync(PACKAGE_PATH, 'utf8');
  packageJson = JSON.parse(packageContent);
  console.log('✅ package.json is valid JSON');
} catch (error) {
  console.error('❌ Failed to parse package.json:', error.message);
  process.exit(1);
}

// Validation checks
const checks = [];

// Check required metadata
checks.push({
  name: 'App ID configured',
  test: () => config.appId && config.appId.length > 0,
  value: config.appId
});

checks.push({
  name: 'Product name configured',
  test: () => config.productName && config.productName.length > 0,
  value: config.productName
});

checks.push({
  name: 'Description configured',
  test: () => config.description && config.description.length > 0,
  value: config.description
});

checks.push({
  name: 'Copyright configured',
  test: () => config.copyright && config.copyright.length > 0,
  value: config.copyright
});

// Check directories
checks.push({
  name: 'Output directory configured',
  test: () => config.directories && config.directories.output,
  value: config.directories?.output
});

checks.push({
  name: 'Build resources directory configured',
  test: () => config.directories && config.directories.buildResources,
  value: config.directories?.buildResources
});

// Check file patterns
checks.push({
  name: 'File inclusion patterns configured',
  test: () => Array.isArray(config.files) && config.files.length > 0,
  value: `${config.files?.length || 0} patterns`
});

checks.push({
  name: 'Frontend files included',
  test: () => config.files && config.files.some(f => f.includes('client/dist')),
  value: 'client/dist/**/*'
});

checks.push({
  name: 'Backend files included',
  test: () => config.files && config.files.some(f => f.includes('backend')),
  value: 'backend/**/*'
});

checks.push({
  name: 'Electron files included',
  test: () => config.files && config.files.some(f => f.includes('src/electron')),
  value: 'src/electron/**/*'
});

// Check extra resources (binaries)
checks.push({
  name: 'Extra resources configured',
  test: () => Array.isArray(config.extraResources) && config.extraResources.length > 0,
  value: `${config.extraResources?.length || 0} resources`
});

checks.push({
  name: 'Binaries included in resources',
  test: () => config.extraResources && config.extraResources.some(r => r.from === 'binaries'),
  value: 'binaries directory'
});

// Check ASAR configuration
checks.push({
  name: 'ASAR packaging enabled',
  test: () => config.asar === true,
  value: config.asar
});

checks.push({
  name: 'Backend node_modules unpacked',
  test: () => Array.isArray(config.asarUnpack) && 
              config.asarUnpack.some(p => p.includes('backend/node_modules')),
  value: 'backend/node_modules/**/*'
});

// Check Windows configuration
checks.push({
  name: 'Windows target configured',
  test: () => config.win && Array.isArray(config.win.target) && config.win.target.length > 0,
  value: config.win?.target?.[0]?.target
});

checks.push({
  name: 'NSIS installer configured',
  test: () => config.win?.target?.some(t => t.target === 'nsis'),
  value: 'nsis'
});

checks.push({
  name: 'x64 architecture configured',
  test: () => config.win?.target?.some(t => t.arch?.includes('x64')),
  value: 'x64'
});

checks.push({
  name: 'Artifact name pattern configured',
  test: () => config.win && config.win.artifactName,
  value: config.win?.artifactName
});

checks.push({
  name: 'Execution level configured',
  test: () => config.win && config.win.requestedExecutionLevel === 'asInvoker',
  value: config.win?.requestedExecutionLevel
});

// Check NSIS configuration
checks.push({
  name: 'NSIS one-click disabled',
  test: () => config.nsis && config.nsis.oneClick === false,
  value: config.nsis?.oneClick
});

checks.push({
  name: 'Installation directory selection enabled',
  test: () => config.nsis && config.nsis.allowToChangeInstallationDirectory === true,
  value: config.nsis?.allowToChangeInstallationDirectory
});

checks.push({
  name: 'Desktop shortcut configured',
  test: () => config.nsis && (config.nsis.createDesktopShortcut === true || 
                               config.nsis.createDesktopShortcut === 'always'),
  value: config.nsis?.createDesktopShortcut
});

checks.push({
  name: 'Start menu shortcut enabled',
  test: () => config.nsis && config.nsis.createStartMenuShortcut === true,
  value: config.nsis?.createStartMenuShortcut
});

checks.push({
  name: 'Shortcut name configured',
  test: () => config.nsis && config.nsis.shortcutName,
  value: config.nsis?.shortcutName
});

checks.push({
  name: 'License file configured',
  test: () => config.nsis && config.nsis.license === 'LICENSE',
  value: config.nsis?.license
});

checks.push({
  name: 'Per-user installation configured',
  test: () => config.nsis && config.nsis.perMachine === false,
  value: `perMachine: ${config.nsis?.perMachine}`
});

checks.push({
  name: 'Run after finish enabled',
  test: () => config.nsis && config.nsis.runAfterFinish === true,
  value: config.nsis?.runAfterFinish
});

// Check publish configuration
checks.push({
  name: 'Publish configuration present',
  test: () => Array.isArray(config.publish) && config.publish.length > 0,
  value: config.publish?.[0]?.provider
});

// Check package.json integration
checks.push({
  name: 'Main entry point in package.json',
  test: () => packageJson.main && packageJson.main.includes('electron'),
  value: packageJson.main
});

checks.push({
  name: 'Electron dependency installed',
  test: () => packageJson.devDependencies && packageJson.devDependencies.electron,
  value: packageJson.devDependencies?.electron
});

checks.push({
  name: 'Electron Builder dependency installed',
  test: () => packageJson.devDependencies && packageJson.devDependencies['electron-builder'],
  value: packageJson.devDependencies?.['electron-builder']
});

// Check file existence
const LICENSE_PATH = path.join(__dirname, '..', 'LICENSE');
checks.push({
  name: 'LICENSE file exists',
  test: () => fs.existsSync(LICENSE_PATH),
  value: LICENSE_PATH
});

const BUILD_RESOURCES_PATH = path.join(__dirname, '..', 'build-resources');
checks.push({
  name: 'Build resources directory exists',
  test: () => fs.existsSync(BUILD_RESOURCES_PATH),
  value: BUILD_RESOURCES_PATH
});

// Run all checks
console.log('\n📋 Running validation checks:\n');

let passed = 0;
let failed = 0;

checks.forEach(check => {
  try {
    const result = check.test();
    if (result) {
      console.log(`✅ ${check.name}`);
      if (check.value) {
        console.log(`   → ${check.value}`);
      }
      passed++;
    } else {
      console.log(`❌ ${check.name}`);
      if (check.value) {
        console.log(`   → ${check.value}`);
      }
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${check.name} (error: ${error.message})`);
    failed++;
  }
});

// Summary
console.log('\n' + '='.repeat(60));
console.log(`\n📊 Validation Summary:`);
console.log(`   ✅ Passed: ${passed}`);
console.log(`   ❌ Failed: ${failed}`);
console.log(`   📈 Total:  ${checks.length}`);
console.log(`   🎯 Success Rate: ${Math.round((passed / checks.length) * 100)}%`);

if (failed === 0) {
  console.log('\n🎉 All validation checks passed!');
  console.log('✨ Electron Builder configuration is ready for use.\n');
  process.exit(0);
} else {
  console.log('\n⚠️  Some validation checks failed.');
  console.log('📝 Please review the configuration and fix any issues.\n');
  process.exit(1);
}
