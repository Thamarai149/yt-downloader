class VideoInfo {
  final String title;
  final int duration;
  final String uploader;
  final int viewCount;
  final String thumbnail;
  final String uploadDate;
  final String description;
  final List<int> qualities;
  final List<dynamic> formats;

  VideoInfo({
    required this.title,
    required this.duration,
    required this.uploader,
    required this.viewCount,
    required this.thumbnail,
    required this.uploadDate,
    required this.description,
    required this.qualities,
    required this.formats,
  });

  factory VideoInfo.fromJson(Map<String, dynamic> json) {
    return VideoInfo(
      title: json['title'] ?? '',
      duration: json['duration'] ?? 0,
      uploader: json['uploader'] ?? '',
      viewCount: json['view_count'] ?? 0,
      thumbnail: json['thumbnail'] ?? '',
      uploadDate: json['upload_date'] ?? '',
      description: json['description'] ?? '',
      qualities: List<int>.from(json['qualities'] ?? []),
      formats: json['formats'] ?? [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'duration': duration,
      'uploader': uploader,
      'view_count': viewCount,
      'thumbnail': thumbnail,
      'upload_date': uploadDate,
      'description': description,
      'qualities': qualities,
      'formats': formats,
    };
  }
}
