#!/usr/bin/env bash
set -e
if command -v python3 >/dev/null 2>&1; then
  exec python3 server.py
else
  echo 'Python 3 is required to run the included local backend.'
fi
