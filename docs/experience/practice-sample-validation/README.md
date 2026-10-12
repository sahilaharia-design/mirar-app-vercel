# Public practice sample — validation evidence

12 October 2026. Tested locally at http://127.0.0.1:5180 with the published Claude routing destination configured. No deployment performed.

## Results

- All 9 starting-response × perspective paths at all 5 requested viewports: **45 path checks**.
- Viewports: 320×568, 390×844, 768×1024, 1024×768, 1440×900.
- **51 axe scans: zero violations and zero incomplete checks**. Automated scans do not replace assistive-technology testing.
- **66 screenshots**, including each path, initial states and keyboard/reduced-motion state.
- **13 exit positions**, each returning to a cleared exercise; restart checked for all three starting responses.
- Keyboard activated unknown and unknown-reason choices; reduced-motion media preference verified. Focus transitions and live announcements are implemented. No dedicated screen-reader session performed.
- All captured states: no horizontal overflow, visible controls ≥44px high, localStorage empty and no cross-origin resource requests while practising.
- Observation remains fixed; the selected authored reading and branch-specific closure are checked in the actual window. All reading choices stay reversible.
- CTA arrived at **https://mirar-app.vercel.app/login** with no answer/query payload. No credentials entered; authentication delivery is Claude’s app-owned scope.
- Browser runtime errors: none.
- TypeScript and static review build pass. Build emits existing React Native module-directive notices and unresolved-at-build-time public-font URL notices; font assets are bundled and preview typography inspected.

`results.json` contains 178 detailed records. `live-audit.json` records all three prior deployed completion branches; `screenshots/live-old-*.png` are the audit captures. `screenshots/path-*-*-*.png` are the revised paths.

## Reproduce

Use the existing landing dev script with `VITE_MIRAR_APP_ENTRY_URL=https://mirar-app.vercel.app/login` on port 5180. Run `scripts/frontend/verify-practice-sample.py` with Python 3 and an installed agent-browser executable supplied as `AGENT_BROWSER_BIN`; override `MIRAR_SAMPLE_PREVIEW` if needed. The harness reads a local preview, visits the configured CTA without signing in, and saves evidence. It must not run against production to create personal responses.

## Release dependencies

Claude must review the general fictional mechanic and authored content against evidence boundaries, integrate the frontend change and own staging/release. No engine, persistence, schema, catalog, selection or feedback changes were made.

The decisive human test remains **unrun**: ask first-time visitors “What did you practise?” without suggesting an answer. Technical branch coverage proves operation, not comprehension or emotional-fitness efficacy. A response of “I answered questions” requires further redesign.
