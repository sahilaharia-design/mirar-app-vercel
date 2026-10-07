import React from 'react';
import {router} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import {InertWhenBlurred} from '../../components/ui/InertWhenBlurred';
import {MirrorExperience} from '../../components/experience/MirrorExperience';
import {useInnerRepV2Store} from '../../stores/inner-rep-v2-store';
import {MIRAR as M} from '../../design-system/native';
export default function Mirror(){const {today,practiceDays}=useInnerRepV2Store();return <InertWhenBlurred><MirrorExperience practiceDays={practiceDays} commitment={today?.kind==='rep'?today.context.commitment:undefined} onToday={()=>router.navigate('/(tabs)/')}/></InertWhenBlurred>;}
