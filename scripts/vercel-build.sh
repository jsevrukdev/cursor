#!/usr/bin/env bash
set -euo pipefail

# Production / preview: Convex deploy key injects VITE_CONVEX_URL then builds the SPA.
# Local or claimable Vercel deploys without a key still emit dist/.
if [[ -n "${CONVEX_DEPLOY_KEY:-}" ]]; then
  npx convex deploy --cmd "npm run build" --cmd-url-env-var-name VITE_CONVEX_URL
else
  echo "CONVEX_DEPLOY_KEY is not set; building the frontend without a Convex URL."
  env -u VITE_CONVEX_URL -u VITE_CONVEX_SITE_URL npm run build
fi
