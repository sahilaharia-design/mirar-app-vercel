import React from 'react';
import {router} from 'expo-router';
import {PracticeIntroduction} from '../../components/experience/PracticeIntroduction';
export default function Introduction(){return <PracticeIntroduction onBegin={()=>router.replace('/(tabs)/')}/>;}
