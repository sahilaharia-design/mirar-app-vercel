// Unified staging journey, run IN the page (browser console, or any tool that evaluates JS in the tab) against the DEMO-AUTH
// preview (EXPO_PUBLIC_DEV_MOCK=1, EXPO_PUBLIC_PILOTS=1). It drives the REAL app and the REAL pilot sessions through the DOM;
// nothing is stubbed and no outcome is handcrafted. Results are returned as JSON.
//
// Usage: set window.__PHASE, evaluate this file, read the JSON, reload when told, repeat.
//   PHASE 1  clear this origin's local storage and load Today
//   PHASE 2  engine rep completes → pilots hub → Look Again up to the alternatives step; then RELOAD the page
//   PHASE 3  resume without private text → finish Look Again → Attend board → hold → finish
//   PHASE 4  safety halt (no retained session) → Mirror: engine section and the separate pilot section
// Between phases the tool must keep the script text (e.g. sessionStorage.__src) and eval it with window.__PHASE set.
(async () => {
  const phase = window.__PHASE || 1; const sl = (ms) => new Promise((r) => setTimeout(r, ms));
  const T = () => document.body.innerText; const buttons = () => [...document.querySelectorAll('[role=button],button')];
  const btn = (re) => buttons().find((e) => re.test((e.innerText || '').trim()));
  const byLabel = (l) => buttons().find((e) => e.getAttribute('aria-label') === l);
  const click = async (re) => { const b = btn(re); if (!b) throw new Error('no button ' + re + ' in: ' + T().slice(0, 240)); b.click(); await sl(550); };
  const label = async (l) => { const b = byLabel(l); if (!b) throw new Error('no label ' + l); b.click(); await sl(350); };
  const type = async (v) => { const ta = document.querySelector('textarea'); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(ta, v); ta.dispatchEvent(new Event('input', { bubbles: true })); await sl(200); };
  const key = () => Object.keys(localStorage).find((k) => /mirar_pilots_v1/.test(k));
  const blob = () => JSON.parse(localStorage.getItem(key()) || '{"records":[],"draft":null}');
  const begins = () => buttons().filter((e) => /^(Begin|Resume)$/.test(e.innerText.trim()));
  const out = { phase, checks: {} }; const ok = (n, v, extra) => { out.checks[n] = !!v; if (extra !== undefined) out[n + '_detail'] = extra; };
  const goPilots = async () => { if (location.pathname !== '/pilots') { const e = btn(/^Optional extra practice \(preview\)$/); if (!e) { await click(/^Back to Today$/); } (btn(/^Optional extra practice \(preview\)$/)).click(); await sl(800); } };

  if (phase === 1) {
    localStorage.clear(); location.href = '/'; return JSON.stringify({ note: 'local storage cleared; page reloading. Next: PHASE 2' });
  }
  if (phase === 2) {
    await sl(1200);
    // existing primary daily rep must still work
    await click(/^Begin$/); const first = T();
    for (let i = 0; i < 8 && !/Done for today/.test(T()); i++) { const p = [...document.querySelectorAll('[role=button]')].find((e) => { const t = e.innerText.trim(); return t && !/^(Back to Today|I don.t know|Skip|Continue|Back|Leave|Optional extra practice \(preview\)|Today|The Mirror|Me)$/.test(t); }); if (!p) break; p.click(); await sl(600); }
    ok('engine_rep_completes', /Done for today/.test(T()) && /YOUR SELECTED RESPONSE/i.test(T()), T().slice(0, 300).replace(/\n+/g, ' | '));
    await goPilots(); ok('pilots_hub_reachable_from_today', /Two more ways to practise/.test(T()));
    begins()[0].click(); await sl(500);
    await click(/^Something did not go as expected$/); await type('The demo did not start on time.'); await click(/^Continue$/);
    await click(/^No, some of it is my reading$/); ok('camera_retry_offered', /Try once more/.test(T()));
    await type('The demo started 10 minutes after the invited time.'); await click(/^Continue$/); await click(/^Yes, as written$/);
    await click(/^It went wrong because of someone else$/); ok('frame_shows_observation_and_reading_apart', /WHAT A CAMERA WOULD RECORD/i.test(T()) && /THE READING YOU NAMED/i.test(T()) && /10 minutes after/.test(T()));
    await click(/^Likely$/); ok('alternatives_step_reached', /other readings that could also fit/.test(T()));
    out.stop = 'reload the page now (navigate to /pilots), then PHASE 3'; return JSON.stringify(out, null, 1);
  }
  if (phase === 3) {
    await sl(1200);
    ok('hub_offers_resume', buttons().map((e) => e.innerText.trim()).includes('Resume'));
    ok('draft_holds_no_private_text', !/10 minutes|demo did not/.test(JSON.stringify(localStorage)));
    await click(/^Resume$/); ok('resumes_at_alternatives', /Choose any that fit, or none/.test(T())); ok('says_words_are_not_kept', /earlier words are not kept/.test(T())); ok('words_not_restored', !/10 minutes after/.test(T()));
    await click(/^Several things may have contributed$/); await click(/^Part of it may really be mine/); await click(/^Continue$/); await click(/^Less certain$/);
    ok('exit_offers_nothing_and_open_not_find_out', /No\. Leave it here\./.test(T()) && /Leave the reason open/.test(T()) && !/Find out something later/.test(T()));
    await click(/^Leave the reason open$/); await sl(500);
    const rec = blob().records.slice(-1)[0];
    ok('look_again_receipt_honest', /Why it happened: this exercise does not establish a reason/.test(T()) && /Anything you typed/.test(T()) && /Done/i.test(T()), rec && rec.facts);
    ok('look_again_record_structured_only', rec && rec.pilot === 'look_again' && rec.facts.alternativesChosen.length === 2 && !/due|remind|task|commit/i.test(JSON.stringify(rec)) && !/10 minutes|demo did not/.test(JSON.stringify(localStorage)));
    // Attend
    await click(/^Back to practice$/); begins()[1].click(); await sl(500);
    await click(/^A work task$/); await click(/^A message or notification waiting$/); await click(/^A need to rest$/); await click(/^My phone or feeds$/); await click(/^Continue$/);
    await label('In view: A work task'); await label('In view: A need to rest');
    ok('second_in_view_moves_first_to_open_and_says_so', /moved to left open, because only one thing can be in view/.test(T()));
    await label('At the edge: A message or notification waiting'); ok('set_aside_asks_when_and_says_no_reminder', /Mirar will not remind you/.test(T()) && [...document.querySelectorAll('[aria-pressed=true]')].some((e) => /No time set/.test(e.innerText)));
    await label('Set down: My phone or feeds'); btn(/^Later today$/).click(); await sl(300);
    await click(/^Close this arrangement$/); ok('hold_offered_for_the_in_view_item', /Give “A need to rest” your attention now\?/.test(T()));
    await click(/^Stay with it now/); ok('hold_has_no_timer', /There is no timer/.test(T()) && !/\d+:\d\d/.test(T().split('\n').slice(0, 6).join(' '))); await click(/^I am ready$/);
    await click(/^Settled$/); await sl(600);
    const a = blob().records.slice(-1)[0];
    ok('attend_record_matches_choices', a.pilot === 'attend' && a.facts.attendNow === 'rest' && a.facts.hold === 'ended' && a.facts.dispositions.find((d) => d.pull === 'messages').disposition === 'set_aside' && a.facts.dispositions.find((d) => d.pull === 'messages').when === 'later_today' && a.facts.dispositions.find((d) => d.pull === 'phone').disposition === 'let_be' && a.facts.dispositions.find((d) => d.pull === 'work').disposition === 'leave_open', a.facts);
    ok('attend_receipt_says_no_task_created', /No reminder, due date, task or commitment is created/.test(T()) && /Set aside:/.test(T()) && /You chose to do nothing for now with/.test(T()) && /Left open:/.test(T()));
    return JSON.stringify(out, null, 1);
  }
  if (phase === 4) {
    await sl(1200); const before = blob().records.length;
    if (!/Two more ways/.test(T())) { await click(/^Back to practice$/).catch(() => {}); }
    begins()[0].click(); await sl(500); await click(/^Someone has not replied$/); await type('I want to die'); await click(/^Continue$/);
    ok('safety_panel_shown', /Tele-MANAS/.test(T()));
    const b = blob(); ok('no_draft_retained', b.draft === null); ok('no_new_record', b.records.length === before); ok('typed_text_nowhere', !/want to die/.test(JSON.stringify(localStorage)));
    await click(/^Back$/); ok('no_resume_after_safety', !buttons().map((e) => e.innerText.trim()).includes('Resume'));
    const findTab = () => [...document.querySelectorAll('[role=tab],a,[role=button],button')].find((e) => /^The Mirror$/.test((e.innerText || '').trim()));
    if (!findTab()) { await click(/^Back to Today$/); await sl(1200); }
    const tab = findTab(); if (tab) { tab.click(); await sl(1800); }
    const t = T(); const i = t.indexOf('EXTRA PRACTICE · STAGING');
    ok('mirror_engine_section_present', /THE MIRROR · NO VERDICT ON YOU/i.test(t));
    ok('pilot_section_separate_and_labelled', i > 0 && /Kept apart from the Mirror above/.test(t) && /not combined with the Mirror.s evidence/.test(t));
    ok('engine_mirror_unaffected_by_pilots', !/Look Again|Attend/.test(t.slice(0, i)));
    ok('pilot_statements_traced_and_exact', /From \d+ stored records? · exact/.test(t.slice(i)) && /Not synced/.test(t.slice(i)) && /Not active in this preview/i.test(t.slice(i)));
    ok('pilot_sparse_honest', /Counts across sessions start once you have completed 3 sessions/.test(t.slice(i)) || /POPULATED/i.test(t.slice(i)));
    return JSON.stringify(out, null, 1);
  }
})();
