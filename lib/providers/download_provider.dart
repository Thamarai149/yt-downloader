import 'dart:async';
import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../models/download_item.dart';
import '../services/youtube_service.dart';
import '../services/notification_service.dart';

class DownloadProvider extends ChangeNotifier {
  final YouTubeService _youtubeService = YouTubeService();
  final NotificationService _notificationService = NotificationService();
  final _uuid = const Uuid();

  // For speed calculation
  final Map<String, DateTime> _lastUpdateTime = {};
  final Map<String, double> _lastProgress = {};

  final List<DownloadItem> _activeDownloads = [];
  List<DownloadItem> _downloadHistory = [];
  bool _isLoading = false;
  String _statusMessage = '';

  List<DownloadItem> get activeDownloads => _activeDownloads;
  List<DownloadItem> get downloadHistory => _downloadHistory;
  bool get isLoading => _isLoading;
  String get statusMessage => _statusMessage;

  DownloadProvider() {
    _loadHistory();
  }

  Future<void> startDownload({
    required String url,
    required String type,
    required String quality,
  }) async {
    _isLoading = true;
    notifyListeners();

    try {
      // Get video info first
      final videoInfo = await _youtubeService.getVideoInfo(url);

      // Create download item
      final downloadItem = DownloadItem(
        id: _uuid.v4(),
        title: videoInfo.title,
        url: url,
        type: type,
        quality: quality,
        status: 'downloading',
        progress: 0,
        startTime: DateTime.now(),
        thumbnail: videoInfo.thumbnail,
      );

      _activeDownloads.add(downloadItem);
      _statusMessage = 'Download started: ${videoInfo.title}';
      notifyListeners();

      // Start download in background
      _performDownload(downloadItem);
    } catch (e) {
      _statusMessage = 'Failed to start download: $e';
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> _performDownload(DownloadItem item) async {
    // Initialize tracking for speed calculation
    _lastUpdateTime[item.id] = DateTime.now();
    _lastProgress[item.id] = 0;

    try {
      String filePath;

      if (item.type == 'audio') {
        filePath = await _youtubeService.downloadAudio(
          url: item.url,
          onProgress: (progress) {
            _updateDownloadProgress(item.id, progress);
          },
        );
      } else {
        filePath = await _youtubeService.downloadVideo(
          url: item.url,
          quality: item.quality,
          onProgress: (progress) {
            _updateDownloadProgress(item.id, progress);
          },
        );
      }

      // Download completed
      final completedItem = item.copyWith(
        status: 'completed',
        progress: 100,
        endTime: DateTime.now(),
        filePath: filePath,
      );
      completedItem.fileName = filePath.split('/').last;

      _activeDownloads.removeWhere((d) => d.id == item.id);
      _downloadHistory.insert(0, completedItem);
      _saveHistory();

      // Show completion notification
      await _notificationService.showDownloadComplete(
        id: item.id,
        title: item.title,
      );

      _statusMessage = 'Download completed: ${item.title}';
      notifyListeners();

      // Cleanup tracking
      _lastUpdateTime.remove(item.id);
      _lastProgress.remove(item.id);
    } catch (e) {
      // Download failed
      final failedItem = item.copyWith(
        status: 'failed',
        endTime: DateTime.now(),
        error: e.toString(),
      );

      _activeDownloads.removeWhere((d) => d.id == item.id);
      _downloadHistory.insert(0, failedItem);
      _saveHistory();

      // Show failure notification
      await _notificationService.showDownloadFailed(
        id: item.id,
        title: item.title,
        error: e.toString(),
      );

      _statusMessage = 'Download failed: ${item.title}';
      notifyListeners();

      // Cleanup tracking
      _lastUpdateTime.remove(item.id);
      _lastProgress.remove(item.id);
    }
  }

  void _updateDownloadProgress(String downloadId, double progress) {
    final index = _activeDownloads.indexWhere((d) => d.id == downloadId);
    if (index == -1) return;

    final item = _activeDownloads[index];
    final now = DateTime.now();

    // Calculate speed and ETA
    double? speed;
    int? eta;

    if (_lastUpdateTime.containsKey(downloadId) &&
        _lastProgress.containsKey(downloadId)) {
      final timeDiff =
          now.difference(_lastUpdateTime[downloadId]!).inMilliseconds;
      if (timeDiff > 0) {
        final progressDiff = progress - _lastProgress[downloadId]!;
        // Speed in KB/s (assuming 1% = some KB, this is approximate)
        speed = (progressDiff / timeDiff) * 1000; // Convert to per second

        // Calculate ETA
        if (progress > 0 && progress < 100) {
          final remainingProgress = 100 - progress;
          eta =
              ((remainingProgress / progressDiff) * (timeDiff / 1000)).round();
        }
      }
    }

    // Update tracking
    _lastUpdateTime[downloadId] = now;
    _lastProgress[downloadId] = progress;

    // Update item
    _activeDownloads[index] = item.copyWith(
      progress: progress,
      downloadSpeed: speed,
      estimatedTimeRemaining: eta,
    );

    // Show notification (throttle to every 5%)
    if (progress.toInt() % 5 == 0) {
      _notificationService.showDownloadProgress(
        id: downloadId,
        title: item.title,
        progress: progress.toInt(),
        speed: speed != null ? item.formattedSpeed : null,
        eta: eta != null ? item.formattedETA : null,
      );
    }

    notifyListeners();
  }

  Future<void> cancelDownload(String downloadId) async {
    _activeDownloads.removeWhere((d) => d.id == downloadId);
    await _notificationService.cancelNotification(downloadId);
    _lastUpdateTime.remove(downloadId);
    _lastProgress.remove(downloadId);
    _statusMessage = 'Download cancelled';
    notifyListeners();
  }

  Future<void> clearHistory() async {
    _downloadHistory.clear();
    await _saveHistory();
    _statusMessage = 'History cleared';
    notifyListeners();
  }

  Future<void> deleteHistoryItem(String downloadId) async {
    _downloadHistory.removeWhere((d) => d.id == downloadId);
    await _saveHistory();
    _statusMessage = 'Download removed from history';
    notifyListeners();
  }

  Future<void> _loadHistory() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final historyJson = prefs.getString('download_history');
      if (historyJson != null) {
        final List<dynamic> decoded = json.decode(historyJson);
        _downloadHistory =
            decoded.map((item) => DownloadItem.fromJson(item)).toList();
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Failed to load history: $e');
    }
  }

  Future<void> _saveHistory() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final historyJson =
          json.encode(_downloadHistory.map((item) => item.toJson()).toList());
      await prefs.setString('download_history', historyJson);
    } catch (e) {
      debugPrint('Failed to save history: $e');
    }
  }

  void clearStatusMessage() {
    _statusMessage = '';
    notifyListeners();
  }

  @override
  void dispose() {
    _youtubeService.dispose();
    super.dispose();
  }
}
