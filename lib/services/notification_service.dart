import 'package:flutter/foundation.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  bool _initialized = false;

  Future<void> initialize() async {
    if (_initialized) return;
    // Notifications disabled due to compatibility issues
    // Progress will be shown in-app instead
    _initialized = true;
    debugPrint('Notification service initialized (in-app only)');
  }

  Future<void> showDownloadProgress({
    required String id,
    required String title,
    required int progress,
    String? speed,
    String? eta,
  }) async {
    // In-app progress only
    debugPrint('Download progress: $title - $progress%');
  }

  Future<void> showDownloadComplete({
    required String id,
    required String title,
  }) async {
    // In-app notification only
    debugPrint('Download complete: $title');
  }

  Future<void> showDownloadFailed({
    required String id,
    required String title,
    required String error,
  }) async {
    // In-app notification only
    debugPrint('Download failed: $title - $error');
  }

  Future<void> cancelNotification(String id) async {
    // No-op
  }

  Future<void> cancelAllNotifications() async {
    // No-op
  }
}
