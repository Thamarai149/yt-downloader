import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/download_provider.dart';
import '../utils/constants.dart';

class HistoryScreen extends StatelessWidget {
  const HistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<DownloadProvider>(
      builder: (context, downloadProvider, _) {
        final history = downloadProvider.downloadHistory;

        if (history.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.history,
                  size: 64,
                  color: Colors.grey.shade400,
                ),
                const SizedBox(height: AppConstants.spacingMd),
                Text(
                  'No download history',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: Colors.grey.shade600,
                      ),
                ),
              ],
            ),
          );
        }

        return Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(AppConstants.spacingMd),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Download History (${history.length})',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  TextButton.icon(
                    onPressed: () {
                      showDialog(
                        context: context,
                        builder: (context) => AlertDialog(
                          title: const Text('Clear History'),
                          content: const Text(
                              'Are you sure you want to clear all download history?'),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(context),
                              child: const Text('Cancel'),
                            ),
                            TextButton(
                              onPressed: () {
                                downloadProvider.clearHistory();
                                Navigator.pop(context);
                              },
                              child: const Text('Clear'),
                            ),
                          ],
                        ),
                      );
                    },
                    icon: const Icon(Icons.delete),
                    label: const Text('Clear All'),
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(
                    horizontal: AppConstants.spacingMd),
                itemCount: history.length,
                itemBuilder: (context, index) {
                  final download = history[index];
                  return Card(
                    margin:
                        const EdgeInsets.only(bottom: AppConstants.spacingMd),
                    child: ListTile(
                      leading: Icon(
                        download.type == 'video'
                            ? Icons.videocam
                            : Icons.music_note,
                        color: download.status == 'completed'
                            ? AppConstants.successColor
                            : AppConstants.errorColor,
                      ),
                      title: Text(
                        download.title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      subtitle: Text(
                        '${download.type.toUpperCase()} • ${download.quality} • ${download.status}',
                      ),
                      trailing: IconButton(
                        icon: const Icon(Icons.delete),
                        onPressed: () {
                          downloadProvider.deleteHistoryItem(download.id);
                        },
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        );
      },
    );
  }
}
