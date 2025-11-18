import 'package:flutter/foundation.dart';
import '../services/api_service.dart';
import '../models/search_result.dart';

class SearchProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<SearchResult> _results = [];
  bool _isLoading = false;
  String? _error;

  List<SearchResult> get results => _results;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> searchVideos(String query) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _results = await _apiService.searchVideos(query, limit: 20);
    } catch (e) {
      _error = e.toString();
      _results = [];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void clearResults() {
    _results = [];
    _error = null;
    notifyListeners();
  }
}
