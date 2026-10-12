# Reconciliation evidence — 10 October 2026

This is a review of `mirar-product-value` at `2d150e01fd30e0b9d20e7f642147188414def8c3`, not a merged implementation. Existing suite result: nine checks pass over 24 simulated users / 430 statements. Focused reproductions in `review-probes.json` demonstrate gaps the existing suite does not cover; expected contract behavior is compared with the observed output. These results do not modify or weaken the engine.

## Reproduce without merging

1. Export `lib` and `scripts` using `git archive 2d150e01fd30e0b9d20e7f642147188414def8c3 lib scripts` into an empty temporary directory.
2. Copy `review-probes.ts.txt` to `review-probes.ts` at the root of that directory.
3. Use the installed esbuild to bundle `scripts/runtime/mirror-contract.test.ts` and `review-probes.ts` as Node/CommonJS entry points (bundle=true, platform=node, format=cjs). Do not overwrite repository files or install packages.
4. Run each bundled entry with Node. Compare with `mirror-suite.txt` and `review-probes.json`.

The Partly fixture uses the real engine to generate a reading, applies existing feedback/correction, then calls the new read model. The variant and contextual-response fixtures use real `flowContext`/`nextStep`/`applyRep`. IDs trace to synthetic state. No real accounts, optional prose, service calls or persistence are involved. The unpractised-copy sample demonstrates that absence of training can coexist with a supplied work topic.

No browser/a11y or user-research result is claimed for this documentation-only reconciliation. Broader engine, correction and runtime suites were not rerun: this task changes none of that code.
