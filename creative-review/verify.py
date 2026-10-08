"""Local creative-review QA. Run server first; AGENT_BROWSER_BIN may point to the executable."""
import os, shutil, subprocess, json, atexit
from pathlib import Path

B = os.environ.get('AGENT_BROWSER_BIN') or shutil.which('agent-browser')
if not B:
    raise SystemExit('Set AGENT_BROWSER_BIN to your installed agent-browser executable.')
BASE=os.environ.get('MIRAR_CREATIVE_URL','http://127.0.0.1:5176')
ROOT=Path(os.environ.get('MIRAR_QA_OUTPUT',str(Path(__file__).resolve().parents[1]/'docs/creative/validation')))
(ROOT/'screenshots').mkdir(parents=True,exist_ok=True)
results=json.loads((ROOT/'results.json').read_text()) if os.environ.get('MIRAR_QA_ONLY')=='motion' else []
atexit.register(lambda:(ROOT/'results.json').write_text(json.dumps(results,indent=2)+'\n'))
def run(*args):
    p=subprocess.run([B,'--session','mirar-creative-qa',*args],text=True,capture_output=True)
    if p.returncode:raise RuntimeError(str(args)+p.stderr+p.stdout)
    return p.stdout.strip()
def js(code):
    value=json.loads(run('eval',code))
    try:return json.loads(value) if isinstance(value,str) and value[:1] in ['{','['] else value
    except:return value

def click(label):
    run('find','role','button','click','--name',label,'--exact');run('wait','80')
def jump(selector):
    js('document.querySelector('+json.dumps(selector)+').scrollIntoView({block:"start"})')
def open_direction(d):
    run('open',BASE+('/?direction='+d if d else '/'));run('wait','h1');run('wait','250')
def capture(name,selector=None):
    if selector:jump(selector)
    run('screenshot',str(ROOT/'screenshots'/name))
    data=js('''JSON.stringify({overflow:document.documentElement.scrollWidth>innerWidth,targets:[...document.querySelectorAll('button,a,select,summary,[role=button]')].filter(e=>e.getBoundingClientRect().height>0&&getComputedStyle(e).visibility!=='hidden'&&!e.classList.contains('skip-link')).map(e=>({name:e.getAttribute('aria-label')||e.textContent,height:e.getBoundingClientRect().height})),fonts:[...document.fonts].map(f=>({family:f.family,status:f.status})),storage:Object.keys(localStorage),remote:performance.getEntriesByType('resource').map(e=>e.name).filter(s=>s.startsWith('http')&&new URL(s).origin!==location.origin)})''')
    results.append({'screen':name,'geometry':data})
    assert not data['overflow'],name+' overflow'
    assert all(t['height']>=43.9 for t in data['targets']),name+' small target '+str([t for t in data['targets'] if t['height']<43.9])
    assert not data['storage'],name+' unexpected storage'
    assert not data['remote'],name+' unexpected remote resource'
    for family in ['DM Sans','Instrument Serif']:
        assert any(f['family'].strip('"')==family and f['status']=='loaded' for f in data['fonts'])
def audit(name):
    result=json.loads(run('a11y','--json'))['data'];results.append({'a11y':name,'counts':result['counts'],'violations':result['violations'],'incomplete':result['incomplete']})
    assert not result['violations'],name+' '+str(result['violations'])
def select_choice(label):
    click(label)
    js("[...document.querySelectorAll('button')].find(b=>b.textContent.startsWith('Continue')).focus()")
    run('press','Enter');run('wait','100')
def set_date(value):
    # Browser-native date controls do not accept the text-fill helper consistently.
    js("(()=>{const e=document.querySelector('input[type=date]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,"+json.dumps(value)+");e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));})()")
    run('wait','80')
def mirror_click(label):
    js("(()=>{const e=[...document.querySelectorAll('.inference-leaf button,.inference-leaf [role=button]')].find(e=>e.textContent.trim()==="+json.dumps(label)+");if(!e)throw new Error('Missing mirror control');e.focus()})()")
    run('press','Enter');run('wait','100')
def mirror_study():
    click('Illustrative future view');jump('.mirror-study')

if os.environ.get('MIRAR_QA_ONLY')!='motion':
    a=run('close');run('set','media','reduced-motion')
    for w,h in [(320,568),(390,844),(768,1024),(1024,768),(1440,900)]:
        run('set','viewport',str(w),str(h))
        for d in ['aperture','weave','field']:
            open_direction(d);capture(f'{d}-hero-{w}.png');audit(f'{d}-landing-{w}')
            jump('#practice');click('Begin sample');capture(f'{d}-rep-{w}.png');audit(f'{d}-rep-{w}')
            select_choice('I could settle into one thing.')
            assert 'sample complete' in js('document.body.textContent')
            assert 'I could settle into one thing.' in js("document.querySelector('.receipt').textContent")
            if w in [390,1440]:
                capture(f'{d}-integration-{w}.png','.integration');audit(f'{d}-integration-{w}')
                jump('#story');buttons=js("JSON.stringify([...document.querySelectorAll('.story-control')].map(b=>b.querySelector('span:nth-child(2)').textContent))")
                click(buttons[1]);capture(f'{d}-story-{w}.png','#story')
                mirror_study();capture(f'{d}-mirror-{w}.png','.mirror-study');audit(f'{d}-mirror-{w}')
                click('Turn the observation over');capture(f'{d}-observation-limit-{w}.png','.observation-leaf')
            else:
                mirror_study();capture(f'{d}-mirror-{w}.png','.mirror-study');audit(f'{d}-mirror-{w}')
    # Test routes that are meaningful to each creative direction, not just hero screenshots.
    run('set','viewport','390','844')
    for d in ['aperture','weave','field']:
        open_direction(d);jump('#practice');click('Begin sample');select_choice("I don't know")
        assert 'You left room for not knowing.' in js("document.querySelector('.receipt').textContent")
        capture(f'{d}-unknown.png','.integration')
        click('Back to Today');assert 'Begin sample' in js("document.querySelector('#practice').textContent")
        run('select','#sample-select','action');click('Begin sample')
        label=js("document.querySelector('.choice>span:not(.choice-state)').textContent")
        select_choice(label)
        assert 'Pick a date' in js("document.querySelector('#practice').textContent")
        click('Pick a date');set_date('2000-01-01')
        assert js("document.querySelector('input[type=date]').value")== '2000-01-01'
        assert js("[...document.querySelectorAll('[role=button]')].find(e=>e.textContent==='Use this date').getAttribute('aria-disabled')")=='true'
        date=js("(()=>{let d=new Date();d.setDate(d.getDate()+2);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')})()")
        set_date(date);capture(f'{d}-date.png','#practice');audit(f'{d}-date');click('Use this date')
        assert date in js("document.querySelector('.receipt').textContent")
        run('select','#sample-select','commitment');click('Begin sample')
        assert 'Reach out to a friend' in js("document.querySelector('.active-rep').textContent")
        capture(f'{d}-commitment.png','#practice');audit(f'{d}-commitment')
        # Every feedback outcome and structured correction remains equal/available.
        mirror_study()
        for reason in ["The situation is right, but what it means isn't","It matters, but not as much as that sounds",'Something important is missing',"That was true, but it has changed",'Something else',"I'd rather not say"]:
            click('Reset reflection demo');mirror_click('Partly');mirror_click("What's off?");mirror_click(reason)
            if reason=='Something else':
                assert 'Optional. Not saved in this version.' in js("document.querySelector('.inference-leaf').textContent")
                run('fill','textarea','A local review note');capture(f'{d}-optional-note.png','.inference-leaf');audit(f'{d}-optional-note');mirror_click('Continue')
                assert 'A local review note' not in js('document.body.textContent')
            results.append({'direction':d,'correction':reason,'passed':True})
        for feedback in ['Accurate','No','Not sure']:
            click('Reset reflection demo');mirror_click(feedback);assert 'Noted.' in js("document.querySelector('.inference-leaf').textContent")
            results.append({'direction':d,'feedback':feedback,'passed':True})
        click('Reset reflection demo');mirror_click('Why am I seeing this?');assert '5 independent observations' in js("document.querySelector('.inference-leaf').textContent")
        mirror_click('Partly');mirror_click("What's off?");mirror_click('Something else');run('fill','textarea','I want to kill myself');mirror_click('Continue')
        assert '14416' in js("document.querySelector('.inference-leaf').textContent")
        capture(f'{d}-safety.png','.inference-leaf')
        assert 'I want to kill myself' not in js('document.body.textContent')
        results.append({'direction':d,'safetyClearsNote':True})
    # Gallery, keyboard-only entrance and motion boundary.
    open_direction(None);capture('gallery-mobile.png');audit('gallery-mobile')
    run('set','viewport','1440','900');capture('gallery-desktop.png');audit('gallery-desktop')

open_direction('aperture');run('press','Tab');assert js('document.activeElement.textContent')=='Skip to content'
run('press','Enter');assert js('location.hash')=='#main'
run('set','media','reduced-motion')
reduced=js("getComputedStyle(document.querySelector('.attention-line')).transitionDuration")
assert reduced=='0s',reduced
results.append({'reducedMotionTransition':reduced,'keyboardSkipLink':True})
for d in ['aperture','weave','field']:
    open_direction(d);run('set','media','reduced-motion');click('Begin sample')
    value=js("JSON.stringify({preference:matchMedia('(prefers-reduced-motion:reduce)').matches,transition:getComputedStyle(document.querySelector('.story-art svg path')).transitionDuration,animation:getComputedStyle(document.querySelector('.active-rep')).animationName})")
    assert value=={'preference':True,'transition':'0s','animation':'none'},value
    results.append({'direction':d,'reducedMotion':value});capture(f'{d}-reduced-motion.png','#practice');audit(f'{d}-reduced-motion')
open_direction('field');run('set','media','light');assert not js("matchMedia('(prefers-reduced-motion:reduce)').matches");click('Begin sample');capture('field-standard-motion.png','#practice');audit('field-standard-motion')
errors=run('errors');assert not errors,errors
results.append({'browserErrors':errors})
print('Creative QA complete:',len(results),'records')
