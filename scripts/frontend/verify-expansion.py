"""Isolated fictional review: operations, receipts, geometry and accessibility, never real auth."""
import os,json,subprocess,atexit,itertools
from pathlib import Path
B=os.environ.get('AGENT_BROWSER_BIN','/private/tmp/mirar-npm-cache/_npx/6de2aa2fded2970c/node_modules/agent-browser/bin/agent-browser-darwin-arm64')
base=os.environ.get('MIRAR_EXPANSION_PREVIEW','http://127.0.0.1:5183')
root=Path(__file__).resolve().parents[2]/'docs/experience/expansion-validation';(root/'screenshots').mkdir(parents=True,exist_ok=True);rows=[]
atexit.register(lambda:(root/'results.json').write_text(json.dumps(rows,indent=2)+'\n'))
def run(*a):return subprocess.check_output([B,'--session','mirar-expansion-matrix','--pin-tab',*a],text=True).strip()
def js(s):return json.loads(run('eval',s))
def open_stage(s,extra=''):
 run('open',base+'/?journey='+s+extra);run('wait','--text','Fictional');run('wait','600')
def click(s):run('find','role','button','click','--name',s,'--exact');run('wait','350')
def body():return js('document.body.textContent')
def capture(n):
 data=js("({overflow:document.documentElement.scrollWidth>innerWidth,small:[...document.querySelectorAll('[role=button],button,input,textarea,a')].filter(e=>e.getBoundingClientRect().height>0&&getComputedStyle(e).visibility!=='hidden').filter(e=>e.getBoundingClientRect().height<43.9).map(e=>e.textContent),local:Object.keys(localStorage),session:Object.keys(sessionStorage),cookies:document.cookie,remote:performance.getEntriesByType('resource').map(e=>e.name).filter(n=>n.startsWith('http')&&new URL(n).origin!==location.origin)})")
 assert not data['overflow'],(n,data);assert not data['small'],(n,data);assert not data['local'] and not data['session'] and not data['cookies'];assert not data['remote'],(n,data)
 run('screenshot',str(root/'screenshots'/f'{n}.png'));rows.append({'screen':n,'geometry':data})
def axe(n):
 a=json.loads(run('a11y','--json'))['data'];rows.append({'axe':n,'counts':a['counts'],'violations':a['violations'],'incomplete':a['incomplete']});assert not a['violations'] and not a['incomplete'],(n,a)
readings=['Keep the first reading','Try another possibility','Leave the reason unknown'];texts=['They may have disagreed.','They may have been listening.','Their reason was not given.'];demands=['A colleague’s message','An unfinished page','A little time to rest'];labels={'view':'In view','edge':'At the edge','open':'Leave open'}
for w,h in [(320,568),(390,844),(768,1024),(1024,768),(1440,900)]:
 run('set','viewport',str(w),str(h))
 for stage in ['landing','entry','intro','today','mirror','honest-mirror','pilot-reframe','pilot-attend','me','privacy']:
  open_stage(stage);capture(f'{stage}-{w}');axe(f'{stage}-{w}')
 # All six capacity scenes and each read-only Mirror study layer.
 open_stage('landing')
 for name in ['Direction','Energy','Focus','Relationships','Growth','Action']:
  run('find','role','button','click','--name',name+' ', '--exact') if False else js("[...document.querySelectorAll('[role=button]')].find(e=>e.textContent.startsWith("+json.dumps(name)+")&&e.textContent.includes('.')).click()")
  run('wait','450');click('A closer look');click('Leave room');assert 'Fictional scene · not an exercise catalogue' in body();rows.append({'capacity':name,'viewport':w,'twoPerspectives':True})
 for layer in ['What was selected','What was counted','A possible reading','What is unknown','A correction']:click(layer);assert 'Illustrated boundaries.' in body();rows.append({'studyLayer':layer,'viewport':w})
 # Reframe: all readings, both spacing modes, and a direct unresolved exit.
 open_stage('pilot-reframe')
 for i,r in enumerate(readings):
  click(r);assert texts[i] in body();click('Give the meaning more room');click('Close this view');assert 'No intention was committed.' in body();assert texts[i] in body();capture(f'reframe-{i}-{w}');axe(f'reframe-{i}-{w}');rows.append({'pilot':'look_again','reading':i,'viewport':w,'receipt':True,'apart':True});click('Try a different arrangement');click(r);click('Close this view');rows.append({'pilot':'look_again','reading':i,'viewport':w,'receipt':True,'apart':False});click('Try a different arrangement')
 click('Leave it unresolved');assert 'Their reason was not given.' in body();assert 'No intention was committed.' in body();rows.append({'pilot':'look_again','unresolvedExit':True,'viewport':w})
 # Attend: all 20 valid assignments, no ranking and no accidental commitment.
 open_stage('pilot-attend')
 for states in itertools.product(['view','edge','open'],repeat=3):
  if states.count('view')>1:continue
  for name,state in zip(demands,states):click(labels[state]+': '+name)
  click('Close this arrangement');assert 'No intention was committed.' in body()
  field=js("document.getElementById('attention-field').textContent")
  for name in demands:assert name in field
  selected=js("[...document.querySelectorAll('[aria-pressed=true]')].map(e=>e.getAttribute('aria-label')).filter(Boolean)")
  assert all(labels[state]+': '+name in selected for name,state in zip(demands,states))
  rows.append({'pilot':'attend','placements':states,'viewport':w,'receipt':True})
 click('In view: A colleague’s message');click('In view: A little time to rest');assert js("[...document.querySelectorAll('[aria-label]')].find(e=>e.getAttribute('aria-label')==='Leave open: A colleague’s message').getAttribute('aria-pressed')")=='true'
 capture(f'attend-rest-{w}');axe(f'attend-rest-{w}');click('Leave everything open');assert js("[...document.querySelectorAll('[aria-label]')].filter(e=>e.getAttribute('aria-label')?.startsWith('Leave open:')&&e.getAttribute('aria-pressed')==='true').length")==3;rows.append({'pilot':'attend','replaceFocusAndLeaveOpen':True,'viewport':w});click('Try a different arrangement')
 # Actual runtime, actual typed receipt, then Mirror. No candidate pilot enters this flow.
 open_stage('today');click('Begin');click("I don't know");assert 'Room for not knowing.' in body();capture(f'runtime-unknown-{w}');axe(f'runtime-unknown-{w}');click('Back to Today');click('Journey');click('Mirror');assert 'Actual practice · not ability' in body();capture(f'runtime-mirror-{w}');axe(f'runtime-mirror-{w}');rows.append({'runtimeUnknownToMirror':True,'viewport':w})
# Full simulated entry journey and every available retained-history record.
open_stage('landing');click('Enter Mirar');assert 'No email is sent.' in body();click('Continue the preview without email');click('Go to Today');click('Begin');click("I don't know");click('Back to Today');rows.append({'entryJourney':True,'noSignupClaim':True})
for record in ['compare','timeframe','commitment_check','insight']:
 open_stage('mirror','&record='+record);capture('retained-'+record);axe('retained-'+record);assert 'Fictional' in body();rows.append({'retainedRecord':record,'notAccountHistory':True})
# Real keyboard: header controls and pilot options; source meaning remains live text.
run('set','media','reduced-motion');open_stage('pilot-attend');assert js("matchMedia('(prefers-reduced-motion: reduce)').matches");run('press','Tab');assert 'In view:' in js("document.activeElement.getAttribute('aria-label')||''");run('press','Enter');run('wait','350');assert 'A colleague’s message' in js("document.getElementById('attention-field').textContent");capture('keyboard-attend-reduced');axe('keyboard-attend-reduced');rows.append({'keyboardPilot':True,'reducedMotion':True})
# Auth failure presentation is mocked, never a real authentication request.
open_stage('entry','&auth-error=1');assert 'link expired' in body();axe('auth-error');rows.append({'authErrorPresentation':True})
assert not run('errors'),run('errors');rows.append({'runtimeErrors':''});print('Expansion QA complete:',len(rows),'records')
