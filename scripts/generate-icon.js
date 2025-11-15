/**
 * Generate application icon
 * Creates a simple YouTube downloader icon (512x512 PNG)
 */

const fs = require('fs');
const path = require('path');

// Simple SVG icon
const iconSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <!-- Background gradient -->
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF0000;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#CC0000;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="8"/>
      <feOffset dx="0" dy="4" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.3"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Red background with rounded corners -->
  <rect width="512" height="512" rx="80" fill="url(#grad)"/>
  
  <!-- White play button (YouTube style) -->
  <g filter="url(#shadow)">
    <polygon points="180,140 180,372 380,256" fill="#FFFFFF"/>
  </g>
  
  <!-- Download arrow -->
  <g filter="url(#shadow)">
    <!-- Arrow shaft -->
    <rect x="236" y="320" width="40" height="100" fill="#FFFFFF"/>
    
    <!-- Arrow head -->
    <polygon points="256,450 180,380 220,380 220,400 292,400 292,380 332,380" fill="#FFFFFF"/>
  </g>
</svg>`;

// Create build-resources directory if it doesn't exist
const buildResourcesDir = path.join(__dirname, '..', 'build-resources');
if (!fs.existsSync(buildResourcesDir)) {
  fs.mkdirSync(buildResourcesDir, { recursive: true });
}

// Save SVG icon
const iconPath = path.join(buildResourcesDir, 'icon.svg');
fs.writeFileSync(iconPath, iconSVG);

console.log('✅ Icon generated successfully!');
console.log(`📁 Location: ${iconPath}`);
console.log('');
console.log('To convert to ICO format for Windows:');
console.log('1. Install ImageMagick: https://imagemagick.org/script/download.php');
console.log('2. Run: magick convert icon.svg -define icon:auto-resize=256,128,96,64,48,32,16 icon.ico');
console.log('');
console.log('Or use an online converter:');
console.log('• https://convertio.co/svg-ico/');
console.log('• https://cloudconvert.com/svg-to-ico');
console.log('');
console.log('For now, electron-builder will use the SVG/PNG automatically.');
