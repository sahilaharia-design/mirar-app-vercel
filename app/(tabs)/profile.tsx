import React from 'react';
import {Linking} from 'react-native';
import {router} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAuthStore} from '../../stores/auth-store';
import {InertWhenBlurred} from '../../components/ui/InertWhenBlurred';
import {MeExperience} from '../../components/experience/MeExperience';
import {MIRAR as M} from '../../design-system/native';
const ContinuityMeHost: React.ComponentType | null = process.env.EXPO_PUBLIC_HISTORY_SYNC === '1' ? require('../../components/continuity/ContinuityHosts').ContinuityMeHost : null;
const useContinuityNotice: () => string | undefined = process.env.EXPO_PUBLIC_HISTORY_SYNC === '1' ? require('../../components/continuity/ContinuityHosts').useContinuityNotice : () => undefined;
export default function Me(){const continuityNotice=useContinuityNotice();const {session,signOut}=useAuthStore();return <InertWhenBlurred><MeExperience email={session?.user?.email??'Your account'} onIntroduction={()=>router.push('/(onboarding)/')} onPrivacy={()=>router.push('/privacy')} onSupport={()=>void Linking.openURL('mailto:info@mirar.life')} onSignOut={()=>void signOut()} historyControls={ContinuityMeHost ? <ContinuityMeHost /> : undefined} privacyNotice={continuityNotice}/></InertWhenBlurred>;}
