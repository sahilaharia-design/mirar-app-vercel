# Experience transformation validation

Date: 7 October 2026. Branch `codex/mirar-v2-visual`, implementation base `11f6e33`. No deployment or backend migration.

## Coverage and evidence
The journey was mapped in `CLAUDE_HANDOFF.md` before UI implementation. The integrated repository's active and retired route families, authentication/account setup, v2 host/runtime/store, contracts, artwork, typography and tokens were audited. Public website copy was checked as a legacy reference, not used as the visual standard.

The local review at `http://127.0.0.1:5174/?experience=discover` shares the production presentation components and uses the real v2 runtime with memory-only storage. Sign-in is **explicitly simulated** there. It verifies discovery → live sample → entry → introduction → rep → context/follow-up when emitted → integration → Mirror → Me/privacy. The integrated Expo mock at port 8082 additionally verifies actual routing, navigation, runtime/store callbacks, inert inactive tabs, sign-out clearing and signed-out public discovery/entry. No real email was sent.

Screenshots and machine-readable results are in `validation/screenshots`, `validation/ui-validation.json` and `validation/integrated-validation.json`. Five requested sizes are tested: 320×568, 390×844, 768×1024, 1024×768, 1440×900. Discovery, entry, introduction, Today, Mirror, Me, privacy, live sample and sample integration all receive geometry checks. Targets are at least 44px and there is no horizontal overflow. Local Instrument Serif and DM Sans are verified loaded.

The connected first-session review uses keyboard Enter on the actual offered response surfaces, follows the exact step machine to completion, checks the integration moment and the resulting actual one-day practice count in Mirror. Discovery uses a real `foc_settle` template, is explicitly labeled a sample and has no persistent callback. The first-value receipt displays the exact question/choice; it does not interpret the response as an insight. Unknown receives a neutral uncertainty integration state. Current Mirror does not copy a potentially rejected completion insight into an archive.

Final evidence records **54 accessibility scans (42 shared-review + 12 integrated-route scans), zero violations and zero incomplete checks**. All **68 geometry checks** show no horizontal overflow. Both connected walkthroughs report no browser runtime errors; the integrated sign-out check confirms local practice was cleared. Automated accessibility results are recorded per state in the JSON, including integrated shell routes. Header and navigation landmarks, headings, control names, selected states, focus-visible rules and inert inactive screens are covered. Automated scans are not accessibility certification. Native VoiceOver/TalkBack and hardware device ergonomics remain unverified.

## Builds and protected behavior
- TypeScript passes.
- Shipping Expo export and isolated review export pass. The exports are compile verification, not deployment.
- Engine suite: **85/85**; runtime adapter: **18/18**; correction: **17/17**. Test sources are unchanged.
- Zero diff against `11f6e33` across `lib`, `stores`, `supabase`, `locales`, engine/runtime test sources, authoritative contracts/decisions/feedback docs, `package.json` and lockfile. Canonical image/font/token files are unchanged. No analytics or raw-text persistence was added.
- React review: hooks are unconditional, navigation callbacks use the existing boundaries, async rep completion retains the same duplicate-submission guard, receipts contain structured choices only, and current reflection feedback/correction/safety methods remain the original implementation.
- Root auth guard deliberately permits only public root/privacy and the existing auth callback; private tabs and the introduction remain authenticated. Email submission calls the original `signInWithEmail`; account creation operations remain intact. Me sign-out calls the original wipe logic.
- Removed obsolete user-facing six-slide questionnaire and theme-toggle presentation; existing account/schema/theme storage is not migrated. Native public/entry/Mirror/Me pages now apply safe-area padding; Today retains its existing safe-area host.

## Local environment findings
The existing Supabase module creates its real client even when the mock is selected, so it requires syntactically valid URL/key configuration. The integrated test uses **non-secret invalid-service placeholders with the mock enabled**, without editing that module. Real authentication delivery was not verified and requires configured service credentials. No mock export is suitable for deployment.

The standalone Vite harness now resolves `.web` variants during dependency prebundling as well as normal source resolution; otherwise safe-area-context attempts to import a native code-generation module. This affects local review tooling only. Existing ignored `use client` / review bundle-size warnings and Expo dependency-compatibility advisories remain documented, with no broad upgrades.

## Remaining product handoff
1. Route mirar.life to the new integrated public root and verify auth callback allowlists during a controlled deployment.
2. Supply the approved longitudinal Mirror read model, including exact response provenance and reflection eligibility/correction state; capacity history, commitment history and shifts are honestly deferred now.
3. Retire legacy account/cycle setup only through a reviewed backend migration; frontend account operations are preserved.
4. Resolve device-local beta retention/cloud continuity, intentional Hindi/Gujarati typography and translations, and expert safety review through their existing workstreams.
5. Validate real email delivery, native accessibility and physical device safe-area/date-keyboard behavior before a public-beta readiness claim.
