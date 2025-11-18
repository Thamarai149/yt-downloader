import 'dart:io';
import 'package:youtube_explode_dart/youtube_explode_dart.dart' as yt;
import 'package:path_provider/path_provider.dart';
import 'package:http/http.dart' as http;
import '../models/video_info.dart';
import '../models/search_result.dart' as models;
import 'settings_service.dart';

class YouTubeService {
  final yt.YoutubeExplode _ytExplode = yt.YoutubeExplode();
  final SettingsService _settingsService = SettingsService();

  // Get video information
  Future<VideoInfo> getVideoInfo(String url) async {
    try {
      final video = await _ytExplode.videos.get(url);
      final manifest = await _ytExplode.videos.streamsClient.getManifest(
        video.id,
      );

      // Get available qualities from both muxed and video-only streams
      final allQualities = <int>{};

      // Add muxed stream qualities
      for (var stream in manifest.muxed) {
        final quality = int.tryParse(
          stream.qualityLabel.replaceAll(RegExp(r'[^0-9]'), ''),
        );
        if (quality != null) allQualities.add(quality);
      }

      // Add video-only stream qualities (includes 4K, 2K, etc.)
      for (var stream in manifest.videoOnly) {
        final quality = int.tryParse(
          stream.qualityLabel.replaceAll(RegExp(r'[^0-9]'), ''),
        );
        if (quality != null) allQualities.add(quality);
      }

      final videoQualities = allQualities.toList()
        ..sort((a, b) => b.compareTo(a));

      return VideoInfo(
        title: video.title,
        duration: video.duration?.inSeconds ?? 0,
        uploader: video.author,
        viewCount: video.engagement.viewCount,
        thumbnail: video.thumbnails.highResUrl,
        uploadDate: video.uploadDate?.toIso8601String() ?? '',
        description: video.description,
        qualities: videoQualities,
        formats: [], // Not needed for standalone
      );
    } catch (e) {
      throw Exception('Failed to get video info: $e');
    }
  }

  // Search videos
  Future<List<models.SearchResult>> searchVideos(
    String query, {
    int limit = 20,
  }) async {
    try {
      final searchList = await _ytExplode.search.search(query);
      final results = <models.SearchResult>[];

      for (final video in searchList.take(limit)) {
        if (video is yt.SearchVideo) {
          // Get thumbnail URL - use highResUrl or mediumResUrl
          String thumbnailUrl = video.thumbnails.highResUrl;

          // Parse duration - it's a Duration? object
          int durationSeconds = 0;
          if (video.duration != null) {
            durationSeconds = video.duration!.inSeconds;
          }

          results.add(
            models.SearchResult(
              id: video.id.value,
              title: video.title,
              url: 'https://www.youtube.com/watch?v=${video.id.value}',
              duration: durationSeconds,
              thumbnail: thumbnailUrl,
              uploader: video.author,
              viewCount: 0, // Not available in search
            ),
          );
        }
      }

      return results;
    } catch (e) {
      throw Exception('Failed to search videos: $e');
    }
  }

  // Download video with progress callback
  Future<String> downloadVideo({
    required String url,
    required String quality,
    required Function(double) onProgress,
  }) async {
    try {
      final video = await _ytExplode.videos.get(url);
      final manifest = await _ytExplode.videos.streamsClient.getManifest(
        video.id,
      );

      final qualityNum =
          int.tryParse(quality.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0;

      // For 2K (1440p) and 4K (2160p), download video and audio separately
      final isHighQuality = qualityNum >= 1440;

      if (isHighQuality) {
        // Download video and audio separately for maximum quality
        return await _downloadVideoAndAudioSeparately(
          video,
          manifest,
          qualityNum,
          onProgress,
        );
      }

      // For 1080p and below, use muxed streams (video + audio combined)
      yt.StreamInfo streamInfo;

      if (quality == 'highest') {
        streamInfo = manifest.muxed.withHighestBitrate();
      } else {
        // Try to find muxed stream with requested quality
        var muxedStream = manifest.muxed
            .where((s) => s.qualityLabel.contains(qualityNum.toString()))
            .firstOrNull;

        if (muxedStream != null) {
          streamInfo = muxedStream;
        } else {
          // Fallback to highest available muxed stream
          streamInfo = manifest.muxed.withHighestBitrate();
        }
      }

      // Get download directory
      final dir = await _getDownloadDirectory();
      final fileName = _sanitizeFileName(
        '${video.title}_${streamInfo.qualityLabel}.${streamInfo.container.name}',
      );
      final file = File('${dir.path}/$fileName');

      // Download with progress
      await _downloadWithProgress(
        streamInfo.url.toString(),
        file,
        streamInfo.size.totalBytes,
        onProgress,
      );

      return file.path;
    } catch (e) {
      throw Exception('Failed to download video: $e');
    }
  }

  // Download video and audio separately for 2K/4K quality
  Future<String> _downloadVideoAndAudioSeparately(
    yt.Video video,
    yt.StreamManifest manifest,
    int qualityNum,
    Function(double) onProgress,
  ) async {
    final dir = await _getDownloadDirectory();

    // Find best video stream for requested quality
    // Sort by bitrate to get highest quality for the resolution
    var videoStreams = manifest.videoOnly
        .where((s) => s.qualityLabel.contains(qualityNum.toString()))
        .toList()
      ..sort(
          (a, b) => b.bitrate.bitsPerSecond.compareTo(a.bitrate.bitsPerSecond));

    var videoStream = videoStreams.isNotEmpty ? videoStreams.first : null;

    // If exact quality not found, get highest available video stream
    videoStream ??= manifest.videoOnly.withHighestBitrate();

    // Get best audio stream (highest bitrate for maximum quality)
    final audioStream = manifest.audioOnly.withHighestBitrate();

    // Download video (0-60% progress)
    final videoFileName = _sanitizeFileName(
      '${video.title}_${videoStream.qualityLabel}_VIDEO.${videoStream.container.name}',
    );
    final videoFile = File('${dir.path}/$videoFileName');

    await _downloadWithProgress(
      videoStream.url.toString(),
      videoFile,
      videoStream.size.totalBytes,
      (progress) => onProgress(progress * 0.6), // 0-60%
    );

    // Download audio (60-100% progress)
    final audioFileName = _sanitizeFileName(
      '${video.title}_AUDIO.${audioStream.container.name}',
    );
    final audioFile = File('${dir.path}/$audioFileName');

    await _downloadWithProgress(
      audioStream.url.toString(),
      audioFile,
      audioStream.size.totalBytes,
      (progress) => onProgress(60 + (progress * 0.4)), // 60-100%
    );

    // Return video file path (audio is saved separately)
    return videoFile.path;
  }

  // Download audio with progress callback
  Future<String> downloadAudio({
    required String url,
    required Function(double) onProgress,
  }) async {
    try {
      final video = await _ytExplode.videos.get(url);
      final manifest = await _ytExplode.videos.streamsClient.getManifest(
        video.id,
      );

      // Get audio stream
      final streamInfo = manifest.audioOnly.withHighestBitrate();

      // Get download directory
      final dir = await _getDownloadDirectory();
      final fileName = _sanitizeFileName(
        '${video.title}.${streamInfo.container.name}',
      );
      final file = File('${dir.path}/$fileName');

      // Download with progress
      await _downloadWithProgress(
        streamInfo.url.toString(),
        file,
        streamInfo.size.totalBytes,
        onProgress,
      );

      return file.path;
    } catch (e) {
      throw Exception('Failed to download audio: $e');
    }
  }

  // Get playlist info
  Future<Map<String, dynamic>> getPlaylistInfo(String url) async {
    try {
      final playlist = await _ytExplode.playlists.get(url);
      final videoList =
          await _ytExplode.playlists.getVideos(playlist.id).take(50).toList();

      return {
        'title': playlist.title,
        'author': playlist.author,
        'videoCount': videoList.length,
        'videos': videoList.map((v) {
          return {
            'id': v.id.value,
            'title': v.title,
            'thumbnail': v.thumbnails.highResUrl,
            'duration': v.duration?.inSeconds ?? 0,
            'author': v.author,
            'url': 'https://www.youtube.com/watch?v=${v.id.value}',
          };
        }).toList(),
      };
    } catch (e) {
      throw Exception('Failed to get playlist info: $e');
    }
  }

  // Helper: Download with progress tracking
  Future<void> _downloadWithProgress(
    String url,
    File file,
    int totalBytes,
    Function(double) onProgress,
  ) async {
    final request = await http.Client().send(
      http.Request('GET', Uri.parse(url)),
    );
    final output = file.openWrite();
    int downloadedBytes = 0;

    await for (final chunk in request.stream) {
      output.add(chunk);
      downloadedBytes += chunk.length;
      final progress = (downloadedBytes / totalBytes * 100).clamp(0.0, 100.0);
      onProgress(progress);
    }

    await output.close();
  }

  // Helper: Get download directory
  Future<Directory> _getDownloadDirectory() async {
    // Check if user has set a custom download path
    final customPath = await _settingsService.getDownloadPath();
    if (customPath != null && customPath.isNotEmpty) {
      final customDir = Directory(customPath);
      if (await customDir.exists()) {
        return customDir;
      }
    }

    // Use public Downloads folder (visible in file manager)
    if (Platform.isAndroid) {
      // Use public Downloads directory
      final downloadDir = Directory('/storage/emulated/0/Download');
      if (!await downloadDir.exists()) {
        await downloadDir.create(recursive: true);
      }
      return downloadDir;
    }
    // Fallback to app documents directory
    return await getApplicationDocumentsDirectory();
  }

  // Helper: Sanitize filename
  String _sanitizeFileName(String fileName) {
    return fileName
        .replaceAll(RegExp(r'[<>:"/\\|?*]'), '_')
        .replaceAll(RegExp(r'\s+'), '_')
        .substring(0, fileName.length > 200 ? 200 : fileName.length);
  }

  void dispose() {
    _ytExplode.close();
  }
}
