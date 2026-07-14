// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── Curated micro-actions ──────────────────────────────────────────────────
// The mirror observes; it does not coach. But pure observation with nothing to
// do about it reads as dry. This is the bridge: a small, curated bank of
// concrete, non-prescriptive options per theme — offered ("worth trying"),
// never commanded ("you should") — shown only when a theme is genuinely under
// pressure, never when everything is Forming/Aligned (avoids feeling naggy).
// Hand-written, not AI-generated, so the voice stays exactly on-brand and
// never drifts into therapy/coaching language.
const MICRO_ACTIONS: Record<string, Record<string, string[]>> = {
  en: {
    IAP: [
      "One thing worth trying: naming one decision you've been deferring, even without acting on it yet.",
      'One thing worth trying: writing down what you actually want, separate from what is expected of you.',
      'One thing worth trying: noticing which parts of today felt chosen versus automatic.',
    ],
    EWB: [
      'One thing worth trying: protecting one block of rest today, without justifying it.',
      'One thing worth trying: noticing what specifically drains you, before assuming it is everything.',
      'One thing worth trying: stepping back from one commitment that costs more than it gives.',
    ],
    FAF: [
      'One thing worth trying: picking one thing to give full attention to today, and letting the rest wait.',
      'One thing worth trying: noticing what your attention keeps returning to on its own.',
      'One thing worth trying: removing one recurring distraction for a single day, just to notice the difference.',
    ],
    RC: [
      'One thing worth trying: reaching out to one person you have been meaning to, without an agenda.',
      'One thing worth trying: naming what is unspoken in one relationship that feels strained.',
      'One thing worth trying: noticing which connections leave you steadier, and which leave you depleted.',
    ],
    GAL: [
      'One thing worth trying: spending ten minutes on something you stopped learning.',
      'One thing worth trying: noticing where curiosity used to be, and what took its place.',
      'One thing worth trying: doing one small thing you have not done before, however minor.',
    ],
    RA: [
      'One thing worth trying: taking one small action on the thing you have been avoiding.',
      'One thing worth trying: noticing the moment right before you freeze, without judging it.',
      'One thing worth trying: choosing movement over more analysis, on just one decision today.',
    ],
  },
  hi: {
    IAP: [
      'आज़माने लायक बात: वह एक फैसला नाम दें जिसे आप टालते रहे हैं, भले ही अभी कुछ न करें।',
      'आज़माने लायक बात: यह लिखें कि आप वास्तव में क्या चाहते हैं, दूसरों की उम्मीदों से अलग।',
      'आज़माने लायक बात: नोटिस करें कि आज का कौन सा हिस्सा चुना हुआ लगा और कौन सा बस अपने आप हुआ।',
    ],
    EWB: [
      'आज़माने लायक बात: बिना कोई सफाई दिए आज आराम का एक हिस्सा सुरक्षित रखें।',
      'आज़माने लायक बात: नोटिस करें कि असल में आपको क्या थका देता है, यह मान लेने से पहले कि सब कुछ।',
      'आज़माने लायक बात: एक ऐसी ज़िम्मेदारी से पीछे हटें जो देने से ज़्यादा ले रही है।',
    ],
    FAF: [
      'आज़माने लायक बात: आज किसी एक चीज़ को पूरा ध्यान दें, बाकी को इंतज़ार करने दें।',
      'आज़माने लायक बात: नोटिस करें कि आपका ध्यान बार-बार खुद कहाँ लौटता है।',
      'आज़माने लायक बात: सिर्फ़ एक दिन के लिए किसी बार-बार आने वाली विचलन को हटाएं, फ़र्क महसूस करने के लिए।',
    ],
    RC: [
      'आज़माने लायक बात: बिना किसी मकसद के, उस एक व्यक्ति से संपर्क करें जिससे आप बात करना चाहते थे।',
      'आज़माने लायक बात: किसी तनावपूर्ण रिश्ते में जो अनकहा है, उसे नाम दें।',
      'आज़माने लायक बात: नोटिस करें कि कौन सा रिश्ता आपको स्थिर महसूस कराता है, और कौन सा थका देता है।',
    ],
    GAL: [
      'आज़माने लायक बात: जो सीखना आपने छोड़ दिया था, उस पर दस मिनट दें।',
      'आज़माने लायक बात: नोटिस करें कि जिज्ञासा कहाँ थी, और अब उसकी जगह क्या है।',
      'आज़माने लायक बात: कुछ ऐसा छोटा काम करें जो आपने पहले कभी नहीं किया।',
    ],
    RA: [
      'आज़माने लायक बात: जिस चीज़ से आप बचते रहे हैं, उस पर एक छोटा कदम उठाएं।',
      'आज़माने लायक बात: बिना खुद को जज किए, उस पल को नोटिस करें जब आप ठिठक जाते हैं।',
      'आज़माने लायक बात: आज सिर्फ़ एक फैसले में, ज़्यादा सोचने के बजाय हरकत को चुनें।',
    ],
  },
  gu: {
    IAP: [
      'અજમાવવા જેવી વાત: એ એક નિર્ણયને નામ આપો જેને તમે ટાળતા રહ્યા છો, ભલે હમણાં કંઈ ન કરો.',
      'અજમાવવા જેવી વાત: લખો કે તમે ખરેખર શું ઈચ્છો છો, બીજાની અપેક્ષાઓથી અલગ.',
      'અજમાવવા જેવી વાત: નોંધો કે આજનો કયો ભાગ પસંદ કરેલો લાગ્યો અને કયો ફક્ત આપમેળે થયો.',
    ],
    EWB: [
      'અજમાવવા જેવી વાત: કોઈ સ્પષ્ટતા આપ્યા વગર આજે આરામનો એક ભાગ સુરક્ષિત રાખો.',
      'અજમાવવા જેવી વાત: નોંધો કે ખરેખર તમને શું થકવે છે, બધું જ છે એમ માની લેતા પહેલાં.',
      'અજમાવવા જેવી વાત: એવી જવાબદારીથી પાછળ હટો જે આપવા કરતાં વધુ લઈ રહી છે.',
    ],
    FAF: [
      'અજમાવવા જેવી વાત: આજે એક વસ્તુને પૂરું ધ્યાન આપો, બાકીને રાહ જોવા દો.',
      'અજમાવવા જેવી વાત: નોંધો કે તમારું ધ્યાન વારંવાર જાતે ક્યાં પાછું ફરે છે.',
      'અજમાવવા જેવી વાત: ફક્ત એક દિવસ માટે વારંવાર આવતું વિચલન દૂર કરો, ફરક જોવા માટે.',
    ],
    RC: [
      'અજમાવવા જેવી વાત: કોઈ હેતુ વગર, એ એક વ્યક્તિનો સંપર્ક કરો જેની સાથે વાત કરવા ઈચ્છતા હતા.',
      'અજમાવવા જેવી વાત: તણાવપૂર્ણ સંબંધમાં જે અકહ્યું છે તેને નામ આપો.',
      'અજમાવવા જેવી વાત: નોંધો કે કયો સંબંધ તમને સ્થિર લાગે છે, અને કયો થકવે છે.',
    ],
    GAL: [
      'અજમાવવા જેવી વાત: જે શીખવાનું તમે છોડી દીધું હતું, તેના પર દસ મિનિટ આપો.',
      'અજમાવવા જેવી વાત: નોંધો કે જિજ્ઞાસા ક્યાં હતી, અને હવે તેની જગ્યાએ શું છે.',
      'અજમાવવા જેવી વાત: કંઈક નાનું કરો જે તમે પહેલાં ક્યારેય કર્યું નથી.',
    ],
    RA: [
      'અજમાવવા જેવી વાત: જે વસ્તુથી તમે બચતા રહ્યા છો, તેના પર એક નાનું પગલું લો.',
      'અજમાવવા જેવી વાત: પોતાને જજ કર્યા વગર, જે ક્ષણે તમે અટકી જાઓ છો તેને નોંધો.',
      'અજમાવવા જેવી વાત: આજે ફક્ત એક નિર્ણયમાં, વધુ વિચારવાને બદલે હલનચલન પસંદ કરો.',
    ],
  },
}

// Picks the theme most worth offering something for — Under Load takes
// priority (real pressure), then Stabilizing (early friction). Returns null
// when everything is Forming/Aligned/No Reading — no suggestion is offered
// when nothing is actually under pressure, so this never feels naggy.
function pickMicroActionTheme(themeStatuses: any[]): string | null {
  const underLoad = (themeStatuses ?? []).find((t: any) => t.status === 'Under Load')
  if (underLoad) return underLoad.code
  const stabilizing = (themeStatuses ?? []).find((t: any) => t.status === 'Stabilizing')
  if (stabilizing) return stabilizing.code
  return null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { user_id, cycle_id, day_number, alignment_score, theme_statuses, journal_snippet, previous_answer_text } =
      await req.json()

    if (!user_id || !cycle_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Language preference — mirror text must be generated in the user's language
    const { data: userRow } = await supabase
      .from('users')
      .select('language')
      .eq('id', user_id)
      .maybeSingle()
    const language = userRow?.language ?? 'en'
    const LANGUAGE_NAMES: Record<string, string> = {
      en: 'English',
      hi: 'Hindi (Devanagari script)',
      gu: 'Gujarati (Gujarati script)',
    }
    const languageInstruction = language === 'en'
      ? ''
      : `\n\nWrite your entire response in ${LANGUAGE_NAMES[language]}. Use natural, everyday ${LANGUAGE_NAMES[language].split(' ')[0]} — not formal or literary register. The vocabulary constraints below describe concepts: express their equivalents in the target language.`

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: 'No API key configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build a compact, structured prompt for Haiku
    const themeLines = (theme_statuses ?? [])
      .filter((t: any) => t.status !== 'No Reading')
      .map((t: any) => `- ${t.name}: ${t.status}`)
      .join('\n')

    const journalLine = journal_snippet
      ? `\nThe user wrote: "${journal_snippet.slice(0, 200)}"`
      : ''

    // Pattern context: last 7 alignment readings for trend awareness
    const { data: recentScores } = await supabase
      .from('alignment_scores')
      .select('score, date')
      .eq('user_id', user_id)
      .order('date', { ascending: false })
      .limit(7)

    let trendLine = ''
    if ((recentScores ?? []).length >= 3) {
      const ordered = (recentScores ?? []).map((r: any) => r.score).reverse()
      const diff = ordered[ordered.length - 1] - ordered[0]
      const direction = diff > 5 ? 'lifting' : diff < -5 ? 'settling lower' : 'holding'
      trendLine = `\nAcross the last ${ordered.length} readings, the overall signal has been ${direction}.`
    }

    // Repeat-awareness: when this exact question has been answered before and
    // the answer has changed, name the shift — turns inevitable repetition of
    // a fixed question bank into a real signal instead of a hidden redundancy.
    const repeatLine = previous_answer_text
      ? `\nLast time this question was asked, the answer was: "${String(previous_answer_text).slice(0, 150)}". Today it is different.`
      : ''
    const repeatInstruction = previous_answer_text
      ? '\nAn extra sentence is available: if useful, name that this reading has shifted from a prior answer to the same question, using only mirror language — do not say what "improved" or "declined," only that it differs.'
      : ''

    const systemPrompt = `You are the AI Mirror of Mirar — an emotional fitness system built on daily emotional hygiene.

Your only functions: observe, reflect, identify patterns, generate awareness.
You never: diagnose, prescribe, coach, motivate, advise, praise, or warn.

Sentence 1: State what the signals are showing today. Name specific themes. Be precise.
Sentence 2 (only if a theme is showing Low, or the signal is under pressure, or day_number >= 4): Name the visible pattern across recent days using only mirror language. If it is Day 1-3, omit sentence 2.

Forbidden words: heal, grow, improve, try, should, need, fix, better, worse, bad, good, score, performance, mindset, attitude.
Allowed words only: signal, reading, showing, holding, shifting, present, pattern, indicate, register, surface, drift, mirror, reflection, friction, load, pressure, steady.

Write maximum 3 sentences (3 only when the repeat-awareness sentence below applies). Be calm, not warm. Be a mirror, not a mentor.${repeatInstruction}${languageInstruction}`

    const userPrompt = `Today's signal reading (Day ${day_number}):
Today’s mirror: ${alignment_score !== null ? 'signal present' : 'still forming'}
Theme signals:
${themeLines || 'Still forming across areas.'}${trendLine}${journalLine}${repeatLine}

Reflect back what the signals are showing. Name specific themes. If day >= 4 or any theme is Low, add one sentence stating the visible pattern. Do not advise.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 120,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Anthropic error: ${err}`)
    }

    const result = await response.json()
    const observedText = result.content?.[0]?.text?.trim() ?? null

    // Append a curated, non-prescriptive micro-action when a theme is
    // genuinely under pressure — the bridge from "here's what's showing" to
    // "here's something worth trying," without the AI ever generating advice
    // text itself. Silently skipped if nothing is under pressure today.
    let mirrorText = observedText
    const microActionTheme = pickMicroActionTheme(theme_statuses)
    if (mirrorText && microActionTheme) {
      const bank = MICRO_ACTIONS[language]?.[microActionTheme] ?? MICRO_ACTIONS.en[microActionTheme]
      if (bank && bank.length > 0) {
        const microAction = bank[(day_number ?? 0) % bank.length]
        mirrorText = `${mirrorText}\n\n${microAction}`
      }
    }

    if (mirrorText) {
      // Store on today's alignment_scores row
      const today = new Date().toISOString().split('T')[0]
      await supabase
        .from('alignment_scores')
        .update({ mirror_text: mirrorText })
        .eq('user_id', user_id)
        .eq('date', today)
    }

    return new Response(
      JSON.stringify({ mirror_text: mirrorText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    // Non-fatal — mirror text is optional
    console.error('generate-mirror-insight error:', err)
    return new Response(
      JSON.stringify({ mirror_text: null, error: String(err) }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
