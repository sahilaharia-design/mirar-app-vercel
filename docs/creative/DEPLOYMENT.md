# Mirar creative review — public Preview

Published 8 October 2026. Source branch: `codex/mirar-creative-explorations`. Source commit: `460d326bfeb74566d8f61221d649a926eb0e6453`.

## Public directions

- [Aperture — The revisable window](https://mirar-creative-review-3umgtap6z-sahilaharia-designs-projects.vercel.app/?direction=aperture)
- [Weave — What we carry forward](https://mirar-creative-review-3umgtap6z-sahilaharia-designs-projects.vercel.app/?direction=weave)
- [Fieldnotes — The open reading](https://mirar-creative-review-3umgtap6z-sahilaharia-designs-projects.vercel.app/?direction=field)

All three are query routes on one deployment, with no bypass or share token. The comparison reference is an isolated memory-only build at `/baseline/?experience=discover`. Nothing is saved; future Mirror examples remain explicitly fictional.

## Deployment isolation

Separate project: `mirar-creative-review`, project ID `prj_uE4hxjIBAa2KkZXQsuX3bXIzAb69`, team `sahilaharia-designs-projects`. No Git connection, production app connection, secrets or backend. Static files were staged outside the repository; the source checkout was not linked to Vercel. Deployment ID: `dpl_C7ucYd2JpeBkUhN6S2HFV8QJHj9F`. Vercel inspect reports **preview**, Ready. The deployment list contains this single Preview.

Vercel initially classified the first deployment of this new project as Production despite the explicit `--target preview`. That deployment (`dpl_FDDjzz9p6VSngC81BWkj44KofXEb`) was removed after the genuine Preview was ready. The existing Mirar app projects and mirar.life were never modified or deployed. No merge or engine/persistence/schema changes occurred.

Public access is enabled only for this dedicated review project. URLs are ordinary deployment URLs with no expiring access token; access lasts while the deployment is retained. All responses carry `X-Robots-Tag: noindex, nofollow`.

## Public verification

`deployment-validation/public-access.json` records direct requests without cookies, authorization or protection bypass. All three direction URLs and the baseline return HTTP 200 without redirection or a Vercel login. All 17 uploaded static files match the staged build byte-for-byte. Browser walkthrough evidence and screenshots are in `deployment-validation/`.

See [Brand refinement](BRAND_REFINEMENT.md) for each direction’s changes, representative hero/Today/Mirror screens, canonical asset provenance and the Aperture recommendation.

The public walkthrough completed 185 records, 84 geometry/screenshots and 66 axe scans at 320×568, 390×844, 768×1024, 1024×768 and 1440×900. Zero horizontal overflow or reported axe violations. 64 scans contain incomplete contrast checks caused by overlapping layers; these are not accessibility certification. Keyboard paths, reduced motion, all correction reasons, optional note/privacy wording, commitment context, optional capacity labels, future date and Back to Today passed. Six additional phone/desktop checks verify the reading-layout controls preserve response and reflection text. Native assistive-technology and physical-device date ergonomics remain unverified.
