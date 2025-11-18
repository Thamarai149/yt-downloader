import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/settings_service.dart';
import '../services/update_service.dart';
import '../widgets/update_dialog.dart';
import 'app_background_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final SettingsService _settingsService = SettingsService();
  final UpdateService _updateService = UpdateService();
  String? _downloadPath;
  String _defaultQuality = 'highest';
  String _defaultType = 'video';
  String _defaultAudioQuality = 'high';
  bool _isLoading = true;
  String _appVersion = '';
  bool _checkingUpdate = false;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final path = await _settingsService.getDownloadPath();
    final quality = await _settingsService.getDefaultQuality();
    final type = await _settingsService.getDefaultType();
    final packageInfo = await PackageInfo.fromPlatform();
    final prefs = await SharedPreferences.getInstance();
    final audioQuality = prefs.getString('default_audio_quality') ?? 'high';

    setState(() {
      _downloadPath = path;
      _defaultQuality = quality;
      _defaultType = type;
      _defaultAudioQuality = audioQuality;
      _appVersion = '${packageInfo.version} (${packageInfo.buildNumber})';
      _isLoading = false;
    });
  }

  Future<void> _checkForUpdates() async {
    setState(() {
      _checkingUpdate = true;
    });

    final updateInfo = await _updateService.checkForUpdate();

    setState(() {
      _checkingUpdate = false;
    });

    if (updateInfo != null && mounted) {
      showDialog(
        context: context,
        barrierDismissible: !updateInfo.forceUpdate,
        builder: (context) => UpdateDialog(updateInfo: updateInfo),
      );
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('You are using the latest version!')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Settings'), elevation: 0),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Download Path Section
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.folder, color: Colors.blue),
                      const SizedBox(width: 12),
                      Text(
                        'Download Location',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: TextEditingController(
                      text: _downloadPath ?? '/storage/emulated/0/Download',
                    ),
                    decoration: InputDecoration(
                      border: const OutlineInputBorder(),
                      labelText: 'Download Path',
                      hintText: '/storage/emulated/0/Download',
                      suffixIcon: IconButton(
                        icon: const Icon(Icons.save),
                        onPressed: () async {
                          // Save custom path
                          final controller = TextEditingController(
                            text:
                                _downloadPath ?? '/storage/emulated/0/Download',
                          );
                          showDialog(
                            context: context,
                            builder: (context) => AlertDialog(
                              title: const Text('Set Download Path'),
                              content: TextField(
                                controller: controller,
                                decoration: const InputDecoration(
                                  labelText: 'Path',
                                  hintText: '/storage/emulated/0/Download',
                                ),
                              ),
                              actions: [
                                TextButton(
                                  onPressed: () => Navigator.pop(context),
                                  child: const Text('Cancel'),
                                ),
                                ElevatedButton(
                                  onPressed: () async {
                                    final path = controller.text.trim();
                                    if (path.isNotEmpty) {
                                      final navigator = Navigator.of(context);
                                      final messenger =
                                          ScaffoldMessenger.of(context);
                                      await _settingsService
                                          .setDownloadPath(path);
                                      setState(() {
                                        _downloadPath = path;
                                      });
                                      if (mounted) {
                                        navigator.pop();
                                        messenger.showSnackBar(
                                          const SnackBar(
                                            content:
                                                Text('Download path updated!'),
                                          ),
                                        );
                                      }
                                    }
                                  },
                                  child: const Text('Save'),
                                ),
                              ],
                            ),
                          );
                        },
                        tooltip: 'Change path',
                      ),
                    ),
                    readOnly: true,
                    onTap: () async {
                      // Show dialog to change path
                      final controller = TextEditingController(
                        text: _downloadPath ?? '/storage/emulated/0/Download',
                      );
                      showDialog(
                        context: context,
                        builder: (context) => AlertDialog(
                          title: const Text('Set Download Path'),
                          content: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              TextField(
                                controller: controller,
                                decoration: const InputDecoration(
                                  labelText: 'Path',
                                  hintText: '/storage/emulated/0/Download',
                                ),
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'Common paths:\n'
                                '• /storage/emulated/0/Download\n'
                                '• /storage/emulated/0/Movies\n'
                                '• /storage/emulated/0/Music',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                          ),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(context),
                              child: const Text('Cancel'),
                            ),
                            TextButton(
                              onPressed: () async {
                                final navigator = Navigator.of(context);
                                final messenger = ScaffoldMessenger.of(context);
                                await _settingsService.clearDownloadPath();
                                setState(() {
                                  _downloadPath = null;
                                });
                                if (mounted) {
                                  navigator.pop();
                                  messenger.showSnackBar(
                                    const SnackBar(
                                      content: Text('Reset to default path'),
                                    ),
                                  );
                                }
                              },
                              child: const Text('Reset'),
                            ),
                            ElevatedButton(
                              onPressed: () async {
                                final path = controller.text.trim();
                                if (path.isNotEmpty) {
                                  final navigator = Navigator.of(context);
                                  final messenger =
                                      ScaffoldMessenger.of(context);
                                  await _settingsService.setDownloadPath(path);
                                  setState(() {
                                    _downloadPath = path;
                                  });
                                  if (mounted) {
                                    navigator.pop();
                                    messenger.showSnackBar(
                                      const SnackBar(
                                        content: Text('Download path updated!'),
                                      ),
                                    );
                                  }
                                }
                              },
                              child: const Text('Save'),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Default Quality Section
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.videocam, color: Colors.green),
                      const SizedBox(width: 12),
                      Text(
                        'Default Video Quality',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    initialValue: _defaultQuality,
                    decoration: const InputDecoration(
                      border: OutlineInputBorder(),
                      contentPadding: EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                    ),
                    items: const [
                      DropdownMenuItem(
                        value: 'highest',
                        child: Text('Highest Available (Best Quality)'),
                      ),
                      DropdownMenuItem(
                          value: '2160', child: Text('4K (2160p)')),
                      DropdownMenuItem(
                          value: '1440', child: Text('2K (1440p)')),
                      DropdownMenuItem(
                          value: '1080', child: Text('Full HD (1080p)')),
                      DropdownMenuItem(value: '720', child: Text('HD (720p)')),
                      DropdownMenuItem(value: '480', child: Text('SD (480p)')),
                      DropdownMenuItem(value: '360', child: Text('Low (360p)')),
                      DropdownMenuItem(
                          value: '240', child: Text('Very Low (240p)')),
                    ],
                    onChanged: (value) async {
                      if (value != null) {
                        await _settingsService.setDefaultQuality(value);
                        setState(() {
                          _defaultQuality = value;
                        });
                      }
                    },
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Default Audio Quality Section
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.audiotrack, color: Colors.purple),
                      const SizedBox(width: 12),
                      Text(
                        'Default Audio Quality',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    initialValue: _defaultAudioQuality,
                    decoration: const InputDecoration(
                      border: OutlineInputBorder(),
                      labelText: 'Audio Quality',
                      contentPadding: EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                    ),
                    items: const [
                      DropdownMenuItem(
                        value: 'high',
                        child: Text('🎵 High Quality (Best)'),
                      ),
                      DropdownMenuItem(
                        value: 'medium',
                        child: Text('🎶 Medium Quality'),
                      ),
                      DropdownMenuItem(
                        value: 'low',
                        child: Text('🎼 Low Quality (Faster)'),
                      ),
                    ],
                    onChanged: (value) async {
                      if (value != null) {
                        final prefs = await SharedPreferences.getInstance();
                        await prefs.setString('default_audio_quality', value);
                        setState(() {
                          _defaultAudioQuality = value;
                        });
                      }
                    },
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'For music and audio-only downloads',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Default Type Section
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.download, color: Colors.orange),
                      const SizedBox(width: 12),
                      Text(
                        'Default Download Type',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  SegmentedButton<String>(
                    segments: const [
                      ButtonSegment(
                        value: 'video',
                        label: Text('Video'),
                        icon: Icon(Icons.videocam),
                      ),
                      ButtonSegment(
                        value: 'audio',
                        label: Text('Audio'),
                        icon: Icon(Icons.audiotrack),
                      ),
                    ],
                    selected: {_defaultType},
                    onSelectionChanged: (Set<String> newSelection) async {
                      final value = newSelection.first;
                      await _settingsService.setDefaultType(value);
                      setState(() {
                        _defaultType = value;
                      });
                    },
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // App Background Section
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.wallpaper, color: Colors.deepPurple),
                      const SizedBox(width: 12),
                      Text(
                        'App Background',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => const AppBackgroundScreen(),
                          ),
                        );
                      },
                      icon: const Icon(Icons.image),
                      label: const Text('Customize Background'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.deepPurple,
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Set a custom background for the app and use it as your phone wallpaper',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // App Info & Update Section
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.info, color: Colors.purple),
                      const SizedBox(width: 12),
                      Text(
                        'App Information',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  ListTile(
                    leading: const Icon(Icons.apps),
                    title: const Text('Version'),
                    subtitle: Text(_appVersion),
                    contentPadding: EdgeInsets.zero,
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _checkingUpdate ? null : _checkForUpdates,
                      icon: _checkingUpdate
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.system_update),
                      label: Text(
                        _checkingUpdate ? 'Checking...' : 'Check for Updates',
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.purple,
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Info Card
          Card(
            color: Colors.blue[50],
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Icon(Icons.info_outline, color: Colors.blue[700]),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'On Android, downloads are saved to the selected folder or app\'s Downloads directory by default.',
                      style: TextStyle(color: Colors.blue[900]),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
