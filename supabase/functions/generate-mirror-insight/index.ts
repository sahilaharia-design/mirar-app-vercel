// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { user_id, cycle_id, day_number, alignment_score, theme_statuses, journal_snippet } =
      await req.json()

    if (!user_id || !cycle_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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

    const systemPrompt = `You are the internal mirror of Mirar — a continuous alignment system.
Your role is to reflect, then place the reading in pattern context.

Sentence 1: State what the signals are showing today. Name specific themes. Be precise.
Sentence 2 (only if a theme is showing Low, or alignment is below 40, or day_number >= 4): Name the pattern and what it is an early signal of — using only alignment language. If it is Day 1-3, omit sentence 2.

Forbidden words: heal, grow, improve, try, should, need, fix, better, worse, bad, good, feel, emotions, mindset, attitude.
Allowed words only: signal, reading, showing, holding, shifting, present, pattern, precede, indicate, register, track, surface, drift, alignment, calibrating, friction, load, pressure, consecutive.

Write maximum 2 sentences. Be calm, not warm. Be a diagnostic instrument, not a coach.`

    const userPrompt = `Today's signal reading (Day ${day_number}):
Alignment reading: ${alignment_score !== null ? alignment_score : 'calibrating'}
Theme signals:
${themeLines || 'Still calibrating across themes.'}${journalLine}

Reflect back what the signals are showing. Name specific themes. If day >= 4 or any theme is Low or alignment < 40, add one sentence stating what this pattern is an early indicator of. Do not advise.`

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
    const mirrorText = result.content?.[0]?.text?.trim() ?? null

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
