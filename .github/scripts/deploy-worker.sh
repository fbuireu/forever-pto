#!/usr/bin/env bash
# Deploys the built Worker. Reads everything from the environment and takes no
# arguments, so the workflow can hand it to nick-fields/retry as a single token.
#
# It is a script rather than an inline `command:` because that action re-parses
# its input and loses the inner quoting. `--message "<sha> - push"` reached
# wrangler as three arguments, leaving `push` as a second positional, and every
# production deploy failed with `Unknown argument: push`. Anything quoted in an
# inline command is exposed to that; here the quoting is the shell's own.

set -euo pipefail

: "${INPUTS_WRANGLER_ENV:?wrangler environment is required}"

args=(deploy --env "${INPUTS_WRANGLER_ENV}")

if [ -n "${INPUTS_WORKER_NAME:-}" ]; then
  args+=(--name "${INPUTS_WORKER_NAME}")
fi

if [ -n "${INPUTS_URL:-}" ]; then
  args+=(--var "NEXT_PUBLIC_SITE_URL:${INPUTS_URL}")
fi

if [ -n "${DEPLOY_MESSAGE:-}" ]; then
  args+=(--message "${DEPLOY_MESSAGE}")
fi

exec pnpm exec wrangler "${args[@]}"
