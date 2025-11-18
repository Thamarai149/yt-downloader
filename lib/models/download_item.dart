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
    };
  }

  DownloadItem copyWith({
    String? status,
    double? progress,
    DateTime? endTime,
    String? error,
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
    );
  }
}
