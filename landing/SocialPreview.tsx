import React from 'react';
import { WindowStudy } from '../components/experience/WindowStudy';
import { VisualFoundation } from '../components/inner-rep/v2/Foundation';
import Wordmark from '../assets/brand/mirar-wordmark.png';
/** Deterministic social composition. No personal data or exercise state. */
export function SocialPreview() { return <VisualFoundation><div style={{ width: 1200, height: 630, padding: 64, background: '#F4F0EA', display: 'flex', gap: 48, alignItems: 'center', boxSizing: 'border-box' }}><div style={{ flex: 1 }}><img src={Wordmark as string} alt="Mirar" width="170" style={{ height: 'auto', marginBottom: 40 }}/><h1 style={{ fontFamily: 'Instrument Serif', fontWeight: 400, fontSize: 72, lineHeight: 1.05, color: '#2A2A30', margin: '0 0 32px' }}>Look within.<br />Leave room to<br />look again.</h1><p style={{ fontFamily: 'DM Sans', fontSize: 22, lineHeight: 1.5, color: '#6B696E' }}>Emotional fitness is something you practise,<br />not something you score.</p></div><div style={{ width: 420 }}><WindowStudy /></div></div></VisualFoundation>; }
