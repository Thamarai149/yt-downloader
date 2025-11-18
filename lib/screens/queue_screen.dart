import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/download_provider.dart';
import '../utils/constants.dart';
import '../widgets/download_progress_card.dart';

class QueueScreen extends StatelessWidget {
  const QueueScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<DownloadProvider>(
      builder: (context, downloadProvider, _) {
        final activeDownloads = downloadProvider.activeDownloads;

        if (activeDownloads.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.queue,
                  size: 64,
                  color: Colors.grey.shade400,
                ),
                const SizedBox(height: AppConstants.spacingMd),
                Text(
                  'No active downloads',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: Colors.grey.shade600,
                      ),
                ),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(AppConstants.spacingMd),
          itemCount: activeDownloads.length,
          itemBuilder: (context, index) {
            final download = activeDownloads[index];
            return DownloadProgressCard(
              download: download,
              onCancel: () {
                downloadProvider.cancelDownload(download.id);
              },
            );
          },
        );
      },
    );
  }
}
