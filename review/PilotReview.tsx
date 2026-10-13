// Review only. The real pilot runtime runs against memory KV. No account, device storage or engine writes.
import { useEffect, useState } from 'react';
import { PilotStore } from '../lib/innerRep/pilots/store';
import { buildPilotMirror, pilotOffers } from '../lib/innerRep/pilots/read';
import type { PilotPort } from '../components/pilots/PilotPractice';
import { buildFixtures } from '../scripts/runtime/pilot-fixtures';
function adapter(){const entries=new Map<string,string>();const core=new PilotStore({storage:{getItem:async k=>entries.get(k)??null,setItem:async(k,v)=>{entries.set(k,v);},removeItem:async k=>{entries.delete(k);},getAllKeys:async()=>[...entries.keys()]}});return {entries,core};}
export function useReviewPilots(){
 const [{entries,core}]=useState(adapter);const [tick,setTick]=useState(0);const [ready,setReady]=useState(false);const [generation,setGeneration]=useState(0);const [fixture,setFixture]=useState(false);
 const bump=()=>setTick(n=>n+1);
 useEffect(()=>{void core.init('review-only').then(()=>{setReady(true);bump();});},[core]);
 const today=core.context().today;
 const port:PilotPort={session:core.session(),offers:pilotOffers(core.records(),today,core.resumable()?.pilot??null),mirror:buildPilotMirror(core.records(),today),start:id=>{core.start(id);bump();},answer:async a=>{core.session()?.answer(a);await core.saveDraft();bump();},back:async()=>{core.session()?.back();await core.saveDraft();bump();},close:async how=>{const record=await core.close(how);bump();return record;},discard:async()=>{await core.discard();bump();}};
 useEffect(()=>{(window as unknown as {pilotReviewAudit:unknown}).pilotReviewAudit={step:()=>core.session()?.step()??null,snapshot:()=>core.session()?.snapshot()??null,records:()=>core.records(),storage:()=>[...entries.values()].map(x=>JSON.parse(x)),mirror:()=>buildPilotMirror(core.records(),core.context().today)};},[core,entries,tick]);
 return {ready,port,fixture,generation,reopen:async()=>{await core.init('review-only');setGeneration(n=>n+1);bump();},loadFixtures:async()=>{await core.replaceRecords(buildFixtures(today));setFixture(true);bump();},clear:async()=>{await core.clearAll();setFixture(false);bump();}};
}
