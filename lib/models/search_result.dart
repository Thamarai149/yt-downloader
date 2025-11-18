class SearchResult {
  final String id;
  final String title;
  final String url;
  final int duration;
  final String thumbnail;
  final String uploader;
  final int viewCount;

  SearchResult({
    required this.id,
    required this.title,
    required this.url,
    required this.duration,
    required this.thumbnail,
    required this.uploader,
    required this.viewCount,
  });

  factory SearchResult.fromJson(Map<String, dynamic> json) {
    return SearchResult(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      url: json['url'] ?? '',
      duration: json['duration'] ?? 0,
      thumbnail: json['thumbnail'] ?? '',
      uploader: json['uploader'] ?? '',
      viewCount: json['view_count'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'url': url,
      'duration': duration,
      'thumbnail': thumbnail,
      'uploader': uploader,
      'view_count': viewCount,
    };
  }
}
