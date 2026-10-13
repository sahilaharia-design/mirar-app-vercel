"""Real pilot sessions through rendered controls; separate memory KV, never personal test data."""
import os,json,subprocess,atexit,time
from pathlib import Path
B=os.environ.get('AGENT_BROWSER_BIN','/private/tmp/mirar-npm-cache/_npx/6de2aa2fded2970c/node_modules/agent-browser/bin/agent-browser-darwin-arm64')
base=os.environ.get('MIRAR_PILOT_PREVIEW','http://127.0.0.1:5184')
root=Path(__file__).resolve().parents[2]/'docs/experience/pilot-integration-validation';(root/'screenshots').mkdir(parents=True,exist_ok=True)
rows=[];seen={};sentinel='Review-only words: a message arrived at noon.'
atexit.register(lambda:(root/'results.json').write_text(json.dumps(rows,indent=2)+'\n'))
def run(*a):return subprocess.check_output([B,'--session','mirar-real-pilot-qa','--pin-tab',*a],text=True).strip()
def js(s):return json.loads(run('eval',s))
def click(s):run('find','role','button','click','--name',s,'--exact')
def body():return js('document.body.textContent')
def step():return js('window.pilotReviewAudit.step()')
def record():return js('window.pilotReviewAudit.records()')
def open_stage(s):
 run('open',base+'/?journey='+s);run('wait','--text','memory only');run('wait','150')
def capture(n,access=True):
 data=js("({overflow:document.documentElement.scrollWidth>innerWidth,small:[...document.querySelectorAll('[role=button],button,input,textarea,a')].filter(e=>e.getBoundingClientRect().height>0&&getComputedStyle(e).visibility!=='hidden').filter(e=>e.getBoundingClientRect().height<43.9).map(e=>e.textContent),storage:JSON.stringify(window.pilotReviewAudit.storage()),local:Object.keys(localStorage),session:Object.keys(sessionStorage),cookies:document.cookie})")
 assert not data['overflow'],(n,data);assert not data['small'],(n,data);assert sentinel not in data['storage'];assert not data['local'] and not data['session'] and not data['cookies']
 # Structured state is checked, but no typed text or tokens are written to evidence.
 data.pop('storage');rows.append({'screen':n,'geometry':data});run('screenshot',str(root/'screenshots'/f'{n}.png'))
 if access:
  a=json.loads(run('a11y','--json'))['data'];rows.append({'axe':n,'counts':a['counts'],'violations':a['violations'],'incomplete':a['incomplete']});assert not a['violations'] and not a['incomplete'],(n,a)
def answer(st,kind=None,index=0,ids=None):
 seen.setdefault(st['id'],set()).add(kind or (','.join(map(str,ids)) if ids is not None else str(index)))
 if kind=='unknown':click('Hard to tell' if st['type']=='multi' else 'I don’t know')
 elif st['type']=='words':
  if kind=='skip':click('Keep it as it is' if st['id']=='observation_retry' else 'Skip')
  else:run('find','role','textbox','fill','--name',st['prompt'],'--exact',sentinel);click('Continue')
 elif st['type']=='multi':
  if ids==[]:click(st['noneLabel'])
  else:
   for i in ids or [0]:click(st['options'][i]['label'])
   click('Continue')
 elif st['type']=='hold':click(st['endLabel'])
 else:click(st['options'][index]['label'])
 run('wait','60')
def finish_check(n,pilot):
 run('wait','--text','WHAT REMAINS UNKNOWN');assert step() is None;recs=record();assert recs[-1]['pilot']==pilot and recs[-1]['status']=='completed';capture(n)
 click('Back to Today');click('Journey');click('Mirror');assert 'Another plane of the Mirror.' in body();assert 'Pilot records stay separate' in body();capture(n+'-mirror',False)
for vi,(w,h) in enumerate([(320,568),(390,844),(768,1024),(1024,768),(1440,900)]):
 run('set','viewport',str(w),str(h))
 for stage in ['today','mirror']:
  open_stage(stage);capture(f'{stage}-empty-{w}')
 # Six full Look Again paths at each size; all situations, no reading, every weighting/reweigh/exit category.
 for k in range(6):
  open_stage('pilot-reframe');capture(f'look-opening-{w}-{k}',k==0)
  while (st:=step()):
   sid=st['id']
   if sid=='situation':answer(st,'unknown' if k==5 else None,index=k)
   elif st['type']=='words':answer(st,'skip' if k==5 else None)
   elif sid.startswith('camera'):answer(st,'unknown' if k==3 else None,index=(k+vi)%3)
   elif sid=='interpretation':answer(st,'unknown' if k==5 else None,index=3 if k==4 else k%3)
   elif sid=='weight':answer(st,'unknown' if k==3 else None,index=(k+vi)%4)
   elif sid=='alternatives':
    capture(f'look-alternatives-{w}-{k}',k==0)
    answer(st,'unknown' if k==3 else None,ids=[] if k==2 else list(range(4)) if k==1 else [vi%4])
   elif sid=='reweigh':answer(st,'unknown' if k==3 else None,index=(k+vi)%4)
   else:answer(st,'unknown' if k==5 else None,index=k%2)
  finish_check(f'look-complete-{w}-{k}','look_again')
 # Attend: every destination and distinct completion/hold/rearrange/unknown/empty outcomes.
 for k in range(8):
  open_stage('pilot-attend')
  while (st:=step()):
   sid=st['id']
   if sid=='pulls':
    answer(st,'unknown' if k==6 else None,ids=[] if k==5 else [0,1,2,3,4] if k in [0,1] else [5,6,7])
   elif sid.startswith('place:'):
    opts=st['options'];snap=js('window.pilotReviewAudit.snapshot()');placement=[a for a in snap['answers'] if a['stepId'].startswith('place:')];i=len(placement)
    if k in [0,1]:idx=i%4 if i<4 else 2
    elif k==2:idx=2
    elif k==3:idx=3
    elif k==4:idx=1
    else:idx=2
    if any(o.get('disabled') for o in opts):
     assert js("[...document.querySelectorAll('[role=button]')].some(e=>e.textContent==='Attend to it now'&&e.getAttribute('aria-disabled')==='true')");capture(f'attend-disabled-{w}-{k}-{i}',i==1)
    answer(st,'unknown' if k==7 else None,index=idx)
   elif sid.startswith('when:'):answer(st,index=(k+vi)%3)
   elif sid=='hold_offer':answer(st,index=k%2)
   elif sid=='hold':
    assert 'Back' not in js("[...document.querySelectorAll('[role=button]')].map(e=>e.textContent)");capture(f'hold-{w}');answer(st)
   elif sid=='sit':answer(st,'unknown' if k==7 else None,index=0 if k!=4 else 1)
   elif sid=='rearrange':answer(st,index=0)
   else:raise AssertionError(st)
  finish_check(f'attend-complete-{w}-{k}','attend')
 print('viewport complete',w,flush=True)
# Actual pause, back, reload, abandoned/early-left and safety handling. No fabricated resumption text.
open_stage('pilot-reframe');answer(step(),index=0);answer(step());assert sentinel in body();answer(step(),index=0);answer(step(),index=0)
click('Back');assert step()['id']=='interpretation';assert 'They are ignoring me on purpose' not in js("document.querySelector('main').textContent.split('Which of these')[0]")
answer(step(),index=1);click('Back to Today');click('Resume Look Again');assert 'Earlier words were not restored.' in body();assert sentinel not in body();assert step()['id']=='weight'
click('Resume after simulated reload');assert sentinel not in body();assert 'Earlier words were not restored.' in body();capture('resume-without-words')
click('Leave');assert record()[-1]['status']=='left';assert 'Stopped before completion' in body() or 'stopped before completion' in body();capture('left-look')
open_stage('pilot-attend');answer(step(),ids=[0]);answer(step(),index=0);answer(step(),index=0);assert step()['type']=='hold';click('Leave');assert record()[-1]['status']=='left' and record()[-1]['facts']['hold']=='left_during';capture('left-hold')
open_stage('pilot-reframe');click('Leave');assert not record();capture('left-no-answers')
open_stage('pilot-reframe');answer(step(),index=0);st=step();run('find','role','textbox','fill','--name',st['prompt'],'--exact','I want to kill myself');click('Continue');run('wait','100');assert not record();assert js('window.pilotReviewAudit.storage().every(b=>!b.draft)');capture('safety-no-record')
# Resume/new-practice conflict never silently drops a draft.
open_stage('pilot-reframe');answer(step(),index=0);click('Back to Today');click('Begin Attend');assert 'One unfinished practice is here.' in body();click('Keep it for now');assert record()==[];click('Begin Attend');click('Leave it and begin Attend');assert record()[-1]['pilot']=='look_again' and record()[-1]['status']=='left';capture('draft-replacement')
# Populated pilot history, actual carry offers and all three carry responses.
for response in range(3):
 open_stage('today');click('Load pilot fixture history');click('Begin Attend');assert step()['id'].startswith('carry:');capture('carry-'+str(response))
 while (st:=step()):
  if st['id'].startswith('carry:'):answer(st,'unknown' if response==2 else None,index=response)
  elif st['type']=='multi':answer(st,ids=[])
  elif st['id'].startswith('place:'):answer(st,index=2)
  else:answer(st,index=0)
 assert record()[-1]['status']=='completed';click('Back to Today');click('Journey');click('Mirror');assert 'FIXTURE DATA' in body();capture('populated-mirror-'+str(response))
# Real keyboard operation, reduced motion and touch-equivalent native buttons.
run('set','media','reduced-motion');open_stage('pilot-attend');assert js("matchMedia('(prefers-reduced-motion: reduce)').matches")
run('press','Tab');assert 'A message or notification waiting' in js('document.activeElement.textContent');run('press','Enter');assert js("[...document.querySelectorAll('[aria-pressed=true]')].some(e=>e.textContent==='A message or notification waiting')");click('Continue');run('press','Tab');assert 'Attend to it now' in js('document.activeElement.textContent');run('press','Enter');assert step()['id']=='hold_offer';capture('keyboard-reduced-motion')
assert not run('errors'),run('errors');rows.append({'coverage':{k:sorted(v) for k,v in seen.items()},'browserErrors':[]});print('Pilot UI QA complete',len(rows),flush=True)
