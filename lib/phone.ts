// Turn a typed number into +E.164. 10 digits (optionally with a leading 0)
// is treated as an Indian mobile; anything with a leading + is kept as typed.
export function normalizePhone(raw: string): string | null {
  const cleaned = raw.replace(/[\s\-()]/g, '');
  const candidate = cleaned.startsWith('+')
    ? cleaned
    : /^0?\d{10}$/.test(cleaned)
    ? '+91' + cleaned.slice(-10)
    : null;
  return candidate && /^\+[1-9][0-9]{9,14}$/.test(candidate) ? candidate : null;
}
