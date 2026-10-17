import subprocess,json,time,os,shutil
from pathlib import Path
B=os.environ.get('AGENT_BROWSER') or shutil.which('agent-browser');
if not B:raise SystemExit('Set AGENT_BROWSER')
rows=[];O=Path(os.environ.get('MIRAR_G3_DIR','/tmp/mirar-g3-validation'));O.mkdir(exist_ok=True)
def run(*a):return subprocess.check_output([B,'--session',os.environ.get('MIRAR_G3_APP_SESSION','mirar-g3-final-app'),'--pin-tab',*a],text=True).strip()
def click(n,role='button'):run('find','role',role,'click','--name',n,'--exact')
def has(t):assert t in run('snapshot'),t
def audit(n,w):
 run('wait','400');run('eval',"document.querySelectorAll('div').forEach(e=>{if(e.scrollHeight>e.clientHeight&&getComputedStyle(e).overflowY==='auto')e.scrollTop=0})")
 d=json.loads(run('a11y','--json'))['data'];assert not d['counts']['violations'] and not d['counts']['incomplete'],(n,d)
 rows.append({'label':n,'width':w,'axe':d['counts']})
for w,h in [(320,568),(390,844),(768,1024),(1024,768),(1440,900)]:
 run('set','viewport',str(w),str(h));run('open',os.environ.get('MIRAR_G3_APP_URL','http://127.0.0.1:5200/'));run('wait','--text','Manage practice history');audit('actual-today',w)
 click('Me','tab');audit('actual-me-direct-signout',w);click('Sign out');run('wait','--text','Signing out removes your practice');audit('actual-signout-deeplink',w);click('Cancel');run('wait','--text','Check for a backed-up copy');audit('actual-history-no-auto-check',w)
 click('Check for a backed-up copy');run('wait','300');has('Only on this device');audit('actual-explicit-check',w)
 run('open',os.environ.get('MIRAR_G3_APP_URL','http://127.0.0.1:5200/'));run('wait','--text','Manage practice history');click('The Mirror','tab');audit('actual-mirror',w)
 if w in [320,390]:run('screenshot',str(O/f'app-mirror-{w}.png'))
 print('PASS actual app',w,flush=True)
click('Me','tab');click('Sign out');click('Sign out');run('wait','800');snap=run('snapshot');assert 'WHERE PRACTICE LIVES' not in snap and 'Last confirmed backup:' not in snap,snap
rows.append({'label':'signed-out-no-prior-continuity-ui','passed':True})
(O/'app-results.json').write_text(json.dumps(rows,indent=2)+'\n');print('PASS actual app routes/sign-out')
