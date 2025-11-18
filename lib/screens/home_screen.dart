import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/theme_provider.dart';
import '../providers/download_provider.dart';
import '../providers/background_provider.dart';
import '../services/update_service.dart';
import '../widgets/update_dialog.dart';
import 'single_download_screen.dart';
import 'batch_download_screen.dart';
import 'search_screen.dart';
import 'queue_screen.dart';
import 'history_screen.dart';
import 'settings_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;
  final UpdateService _updateService = UpdateService();

  @override
  void initState() {
    super.initState();
    // Check for updates after a short delay
    Future.delayed(const Duration(seconds: 2), _checkForUpdates);
  }

  Future<void> _checkForUpdates() async {
    final updateInfo = await _updateService.checkForUpdate();
    if (updateInfo != null && mounted) {
      showDialog(
        context: context,
        barrierDismissible: !updateInfo.forceUpdate,
        builder: (context) => UpdateDialog(updateInfo: updateInfo),
      );
    }
  }

  final List<Widget> _screens = [
    const SingleDownloadScreen(),
    const BatchDownloadScreen(),
    const SearchScreen(),
    const QueueScreen(),
    const HistoryScreen(),
    const SettingsScreen(),
  ];

  final List<NavigationDestination> _destinations = [
    const NavigationDestination(
      icon: Icon(Icons.download),
      label: 'Single',
    ),
    const NavigationDestination(
      icon: Icon(Icons.list),
      label: 'Batch',
    ),
    const NavigationDestination(
      icon: Icon(Icons.search),
      label: 'Search',
    ),
    const NavigationDestination(
      icon: Icon(Icons.queue),
      label: 'Queue',
    ),
    const NavigationDestination(
      icon: Icon(Icons.history),
      label: 'History',
    ),
    const NavigationDestination(
      icon: Icon(Icons.settings),
      label: 'Settings',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final themeProvider = Provider.of<ThemeProvider>(context);
    final downloadProvider = Provider.of<DownloadProvider>(context);
    final backgroundProvider = Provider.of<BackgroundProvider>(context);

    return backgroundProvider.buildBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          title: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('🎥', style: TextStyle(fontSize: 24)),
              const SizedBox(width: 8),
              Flexible(
                child: Text(
                  'YT Downloader Pro',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          actions: [
            IconButton(
              icon: Icon(
                themeProvider.isDarkMode ? Icons.light_mode : Icons.dark_mode,
              ),
              onPressed: () => themeProvider.toggleTheme(),
              tooltip: 'Toggle theme',
            ),
          ],
        ),
        body: Column(
          children: [
            if (downloadProvider.statusMessage.isNotEmpty)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                color: Theme.of(context).colorScheme.primaryContainer,
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        downloadProvider.statusMessage,
                        style: TextStyle(
                          color:
                              Theme.of(context).colorScheme.onPrimaryContainer,
                        ),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, size: 20),
                      onPressed: () => downloadProvider.clearStatusMessage(),
                      color: Theme.of(context).colorScheme.onPrimaryContainer,
                    ),
                  ],
                ),
              ),
            Expanded(
              child: _screens[_selectedIndex],
            ),
          ],
        ),
        bottomNavigationBar: NavigationBar(
          selectedIndex: _selectedIndex,
          onDestinationSelected: (index) {
            setState(() {
              _selectedIndex = index;
            });
          },
          destinations: _destinations.asMap().entries.map((entry) {
            final index = entry.key;
            final destination = entry.value;

            // Add badge for queue
            if (index == 3 && downloadProvider.activeDownloads.isNotEmpty) {
              return NavigationDestination(
                icon: Badge(
                  label: Text('${downloadProvider.activeDownloads.length}'),
                  child: destination.icon,
                ),
                label: destination.label,
              );
            }

            return destination;
          }).toList(),
        ),
      ),
    );
  }
}
