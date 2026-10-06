# SPIRAL AI Distribution

This repository is the shared SPIRAL AI application layer. It can be delivered as a PWA/web app and packaged by Tauri for Windows, macOS, Android and iOS.

## Web / PWA

Serve the frontend over HTTPS and keep `server.py` behind the same origin or configure the backend URL in Settings. The PWA manifest and service worker are included.

## Native installers

The GitHub Actions workflows build platform artifacts from the same source:

- `release-desktop.yml`: Windows installer plus Intel/Apple Silicon macOS builds.
- `release-android.yml`: Android APK artifact.
- `release-ios.yml`: iOS build preparation artifact. App Store distribution requires Apple signing and App Store Connect configuration.

Tauri requires platform build prerequisites and signing for normal store/direct distribution. The workflows are designed to do the heavy build work on GitHub-hosted runners instead of requiring the developer PC to have every toolchain installed.

## Backend

Provider keys remain server-side. Do not put provider secrets in the frontend. The included Python backend supports chat, web search, file extraction, image/video provider calls, and durable background-job records. Long movie generation still requires a real worker/provider implementation and cannot bypass provider limits.
