import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/update_service.dart';

class UpdateDialog extends StatefulWidget {
  final UpdateInfo updateInfo;

  const UpdateDialog({super.key, required this.updateInfo});

  @override
  State<UpdateDialog> createState() => _UpdateDialogState();
}

class _UpdateDialogState extends State<UpdateDialog> {
  bool _isDownloading = false;
  double _downloadProgress = 0;
  final UpdateService _updateService = UpdateService();

  Future<void> _downloadUpdate() async {
    setState(() {
      _isDownloading = true;
      _downloadProgress = 0;
    });

    try {
      await _updateService.downloadAndInstallUpdate(
        widget.updateInfo.downloadUrl,
        (progress) {
          if (mounted) {
            setState(() {
              _downloadProgress = progress;
            });
          }
        },
      );

      // Open download URL in browser as fallback
      final uri = Uri.parse(widget.updateInfo.downloadUrl);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }

      if (!mounted) return;
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Update downloaded! Please install the APK.'),
          duration: Duration(seconds: 5),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isDownloading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Download failed: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Row(
        children: [
          Icon(Icons.system_update, color: Theme.of(context).primaryColor),
          const SizedBox(width: 12),
          const Text('Update Available'),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Version ${widget.updateInfo.latestVersion} is now available!',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Current version: ${widget.updateInfo.currentVersion}',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 16),
            if (widget.updateInfo.releaseNotes.isNotEmpty) ...[
              const Text(
                'What\'s New:',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  widget.updateInfo.releaseNotes,
                  style: const TextStyle(fontSize: 14),
                ),
              ),
            ],
            if (_isDownloading) ...[
              const SizedBox(height: 16),
              LinearProgressIndicator(value: _downloadProgress / 100),
              const SizedBox(height: 8),
              Text(
                'Downloading... ${_downloadProgress.toStringAsFixed(0)}%',
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 12),
              ),
            ],
          ],
        ),
      ),
      actions: [
        if (!widget.updateInfo.forceUpdate && !_isDownloading)
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Later'),
          ),
        if (!_isDownloading)
          ElevatedButton.icon(
            onPressed: _downloadUpdate,
            icon: const Icon(Icons.download),
            label: const Text('Update Now'),
          ),
      ],
    );
  }
}
