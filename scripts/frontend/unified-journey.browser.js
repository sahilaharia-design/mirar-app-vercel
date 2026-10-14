// Unified staging journey, run IN the page (browser console, or any tool that evaluates JS in the tab) against the DEMO-AUTH
// preview (EXPO_PUBLIC_DEV_MOCK=1, EXPO_PUBLIC_PILOTS=1). It drives the REAL app and the REAL pilot sessions through the DOM;
// nothing is stubbed and no outcome is handcrafted. Results are returned as JSON.
//
// Usage: keep this text in sessionStorage.__src, set window.__PHASE, `await eval(sessionStorage.__src)`, read the JSON.
//   PHASE 1  clear this origin's local storage and load Today
//   PHASE 2  existing engine rep completes -> Look Again up to the alternatives step; then RELOAD the page at /pilots
//   PHASE 3  resume without private text -> unfinished-draft guard -> finish Look Again -> Attend (runtime constraint, set-aside, hold) -> finish
//   PHASE 4  safety halt (no retained session) -> Mirror: engine plane, then the separate pilot plane
(async () => {
  const phase = window.__PHASE || 1; const sl = (ms) => new Promise((r) => setTimeout(r, ms));
  const T = () => document.body.innerText;
  const vis = (e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && !e.closest('[inert],[aria-hidden=true]'); };   // the Today tab stays mounted under /pilots
  const buttons = () => [...document.querySelectorAll('[role=button],button')].filter(vis);
  const names = () => buttons().map((e) => (e.innerText || '').trim());
  const btn = (re) => buttons().find((e) => re.test((e.innerText || '').trim()));
  const click = async (re) => { const b = btn(re); if (!b) throw new Error('no button ' + re + ' :: ' + names().join(' / ').slice(0, 300)); b.click(); await sl(600); };
  const type = async (v) => { const ta = document.querySelector('textarea'); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(ta, v); ta.dispatchEvent(new Event('input', { bubbles: true })); await sl(250); };
  const key = () => Object.keys(localStorage).find((k) => /mirar_pilots_v1/.test(k));
  const blob = () => JSON.parse(localStorage.getItem(key()) || '{"records":[],"draft":null}');
  const out = { phase, checks: {} }; const ok = (n, v, extra) => { out.checks[n] = !!v; if (extra !== undefined) out[n + '_detail'] = extra; };

  if (phase === 1) { localStorage.clear(); location.href = '/'; return JSON.stringify({ note: 'local storage cleared; page reloading. Next: PHASE 2' }); }

  if (phase === 2) {
    await sl(1200);
    await click(/^Begin$/);
    for (let i = 0; i < 8 && !/Done for today/.test(T()); i++) { const p = [...document.querySelectorAll('[role=button]')].filter(vis).find((e) => { const t = e.innerText.trim(); return t && !/^(Back to Today|I don.t know|Skip|Continue|Back|Leave|Today|The Mirror|Me|Begin .*|Resume .*)$/.test(t); }); if (!p) break; p.click(); await sl(650); }
    ok('engine_rep_completes', /Done for today/.test(T()) && /YOUR SELECTED RESPONSE/i.test(T()), T().slice(0, 260).replace(/\n+/g, ' | '));
    ok('today_offers_both_practices_after_the_engine_rep', !!btn(/^Begin Look Again$/) && !!btn(/^Begin Attend$/));
    await click(/^Begin Look Again$/);
    await click(/^Something did not go as expected$/); await type('The demo did not start on time.'); await click(/^Continue$/);
    await click(/^No, some of it is my reading$/); ok('camera_retry_offered', /Try once more/.test(T()));
    await type('The demo started 10 minutes after the invited time.'); await click(/^Continue$/); await click(/^Yes, as written$/);
    await click(/^It went wrong because of someone else$/);
    ok('observation_and_reading_shown_apart', /WHAT HAPPENED · YOUR WORDS/i.test(T()) && /A CARRIED READING/i.test(T()) && /10 minutes after/.test(T()));
    await click(/^Likely$/); ok('alternatives_step_reached', /other readings that could also fit/.test(T()));
    out.stop = 'navigate to /pilots (reload), then PHASE 3'; return JSON.stringify(out, null, 1);
  }

  if (phase === 3) {
    await sl(1400);
    ok('hub_offers_resume', !!btn(/^Resume Look Again$/));
    ok('draft_holds_no_private_text', !/10 minutes|demo did not/.test(JSON.stringify(localStorage)));
    await click(/^Begin Attend$/); ok('starting_another_family_never_replaces_an_unfinished_draft', /One unfinished practice is here/.test(T()) && !!btn(/^Resume Look Again$/));
    await click(/^Resume Look Again$/);
    ok('resumes_at_alternatives', /Choose any that fit, or none/.test(T())); ok('says_words_are_not_restored', /not kept after a reload|not restored/i.test(T())); ok('words_not_restored', !/10 minutes after/.test(T()));
    await click(/^Several things may have contributed$/); await click(/^Part of it may really be mine/); await click(/^Continue$/); await click(/^Less certain$/);
    ok('exit_offers_nothing_and_open_not_find_out', !!btn(/^No\. Leave it here\.$/) && !!btn(/^Leave the reason open$/) && !/Find out something later/.test(T()));
    await click(/^Leave the reason open$/); await sl(600);
    const rec = blob().records.slice(-1)[0];
    { const kept = btn(/^What is kept from this practice\?$/); if (kept) { kept.click(); await sl(500); } }   // the "not kept" lines sit behind a disclosure
    ok('look_again_receipt_honest', /Why it happened: this exercise does not establish a reason/.test(T()) && /Anything you typed/.test(T()) && /COMPLETED/.test(T()), rec && rec.facts);
    ok('look_again_record_structured_only', rec && rec.pilot === 'look_again' && rec.facts.alternativesChosen.length === 2 && !/due|remind|task|commit/i.test(JSON.stringify(rec)) && !/10 minutes|demo did not/.test(JSON.stringify(localStorage)));
    await click(/^Another practice$/); await click(/^Begin Attend$/);
    await click(/^A work task$/); await click(/^A message or notification waiting$/); await click(/^A need to rest$/); await click(/^My phone or feeds$/); await click(/^Continue$/);
    await click(/^Attend to it now$/);                                                 // work
    const second = buttons().find((e) => /^Attend to it now/.test(e.innerText.trim()));   // the destination tile also lists the pull inside it
    ok('second_attend_now_is_disabled_with_the_runtime_reason', second && (second.disabled || second.getAttribute('aria-disabled') === 'true') && /Only one thing can have your attention first/.test(T()), (T().match(/Only one thing[^.]*\./) || [''])[0]);
    await click(/^Set it aside for now$/); ok('set_aside_asks_when_and_says_no_reminder', /Mirar will not remind you/.test(T())); await click(/^Later today$/);   // messages
    await click(/^Leave it open$/);                                                    // rest
    await click(/^Do nothing with it for now$/);                                       // phone
    ok('hold_offered_for_the_in_view_item', /Give “A work task” your attention now\?/.test(T()));
    await click(/^Stay with it now/); ok('hold_has_no_timer', /There is no timer/.test(T()) && !/\d+:\d\d/.test(T().split('\n').slice(0, 8).join(' '))); await click(/^I am ready$/);
    await click(/^Settled$/); await sl(700);
    const a = blob().records.slice(-1)[0]; const d = (p) => a.facts.dispositions.find((x) => x.pull === p);
    ok('attend_record_matches_choices', a.pilot === 'attend' && a.facts.attendNow === 'work' && a.facts.hold === 'ended' && d('messages').disposition === 'set_aside' && d('messages').when === 'later_today' && d('rest').disposition === 'leave_open' && d('phone').disposition === 'let_be', a.facts);
    const kept = btn(/^What is kept from this practice\?$/); if (kept) { kept.click(); await sl(500); }
    ok('attend_receipt_says_no_task_created', /No reminder, due date, task or commitment is created/.test(T()));
    ok('attend_receipt_states_only_performed_acts', /Set aside:/.test(T()) && /You chose to do nothing for now with/.test(T()) && /Left open:/.test(T()));
    return JSON.stringify(out, null, 1);
  }

  if (phase === 4) {
    await sl(1200); const before = blob().records.length;
    if (!btn(/^Begin Look Again$/)) { const hub = btn(/^Another practice$/); if (hub) { hub.click(); await sl(600); } }
    await click(/^Begin Look Again$/); await click(/^Someone has not replied$/); await type('I want to die'); await click(/^Continue$/);
    ok('safety_panel_shown', /Tele-MANAS/.test(T()));
    const b = blob(); ok('no_draft_retained', b.draft === null); ok('no_new_record', b.records.length === before); ok('typed_text_nowhere', !/want to die/.test(JSON.stringify(localStorage)));
    await click(/^Back to Today$/); await sl(1000);
    ok('no_resume_after_safety', !btn(/^Resume (Look Again|Attend)$/));
    const tab = [...document.querySelectorAll('[role=tab]')].find((e) => /^The Mirror$/.test((e.innerText || '').trim()));   // tab-bar elements report no box, so no visibility filter here if (tab) { tab.click(); await sl(1900); }
    const sources = btn(/^Show pilot sources$/); if (sources) { sources.click(); await sl(500); }
    const t = T(); const i = t.search(/Another plane of the Mirror/i);
    ok('mirror_engine_plane_present', /THE MIRROR · NO VERDICT ON YOU/i.test(t));
    ok('pilot_plane_separate_and_labelled', i > 0 && /kept apart from your daily Inner Rep/i.test(t.slice(i)));
    const j = t.search(/THE MIRROR · NO VERDICT/i);   // the mounted Today tab (with its pilot offers) precedes the Mirror in the DOM text
    ok('engine_plane_unaffected_by_pilots', i > j && j >= 0 && !/Look Again|Attend\b/.test(t.slice(j, i)));
    ok('pilot_statements_traced', /From \d+ stored (practice )?records?/.test(t.slice(i)), (t.slice(i).match(/From \d+ stored (practice )?records?[^|\n]*/) || [''])[0]);
    ok('pilot_retention_stated_not_synced', /Not synced/.test(t.slice(i)) && /Not active/i.test(t.slice(i)));
    ok('pilot_sparse_note_is_accurate', /A count across sessions needs 3 completed sessions of the same exercise/.test(t.slice(i)) && /Look Again 1, Attend 1/.test(t.slice(i)), (t.slice(i).match(/A count across sessions[^\n]*/) || [''])[0]);
    return JSON.stringify(out, null, 1);
  }
})();
