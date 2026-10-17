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
phases=['Only on this device','Backed up to my account','Backup is off · account copy kept','Backing up changes','Changes waiting on this device','Two histories need your choice','An account copy is available','Bringing back your practice','Backup on · no history yet','Backup cannot be checked','Removing practice history','Account history removed','That change was not completed','Review backup consent','Some entries stay on this device','Account copy removed · backup off','Device history cleared','Account practice restored']
def snapshot():return run('snapshot')
def has(t):assert t in snapshot(),t
def missing(t):assert t not in snapshot(),t
def begin():
 run('open','about:blank')
 run('open',os.environ.get('MIRAR_CONTINUITY_URL','http://127.0.0.1:5196/?continuity'));text('Manage practice history');run('wait','350')
def ack():click('Simulate acknowledgment')
def matrix():
 for w,h in [(320,568),(390,844),(768,1024),(1024,768),(1440,900)]:
  run('set','viewport',str(w),str(h));begin();audit('today-default',w);click('Manage practice history');audit('device-controls',w)
  click('Back up my practice');audit('consent',w);click('Not now');ack()
  for phase in phases:
   state(phase);audit(phase,w)
   if phase!='Backed up to my account':missing('Last confirmed backup:')
  state('Backed up to my account');has('Last confirmed backup:');click('Delete my backed-up practice');audit('account-delete',w);has('This device’s practice and your sign-in account remain');click('Cancel')
  click('Clear history from this device');audit('device-clear',w);has('It does not delete the account copy');click('Cancel')
  state('Changes waiting on this device');click('Sign out');has('Wait while it finishes');audit('signout-waiting',w);click('Cancel')
  state('Two histories need your choice');has('structured entries');missing('completed Daily Inner Reps');click('Review using account history');has('Device-only entries remain separately');audit('use-account',w);click('Cancel');click('Review using device history');audit('replace-account-explicit',w);click('Cancel')
  click('The Mirror');audit('mirror',w);click('Me');audit('me',w)
  print('PASS viewport',w,flush=True)
 (OUT/'integration-matrix.json').write_text(json.dumps(rows,indent=2)+'\n');print('PASS',len(rows),'audits')
def functional():
 run('set','viewport','390','844');begin();click('Begin');text("I don't know");click("I don't know");text('Explore backup');click('Not now');has('Requested: decline');ack();click('The Mirror');has('1 day of practice');audit('decline-and-real-mirror',390)
 click('Manage practice history');click('Back up my practice');click('Turn on backup');has('Only on this device');click('Simulate failure');has('Only on this device');audit('no-click-success',390)
 click('Back up my practice');click('Turn on backup');ack();has('Backing up changes');missing('Last confirmed backup:');click('Simulate confirmed completion');has('Last confirmed backup:');audit('service-confirmed-ready',390)
 click('Turn off backup');click('Turn off backup');ack();has('Backup is off · account copy kept');missing('Last confirmed backup:');audit('off-retains-copy-without-date',390)
 state('Review backup consent');click('Review backup consent');has('Turn on backup');click('Not now');has('Requested: decline');ack();audit('reconsent-declined',390)
 state('Backed up to my account');click('Delete my backed-up practice');click('Cancel');click('The Mirror');has('1 day of practice');click('Manage practice history');click('Delete my backed-up practice');click('I understand which history will be removed');click('Delete account history');ack();has('Removing practice history');click('Simulate confirmed completion');has('Account history removed');has('Backup is off');click('The Mirror');has('1 day of practice');audit('account-delete-preserves-device',390)
 click('Manage practice history');click('Clear history from this device');click('Cancel');click('The Mirror');has('1 day of practice');click('Manage practice history');click('Clear history from this device');click('I understand which history will be removed');click('Clear device history');ack();has('Device history cleared');click('The Mirror');missing('1 day of practice');audit('separate-device-clear',390)
 state('Changes waiting on this device');click('Sign out');click('Wait while it finishes');has('Where your practice lives.');missing('Simulate acknowledgment');click('Sign out');click('Sign out');has('Requested: sign out');click('Simulate failure');audit('signout-never-blocked-by-waiting',390)
 state('Some entries stay on this device');has('Another device recorded this day first');audit('kept-local-not-error',390)
 state('Account copy removed · backup off');has('will not be uploaded unless you choose');missing('Last confirmed backup:');audit('removed-not-auto-uploaded',390)
 state('Two histories need your choice');has('2 structured entries');click('Review using account history');click('I understand which history will be used');click('Confirm replacement');has('Requested: keep account');click('Simulate failure');audit('account-choice-failure-no-success',390)
 state('Two histories need your choice');click('Review using device history');click('I understand which history will be removed');click('Confirm replacement');has('Requested: keep device');click('Simulate failure');audit('device-choice-needs-confirmation',390)
 state('An account copy is available');click('Restore account history');ack();has('Bringing back your practice');click('Simulate confirmed completion');has('Account practice restored');has('No fictional practice was injected');has('Back up my practice');missing('button "Turn off backup"');audit('restore-explicit-ack',390)
 begin();click('Manage practice history');click('Back up my practice');run('set','media','reduced-motion')
 for _ in range(40):
  run('press','Tab');a=json.loads(json.loads(run('eval','JSON.stringify({text:document.activeElement.textContent,outline:getComputedStyle(document.activeElement).outlineStyle})')))
  if a['text']=='Turn on backup':break
 else:raise AssertionError('Cannot reach consent')
 assert a['outline']!='none';run('press','Enter');has('Requested: enable');audit('keyboard-reduced-motion',390)
 boundary=json.loads(json.loads(run('eval','JSON.stringify({local:localStorage.length,session:sessionStorage.length,remote:performance.getEntriesByType("resource").filter(x=>!x.name.startsWith(location.origin)).length})')))
 assert boundary=={'local':0,'session':0,'remote':0},boundary
 (OUT/'integration-functional.json').write_text(json.dumps({'audits':rows,'boundary':boundary,'keyboard':a},indent=2)+'\n');print('PASS',len(rows),'functional audits')
def consent_version():
 for w,h in [(320,568),(390,844)]:
  run('set','viewport',str(w),str(h));begin();click('Manage practice history');click('Back up my practice');click('Change sample disclosure');has('disclosure version is unavailable or has changed');assert 'button "Turn on backup" [disabled' in snapshot();audit('stale-disclosure-disabled',w)
  click('Back');click('Manage practice history');click('Change sample disclosure');click('Back up my practice');assert 'button "Turn on backup" [disabled' in snapshot();audit('missing-disclosure-disabled',w)
  click('Change sample disclosure');assert 'button "Turn on backup" [disabled' in snapshot();click('Back');click('Manage practice history');click('Back up my practice');click('Turn on backup');has('Requested: enable');audit('reviewed-current-disclosure',w)
 (OUT/'integration-consent-version.json').write_text(json.dumps(rows,indent=2)+'\n');print('PASS',len(rows),'version audits')
if __name__=='__main__':
 {'matrix':matrix,'functional':functional,'consent':consent_version}[sys.argv[1] if len(sys.argv)>1 else 'matrix']()
