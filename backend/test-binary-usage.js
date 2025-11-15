import BinaryManager from './binary-manager.js';
import { create as createYoutubeDl } from 'youtube-dl-exec';

async function testBinaryUsage() {
    console.log('Testing binary usage...\n');
    
    const binaryManager = new BinaryManager();
    const status = await binaryManager.initialize();
    
    console.log('\nBinary Status:');
    console.log(JSON.stringify(status, null, 2));
    
    if (status.verified) {
        console.log('\n✅ All binaries verified!');
        
        // Test creating custom yt-dlp instance
        const ytdlpPath = binaryManager.getYtdlpPath();
        const ffmpegPath = binaryManager.getFfmpegPath();
        
        console.log('\nTesting custom yt-dlp instance...');
        const customYtdl = createYoutubeDl(ytdlpPath);
        
        try {
            const info = await customYtdl('https://www.youtube.com/watch?v=dQw4w9WgXcQ', {
                dumpSingleJson: true,
                skipDownload: true,
                noCheckCertificates: true,
                ffmpegLocation: ffmpegPath
            });
            
            console.log(`✅ Successfully fetched video info: ${info.title}`);
        } catch (err) {
            console.error('❌ Error fetching video info:', err.message);
        }
    } else {
        console.log('\n❌ Some binaries are missing');
    }
}

testBinaryUsage();
