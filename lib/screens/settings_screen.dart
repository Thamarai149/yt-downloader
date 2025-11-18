import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/theme_provider.dart';
import '../providers/settings_provider.dart';
import '../utils/constants.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final themeProvider = Provider.of<ThemeProvider>(context);
    final settingsProvider = Provider.of<SettingsProvider>(context);

    return ListView(
      padding: const EdgeInsets.all(AppConstants.spacingMd),
      children: [
        Text(
          'Settings',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: AppConstants.spacingLg),

        // Appearance Section
        Card(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.all(AppConstants.spacingMd),
                child: Text(
                  'Appearance',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ),
              ListTile(
                leading: const Icon(Icons.palette),
                title: const Text('Theme'),
                subtitle: Text(_getThemeModeName(themeProvider.themeMode)),
                trailing: SegmentedButton<ThemeMode>(
                  segments: const [
                    ButtonSegment(
                      value: ThemeMode.light,
                      icon: Icon(Icons.light_mode, size: 16),
                    ),
                    ButtonSegment(
                      value: ThemeMode.dark,
                      icon: Icon(Icons.dark_mode, size: 16),
                    ),
                    ButtonSegment(
                      value: ThemeMode.system,
                      icon: Icon(Icons.settings_suggest, size: 16),
                    ),
                  ],
                  selected: {themeProvider.themeMode},
                  onSelectionChanged: (Set<ThemeMode> newSelection) {
                    themeProvider.setThemeMode(newSelection.first);
                  },
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: AppConstants.spacingMd),

        // Download Settings Section
        Card(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.all(AppConstants.spacingMd),
                child: Text(
                  'Download Settings',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ),
              ListTile(
                leading: const Icon(Icons.high_quality),
                title: const Text('Default Quality'),
                subtitle: Text(settingsProvider.defaultQuality.toUpperCase()),
                trailing: DropdownButton<String>(
                  value: settingsProvider.defaultQuality,
                  items: AppConstants.qualityOptions.map((quality) {
                    return DropdownMenuItem(
                      value: quality,
                      child: Text(quality.toUpperCase()),
                    );
                  }).toList(),
                  onChanged: (value) {
                    if (value != null) {
                      settingsProvider.setDefaultQuality(value);
                    }
                  },
                ),
              ),
              ListTile(
                leading: const Icon(Icons.video_library),
                title: const Text('Default Type'),
                subtitle: Text(settingsProvider.defaultType.toUpperCase()),
                trailing: SegmentedButton<String>(
                  segments: const [
                    ButtonSegment(
                      value: 'video',
                      label: Text('Video'),
                    ),
                    ButtonSegment(
                      value: 'audio',
                      label: Text('Audio'),
                    ),
                  ],
                  selected: {settingsProvider.defaultType},
                  onSelectionChanged: (Set<String> newSelection) {
                    settingsProvider.setDefaultType(newSelection.first);
                  },
                ),
              ),
              SwitchListTile(
                secondary: const Icon(Icons.notifications),
                title: const Text('Notifications'),
                subtitle: const Text('Show download notifications'),
                value: settingsProvider.notifications,
                onChanged: (value) {
                  settingsProvider.setNotifications(value);
                },
              ),
            ],
          ),
        ),

        const SizedBox(height: AppConstants.spacingMd),

        // Server Settings Section
        Card(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.all(AppConstants.spacingMd),
                child: Text(
                  'Server Settings',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ),
              ListTile(
                leading: const Icon(Icons.dns),
                title: const Text('Backend URL'),
                subtitle: Text(settingsProvider.backendUrl),
                trailing: IconButton(
                  icon: const Icon(Icons.edit),
                  onPressed: () {
                    _showBackendUrlDialog(context, settingsProvider);
                  },
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: AppConstants.spacingMd),

        // About Section
        Card(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.all(AppConstants.spacingMd),
                child: Text(
                  'About',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ),
              const ListTile(
                leading: Icon(Icons.info),
                title: Text('Version'),
                subtitle: Text('2.0.0'),
              ),
              const ListTile(
                leading: Icon(Icons.code),
                title: Text('Built with Flutter'),
                subtitle: Text('Cross-platform YouTube downloader'),
              ),
            ],
          ),
        ),
      ],
    );
  }

  String _getThemeModeName(ThemeMode mode) {
    switch (mode) {
      case ThemeMode.light:
        return 'Light';
      case ThemeMode.dark:
        return 'Dark';
      case ThemeMode.system:
        return 'System';
    }
  }

  void _showBackendUrlDialog(
      BuildContext context, SettingsProvider settingsProvider) {
    final controller = TextEditingController(text: settingsProvider.backendUrl);

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Backend URL'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(
            labelText: 'URL',
            hintText: 'http://localhost:5000',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              settingsProvider.setBackendUrl(controller.text);
              Navigator.pop(context);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }
}
