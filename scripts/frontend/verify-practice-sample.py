"""All public sample branches, using local preview only. No registration, services or response storage."""
import subprocess,json,atexit,os
from pathlib import Path
B=os.environ.get('AGENT_BROWSER_BIN','/private/tmp/mirar-npm-cache/_npx/6de2aa2fded2970c/node_modules/agent-browser/bin/agent-browser-darwin-arm64');base=os.environ.get('MIRAR_SAMPLE_PREVIEW','http://127.0.0.1:5180');root=Path(__file__).resolve().parents[2]/'docs/experience/practice-sample-validation';(root/'screenshots').mkdir(exist_ok=True,parents=True);rows=[]
atexit.register(lambda:(root/'results.json').write_text(json.dumps(rows,indent=2)+'\n'))
def run(*a):return subprocess.check_output([B,'--session','mirar-practice-all-paths','--pin-tab',*a],text=True).strip()
def js(s):return json.loads(run('eval',s))
def click(t):run('find','role','button','click','--name',t,'--exact');run('wait','350')
def fresh():run('open',base);run('wait','--text','What is observable?');run('wait','350')
def audit(n):
 a=json.loads(run('a11y','--json'))['data'];rows.append({'a11y':n,'counts':a['counts'],'violations':a['violations'],'incomplete':a['incomplete']});assert not a['violations'],str(a['violations']);assert not a['incomplete'],str(a['incomplete'])
def capture(n):
 run('screenshot',str(root/'screenshots'/f'{n}.png'));v=js("({overflow:document.documentElement.scrollWidth>innerWidth,small:[...document.querySelectorAll('button,a,[role=button]')].filter(e=>e.getBoundingClientRect().height>0&&getComputedStyle(e).visibility!=='hidden').filter(e=>e.getBoundingClientRect().height<43.9).map(e=>e.textContent),storage:Object.keys(localStorage),remote:performance.getEntriesByType('resource').map(e=>e.name).filter(n=>n.startsWith('http')&&new URL(n).origin!==location.origin)})");rows.append({'screenshot':n,'geometry':v});assert not v['overflow'];assert not v['small'],str(v['small']);assert not v['storage'];assert not v['remote']
starts=['The message has no reply yet.','They don’t want to reply to me.','I don’t know'];views=['Keep the first reading','Consider another possibility','Leave the reason unknown'];headings=['You held the observation steady.','You separated an observation from a possible meaning.','You made room for an unanswered part.'];texts=['They don’t want to reply to me.','They may not have had a chance to reply.','The reason is not known.']
for w,h in [(320,568),(390,844),(768,1024),(1024,768),(1440,900)]:
 run('set','viewport',str(w),str(h));fresh();capture(f'initial-{w}');audit(f'initial-{w}');assert not js("document.body.textContent.includes('Begin sample')");assert not js("document.body.textContent.includes('Which is closer to today?')")
 for i,start in enumerate(starts):
  fresh();click(start);capture(f'opening-{i}-{w}');assert not js("[...document.querySelectorAll('[role=button]')].some(e=>e.textContent==='Continue with Mirar')")
  for j,view in enumerate(views):
   click(view);window=js("document.getElementById('practice-window').textContent");assert 'The message has no reply yet.' in window and texts[j] in window
   assert headings[i] in js('document.body.textContent');assert js("[...document.querySelectorAll('[role=button]')].find(e=>e.textContent.includes("+json.dumps(view)+")).getAttribute('aria-pressed')")=='true'
   capture(f'path-{i}-{j}-{w}');audit(f'path-{i}-{j}-{w}');rows.append({'path':[i,j],'viewport':[w,h],'fixedObservation':True,'activeWindowText':window,'distinctStartingResponse':headings[i],'ctaAfterPractice':True})
# Every exit point: beginning, unselected perspective, and every selected perspective.
run('set','viewport','390','844')
for i in [-1,0,1,2]:
 for j in ([-1] if i==-1 else [-1,0,1,2]):
  fresh()
  if i>=0:click(starts[i])
  if j>=0:click(views[j])
  click('Leave the exercise');assert 'The exercise can stay unfinished.' in js('document.body.textContent');assert not js("document.body.textContent.includes('Continue with Mirar')");click('Return to the exercise');assert 'What is observable?' in js('document.body.textContent');rows.append({'exit':[i,j],'restartClears':True})
for i,start in enumerate(starts):
 fresh();click(start);click(views[2]);click('Try the exercise again');assert 'What is observable?' in js('document.body.textContent');assert not js("document.body.textContent.includes('Continue with Mirar')")
# Keyboard and reversible alternative, with a real reduced-motion media preference.
fresh();run('set','media','reduced-motion');assert js("matchMedia('(prefers-reduced-motion: reduce)').matches");js("[...document.querySelectorAll('[role=button]')].find(e=>e.textContent==='I don’t know').focus()");run('press','Enter');run('wait','350');js("[...document.querySelectorAll('[role=button]')].find(e=>e.textContent==='Leave the reason unknown').focus()");run('press','Enter');run('wait','350');assert 'The reason is not known.' in js("document.getElementById('practice-window').textContent");capture('keyboard-reduced-motion');audit('keyboard-reduced-motion');rows.append({'keyboardUnknownPractice':True,'reducedMotionPreference':True})
# CTA delegates to the existing configurable callback; no sample fields added to URL.
js("[...document.querySelectorAll('[role=button]')].find(e=>e.textContent==='Continue with Mirar').click()");run('wait','350');rows.append({'ctaDelegateResult':run('get','url'),'ctaMessage':js("document.querySelector('[role=alert]')?.textContent??null")})
assert not js("document.body.textContent.includes('You put words to this moment')");rows.append({'runtimeErrors':run('errors')});assert not run('errors');print('Practice sample QA complete:',len(rows),'records')
