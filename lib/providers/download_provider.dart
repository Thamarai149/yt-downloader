import 'package:flutter/material.dart';
import '../models/download_item.dart';
import '../services/api_service.dart';
import '../services/websocket_service.dart';

class DownloadProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  final WebSocketService _wsService = WebSocketService();

  List<DownloadItem> _activeDownloads = [];
  List<DownloadItem> _downloadHistory = [];
  bool _isLoading = false;
  String _statusMessage = '';

  List<DownloadItem> get activeDownloads => _activeDownloads;
  List<DownloadItem> get downloadHistory => _downloadHistory;
  bool get isLoading => _isLoading;
  String get statusMessage => _statusMessage;

  DownloadProvider() {
    _initializeWebSocket();
    fetchHistory();
  }

  void _initializeWebSocket() {
    _wsService.connect();

    _wsService.onDownloadStarted = (download) {
      _activeDownloads.add(download);
      notifyListeners();
    };

    _wsService.onDownloadProgress = (download) {
      final index = _activeDownloads.indexWhere((d) => d.id == download.id);
      if (index != -1) {
        _activeDownloads[index] = download;
        notifyListeners();
      }
    };

    _wsService.onDownloadCompleted = (download) {
      _activeDownloads.removeWhere((d) => d.id == download.id);
      _downloadHistory.insert(0, download);
      notifyListeners();
    };

    _wsService.onDownloadFailed = (download) {
      _activeDownloads.removeWhere((d) => d.id == download.id);
      _downloadHistory.insert(0, download);
      notifyListeners();
    };
  }

  Future<void> startDownload({
    required String url,
    required String type,
    required String quality,
  }) async {
    _isLoading = true;
    notifyListeners();

    try {
      final result = await _apiService.startDownload(
        url: url,
        type: type,
        quality: quality,
      );

      _statusMessage = 'Download started: ${result['title']}';
      await fetchActiveDownloads();
    } catch (e) {
      _statusMessage = 'Failed to start download: $e';
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> cancelDownload(String downloadId) async {
    try {
      await _apiService.cancelDownload(downloadId);
      _activeDownloads.removeWhere((d) => d.id == downloadId);
      _statusMessage = 'Download cancelled';
      notifyListeners();
    } catch (e) {
      _statusMessage = 'Failed to cancel download: $e';
      notifyListeners();
    }
  }

  Future<void> fetchActiveDownloads() async {
    try {
      _activeDownloads = await _apiService.getActiveDownloads();
      notifyListeners();
    } catch (e) {
      debugPrint('Failed to fetch active downloads: $e');
    }
  }

  Future<void> fetchHistory() async {
    try {
      _downloadHistory = await _apiService.getHistory();
      notifyListeners();
    } catch (e) {
      debugPrint('Failed to fetch history: $e');
    }
  }

  Future<void> clearHistory() async {
    try {
      await _apiService.clearHistory();
      _downloadHistory.clear();
      _statusMessage = 'History cleared';
      notifyListeners();
    } catch (e) {
      _statusMessage = 'Failed to clear history: $e';
      notifyListeners();
    }
  }

  Future<void> deleteHistoryItem(String downloadId) async {
    try {
      await _apiService.deleteHistoryItem(downloadId);
      _downloadHistory.removeWhere((d) => d.id == downloadId);
      _statusMessage = 'Download removed from history';
      notifyListeners();
    } catch (e) {
      _statusMessage = 'Failed to remove download: $e';
      notifyListeners();
    }
  }

  void clearStatusMessage() {
    _statusMessage = '';
    notifyListeners();
  }

  @override
  void dispose() {
    _wsService.disconnect();
    super.dispose();
  }
}
