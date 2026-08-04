#!/usr/bin/env bash
# Uploads the Worker's secrets in one call. Reads everything from the
# environment and takes no arguments — see deploy-worker.sh for why the
# workflow may not inline this.

set -euo pipefail

REQUIRED_SECRETS=(JWT_SECRET STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET RESEND_API_KEY TURSO_AUTH_TOKEN)

missing=()
for name in "${REQUIRED_SECRETS[@]}"; do
  if [ -z "${!name:-}" ]; then
    missing+=("$name")
  fi
done

if [ ${#missing[@]} -gt 0 ]; then
  echo "::error::missing required secrets: ${missing[*]}"
  exit 1
fi

if [ -n "${INPUTS_WORKER_NAME:-}" ]; then
  target=(--name "${INPUTS_WORKER_NAME}")
else
  target=(--env "${INPUTS_WRANGLER_ENV:?wrangler environment is required}")
fi

REQUIRED_SECRETS="${REQUIRED_SECRETS[*]}" node -e '
  const names = process.env.REQUIRED_SECRETS.split(" ");
  process.stdout.write(JSON.stringify(Object.fromEntries(names.map((n) => [n, process.env[n]]))));
' | pnpm exec wrangler secret bulk "${target[@]}"
