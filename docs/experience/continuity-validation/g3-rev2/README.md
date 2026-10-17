# G3 revision-2 frontend evidence

Recorded 15 October 2026; packaged 17 October. Frontend source `d86015da2dd5cb901b654330bfa4cce2a50cea59`; runtime dependency `e494540`, existing PR #5. Earlier `../g3/` evidence is historical, not included in these totals.

## Browser validation

**281 axe audits: zero violations and zero incomplete.** Widths/heights: 320×568, 390×844, 768×1024, 1024×768, 1440×900.

- `matrix.json`: 175 audits, all thirteen controller phases, retained upload, unavailable/error, notices, separate destructive confirmations, recover, conflict, unsent sign-out, Today/Mirror/Me. No horizontal page overflow or enabled button targets smaller than 44×44.
- `revision2.json`: 60 audits, twelve per viewport. Retained-history count/date confirmation, keep-device makes zero service calls, explicit consent/upload with actual acknowledgment, deleted-copy upload/stay-local, save-first sign-out, saved-file notice without clearing, cancelled-save reason, removed account replacement and absent import.
- `functional.json`: 16 audits. Explicit checks, delayed acknowledgment, safe error/retry, withdrawal/unsent notices, actual replay recovery, save cancellation blocking adoption/deletion, account-history adoption only after confirmed scripted save, all destructive controls blocked without saver, explicit combined completion and account-only/device-kept notice, stay-local, keyboard Tab/Enter with visible focus and reduced motion. Harness localStorage/sessionStorage/remote-resource counts all zero.
- `app-results.json`: 30 audits through actual compiled Expo Today → Me → direct sign-out consequence → Cancel → history → explicit check → Mirror at all widths. An additional final assertion confirms no prior continuity UI after sign-out (not counted as an axe audit).

Controller, engine, recorder and replay are real code on synthetic history. Service and saver are explicitly simulated: no real account persistence or filesystem file is created. Successful scripted save is not OS file-picker verification. Screenshots with review controls show the standalone harness; `app-mirror-*` show compiled app hosts. Screenshots do not replace state/operation assertions.

## Builds and owner boundary

Vite static review build, clean Expo staging export and clean default-off Expo export passed. Default-off JavaScript contains none of the continuity settings/review markers checked. Existing dependency warnings remain; packages are unchanged. Owner runtime suite: 61 pass lines, all thirteen phases; account-isolation suite: 13 checks. Logs included.

**Typecheck remains blocked by two owner-side errors**, recorded in `types.log`: the legacy refused `keep_device` literal is absent from owner `ExtendedIntent` after removal from the frontend action union. Controller line 105 and its refusal test line 129 need that literal in the owner alias only. No frontend errors were reported; a complete green typecheck is not claimed.

Runtime files remain identical to `e494540`. The subsequent fetched remote `a9627e0` adds separate trial/readiness work and does not fix this alias. No runtime or SQL changes, Supabase activity, production deployment or new hosted preview.

## Remaining limitations

See `../../CONTINUITY_FRONTEND_HANDOFF.md` for exact owner requirements: deleted-copy clear resolution; truthful account-copy facts after stay-local; verified export before every destructive action including account-only coverage; consent version enforcement; real-service, actual-file, security and qualified retention gates. This is frontend validation, not behavioral/security release approval.

Physical touch devices, native screen readers, human comprehension, real accounts and live recovery were not tested. Reduced-motion/keyboard checks are browser-based. Reproduce using the scripts and variables documented in the handoff; use static builds to avoid hot-reload resets.
