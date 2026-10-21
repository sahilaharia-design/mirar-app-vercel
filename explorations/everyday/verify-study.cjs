/* Additional study-preparation checks; no participant data or account is used. */
const assert=require('node:assert/strict'),fs=require('node:fs');
const axe=fs.readFileSync(process.env.AXE_PATH||require.resolve('axe-core/axe.min.js'),'utf8');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 const c=await browser.newContext({hasTouch:true,reducedMotion:'reduce'}),p=await c.newPage();const rows=[],audits=[];
 const root=process.env.PRACTICE_URL||'http://127.0.0.1:5193',out=process.env.PRACTICE_EVIDENCE||'/tmp/mirar-study-evidence';
 async function audit(label){await p.addScriptTag({content:axe});const r=await p.evaluate(async()=>{const x=await axe.run();return {violations:x.violations.map(v=>v.id),incomplete:x.incomplete.map(v=>v.id)}});assert.deepEqual(r.violations,[]);assert(r.incomplete.every(x=>x==='color-contrast'));audits.push({label,viewport:p.viewportSize(),...r});}
 const b=n=>p.getByRole('button',{name:n,exact:true});
 const tap=async n=>b(n).tap();
 for(const [width,height] of [[320,568],[390,844],[768,1024],[1024,768],[1440,900]]){
  await p.setViewportSize({width,height});await p.goto(root+'/?practice=attention');await p.evaluate(()=>document.fonts.ready);
  assert.equal(await p.locator('main').getAttribute('data-source'),'pilot');assert.equal(await p.locator('main').getAttribute('data-scope'),'own_life');assert.equal(await p.locator('input,textarea').count(),0);
  assert(!(await p.locator('main').innerText()).includes('made-up'));assert((await p.locator('main').innerText()).includes('your own attention'));
  for(const n of ['A message or notification waiting','A work task','My phone or feeds','Something I want to do','A need to rest'])await tap(n);
  assert(await b('A worry about later').isDisabled());await tap('Give these a place');
  await tap('Attend to it now');assert(await b('Attend to it now').isDisabled());assert((await p.locator('main').innerText()).includes('Only one thing'));
  const geometry=await p.locator('.workbench').evaluate(e=>{const r=e.getBoundingClientRect();const scene=document.querySelector('.attention-grid .scene').getBoundingClientRect();return {controlsBeforeGraphic:r.top<=scene.top||r.left<scene.left,overflow:document.documentElement.scrollWidth>innerWidth}});assert(geometry.controlsBeforeGraphic);assert(!geometry.overflow);
  await audit('repeated-placement');await p.screenshot({path:out+'/attention-repeat-'+width+'.png',fullPage:false});
  await tap('Set it aside for now');await tap('No time set');await tap('Leave it open');await tap('Do nothing with it for now');await tap('I don’t know');await tap('I will go to it after this');await tap('I don’t know');assert((await p.locator('.closing').innerText()).includes('4 of 5'));
  await p.getByRole('link',{name:'Support',exact:true}).click();await p.getByText('Support, if you need it',{exact:true}).click();assert(await p.getByRole('link',{name:'14416',exact:true}).isVisible());await audit('support-expanded');
  rows.push({width,maxFive:true,secondForegroundRefused:true,allDispositions:true,unknownNotPlaced:true,controlsBeforeGraphic:true,supportReachable:true});
 }
 for(const id of ['message','reply']){await p.goto(root+'/?practice='+id);assert.equal(await p.locator('main').getAttribute('data-source'),'prototype');assert.equal(await p.locator('main').getAttribute('data-scope'),'fictional');}
 await p.goto(root+'/?practice=message');await tap('They’re annoyed.');await tap('Keep my first reading');assert((await p.locator('.closing').innerText()).includes('without comparing another one'));await p.reload();assert.equal(await b('They’re annoyed.').count(),1);
 await p.goto(root+'/?practice=attention');await tap('A work task');await tap('Give these a place');await tap('I don’t know');await tap('I don’t know');assert((await p.locator('.closing').innerText()).includes('Nothing has been placed'));assert(!(await p.locator('.closing').innerText()).includes('You gave the things'));
 const storage=await p.evaluate(async()=>({local:localStorage.length,session:sessionStorage.length,indexedDB:(await indexedDB.databases()).length,caches:(await caches.keys()).length,workers:(await navigator.serviceWorker.getRegistrations()).length}));assert(Object.values(storage).every(n=>n===0));
 fs.writeFileSync(out+'/study-results.json',JSON.stringify({viewports:rows,audits,storage,realPeopleTested:false,unknownClosing:true,messageNoComparisonClaim:true,reloadClears:true},null,2));console.log('PASS own-life labels, repeated placement, support, truthful unknown, no storage');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
