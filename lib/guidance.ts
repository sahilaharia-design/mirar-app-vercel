// Guide FAQ cards, guidance tooltips, and signal-status labels now live as
// translated content in locales/{en,hi,gu}.ts under guide_cards/guidance_tooltips/
// signal_labels. The functions below return stable keys — call sites translate
// via t(`guidance_tooltips.${signalHelpKeyForStatus(status)}`) etc.

export function signalHelpKeyForStatus(status: string | null | undefined): string {
  const normalized = (status ?? '').toLowerCase();
  if (normalized.includes('load')) return 'under_load';
  if (normalized.includes('steady')) return 'steady';
  if (normalized.includes('aligned')) return 'aligned';
  if (normalized.includes('forming')) return 'still_forming';
  if (normalized.includes('drift')) return 'drifting';
  if (normalized.includes('settling') || normalized.includes('stabil')) return 'settling';
  return 'signal';
}

export function mirrorSignalLabelKey(status: string | null | undefined): string {
  const normalized = (status ?? '').toLowerCase();
  if (normalized.includes('load')) return 'under_load';
  if (normalized.includes('aligned')) return 'aligned';
  if (normalized.includes('steady')) return 'steady';
  if (normalized.includes('stabil')) return 'settling';
  if (normalized.includes('forming')) return 'still_forming';
  if (normalized.includes('drift')) return 'drifting';
  return 'still_forming';
}

// Maps an identity-vector pattern flag (alignment_identity_vectors.pattern_flags)
// to the i18n key for the compass's "why" sentence. `null`/unknown → generic key.
export function compassWhyKey(flag: string | null | undefined): string {
  switch (flag) {
    case 'recurring_tension': return 'checkin.why_recurring_tension';
    case 'shift_down': return 'checkin.why_shift_down';
    case 'growth': return 'checkin.why_growth';
    case 'shift_up': return 'checkin.why_shift_up';
    case 'steady': return 'checkin.why_steady';
    default: return 'checkin.why_fallback';
  }
}
