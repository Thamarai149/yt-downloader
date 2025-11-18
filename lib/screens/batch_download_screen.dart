import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/batch_provider.dart';
import '../utils/constants.dart';

class BatchDownloadScreen extends StatefulWidget {
  const BatchDownloadScreen({super.key});

  @override
  State<BatchDownloadScreen> createState() => _BatchDownloadScreenState();
}

class _BatchDownloadScreenState extends State<BatchDownloadScreen> {
  final TextEditingController _urlController = TextEditingController();
  final List<String> _urls = [];
  String _selectedType = AppConstants.downloadTypeVideo;
  String _selectedQuality = 'best';

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  void _addUrl() {
    final url = _urlController.text.trim();
    if (url.isNotEmpty && !_urls.contains(url)) {
      setState(() {
        _urls.add(url);
        _urlController.clear();
      });
    }
  }

  void _removeUrl(int index) {
    setState(() {
      _urls.removeAt(index);
    });
  }

  void _startBatchDownload() {
    if (_urls.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please add at least one URL')),
      );
      return;
    }

    context.read<BatchProvider>().startBatchDownload(
          urls: _urls,
          type: _selectedType,
          quality: _selectedQuality,
        );

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
          content: Text('Starting batch download of ${_urls.length} videos')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final batchProvider = Provider.of<BatchProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Batch Download'),
      ),
      body: Column(
        children: [
          // URL Input
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _urlController,
                    decoration: InputDecoration(
                      hintText: 'Enter YouTube URL',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    onSubmitted: (_) => _addUrl(),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filled(
                  onPressed: _addUrl,
                  icon: const Icon(Icons.add),
                  tooltip: 'Add URL',
                ),
              ],
            ),
          ),

          // Type and Quality Selection
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: _selectedType,
                    decoration: InputDecoration(
                      labelText: 'Type',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    items: const [
                      DropdownMenuItem(
                        value: 'video',
                        child: Text('Video'),
                      ),
                      DropdownMenuItem(
                        value: 'audio',
                        child: Text('Audio'),
                      ),
                    ],
                    onChanged: (value) {
                      setState(() {
                        _selectedType = value!;
                      });
                    },
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: _selectedQuality,
                    decoration: InputDecoration(
                      labelText: 'Quality',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    items: AppConstants.qualityOptions
                        .map((quality) => DropdownMenuItem(
                              value: quality,
                              child: Text(quality.toUpperCase()),
                            ))
                        .toList(),
                    onChanged: (value) {
                      setState(() {
                        _selectedQuality = value!;
                      });
                    },
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Start Button
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _urls.isEmpty || batchProvider.isLoading
                    ? null
                    : _startBatchDownload,
                icon: const Icon(Icons.download),
                label: Text('Download ${_urls.length} Videos'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.all(16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
          ),

          const SizedBox(height: 16),

          // URL List
          Expanded(
            child: _urls.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.playlist_add,
                            size: 64, color: Colors.grey.shade400),
                        const SizedBox(height: 16),
                        Text(
                          'Add URLs to start batch download',
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _urls.length,
                    itemBuilder: (context, index) {
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: CircleAvatar(
                            child: Text('${index + 1}'),
                          ),
                          title: Text(
                            _urls[index],
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          trailing: IconButton(
                            icon: const Icon(Icons.delete, color: Colors.red),
                            onPressed: () => _removeUrl(index),
                          ),
                        ),
                      );
                    },
                  ),
          ),

          // Batch Progress
          if (batchProvider.isLoading)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surfaceContainerHighest,
                border: Border(
                  top: BorderSide(
                    color: Theme.of(context).dividerColor,
                  ),
                ),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Batch Progress'),
                      Text(
                        '${batchProvider.completedCount}/${batchProvider.totalCount}',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  LinearProgressIndicator(
                    value: batchProvider.totalCount > 0
                        ? batchProvider.completedCount /
                            batchProvider.totalCount
                        : 0,
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
