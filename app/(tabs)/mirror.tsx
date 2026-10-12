import React,{useCallback} from 'react';
import {router,useFocusEffect} from 'expo-router';
import {useAuthStore} from '../../stores/auth-store';
import {SafeAreaView} from 'react-native-safe-area-context';
import {InertWhenBlurred} from '../../components/ui/InertWhenBlurred';
import {MirrorExperience} from '../../components/experience/MirrorExperience';
import {useInnerRepV2Store} from '../../stores/inner-rep-v2-store';
import {MIRAR as M} from '../../design-system/native';
export default function Mirror(){const {today,practiceDays,mirror,load}=useInnerRepV2Store();const userId=useAuthStore(s=>s.session?.user?.id);useFocusEffect(useCallback(()=>{if(userId)void load(userId);},[userId,load]));return <InertWhenBlurred><MirrorExperience practiceDays={practiceDays} exercised={mirror.capacities} carrying={mirror.carrying} commitment={today?.kind==='rep'?today.context.commitment:undefined} onToday={()=>router.navigate('/(tabs)/')}/></InertWhenBlurred>;}
