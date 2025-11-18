import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:io';

class BackgroundProvider extends ChangeNotifier {
  String? _backgroundImagePath;
  bool _isLoading = true;

  String? get backgroundImagePath => _backgroundImagePath;
  bool get isLoading => _isLoading;
  bool get hasBackground => _backgroundImagePath != null;

  BackgroundProvider() {
    _loadBackground();
  }

  Future<void> _loadBackground() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _backgroundImagePath = prefs.getString('app_background_path');
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      debugPrint('Error loading background: $e');
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> setBackground(String path) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('app_background_path', path);
      _backgroundImagePath = path;
      notifyListeners();
    } catch (e) {
      debugPrint('Error setting background: $e');
    }
  }

  Future<void> removeBackground() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('app_background_path');
      _backgroundImagePath = null;
      notifyListeners();
    } catch (e) {
      debugPrint('Error removing background: $e');
    }
  }

  Widget buildBackground({required Widget child}) {
    if (_isLoading) {
      return child;
    }

    if (_backgroundImagePath == null) {
      return child;
    }

    return Stack(
      children: [
        // Background image
        Positioned.fill(
          child: Image.file(
            File(_backgroundImagePath!),
            fit: BoxFit.cover,
          ),
        ),
        // Semi-transparent overlay for better readability
        Positioned.fill(
          child: Container(
            color: Colors.black.withValues(alpha: 0.3),
          ),
        ),
        // Content
        child,
      ],
    );
  }
}
