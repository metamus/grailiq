#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
echo "→ Committing and pushing..."
git add -A
git commit -m "${1:-ci: redeploy}"
git push origin master
echo "✓ Pushed — Railway will auto-deploy."
