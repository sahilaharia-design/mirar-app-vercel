// ─── Edge Function: generate-report ──────────────────────────────────────────
// Triggered after scores are computed (or lazily from the client when a stage
// window has passed without a report).
// Assembles report using signal language in the user's language (en/hi/gu).
// Language rule: observations only — no interpretation, no advice.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Lang = 'en' | 'hi' | 'gu';

const THEME_NAMES: Record<Lang, Record<string, string>> = {
  en: { IAP: 'Direction', EWB: 'Energy', FAF: 'Attention', RC: 'Connection', GAL: 'Growth', RA: 'Movement' },
  hi: { IAP: 'दिशा', EWB: 'ऊर्जा', FAF: 'ध्यान', RC: 'जुड़ाव', GAL: 'विकास', RA: 'गति' },
  gu: { IAP: 'દિશા', EWB: 'ઊર્જા', FAF: 'ધ્યાન', RC: 'જોડાણ', GAL: 'વિકાસ', RA: 'ગતિ' },
};

const THEME_ORDER = ['IAP', 'EWB', 'FAF', 'RC', 'GAL', 'RA'];

const STAGE_LABELS: Record<Lang, Record<number, string>> = {
  en: { 1: 'First reflections', 2: 'Pattern forming', 3: 'Movement noticed', 4: 'Reflection summary', 0: 'Full pattern' },
  hi: { 1: 'पहले संकेत', 2: 'पैटर्न बन रहा है', 3: 'बदलाव दिखा', 4: 'संकेत सारांश', 0: 'पूरा पैटर्न' },
  gu: { 1: 'પહેલા સંકેત', 2: 'પેટર્ન બની રહી છે', 3: 'બદલાવ દેખાયો', 4: 'સંકેત સારાંશ', 0: 'સંપૂર્ણ પેટર્ન' },
};

const STAGE_DESCS: Record<Lang, Record<number, string>> = {
  en: { 1: 'What became noticeable', 2: 'Where adjustment signals appeared', 3: 'Where movement occurred', 4: 'What remained visible by the end of the cycle', 0: 'Full pattern summary' },
  hi: { 1: 'जो दिखाई देने लगा', 2: 'जहाँ बदलाव के संकेत दिखे', 3: 'जहाँ गति दिखी', 4: 'चक्र के अंत तक जो दिखता रहा', 0: 'पूरे पैटर्न का सारांश' },
  gu: { 1: 'જે દેખાવા લાગ્યું', 2: 'જ્યાં ફેરફારના સંકેત દેખાયા', 3: 'જ્યાં ગતિ દેખાઈ', 4: 'ચક્રના અંત સુધી જે દેખાતું રહ્યું', 0: 'સંપૂર્ણ પેટર્નનો સારાંશ' },
};

const SECTION_HEADERS: Record<Lang, { title: string; window: string; included: (c: number, t: number) => string; showedUp: string; strongest: string; checks: string; reading: string }> = {
  en: {
    title: 'MIRAR REFLECTION SUMMARY',
    window: 'Window',
    included: (c, t) => `${c} of ${t} reflections included.`,
    showedUp: 'WHAT SHOWED UP',
    strongest: 'STRONGEST SIGNALS',
    checks: 'GENTLE CHECKS',
    reading: 'Reading',
  },
  hi: {
    title: 'मिरार संकेत सारांश',
    window: 'अवधि',
    included: (c, t) => `${t} में से ${c} चेक-इन शामिल।`,
    showedUp: 'जो सामने आया',
    strongest: 'सबसे स्पष्ट संकेत',
    checks: 'हल्की जाँच',
    reading: 'रीडिंग',
  },
  gu: {
    title: 'મિરાર સંકેત સારાંશ',
    window: 'સમયગાળો',
    included: (c, t) => `${t} માંથી ${c} ચેક-ઇન સામેલ.`,
    showedUp: 'જે સામે આવ્યું',
    strongest: 'સૌથી સ્પષ્ટ સંકેત',
    checks: 'હળવી તપાસ',
    reading: 'રીડિંગ',
  },
};

const STATUS_LABELS: Record<Lang, Record<string, string>> = {
  en: { 'Aligned': 'Aligned', 'Forming': 'Forming', 'Stabilizing': 'Stabilizing', 'Under Load': 'Under Load', 'No Reading': 'No Reading' },
  hi: { 'Aligned': 'संरेखित', 'Forming': 'बन रहा है', 'Stabilizing': 'स्थिर हो रहा है', 'Under Load': 'दबाव में', 'No Reading': 'रीडिंग नहीं' },
  gu: { 'Aligned': 'સંરેખિત', 'Forming': 'બની રહ્યું છે', 'Stabilizing': 'સ્થિર થઈ રહ્યું છે', 'Under Load': 'દબાણમાં', 'No Reading': 'રીડિંગ નથી' },
};

// ─── Observational summary lines — NEVER interpretive ────────────────────────
function getSummaryLine(lang: Lang, code: string, status: string): string {
  const name = THEME_NAMES[lang][code] ?? code;
  const maps: Record<Lang, Record<string, string>> = {
    en: {
      Aligned: `${name} appeared steadily across this reflection window.`,
      Forming: `${name} appeared with moderate regularity.`,
      Stabilizing: `${name} appeared intermittently.`,
      'Under Load': `${name} showed pressure across this reflection window.`,
      'No Reading': `${name}: not enough reflections yet.`,
    },
    hi: {
      Aligned: `${name} इस अवधि में लगातार स्थिर दिखी।`,
      Forming: `${name} समय-समय पर नियमित दिखी।`,
      Stabilizing: `${name} रुक-रुक कर दिखी।`,
      'Under Load': `${name} में इस अवधि में दबाव दिखा।`,
      'No Reading': `${name}: अभी पर्याप्त चेक-इन नहीं।`,
    },
    gu: {
      Aligned: `${name} આ સમયગાળામાં સતત સ્થિર દેખાઈ.`,
      Forming: `${name} સમયાંતરે નિયમિત દેખાઈ.`,
      Stabilizing: `${name} અટકી-અટકીને દેખાઈ.`,
      'Under Load': `${name} માં આ સમયગાળામાં દબાણ દેખાયું.`,
      'No Reading': `${name}: હજી પૂરતા ચેક-ઇન નથી.`,
    },
  };
  return maps[lang][status] ?? maps.en[status] ?? `${name}`;
}

const PRESENCE: Record<Lang, Record<string, string>> = {
  en: { Aligned: 'steady signal presence', Forming: 'moderate signal presence', Stabilizing: 'settling signal pattern', other: 'pressure present' },
  hi: { Aligned: 'स्थिर संकेत', Forming: 'मध्यम संकेत', Stabilizing: 'स्थिर होता पैटर्न', other: 'दबाव मौजूद' },
  gu: { Aligned: 'સ્થિર સંકેત', Forming: 'મધ્યમ સંકેત', Stabilizing: 'સ્થિર થતી પેટર્ન', other: 'દબાણ હાજર' },
};

function buildPrimarySignals(lang: Lang, scores: any[]): string[] {
  // Coverage ("N of N reflections included") is NOT a signal — it's already
  // shown separately in the report header from report.coverage/coverage_total.
  // Mixing it into this list made it show up as the "strongest signal" and as
  // a stray first bullet under "Strongest Signals" on the client.
  const lines: string[] = [];
  const sorted = [...scores].filter((s) => s.signal_count > 0).sort((a, b) => (b.average_score ?? 0) - (a.average_score ?? 0));
  for (const s of sorted.slice(0, 3)) {
    const pres = PRESENCE[lang][s.status] ?? PRESENCE[lang].other;
    lines.push(`${THEME_NAMES[lang][s.theme_code]} — ${pres}.`);
  }
  return lines;
}

const CHECK_LINES: Record<Lang, { pressure: (n: string) => string; steady: (n: string) => string; mixed: (n: string) => string; consistent: string }> = {
  en: {
    pressure: (n) => `${n} — pressure appeared repeatedly.`,
    steady: (n) => `${n} — steadiness appeared repeatedly.`,
    mixed: (n) => `${n} — mixed signals appeared.`,
    consistent: 'The reflections were consistent across areas.',
  },
  hi: {
    pressure: (n) => `${n} — दबाव बार-बार दिखा।`,
    steady: (n) => `${n} — स्थिरता बार-बार दिखी।`,
    mixed: (n) => `${n} — मिले-जुले संकेत दिखे।`,
    consistent: 'सभी क्षेत्रों में चेक-इन एक जैसे रहे।',
  },
  gu: {
    pressure: (n) => `${n} — દબાણ વારંવાર દેખાયું.`,
    steady: (n) => `${n} — સ્થિરતા વારંવાર દેખાઈ.`,
    mixed: (n) => `${n} — મિશ્ર સંકેત દેખાયા.`,
    consistent: 'બધા ક્ષેત્રોમાં ચેક-ઇન સમાન રહ્યા.',
  },
};

function buildCalibrationChecks(lang: Lang, scores: any[]): string[] {
  const checks: string[] = [];
  const L = CHECK_LINES[lang];
  for (const s of scores) {
    if (s.signal_count === 0) continue;
    const total = (s.low_count ?? 0) + (s.medium_count ?? 0) + (s.high_count ?? 0);
    if (total === 0) continue;
    const name = THEME_NAMES[lang][s.theme_code];
    if ((s.low_count ?? 0) / total > 0.6) checks.push(L.pressure(name));
    else if ((s.high_count ?? 0) / total > 0.6) checks.push(L.steady(name));
    else if ((s.low_count ?? 0) > 0 && (s.high_count ?? 0) > 0) checks.push(L.mixed(name));
  }
  if (checks.length === 0) checks.push(L.consistent);
  return checks;
}

function buildFullReportText(lang: Lang, stage: number, coverage: number, total: number, scores: any[], mirarid: string): string {
  const H = SECTION_HEADERS[lang];
  const lines: string[] = [];
  lines.push(`${H.title} — ${(STAGE_LABELS[lang][stage] ?? '').toUpperCase()}`);
  lines.push(`Mirar ID: ${mirarid}`);
  lines.push('');
  lines.push(`${H.window}: ${STAGE_LABELS[lang][stage]}`);
  lines.push(`"${STAGE_DESCS[lang][stage]}"`);
  lines.push('');
  lines.push(H.included(coverage, total));
  lines.push('');
  lines.push('─'.repeat(30));
  lines.push(H.showedUp);
  lines.push('─'.repeat(30));
  for (const code of THEME_ORDER) {
    const s = scores.find((sc) => sc.theme_code === code);
    if (!s) continue;
    lines.push('');
    lines.push(`${THEME_NAMES[lang][code]}`);
    lines.push(`${H.reading}: ${STATUS_LABELS[lang][s.status] ?? s.status}`);
    lines.push(getSummaryLine(lang, code, s.status));
  }
  lines.push('');
  lines.push('─'.repeat(30));
  lines.push(H.strongest);
  lines.push('─'.repeat(30));
  for (const sig of buildPrimarySignals(lang, scores)) lines.push(`• ${sig}`);
  lines.push('');
  lines.push('─'.repeat(30));
  lines.push(H.checks);
  lines.push('─'.repeat(30));
  for (const cal of buildCalibrationChecks(lang, scores)) lines.push(`• ${cal}`);
  return lines.join('\n');
}

const SUMMARY_TEXT: Record<Lang, (label: string, c: number, t: number, aligned: number) => string> = {
  en: (label, c, t, aligned) => `${label} reflection summary. ${c}/${t} reflections included. ${aligned} areas showed steadiness.`,
  hi: (label, c, t, aligned) => `${label} — संकेत सारांश। ${t} में से ${c} चेक-इन शामिल। ${aligned} क्षेत्रों में स्थिरता दिखी।`,
  gu: (label, c, t, aligned) => `${label} — સંકેત સારાંશ. ${t} માંથી ${c} ચેક-ઇન સામેલ. ${aligned} ક્ષેત્રોમાં સ્થિરતા દેખાઈ.`,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { cycle_id, stage, user_id } = await req.json();
    if (!cycle_id || stage === undefined || !user_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch theme scores
    const { data: scores, error: scoresErr } = await supabase
      .from('theme_scores')
      .select('*')
      .eq('user_id', user_id)
      .eq('cycle_id', cycle_id)
      .eq('stage', stage);

    if (scoresErr) throw scoresErr;

    // Count responses for coverage
    const dayRange = stage === 0 ? [1, 28] : [
      [1,7],[8,14],[15,21],[22,28]
    ][stage - 1] ?? [1,7];
    const { count } = await supabase
      .from('responses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user_id)
      .eq('cycle_id', cycle_id)
      .gte('day_number', dayRange[0])
      .lte('day_number', dayRange[1]);

    const coverage = count ?? 0;
    const total = stage === 0 ? 28 : 7;

    // Fetch user for mirar_id + language
    const { data: userRow } = await supabase
      .from('users')
      .select('mirar_id, language')
      .eq('id', user_id)
      .single();

    const lang: Lang = (['en', 'hi', 'gu'].includes(userRow?.language) ? userRow.language : 'en') as Lang;
    const mirarid = userRow?.mirar_id ?? user_id;
    const primarySignals = buildPrimarySignals(lang, scores ?? []).join('\n');
    const calibrationChecks = buildCalibrationChecks(lang, scores ?? []).join('\n');
    const alignedCount = (scores ?? []).filter((s) => s.status === 'Aligned').length;
    const summaryText = SUMMARY_TEXT[lang](STAGE_LABELS[lang][stage], coverage, total, alignedCount);
    const fullReportText = buildFullReportText(lang, stage, coverage, total, scores ?? [], mirarid);

    // Upsert report
    const { data: report, error: reportErr } = await supabase
      .from('reports')
      .upsert({
        user_id,
        cycle_id,
        stage,
        coverage,
        coverage_total: total,
        primary_signals: primarySignals,
        calibration_checks: calibrationChecks,
        summary_text: summaryText,
        full_report_text: fullReportText,
        status: 'generated',
        generated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,cycle_id,stage' })
      .select()
      .single();

    if (reportErr) throw reportErr;

    return new Response(JSON.stringify({ ok: true, report_id: report.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('generate-report error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
