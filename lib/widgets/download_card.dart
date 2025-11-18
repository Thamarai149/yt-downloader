import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/download_item.dart';
import 'wallpaper_dialog.dart';

class DownloadCard extends StatelessWidget {
  final DownloadItem item;
  final VoidCallback? onCancel;
  final VoidCallback? onRetry;
  final VoidCallback? onShare;
  final VoidCallback? onOpen;
  final VoidCallback? onWallpaper;

  const DownloadCard({
    super.key,
    required this.item,
    this.onCancel,
    this.onRetry,
    this.onShare,
    this.onOpen,
    this.onWallpaper,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Thumbnail with wallpaper button
                if (item.thumbnail != null)
                  Stack(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: CachedNetworkImage(
                          imageUrl: item.thumbnail!,
                          width: 80,
                          height: 60,
                          fit: BoxFit.cover,
                          placeholder: (context, url) => Container(
                            width: 80,
                            height: 60,
                            color: Colors.grey[300],
                            child: const Icon(Icons.image, color: Colors.grey),
                          ),
                          errorWidget: (context, url, error) => Container(
                            width: 80,
                            height: 60,
                            color: Colors.grey[300],
                            child: const Icon(Icons.error, color: Colors.grey),
                          ),
                        ),
                      ),
                      Positioned(
                        top: 0,
                        right: 0,
                        child: GestureDetector(
                          onTap: () {
                            showDialog(
                              context: context,
                              builder: (context) => WallpaperDialog(
                                imageUrl: item.thumbnail!,
                                title: item.title,
                              ),
                            );
                          },
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(
                              color: Colors.black54,
                              borderRadius: BorderRadius.only(
                                bottomLeft: Radius.circular(8),
                                topRight: Radius.circular(8),
                              ),
                            ),
                            child: const Icon(
                              Icons.wallpaper,
                              size: 16,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                const SizedBox(width: 12),

                // Title and info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.title,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(
                            item.type == 'audio'
                                ? Icons.audiotrack
                                : Icons.videocam,
                            size: 14,
                            color: Colors.grey[600],
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '${item.type.toUpperCase()} • ${item.quality}',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      _buildStatusChip(),
                    ],
                  ),
                ),

                // Actions
                if (item.status == 'downloading' && onCancel != null)
                  IconButton(
                    icon: const Icon(Icons.close, size: 20),
                    onPressed: onCancel,
                    tooltip: 'Cancel',
                  )
                else if (item.status == 'failed' && onRetry != null)
                  IconButton(
                    icon: const Icon(Icons.refresh, size: 20),
                    onPressed: onRetry,
                    tooltip: 'Retry',
                  )
                else if (item.status == 'completed')
                  PopupMenuButton(
                    icon: const Icon(Icons.more_vert, size: 20),
                    itemBuilder: (context) => [
                      if (onOpen != null)
                        const PopupMenuItem(
                          value: 'open',
                          child: Row(
                            children: [
                              Icon(Icons.open_in_new, size: 18),
                              SizedBox(width: 8),
                              Text('Open'),
                            ],
                          ),
                        ),
                      if (onShare != null)
                        const PopupMenuItem(
                          value: 'share',
                          child: Row(
                            children: [
                              Icon(Icons.share, size: 18),
                              SizedBox(width: 8),
                              Text('Share'),
                            ],
                          ),
                        ),
                    ],
                    onSelected: (value) {
                      if (value == 'open' && onOpen != null) onOpen!();
                      if (value == 'share' && onShare != null) onShare!();
                    },
                  ),
              ],
            ),

            // Progress bar for downloading
            if (item.status == 'downloading') ...[
              const SizedBox(height: 12),
              LinearProgressIndicator(
                value: item.progress / 100,
                backgroundColor: Colors.grey[200],
                minHeight: 6,
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${item.progress.toStringAsFixed(1)}%',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[700],
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  if (item.downloadSpeed != null &&
                      item.estimatedTimeRemaining != null)
                    Text(
                      '${item.formattedSpeed} • ${item.formattedETA}',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                ],
              ),
            ],

            // Error message
            if (item.status == 'failed' && item.error != null) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.red[50],
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Row(
                  children: [
                    Icon(Icons.error_outline, size: 16, color: Colors.red[700]),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        item.error!,
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.red[700],
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStatusChip() {
    Color color;
    IconData icon;
    String text;

    switch (item.status) {
      case 'downloading':
        color = Colors.blue;
        icon = Icons.download;
        text = 'Downloading';
        break;
      case 'completed':
        color = Colors.green;
        icon = Icons.check_circle;
        text = 'Completed';
        break;
      case 'failed':
        color = Colors.red;
        icon = Icons.error;
        text = 'Failed';
        break;
      case 'paused':
        color = Colors.orange;
        icon = Icons.pause_circle;
        text = 'Paused';
        break;
      default:
        color = Colors.grey;
        icon = Icons.info;
        text = item.status;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            text,
            style: TextStyle(
              fontSize: 11,
              color: color,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
