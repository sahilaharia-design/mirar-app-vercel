"""All public sample branches, using local preview only. No registration, services or response storage."""
import subprocess,json,atexit,os
from pathlib import Path
B=os.environ.get('AGENT_BROWSER_BIN','/private/tmp/mirar-npm-cache/_npx/6de2aa2fded2970c/node_modules/agent-browser/bin/agent-browser-darwin-arm64');base=os.environ.get('MIRAR_SAMPLE_PREVIEW','http://127.0.0.1:5183');root=Path(os.environ.get('MIRAR_VALIDATION_DIR',Path(__file__).resolve().parents[2]/'docs/experience/expansion-validation/sample'));(root/'screenshots').mkdir(exist_ok=True,parents=True);rows=[]
atexit.register(lambda:(root/'results.json').write_text(json.dumps(rows,indent=2)+'\n'))
def run(*a):return subprocess.check_output([B,'--session','mirar-practice-all-paths','--pin-tab',*a],text=True).strip()
def js(s):return json.loads(run('eval',s))
def click(t):run('find','role','button','click','--name',t,'--exact');run('wait','350')
def fresh():run('open',base);run('wait','--text','Where does your attention go first?');run('wait','350')
def audit(n):
 a=json.loads(run('a11y','--json'))['data'];rows.append({'a11y':n,'counts':a['counts'],'violations':a['violations'],'incomplete':a['incomplete']});assert not a['violations'],str(a['violations']);assert not a['incomplete'],str(a['incomplete'])
def capture(n):
 run('screenshot',str(root/'screenshots'/f'{n}.png'));v=js("({overflow:document.documentElement.scrollWidth>innerWidth,small:[...document.querySelectorAll('button,a,[role=button]')].filter(e=>e.getBoundingClientRect().height>0&&getComputedStyle(e).visibility!=='hidden').filter(e=>e.getBoundingClientRect().height<43.9).map(e=>e.textContent),storage:Object.keys(localStorage),remote:performance.getEntriesByType('resource').map(e=>e.name).filter(n=>n.startsWith('http')&&new URL(n).origin!==location.origin)})");rows.append({'screenshot':n,'geometry':v});assert not v['overflow'];assert not v['small'],str(v['small']);assert not v['storage'];assert not v['remote']
starts=['That there is no reply','What the silence might mean','I’m not sure'];views=['Keep the first reading','Consider another possibility','Leave the reason unknown'];headings=['Here, what is visible and a possible reading stay separate.']*3;texts=['They don’t want to reply to me.','They may not have had a chance to reply.','The reason is not known.']
for w,h in [(320,568),(390,844),(768,1024),(1024,768),(1440,900)]:
 run('set','viewport',str(w),str(h));fresh();capture(f'initial-{w}');audit(f'initial-{w}');assert not js("document.body.textContent.includes('Begin sample')");assert not js("document.body.textContent.includes('Which is closer to today?')");assert not js("document.body.textContent.includes('What is observable?')")
 for i,start in enumerate(starts):
  fresh();click(start);assert ['Starting with what is visible.','Starting with what it might mean.','Not sure where to begin.'][i] in js('document.body.textContent');capture(f'opening-{i}-{w}');assert not js("[...document.querySelectorAll('[role=button]')].some(e=>e.textContent==='Continue with Mirar')")
  for j,view in enumerate(views):
   click(view);window=js("document.getElementById('practice-window').textContent");assert 'The message has no reply yet.' in window and texts[j] in window
   assert headings[i] in js('document.body.textContent');closing=js("[...document.querySelectorAll('[role=button]')].find(e=>e.textContent==='Continue with Mirar').parentElement.parentElement.textContent");assert 0<=closing.index('In the Mirar app, today’s exercise is chosen for you and may be simpler than this one.')<closing.index('Continue with Mirar');assert ['The first reading remains in view as a possibility, not a known fact.','Another possibility is in view. The scene does not establish which reason is true.','The reason remains open; the observable part stays in view.'][j] in closing;assert js("[...document.querySelectorAll('[role=button]')].find(e=>e.textContent.includes("+json.dumps(view)+")).getAttribute('aria-pressed')")=='true'
   capture(f'path-{i}-{j}-{w}');audit(f'path-{i}-{j}-{w}');rows.append({'path':[i,j],'viewport':[w,h],'fixedObservation':True,'activeWindowText':window,'neutralCompletion':headings[i],'ctaAfterPractice':True,'betaDisclosureAboveCTA':True})
# Every exit point: beginning, unselected perspective, and every selected perspective.
run('set','viewport','390','844')
for i in [-1,0,1,2]:
 for j in ([-1] if i==-1 else [-1,0,1,2]):
  fresh()
  if i>=0:click(starts[i])
  if j>=0:click(views[j])
  click('Leave the exercise');assert 'The exercise can stay unfinished.' in js('document.body.textContent');assert not js("document.body.textContent.includes('Continue with Mirar')");click('Return to the exercise');assert 'Where does your attention go first?' in js('document.body.textContent');rows.append({'exit':[i,j],'restartClears':True})
for i,start in enumerate(starts):
 fresh();click(start);click(views[2]);click('Try the exercise again');assert 'Where does your attention go first?' in js('document.body.textContent');assert not js("document.body.textContent.includes('Continue with Mirar')")
# Keyboard and reversible alternative, with a real reduced-motion media preference.
fresh();run('set','media','reduced-motion');assert js("matchMedia('(prefers-reduced-motion: reduce)').matches");run('press','Tab');assert js('document.activeElement.textContent')==starts[0];run('press','Tab');assert js('document.activeElement.textContent')==starts[1];run('press','Tab');assert js('document.activeElement.textContent')==starts[2];run('press','Enter');run('wait','350');run('press','Tab');assert js('document.activeElement.textContent')==views[0];run('press','Tab');assert js('document.activeElement.textContent')==views[1];run('press','Tab');assert js('document.activeElement.textContent')==views[2];run('press','Enter');run('wait','350');assert 'The reason is not known.' in js("document.getElementById('practice-window').textContent");capture('keyboard-reduced-motion');audit('keyboard-reduced-motion');rows.append({'keyboardUnknownPractice':True,'reducedMotionPreference':True})
# CTA delegates to the existing configurable callback; no sample fields added to URL.
js("[...document.querySelectorAll('[role=button]')].find(e=>e.textContent==='Continue with Mirar').click()");run('wait','350');rows.append({'ctaDelegateResult':run('get','url'),'ctaMessage':js("document.querySelector('[role=alert]')?.textContent??null")})
assert not js("document.body.textContent.includes('You put words to this moment')");rows.append({'runtimeErrors':run('errors')});assert not run('errors');print('Practice sample QA complete:',len(rows),'records')
