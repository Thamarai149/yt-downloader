import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../services/wallpaper_service.dart';

class WallpaperDialog extends StatefulWidget {
  final String imageUrl;
  final String title;

  const WallpaperDialog({
    super.key,
    required this.imageUrl,
    required this.title,
  });

  @override
  State<WallpaperDialog> createState() => _WallpaperDialogState();
}

class _WallpaperDialogState extends State<WallpaperDialog> {
  final WallpaperService _wallpaperService = WallpaperService();
  bool _isLoading = false;

  Future<void> _saveImage() async {
    setState(() {
      _isLoading = true;
    });

    final filePath = await _wallpaperService.saveToDownloads(widget.imageUrl);

    if (!mounted) return;

    setState(() {
      _isLoading = false;
    });

    Navigator.of(context).pop();

    if (filePath != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Image saved to Downloads!\nOpen Gallery → Set as wallpaper',
          ),
          backgroundColor: Colors.green,
          duration: Duration(seconds: 4),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to save image'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Image preview
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            child: CachedNetworkImage(
              imageUrl: widget.imageUrl,
              height: 200,
              width: double.infinity,
              fit: BoxFit.cover,
              placeholder: (context, url) => Container(
                height: 200,
                color: Colors.grey[300],
                child: const Center(
                  child: CircularProgressIndicator(),
                ),
              ),
              errorWidget: (context, url, error) => Container(
                height: 200,
                color: Colors.grey[300],
                child: const Icon(Icons.error, size: 48),
              ),
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title
                Text(
                  'Save as Wallpaper',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  widget.title,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.grey[600],
                      ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 16),

                // Info
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.blue[50],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.info_outline, color: Colors.blue[700]),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Image will be saved to Downloads folder. You can then set it as wallpaper from your Gallery app.',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.blue[900],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Loading indicator or buttons
                if (_isLoading)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.all(16),
                      child: CircularProgressIndicator(),
                    ),
                  )
                else ...[
                  // Save button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _saveImage,
                      icon: const Icon(Icons.download),
                      label: const Text('Save to Downloads'),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.all(16),
                        backgroundColor: Colors.green,
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  // Cancel button
                  SizedBox(
                    width: double.infinity,
                    child: TextButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text('Cancel'),
                    ),
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
