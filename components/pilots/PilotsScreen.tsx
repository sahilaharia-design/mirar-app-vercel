import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../stores/auth-store';
import { usePilotStore } from '../../stores/pilot-store';
import { Action, Body, Eyebrow } from '../inner-rep/v2/Foundation';
import { ExperiencePage, X } from '../experience/ExperienceKit';
import { buildPilotMirror, pilotOffers } from '../../lib/innerRep/pilots/read';
import { PilotPractice } from './PilotPractice';
import type { PilotId } from '../../lib/innerRep/pilots/types';
const fixtures: typeof import('../../scripts/runtime/pilot-fixtures') | null = process.env.EXPO_PUBLIC_PILOTS === '1' && process.env.EXPO_PUBLIC_REVIEW_STATES === '1' ? require('../../scripts/runtime/pilot-fixtures') : null; // fixtures need BOTH flags: a real-auth staging build never carries them
export default function PilotsScreen() {
 const userId=useAuthStore(s=>s.session?.user?.id);const st=usePilotStore();void st.tick;
 const {pilot}=useLocalSearchParams<{pilot?:string}>();const [loaded,setLoaded]=useState(false);const [failed,setFailed]=useState(false);const [fx,setFx]=useState(false);
 const load=async()=>{if(!userId)return;setFailed(false);try{await st.load(userId);setLoaded(true);}catch{setFailed(true);}};
 useEffect(()=>{void load();},[userId]);
 const onToday=()=>router.replace('/(tabs)');
 if(!loaded)return <ExperiencePage><Body role={failed?'alert':'status'}>{failed?'Couldn’t open your practice.':'Opening practice…'}</Body>{failed&&<Action onPress={()=>void load()}>Try again</Action>}<Action secondary onPress={onToday}>Back to Today</Action></ExperiencePage>;
 const records=st.records(),today=st.today();
 return <PilotPractice initialPilot={pilot==='attend'||pilot==='look_again'?pilot as PilotId:undefined} onToday={onToday} port={{session:st.session(),offers:pilotOffers(records,today,st.resumable()?.pilot??null),mirror:buildPilotMirror(records,today),start:st.start,answer:st.answer,back:st.back,close:st.close,discard:st.discard}} reviewTools={<View style={X.rule}><Eyebrow>Review tools · staging only</Eyebrow>{fx&&<Body>FIXTURE DATA: generated for review, not your practice.</Body>}<View style={X.row}>{fixtures&&<Action secondary onPress={()=>{void st.replaceRecords(fixtures.buildFixtures(today)).then(()=>setFx(true));}}>Load fixture history</Action>}<Action secondary onPress={()=>{void st.clearAll().then(()=>setFx(false));}}>Clear pilot data</Action></View></View>}/>;
}
