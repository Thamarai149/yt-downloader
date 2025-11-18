class DownloadItem {
  final String id;
  final String title;
  final String url;
  final String type;
  final String quality;
  String status;
  double progress;
  final DateTime startTime;
  DateTime? endTime;
  String? thumbnail;
  String? fileName;
  int? fileSize;
  String? error;
  double? downloadSpeed; // KB/s
  int? estimatedTimeRemaining; // seconds
  String? filePath;

  DownloadItem({
    required this.id,
    required this.title,
    required this.url,
    required this.type,
    required this.quality,
    required this.status,
    required this.progress,
    required this.startTime,
    this.endTime,
    this.thumbnail,
    this.fileName,
    this.fileSize,
    this.error,
    this.downloadSpeed,
    this.estimatedTimeRemaining,
    this.filePath,
  });

  factory DownloadItem.fromJson(Map<String, dynamic> json) {
    return DownloadItem(
      id: json['id'],
      title: json['title'],
      url: json['url'],
      type: json['type'],
      quality: json['quality'],
      status: json['status'],
      progress: (json['progress'] ?? 0).toDouble(),
      startTime: DateTime.parse(json['startTime']),
      endTime: json['endTime'] != null ? DateTime.parse(json['endTime']) : null,
      thumbnail: json['thumbnail'],
      fileName: json['fileName'],
      fileSize: json['fileSize'],
      error: json['error'],
      downloadSpeed: json['downloadSpeed']?.toDouble(),
      estimatedTimeRemaining: json['estimatedTimeRemaining'],
      filePath: json['filePath'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'url': url,
      'type': type,
      'quality': quality,
      'status': status,
      'progress': progress,
      'startTime': startTime.toIso8601String(),
      'endTime': endTime?.toIso8601String(),
      'thumbnail': thumbnail,
      'fileName': fileName,
      'fileSize': fileSize,
      'error': error,
      'downloadSpeed': downloadSpeed,
      'estimatedTimeRemaining': estimatedTimeRemaining,
      'filePath': filePath,
    };
  }

  DownloadItem copyWith({
    String? status,
    double? progress,
    DateTime? endTime,
    String? error,
    double? downloadSpeed,
    int? estimatedTimeRemaining,
    String? filePath,
  }) {
    return DownloadItem(
      id: id,
      title: title,
      url: url,
      type: type,
      quality: quality,
      status: status ?? this.status,
      progress: progress ?? this.progress,
      startTime: startTime,
      endTime: endTime ?? this.endTime,
      thumbnail: thumbnail,
      fileName: fileName,
      fileSize: fileSize,
      error: error ?? this.error,
      downloadSpeed: downloadSpeed ?? this.downloadSpeed,
      estimatedTimeRemaining:
          estimatedTimeRemaining ?? this.estimatedTimeRemaining,
      filePath: filePath ?? this.filePath,
    );
  }

  // Helper method to format download speed
  String get formattedSpeed {
    if (downloadSpeed == null) return '';
    if (downloadSpeed! < 1024) {
      return '${downloadSpeed!.toStringAsFixed(1)} KB/s';
    } else {
      return '${(downloadSpeed! / 1024).toStringAsFixed(2)} MB/s';
    }
  }

  // Helper method to format ETA
  String get formattedETA {
    if (estimatedTimeRemaining == null) return '';
    final seconds = estimatedTimeRemaining!;
    if (seconds < 60) {
      return '${seconds}s';
    } else if (seconds < 3600) {
      return '${(seconds / 60).floor()}m ${seconds % 60}s';
    } else {
      final hours = (seconds / 3600).floor();
      final minutes = ((seconds % 3600) / 60).floor();
      return '${hours}h ${minutes}m';
    }
  }
}
