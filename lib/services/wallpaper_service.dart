import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';

class WallpaperService {
  final Dio _dio = Dio();

  // Download and save image for wallpaper
  Future<String?> downloadImageForWallpaper({
    required String imageUrl,
  }) async {
    try {
      // Download to Downloads folder
      final dir = Directory('/storage/emulated/0/Download');
      if (!await dir.exists()) {
        await dir.create(recursive: true);
      }

      final fileName = 'wallpaper_${DateTime.now().millisecondsSinceEpoch}.jpg';
      final filePath = '${dir.path}/$fileName';

      // Download image
      await _dio.download(imageUrl, filePath);

      return filePath;
    } catch (e) {
      debugPrint('Error downloading image: $e');
      return null;
    }
  }

  // Save image to Downloads folder
  Future<String?> saveToDownloads(String imageUrl) async {
    try {
      final dir = Directory('/storage/emulated/0/Download');
      if (!await dir.exists()) {
        await dir.create(recursive: true);
      }

      final fileName = 'thumbnail_${DateTime.now().millisecondsSinceEpoch}.jpg';
      final filePath = '${dir.path}/$fileName';

      // Download image
      await _dio.download(imageUrl, filePath);

      return filePath;
    } catch (e) {
      debugPrint('Error saving to downloads: $e');
      return null;
    }
  }
}
