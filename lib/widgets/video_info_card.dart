import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/video_info.dart';
import '../utils/constants.dart';
import '../utils/helpers.dart';

class VideoInfoCard extends StatelessWidget {
  final VideoInfo videoInfo;

  const VideoInfoCard({super.key, required this.videoInfo});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Thumbnail
          ClipRRect(
            borderRadius: const BorderRadius.vertical(
              top: Radius.circular(AppConstants.radiusMd),
            ),
            child: CachedNetworkImage(
              imageUrl: videoInfo.thumbnail,
              width: double.infinity,
              height: 200,
              fit: BoxFit.cover,
              placeholder: (context, url) => Container(
                height: 200,
                color: Colors.grey.shade300,
                child: const Center(child: CircularProgressIndicator()),
              ),
              errorWidget: (context, url, error) => Container(
                height: 200,
                color: Colors.grey.shade300,
                child: const Icon(Icons.error),
              ),
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(AppConstants.spacingMd),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title
                Text(
                  videoInfo.title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),

                const SizedBox(height: AppConstants.spacingSm),

                // Uploader
                Row(
                  children: [
                    const Icon(Icons.person, size: 16),
                    const SizedBox(width: AppConstants.spacingXs),
                    Text(videoInfo.uploader),
                  ],
                ),

                const SizedBox(height: AppConstants.spacingXs),

                // Duration and Views
                Row(
                  children: [
                    const Icon(Icons.access_time, size: 16),
                    const SizedBox(width: AppConstants.spacingXs),
                    Text(Helpers.formatDuration(videoInfo.duration)),
                    const SizedBox(width: AppConstants.spacingMd),
                    const Icon(Icons.visibility, size: 16),
                    const SizedBox(width: AppConstants.spacingXs),
                    Text(Helpers.formatNumber(videoInfo.viewCount)),
                  ],
                ),

                const SizedBox(height: AppConstants.spacingXs),

                // Upload Date
                Row(
                  children: [
                    const Icon(Icons.calendar_today, size: 16),
                    const SizedBox(width: AppConstants.spacingXs),
                    Text(Helpers.formatYouTubeDate(videoInfo.uploadDate)),
                  ],
                ),

                if (videoInfo.description.isNotEmpty) ...[
                  const SizedBox(height: AppConstants.spacingMd),
                  const Divider(),
                  const SizedBox(height: AppConstants.spacingSm),
                  Text(
                    videoInfo.description,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
