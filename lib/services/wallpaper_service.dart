import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

class WallpaperService {
  final Dio _dio = Dio();

  // Download and set wallpaper from URL
  Future<bool> setWallpaperFromUrl({
    required String imageUrl,
    required WallpaperLocation location,
  }) async {
    try {
      // Download image to temp directory
      final tempDir = await getTemporaryDirectory();
      final fileName = 'wallpaper_${DateTime.now().millisecondsSinceEpoch}.jpg';
      final filePath = '${tempDir.path}/$fileName';

      // Download image
      await _dio.download(imageUrl, filePath);

      // Set wallpaper
      final result = await _setWallpaper(filePath, location);

      // Clean up temp file
      try {
        await File(filePath).delete();
      } catch (e) {
        debugPrint('Failed to delete temp file: $e');
      }

      return result;
    } catch (e) {
      debugPrint('Error setting wallpaper: $e');
      return false;
    }
  }

  // Set wallpaper from local file
  Future<bool> setWallpaperFromFile({
    required String filePath,
    required WallpaperLocation location,
  }) async {
    try {
      return await _setWallpaper(filePath, location);
    } catch (e) {
      debugPrint('Error setting wallpaper from file: $e');
      return false;
    }
  }

  // Internal method to set wallpaper
  Future<bool> _setWallpaper(
      String filePath, WallpaperLocation location) async {
    try {
      bool result;

      switch (location) {
        case WallpaperLocation.homeScreen:
          result = await AsyncWallpaper.setWallpaper(
            url: filePath,
            wallpaperLocation: AsyncWallpaper.HOME_SCREEN,
            goToHome: false,
          );
          break;
        case WallpaperLocation.lockScreen:
          result = await AsyncWallpaper.setWallpaper(
            url: filePath,
            wallpaperLocation: AsyncWallpaper.LOCK_SCREEN,
            goToHome: false,
          );
          break;
        case WallpaperLocation.both:
          result = await AsyncWallpaper.setWallpaper(
            url: filePath,
            wallpaperLocation: AsyncWallpaper.BOTH_SCREENS,
            goToHome: false,
          );
          break;
      }

      return result;
    } catch (e) {
      debugPrint('Error in _setWallpaper: $e');
      return false;
    }
  }

  // Save image to gallery
  Future<bool> saveToGallery(String imageUrl) async {
    try {
      // Download image to temp directory
      final tempDir = await getTemporaryDirectory();
      final fileName = 'thumbnail_${DateTime.now().millisecondsSinceEpoch}.jpg';
      final filePath = '${tempDir.path}/$fileName';

      // Download image
      await _dio.download(imageUrl, filePath);

      // Save to gallery
      final result = await ImageGallerySaver.saveFile(filePath);

      // Clean up temp file
      try {
        await File(filePath).delete();
      } catch (e) {
        debugPrint('Failed to delete temp file: $e');
      }

      return result['isSuccess'] ?? false;
    } catch (e) {
      debugPrint('Error saving to gallery: $e');
      return false;
    }
  }
}

enum WallpaperLocation {
  homeScreen,
  lockScreen,
  both,
}
