#!/usr/bin/env bash
# Builds a Codex landing branch and stages it in the existing mirar-landing project as a PROTECTED PREVIEW.
# Never touches production: it never uses --prod, never changes mirar.life, and never merges to main.
#
# Usage:
#   scripts/release/landing-preview.sh <git-ref-in-this-repo>            # build + typecheck only (no deploy)
#   scripts/release/landing-preview.sh <git-ref-in-this-repo> --deploy   # also deploy a preview and set the stable alias
#
# Example: scripts/release/landing-preview.sh refs/codex/mirar-practice-sample --deploy
set -euo pipefail
REF="${1:?git ref required}"; DEPLOY="${2:-}"
APP="$(cd "$(dirname "$0")/../.." && pwd)"
LANDING="${LANDING_REPO:-$APP/../mirar-landing}"
ALIAS="${LANDING_PREVIEW_ALIAS:-mirar-landing-sample-preview.vercel.app}"   # override for a separate stable preview
ENTRY="${LANDING_ENTRY_URL:-https://mirar-app.vercel.app/login}"   # default: verified app sign-in route; override to point a PREVIEW at a staging app
SHA="$(git -C "$APP" rev-parse --short "$REF")"
WT="$(mktemp -d)/src"

echo "== 1. Build $REF ($SHA) in an isolated worktree"
git -C "$APP" worktree add -f "$WT" "$REF" >/dev/null 2>&1
ln -s "$APP/node_modules" "$WT/node_modules"
( cd "$WT" && VITE_MIRAR_APP_ENTRY_URL="$ENTRY" node node_modules/vite/bin/vite.js build --config landing/vite.config.ts --base /aperture/ >/dev/null )
DIST="$WT/landing/dist"; [ -f "$DIST/index.html" ] || { echo "build failed"; exit 1; }
grep -qF "${ENTRY#https://}" "$DIST"/assets/index-*.js && echo "CTA baked in: $ENTRY" || { echo "CTA not found in bundle"; exit 1; }

echo "== 2. Stage in mirar-landing (branch mirar-landing-sample-preview from origin/main; production branch untouched)"
cd "$LANDING"; git fetch -q origin
git checkout -q -B mirar-landing-sample-preview origin/main
mkdir -p public/aperture && cp -R "$DIST/." public/aperture/ && cp "$DIST/mirar-social.png" public/mirar-social.png
cat > public/aperture/PROVENANCE.md <<EOF2
# Aperture landing (PREVIEW build) — provenance
Built artifact; do not edit by hand.
- Source: sahilaharia-design/mirar-app-vercel, ref \`$REF\` ($SHA), landing/ entry.
- Build: VITE_MIRAR_APP_ENTRY_URL=$ENTRY vite build --config landing/vite.config.ts --base /aperture/
- Preview only. Production at https://mirar.life is unchanged until explicitly approved.
EOF2
npx next build >/tmp/landing-build.log 2>&1 && echo "next build OK" || { tail -20 /tmp/landing-build.log; exit 1; }
git add -A; git -c user.name="${GIT_AUTHOR_NAME:-Mirar Release}" commit -q -m "Preview: landing sample from $REF ($SHA)

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" || echo "(no changes to commit)"

if [ "$DEPLOY" = "--deploy" ]; then
  echo "== 3. Deploy a PREVIEW (not production)"
  URL="$(vercel deploy --yes 2>&1 | grep -Eo 'https://mirar-landing-[a-z0-9]+-sahilaharia-designs-projects\.vercel\.app' | tail -1)"
  [ -n "$URL" ] || { echo "no deployment URL"; exit 1; }
  vercel alias set "$URL" "$ALIAS" >/dev/null && echo "Stable protected preview: https://$ALIAS  ->  $URL"
  echo "Production unchanged: $(vercel ls mirar-landing --prod 2>&1 | grep -m1 Production | awk '{print $2}')"
else
  echo "== 3. Skipped deploy (add --deploy)."
fi
git -C "$APP" worktree remove --force "$WT" >/dev/null 2>&1 || true
echo "Done."
