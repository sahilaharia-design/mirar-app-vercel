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
