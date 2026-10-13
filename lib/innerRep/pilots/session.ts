import { ATTEND, attendFacts } from './attend';
import { LOOK_AGAIN, lookAgainFacts } from './look-again';
import { PAnswer, PILOT_SCHEMA, PilotAnswerError, PilotContext, PilotId, PilotRecord, PStep, RepValue } from './types';
import { attendValue } from './attend';
import { lookAgainValue } from './look-again';

/**
 * Pilot session: the only way a presentation layer talks to a pilot.
 *   step()    the current step, or null when the exercise is complete (or halted for safety)
 *   answer()  validates the answer against the step that was emitted, then rebuilds it from a whitelist
 *   back()    removes the last answer (autonomy: any answer can be changed); never across a completed hold
 *   leave()   the person exits. Always allowed, from any step. Produces a 'left' record that is never counted as a completion
 *   record()  the structured record (no text exists to store), only when something was answered
 * A 'safety' answer halts the session: no further step, and NO record is produced, so nothing about the moment is kept.
 */
export interface PilotSnapshot { pilot: PilotId; today: string; answers: PAnswer[]; halted: boolean }

const DEFS = { look_again: LOOK_AGAIN, attend: ATTEND } as const;
export const PILOT_TITLES: Record<PilotId, string> = { look_again: LOOK_AGAIN.title, attend: ATTEND.title };

export class PilotSession {
  private answers: PAnswer[] = [];
  private halted = false;
  private left = false;
  constructor(readonly pilot: PilotId, private ctx: PilotContext) {}

  static restore(snap: PilotSnapshot, ctx: PilotContext): PilotSession | null {
    if (snap.today !== ctx.today) return null;                       // a draft never outlives its day and is never counted
    const s = new PilotSession(snap.pilot, ctx);
    for (const a of snap.answers) { try { s.answer(a); } catch { return null; } }  // replay through validation; corrupt drafts are dropped
    s.halted = snap.halted; return s;
  }
  /** read-only: the context this session was started with */
  get context(): PilotContext { return this.ctx; }
  /** an independent copy (same validated answers) for trial runs; mutating it never touches this session */
  clone(): PilotSession { const c = PilotSession.restore(this.snapshot(), this.ctx); if (!c) throw new PilotAnswerError('cannot clone'); return c; }
  snapshot(): PilotSnapshot { return { pilot: this.pilot, today: this.ctx.today, answers: this.answers.map((a) => ({ ...a }) as PAnswer), halted: this.halted }; }

  step(): PStep | null { if (this.halted || this.left) return null; return DEFS[this.pilot].next(this.ctx, this.answers); }
  get isHalted() { return this.halted; }
  get isComplete() { return !this.halted && !this.left && this.step() === null && this.answers.length > 0; }
  get answerCount() { return this.answers.length; }

  answer(a: PAnswer): void {
    if (this.halted || this.left) throw new PilotAnswerError('session is closed');
    const st = this.step(); if (!st) throw new PilotAnswerError('no step is open');
    if (a.stepId !== st.id) throw new PilotAnswerError(`answer is for ${a.stepId}, the open step is ${st.id}`);
    if (a.kind === 'safety') { if (st.type !== 'words') throw new PilotAnswerError('safety is only raised by a words step'); this.halted = true; this.answers = []; return; }
    let clean: PAnswer;
    switch (st.type) {
      case 'choice': {
        if (a.kind === 'unknown') { if (!st.allowUnknown) throw new PilotAnswerError('this step has no "I don’t know"'); clean = { stepId: st.id, kind: 'unknown' }; break; }
        if (a.kind !== 'option') throw new PilotAnswerError('a choice step takes an option or unknown');
        const o = st.options.find((x) => x.id === a.optionId); if (!o) throw new PilotAnswerError('option is not offered'); if (o.disabled) throw new PilotAnswerError('option is not selectable: ' + o.disabled);
        clean = { stepId: st.id, kind: 'option', optionId: o.id }; break;
      }
      case 'multi': {
        if (a.kind === 'unknown') { if (!st.allowUnknown) throw new PilotAnswerError('this step has no "I don’t know"'); clean = { stepId: st.id, kind: 'unknown' }; break; }
        if (a.kind !== 'options') throw new PilotAnswerError('a multi step takes options or unknown');
        const ids = [...new Set(a.optionIds)]; if (ids.length > st.max) throw new PilotAnswerError(`at most ${st.max}`);
        for (const id of ids) { const o = st.options.find((x) => x.id === id); if (!o || o.disabled) throw new PilotAnswerError('option is not selectable'); }
        clean = { stepId: st.id, kind: 'options', optionIds: ids }; break;
      }
      case 'words': {
        if (a.kind === 'skip') { clean = { stepId: st.id, kind: 'skip' }; break; }
        if (a.kind !== 'words' || !Number.isInteger(a.chars) || a.chars < 1 || a.chars > st.maxChars) throw new PilotAnswerError('words answer is a character count between 1 and the limit');
        clean = { stepId: st.id, kind: 'words', chars: a.chars }; break;      // the count is kept for validation only; it is not persisted in a record
      }
      case 'hold': {
        if (a.kind !== 'hold_end') throw new PilotAnswerError('a hold ends only with hold_end');
        clean = { stepId: st.id, kind: 'hold_end' }; break;
      }
    }
    this.answers.push(clean);
  }

  back(): boolean {
    if (this.halted || this.left || !this.answers.length) return false;
    const cur = this.step(); if (cur && 'allowBack' in cur && !cur.allowBack) return false;
    const prev = this.answers[this.answers.length - 1]; if (prev.stepId === 'hold' || prev.stepId === 'hold_offer' || prev.stepId === 'rearrange') return false;
    this.answers.pop(); return true;
  }

  leave(): void { this.left = true; }

  /** Structured record or null (nothing answered, or halted for safety). Ids are assigned by the store. */
  record(id: number): PilotRecord | null {
    if (this.halted || !this.answers.length) return null;
    const complete = !this.left && this.step() === null;
    const open = this.left ? DEFS[this.pilot].next(this.ctx, this.answers) : null;
    const base = { id, schema: PILOT_SCHEMA, date: this.ctx.today, status: complete ? ('completed' as const) : ('left' as const), stepsSeen: this.answers.length, ...(!complete && open ? { leftAt: open.id.split(':')[0] } : {}) };
    return this.pilot === 'look_again'
      ? { ...base, pilot: 'look_again', facts: lookAgainFacts(this.answers) }
      : { ...base, pilot: 'attend', facts: attendFacts(this.ctx, this.answers) };
  }
}

export function valueOf(rec: PilotRecord): RepValue { return rec.pilot === 'look_again' ? lookAgainValue(rec) : attendValue(rec); }
