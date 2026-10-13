import React,{useCallback} from 'react';
import {router,useFocusEffect} from 'expo-router';
import {useAuthStore} from '../../stores/auth-store';
import {InertWhenBlurred} from '../../components/ui/InertWhenBlurred';
import {MirrorExperience} from '../../components/experience/MirrorExperience';
import {useInnerRepV2Store} from '../../stores/inner-rep-v2-store';
// Staging only: the pilot Mirror is a separate evidence source. The direct env comparison is inlined at build time, so Production contains none of it.
const PilotMirrorSection: React.ComponentType | null = process.env.EXPO_PUBLIC_PILOTS === '1' ? require('../../components/pilots/PilotMirrorSection').default : null;
export default function Mirror(){const {practiceDays,mirror,load}=useInnerRepV2Store();const userId=useAuthStore(s=>s.session?.user?.id);useFocusEffect(useCallback(()=>{if(userId)void load(userId);},[userId,load]));return <InertWhenBlurred><MirrorExperience model={mirror} readingHistory="approved" practiceDays={practiceDays} onToday={()=>router.navigate('/(tabs)/')}>{PilotMirrorSection ? <PilotMirrorSection/> : null}</MirrorExperience></InertWhenBlurred>;}
