#!/usr/bin/env bash
# Pre-flight for the production cutover of the app. Read-only: builds to a temp dir, deploys nothing, prints facts only.
# Run from the repository root on the branch you intend to release.
set -u
fail=0; pass(){ echo "PASS  $1"; }; bad(){ echo "FAIL  $1"; fail=1; }

echo "branch: $(git branch --show-current) @ $(git rev-parse --short HEAD)"
[ -z "$(git status --porcelain)" ] && pass "working tree clean" || bad "working tree not clean"
git fetch -q origin; git merge-base --is-ancestor origin/main HEAD && pass "branch contains origin/main (fast-forward release)" || bad "branch does not contain origin/main"

names=$(vercel env ls 2>/dev/null | grep -E "Production" | awk '{print $1}' | sort | tr '\n' ' ')
[ "$names" = "EXPO_PUBLIC_SUPABASE_ANON_KEY EXPO_PUBLIC_SUPABASE_URL " ] && pass "Production env = Supabase URL + anon key only (no demo, review, admin or dev-tools variables)" || bad "Production env differs: $names"

npx tsc --noEmit >/dev/null 2>&1 && pass "TypeScript" || bad "TypeScript"
for t in scripts/sim/suite.ts scripts/sim/correction-suite.ts scripts/runtime/runtime.test.ts scripts/runtime/mirror.test.ts scripts/runtime/mirror-contract.test.ts scripts/runtime/receipt.test.ts; do
  out=$(npx tsx "$t" 2>&1); echo "$out" | grep -q FAIL && bad "$t" || { echo "$out" | grep -qE "pass|PASS" && pass "$t" || bad "$t (no pass output)"; }
done

# Production-equivalent build: no mock, no review states; only the Supabase URL/anon key (public by design) are supplied.
dist=$(mktemp -d)
U=$(grep "^EXPO_PUBLIC_SUPABASE_URL=" .env | cut -d= -f2-); K=$(grep "^EXPO_PUBLIC_SUPABASE_ANON_KEY=" .env | cut -d= -f2-)
EXPO_PUBLIC_DEV_MOCK=0 EXPO_PUBLIC_REVIEW_STATES= EXPO_PUBLIC_SUPABASE_URL="$U" EXPO_PUBLIC_SUPABASE_ANON_KEY="$K" npx expo export --platform web --output-dir "$dist" >/dev/null 2>&1 && pass "production-equivalent web export" || bad "web export"
python3 scripts/release/check-public-bundle.py --dir "$dist" >/tmp/bundle-check.txt 2>&1 && pass "built bundle: only anon JWT, no admin/service/demo/simulator markers" || { bad "built bundle exposure check"; cat /tmp/bundle-check.txt; }
echo; [ $fail -eq 0 ] && echo "PREFLIGHT: PASS" || echo "PREFLIGHT: FAIL"; exit $fail
