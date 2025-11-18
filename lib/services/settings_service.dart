import 'package:shared_preferences/shared_preferences.dart';

class SettingsService {
  static const String _downloadPathKey = 'download_path';
  static const String _defaultQualityKey = 'default_quality';
  static const String _defaultTypeKey = 'default_type';

  // Get custom download path
  Future<String?> getDownloadPath() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_downloadPathKey);
  }

  // Set custom download path
  Future<void> setDownloadPath(String path) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_downloadPathKey, path);
  }

  // Clear custom download path (use default)
  Future<void> clearDownloadPath() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_downloadPathKey);
  }

  // Get default quality
  Future<String> getDefaultQuality() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_defaultQualityKey) ?? 'highest';
  }

  // Set default quality
  Future<void> setDefaultQuality(String quality) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_defaultQualityKey, quality);
  }

  // Get default type (video/audio)
  Future<String> getDefaultType() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_defaultTypeKey) ?? 'video';
  }

  // Set default type
  Future<void> setDefaultType(String type) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_defaultTypeKey, type);
  }
}
