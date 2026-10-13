#!/usr/bin/env bash
# Secures the admin edge functions. RUN BY THE SUPABASE ACCOUNT OWNER. Compatible with macOS bash 3.2.
# Never prints a secret. Prints only secret NAMES, digests (hashes), function names, HTTP status codes and byte counts.
# Never calls any function except the two admin functions in the verification step, and never sends a credential that is real.
#
# One-time setup:
#   brew install supabase/tap/supabase
#   supabase login                                   # opens a browser; you authorize the CLI
#   supabase link --project-ref jranpiyhluyuqigqfyhn
#
# Modes (read-only first):
#   scripts/release/secure-edge-functions.sh inventory   # READ-ONLY: lists deployed functions and secret names/digests
#   scripts/release/secure-edge-functions.sh delete      # rotate ADMIN_SECRET, then delete admin-analytics and admin-user-list
#   scripts/release/secure-edge-functions.sh redeploy    # rotate ADMIN_SECRET, then deploy the fail-closed admin functions
#
# Failure handling (why no partial failure leaves you worse off):
#   * Step order is: rotate, confirm, then delete. If rotation fails the script stops and nothing has changed.
#   * Rotation only REPLACES the secret; it never unsets it. The deployed admin code skips its check when the secret is UNSET,
#     so deletion-before-rotation or "delete the secret" would be unsafe, and this script does neither.
#   * If anything fails after rotation, the old leaked value is already dead and the functions are still gated by a value nobody knows.
#   * Re-running is safe: it rotates again and retries the deletion.
set -euo pipefail
MODE="${1:-}"
case "$MODE" in inventory|delete|redeploy) ;; *) sed -n 2,18p "$0"; exit 2;; esac
REF="jranpiyhluyuqigqfyhn"
ADMIN_FUNCS="admin-analytics admin-user-list"

command -v supabase >/dev/null || { echo "Supabase CLI not found. See setup at the top of this file."; exit 1; }
command -v curl >/dev/null || { echo "curl not found."; exit 1; }

echo "== 0. Access check and inventory (read-only)"
supabase functions list --project-ref "$REF" || { echo "Cannot list functions. Run: supabase login, then supabase link --project-ref $REF"; exit 1; }
echo
echo "Secret names and digests (hashes; values are never shown):"
SECRETS="$(supabase secrets list --project-ref "$REF" 2>/dev/null || true)"
echo "$SECRETS"
digest() { echo "$SECRETS" | awk -v n="$1" '$1==n {print $NF}' | head -1; }
BEFORE_ADMIN="$(digest ADMIN_SECRET)"
if echo "$SECRETS" | grep -q "CRON_SECRET"; then echo "CRON_SECRET: present"; else echo "CRON_SECRET: NOT SET"; fi
echo "ADMIN_SECRET digest before: ${BEFORE_ADMIN:-<not set>}"
[ "$MODE" = "inventory" ] && { echo "Inventory only. Nothing was changed."; exit 0; }

echo
echo "This will rotate ADMIN_SECRET and then $MODE: $ADMIN_FUNCS"
read -r -p "Type YES to continue: " OK; [ "$OK" = "YES" ] || { echo "Cancelled. Nothing changed."; exit 1; }

echo "== 1. Rotate ADMIN_SECRET (the new value is generated, sent to Supabase and discarded; it is never displayed)"
command -v openssl >/dev/null || { echo "openssl not found."; exit 1; }
umask 077; TMP="$(mktemp)"; trap 'rm -f "$TMP"' EXIT
printf 'ADMIN_SECRET=%s\n' "$(openssl rand -base64 48)" > "$TMP"
supabase secrets set --env-file "$TMP" --project-ref "$REF" >/dev/null
rm -f "$TMP"

echo "== 2. Confirm the rotation"
SECRETS="$(supabase secrets list --project-ref "$REF" 2>/dev/null || true)"
AFTER_ADMIN="$(digest ADMIN_SECRET)"
if [ -z "$AFTER_ADMIN" ]; then
  echo "Could not read the new digest. The secret may or may not have changed. Open Dashboard > Edge Functions > Secrets and check ADMIN_SECRET exists and 'updated' is just now. STOPPING before any deletion; the functions remain gated."
  exit 1
fi
if [ "$AFTER_ADMIN" = "$BEFORE_ADMIN" ]; then
  echo "Digest unchanged, so the secret was NOT rotated. STOPPING before any deletion; nothing has changed."
  exit 1
fi
echo "ADMIN_SECRET digest changed: ROTATED. The previously leaked value no longer works."

echo "== 3. $MODE the admin functions (one at a time; stops on the first failure)"
BK="$(mktemp -d)"
for n in $ADMIN_FUNCS; do
  if [ "$MODE" = "delete" ]; then
    # best-effort backup of the deployed source before deleting (the repository also holds the source)
    ( cd "$BK" && mkdir -p supabase && supabase functions download "$n" --project-ref "$REF" >/dev/null 2>&1 ) && echo "backed up $n to $BK" || echo "(backup of $n not possible; the repository holds its source)"
    supabase functions delete "$n" --project-ref "$REF"
    echo "deleted $n"
  else
    supabase functions deploy "$n" --project-ref "$REF" --no-verify-jwt
    echo "redeployed $n"
  fi
done

echo "== 4. Verify (status and size only; bodies discarded; the test credential is a dummy)"
for n in $ADMIN_FUNCS; do
  printf "%-16s no credential          " "$n"
  curl -s -o /dev/null -w "status=%{http_code} bytes=%{size_download}\n" -X POST "https://$REF.supabase.co/functions/v1/$n" -H "Content-Type: application/json" -d '{}'
  printf "%-16s wrong credential       " "$n"
  curl -s -o /dev/null -w "status=%{http_code} bytes=%{size_download}\n" -X POST "https://$REF.supabase.co/functions/v1/$n" -H "x-admin-secret: invalid-test-credential-0001" -H "Content-Type: application/json" -d '{}'
done
echo "Expected: 404 on every line after delete; 401 on every line after redeploy."
echo "Done."
