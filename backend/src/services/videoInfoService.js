import youtubedl from 'youtube-dl-exec';
import { AppError } from '../middleware/errorHandler.js';
import { isValidYouTubeUrl } from '../utils/youtubeValidator.js';

export class VideoInfoService {
  async getVideoInfo(url) {
    try {
      // Basic URL validation - allow any valid URL, not just YouTube
      if (!url || !url.trim()) {
        throw new AppError('URL is required', 400);
      }

      // Try to parse as URL
      try {
        new URL(url);
      } catch (e) {
        throw new AppError('Invalid URL format', 400);
      }

      console.log('Fetching video info for:', url);

      const info = await youtubedl(url, {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true,
        skipDownload: true,
        addHeader: ['referer:youtube.com', 'user-agent:googlebot']
      });

      console.log('Video info fetched successfully:', info.title);

      return {
        id: info.id,
        title: info.title,
        duration: info.duration,
        uploader: info.uploader || info.channel || 'Unknown',
        viewCount: info.view_count || 0,
        thumbnail: info.thumbnail,
        description: info.description?.substring(0, 300),
        uploadDate: info.upload_date,
        url: info.webpage_url || url,
        formats: this.extractFormats(info.formats)
      };
    } catch (error) {
      console.error('Video info error:', error.message);
      throw new AppError(`Failed to get video info: ${error.message}`, 500);
    }
  }

  async searchVideos(query, limit = 10) {
    try {
      if (!query || query.trim().length === 0) {
        throw new AppError('Search query is required', 400);
      }

      const results = await youtubedl(`ytsearch${limit}:${query}`, {
        dumpSingleJson: true,
        flatPlaylist: true,
        noCheckCertificates: true,
        noWarnings: true
      });

      if (!results.entries) {
        return [];
      }

      return results.entries.map(entry => ({
        id: entry.id,
        title: entry.title,
        url: entry.webpage_url || `https://www.youtube.com/watch?v=${entry.id}`,
        duration: entry.duration,
        thumbnail: entry.thumbnail,
        uploader: entry.uploader,
        viewCount: entry.view_count,
        uploadDate: entry.upload_date
      }));
    } catch (error) {
      throw new AppError(`Search failed: ${error.message}`, 500);
    }
  }

  async getTrendingVideos(limit = 20) {
    try {
      // Search for trending/popular videos
      const results = await youtubedl(`ytsearch${limit}:trending music 2024`, {
        dumpSingleJson: true,
        flatPlaylist: true,
        noCheckCertificates: true,
        noWarnings: true
      });

      if (!results.entries) {
        return [];
      }

      return results.entries.map(entry => ({
        id: entry.id,
        title: entry.title,
        url: entry.webpage_url || `https://www.youtube.com/watch?v=${entry.id}`,
        duration: entry.duration,
        thumbnail: entry.thumbnail,
        uploader: entry.uploader,
        viewCount: entry.view_count
      }));
    } catch (error) {
      throw new AppError(`Failed to get trending videos: ${error.message}`, 500);
    }
  }

  async getPlaylistInfo(url) {
    try {
      const info = await youtubedl(url, {
        dumpSingleJson: true,
        flatPlaylist: true,
        noCheckCertificates: true,
        noWarnings: true
      });

      if (!info.entries) {
        throw new AppError('Not a valid playlist URL', 400);
      }

      return {
        title: info.title,
        uploader: info.uploader,
        videoCount: info.playlist_count || info.entries.length,
        videos: info.entries.slice(0, 50).map(entry => ({
          id: entry.id,
          title: entry.title,
          url: entry.webpage_url || `https://www.youtube.com/watch?v=${entry.id}`,
          duration: entry.duration,
          thumbnail: entry.thumbnail
        }))
      };
    } catch (error) {
      throw new AppError(`Failed to get playlist info: ${error.message}`, 500);
    }
  }

  extractFormats(formats) {
    if (!formats) return [];

    const videoFormats = formats
      .filter(f => f.vcodec !== 'none' && f.height)
      .map(f => ({
        formatId: f.format_id,
        height: f.height,
        ext: f.ext,
        filesize: f.filesize
      }))
      .sort((a, b) => b.height - a.height);

    const uniqueQualities = [...new Set(videoFormats.map(f => f.height))]
      .sort((a, b) => b - a)
      .slice(0, 5);

    return uniqueQualities;
  }
}
