import 'dart:io';

class ApiConfig {
  // Default API URLs
  static const String defaultLocalhost = 'http://localhost:3001';
  static const String defaultAndroidEmulator = 'http://10.0.2.2:3001';

  // Get the appropriate base URL based on platform
  static String get baseUrl {
    if (Platform.isAndroid) {
      // For Android emulator, use 10.0.2.2
      // For physical device, user should set their computer's IP in settings
      return defaultAndroidEmulator;
    }
    return defaultLocalhost;
  }

  // API endpoints
  static String get downloadUrl => '$baseUrl/api/download';
  static String get searchUrl => '$baseUrl/api/search';
  static String get infoUrl => '$baseUrl/api/info';
  static String get historyUrl => '$baseUrl/api/history';
  static String get socketUrl => baseUrl;
}
