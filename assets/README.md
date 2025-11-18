# Assets Directory

This directory contains all static assets for the Flutter app.

## Structure

- **images/** - Image files (PNG, JPG, SVG)
  - App logo
  - Splash screen images
  - UI graphics

- **icons/** - Icon files
  - App icons
  - UI icons
  - Custom icons

- **fonts/** - Font files (TTF, OTF)
  - Custom fonts
  - Icon fonts

## Usage

To use assets in your Flutter app, they must be declared in `pubspec.yaml`:

```yaml
flutter:
  assets:
    - assets/images/
    - assets/icons/
  
  fonts:
    - family: CustomFont
      fonts:
        - asset: assets/fonts/CustomFont-Regular.ttf
        - asset: assets/fonts/CustomFont-Bold.ttf
          weight: 700
```

Then reference them in your code:

```dart
// Images
Image.asset('assets/images/logo.png')

// Icons (if using custom icon font)
Icon(IconData(0xe800, fontFamily: 'CustomIcons'))
```
