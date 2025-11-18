import 'package:flutter/foundation.dart';
import 'download_provider.dart';

class BatchProvider with ChangeNotifier {
  final DownloadProvider _downloadProvider;

  bool _isLoading = false;
  String? _error;
  int _totalCount = 0;
  int _completedCount = 0;

  bool get isLoading => _isLoading;
  String? get error => _error;
  int get totalCount => _totalCount;
  int get completedCount => _completedCount;

  BatchProvider(this._downloadProvider);

  Future<void> startBatchDownload({
    required List<String> urls,
    required String type,
    required String quality,
  }) async {
    _isLoading = true;
    _error = null;
    _totalCount = urls.length;
    _completedCount = 0;
    notifyListeners();

    try {
      for (final url in urls) {
        try {
          await _downloadProvider.startDownload(
            url: url,
            type: type,
            quality: quality,
          );
          _completedCount++;
          notifyListeners();
        } catch (e) {
          // Continue with next URL even if one fails
          debugPrint('Failed to download $url: $e');
        }
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
