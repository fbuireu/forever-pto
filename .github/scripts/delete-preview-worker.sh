#!/usr/bin/env bash
# Deletes a PR's preview Worker, treating "already gone" as success. Reads
# WORKER_NAME from the environment and takes no arguments — see
# deploy-worker.sh for why the workflow may not inline this.
#
# A closed PR whose deploy never ran has no Worker to delete, and retrying that
# five times cannot make one appear. Only a real failure should fail the job.

set -uo pipefail

: "${WORKER_NAME:?worker name is required}"

output=$(pnpm exec wrangler delete "${WORKER_NAME}" --force 2>&1)
status=$?
echo "${output}"

if [ "${status}" -eq 0 ]; then
  exit 0
fi

if grep -qi 'does not exist' <<<"${output}"; then
  echo "::notice::${WORKER_NAME} was already gone"
  exit 0
fi

exit "${status}"
