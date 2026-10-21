const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=process.env.PRACTICE_URL||'http://127.0.0.1:5193';
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 const p=await browser.newPage({hasTouch:true,viewport:{width:390,height:844},reducedMotion:'reduce'});
 async function key(name){for(let i=0;i<100;i++){await p.keyboard.press('Tab');if(await p.getByRole('button',{name,exact:true}).evaluate(e=>e===document.activeElement)){assert.notEqual(await p.locator(':focus').evaluate(e=>getComputedStyle(e).outlineStyle),'none');await p.keyboard.press('Enter');return;}}throw Error('Not keyboard reachable: '+name)}
 const results=[];
 for(const [id,names] of [
  ['message',['They’re annoyed.','Another reading','The message doesn’t tell us.','Let another reading sit beside it']],
  ['attention',['A work task','Give these a place','Attend to it now','Stay with it now. I will say when I am ready.','I am ready','Settled']],
  ['reply',['I can help for half an hour.','I’ll need to leave after that.','Read the draft back','Keep this draft for the closing']]
 ]){await p.goto(root+'/?practice='+id);for(const n of names)await key(n);assert.equal(await p.locator('summary').count(),1);const visible=await p.locator('h1').evaluate(e=>{let r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight});assert(visible);results.push({concept:id,input:'keyboard-only',completed:true,focusVisible:true,closingHeadingInViewport:true});}
 await p.goto(root+'/?practice=message');for(const n of ['They’re happy with the change.','Another reading','They may be annoyed.','I don’t know — leave it open'])await p.getByRole('button',{name:n,exact:true}).tap();assert((await p.locator('h1').innerText()).includes('meaning can stay open'));results.push({concept:'message',input:'emulated-touch',completed:true});
 const out=process.env.PRACTICE_EVIDENCE||'/tmp/mirar-everyday-evidence';fs.writeFileSync(out+'/input-results.json',JSON.stringify(results,null,2));console.log('PASS keyboard-only full flow for all three; touch path');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
