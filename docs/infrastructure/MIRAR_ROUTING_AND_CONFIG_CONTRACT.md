# Mirar — routing and configuration contract (for the production landing)

Verified 12 October 2026 against live deployed routes, repository code and Supabase's public auth settings. Items I could **not** verify are marked **UNVERIFIED**; do not treat them as facts. No secret values appear here.

Consumer: Codex (production Aperture landing for `https://mirar.life`). Owner: Claude (integration and release).

## 1. Authoritative URLs

| Purpose | URL | Verified how |
|---|---|---|
| **App origin (canonical, unchanged)** | `https://mirar-app.vercel.app` | Production alias of Vercel project `mirar-app`; HTTP 200 |
| **CTA for new visitors** | `https://mirar-app.vercel.app/login` | Client route `app/(auth)/login.tsx` → email entry; rendered in a browser |
| **Returning-user sign-in** | `https://mirar-app.vercel.app/login` (same URL) | The app has **one** passwordless entry. `signInWithOtp({ shouldCreateUser: true })` creates the account for a new email and signs in an existing one. There is no separate signup route. |
| App entry for a signed-in user | `https://mirar-app.vercel.app/` | `app/index.tsx`: signed-in → `/(tabs)/` (Today); signed-out → the app's own discovery page |
| Do **not** use | `https://mirar-app.vercel.app/try`, `/assess`, `/signals`, `/reports` | Retired v1 routes; each now redirects to `/login` or Today. `/try` is what the old landing linked to. |
| Do **not** use | `https://mirar-app-sahilaharia-designs-projects.vercel.app`, any `*.vercel.app` deployment URL, `https://mirar-app-vercel.vercel.app` | Non-canonical aliases / a stray project (see §6) |

Every app path returns HTTP 200 because the app is a single-page app with a catch-all rewrite (`vercel.json`). So a 200 does not prove a route is valid; the table above was checked by rendering the page.

## 2. Authentication flow (as implemented)

1. User opens `/login`, enters an email, presses **Send my sign-in link**.
2. Client (`stores/auth-store.ts`, `signInWithEmail`) calls Supabase `signInWithOtp` with `emailRedirectTo = window.location.origin + '/auth/callback'`. On the production app that is exactly `https://mirar-app.vercel.app/auth/callback`. Native builds use `mirar://auth/callback`.
3. Email arrives from Supabase. The link opens `https://mirar-app.vercel.app/auth/callback` with a session.
4. `app/auth/callback.tsx` reads the session, looks the user up in `users`:
   - row exists → `/(tabs)/` (Today)
   - no row → `/(auth)/onboarding` (idempotent account creation) → short introduction → Today
5. Sign-out clears the session and all on-device Inner Rep data.

**Verified on the live app:**
- `…/auth/callback?error=access_denied&error_code=otp_expired` → `/login?auth_error=otp_expired`, with the message "That link has expired or was already used. Enter your email to get a new one."
- `…/auth/callback` with no session → `/login?auth_error=no_session`, same message.
- A real magic-link sign-in from `mirar-app.vercel.app` was completed end to end by the product owner on 8 October 2026 (existing account).

**Not verified in this audit:** first-time signup on a brand-new email (account creation + introduction) and the sent-email content; both need a real inbox.

## 3. Supabase authentication settings

From Supabase's **public** auth settings endpoint (anon key; the same data any visitor can read):
- Email provider: **enabled**. All social, phone and anonymous providers: **disabled**.
- Sign-ups: **enabled** (`disable_signup: false`).
- Email auto-confirm: **off** (a link must be followed).

**UNVERIFIED (not readable without dashboard or management access):** the **Site URL** and the **Redirect URLs allowlist**. What is known from behaviour: `https://mirar-app.vercel.app/auth/callback` works (a real login returned there). Whether `https://mirar.life/auth/callback` or `https://www.mirar.life/auth/callback` is allowed is unknown.

## 4. Cross-domain authentication between `mirar.life` and the app

**There is none, by design, and none is needed.** The landing never holds a session. The visitor follows a plain link to `mirar-app.vercel.app/login`, and the entire flow (request, email, callback, session) happens on the `mirar-app.vercel.app` origin. Browser sessions are origin-bound, so a session created there is not visible on `mirar.life`, and the landing must not try to read one (no "signed-in" state on the landing).

**Do not change the app's origin or serve the app under `mirar.life` without an explicit decision.** If the app were served on `mirar.life`, the redirect origin changes to `https://mirar.life/auth/callback`, which must first be added to Supabase's Redirect URLs (UNVERIFIED), and existing sessions on `mirar-app.vercel.app` would not carry over.

## 5. Legal and contact links

| Item | Canonical URL | Status |
|---|---|---|
| Privacy Policy | `https://mirar.life/privacy` | Exists (HTTP 200) but **content is out of date for v2** (see below) |
| Terms of Service | `https://mirar.life/terms` | Exists (HTTP 200); "Last updated August 19, 2026"; describes the v1 product |
| Cookie Policy | `https://mirar.life/cookies` | Exists (HTTP 200); "Last updated August 24, 2026"; accurate for Google Analytics on the landing |
| In-app beta privacy explanation | `https://mirar-app.vercel.app/privacy` | Exists; plain-language description of beta retention; **not** a legal policy |
| Contact | `mailto:info@mirar.life` | Used across the landing and app |
| Social | Substack `https://substack.com/@mirarlife`; Instagram `https://www.instagram.com/mirar.life`; LinkedIn `https://www.linkedin.com/company/mirarlife/`; Facebook `https://www.facebook.com/people/Mirar/61577255832081/` | Present in the previous landing footer; optional |

**Blocker for the landing's legal links.** The live `/privacy` and `/terms` still describe the retired v1 product: daily check-ins stored on the server, "cycle" progress, streaks, theme scores, and email notifications through Brevo. The v2 beta stores structured practice on the user's device only, with no scores or streaks. The landing must not link to policies that contradict the product. Needed before the landing claims anything about privacy: rewrite `/privacy` and `/terms` for v2 and have a qualified person review them. This is not legal advice and I have not drafted legal text.

Further defects on the pages that exist today: they still render the **old header** (anchors `/#practice` and `/#dimensions`, which no longer exist, and a "Check in now / Start →" CTA that points to the retired `/try`). When the new landing ships, these routes must adopt the new header and footer.

## 6. Vercel projects (do not confuse them)

| Project | Role | Production URL | Notes |
|---|---|---|---|
| `mirar-app` (`prj_MQ6UtgGbBjlIRCC75Bcw0yIoQKgX`) | **The application** | `https://mirar-app.vercel.app` | Build `npm run build`; output `dist`; Node 24 |
| `mirar-landing` (`prj_xq8MRZ8vTijgep4K0GKd6Q801lm1`) | **The public site** | `https://mirar.life` (and `www`) | Next.js. Repo `sahilaharia-design/mirar-landing`. |
| `mirar-app-vercel` | **Stray duplicate** of the app (same repo name) | `https://mirar-app-vercel.vercel.app` | No environment variables, so it cannot sign anyone in. Not referenced by anything. Do not link to it. Not deleted; awaiting a decision. |
| `mirar-creative-review` | Codex's creative prototypes | preview only | Not the product. |

Current `mirar.life` behaviour (production landing deployment): `https://mirar.life/` and `https://www.mirar.life/` answer **307** to `https://mirar-app.vercel.app/`. This is a temporary redirect added in `mirar-landing` `next.config.ts` (`redirects()`), so the app's own discovery page stands in as the landing. **When the Aperture landing ships, delete that redirect rule**; otherwise the new landing is unreachable at `/`. `/privacy`, `/terms`, `/cookies` are served by the landing project today.

## 7. Environment variables (names only)

| Project | Variable | Scope | Purpose |
|---|---|---|---|
| `mirar-app` | `EXPO_PUBLIC_SUPABASE_URL` | Production | Supabase project URL (public by design) |
| `mirar-app` | `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Production | Supabase anon key (public by design; protected by row-level security) |
| `mirar-app` | `EXPO_PUBLIC_INNER_REP_V2` | not set in Production | Defaults to **on** (`0` falls back to the v1 Home; must stay unset) |
| `mirar-app` | `EXPO_PUBLIC_DEV_MOCK` | **must never be set in Production** | Swaps in an in-memory mock backend and demo user; Preview/dev only |
| `mirar-app` | `EXPO_PUBLIC_REVIEW_STATES` | **must never be set in Production** | Enables the staging-only review-states panel |
| `mirar-landing` | `APPS_SCRIPT_URL` | Production | Waitlist form endpoint used by `app/api/waitlist/route.ts` (not used by the current page) |

Removed: `EXPO_PUBLIC_ADMIN_SECRET` and `EXPO_PUBLIC_DEV_TOOLS` were deleted from `mirar-app` Production on 8 October 2026 (the admin page that read the secret is also removed). **Rotation of the underlying `ADMIN_SECRET` in Supabase is still outstanding** and can only be done by the account owner.

The landing needs **no** Supabase or auth variables, because it holds no session.

## 8. Analytics

The landing loads Google Analytics (GA4 id `G-Z2HQEMF42B`) and fires a named `cta_click` event with `cta_location` (`header_begin`, `header_login`, `hero`, `begin_cta`, …). If the new landing keeps analytics, keep `/cookies` accurate and note that the **app** loads no third-party analytics (stated in the current privacy page and true in code). Do not add analytics to the app.

## 9. Rules for the landing's claims (verified product reality)

- The app **is** a real working product: link to it; do not present a concept or demo as the app.
- Retention today: structured practice **on the user's device only**; sign-out clears it; not synced across devices. Do **not** claim cross-device history, durable memory or "Mirar learns who you are".
- Optional words are **never stored**.
- No scores, no streaks, no 28-day program, no weekly number, no "Beta Lite".
- Sample reflections on the landing must be labelled fictional and kept visibly separate from any real user data.
- Crisis resources in the app (Tele-MANAS 14416 / 1800-891-4416; emergency 112) were verified on 7 October 2026; the detector is **not clinically validated**: make no safety or clinical claim.

## 10. Rollback

| Surface | Current production deployment | Previous (known good) |
|---|---|---|
| App | `mirar-jp40px6o1-sahilaharia-designs-projects.vercel.app` (git `main` `8850cfc`) | `mirar-df5hgefky-…` (CLI deploy of `11f6e33`); older: `mirar-jg9sxe0v4-…` (pre-v2) |
| Landing | `mirar-landing-hgc7m5ger-sahilaharia-designs-projects.vercel.app` (redirect build) | `mirar-landing-3oamvrb1f-…` (v2 copy page); `mirar-landing-duyx9np5c-…` (older) |

Promoting a previous deployment restores it; no deployments have been deleted.

## 11. What Codex needs to build against
- Primary CTA href: `https://mirar-app.vercel.app/login`. Secondary "Log in": the same href.
- Legal footer: `/privacy`, `/terms`, `/cookies` (same origin), contact `mailto:info@mirar.life`. Flag the legal-content blocker in §5 before shipping privacy claims.
- Remove the temporary root redirect from `next.config.ts` when the landing replaces it.
- No auth code, no Supabase client, no session reads on the landing.
