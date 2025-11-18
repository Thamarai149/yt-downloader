import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/download_provider.dart';
import '../providers/settings_provider.dart';
import '../services/youtube_service.dart';
import '../models/video_info.dart';
import '../utils/constants.dart';
import '../utils/helpers.dart';
import '../widgets/video_info_card.dart';

class SingleDownloadScreen extends StatefulWidget {
  const SingleDownloadScreen({super.key});

  @override
  State<SingleDownloadScreen> createState() => _SingleDownloadScreenState();
}

class _SingleDownloadScreenState extends State<SingleDownloadScreen> {
  final TextEditingController _urlController = TextEditingController();
  final YouTubeService _youtubeService = YouTubeService();

  String _selectedType = AppConstants.downloadTypeVideo;
  String _selectedQuality = 'best';
  VideoInfo? _videoInfo;
  bool _isLoadingInfo = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    final settings = Provider.of<SettingsProvider>(context, listen: false);
    _selectedType = settings.defaultType;
    _selectedQuality = settings.defaultQuality;
  }

  @override
  void dispose() {
    _urlController.dispose();
    _youtubeService.dispose();
    super.dispose();
  }

  Future<void> _fetchVideoInfo() async {
    final url = _urlController.text.trim();

    if (url.isEmpty) {
      setState(() {
        _errorMessage = 'Please enter a URL';
        _videoInfo = null;
      });
      return;
    }

    if (!Helpers.isValidYouTubeUrl(url)) {
      setState(() {
        _errorMessage = 'Please enter a valid YouTube URL';
        _videoInfo = null;
      });
      return;
    }

    setState(() {
      _isLoadingInfo = true;
      _errorMessage = null;
    });

    try {
      final info = await _youtubeService.getVideoInfo(url);
      setState(() {
        _videoInfo = info;
        _isLoadingInfo = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Failed to get video info: $e';
        _videoInfo = null;
        _isLoadingInfo = false;
      });
    }
  }

  Future<void> _startDownload() async {
    final url = _urlController.text.trim();

    if (url.isEmpty || !Helpers.isValidYouTubeUrl(url)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid YouTube URL')),
      );
      return;
    }

    final downloadProvider =
        Provider.of<DownloadProvider>(context, listen: false);

    await downloadProvider.startDownload(
      url: url,
      type: _selectedType,
      quality: _selectedQuality,
    );

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(downloadProvider.statusMessage)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppConstants.spacingMd),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(AppConstants.spacingLg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '📥 Single Video Download',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: AppConstants.spacingLg),

                  // URL Input
                  TextField(
                    controller: _urlController,
                    decoration: const InputDecoration(
                      labelText: 'YouTube URL',
                      hintText: 'https://www.youtube.com/watch?v=...',
                      prefixIcon: Icon(Icons.link),
                    ),
                    onChanged: (_) {
                      if (_videoInfo != null || _errorMessage != null) {
                        setState(() {
                          _videoInfo = null;
                          _errorMessage = null;
                        });
                      }
                    },
                    onSubmitted: (_) => _fetchVideoInfo(),
                  ),

                  const SizedBox(height: AppConstants.spacingMd),

                  // Type Selection
                  SegmentedButton<String>(
                    segments: const [
                      ButtonSegment(
                        value: AppConstants.downloadTypeVideo,
                        label: Text('Video'),
                        icon: Icon(Icons.videocam),
                      ),
                      ButtonSegment(
                        value: AppConstants.downloadTypeAudio,
                        label: Text('Audio'),
                        icon: Icon(Icons.music_note),
                      ),
                    ],
                    selected: {_selectedType},
                    onSelectionChanged: (Set<String> newSelection) {
                      setState(() {
                        _selectedType = newSelection.first;
                      });
                    },
                  ),

                  const SizedBox(height: AppConstants.spacingMd),

                  // Quality Selection
                  DropdownButtonFormField<String>(
                    initialValue: _selectedQuality,
                    decoration: const InputDecoration(
                      labelText: 'Quality',
                      prefixIcon: Icon(Icons.high_quality),
                    ),
                    items: AppConstants.qualityOptions.map((quality) {
                      return DropdownMenuItem(
                        value: quality,
                        child: Text(quality.toUpperCase()),
                      );
                    }).toList(),
                    onChanged: (value) {
                      setState(() {
                        _selectedQuality = value!;
                      });
                    },
                  ),

                  const SizedBox(height: AppConstants.spacingLg),

                  // Action Buttons
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: _isLoadingInfo ? null : _fetchVideoInfo,
                          icon: _isLoadingInfo
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child:
                                      CircularProgressIndicator(strokeWidth: 2),
                                )
                              : const Icon(Icons.info),
                          label: const Text('Get Info'),
                        ),
                      ),
                      const SizedBox(width: AppConstants.spacingMd),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: _startDownload,
                          icon: const Icon(Icons.download),
                          label: const Text('Download'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppConstants.primaryColor,
                            foregroundColor: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: AppConstants.spacingMd),

          // Error Message
          if (_errorMessage != null)
            Card(
              color: AppConstants.errorColor.withValues(alpha: 0.1),
              child: Padding(
                padding: const EdgeInsets.all(AppConstants.spacingMd),
                child: Row(
                  children: [
                    const Icon(Icons.error, color: AppConstants.errorColor),
                    const SizedBox(width: AppConstants.spacingMd),
                    Expanded(
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(color: AppConstants.errorColor),
                      ),
                    ),
                  ],
                ),
              ),
            ),

          // Video Info
          if (_videoInfo != null) VideoInfoCard(videoInfo: _videoInfo!),
        ],
      ),
    );
  }
}
