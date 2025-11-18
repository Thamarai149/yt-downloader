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

  Future<void> _setWallpaper(WallpaperLocation location) async {
    setState(() {
      _isLoading = true;
    });

    final success = await _wallpaperService.setWallpaperFromUrl(
      imageUrl: widget.imageUrl,
      location: location,
    );

    if (!mounted) return;

    setState(() {
      _isLoading = false;
    });

    Navigator.of(context).pop();

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          success ? 'Wallpaper set successfully!' : 'Failed to set wallpaper',
        ),
        backgroundColor: success ? Colors.green : Colors.red,
      ),
    );
  }

  Future<void> _saveToGallery() async {
    setState(() {
      _isLoading = true;
    });

    final success = await _wallpaperService.saveToGallery(widget.imageUrl);

    if (!mounted) return;

    setState(() {
      _isLoading = false;
    });

    Navigator.of(context).pop();

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          success ? 'Image saved to gallery!' : 'Failed to save image',
        ),
        backgroundColor: success ? Colors.green : Colors.red,
      ),
    );
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
                  'Set as Wallpaper',
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
                const SizedBox(height: 20),

                // Loading indicator
                if (_isLoading)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.all(16),
                      child: CircularProgressIndicator(),
                    ),
                  )
                else ...[
                  // Wallpaper options
                  _buildOptionButton(
                    icon: Icons.home,
                    label: 'Home Screen',
                    onTap: () => _setWallpaper(WallpaperLocation.homeScreen),
                  ),
                  const SizedBox(height: 8),
                  _buildOptionButton(
                    icon: Icons.lock,
                    label: 'Lock Screen',
                    onTap: () => _setWallpaper(WallpaperLocation.lockScreen),
                  ),
                  const SizedBox(height: 8),
                  _buildOptionButton(
                    icon: Icons.phone_android,
                    label: 'Both Screens',
                    onTap: () => _setWallpaper(WallpaperLocation.both),
                  ),
                  const SizedBox(height: 8),
                  _buildOptionButton(
                    icon: Icons.save,
                    label: 'Save to Gallery',
                    onTap: _saveToGallery,
                    color: Colors.green,
                  ),
                  const SizedBox(height: 12),
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

  Widget _buildOptionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    Color? color,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey[300]!),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            Icon(icon, color: color ?? Theme.of(context).primaryColor),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                  color: color,
                ),
              ),
            ),
            Icon(
              Icons.arrow_forward_ios,
              size: 16,
              color: Colors.grey[400],
            ),
          ],
        ),
      ),
    );
  }
}
