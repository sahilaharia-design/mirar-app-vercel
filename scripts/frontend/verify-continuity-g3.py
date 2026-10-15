"""Actual G3 controller browser review; stub service, no external accounts or file writes."""
import subprocess,json,os,shutil,sys,time
from pathlib import Path
B=os.environ.get('AGENT_BROWSER') or shutil.which('agent-browser')
if not B:raise SystemExit('Set AGENT_BROWSER')
OUT=Path(os.environ.get('MIRAR_G3_DIR','/tmp/mirar-g3-validation'));OUT.mkdir(parents=True,exist_ok=True)
URL=os.environ.get('MIRAR_G3_URL','http://127.0.0.1:5196/?continuity');rows=[]
def run(*a):
 p=subprocess.run([B,'--session',os.environ.get('MIRAR_G3_SESSION','mirar-g3'),'--pin-tab',*a],capture_output=True,text=True)
 if p.returncode:raise RuntimeError(str(a)+p.stdout+p.stderr)
 return p.stdout.strip()
def click(n):run('find','role','button','click','--name',n,'--exact')
def has(t):assert t in run('snapshot'),t
def missing(t):assert t not in run('snapshot'),t
def js(s):
 d=json.loads(run('eval',s));return json.loads(d) if isinstance(d,str) else d
def state(n):
 click('Review states');click(n);run('wait','--text','Where your practice lives.');run('wait','100')
 assert js('JSON.stringify(window.g3Review)')['scenario']==n

def audit(label,w):
 run('wait','300');run('eval',"document.querySelectorAll('div').forEach(e=>{if(e.scrollHeight>e.clientHeight&&getComputedStyle(e).overflowY==='auto')e.scrollTop=0})")
 d=json.loads(run('a11y','--json'))['data'];assert d['counts']['violations']==0,(label,d['violations']);assert d['counts']['incomplete']==0,(label,d['incomplete'])
 g=js("JSON.stringify({overflow:document.documentElement.scrollWidth>innerWidth,bad:[...document.querySelectorAll('button,[role=button]')].filter(e=>!e.disabled&&e.getBoundingClientRect().height>0).filter(e=>e.getBoundingClientRect().height<44||e.getBoundingClientRect().width<44).map(e=>e.textContent)})")
 assert not g['overflow'] and not g['bad'],g
 has('Service responses below are simulated')
 rows.append({'state':label,'width':w,'axe':d['counts'],'geometry':g,'snapshot':js('JSON.stringify(window.g3Review)')})
scenarios=['device','empty','ready','ready_with_export','paused','syncing','offline','unavailable','error','recoverable','recovering','conflict_no_export','conflict_with_export','copy_was_deleted','deleting','deleted','account_copy_removed','history_reset','turned_off_elsewhere','account_copy_deleted_device_kept','server_flag_pending','export_unavailable_error','save_cancelled']
def begin():
 run('open','about:blank');run('open',URL);run('wait','--text','Where your practice lives.');run('wait','200')
def matrix():
 for w,h in [(320,568),(390,844),(768,1024),(1024,768),(1440,900)]:
  run('set','viewport',str(w),str(h));begin();assert js('JSON.stringify(window.g3Review)')['calls']==0
  for scenario in scenarios:
   state(scenario);audit(scenario,w)
   if scenario not in ['ready','ready_with_export']:missing('Last confirmed backup:')
   if scenario in ['error','export_unavailable_error','save_cancelled']:has('Try again')
   if scenario=='conflict_no_export':missing('button "Review using account history"');missing('button "Review using device history"');has('neither history can be replaced')
   if scenario=='copy_was_deleted':has('not a restoration');has('waiting for the controller connection');missing('button "Review using account history"')
  state('ready');click('Turn off backup');audit('off-confirmation',w);has('Changes made while backup is off');click('Cancel')
  click('Delete my backed-up practice');audit('account-deletion-confirmation',w);has('This device keeps its practice');click('Cancel')
  click('Clear practice on this device');audit('device-clear-confirmation',w);has('does not delete the account copy');click('Cancel')
  click('Delete account and device history');audit('combined-unavailable',w);has('Combined deletion cannot proceed');click('Cancel')
  state('recoverable');click('Review recovery');audit('recovery-confirmation',w);has('turn on backup');click('Cancel')
  state('conflict_with_export');click('Review using account history');audit('save-device-first',w);has('copy of this device’s history');click('Cancel');click('Review using device history');audit('save-account-first',w);has('copy of the account’s history');click('Cancel')
  state('paused');click('Sign out');audit('signout-unsent',w);has('changes are not confirmed');click('Cancel')
  click('Today');audit('today-paused',w);click('The Mirror');audit('mirror-paused',w);click('Me');audit('me-paused',w)
  print('PASS viewport',w,flush=True)
 (OUT/'matrix.json').write_text(json.dumps(rows,indent=2)+'\n');print('PASS',len(rows),'audits')
def waitfor(expr):
 for _ in range(160):
  if js('JSON.stringify('+expr+')'):return
  time.sleep(.05)
 raise AssertionError(expr)
def functional():
 run('set','viewport','390','844');begin();assert js('JSON.stringify(window.g3Review.calls)')==0
 for tab in ['Me','Today','The Mirror','History']:click(tab)
 assert js('JSON.stringify(window.g3Review.calls)')==0
 click('Check for a backed-up copy');waitfor('window.g3Review.snapshot.accountCopy==="none"');audit('explicit-check-only',390)
 state('syncing');missing('Last confirmed backup:');assert not js('JSON.stringify(window.g3Review.snapshot.enabled)');click('Release simulated service response');waitfor('window.g3Review.snapshot.phase==="ready"');audit('actual-service-ack',390)
 state('error');has('You appear to be offline');click('Service responds normally');click('Try again');waitfor('window.g3Review.snapshot.phase==="ready"');audit('safe-error-retry',390)
 state('ready');click('Turn off backup');click('Turn off backup');waitfor('window.g3Review.snapshot.phase==="paused"');assert not js('JSON.stringify(window.g3Review.snapshot.enabled)');audit('turnoff-ack-retains-copy',390)
 state('server_flag_pending');has('New uploads have stopped');has('unsent changes stay');audit('server-flag-pending',390)
 state('recoverable');assert js('JSON.stringify(window.g3Review.applied)')==0;click('Review recovery');has('turn on backup');click('Cancel');assert js('JSON.stringify(window.g3Review.applied)')==0
 click('Review recovery');click('Restore and turn on backup');waitfor('window.g3Review.snapshot.phase==="ready"');assert js('JSON.stringify(window.g3Review.applied)')>0;audit('explicit-recovery-actual-replay',390)
 state('conflict_no_export');missing('button "Review using account history"');audit('no-saver-no-replacement',390)
 state('conflict_with_export');click('Review using account history');click('Cancel');assert js('JSON.stringify(window.g3Review.fileAttempts)')==0
 click('Cancel simulated file save');click('Review using account history');click('I understand what this choice changes');click('Save device copy, then use account history');waitfor('window.g3Review.snapshot.phase==="error"');has('copy was not saved');assert js('JSON.stringify(window.g3Review.applied)')==0;audit('save-cancel-no-adoption',390)
 state('conflict_with_export');click('Review using account history');click('I understand what this choice changes');click('Save device copy, then use account history');waitfor('window.g3Review.applied>0');assert js('JSON.stringify(window.g3Review.fileConfirmed)')>0;audit('saved-device-copy-before-adoption',390)
 state('conflict_with_export');click('Review using device history');click('I understand what this choice changes');click('Save account copy, then replace it');waitfor('window.g3Review.snapshot.requestPending===false && !window.g3Review.snapshot.decision');assert js('JSON.stringify(window.g3Review.fileConfirmed)')>0;audit('saved-account-copy-before-replacement',390)
 state('ready');click('Delete my backed-up practice');click('I understand what this choice changes');has('button "Delete account history" [disabled');click('Cancel');click('Clear practice on this device');click('I understand what this choice changes');has('button "Clear device history" [disabled');click('Cancel');click('Delete account and device history');click('I understand what this choice changes');has('button "Delete both copies" [disabled');audit('all-destructive-blocked-without-saver',390)
 state('ready_with_export');click('Cancel simulated file save');click('Delete account and device history');click('I understand what this choice changes');click('Delete both copies');waitfor('window.g3Review.snapshot.phase==="error"');has('copy was not saved');assert js('JSON.stringify(window.g3Review.clearCount)')==0;audit('combined-cancel-keeps-device',390)
 state('ready_with_export');click('Delete account and device history');click('I understand what this choice changes');click('Delete both copies');waitfor('window.g3Review.snapshot.phase==="deleted"');assert not js('JSON.stringify(window.g3Review.snapshot.enabled)');assert js('JSON.stringify(window.g3Review.clearCount)')==1;audit('combined-actual-ack',390)
 state('account_copy_deleted_device_kept');has('device’s practice was kept');assert js('JSON.stringify(window.g3Review.clearCount)')==0;audit('account-only-keeps-device',390)
 state('copy_was_deleted');has('waiting for the controller connection');has('button "Keep it only on this device" [disabled');missing('Two histories need your choice');audit('removed-decision-never-noop-success',390)
 state('paused');click('Sign out');click('Cancel');assert not js('JSON.stringify(window.g3Review.signedOut)');click('Sign out');click('Sign out');waitfor('window.g3Review.signedOut===true');has('Signed out of the review')
 state('device');click('Back up my practice');run('set','media','reduced-motion')
 for _ in range(45):
  run('press','Tab');a=js('JSON.stringify({text:document.activeElement.textContent,outline:getComputedStyle(document.activeElement).outlineStyle})')
  if a['text']=='Turn on backup':break
 else:raise AssertionError('Cannot reach opt-in')
 assert a['outline']!='none';run('press','Enter');waitfor('window.g3Review.snapshot.enabled===true');audit('keyboard-reduced-motion-actual-ack',390)
 boundary=js('JSON.stringify({local:localStorage.length,session:sessionStorage.length,remote:performance.getEntriesByType("resource").filter(e=>!e.name.startsWith(location.origin)).length})');assert boundary=={'local':0,'session':0,'remote':0}
 (OUT/'functional.json').write_text(json.dumps({'audits':rows,'keyboard':a,'boundary':boundary},indent=2)+'\n');print('PASS',len(rows),'functional audits')
if __name__=='__main__':
 {'matrix':matrix,'functional':functional}[sys.argv[1] if len(sys.argv)>1 else 'matrix']()
