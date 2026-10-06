$ErrorActionPreference = 'Stop'
Write-Host 'SPIRAL AI web distribution is static/PWA-ready.'
Write-Host 'For the full AI backend, deploy server.py on a Python host and set the backend URL in SPIRAL Settings.'
if (Get-Command python -ErrorAction SilentlyContinue) {
  python server.py
} else {
  Write-Host 'Python 3 is required to run the included local backend.'
}
