import 'dart:io';
import 'package:flutter/material.dart';

class AppConstants {
  // API Configuration
  static String get defaultBackendUrl {
    if (Platform.isAndroid) {
      // For Android emulator: 10.0.2.2 maps to host machine's localhost
      // For physical device: User should update this in settings to their computer's IP
      return 'http://10.0.2.2:3001';
    }
    return 'http://localhost:3001';
  }

  static const Duration apiTimeout = Duration(seconds: 60);

  // Download Types
  static const String downloadTypeVideo = 'video';
  static const String downloadTypeAudio = 'audio';

  // Quality Options
  static const List<String> qualityOptions = [
    'best',
    '4k',
    '2k',
    '1080',
    '720',
    '480',
    '360',
    '240',
  ];

  // Download Status
  static const String statusPending = 'pending';
  static const String statusDownloading = 'downloading';
  static const String statusCompleted = 'completed';
  static const String statusFailed = 'failed';
  static const String statusCancelled = 'cancelled';

  // Theme Colors
  static const Color primaryColor = Color(0xFF6366F1);
  static const Color secondaryColor = Color(0xFFEC4899);
  static const Color accentColor = Color(0xFF14B8A6);
  static const Color successColor = Color(0xFF10B981);
  static const Color errorColor = Color(0xFFEF4444);
  static const Color warningColor = Color(0xFFF59E0B);

  // Animation Durations
  static const Duration shortAnimation = Duration(milliseconds: 200);
  static const Duration mediumAnimation = Duration(milliseconds: 300);
  static const Duration longAnimation = Duration(milliseconds: 500);

  // Spacing
  static const double spacingXs = 4.0;
  static const double spacingSm = 8.0;
  static const double spacingMd = 16.0;
  static const double spacingLg = 24.0;
  static const double spacingXl = 32.0;

  // Border Radius
  static const double radiusSm = 8.0;
  static const double radiusMd = 12.0;
  static const double radiusLg = 16.0;
  static const double radiusXl = 24.0;

  // Font Sizes
  static const double fontSizeXs = 12.0;
  static const double fontSizeSm = 14.0;
  static const double fontSizeMd = 16.0;
  static const double fontSizeLg = 18.0;
  static const double fontSizeXl = 24.0;
  static const double fontSize2xl = 32.0;
}
