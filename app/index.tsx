import React from 'react';
import {Redirect,router} from 'expo-router';
import {useAuthStore} from '../stores/auth-store';
import {DiscoverExperience} from '../components/experience/DiscoverExperience';
export default function Index(){const {session,isInitialized}=useAuthStore();if(isInitialized&&session)return <Redirect href="/(tabs)/"/>;return <DiscoverExperience onEnter={()=>router.push('/(auth)/login')} onPrivacy={()=>router.push('/privacy')}/>;}
