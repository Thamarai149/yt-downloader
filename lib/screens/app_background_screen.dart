import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:io';

class AppBackgroundScreen extends StatefulWidget {
  const AppBackgroundScreen({super.key});

  @override
  State<AppBackgroundScreen> createState() => _AppBackgroundScreenState();
}

class _AppBackgroundScreenState extends State<AppBackgroundScreen> {
  final ImagePicker _picker = ImagePicker();
  String? _backgroundImagePath;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadBackground();
  }

  Future<void> _loadBackground() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _backgroundImagePath = prefs.getString('app_background_path');
      _isLoading = false;
    });
  }

  Future<void> _pickImage() async {
    try {
      final XFile? image = await _picker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 85,
      );

      if (image != null) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('app_background_path', image.path);

        setState(() {
          _backgroundImagePath = image.path;
        });

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Background updated!')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to pick image: $e')),
        );
      }
    }
  }

  Future<void> _removeBackground() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('app_background_path');

    setState(() {
      _backgroundImagePath = null;
    });

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Background removed')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('App Background'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Preview Card
            Card(
              elevation: 4,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              child: Container(
                height: 400,
                width: double.infinity,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  color: Colors.grey[200],
                ),
                child: _backgroundImagePath != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: Image.file(
                          File(_backgroundImagePath!),
                          fit: BoxFit.cover,
                        ),
                      )
                    : Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.image_outlined,
                            size: 80,
                            color: Colors.grey[400],
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'No background set',
                            style: TextStyle(
                              fontSize: 16,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
              ),
            ),
            const SizedBox(height: 24),

            // Action Buttons
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _pickImage,
                icon: const Icon(Icons.photo_library),
                label: const Text('Choose from Gallery'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.all(16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),

            if (_backgroundImagePath != null) ...[
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: _removeBackground,
                  icon: const Icon(Icons.delete_outline),
                  label: const Text('Remove Background'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.all(16),
                    foregroundColor: Colors.red,
                    side: const BorderSide(color: Colors.red),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            ],

            const SizedBox(height: 24),

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
                        'Set a custom background for the app and use it as your phone wallpaper!',
                        style: TextStyle(color: Colors.blue[900]),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
