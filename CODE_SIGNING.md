# Code Signing Guide

Code signing is the process of digitally signing executables and scripts to confirm the software author and guarantee that the code has not been altered or corrupted since it was signed.

## Why Code Signing?

### Benefits

1. **Trust**: Users can verify the application comes from you
2. **Security**: Prevents tampering and malware injection
3. **No SmartScreen Warnings**: Windows won't show scary warnings
4. **Auto-Updates**: Required for secure auto-update mechanism
5. **Professional**: Shows commitment to security and quality

### Without Code Signing

- Windows SmartScreen warnings ("Windows protected your PC")
- Users must click "More info" → "Run anyway"
- Reduced trust and download rates
- Auto-updates may not work properly

## Windows Code Signing

### Obtaining a Certificate

#### Option 1: Commercial Certificate Authority (Recommended)

Popular providers:
- **DigiCert** (formerly Symantec)
- **Sectigo** (formerly Comodo)
- **GlobalSign**
- **SSL.com**

Cost: $100-$500/year

Steps:
1. Choose a provider
2. Verify your identity (business or individual)
3. Purchase "Code Signing Certificate"
4. Download certificate (.pfx or .p12 file)

#### Option 2: Self-Signed Certificate (Development Only)

⚠️ **Not recommended for production** - Users will still see warnings

```powershell
# Create self-signed certificate (Windows)
$cert = New-SelfSignedCertificate -Type CodeSigningCert -Subject "CN=Your Name" -CertStoreLocation Cert:\CurrentUser\My

# Export to PFX
$password = ConvertTo-SecureString -String "YourPassword" -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath "certificate.pfx" -Password $password
```

### Configuration

#### Method 1: Environment Variables (Recommended for CI/CD)

Set these environment variables:

```bash
# Windows
set CSC_LINK=C:\path\to\certificate.pfx
set CSC_KEY_PASSWORD=your_certificate_password

# Or use base64 encoded certificate
set CSC_LINK=data:application/x-pkcs12;base64,BASE64_ENCODED_CERT
set CSC_KEY_PASSWORD=your_certificate_password
```

#### Method 2: electron-builder.json

⚠️ **Not recommended** - Exposes certificate path in repository

```json
{
  "win": {
    "certificateFile": "path/to/certificate.pfx",
    "certificatePassword": "password",
    "signingHashAlgorithms": ["sha256"],
    "signDlls": true
  }
}
```

#### Method 3: Configuration File (Recommended)

Create `electron-builder-signing.json` (add to .gitignore):

```json
{
  "win": {
    "certificateFile": "C:/path/to/certificate.pfx",
    "certificatePassword": "your_password"
  }
}
```

Use with:
```bash
electron-builder --config electron-builder-signing.json
```

### Current Configuration

The `electron-builder.json` is configured to work with or without code signing:

```json
{
  "win": {
    "verifyUpdateCodeSignature": false
  }
}
```

This allows building without a certificate. For production:

1. Set `verifyUpdateCodeSignature: true`
2. Provide certificate via environment variables
3. Build with: `npm run package:win`

### Signing Process

When configured, electron-builder automatically signs:
- Main executable (.exe)
- DLLs (if `signDlls: true`)
- Installer (.exe)
- Uninstaller (.exe)

### Verification

After building, verify the signature:

```powershell
# Check if file is signed
Get-AuthenticodeSignature "path\to\YouTube Downloader Pro-Setup-1.0.0.exe"

# Should show:
# Status: Valid
# SignerCertificate: CN=Your Name
```

Or right-click the .exe → Properties → Digital Signatures tab

## macOS Code Signing

### Obtaining a Certificate

1. Enroll in [Apple Developer Program](https://developer.apple.com/programs/) ($99/year)
2. Create certificates in Apple Developer portal:
   - "Developer ID Application" (for distribution outside Mac App Store)
   - "Developer ID Installer" (for .pkg installers)
3. Download and install in Keychain Access

### Configuration

#### Method 1: Environment Variables

```bash
export CSC_NAME="Developer ID Application: Your Name (TEAM_ID)"
export APPLE_ID="your@email.com"
export APPLE_ID_PASSWORD="app-specific-password"
```

#### Method 2: electron-builder.json

```json
{
  "mac": {
    "identity": "Developer ID Application: Your Name (TEAM_ID)",
    "hardenedRuntime": true,
    "gatekeeperAssess": false,
    "entitlements": "build-resources/entitlements.mac.plist",
    "entitlementsInherit": "build-resources/entitlements.mac.plist"
  },
  "afterSign": "scripts/notarize.js"
}
```

### Notarization

macOS requires notarization (Apple's malware scan):

Create `scripts/notarize.js`:

```javascript
const { notarize } = require('electron-notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  return await notarize({
    appBundleId: 'com.ytdownloader.app',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_ID_PASSWORD,
  });
};
```

Install dependency:
```bash
npm install --save-dev electron-notarize
```

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/build.yml`:

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build-windows:
    runs-on: windows-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm run install:all
      
      - name: Build application
        run: npm run build:all
      
      - name: Decode certificate
        run: |
          echo "${{ secrets.WINDOWS_CERTIFICATE }}" | base64 --decode > certificate.pfx
        shell: bash
      
      - name: Package application
        env:
          CSC_LINK: certificate.pfx
          CSC_KEY_PASSWORD: ${{ secrets.CERTIFICATE_PASSWORD }}
        run: npm run package:win
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: windows-installer
          path: dist-electron/*.exe
      
      - name: Release
        uses: softprops/action-gh-release@v1
        if: startsWith(github.ref, 'refs/tags/')
        with:
          files: dist-electron/*.exe
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  build-macos:
    runs-on: macos-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm run install:all
      
      - name: Build application
        run: npm run build:all
      
      - name: Import certificate
        env:
          CERTIFICATE_P12: ${{ secrets.MACOS_CERTIFICATE }}
          CERTIFICATE_PASSWORD: ${{ secrets.CERTIFICATE_PASSWORD }}
        run: |
          echo "$CERTIFICATE_P12" | base64 --decode > certificate.p12
          security create-keychain -p actions build.keychain
          security default-keychain -s build.keychain
          security unlock-keychain -p actions build.keychain
          security import certificate.p12 -k build.keychain -P "$CERTIFICATE_PASSWORD" -T /usr/bin/codesign
          security set-key-partition-list -S apple-tool:,apple: -s -k actions build.keychain
      
      - name: Package application
        env:
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_ID_PASSWORD: ${{ secrets.APPLE_ID_PASSWORD }}
        run: npm run package:mac
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: macos-installer
          path: dist-electron/*.dmg
```

### GitHub Secrets

Add these secrets to your repository (Settings → Secrets):

**Windows:**
- `WINDOWS_CERTIFICATE`: Base64 encoded .pfx file
- `CERTIFICATE_PASSWORD`: Certificate password

**macOS:**
- `MACOS_CERTIFICATE`: Base64 encoded .p12 file
- `CERTIFICATE_PASSWORD`: Certificate password
- `APPLE_ID`: Your Apple ID email
- `APPLE_ID_PASSWORD`: App-specific password

To encode certificate:
```bash
# Windows/Linux/macOS
base64 -i certificate.pfx -o certificate.txt
# Or
cat certificate.pfx | base64 > certificate.txt
```

## Security Best Practices

### Certificate Storage

1. **Never commit certificates to Git**
   - Add to `.gitignore`: `*.pfx`, `*.p12`, `certificate.*`
   
2. **Use environment variables**
   - Store in CI/CD secrets
   - Use secure credential managers locally

3. **Protect certificate files**
   - Encrypt at rest
   - Limit access permissions
   - Use hardware security modules (HSM) for high-value certificates

### Password Management

1. **Use strong passwords**
   - Minimum 16 characters
   - Mix of letters, numbers, symbols

2. **Store securely**
   - Use password managers
   - Never hardcode in scripts
   - Use environment variables

3. **Rotate regularly**
   - Change passwords periodically
   - Update when team members leave

## Troubleshooting

### "SignTool not found"

**Solution:**
Install Windows SDK or Visual Studio with Windows SDK component.

### "Certificate not found"

**Solution:**
1. Check `CSC_LINK` path is correct
2. Verify certificate is not expired
3. Ensure certificate is in correct format (.pfx for Windows)

### "Invalid password"

**Solution:**
1. Verify `CSC_KEY_PASSWORD` is correct
2. Check for special characters that need escaping
3. Try wrapping password in quotes

### "Certificate not trusted"

**Solution:**
- For self-signed: Install certificate in Trusted Root
- For commercial: Ensure certificate chain is complete

### macOS "App is damaged"

**Solution:**
1. Ensure app is signed correctly
2. Complete notarization process
3. Check entitlements are correct

## Cost Analysis

### Windows

| Option | Cost | Trust Level | Recommended For |
|--------|------|-------------|-----------------|
| Self-signed | Free | Low | Development only |
| Commercial | $100-500/year | High | Production |
| EV Certificate | $300-700/year | Highest | Enterprise |

### macOS

| Option | Cost | Trust Level | Recommended For |
|--------|------|-------------|-----------------|
| Apple Developer | $99/year | High | All production apps |

### Recommendations

- **Hobby/Open Source**: Start without signing, add later
- **Small Business**: Standard code signing certificate
- **Enterprise**: EV certificate for highest trust

## Current Status

The application is currently configured to build **without** code signing:

```json
{
  "win": {
    "verifyUpdateCodeSignature": false
  }
}
```

### To Enable Code Signing:

1. Obtain a code signing certificate
2. Set environment variables:
   ```bash
   set CSC_LINK=path\to\certificate.pfx
   set CSC_KEY_PASSWORD=your_password
   ```
3. Update `electron-builder.json`:
   ```json
   {
     "win": {
       "verifyUpdateCodeSignature": true
     }
   }
   ```
4. Build: `npm run package:win`

## Resources

- [Electron Builder Code Signing](https://www.electron.build/code-signing)
- [Windows Code Signing](https://docs.microsoft.com/en-us/windows/win32/seccrypto/cryptography-tools)
- [Apple Code Signing](https://developer.apple.com/support/code-signing/)
- [DigiCert Code Signing](https://www.digicert.com/signing/code-signing-certificates)

## Support

For code signing issues:
1. Check certificate validity and expiration
2. Verify environment variables are set correctly
3. Review electron-builder logs in `dist-electron/builder-debug.yml`
4. Consult certificate provider's documentation
