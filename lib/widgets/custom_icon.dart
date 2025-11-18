import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

/// Custom icon widget to display SVG icons from assets
class CustomIcon extends StatelessWidget {
  final String iconName;
  final double? width;
  final double? height;
  final Color? color;

  const CustomIcon({
    super.key,
    required this.iconName,
    this.width = 24,
    this.height = 24,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return SvgPicture.asset(
      'assets/icons/$iconName.svg',
      width: width,
      height: height,
      colorFilter:
          color != null ? ColorFilter.mode(color!, BlendMode.srcIn) : null,
    );
  }
}

/// Example usage of custom icons
class IconExamples extends StatelessWidget {
  const IconExamples({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Icon Examples')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: GridView.count(
          crossAxisCount: 3,
          mainAxisSpacing: 20,
          crossAxisSpacing: 20,
          children: [
            _buildIconCard('download', 'Download'),
            _buildIconCard('video', 'Video'),
            _buildIconCard('audio', 'Audio'),
            _buildIconCard('play', 'Play'),
            _buildIconCard('pause', 'Pause'),
            _buildIconCard('queue', 'Queue'),
            _buildIconCard('history', 'History'),
            _buildIconCard('search', 'Search'),
            _buildIconCard('settings', 'Settings'),
            _buildIconCard('share', 'Share'),
            _buildIconCard('success', 'Success'),
            _buildIconCard('error', 'Error'),
            _buildIconCard('warning', 'Warning'),
            _buildIconCard('info', 'Info'),
            _buildIconCard('delete', 'Delete'),
          ],
        ),
      ),
    );
  }

  Widget _buildIconCard(String iconName, String label) {
    return Card(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CustomIcon(iconName: iconName, width: 48, height: 48),
          const SizedBox(height: 8),
          Text(
            label,
            style: const TextStyle(fontSize: 12),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
