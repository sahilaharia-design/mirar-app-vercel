#!/usr/bin/env bash
# Rotates ADMIN_SECRET and secures the admin edge functions. RUN BY THE SUPABASE ACCOUNT OWNER.
# Never prints a secret. Prints only secret NAMES, digests (hashes), HTTP status codes and byte counts.
#
# Prerequisites (one time):
#   brew install supabase/tap/supabase
#   supabase login                                   # opens a browser; you authorize the CLI
#   supabase link --project-ref jranpiyhluyuqigqfyhn
#
# Usage:
#   scripts/release/secure-edge-functions.sh delete     # rotate, then DELETE admin-analytics and admin-user-list (recommended)
#   scripts/release/secure-edge-functions.sh redeploy   # rotate, then deploy the fail-closed versions from this repo
set -euo pipefail
MODE="${1:-}"; [ "$MODE" = "delete" ] || [ "$MODE" = "redeploy" ] || { sed -n 2,13p "$0"; exit 2; }
REF="jranpiyhluyuqigqfyhn"
command -v supabase >/dev/null || { echo "Supabase CLI not found. See prerequisites."; exit 1; }
command -v openssl >/dev/null || { echo "openssl not found."; exit 1; }

digest() { supabase secrets list --project-ref "$REF" 2>/dev/null | awk -v n="$1" '$1==n || $2==n {print $NF}' | head -1; }

echo "== 1. Before: secret names present (digests only)"
BEFORE_ADMIN="$(digest ADMIN_SECRET || true)"; CRON_PRESENT="$(supabase secrets list --project-ref "$REF" 2>/dev/null | grep -c CRON_SECRET || true)"
echo "ADMIN_SECRET digest: ${BEFORE_ADMIN:-<not set>}"; echo "CRON_SECRET present: $([ "$CRON_PRESENT" -gt 0 ] && echo yes || echo NO)"

echo "== 2. Rotate ADMIN_SECRET (new value is generated and sent to Supabase; it is never displayed or saved)"
# The value goes through a private temp file (mode 600), not the command line, so it never appears in the process list.
umask 077; TMP="$(mktemp)"; trap 'rm -f "$TMP"' EXIT
printf 'ADMIN_SECRET=%s\n' "$(openssl rand -base64 48)" > "$TMP"
supabase secrets set --env-file "$TMP" --project-ref "$REF" >/dev/null
rm -f "$TMP"
AFTER_ADMIN="$(digest ADMIN_SECRET || true)"
if [ -n "$AFTER_ADMIN" ] && [ "$AFTER_ADMIN" != "$BEFORE_ADMIN" ]; then echo "ADMIN_SECRET digest changed: ROTATED"; else echo "ADMIN_SECRET digest did NOT change. Stop and check the dashboard (Edge Functions > Secrets)."; exit 1; fi
echo "Note: nobody, including you, now knows the value. If you want to use the admin functions later, set a value you have saved in your password manager."

echo "== 3. Secure the functions"
if [ "$MODE" = "delete" ]; then
  supabase functions delete admin-analytics --project-ref "$REF"
  supabase functions delete admin-user-list --project-ref "$REF"
else
  supabase functions deploy admin-analytics --project-ref "$REF" --no-verify-jwt
  supabase functions deploy admin-user-list --project-ref "$REF" --no-verify-jwt
fi

echo "== 4. Verify (status code and size only; response bodies are discarded)"
for n in admin-analytics admin-user-list; do
  for H in "none" "x-admin-secret: invalid-test-credential-0001"; do
    if [ "$H" = "none" ]; then ARGS=(); else ARGS=(-H "$H"); fi
    printf "%-16s %-45s " "$n" "${H}"; curl -s -o /dev/null -w "status=%{http_code} bytes=%{size_download}\n" -X POST "https://$REF.supabase.co/functions/v1/$n" "${ARGS[@]}" -H "Content-Type: application/json" -d '{}'
  done
done
echo "Expected: 401 for every line (redeploy mode) or 404 (delete mode)."

echo "== 5. CRON_SECRET"
[ "$CRON_PRESENT" -gt 0 ] && echo "CRON_SECRET exists: trial-lifecycle is gated. No change made." || echo "CRON_SECRET is NOT set: trial-lifecycle can be triggered by anyone holding the public anon key. Tell Claude; do not deploy a fail-closed change until the scheduler is confirmed to send x-cron-secret."
echo "Done."
