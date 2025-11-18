import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/download_item.dart';
import '../utils/constants.dart';

class DownloadProgressCard extends StatelessWidget {
  final DownloadItem download;
  final VoidCallback? onCancel;

  const DownloadProgressCard({
    super.key,
    required this.download,
    this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: AppConstants.spacingMd),
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.spacingMd),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                // Thumbnail
                if (download.thumbnail != null)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(AppConstants.radiusSm),
                    child: CachedNetworkImage(
                      imageUrl: download.thumbnail!,
                      width: 80,
                      height: 60,
                      fit: BoxFit.cover,
                      placeholder: (context, url) => Container(
                        width: 80,
                        height: 60,
                        color: Colors.grey.shade300,
                      ),
                      errorWidget: (context, url, error) => Container(
                        width: 80,
                        height: 60,
                        color: Colors.grey.shade300,
                        child: const Icon(Icons.error),
                      ),
                    ),
                  ),

                const SizedBox(width: AppConstants.spacingMd),

                // Title and Status
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        download.title,
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: AppConstants.spacingXs),
                      Row(
                        children: [
                          Icon(
                            download.type == 'video'
                                ? Icons.videocam
                                : Icons.music_note,
                            size: 16,
                            color: Colors.grey.shade600,
                          ),
                          const SizedBox(width: AppConstants.spacingXs),
                          Text(
                            '${download.type.toUpperCase()} • ${download.quality}',
                            style: TextStyle(
                              fontSize: AppConstants.fontSizeXs,
                              color: Colors.grey.shade600,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                // Cancel Button
                if (onCancel != null)
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: onCancel,
                    tooltip: 'Cancel download',
                  ),
              ],
            ),

            const SizedBox(height: AppConstants.spacingMd),

            // Progress Bar
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      download.status,
                      style: TextStyle(
                        fontSize: AppConstants.fontSizeXs,
                        color: _getStatusColor(download.status),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    Text(
                      '${download.progress.toStringAsFixed(1)}%',
                      style: TextStyle(
                        fontSize: AppConstants.fontSizeXs,
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppConstants.spacingXs),
                LinearProgressIndicator(
                  value: download.progress / 100,
                  backgroundColor: Colors.grey.shade300,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    _getStatusColor(download.status),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'downloading':
        return AppConstants.primaryColor;
      case 'completed':
        return AppConstants.successColor;
      case 'failed':
        return AppConstants.errorColor;
      default:
        return Colors.grey;
    }
  }
}
