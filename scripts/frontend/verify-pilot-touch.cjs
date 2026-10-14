// Native touch events via local Chrome CDP. Run only against the isolated mock-auth Expo review origin.
const fs=require('fs');
const {execFileSync}=require('child_process');
const bin=process.env.AGENT_BROWSER_BIN||'/private/tmp/mirar-npm-cache/_npx/6de2aa2fded2970c/node_modules/agent-browser/bin/agent-browser-darwin-arm64';
const origin=process.env.MIRAR_PILOT_APP||'http://127.0.0.1:5191';
if(!origin.startsWith('http://127.0.0.1:'))throw Error('Touch test must use local isolated review.');
const endpoint=execFileSync(bin,['--session','mirar-pilot-expo-qa','--pin-tab','get','cdp-url'],{encoding:'utf8'}).trim();
(async()=>{
 const ws=new WebSocket(endpoint);await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
 let seq=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(Error(m.error.message));else p.resolve(m.result);}});
 const rpc=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});
 const {targetInfos}=await rpc('Target.getTargets');const target=targetInfos.find(t=>t.type==='page'&&t.url.startsWith(origin));if(!target)throw Error('Open the Expo test first.');
 const {sessionId}=await rpc('Target.attachToTarget',{targetId:target.targetId,flatten:true});
 const call=(m,p)=>rpc(m,p,sessionId);const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const evaluate=async expression=>(await call('Runtime.evaluate',{expression,returnByValue:true})).result.value;
 await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await call('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
 await call('Page.navigate',{url:origin+'/pilots'});
 for(let i=0;i<50;i++){if((await evaluate('document.body.textContent')).includes('More than one way to look.'))break;await pause(100);}
 const tap=async label=>{
  const rect=await evaluate(`(()=>{const e=[...document.querySelectorAll('[role=button]')].find(e=>(e.getAttribute('aria-label')===${JSON.stringify(label)}||e.textContent===${JSON.stringify(label)}));if(!e)throw Error('Button missing');e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[rect]});await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pause(120);
 };
 await tap('Clear pilot data');await tap('Begin Attend');
 for(const label of ['A message or notification waiting','A work task','Something someone asked of me','A need to rest'])await tap(label);
 await tap('Continue');await tap('Attend to it now');
 const before=await evaluate("JSON.stringify(Object.entries(localStorage).filter(([k])=>k.includes('mirar_pilots')))");
 await tap('Attend to it now');const after=await evaluate("JSON.stringify(Object.entries(localStorage).filter(([k])=>k.includes('mirar_pilots')))");if(before!==after)throw Error('Disabled touch changed a placement');
 await tap('Set it aside for now');await tap('No time set');await tap('Leave it open');await tap('Do nothing with it for now');await tap('I will go to it after this');await tap('Settled');
 const record=await evaluate("JSON.parse(Object.entries(localStorage).find(([k])=>k.includes('mirar_pilots'))[1]).records.at(-1)");
 if(record.status!=='completed'||record.facts.dispositions.length!==4||record.facts.dispositions.filter(x=>x.disposition==='attend_now').length!==1)throw Error('Touch arrangement mismatch');
 const result={viewport:[390,844],actualCDPTouchEvents:true,allFourDestinations:true,disabledSecondAttendNowRejected:true,completed:true,typedWordsUsed:false};
 fs.writeFileSync('docs/experience/pilot-integration-validation/touch-results.json',JSON.stringify(result,null,2)+'\n');console.log('Native touch allocation passed.');ws.close();
})().catch(e=>{console.error(e.message);process.exitCode=1;});
