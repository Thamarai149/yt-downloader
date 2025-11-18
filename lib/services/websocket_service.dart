import 'package:web_socket_channel/web_socket_channel.dart';
import 'dart:convert';
import '../models/download_item.dart';
import '../utils/constants.dart';

class WebSocketService {
  WebSocketChannel? _channel;
  bool _isConnected = false;

  Function(DownloadItem)? onDownloadStarted;
  Function(DownloadItem)? onDownloadProgress;
  Function(DownloadItem)? onDownloadCompleted;
  Function(DownloadItem)? onDownloadFailed;

  bool get isConnected => _isConnected;

  void connect({String? url}) {
    final wsUrl =
        url ?? AppConstants.defaultBackendUrl.replaceFirst('http', 'ws');

    try {
      _channel = WebSocketChannel.connect(Uri.parse(wsUrl));
      _isConnected = true;

      _channel!.stream.listen(
        (message) {
          _handleMessage(message);
        },
        onError: (error) {
          _isConnected = false;
          // Attempt reconnection after 5 seconds
          Future.delayed(const Duration(seconds: 5), () {
            if (!_isConnected) connect(url: url);
          });
        },
        onDone: () {
          _isConnected = false;
          // Attempt reconnection after 5 seconds
          Future.delayed(const Duration(seconds: 5), () {
            if (!_isConnected) connect(url: url);
          });
        },
      );
    } catch (e) {
      _isConnected = false;
      // Attempt reconnection after 5 seconds
      Future.delayed(const Duration(seconds: 5), () {
        if (!_isConnected) connect(url: url);
      });
    }
  }

  void _handleMessage(dynamic message) {
    try {
      final data = jsonDecode(message);
      final event = data['event'];
      final downloadData = data['data'];

      final download = DownloadItem.fromJson(downloadData);

      switch (event) {
        case 'downloadStarted':
          onDownloadStarted?.call(download);
          break;
        case 'downloadProgress':
          onDownloadProgress?.call(download);
          break;
        case 'downloadCompleted':
          onDownloadCompleted?.call(download);
          break;
        case 'downloadFailed':
          onDownloadFailed?.call(download);
          break;
      }
    } catch (e) {
      // Handle parsing error
    }
  }

  void disconnect() {
    _channel?.sink.close();
    _isConnected = false;
  }

  void send(String message) {
    if (_isConnected) {
      _channel?.sink.add(message);
    }
  }
}
