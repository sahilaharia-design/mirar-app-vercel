import { useSettingsStore } from '../stores/settings-store';
import type { QuestionRow, OptionRow } from '../types/mirar';

export function useLocalizedQuestion(q: QuestionRow | null) {
  const lang = useSettingsStore((s) => s.language);
  if (!q) return null;
  return {
    ...q,
    prompt_text: (lang !== 'en' && q[`prompt_text_${lang}` as keyof QuestionRow]) || q.prompt_text,
    mirror_glimmer: (lang !== 'en' && q[`mirror_glimmer_${lang}` as keyof QuestionRow]) || q.mirror_glimmer,
    tomorrow_tease: (lang !== 'en' && q[`tomorrow_tease_${lang}` as keyof QuestionRow]) || q.tomorrow_tease,
  };
}

export function useLocalizedOption(o: OptionRow) {
  const lang = useSettingsStore((s) => s.language);
  return {
    ...o,
    option_text: (lang !== 'en' && o[`option_text_${lang}` as keyof OptionRow]) || o.option_text,
  };
}
