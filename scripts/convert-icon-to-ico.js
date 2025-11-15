/**
 * Convert SVG icon to ICO format for Windows
 * Uses png-to-ico package
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const buildResourcesDir = path.join(__dirname, '..', 'build-resources');
const svgPath = path.join(buildResourcesDir, 'icon.svg');
const icoPath = path.join(buildResourcesDir, 'icon.ico');

console.log('🎨 Converting icon to ICO format...\n');

// Check if SVG exists
if (!fs.existsSync(svgPath)) {
  console.error('❌ icon.svg not found. Run: node scripts/generate-icon.js');
  process.exit(1);
}

// Try to use ImageMagick if available
try {
  console.log('Attempting to use ImageMagick...');
  execSync(`magick convert "${svgPath}" -define icon:auto-resize=256,128,96,64,48,32,16 "${icoPath}"`, {
    stdio: 'inherit'
  });
  console.log('✅ Icon converted successfully using ImageMagick!');
  console.log(`📁 Location: ${icoPath}\n`);
  process.exit(0);
} catch (error) {
  console.log('⚠️  ImageMagick not found, trying alternative method...\n');
}

// Alternative: Use online converter instructions
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  Manual Icon Conversion Required                          ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');
console.log('Please convert icon.svg to icon.ico manually:\n');
console.log('Option 1: Install ImageMagick');
console.log('  1. Download: https://imagemagick.org/script/download.php');
console.log('  2. Install and add to PATH');
console.log('  3. Run this script again\n');
console.log('Option 2: Use Online Converter');
console.log('  1. Open: https://convertio.co/svg-ico/');
console.log('  2. Upload: build-resources/icon.svg');
console.log('  3. Download as: icon.ico');
console.log('  4. Save to: build-resources/icon.ico\n');
console.log('Option 3: Use CloudConvert');
console.log('  1. Open: https://cloudconvert.com/svg-to-ico');
console.log('  2. Upload icon.svg');
console.log('  3. Download and save as icon.ico\n');
console.log('After conversion, rebuild your app with: npm run package:win\n');
