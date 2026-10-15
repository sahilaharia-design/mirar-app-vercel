import subprocess,json,time,os,shutil,sys
from pathlib import Path
B=os.environ.get('AGENT_BROWSER') or shutil.which('agent-browser')
if not B: raise SystemExit('Set AGENT_BROWSER to the installed agent-browser binary.')
OUT=Path(os.environ.get('MIRAR_CONTINUITY_DIR','/tmp/mirar-continuity-validation'));OUT.mkdir(exist_ok=True);rows=[]
def run(*a):
 p=subprocess.run([B,'--session','mirar-continuity','--pin-tab',*a],text=True,capture_output=True)
 if p.returncode: raise RuntimeError(str(a)+' '+p.stderr+p.stdout)
 return p.stdout.strip()
def click(n):run('find','role','button','click','--name',n,'--exact')
def text(t):run('wait','--text',t)
def audit(label,w):
 run('wait','350')
 run('eval',"document.querySelectorAll('div').forEach(e=>{if(e.scrollHeight>e.clientHeight&&getComputedStyle(e).overflowY==='auto') e.scrollTop=0;})")
 d=json.loads(run('a11y','--json'))['data'];assert d['counts']['violations']==0,(label,d['violations']);assert d['counts']['incomplete']==0,(label,d['incomplete'])
 g=json.loads(json.loads(run('eval',"JSON.stringify({overflow:document.documentElement.scrollWidth>innerWidth,bad:[...document.querySelectorAll('[role=button],button')].filter(e=>!e.disabled&&e.getBoundingClientRect().height>0).filter(e=>e.getBoundingClientRect().height<44||e.getBoundingClientRect().width<44).map(e=>e.textContent)})")));assert not g['overflow'] and not g['bad'],g
 rows.append({'label':label,'width':w,'axe':d['counts'],'geometry':g})
def state(n):click('Review states');click(n);text('Where your practice lives.')
phases=['Only on this device','Backed up to my account','Backup is off · account copy kept','Backing up changes','Changes waiting on this device','Two histories need your choice','An account copy is available','Bringing back your practice','Backup on · no history yet','Backup cannot be checked','Removing practice history','History removed','That change was not completed']

def matrix():
 for w,h in [(320,568),(390,844),(768,1024),(1024,768),(1440,900)]:
  run('set','viewport',str(w),str(h));run('open',os.environ.get('MIRAR_CONTINUITY_URL','http://127.0.0.1:5196/?continuity'));text('Manage practice history');run('wait','250');audit('today-default',w)
  click('Manage practice history');audit('account-device',w)
  click('Back up my practice');audit('consent-off',w);click('Not now');text('Where your practice lives.')
  for name in phases:
   state(name);audit(name,w)
   if name in ['Only on this device','Backed up to my account','Two histories need your choice','An account copy is available']:
    run('screenshot',str(OUT/f'{w}-{phases.index(name)}.png'))
  click('Sign out');audit('signout-uncertain',w);click('Cancel');
  state('Backed up to my account');click('Turn off backup');audit('off-confirm',w);click('Cancel');
  click('Delete my backed-up practice');audit('delete-unacknowledged',w);click('I understand which history will be removed');audit('delete-acknowledged',w);click('Cancel');
  state('Two histories need your choice');click('Review using account history');audit('replace-account',w);click('Cancel');click('Review using device history');audit('replace-device',w);click('Cancel');
  click('The Mirror');audit('mirror-with-conflict',w);click('Me');audit('me-with-conflict',w)
  print('Validated viewport',w,flush=True)
 (OUT/'results.json').write_text(json.dumps(rows,indent=2)+'\n')
 print('PASS',len(rows),'audits')

def functional():
 def has(t):
  assert t in run('snapshot'),t
 
 def missing(t):
  assert t not in run('snapshot'),t
 
 run('set','viewport','390','844');run('open',os.environ.get('MIRAR_CONTINUITY_URL','http://127.0.0.1:5196/?continuity'));text('Manage practice history');run('wait','350');click('Begin');text("I don't know");click("I don't know");text('Explore backup');audit('actual-rep-completion-invitation',390)
 click('Not now');missing('Explore backup');click('The Mirror');has('1 day of practice');audit('actual-memory-mirror',390)
 click('Manage practice history');click('Back up my practice');click('Not now');has('Only on this device')
 click('Back up my practice');click('Turn on backup');has('Only on this device');click('Simulate failure');has('Only on this device');audit('enable-failed-unchanged',390)
 click('Back up my practice');click('Turn on backup');click('Simulate acknowledgment');has('Backing up changes');missing('StaticText "Backed up to my account"');audit('enable-ack-not-complete',390)
 click('Simulate operation failure');has('That change was not completed');click('Try again');click('Simulate acknowledgment');click('Simulate confirmed completion');has('Backed up to my account');audit('confirmed-ready',390)
 click('Turn off backup');click('Cancel');has('Backed up to my account');click('Turn off backup');click('Turn off backup');has('Backed up to my account');click('Simulate acknowledgment');has('Backup is off · account copy kept');audit('withdraw-retains-account-copy',390)
 click('Sign out');has('The confirmed account copy will remain');click('Cancel');click('The Mirror');has('1 day of practice');audit('cancel-signout-preserves-runtime',390)
 state('Changes waiting on this device');click('Sign out');has('Some changes are not confirmed');audit('signout-pending-warning',390);click('Cancel')
 state('An account copy is available');click('Restore account history');has('An account copy is available');click('Simulate acknowledgment');has('Bringing back your practice');click('Simulate operation failure');has('That change was not completed');click('Try again');click('Simulate acknowledgment');has('Bringing back your practice');click('Simulate confirmed completion');has('No fictional practice was injected');audit('recovery-explicit-confirmation',390)
 state('Two histories need your choice');click('Review using account history');click('Cancel');has('Two histories need your choice');click('Review using device history');click('I understand which history will be removed');click('Confirm replacement');has('Two histories need your choice');click('Simulate acknowledgment');has('Backing up changes');click('Simulate confirmed completion');audit('conflict-explicit-device-choice',390)
 state('Two histories need your choice');click('Review using account history');click('I understand which history will be removed');click('Confirm replacement');click('Simulate acknowledgment');click('Simulate confirmed completion');audit('conflict-explicit-account-choice',390)
 state('Backed up to my account');click('Delete my backed-up practice');click('Cancel');click('The Mirror');has('1 day of practice');click('Manage practice history');click('Delete my backed-up practice');click('I understand which history will be removed');click('Delete account and device history');click('Simulate acknowledgment');has('Removing practice history');click('Simulate operation failure');has('That change was not completed');click('Try again');click('Simulate acknowledgment');has('Removing practice history');click('Simulate confirmed completion');has('History removed');has('Backup remains on');click('The Mirror');missing('1 day of practice');audit('confirmed-delete-clears-only-review-memory',390)
 click('Manage practice history');click('Sign out');click('Sign out');click('Simulate acknowledgment');has('Simulated sign-out complete');audit('simulated-signout',390)
 # Keyboard-only activation of opt-in through focus/Enter; no pointer click for the final consent intent.
 run('open',os.environ.get('MIRAR_CONTINUITY_URL','http://127.0.0.1:5196/?continuity'));text('Manage practice history');click('Manage practice history');click('Back up my practice');run('set','media','reduced-motion')
 for _ in range(35):
  run('press','Tab');a=json.loads(json.loads(run('eval','JSON.stringify({text:document.activeElement.textContent,outline:getComputedStyle(document.activeElement).outlineStyle})')))
  if a['text']=='Turn on backup':break
 else:raise AssertionError('Keyboard could not reach opt-in')
 assert a['outline']!='none',a
 run('press','Enter');has('Requested: enable');audit('keyboard-reduced-motion-consent',390)
 resources=json.loads(json.loads(run('eval','JSON.stringify({local:localStorage.length,session:sessionStorage.length,remote:performance.getEntriesByType("resource").map(x=>x.name).filter(x=>!x.startsWith(location.origin))})')))
 assert resources=={'local':0,'session':0,'remote':[]},resources
 (OUT/'functional-results.json').write_text(json.dumps({'audits':rows,'boundary':resources,'keyboard':a},indent=2)+'\n')
 print('PASS',len(rows),'functional audits, no storage or remote resources')

def final():
 run('set','media','reduced-motion')
 for w,h in [(320,568),(390,844),(768,1024),(1024,768),(1440,900)]:
  run('set','viewport',str(w),str(h));run('open',os.environ.get('MIRAR_CONTINUITY_URL','http://127.0.0.1:5196/?continuity'));text('Manage practice history');run('wait','250');run('screenshot',str(OUT/f'today-{w}.png'))
  click('Manage practice history');click('Back up my practice');audit('final-consent',w);run('screenshot',str(OUT/f'consent-{w}.png'));click('Not now')
  state('Changes waiting on this device');click('Sign out');audit('final-signout',w);hastext=run('snapshot');assert 'Look Again, Attend and unfinished sessions' in hastext;run('screenshot',str(OUT/f'signout-{w}.png'));click('Cancel')
  if w==390:
   state('Two histories need your choice');run('screenshot',str(OUT/'conflict-390.png'));state('An account copy is available');run('screenshot',str(OUT/'recovery-390.png'));state('Backed up to my account');click('Delete my backed-up practice');run('screenshot',str(OUT/'delete-390.png'));click('Cancel');click('Me');run('screenshot',str(OUT/'me-390.png'));click('The Mirror');run('screenshot',str(OUT/'mirror-390.png'))
 (OUT/'final-copy-results.json').write_text(json.dumps(rows,indent=2)+'\n')
 print('PASS final consent/signout, 10 audits')

if __name__=='__main__':
 {'matrix':matrix,'functional':functional,'final':final}[sys.argv[1] if len(sys.argv)>1 else 'matrix']()
