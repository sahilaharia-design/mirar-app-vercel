#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  Mirar — Supabase deploy script
#  Run once after: export SUPABASE_ACCESS_TOKEN=<your token>
#  Get token at: https://supabase.com/dashboard/account/tokens
# ─────────────────────────────────────────────────────────────
set -e

PROJECT_REF="jranpiyhluyuqigqfyhn"
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "▸ Checking access token..."
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "ERROR: SUPABASE_ACCESS_TOKEN is not set."
  echo ""
  echo "  1. Go to https://supabase.com/dashboard/account/tokens"
  echo "  2. Create a new token named 'mirar-deploy'"
  echo "  3. Run: export SUPABASE_ACCESS_TOKEN=<paste token here>"
  echo "  4. Re-run this script"
  exit 1
fi

cd "$SCRIPT_DIR"

echo "▸ Linking project $PROJECT_REF..."
npx supabase link --project-ref "$PROJECT_REF"

echo ""
echo "▸ Running migration 004 (mirror_text column)..."
npx supabase db push

echo ""
echo "▸ Deploying generate-mirror-insight..."
npx supabase functions deploy generate-mirror-insight --no-verify-jwt

echo ""
echo "▸ Deploying process-checkin (updated: fires mirror insight async)..."
npx supabase functions deploy process-checkin

echo ""
echo "▸ Deploying select-daily-question (updated: adaptive scoring)..."
npx supabase functions deploy select-daily-question

echo ""
echo "▸ Checking ANTHROPIC_API_KEY secret..."
SECRET_CHECK=$(npx supabase secrets list 2>/dev/null | grep ANTHROPIC_API_KEY || true)
if [ -z "$SECRET_CHECK" ]; then
  echo ""
  echo "  ⚠  ANTHROPIC_API_KEY is not set in Supabase secrets."
  echo "     The AI mirror insight will not generate until you set it."
  echo ""
  echo "  Run: npx supabase secrets set ANTHROPIC_API_KEY=<your key>"
  echo "  Get key at: https://console.anthropic.com/settings/keys"
else
  echo "  ✓ ANTHROPIC_API_KEY already set"
fi

echo ""
echo "────────────────────────────────────────────────────────"
echo "✓ Supabase deploy complete."
echo ""
echo "  Migration:              ✓ mirror_text column on alignment_scores"
echo "  generate-mirror-insight ✓ deployed"
echo "  process-checkin:        ✓ deployed"
echo "  select-daily-question:  ✓ deployed"
echo "────────────────────────────────────────────────────────"
