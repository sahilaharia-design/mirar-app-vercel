import { createLocalStore, scrub, LOCAL_PREFIX } from '../lib/innerRep/local-store';
const m = new Map<string,string>();
const kv = { getItem: async (k:string)=>m.get(k)??null, setItem: async (k:string,v:string)=>{m.set(k,v)}, removeItem: async (k:string)=>{m.delete(k)}, getAllKeys: async ()=>[...m.keys()] };
const s = createLocalStore(kv);
let f=0; const ok=(c:boolean,x:string)=>{ if(!c){f++;console.log('FAIL',x)} else console.log('ok  ',x)};
const rec=(w?:string)=>({exerciseId:'rel_appreciation',capacity:'relationships',subCapacity:'appreciation',interactionType:'words',intensity:'light',answer:{words:w,unknown:false},completedAt:new Date().toISOString()}) as any;
(async()=>{
  await s.write('A',[rec('worried about my father')],[]);
  ok(![...m.values()].some(v=>v.includes('father')),'free text never written to storage');
  m.set(LOCAL_PREFIX, JSON.stringify({records:[rec('legacy secret')],pending:[]}));      // legacy unkeyed key from old build
  m.set(LOCAL_PREFIX+':A', JSON.stringify({records:[rec('older build secret')],pending:[]})); // old per-user data containing words
  const r=await s.read('A'); ok(!JSON.stringify(r).includes('secret'),'text from older builds scrubbed on read');
  await s.write('B',[rec()],[]);
  ok((await s.read('B')).records.length===1 && (await s.read('A')).records.length===1,'users separated');
  m.set('other_key','keep');
  await s.clearAll();
  ok(![...m.keys()].some(k=>k.startsWith(LOCAL_PREFIX)),'sign-out clears all inner-rep keys incl. legacy');
  ok(m.get('other_key')==='keep','unrelated keys untouched');
  const many=Array.from({length:250},(_,i)=>({...rec(),completedAt:new Date(2026,0,1+i%28,0,i).toISOString(),exerciseId:'x'+i}));
  await s.write('A',many,[]); ok((await s.read('A')).records[0].exerciseId==='x0','keeps newest-first slice');
  console.log(f?'FAILED '+f:'ALL PASS');
})();
