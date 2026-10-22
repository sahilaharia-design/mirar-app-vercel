// Presentation invariants against the actual, unchanged Attend session.
const assert = require('node:assert/strict'), fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async () => {
 const browser = await chromium.launch({headless:true, executablePath:process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 const out=process.env.PRACTICE_EVIDENCE || '/tmp/mirar-guided-evidence'; fs.mkdirSync(out,{recursive:true});
 const rows=[];
 for (const [width,height] of [[320,568],[390,844],[768,1024],[1024,768],[1440,900]]) {
  const context=await browser.newContext({viewport:{width,height},hasTouch:true,reducedMotion:'reduce'}), p=await context.newPage();
  const external=[]; p.on('request',r=>{if(new URL(r.url()).origin !== new URL(root()).origin) external.push(r.url());});
  function root(){return process.env.PRACTICE_URL || 'http://127.0.0.1:5193';}
  const b=n=>p.getByRole('button',{name:n,exact:true});
  const step=()=>p.locator('.guided-step').getAttribute('data-step');
  const start=async()=>{await p.goto(root()+'/?practice=attention');await p.evaluate(()=>document.fonts.ready);};
  const choose=async n=>{const before=await step();await b(n).tap();assert.equal(await step(),before,'selection must not advance');assert.equal(await p.locator('.guided-commit').count(),1);await b('Continue').tap();};
  const key=async n=>{for(let i=0;i<90;i++){await p.keyboard.press('Tab');if(await b(n).evaluate(e=>e===document.activeElement)) {const g=await b(n).evaluate(e=>{const r=e.getBoundingClientRect(), x=Math.max(0,Math.min(innerWidth-1,r.left+r.width/2)),y=Math.max(0,Math.min(innerHeight-1,r.top+r.height/2));return {visible:r.top>=0&&r.bottom<=innerHeight,uncovered:e.contains(document.elementFromPoint(x,y))||e===document.elementFromPoint(x,y),outline:getComputedStyle(e).outlineStyle};});assert(g.visible&&g.uncovered,JSON.stringify({width,n,g}));assert.notEqual(g.outline,'none');await p.keyboard.press('Enter');return;}}throw Error('Keyboard unreachable '+n);};
  await start(); assert.equal(await p.locator('.guided-commit').count(),0); assert.equal(await p.locator('.window').count(),0);
  await p.screenshot({path:out+'/guided-entry-'+width+'.png',fullPage:true});
  await b('A work task').tap();await b('My phone or feeds').tap();assert.equal(await step(),'pulls');
  await p.screenshot({path:out+'/guided-selected-'+width+'.png',fullPage:false});
  await b('Continue').tap();assert.equal(await step(),'place:work');
  await choose('Attend to it now');assert.equal(await step(),'place:phone');assert(await b('Attend to it now').isDisabled());
  assert.equal(await p.locator('.guided-history').getAttribute('open'),null);
  await b('Leave it open').tap();assert.equal(await step(),'place:phone');await b('Back').tap();assert.equal(await step(),'place:work');
  assert.equal(await p.locator('[aria-pressed="true"]').count(),0,'Back must discard local draft');
  await choose('Leave it open');assert.equal(await step(),'place:phone');assert(!(await b('Attend to it now').isDisabled()));
  await choose('Attend to it now');assert.equal(await step(),'hold_offer');
  await choose('Stay with it now. I will say when I am ready.');assert.equal(await step(),'hold');assert.equal(await b('Back').count(),0);
  await p.screenshot({path:out+'/guided-hold-'+width+'.png',fullPage:true});await p.waitForTimeout(800);assert.equal(await step(),'hold','No auto-transition');
  await key('I am ready');assert.equal(await step(),'sit');assert.notEqual(await p.locator('.guided-history').getAttribute('open'),null);
  await choose('Mixed');assert.equal(await step(),'rearrange');await choose('Rearrange it');assert.equal(await step(),'place:work');
  await choose('Do nothing with it for now');await choose('Set it aside for now');assert.equal(await step(),'when:phone');assert.equal(await b('I don’t know').count(),0);
  await choose('No time set');assert.equal(await step(),'sit');await choose('Mixed');assert.equal(await p.locator('.closing').count(),1,'Only one rearrangement');
  await p.screenshot({path:out+'/guided-closing-'+width+'.png',fullPage:true});
  // Keyboard-only unknown path, including explicit submission and a changed pending choice.
  await start();await key('A work task');assert.equal(await step(),'pulls');await key('Continue');await key('Leave it open');assert.equal(await step(),'place:work');await key('I don’t know');await key('Continue');await key('I don’t know');await key('Continue');assert((await p.locator('.closing').innerText()).includes('Nothing has been placed'));
  await start();await key('I don’t know');assert.equal(await step(),'pulls');await key('Continue');assert((await p.locator('.closing').innerText()).includes('No placement is claimed'));
  await start();await choose('Nothing is pulling at me right now');assert((await p.locator('.closing').innerText()).includes('Nothing needs arranging'));
  // Keyboard Back + hold + voluntary exit; no completion claim.
  await start();await key('A work task');await key('Continue');await key('Back');assert.equal(await step(),'pulls');await key('A need to rest');await key('Continue');await key('Attend to it now');await key('Continue');await key('Stay with it now. I will say when I am ready.');await key('Continue');assert.equal(await step(),'hold');await key('Not now');assert.equal(await p.locator('h1').innerText(),'Another time is fine.');assert((await p.locator('main').innerText()).includes('counted as a completed')); 
  await start();await key('A work task');await key('Not now');assert.equal(await p.locator('h1').innerText(),'Another time is fine.');
  const state=await p.evaluate(async()=>({local:localStorage.length,session:sessionStorage.length,db:(await indexedDB.databases()).length,caches:(await caches.keys()).length,workers:(await navigator.serviceWorker.getRegistrations()).length,overflow:document.documentElement.scrollWidth>innerWidth}));
  assert(Object.values(state).every(v=>v===0||v===false));assert.deepEqual(external,[]);
  rows.push({width,height,explicitSubmission:true,noSilentReassignment:true,backDiscardsDraft:true,holdSelfEnded:true,noAutomaticTransition:true,rearrangeOnce:true,setAsideExactOptions:true,keyboardUnknownBackHoldExit:true,noneAndUnknownTruthful:true,focusedControlsUncovered:true,storage:state,externalRequests:external});
  await context.close();console.log('PASS guided '+width);
 }
 fs.writeFileSync(out+'/guided-results.json',JSON.stringify(rows,null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
