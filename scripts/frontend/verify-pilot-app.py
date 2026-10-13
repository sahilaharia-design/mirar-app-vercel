"""Expo staging shell: real route hosts and device-local PilotStore, mock auth only."""
import os,json,subprocess,atexit
from pathlib import Path
B=os.environ.get('AGENT_BROWSER_BIN','/private/tmp/mirar-npm-cache/_npx/6de2aa2fded2970c/node_modules/agent-browser/bin/agent-browser-darwin-arm64');base=os.environ.get('MIRAR_PILOT_APP','http://127.0.0.1:5191')
root=Path(__file__).resolve().parents[2]/'docs/experience/pilot-integration-validation';rows=[]
atexit.register(lambda:(root/'app-results.json').write_text(json.dumps(rows,indent=2)+'\n'))
def run(*a):return subprocess.check_output([B,'--session','mirar-pilot-expo-qa','--pin-tab',*a],text=True).strip()
def js(s):return json.loads(run('eval',s))
def click(s,role='button'):run('find','role',role,'click','--name',s,'--exact');run('wait','100')
def snap(n):
 data=js("({overflow:document.documentElement.scrollWidth>innerWidth,small:[...document.querySelectorAll('[role=button],button,input,textarea')].filter(e=>e.getBoundingClientRect().height>0).filter(e=>e.getBoundingClientRect().height<43.9).map(e=>e.textContent)})");assert not data['overflow'] and not data['small'],(n,data)
 a=json.loads(run('a11y','--json'))['data'];assert not a['violations'] and not a['incomplete'],(n,a);rows.append({'screen':n,'geometry':data,'axe':a});run('screenshot',str(root/'screenshots'/f'app-{n}.png'))
for w,h in [(320,568),(390,844),(768,1024),(1024,768),(1440,900)]:
 run('set','viewport',str(w),str(h));run('open',base+'/pilots');run('wait','--text','More than one way to look.');click('Clear pilot data');snap('hub-'+str(w))
 js("window.__engineBefore=JSON.stringify(Object.entries(localStorage).filter(([k])=>k.includes('mirar_inner_rep_v2')))")
 click('Begin Look Again');click('I don’t know');click('Skip');click('I don’t know');click('I don’t know');run('wait','--text','A practice, held here.');snap('look-receipt-'+str(w));click('Back to Today');run('wait','--text','Begin Attend');snap('today-'+str(w))
 click('Begin Attend');click('A message or notification waiting');click('A work task');click('A need to rest');click('Continue');click('Attend to it now');snap('one-attend-'+str(w));click('Set it aside for now');click('No time set');click('Leave it open');click('I will go to it after this');click('Settled');run('wait','--text','A practice, held here.');snap('attend-receipt-'+str(w));click('Back to Today');click('The Mirror','tab');run('wait','--text','Another plane of the Mirror.');snap('mirror-'+str(w));assert js("window.__engineBefore===JSON.stringify(Object.entries(localStorage).filter(([k])=>k.includes('mirar_inner_rep_v2')))");rows.append({'viewport':w,'engineUnchangedByPilots':True})
# True browser reload: structured draft survives, local words do not.
run('open',base+'/pilots');run('wait','--text','More than one way to look.');click('Clear pilot data');click('Begin Look Again');click('Someone has not replied');run('find','role','textbox','fill','--name','Write what happened the way a camera would record it: only what could be seen or heard.','--exact','App-only private words: a message arrived.');click('Continue');click('Yes, as written');click('They are ignoring me on purpose');run('open',base+'/pilots');run('wait','--text','Resume Look Again');click('Resume Look Again');assert 'App-only private words' not in js('document.body.textContent');assert 'Earlier words were not restored.' in js('document.body.textContent');assert js("!JSON.stringify(Object.entries(localStorage).filter(([k])=>k.includes('mirar_pilots'))).includes('App-only private words')");snap('real-reload');click('Leave');run('wait','--text','Where you stopped.');snap('left-after-reload')
assert not run('errors'),run('errors');rows.append({'realDeviceLocalReload':True,'wordsNeverStored':True,'browserErrors':[]});print('Expo pilot QA complete',len(rows),flush=True)
