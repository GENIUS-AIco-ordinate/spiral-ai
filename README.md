# SPIRAL AI Web App

This is the cross-platform SPIRAL AI web/PWA frontend. It preserves the SPIRAL feature surface: Smart Mode, chat/context, coding, web search, file analysis, image/video requests, Movie Mode, background work, projects, library, saved answers, memory, voice input/output, themes, accent colors, installable PWA behavior and the 2.8-second SPIRAL startup animation.

## Important architecture

The browser is the frontend. AI provider keys stay on the SPIRAL backend and are never put into the website. The frontend calls `/api/chat`, `/api/status`, `/api/extract`, `/api/config` and `/api/jobs` when those backend routes are available.

The included `server.py` is the existing lightweight SPIRAL backend. It is the local/hosted bridge for chat, web search, image/video generation and file extraction. For a public website, deploy the frontend over HTTPS and place the backend behind the same origin or set **SPIRAL backend URL** in Settings.

## Local test

1. Install Python 3.9+.
2. Keep the included `server.py` beside the website files.
3. Start it with `python server.py`.
4. Open `http://127.0.0.1:8765/`.

## Web deployment

Host the frontend files on a static HTTPS host such as Netlify, Vercel, Cloudflare Pages or GitHub Pages. Host the backend on a server that can run Python and keep provider credentials server-side. Set the website's SPIRAL backend URL in Settings if frontend and backend use different domains. Configure CORS on the backend if they are cross-origin.

## Install on devices

- Windows/macOS/Linux: use the browser's Install SPIRAL command where supported.
- Android: Chrome/Edge can install the PWA.
- iPhone/iPad: Safari → Share → Add to Home Screen.

For App Store, Play Store, Microsoft Store or signed desktop installers, use this same frontend as the shared application layer inside a native wrapper later. The PWA is not a replacement for those store packages.

## Features not silently removed

The interface keeps the feature entry points for chat, coding, current web research, file analysis, image/video creation, movie mode, background jobs, memory, saved content, projects, library, voice, themes, installability and notifications-ready background workflows. Actual provider execution still depends on the backend and configured services.
