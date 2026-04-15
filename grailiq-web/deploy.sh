#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
echo "→ Installing deps..."
npm install --silent
echo "→ Building..."
npm run build
echo "→ Deploying to Cloudflare Pages (production)..."
npx wrangler pages deploy dist --project-name=grailiq-web --branch=master --commit-dirty=true
echo "✓ Deployed. Check https://grailiq.com"
