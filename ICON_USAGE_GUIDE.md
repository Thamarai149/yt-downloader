# Icon Usage Guide

## Setup

1. **Add flutter_svg package** (already added to pubspec.yaml):
```yaml
dependencies:
  flutter_svg: ^2.0.10
```

2. **Install the package**:
```bash
flutter pub get
```

## Usage Examples

### Basic Usage

```dart
import 'package:flutter_svg/flutter_svg.dart';

// Simple icon
SvgPicture.asset(
  'assets/icons/download.svg',
  width: 24,
  height: 24,
)
```

### With Color

```dart
SvgPicture.asset(
  'assets/icons/success.svg',
  width: 32,
  height: 32,
  colorFilter: ColorFilter.mode(
    Colors.green,
    BlendMode.srcIn,
  ),
)
```

### In a Button

```dart
IconButton(
  icon: SvgPicture.asset(
    'assets/icons/play.svg',
    width: 24,
    height: 24,
  ),
  onPressed: () {
    // Handle play action
  },
)
```

### Using Custom Icon Widget

We created a helper widget for easier usage:

```dart
import 'package:youtube_downloader_pro/widgets/custom_icon.dart';

// Simple usage
CustomIcon(iconName: 'download')

// With custom size
CustomIcon(
  iconName: 'video',
  width: 32,
  height: 32,
)

// With color
CustomIcon(
  iconName: 'success',
  width: 40,
  height: 40,
  color: Colors.green,
)
```

## Available Icons

| Icon Name | Description | Usage |
|-----------|-------------|-------|
| `download` | Download arrow | Download actions |
| `video` | Video camera | Video type selection |
| `audio` | Music note | Audio type selection |
| `play` | Play button | Play/start actions |
| `pause` | Pause button | Pause actions |
| `queue` | Queue list | Download queue |
| `history` | Clock with arrow | History/past downloads |
| `search` | Magnifying glass | Search functionality |
| `settings` | Gear icon | Settings page |
| `share` | Share nodes | Share functionality |
| `success` | Green checkmark | Success messages |
| `error` | Red X | Error messages |
| `warning` | Yellow triangle | Warning messages |
| `info` | Blue info | Information messages |
| `delete` | Trash can | Delete actions |

## Real-World Examples

### Download Button

```dart
ElevatedButton.icon(
  onPressed: () => startDownload(),
  icon: CustomIcon(
    iconName: 'download',
    color: Colors.white,
  ),
  label: const Text('Download'),
)
```

### Status Indicator

```dart
Widget buildStatus(String status) {
  String iconName;
  Color iconColor;
  
  switch (status) {
    case 'completed':
      iconName = 'success';
      iconColor = Colors.green;
      break;
    case 'failed':
      iconName = 'error';
      iconColor = Colors.red;
      break;
    case 'downloading':
      iconName = 'download';
      iconColor = Colors.blue;
      break;
    default:
      iconName = 'info';
      iconColor = Colors.grey;
  }
  
  return CustomIcon(
    iconName: iconName,
    color: iconColor,
    width: 20,
    height: 20,
  );
}
```

### Navigation Item

```dart
ListTile(
  leading: CustomIcon(iconName: 'history'),
  title: const Text('Download History'),
  onTap: () => navigateToHistory(),
)
```

### Type Selector

```dart
Row(
  children: [
    ChoiceChip(
      label: Row(
        children: [
          CustomIcon(iconName: 'video', width: 20, height: 20),
          const SizedBox(width: 8),
          const Text('Video'),
        ],
      ),
      selected: type == 'video',
      onSelected: (selected) => setType('video'),
    ),
    const SizedBox(width: 8),
    ChoiceChip(
      label: Row(
        children: [
          CustomIcon(iconName: 'audio', width: 20, height: 20),
          const SizedBox(width: 8),
          const Text('Audio'),
        ],
      ),
      selected: type == 'audio',
      onSelected: (selected) => setType('audio'),
    ),
  ],
)
```

## Command Line Steps

1. **Add package to pubspec.yaml** (already done):
```bash
# No action needed - already added
```

2. **Install dependencies**:
```bash
flutter pub get
```

3. **Import in your Dart file**:
```dart
import 'package:flutter_svg/flutter_svg.dart';
```

4. **Use the icons**:
```dart
SvgPicture.asset('assets/icons/download.svg', width: 24, height: 24)
```

## Testing Icons

Run the icon examples screen:

```dart
// In your main.dart or any screen
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => const IconExamples(),
  ),
);
```

This will show all available icons in a grid view.
