import 'package:dio/dio.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:flutter/foundation.dart';
import 'dart:io';

class UpdateService {
  // Update this URL to point to your version info JSON file
  static const String versionCheckUrl =
      'https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/version.json';

  final Dio _dio = Dio();

  // Check if update is available
  Future<UpdateInfo?> checkForUpdate() async {
    try {
      final packageInfo = await PackageInfo.fromPlatform();
      final currentVersion = packageInfo.version;
      final currentBuildNumber = int.parse(packageInfo.buildNumber);

      // Fetch latest version info from server
      final response = await _dio.get(versionCheckUrl);
      final data = response.data;

      final latestVersion = data['version'] as String;
      final latestBuildNumber = data['buildNumber'] as int;
      final downloadUrl = data['downloadUrl'] as String;
      final releaseNotes = data['releaseNotes'] as String? ?? '';
      final forceUpdate = data['forceUpdate'] as bool? ?? false;

      // Compare versions
      if (latestBuildNumber > currentBuildNumber) {
        return UpdateInfo(
          currentVersion: currentVersion,
          latestVersion: latestVersion,
          downloadUrl: downloadUrl,
          releaseNotes: releaseNotes,
          forceUpdate: forceUpdate,
        );
      }

      return null; // No update available
    } catch (e) {
      debugPrint('Error checking for updates: $e');
      return null;
    }
  }

  // Download and install APK
  Future<void> downloadAndInstallUpdate(
    String downloadUrl,
    Function(double) onProgress,
  ) async {
    try {
      // Get download directory
      final dir = Directory('/storage/emulated/0/Download');
      if (!await dir.exists()) {
        await dir.create(recursive: true);
      }

      final filePath = '${dir.path}/YTDownloader_update.apk';
      final file = File(filePath);

      // Delete old APK if exists
      if (await file.exists()) {
        await file.delete();
      }

      // Download APK with progress
      await _dio.download(
        downloadUrl,
        filePath,
        onReceiveProgress: (received, total) {
          if (total != -1) {
            final progress = (received / total * 100);
            onProgress(progress);
          }
        },
      );

      // Install APK (requires user permission)
      // Note: This will open the APK installer
      if (Platform.isAndroid) {
        // The app will need to request INSTALL_PACKAGES permission
        // and use a file provider to install
        debugPrint('APK downloaded to: $filePath');
        // You'll need to use a platform channel or package to trigger installation
      }
    } catch (e) {
      throw Exception('Failed to download update: $e');
    }
  }
}

class UpdateInfo {
  final String currentVersion;
  final String latestVersion;
  final String downloadUrl;
  final String releaseNotes;
  final bool forceUpdate;

  UpdateInfo({
    required this.currentVersion,
    required this.latestVersion,
    required this.downloadUrl,
    required this.releaseNotes,
    required this.forceUpdate,
  });
}
