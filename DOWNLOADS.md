# SPIRAL AI Downloads

## Web / PWA
Use the hosted SPIRAL AI site and choose **Install SPIRAL AI** from a supported browser. Android and desktop browsers can install the PWA; iPhone/iPad users can use Safari's Add to Home Screen flow.

## Native packages
Native packages are produced from this same source by the included GitHub Actions workflows:

- Windows: NSIS setup executable and MSI when configured on a Windows runner.
- macOS: Apple Silicon and Intel builds. Direct distribution requires Apple signing/notarization.
- Android: APK build. Store release requires Android signing.
- iOS: Xcode build. App Store release requires Apple signing/App Store Connect.

The source intentionally does not contain private signing certificates, provider API keys, or store credentials.
