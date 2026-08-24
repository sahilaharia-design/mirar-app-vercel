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
echo "▸ Pushing migrations..."
npx supabase db push

echo ""
echo "▸ Applying v2 translation seed (restores Hindi/Gujarati for Days 1-8)..."
if ! npx supabase db execute --file supabase/seed_v2_translations.sql; then
  echo "  ⚠  Could not apply seed_v2_translations.sql via CLI."
  echo "     Paste its contents into the Supabase SQL editor instead:"
  echo "     https://supabase.com/dashboard/project/$PROJECT_REF/sql"
fi

echo ""
echo "▸ Applying v3 simplified questions (Days 9-11, 13-28 — Day 12 stays locked)..."
if ! npx supabase db execute --file supabase/seed_v3_simplified_questions.sql; then
  echo "  ⚠  Could not apply seed_v3_simplified_questions.sql via CLI."
  echo "     Paste its contents into the Supabase SQL editor instead:"
  echo "     https://supabase.com/dashboard/project/$PROJECT_REF/sql"
fi

echo ""
echo "▸ Applying v3 translations (Hindi/Gujarati for the simplified Days 9-11, 13-28)..."
echo "  Must run AFTER seed_v3_simplified_questions.sql — it re-inserts option rows."
if ! npx supabase db execute --file supabase/seed_v3_translations.sql; then
  echo "  ⚠  Could not apply seed_v3_translations.sql via CLI."
  echo "     Paste its contents into the Supabase SQL editor instead:"
  echo "     https://supabase.com/dashboard/project/$PROJECT_REF/sql"
fi

echo ""
echo "▸ Deploying generate-mirror-insight (updated: multilingual output)..."
npx supabase functions deploy generate-mirror-insight --no-verify-jwt

echo ""
echo "▸ Deploying generate-weekly-signal (updated: Drift Alert push notifications)..."
npx supabase functions deploy generate-weekly-signal --no-verify-jwt

echo ""
echo "▸ Deploying generate-report (updated: multilingual templates)..."
npx supabase functions deploy generate-report

echo ""
echo "▸ Deploying process-checkin (updated: stage-4 report fires on day 28)..."
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
echo "  Migrations:              ✓ pushed"
echo "  Translation seed:        ✓ Days 1-8 hi/gu restored"
echo "  Simplified questions:    ✓ Days 9-11, 13-28 (Day 12 locked)"
echo "  v3 translation seed:     ✓ Days 9-11, 13-28 hi/gu"
echo "  generate-mirror-insight: ✓ deployed (multilingual)"
echo "  generate-weekly-signal:  ✓ deployed (Drift Alert push notifications)"
echo "  generate-report:         ✓ deployed (multilingual)"
echo "  process-checkin:         ✓ deployed (day-28 stage-4 report)"
echo "  select-daily-question:   ✓ deployed"
echo "────────────────────────────────────────────────────────"
