# Real pilot integration — validation evidence

Frontend source: `adfe9f150724c5ef8e43723ccf42194b5a250cf8` on `codex/mirar-pilot-aperture-integration`.

Runtime source: Claude’s `8f30963589ed0a83caa0fc483a73fd58a294840a`. Approved creative history: `8e9fa11`. PR: https://github.com/sahilaharia-design/mirar-app-vercel/pull/3

Public preview: https://mirar-creative-review-13nsw1cv0-sahilaharia-designs-projects.vercel.app/

Direct views: `?journey=today`, `?journey=pilot-reframe`, `?journey=pilot-attend`, `?journey=mirror`. Start at the root for the complete discovery → simulated entry → actual daily engine rep → optional real pilot → receipt → Mirror journey. No account or email is created. The public review’s two real runtimes use separate memory KV; reloading the entire public page intentionally resets that review. “Resume after simulated reload” reinitializes the real pilot store with its memory KV, without restoring words. The Expo validation separately tests actual browser reload with device-local storage.

`provenance.json` records the deployment ID, source commits and SHA-256 of the hosted JS. An anonymous HTTP request returned 200; the hosted JS was byte-identical to the local committed-source build. This is an ordinary preview deployment URL, with no share token or expiration parameter. The existing `mirar-creative-review` project was used; no production deployment, domain, auth configuration or official landing was changed.

## Results

| Matrix | Evidence records | Clean axe audits |
| --- | ---: | ---: |
| Hosted actual pilot journeys | 395 | 124 |
| Expo staging route/store journey | 38 | 32 |
| Approved public sample | 178 | 51 |
| Supported daily reps/corrections | 101 | 27 |
| Total | 712 | 234 |

All audits have zero violations and zero incomplete findings. These are validation records, not 712 independent human tests. The pilot matrix includes 30 complete Look Again journeys and 40 complete Attend journeys at 320×568, 390×844, 768×1024, 1024×768 and 1440×900, plus special-state tests. Every capture checks overflow and interactive target sizes. These matrices cover emitted response categories and special states; they do not claim every Cartesian combination of choices.

- Look Again: every situation category, all three reading choices, no reading, uncertainty, all certainty/reweigh categories, alternatives including none/all and less-charitable readings, original/retry camera checks, retry skip/unknown, back, leave before answering, early-left, same-day resume, words missing after reload, and safety discard.
- Attend: up to five pulls, all four placements plus unknown, second Attend-now disabled with exact reason, freeing that slot through Back, all set-aside time options, nothing pulling, hard to tell, untimed hold/end/leave-during, skipped hold, all arrangement reports, keep/rearrange once, and all three carry responses. Post-rearrange Back is absent where the actual session refuses it.
- Reversible selected-reading controls were exercised without any answer/record change. Full discovery-to-engine-to-pilot-to-Mirror journey verifies the two sources remain distinct.
- Expo tests use the real route hosts, Zustand wrapper and PilotStore with mock auth. Actual same-device browser reload resumes the draft without restoring or storing typed words. Engine domain state stays unchanged by pilot practice; normal focus-refresh `savedAt` metadata is excluded from that comparison and is explicitly reported.
- Native Chrome touch events at 390×844 place four authored pulls into all four destinations, reject a second Attend-now tap, and complete. This is emulated browser touch, not physical-device testing. Keyboard Tab/Enter and reduced-motion checks pass; no browser errors were recorded.
- Landing: all nine opening/view paths at all five sizes, reversible readings, neutral completion and disclosure above CTA. Daily-rep regression: every Partly reason, optional note/privacy/safety, timeframe/date guard, commitments, missing capacity labels, follow-up/context, retry and long copy.
- Claude’s 66 pilot checks pass, including 800 random sessions, draft validation, day change/corruption, retention, isolated engine storage, safety and frozen-code guards. `lib/innerRep`, stores, runtime tests, assets and tokens have an empty diff against `8f30963`.
- TypeScript, review/landing builds and final clean production-equivalent Expo export pass. Public-bundle scanner passes; production pilot-screen/content/fixture exclusion passes. The production-equivalent export uses nonfunctional review Supabase placeholders, so it proves bundling, not real-account auth behavior. Use `--clear` when switching Expo staging/production flags.

## Representative screenshots

- [Mobile direct placement](screenshots/app-one-attend-390.png)
- [Look Again comparison](screenshots/look-alternatives-1440-1.png)
- [Completion](screenshots/app-attend-receipt-390.png)
- [Unified Mirror](screenshots/app-mirror-390.png)
- [Reload without words](screenshots/app-real-reload.png)
- [Safety discard](screenshots/safety-no-record.png)
- [Full integrated journey](screenshots/full-integrated-journey.png)

Raw matrices: `results.json`, `app-results.json`, `touch-results.json`, `sample/results.json`, `regression/ui-validation.json`. All material is scripted/fixture review data, never participant answers.

## Reproduction

Run `npm run visual:build`, serve `dist-review`, set `AGENT_BROWSER_BIN`, and run `MIRAR_EXPANSION_PREVIEW=<review-origin> python3 scripts/frontend/verify-expansion.py`. It runs the pilot, sample and supported-rep matrices into this evidence directory.

For the actual Expo route/store matrix, export with the staging flags and mock auth, serve its output with SPA fallback, and run `MIRAR_PILOT_APP=<local-origin> python3 scripts/frontend/verify-pilot-app.py`. `node scripts/frontend/verify-pilot-touch.cjs` connects to that isolated browser through local CDP and uses actual touch events. The touch script refuses non-local origins.

## Release dependencies

The handoff is [APERTURE_PILOT_INTEGRATION_HANDOFF.md](../APERTURE_PILOT_INTEGRATION_HANDOFF.md). It identifies four runtime-derived copy issues for Claude; safe presentation fallbacks avoid complete-operation claims on partial/unknown records. No runtime/evidence logic was modified.

Claude’s protected hosted pilot preview was reviewed at `8f30963`; it predates this frontend. Review of Claude’s post-merge hosted integration remains pending his integration and immutable URL. Human comprehension/usefulness, clinical safety wording, real Supabase auth/callbacks/security and production release approval remain separate gates. No pending human replies are represented as test results.
