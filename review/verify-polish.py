# Local synthetic visual QA only. Start npm run visual:review first.
import subprocess,json,time,atexit,os
from pathlib import Path
B=os.environ.get('AGENT_BROWSER_BIN','agent-browser')
root=Path(__file__).resolve().parents[1]/'docs/visual/polish-v2.0.1'; (root/'screenshots').mkdir(parents=True,exist_ok=True); results=[]
atexit.register(lambda: (root/'ui-validation.json').write_text(json.dumps(results,indent=2)+'\n'))
def run(*args):
 p=subprocess.run([B,'--session','mirar-polish-qa',*args],text=True,capture_output=True)
 if p.returncode: raise RuntimeError(str(args)+p.stderr)
 return p.stdout.strip()
def js(code):
 raw=run('eval',code)
 try: value=json.loads(raw)
 except: return raw
 try: return json.loads(value) if isinstance(value,str) else value
 except: return value
def open_case(name='today',step=None):
 url='http://127.0.0.1:5174/?case='+name+(('&step='+step) if step else '')
 run('open',url);run('wait','[role=heading]');run('wait','200');run('snapshot','-i')
def click(label):
 run('find','role','button','click','--name',label,'--exact');run('snapshot','-i');run('wait','150')
def capture(name):
 run('screenshot',str(root/'screenshots'/name));
 if name.startswith(('correction-', 'optional-note-')):run('screenshot',str(root/'screenshots'/('full-'+name)),'--full')
 data=js("JSON.stringify({overflow:document.documentElement.scrollWidth>innerWidth,focus:document.activeElement?.textContent,targets:[...document.querySelectorAll('[role=button]')].map(e=>({height:e.getBoundingClientRect().height,label:e.textContent})),fonts:[...document.fonts].map(f=>({family:f.family,status:f.status}))})")
 results.append({'screen':name,'geometry':data})
 assert not data['overflow'],name
 assert all(item['height']>=44 for item in data['targets']),name
 for family in ['DM Sans','Instrument Serif']:
  assert any(f['family'].strip(chr(34))==family and f['status']=='loaded' for f in data['fonts'])
def audit(name):
 value=json.loads(run('a11y','--json')); assert value['data']['counts']['violations']==0, name; results.append({'a11y':name,'result':value['data']['counts'],'violations':value['data']['violations']})

run('close');run('set','media','reduced-motion')
for w,h in [(320,568),(390,844),(768,1024),(1024,768),(1440,900)]:
 run('set','viewport',str(w),str(h));open_case();capture(f'today-{w}.png');click('Begin');capture(f'primary-{w}.png');audit(f'primary-{w}')
 open_case('commitment');click('Begin');assert 'Reach out to a friend' in js("document.querySelector('[role=heading]').textContent");capture(f'commitment-{w}.png');audit(f'commitment-{w}')
 open_case('open');capture(f'no-capacity-today-{w}.png');click('Begin');assert js("document.querySelector('[role=heading]').textContent") is not None;capture(f'no-capacity-rep-{w}.png')
 open_case('mirror');capture(f'mirror-{w}.png');click('Partly');click("What's off?");capture(f'correction-{w}.png');assert js('document.activeElement.textContent')=="What's off?";audit(f'correction-{w}')
 click('Something else');capture(f'optional-note-{w}.png');audit(f'note-{w}');run('fill','textarea','synthetic private note');click('Continue');assert js('window.reviewAudit.correction')=='something_else';assert 'synthetic private' not in str(js('JSON.stringify(window.reviewAudit)'))
 open_case('timeframe','timeframe');click('Resume');capture(f'timeframe-{w}.png');click('Pick a date');capture(f'date-{w}.png');audit(f'date-{w}')
# Each correction reason is verbatim, ordered, equal and keyboard operable.
reasons=[("The situation is right, but what it means isn't",'situation_right_meaning_off'),('It matters, but not as much as that sounds','importance_overstated'),('Something important is missing','something_missing'),('That was true, but it has changed','changed_since'),('Something else','something_else'),("I'd rather not say",'prefer_not_to_say')]
for label,reason in reasons:
 open_case('mirror');click('Partly');click("What's off?");js("[...document.querySelectorAll('[role=button]')].find(e=>e.textContent==="+json.dumps(label)+").focus()");run('press','Enter');run('wait','300')
 if reason=='something_else': click('Skip')
 assert js('window.reviewAudit.correction')==reason;results.append({'correction':reason,'callback':js('JSON.stringify(window.reviewAudit)')})
for label,value in [('Accurate','accurate'),('No','no'),('Not sure','unsure')]:
 open_case('mirror');click(label);assert js('window.reviewAudit.feedback')==value;assert "What's off?" not in js("JSON.stringify([...document.querySelectorAll('[role=button]')].map(e=>e.textContent))")
open_case('mirror');click('Partly');click("What's off?");click('Skip');assert js('window.reviewAudit.correction') is None;results.append({'correctionSkip':js('JSON.stringify(window.reviewAudit)')})
# Safety note uses the existing detector and never reaches correction callback.
open_case('mirror');click('Partly');click("What's off?");click('Something else');run('fill','textarea','synthetic test: kill myself');click('Continue');assert js('window.reviewAudit.safety') is True;assert js('window.reviewAudit.correction') is None;capture('note-safety.png')
# Date min, invalid date guard, exact date response, no numeric offset.
open_case('timeframe','timeframe');click('Resume');click('Pick a date');tomorrow=js("document.querySelector('input[type=date]').min")
def set_date(value):
 js("(()=>{const e=document.querySelector('input[type=date]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,"+json.dumps(value)+");e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));})()")
 run('wait','100')
set_date('2020-01-01');assert js("[...document.querySelectorAll('[role=button]')].find(e=>e.textContent==='Use this date').getAttribute('aria-disabled')") is True
todayValue=js("(()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')})()");set_date(todayValue);assert js("[...document.querySelectorAll('[role=button]')].find(e=>e.textContent==='Use this date').disabled") is True
set_date(tomorrow);click('Use this date');assert js('window.reviewAudit.answers.at(-1).date')==tomorrow;assert js('window.reviewAudit.answers.at(-1).inDays') is None;results.append({'date':js('JSON.stringify(window.reviewAudit)')})
# Entry keyboard path and Back to Today is distinct from timeframe Today.
open_case();run('press','Tab');run('press','Enter');run('wait','400');assert js("document.activeElement.textContent")==js("document.querySelector('[role=heading]').textContent");run('press','Tab');results.append({'keyboardFocus':js("JSON.stringify({text:document.activeElement.textContent,outline:getComputedStyle(document.activeElement).outlineColor})")})
click('Back to Today');assert js("[...document.querySelectorAll('[role=button]')].some(e=>e.textContent==='Begin')") is True
# Full follow-up/context paths end in Mirror, correction, then Back to Today.
for name,step in [('followup','follow_up'),('context','capture_domain')]:
 open_case(name,step);click('Resume');capture(f'{name}.png');audit(name)
 for i in range(6):
  if js('window.reviewAudit.completed'):break
  options=js("JSON.stringify([...document.querySelectorAll('[role=button]')].map(e=>e.textContent))")
  label='Work' if 'Work' in options else 'No' if 'No' in options else next(t for t in options if t not in ['Back to Today',"I don't know"])
  click(label)
 assert js('window.reviewAudit.completed') is True;click('Partly');click("What's off?");click("I'd rather not say");click('Back to Today');capture(f'{name}-completed.png')
for label,value in [('Today','today'),('Tomorrow','tomorrow'),('This week','this_week'),('No deadline','none')]:
 open_case('timeframe','timeframe');click('Resume');click(label);assert js('window.reviewAudit.answers.at(-1).timeframe')==value;results.append({'timeframe':value,'callback':js('JSON.stringify(window.reviewAudit)')})
open_case('mirror');click('Partly');click("What's off?")
expected=["The situation is right, but what it means isn't",'It matters, but not as much as that sounds','Something important is missing','That was true, but it has changed','Something else',"I'd rather not say",'Skip']
actual=[]
for label in expected:
 run('press','Tab');actual.append(js('document.activeElement.textContent'))
assert actual==expected;results.append({'tabOrder':actual})
open_case('mirror');click('Partly');click("What's off?");click('Something else');run('press','Tab');assert js('document.activeElement.tagName')=='TEXTAREA';results.append({'noteKeyboard':'textarea reachable after focused heading'})

# Long canonical copy remains styled and wraps; synthetic DOM stress only.
run('set','viewport','320','568');open_case('mirror');click('Partly');click("What's off?");js("const e=document.querySelector('[role=group] [role=button]').firstElementChild;e.textContent+=' '+e.textContent");capture('long-reason-320.png')
open_case('commitment');click('Begin');js("const e=document.querySelector('[role=heading]');e.textContent+=' '+e.textContent");capture('long-commitment-320.png')
run('set','media','light');open_case('compare');click('Begin');run('wait','200');capture('standard-motion.png');errors=run('errors');assert not errors,errors;results.append({'runtimeErrors':errors})
print('Polish UI verification complete',len(results))
