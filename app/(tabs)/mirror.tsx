import React,{useCallback} from 'react';
import {router,useFocusEffect} from 'expo-router';
import {useAuthStore} from '../../stores/auth-store';
import {InertWhenBlurred} from '../../components/ui/InertWhenBlurred';
import {MirrorExperience} from '../../components/experience/MirrorExperience';
import {useInnerRepV2Store} from '../../stores/inner-rep-v2-store';
const PilotMirrorHost: React.ComponentType | null = process.env.EXPO_PUBLIC_PILOTS === '1' ? require('../../components/pilots/PilotHosts').PilotMirrorHost : null;
const ContinuityMirrorHost: React.ComponentType | null = process.env.EXPO_PUBLIC_HISTORY_SYNC === '1' ? require('../../components/continuity/ContinuityHosts').ContinuityMirrorHost : null;
const useContinuityNotice: () => string | undefined = process.env.EXPO_PUBLIC_HISTORY_SYNC === '1' ? require('../../components/continuity/ContinuityHosts').useContinuityNotice : () => undefined;
export default function Mirror(){const continuityNotice=useContinuityNotice();const {practiceDays,mirror,load}=useInnerRepV2Store();const userId=useAuthStore(s=>s.session?.user?.id);useFocusEffect(useCallback(()=>{if(userId)void load(userId);},[userId,load]));return <InertWhenBlurred><MirrorExperience pilotPlane={PilotMirrorHost ? <PilotMirrorHost /> : undefined} continuity={ContinuityMirrorHost ? <ContinuityMirrorHost /> : undefined} privacyNotice={continuityNotice} model={mirror} readingHistory="approved" practiceDays={practiceDays} onToday={()=>router.navigate('/(tabs)/')}/></InertWhenBlurred>;}
