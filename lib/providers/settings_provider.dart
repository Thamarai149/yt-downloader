import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SettingsProvider extends ChangeNotifier {
  String _backendUrl = 'http://localhost:5000';
  String _defaultQuality = 'best';
  String _defaultType = 'video';
  String _downloadPath = '';
  bool _autoDownload = false;
  bool _notifications = true;

  String get backendUrl => _backendUrl;
  String get defaultQuality => _defaultQuality;
  String get defaultType => _defaultType;
  String get downloadPath => _downloadPath;
  bool get autoDownload => _autoDownload;
  bool get notifications => _notifications;

  SettingsProvider() {
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    _backendUrl = prefs.getString('backendUrl') ?? 'http://localhost:5000';
    _defaultQuality = prefs.getString('defaultQuality') ?? 'best';
    _defaultType = prefs.getString('defaultType') ?? 'video';
    _downloadPath = prefs.getString('downloadPath') ?? '';
    _autoDownload = prefs.getBool('autoDownload') ?? false;
    _notifications = prefs.getBool('notifications') ?? true;
    notifyListeners();
  }

  Future<void> setBackendUrl(String url) async {
    _backendUrl = url;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('backendUrl', url);
    notifyListeners();
  }

  Future<void> setDefaultQuality(String quality) async {
    _defaultQuality = quality;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('defaultQuality', quality);
    notifyListeners();
  }

  Future<void> setDefaultType(String type) async {
    _defaultType = type;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('defaultType', type);
    notifyListeners();
  }

  Future<void> setDownloadPath(String path) async {
    _downloadPath = path;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('downloadPath', path);
    notifyListeners();
  }

  Future<void> setAutoDownload(bool value) async {
    _autoDownload = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('autoDownload', value);
    notifyListeners();
  }

  Future<void> setNotifications(bool value) async {
    _notifications = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('notifications', value);
    notifyListeners();
  }

  Future<void> resetSettings() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    await _loadSettings();
  }
}
