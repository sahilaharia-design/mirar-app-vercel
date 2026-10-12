import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DiscoverExperience } from '../components/experience/DiscoverExperience';
import '../design-system/tokens.css';
import './style.css';
import { SocialPreview } from './SocialPreview';
const env = (import.meta as ImportMeta & {
    env: {
        VITE_MIRAR_APP_ENTRY_URL?: string;
    };
}).env;
// No auth path, return URL or redirect is inferred here. Claude supplies the complete verified destination.
function Landing() {
    const [pending, setPending] = useState(false);
    const enter = () => { if (env.VITE_MIRAR_APP_ENTRY_URL) {
        const url = new URL(env.VITE_MIRAR_APP_ENTRY_URL);
        if (url.protocol === 'https:') {
            location.assign(url.href);
            return;
        }
    } setPending(true); };
    return <SafeAreaProvider>{pending && <div role="alert" className="configuration-note">App entry is awaiting route confirmation for this local release candidate. <button onClick={() => setPending(false)}>Dismiss</button></div>}<DiscoverExperience onEnter={enter} onPrivacy={() => location.assign('https://mirar.life/privacy')} legalLinks={<nav aria-label="Legal"><a href="https://mirar.life/privacy">Privacy</a><a href="https://mirar.life/terms">Terms</a><a href="https://mirar.life/cookies">Cookies</a></nav>}/></SafeAreaProvider>;
}
createRoot(document.getElementById('root')!).render(new URLSearchParams(location.search).get('asset') === 'social' ? <SocialPreview /> : <><a className="skip" href="#root">Skip to content</a><Landing /></>);
