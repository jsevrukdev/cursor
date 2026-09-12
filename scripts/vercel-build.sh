#!/usr/bin/env bash
set -euo pipefail

# Production / preview: Convex deploy key injects VITE_CONVEX_URL then builds the SPA.
# Local or claimable Vercel deploys without a key still emit dist/.
if [[ -n "${CONVEX_DEPLOY_KEY:-}" ]]; then
  npx convex deploy --cmd "npm run build" --cmd-url-env-var-name VITE_CONVEX_URL
elif [[ "${VITE_CONVEX_URL:-}" == https://* ]]; then
  echo "Building frontend against ${VITE_CONVEX_URL}"
  npm run build
else
  echo "CONVEX_DEPLOY_KEY is not set; building the frontend without a Convex URL."
  # Empty vars override Vite's .env.local so anonymous deploys do not point at 127.0.0.1.
  VITE_CONVEX_URL="" VITE_CONVEX_SITE_URL="" npm run build
fi
