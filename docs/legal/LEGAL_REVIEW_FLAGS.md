# Legal and privacy copy: what changed and what needs qualified review

Pages: `https://mirar.life/privacy`, `/terms`, `/cookies` (repo `mirar-landing`, release commit `fc91151`). Rewritten 12 October 2026 to describe the **current Mirar beta**. This is not legal advice and none of it has been reviewed by a lawyer.

## What was changed, and why
The previous pages (August 2026) described the retired v1 product: check-ins stored on the server, streaks, theme scores, "cycle" progress, AI-generated reports and email notifications. They contradicted the v2 beta. The new pages state only what the code does, checked on 12 October 2026:

| Statement on the pages | How it was checked |
|---|---|
| Practice is kept on the user's device, not synced; sign-out clears it | `stores/inner-rep-v2-store.ts`, `clearV2Keys`; browser test of sign-out |
| Words typed into optional steps are not saved or sent | Sentinel test: not in storage, page, URL, network or console |
| The server stores email, a random Mirar ID, language, join date and a setup record; no practice content | `app/(auth)/onboarding.tsx`; `generateMirarId` is random |
| The app has no advertising or analytics trackers and sets no cookies | The production app loads one first-party script; no cookie header |
| The website sets no cookies and runs no analytics | No cookie header on the site's routes; Google Analytics removed in this release |
| Readings are produced by Mirar's own rules, not AI | Deterministic engine (`lib/innerRep/v2`) |
| Crisis resources: 112; Tele-MANAS 14416 / 1800-891-4416 | Checked against the MoHFW programme on 7 October 2026 |

## Needs owner confirmation (the pages assume these; they were not verified)
1. **Older data on the server.** The pages say answers or notes from earlier versions "may still be stored" in accounts. This is believed true but was not queried.
2. **Who sends the sign-in email.** The pages say Supabase does. If a custom SMTP or another provider is configured, the processor list must be corrected.
3. **Any other email Mirar still sends** (reports, reminders). The pages describe only sign-in links. If others still go out, the pages must say so.
4. **Deletion process.** "Email info@mirar.life" is the existing manual process; no timeline is promised. Confirm it is staffed.
5. **Google Analytics was removed** from mirar.life in this release (the new landing has none), so the previous CTA event tracking no longer exists. Re-adding analytics needs `/cookies` updated first and a consent decision.

## Needs qualified legal review (provisions kept from the owner's earlier text, not newly drafted)
- Minimum age 16.
- Governing law: India.
- "As is" and limitation-of-liability wording.
- Termination, changes-to-terms, and the "free, with advance notice before any charge" wording.
- Whether the pages meet data-protection obligations for the audience (for example India's DPDP Act, and GDPR for any EU users). Not assessed here.
- The description of the account "setup record" (a legacy cycle row): consider describing it more specifically.

## Safety wording
The crisis resources are verified. The crisis-language detector is **not clinically validated**, and the pages make no claim that it is. A qualified person should review the detector and the crisis wording before a wider beta (decision D6).
