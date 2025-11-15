/**
 * Generate SHA256 checksums for release artifacts
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const distDir = path.join(__dirname, '../dist-electron');

/**
 * Calculate SHA256 hash of a file
 */
function calculateHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * Generate checksums for all installer files
 */
async function generateChecksums() {
  try {
    console.log('Generating checksums...');
    
    // Check if dist directory exists
    if (!fs.existsSync(distDir)) {
      console.error('Error: dist-electron directory not found');
      console.error('Please run "npm run release" first');
      process.exit(1);
    }
    
    // Find all .exe files
    const files = fs.readdirSync(distDir);
    const exeFiles = files.filter(file => file.endsWith('.exe'));
    
    if (exeFiles.length === 0) {
      console.error('Error: No installer files found in dist-electron');
      process.exit(1);
    }
    
    console.log(`Found ${exeFiles.length} installer file(s)`);
    
    // Generate checksums
    const checksums = [];
    
    for (const file of exeFiles) {
      const filePath = path.join(distDir, file);
      const stats = fs.statSync(filePath);
      const hash = await calculateHash(filePath);
      
      checksums.push({
        file: file,
        sha256: hash,
        size: stats.size,
        sizeFormatted: formatBytes(stats.size)
      });
      
      console.log(`✓ ${file}`);
      console.log(`  SHA256: ${hash}`);
      console.log(`  Size: ${formatBytes(stats.size)}`);
    }
    
    // Write checksums to file
    const checksumFile = path.join(distDir, 'checksums.txt');
    let content = 'YouTube Downloader Pro - Release Checksums\n';
    content += '==========================================\n\n';
    
    for (const item of checksums) {
      content += `File: ${item.file}\n`;
      content += `SHA256: ${item.sha256}\n`;
      content += `Size: ${item.sizeFormatted} (${item.size} bytes)\n\n`;
    }
    
    content += `Generated: ${new Date().toISOString()}\n`;
    
    fs.writeFileSync(checksumFile, content, 'utf8');
    console.log(`\n✓ Checksums written to: ${checksumFile}`);
    
    // Also write JSON format
    const jsonFile = path.join(distDir, 'checksums.json');
    fs.writeFileSync(jsonFile, JSON.stringify(checksums, null, 2), 'utf8');
    console.log(`✓ JSON checksums written to: ${jsonFile}`);
    
    // Write individual .sha256 files
    for (const item of checksums) {
      const sha256File = path.join(distDir, `${item.file}.sha256`);
      fs.writeFileSync(sha256File, `${item.sha256}  ${item.file}\n`, 'utf8');
    }
    console.log(`✓ Individual .sha256 files created`);
    
    console.log('\n✅ Checksum generation complete!');
    
  } catch (error) {
    console.error('Error generating checksums:', error);
    process.exit(1);
  }
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Run the script
generateChecksums();
