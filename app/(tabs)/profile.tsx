import React from 'react';
import {Alert,Platform,Linking} from 'react-native';
import {router} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAuthStore} from '../../stores/auth-store';
import {InertWhenBlurred} from '../../components/ui/InertWhenBlurred';
import {MeExperience} from '../../components/experience/MeExperience';
import {MIRAR as M} from '../../design-system/native';
export default function Me(){const {session,signOut}=useAuthStore();const confirm=()=>{const copy='Signing out clears practice stored on this device. Continue?';if(Platform.OS==='web'){if(window.confirm(copy))void signOut();}else Alert.alert('Sign out',copy,[{text:'Cancel',style:'cancel'},{text:'Sign out',onPress:()=>void signOut()}]);};return <InertWhenBlurred><MeExperience email={session?.user?.email??'Your account'} onIntroduction={()=>router.push('/(onboarding)/')} onPrivacy={()=>router.push('/privacy')} onSupport={()=>void Linking.openURL('mailto:info@mirar.life')} onSignOut={confirm}/></InertWhenBlurred>;}
