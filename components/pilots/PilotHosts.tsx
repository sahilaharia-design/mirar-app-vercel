import React, { useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { useAuthStore } from '../../stores/auth-store';
import { usePilotStore } from '../../stores/pilot-store';
import { buildPilotMirror, pilotOffers } from '../../lib/innerRep/pilots/read';
import { MirrorPanel, PilotOffers } from './PilotViews';
// Required only inside EXPO_PUBLIC_PILOTS=1 branches. No pilot content in production bundles.
function usePilotPresentation() {
 const userId=useAuthStore(s=>s.session?.user?.id);const st=usePilotStore();void st.tick;
 useFocusEffect(useCallback(()=>{if(userId)void st.load(userId);},[userId,st.load]));
 return st;
}
export function PilotOffersHost(){const st=usePilotPresentation();if(!st.ready)return null;return <PilotOffers offers={pilotOffers(st.records(),st.today(),st.resumable()?.pilot??null)} onBegin={pilot=>router.push({pathname:'/pilots',params:{pilot}})}/>;}
export function PilotMirrorHost(){const st=usePilotPresentation();if(!st.ready)return null;return <MirrorPanel mirror={buildPilotMirror(st.records(),st.today())}/>;}
