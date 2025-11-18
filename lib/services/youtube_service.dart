import 'dart:io';
import 'package:youtube_explode_dart/youtube_explode_dart.dart' as yt;
import 'package:path_provider/path_provider.dart';
import 'package:http/http.dart' as http;
import '../models/video_info.dart';
import '../models/search_result.dart' as models;

class YouTubeService {
  final yt.YoutubeExplode _ytExplode = yt.YoutubeExplode();

  // Get video information
  Future<VideoInfo> getVideoInfo(String url) async {
    try {
      final video = await _ytExplode.videos.get(url);
      final manifest =
          await _ytExplode.videos.streamsClient.getManifest(video.id);

      // Get available qualities
      final videoQualities = manifest.muxed
          .map((s) =>
              int.tryParse(s.qualityLabel.replaceAll(RegExp(r'[^0-9]'), '')) ??
              0)
          .toSet()
          .toList()
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
  Future<List<models.SearchResult>> searchVideos(String query,
      {int limit = 20}) async {
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

          results.add(models.SearchResult(
            id: video.id.value,
            title: video.title,
            url: 'https://www.youtube.com/watch?v=${video.id.value}',
            duration: durationSeconds,
            thumbnail: thumbnailUrl,
            uploader: video.author,
            viewCount: 0, // Not available in search
          ));
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
      final manifest =
          await _ytExplode.videos.streamsClient.getManifest(video.id);

      // Get stream based on quality
      yt.StreamInfo streamInfo;
      if (quality == 'highest') {
        streamInfo = manifest.muxed.withHighestBitrate();
      } else {
        final qualityNum =
            int.tryParse(quality.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0;
        streamInfo = manifest.muxed
                .where((s) => s.qualityLabel.contains(qualityNum.toString()))
                .firstOrNull ??
            manifest.muxed.withHighestBitrate();
      }

      // Get download directory
      final dir = await _getDownloadDirectory();
      final fileName =
          _sanitizeFileName('${video.title}.${streamInfo.container.name}');
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

  // Download audio with progress callback
  Future<String> downloadAudio({
    required String url,
    required Function(double) onProgress,
  }) async {
    try {
      final video = await _ytExplode.videos.get(url);
      final manifest =
          await _ytExplode.videos.streamsClient.getManifest(video.id);

      // Get audio stream
      final streamInfo = manifest.audioOnly.withHighestBitrate();

      // Get download directory
      final dir = await _getDownloadDirectory();
      final fileName =
          _sanitizeFileName('${video.title}.${streamInfo.container.name}');
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
    final request =
        await http.Client().send(http.Request('GET', Uri.parse(url)));
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
    if (Platform.isAndroid) {
      // Try to get external storage directory
      final dir = await getExternalStorageDirectory();
      if (dir != null) {
        // Create Downloads folder
        final downloadDir = Directory('${dir.path}/Downloads');
        if (!await downloadDir.exists()) {
          await downloadDir.create(recursive: true);
        }
        return downloadDir;
      }
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
