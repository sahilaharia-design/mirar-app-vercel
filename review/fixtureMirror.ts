// REVIEW HARNESS ONLY. A synthetic, explicitly fictional Mirror model for the standalone visual review app.
// Never imported by the product (app/, components/ outside this harness). Real Mirrors come from runtime.mirror().
import type { MirrorModel } from '../lib/innerRep/runtime/mirror-contract';
export const reviewMirror = (practiceDays: number): MirrorModel => ({
  version: 1, engineVersion: 'review-fixture', state: practiceDays ? 'sparse' : 'empty',
  retained: { instances: practiceDays, from: null, mayBeTruncated: false },
  statements: [], sections: { said: [], practised: [], come_up: [], carrying: [], readings: [], shifted: [], unknown: [] },
});
