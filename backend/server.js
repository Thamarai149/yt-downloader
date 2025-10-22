import express from 'express';
import cors from 'cors';
import youtubedl from 'youtube-dl-exec';
import sanitize from 'sanitize-filename';
import fs from 'fs';
import path from 'path';
import { Server } from 'socket.io';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// Store download history and active downloads
let downloadHistory = [];
let activeDownloads = new Map();

// Get user's home directory dynamically (works for any Windows user)
import os from 'os';
const userHomeDir = os.homedir(); // e.g., C:\Users\CurrentUser
const defaultDownloadsDir = path.join(userHomeDir, 'Downloads', 'YT-Downloads');

// Default downloads directory - Automatically uses current user's Downloads folder
let downloadsDir = defaultDownloadsDir;

// Load custom download path from config file if exists
const configPath = path.join(process.cwd(), 'download-config.json');
if (fs.existsSync(configPath)) {
    try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (config.downloadPath) {
            downloadsDir = config.downloadPath;
            console.log(`📁 Using custom download path: ${downloadsDir}`);
        }
    } catch (err) {
        console.error('Failed to load config:', err.message);
    }
} else {
    console.log(`📁 Using default download path: ${downloadsDir}`);
}

if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
    console.log(`✅ Created download folder: ${downloadsDir}`);
}

// Health check
app.get('/', (req, res) => res.send('Enhanced YT Downloader server running'));

// Get download path
app.get('/api/download-path', (req, res) => {
    res.json({ downloadPath: downloadsDir });
});

// Get user system info (for dynamic path presets)
app.get('/api/user-info', (req, res) => {
    try {
        const homeDir = os.homedir();
        const username = os.userInfo().username;
        
        res.json({
            homeDir,
            username,
            presets: {
                downloads: path.join(homeDir, 'Downloads', 'YT-Downloads'),
                videos: path.join(homeDir, 'Videos', 'YouTube'),
                music: path.join(homeDir, 'Music', 'YouTube'),
                desktop: path.join(homeDir, 'Desktop', 'YT-Downloads')
            }
        });
    } catch (err) {
        console.error('Get user info error:', err);
        res.status(500).json({ error: 'Failed to get user info' });
    }
});

// Update download path
app.post('/api/download-path', (req, res) => {
    try {
        const { downloadPath } = req.body;
        
        if (!downloadPath) {
            return res.status(400).json({ error: 'Download path is required' });
        }

        // Validate path exists or can be created
        if (!fs.existsSync(downloadPath)) {
            try {
                fs.mkdirSync(downloadPath, { recursive: true });
            } catch (err) {
                return res.status(400).json({ error: 'Invalid path or cannot create directory' });
            }
        }

        // Update global download directory
        downloadsDir = downloadPath;

        // Save to config file
        const config = { downloadPath };
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

        console.log(`✅ Download path updated to: ${downloadsDir}`);
        res.json({ 
            message: 'Download path updated successfully', 
            downloadPath: downloadsDir 
        });
    } catch (err) {
        console.error('Update download path error:', err);
        res.status(500).json({ error: 'Failed to update download path' });
    }
});

// Browse downloaded files
app.get('/api/files', (req, res) => {
    try {
        if (!fs.existsSync(downloadsDir)) {
            return res.json({ files: [], downloadPath: downloadsDir });
        }

        const files = fs.readdirSync(downloadsDir)
            .filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ext === '.mp4' || ext === '.mp3';
            })
            .map(file => {
                const filePath = path.join(downloadsDir, file);
                const stats = fs.statSync(filePath);
                return {
                    name: file,
                    size: stats.size,
                    created: stats.birthtime,
                    modified: stats.mtime,
                    ext: path.extname(file).toLowerCase()
                };
            })
            .sort((a, b) => b.modified - a.modified);

        res.json({ files, downloadPath: downloadsDir });
    } catch (err) {
        console.error('Browse files error:', err);
        res.status(500).json({ error: 'Failed to browse files' });
    }
});

// Delete downloaded file
app.delete('/api/files/:filename', (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(downloadsDir, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        fs.unlinkSync(filePath);
        res.json({ message: 'File deleted successfully' });
    } catch (err) {
        console.error('Delete file error:', err);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

// Validate YouTube URL
function isValidYouTubeUrl(url) {
    const regex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/playlist\?list=)/;
    return regex.test(url);
}

// Get video info endpoint with available formats
app.get('/api/info', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url || !isValidYouTubeUrl(url)) {
            return res.status(400).json({ error: 'Valid YouTube URL is required' });
        }

        const info = await youtubedl(url, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
            skipDownload: true
        });

        // Extract available video qualities
        const videoFormats = info.formats
            ?.filter(f => f.vcodec !== 'none' && f.height)
            ?.map(f => ({
                format_id: f.format_id,
                height: f.height,
                ext: f.ext,
                filesize: f.filesize
            }))
            ?.sort((a, b) => b.height - a.height) || [];

        // Get unique qualities
        const qualities = [...new Set(videoFormats.map(f => f.height))]
            .sort((a, b) => b - a)
            .slice(0, 5); // Top 5 qualities

        // Extract available subtitles
        const subtitles = info.subtitles ? Object.keys(info.subtitles) : [];
        const autoSubtitles = info.automatic_captions ? Object.keys(info.automatic_captions) : [];

        res.json({
            title: info.title,
            duration: info.duration,
            uploader: info.uploader,
            view_count: info.view_count,
            thumbnail: info.thumbnail,
            upload_date: info.upload_date,
            description: info.description?.substring(0, 200) + '...',
            qualities: qualities,
            formats: videoFormats.slice(0, 10),
            subtitles: subtitles,
            autoSubtitles: autoSubtitles,
            channel_id: info.channel_id,
            channel_url: info.channel_url
        });
    } catch (err) {
        console.error('Info error:', err);
        res.status(500).json({ error: 'Failed to get video info', details: err.message });
    }
});

// Playlist info endpoint
app.get('/api/playlist', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) {
            return res.status(400).json({ error: 'Playlist URL is required' });
        }

        const info = await youtubedl(url, {
            dumpSingleJson: true,
            flatPlaylist: true,
            noCheckCertificates: true,
            noWarnings: true
        });

        if (info.entries) {
            const videos = info.entries.slice(0, 50).map(entry => ({
                id: entry.id,
                title: entry.title,
                url: entry.webpage_url || `https://www.youtube.com/watch?v=${entry.id}`,
                duration: entry.duration,
                thumbnail: entry.thumbnail
            }));

            res.json({
                title: info.title,
                uploader: info.uploader,
                video_count: info.playlist_count || videos.length,
                videos: videos
            });
        } else {
            res.status(400).json({ error: 'Not a valid playlist URL' });
        }
    } catch (err) {
        console.error('Playlist error:', err);
        res.status(500).json({ error: 'Failed to get playlist info', details: err.message });
    }
});

// Search YouTube videos
app.get('/api/search', async (req, res) => {
    try {
        const { query, limit = 10 } = req.query;
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        const searchResults = await youtubedl(`ytsearch${limit}:${query}`, {
            dumpSingleJson: true,
            flatPlaylist: true,
            noCheckCertificates: true,
            noWarnings: true
        });

        if (searchResults.entries) {
            const videos = searchResults.entries.map(entry => ({
                id: entry.id,
                title: entry.title,
                url: entry.webpage_url || `https://www.youtube.com/watch?v=${entry.id}`,
                duration: entry.duration,
                thumbnail: entry.thumbnail,
                uploader: entry.uploader,
                view_count: entry.view_count
            }));

            res.json({ videos });
        } else {
            res.json({ videos: [] });
        }
    } catch (err) {
        console.error('Search error:', err);
        res.status(500).json({ error: 'Search failed', details: err.message });
    }
});

// Download subtitles endpoint
app.post('/api/download-subtitles', async (req, res) => {
    try {
        const { url, languages = ['en'] } = req.body;
        if (!url || !isValidYouTubeUrl(url)) {
            return res.status(400).json({ error: 'Valid YouTube URL is required' });
        }

        const info = await youtubedl(url, { dumpSingleJson: true });
        const title = sanitize(info.title) || 'subtitles';
        const timestamp = Date.now();

        const subtitleFiles = [];

        for (const lang of languages) {
            try {
                const filename = `${title}_${lang}_${timestamp}.srt`;
                const filepath = path.join(downloadsDir, filename);

                await youtubedl(url, {
                    writeSubtitles: true,
                    writeAutoSub: true,
                    subLang: lang,
                    subFormat: 'srt',
                    skipDownload: true,
                    output: filepath.replace('.srt', ''),
                    noCheckCertificates: true
                });

                if (fs.existsSync(filepath)) {
                    subtitleFiles.push({ language: lang, filename, path: filepath });
                }
            } catch (err) {
                console.error(`Failed to download ${lang} subtitles:`, err);
            }
        }

        if (subtitleFiles.length > 0) {
            res.json({ 
                message: 'Subtitles downloaded successfully', 
                files: subtitleFiles,
                count: subtitleFiles.length
            });
        } else {
            res.status(404).json({ error: 'No subtitles found for the requested languages' });
        }
    } catch (err) {
        console.error('Subtitle download error:', err);
        res.status(500).json({ error: 'Failed to download subtitles', details: err.message });
    }
});

// Download thumbnail endpoint
app.post('/api/download-thumbnail', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url || !isValidYouTubeUrl(url)) {
            return res.status(400).json({ error: 'Valid YouTube URL is required' });
        }

        const info = await youtubedl(url, { dumpSingleJson: true });
        const title = sanitize(info.title) || 'thumbnail';
        const thumbnailUrl = info.thumbnail;

        if (!thumbnailUrl) {
            return res.status(404).json({ error: 'Thumbnail not found' });
        }

        // Download thumbnail
        const response = await fetch(thumbnailUrl);
        const buffer = await response.arrayBuffer();
        const filename = `${title}_thumbnail_${Date.now()}.jpg`;
        const filepath = path.join(downloadsDir, filename);

        fs.writeFileSync(filepath, Buffer.from(buffer));

        res.json({ 
            message: 'Thumbnail downloaded successfully', 
            filename,
            path: filepath,
            size: buffer.byteLength
        });
    } catch (err) {
        console.error('Thumbnail download error:', err);
        res.status(500).json({ error: 'Failed to download thumbnail', details: err.message });
    }
});

// Get channel videos
app.get('/api/channel', async (req, res) => {
    try {
        const { url, limit = 50 } = req.query;
        if (!url) {
            return res.status(400).json({ error: 'Channel URL is required' });
        }

        const info = await youtubedl(url, {
            dumpSingleJson: true,
            flatPlaylist: true,
            playlistEnd: parseInt(limit),
            noCheckCertificates: true,
            noWarnings: true
        });

        if (info.entries) {
            const videos = info.entries.map(entry => ({
                id: entry.id,
                title: entry.title,
                url: entry.webpage_url || `https://www.youtube.com/watch?v=${entry.id}`,
                duration: entry.duration,
                thumbnail: entry.thumbnail,
                uploader: entry.uploader,
                view_count: entry.view_count,
                upload_date: entry.upload_date
            }));

            res.json({
                channel: info.uploader || info.channel,
                channel_id: info.channel_id,
                video_count: info.playlist_count || videos.length,
                videos: videos
            });
        } else {
            res.status(400).json({ error: 'Not a valid channel URL' });
        }
    } catch (err) {
        console.error('Channel error:', err);
        res.status(500).json({ error: 'Failed to get channel info', details: err.message });
    }
});

// Retry failed download
app.post('/api/retry/:downloadId', async (req, res) => {
    try {
        const { downloadId } = req.params;
        const failedDownload = downloadHistory.find(d => d.id === downloadId && d.status === 'failed');

        if (!failedDownload) {
            return res.status(404).json({ error: 'Failed download not found' });
        }

        // Restart the download
        const response = await fetch(`${req.protocol}://${req.get('host')}/api/download`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: failedDownload.url,
                type: failedDownload.type,
                quality: failedDownload.quality
            })
        });

        const data = await response.json();
        res.json({ message: 'Download restarted', newDownloadId: data.downloadId });
    } catch (err) {
        console.error('Retry error:', err);
        res.status(500).json({ error: 'Failed to retry download', details: err.message });
    }
});

// Bulk URL import
app.post('/api/bulk-import', async (req, res) => {
    try {
        const { urls, type = 'video', quality = 'best' } = req.body;
        
        if (!urls || !Array.isArray(urls) || urls.length === 0) {
            return res.status(400).json({ error: 'URLs array is required' });
        }

        const validUrls = urls.filter(url => isValidYouTubeUrl(url));
        
        if (validUrls.length === 0) {
            return res.status(400).json({ error: 'No valid YouTube URLs found' });
        }

        const downloadIds = [];

        for (const url of validUrls) {
            try {
                const downloadId = uuidv4();
                const info = await youtubedl(url, { dumpSingleJson: true });

                const downloadInfo = {
                    id: downloadId,
                    title: info.title,
                    url,
                    type,
                    quality,
                    status: 'queued',
                    progress: 0,
                    startTime: new Date(),
                    thumbnail: info.thumbnail
                };

                activeDownloads.set(downloadId, downloadInfo);
                downloadIds.push(downloadId);

                // Add small delay between requests
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (err) {
                console.error(`Failed to queue ${url}:`, err);
            }
        }

        res.json({ 
            message: `${downloadIds.length} downloads queued`,
            downloadIds,
            total: validUrls.length,
            queued: downloadIds.length
        });
    } catch (err) {
        console.error('Bulk import error:', err);
        res.status(500).json({ error: 'Bulk import failed', details: err.message });
    }
});

// Download presets management
let downloadPresets = [
    { id: 'preset1', name: 'High Quality Video', type: 'video', quality: '1080' },
    { id: 'preset2', name: 'Best Audio', type: 'audio', quality: 'best' },
    { id: 'preset3', name: '4K Video', type: 'video', quality: '4k' }
];

app.get('/api/presets', (req, res) => {
    res.json(downloadPresets);
});

app.post('/api/presets', (req, res) => {
    try {
        const { name, type, quality } = req.body;
        
        if (!name || !type || !quality) {
            return res.status(400).json({ error: 'Name, type, and quality are required' });
        }

        const preset = {
            id: `preset_${Date.now()}`,
            name,
            type,
            quality
        };

        downloadPresets.push(preset);
        res.json({ message: 'Preset created', preset });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create preset' });
    }
});

app.delete('/api/presets/:presetId', (req, res) => {
    try {
        const { presetId } = req.params;
        const initialLength = downloadPresets.length;
        downloadPresets = downloadPresets.filter(p => p.id !== presetId);

        if (downloadPresets.length < initialLength) {
            res.json({ message: 'Preset deleted' });
        } else {
            res.status(404).json({ error: 'Preset not found' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete preset' });
    }
});

// Download subtitles endpoint
app.post('/api/download-subtitles', async (req, res) => {
    try {
        const { url, languages = ['en'] } = req.body;

        if (!url || !isValidYouTubeUrl(url)) {
            return res.status(400).json({ error: 'Valid YouTube URL is required' });
        }

        const info = await youtubedl(url, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            skipDownload: true
        });

        const title = sanitize(info.title) || 'video';
        const timestamp = Date.now();
        const subtitleFiles = [];

        // Download subtitles for each requested language
        for (const lang of languages) {
            try {
                const subtitlePath = path.join(downloadsDir, `${title}_${timestamp}_${lang}.srt`);
                
                await youtubedl(url, {
                    skipDownload: true,
                    writeSub: true,
                    subLang: lang,
                    subFormat: 'srt',
                    output: subtitlePath.replace('.srt', '.%(ext)s'),
                    noCheckCertificates: true
                });

                if (fs.existsSync(subtitlePath)) {
                    subtitleFiles.push({
                        language: lang,
                        filename: path.basename(subtitlePath),
                        path: subtitlePath
                    });
                }
            } catch (err) {
                console.error(`Failed to download ${lang} subtitles:`, err.message);
            }
        }

        if (subtitleFiles.length > 0) {
            res.json({
                message: 'Subtitles downloaded',
                title: info.title,
                subtitles: subtitleFiles
            });
        } else {
            res.status(404).json({ error: 'No subtitles found for requested languages' });
        }
    } catch (err) {
        console.error('Subtitle download error:', err);
        res.status(500).json({ error: 'Failed to download subtitles', details: err.message });
    }
});

// Download thumbnail endpoint
app.post('/api/download-thumbnail', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url || !isValidYouTubeUrl(url)) {
            return res.status(400).json({ error: 'Valid YouTube URL is required' });
        }

        const info = await youtubedl(url, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            skipDownload: true
        });

        const title = sanitize(info.title) || 'thumbnail';
        const thumbnailUrl = info.thumbnail;

        if (!thumbnailUrl) {
            return res.status(404).json({ error: 'No thumbnail found' });
        }

        // Download thumbnail
        const response = await fetch(thumbnailUrl);
        const buffer = await response.arrayBuffer();
        const ext = thumbnailUrl.includes('.jpg') ? 'jpg' : 'png';
        const filename = `${title}_thumbnail.${ext}`;
        const filepath = path.join(downloadsDir, filename);

        fs.writeFileSync(filepath, Buffer.from(buffer));

        res.json({
            message: 'Thumbnail downloaded',
            title: info.title,
            filename: filename,
            path: filepath
        });
    } catch (err) {
        console.error('Thumbnail download error:', err);
        res.status(500).json({ error: 'Failed to download thumbnail', details: err.message });
    }
});

// Get channel videos endpoint
app.get('/api/channel', async (req, res) => {
    try {
        const { url, limit = 50 } = req.query;

        if (!url) {
            return res.status(400).json({ error: 'Channel URL is required' });
        }

        const info = await youtubedl(url, {
            dumpSingleJson: true,
            flatPlaylist: true,
            playlistEnd: parseInt(limit),
            noCheckCertificates: true,
            noWarnings: true
        });

        if (info.entries) {
            const videos = info.entries.map(entry => ({
                id: entry.id,
                title: entry.title,
                url: entry.webpage_url || `https://www.youtube.com/watch?v=${entry.id}`,
                duration: entry.duration,
                thumbnail: entry.thumbnail,
                upload_date: entry.upload_date
            }));

            res.json({
                channel: info.uploader || info.channel,
                channel_id: info.channel_id,
                video_count: info.playlist_count || videos.length,
                videos: videos
            });
        } else {
            res.status(400).json({ error: 'Not a valid channel URL' });
        }
    } catch (err) {
        console.error('Channel error:', err);
        res.status(500).json({ error: 'Failed to get channel videos', details: err.message });
    }
});

// Retry failed download endpoint
app.post('/api/retry/:downloadId', async (req, res) => {
    try {
        const { downloadId } = req.params;
        const failedDownload = downloadHistory.find(d => d.id === downloadId && d.status === 'failed');

        if (!failedDownload) {
            return res.status(404).json({ error: 'Failed download not found' });
        }

        // Restart the download
        const response = await fetch(`${req.protocol}://${req.get('host')}/api/download`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: failedDownload.url,
                type: failedDownload.type,
                quality: failedDownload.quality
            })
        });

        const data = await response.json();

        if (response.ok) {
            res.json({ message: 'Download restarted', downloadId: data.downloadId });
        } else {
            res.status(500).json({ error: 'Failed to restart download' });
        }
    } catch (err) {
        console.error('Retry error:', err);
        res.status(500).json({ error: 'Failed to retry download' });
    }
});

// Bulk URL import endpoint
app.post('/api/bulk-import', async (req, res) => {
    try {
        const { urls, type = 'video', quality = 'best' } = req.body;

        if (!urls || !Array.isArray(urls) || urls.length === 0) {
            return res.status(400).json({ error: 'URLs array is required' });
        }

        const validUrls = urls.filter(u => u && isValidYouTubeUrl(u));

        if (validUrls.length === 0) {
            return res.status(400).json({ error: 'No valid YouTube URLs found' });
        }

        const downloadIds = [];

        for (const url of validUrls) {
            try {
                const downloadId = uuidv4();
                const info = await youtubedl(url, {
                    dumpSingleJson: true,
                    noCheckCertificates: true,
                    noWarnings: true,
                    skipDownload: true
                });

                const downloadInfo = {
                    id: downloadId,
                    title: info.title,
                    url,
                    type,
                    quality,
                    status: 'queued',
                    progress: 0,
                    startTime: new Date(),
                    thumbnail: info.thumbnail
                };

                activeDownloads.set(downloadId, downloadInfo);
                downloadIds.push(downloadId);

                // Start download in background with delay
                setTimeout(() => {
                    fetch(`http://localhost:${PORT}/api/download`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url, type, quality })
                    }).catch(err => console.error('Bulk download error:', err));
                }, downloadIds.length * 2000); // 2 second delay between each

            } catch (err) {
                console.error('Failed to queue:', url, err.message);
            }
        }

        res.json({
            message: `Queued ${downloadIds.length} downloads`,
            downloadIds: downloadIds,
            total: validUrls.length
        });
    } catch (err) {
        console.error('Bulk import error:', err);
        res.status(500).json({ error: 'Failed to import URLs' });
    }
});

// Get download history
app.get('/api/history', (req, res) => {
    res.json(downloadHistory.slice(-50)); // Last 50 downloads
});

// Clear download history
app.delete('/api/history', (req, res) => {
    downloadHistory = [];
    res.json({ message: 'History cleared' });
});

// Delete individual history item
app.delete('/api/history/:downloadId', (req, res) => {
    try {
        const { downloadId } = req.params;
        const initialLength = downloadHistory.length;
        downloadHistory = downloadHistory.filter(item => item.id !== downloadId);

        if (downloadHistory.length < initialLength) {
            res.json({ message: 'History item deleted' });
        } else {
            res.status(404).json({ error: 'History item not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete history item' });
    }
});

// Get active downloads
app.get('/api/downloads/active', (req, res) => {
    const active = Array.from(activeDownloads.values());
    res.json(active);
});

// Enhanced download endpoint with progress tracking
app.post('/api/download', async (req, res) => {
    let tempFile = null;

    try {
        const { url, type = 'video', quality = 'best' } = req.body;
        const downloadId = uuidv4();

        if (!url || !isValidYouTubeUrl(url)) {
            return res.status(400).json({ error: 'Valid YouTube URL is required' });
        }

        // Get video info first
        const info = await youtubedl(url, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true
        });

        const title = sanitize(info.title) || 'video';
        const timestamp = Date.now();

        // Track download
        const downloadInfo = {
            id: downloadId,
            title: info.title,
            url,
            type,
            quality,
            status: 'starting',
            progress: 0,
            startTime: new Date(),
            thumbnail: info.thumbnail
        };

        activeDownloads.set(downloadId, downloadInfo);
        io.emit('downloadStarted', downloadInfo);

        // Send immediate response with download ID
        res.json({ downloadId, message: 'Download started', title: info.title });

        // Start download in background
        (async () => {
            try {
                downloadInfo.status = 'downloading';
                activeDownloads.set(downloadId, downloadInfo);
                io.emit('downloadProgress', downloadInfo);

                const filename = `${title}_${timestamp}.%(ext)s`;
                tempFile = path.join(downloadsDir, filename);

                let formatOption;
                if (type === 'audio') {
                    formatOption = {
                        extractAudio: true,
                        audioFormat: 'mp3',
                        audioQuality: 0,
                        output: tempFile,
                        noCheckCertificates: true,
                        preferFreeFormats: true,
                        addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
                        progress: true
                    };
                } else {
                    const formatString = quality === 'best' ? 'best' :
                        quality === '4k' ? 'best[height<=2160]/best' :
                            quality === '2k' ? 'best[height<=1440]/best' :
                                quality === '1080' ? 'best[height<=1080]/best' :
                                    quality === '720' ? 'best[height<=720]/best' :
                                        quality === '480' ? 'best[height<=480]/best' :
                                            quality === '360' ? 'best[height<=360]/best' :
                                                quality === '240' ? 'best[height<=240]/best' :
                                                    `best[height<=${quality}]/best`;

                    formatOption = {
                        format: formatString,
                        output: tempFile,
                        noCheckCertificates: true,
                        preferFreeFormats: true,
                        addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
                        progress: true
                    };
                }

                // Simulate progress updates since youtube-dl-exec doesn't provide real-time progress
                const progressInterval = setInterval(() => {
                    if (downloadInfo.progress < 90) {
                        downloadInfo.progress += Math.floor(Math.random() * 10) + 5;
                        if (downloadInfo.progress > 90) downloadInfo.progress = 90;
                        activeDownloads.set(downloadId, downloadInfo);
                        io.emit('downloadProgress', downloadInfo);
                    }
                }, 1000);

                await youtubedl(url, formatOption);

                clearInterval(progressInterval);

                // Find the actual file
                const files = fs.readdirSync(downloadsDir);
                const actualFile = files.find(f => f.startsWith(`${title}_${timestamp}`));

                if (!actualFile) {
                    throw new Error('Downloaded file not found');
                }

                const actualPath = path.join(downloadsDir, actualFile);
                const stats = fs.statSync(actualPath);

                // Update download info
                downloadInfo.status = 'completed';
                downloadInfo.progress = 100;
                downloadInfo.endTime = new Date();
                downloadInfo.fileSize = stats.size;
                downloadInfo.filePath = actualPath;
                downloadInfo.fileName = actualFile;

                activeDownloads.set(downloadId, downloadInfo);

                // Add to history
                downloadHistory.push({
                    ...downloadInfo,
                    downloadId
                });

                io.emit('downloadCompleted', downloadInfo);

                // Clean up after 1 hour
                setTimeout(() => {
                    if (fs.existsSync(actualPath)) {
                        fs.unlinkSync(actualPath);
                    }
                    activeDownloads.delete(downloadId);
                }, 3600000);

            } catch (error) {
                downloadInfo.status = 'failed';
                downloadInfo.error = error.message;
                downloadInfo.endTime = new Date();

                activeDownloads.set(downloadId, downloadInfo);
                io.emit('downloadFailed', downloadInfo);

                // Clean up temp files
                if (tempFile) {
                    const files = fs.readdirSync(downloadsDir);
                    files.forEach(file => {
                        if (file.includes(path.basename(tempFile, path.extname(tempFile)))) {
                            const filePath = path.join(downloadsDir, file);
                            if (fs.existsSync(filePath)) {
                                fs.unlinkSync(filePath);
                            }
                        }
                    });
                }

                setTimeout(() => activeDownloads.delete(downloadId), 300000); // Remove after 5 min
            }
        })();

    } catch (err) {
        console.error('Download error:', err);
        res.status(500).json({ error: 'Download failed', details: err.message });
    }
});

// Download file endpoint (for completed downloads)
app.get('/api/download/:downloadId', (req, res) => {
    try {
        const { downloadId } = req.params;
        const download = activeDownloads.get(downloadId);

        if (!download || download.status !== 'completed') {
            return res.status(404).json({ error: 'Download not found or not completed' });
        }

        if (!fs.existsSync(download.filePath)) {
            return res.status(404).json({ error: 'File no longer available' });
        }

        const ext = download.type === 'audio' ? 'mp3' : 'mp4';
        const finalFilename = `${download.title}.${ext}`;
        const contentType = download.type === 'audio' ? 'audio/mpeg' : 'video/mp4';

        res.setHeader('Content-Disposition', `attachment; filename="${finalFilename}"`);
        res.setHeader('Content-Type', contentType);

        const stream = fs.createReadStream(download.filePath);
        stream.pipe(res);

    } catch (err) {
        console.error('File download error:', err);
        res.status(500).json({ error: 'File download failed' });
    }
});

// Cancel download
app.delete('/api/download/:downloadId', (req, res) => {
    try {
        const { downloadId } = req.params;
        const download = activeDownloads.get(downloadId);

        if (!download) {
            return res.status(404).json({ error: 'Download not found' });
        }

        // Update status to cancelled
        download.status = 'cancelled';
        download.endTime = new Date();
        activeDownloads.set(downloadId, download);

        // Clean up files if they exist
        if (download.filePath && fs.existsSync(download.filePath)) {
            fs.unlinkSync(download.filePath);
        }

        // Remove from active downloads after a delay
        setTimeout(() => activeDownloads.delete(downloadId), 5000);

        io.emit('downloadCancelled', download);
        res.json({ message: 'Download cancelled' });
    } catch (err) {
        console.error('Cancel download error:', err);
        res.status(500).json({ error: 'Failed to cancel download' });
    }
});

// Stream endpoint (alternative method)
app.get('/api/stream', async (req, res) => {
    try {
        const { url, type = 'video' } = req.query;

        if (!url || !isValidYouTubeUrl(url)) {
            return res.status(400).json({ error: 'Valid YouTube URL is required' });
        }

        const info = await youtubedl(url, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true
        });

        const title = sanitize(info.title) || 'video';

        if (type === 'audio') {
            res.setHeader('Content-Disposition', `attachment; filename="${title}.mp3"`);
            res.setHeader('Content-Type', 'audio/mpeg');

            const stream = youtubedl.exec(url, {
                extractAudio: true,
                audioFormat: 'mp3',
                audioQuality: 0,
                output: '-',
                noCheckCertificates: true,
                quiet: true
            });

            stream.stdout.pipe(res);

        } else {
            res.setHeader('Content-Disposition', `attachment; filename="${title}.mp4"`);
            res.setHeader('Content-Type', 'video/mp4');

            const stream = youtubedl.exec(url, {
                format: 'best[height<=720]/best',
                output: '-',
                noCheckCertificates: true,
                quiet: true
            });

            stream.stdout.pipe(res);
        }

    } catch (err) {
        console.error('Stream error:', err);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Stream failed', details: err.message });
        }
    }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Send current active downloads to new client
    socket.emit('activeDownloads', Array.from(activeDownloads.values()));

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Error handling middleware (must be after all routes)
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Handle 404 routes (must be last)
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 4000;

// Function to find available port
import net from 'net';

function findAvailablePort(startPort) {
    return new Promise((resolve) => {
        const testServer = net.createServer();
        testServer.listen(startPort, () => {
            const port = testServer.address().port;
            testServer.close(() => resolve(port));
        });
        testServer.on('error', () => {
            resolve(findAvailablePort(startPort + 1));
        });
    });
}

// Start server with port fallback
async function startServer() {
    try {
        const availablePort = await findAvailablePort(PORT);
        server.listen(availablePort, () => {
            console.log(`🚀 Enhanced YT Downloader Server listening on port ${availablePort}`);
            if (availablePort !== PORT) {
                console.log(`⚠️  Port ${PORT} was in use, using port ${availablePort} instead`);
                console.log(`💡 Update your frontend to use: http://localhost:${availablePort}`);
            }
            console.log('📋 Available endpoints:');
            console.log('  GET  /api/info?url=<youtube-url> - Get video info');
            console.log('  GET  /api/playlist?url=<playlist-url> - Get playlist info');
            console.log('  GET  /api/search?query=<search-term> - Search videos');
            console.log('  POST /api/download - Enhanced download with progress');
            console.log('  GET  /api/download/:downloadId - Download completed file');
            console.log('  DEL  /api/download/:downloadId - Cancel download');
            console.log('  GET  /api/history - Download history');
            console.log('  DEL  /api/history - Clear history');
            console.log('  GET  /api/downloads/active - Active downloads');
            console.log('  GET  /api/stream?url=<youtube-url>&type=audio|video - Stream download');
            console.log('🎯 WebSocket enabled for real-time updates');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
}

// Start the server
startServer();