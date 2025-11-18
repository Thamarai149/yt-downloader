import '../models/download_item.dart';

// Simplified WebSocket service - Real-time updates via polling
class WebSocketService {
  bool _isConnected = false;

  Function(DownloadItem)? onDownloadStarted;
  Function(DownloadItem)? onDownloadProgress;
  Function(DownloadItem)? onDownloadCompleted;
  Function(DownloadItem)? onDownloadFailed;

  bool get isConnected => _isConnected;

  void connect({String? url}) {
    // Mark as connected - using polling mode for updates
    _isConnected = true;
  }

  void disconnect() {
    _isConnected = false;
  }

  void send(String message) {
    // Not implemented in polling mode
  }
}
