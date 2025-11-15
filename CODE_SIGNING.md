# Code Signing Guide

Code signing is **optional** but recommended for production releases. It prevents Windows SmartScreen warnings when users install your app.

## Why Code Signing?

Without code signing:
- ⚠️ Windows SmartScreen shows "Unknown Publisher" warning
- Users must click "More info" → "Run anyway"
- May reduce trust and installation rate

With code signing:
- ✅ Shows your company/name as verified publisher
- ✅ No SmartScreen warnings
- ✅ Builds user trust

## Cost

- **Windows**: $100-400/year (EV Code Signing Certificate)
- **macOS**: $99/year (Apple Developer Program)

## For Personal/Development Use

**You don't need code signing!** Users can still install your app by:
1. Click "More info" on SmartScreen warning
2. Click "Run anyway"

This is normal for unsigned apps and perfectly safe.

## How to Get a Certificate (Production)

### Windows Code Signing

1. **Purchase Certificate** from:
   - DigiCert (~$474/year)
   - Sectigo (~$179/year)
   - SSL.com (~$249/year)

2. **Get EV Certificate** (Extended Validation):
   - Required for Windows 10/11 to avoid SmartScreen
   - Requires business verification
   - Comes on USB token or cloud HSM

3. **Set Environment Variables**:
   ```bash
   # For USB token
   set WIN_CSC_LINK=path\to\certificate.pfx
   set WIN_CSC_KEY_PASSWORD=your_password
   
   # For cloud HSM (DigiCert)
   set SM_API_KEY=your_api_key
   set SM_CLIENT_CERT_FILE=path\to\cert.p12
   set SM_CLIENT_CERT_PASSWORD=your_password
   set SM_CODE_SIGNING_CERT_SHA1_HASH=cert_hash
   ```

4. **Build**:
   ```bash
   npm run package:win
   ```

### macOS Code Signing

1. **Join Apple Developer Program**: https://developer.apple.com ($99/year)

2. **Create Certificates** in Xcode:
   - Developer ID Application
   - Developer ID Installer

3. **Set Environment Variables**:
   ```bash
   export APPLE_ID=your@email.com
   export APPLE_ID_PASSWORD=app-specific-password
   export APPLE_TEAM_ID=your_team_id
   ```

4. **Build**:
   ```bash
   npm run package:mac
   ```

## Testing Without Certificate

Your app works perfectly without signing! Just inform users:

> "Windows may show a security warning because this app is not code-signed. Click 'More info' then 'Run anyway' to install. This is normal for open-source/personal apps."

## Automated Setup

Run the setup wizard (creates template only):
```bash
npm run setup:signing
```

This creates a `.env.signing` template file. You'll need to fill in your actual certificate details.

## References

- [Electron Code Signing](https://www.electron.build/code-signing)
- [Windows Code Signing](https://docs.microsoft.com/en-us/windows/win32/seccrypto/cryptography-tools)
- [Apple Notarization](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
