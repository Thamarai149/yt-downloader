import 'package:dio/dio.dart';
import '../models/video_info.dart';
import '../models/download_item.dart';
import '../models/search_result.dart';
import '../utils/constants.dart';

class ApiService {
  late final Dio _dio;
  String _baseUrl = AppConstants.defaultBackendUrl;

  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: _baseUrl,
      connectTimeout: AppConstants.apiTimeout,
      receiveTimeout: AppConstants.apiTimeout,
      headers: {
        'Content-Type': 'application/json',
      },
    ));
  }

  void setBaseUrl(String url) {
    _baseUrl = url;
    _dio.options.baseUrl = url;
  }

  // Get video information
  Future<VideoInfo> getVideoInfo(String url) async {
    try {
      final response =
          await _dio.get('/api/video/info', queryParameters: {'url': url});
      if (response.data['success'] == true) {
        return VideoInfo.fromJson(response.data['data']);
      }
      throw Exception(response.data['error'] ?? 'Failed to get video info');
    } catch (e) {
      throw Exception('Failed to get video info: $e');
    }
  }

  // Start download
  Future<Map<String, dynamic>> startDownload({
    required String url,
    required String type,
    required String quality,
  }) async {
    try {
      final response = await _dio.post('/api/download', data: {
        'url': url,
        'type': type,
        'quality': quality,
      });
      if (response.data['success'] == true) {
        return response.data['data'];
      }
      throw Exception(response.data['error'] ?? 'Failed to start download');
    } catch (e) {
      throw Exception('Failed to start download: $e');
    }
  }

  // Cancel download
  Future<void> cancelDownload(String downloadId) async {
    try {
      await _dio.delete('/api/download/$downloadId');
    } catch (e) {
      throw Exception('Failed to cancel download: $e');
    }
  }

  // Get active downloads
  Future<List<DownloadItem>> getActiveDownloads() async {
    try {
      final response = await _dio.get('/api/download/active');
      if (response.data['success'] == true) {
        final List<dynamic> data = response.data['data'];
        return data.map((json) => DownloadItem.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      throw Exception('Failed to get active downloads: $e');
    }
  }

  // Get download history
  Future<List<DownloadItem>> getHistory() async {
    try {
      final response = await _dio.get('/api/download/history');
      if (response.data['success'] == true) {
        final List<dynamic> data = response.data['data'];
        return data.map((json) => DownloadItem.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      throw Exception('Failed to get history: $e');
    }
  }

  // Clear history (not implemented in new backend, returns empty list)
  Future<void> clearHistory() async {
    // Not implemented in new backend
    return;
  }

  // Delete history item (not implemented in new backend)
  Future<void> deleteHistoryItem(String downloadId) async {
    // Not implemented in new backend
    return;
  }

  // Search videos
  Future<List<SearchResult>> searchVideos(String query,
      {int limit = 20}) async {
    try {
      final response = await _dio.get('/api/video/search', queryParameters: {
        'query': query,
        'limit': limit,
      });
      if (response.data['success'] == true) {
        final List<dynamic> videos = response.data['data'];
        return videos.map((json) => SearchResult.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      throw Exception('Failed to search videos: $e');
    }
  }

  // Get playlist info
  Future<Map<String, dynamic>> getPlaylistInfo(String url) async {
    try {
      final response =
          await _dio.get('/api/video/playlist', queryParameters: {'url': url});
      if (response.data['success'] == true) {
        return response.data['data'];
      }
      throw Exception(response.data['error'] ?? 'Failed to get playlist info');
    } catch (e) {
      throw Exception('Failed to get playlist info: $e');
    }
  }
}
