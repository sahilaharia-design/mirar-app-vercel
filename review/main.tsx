import React from 'react';
import {ExperienceReview} from './ExperienceReview';
import { createRoot } from 'react-dom/client';
import { DailyInnerRep } from '../components/inner-rep/v2/DailyExperience';
import { fixture,engineInsight,answersTo } from './fixtures';
import { nextStep, type StepAnswer } from '../lib/innerRep/v2/contracts';
import '../design-system/tokens.css';
import './review.css';

// No auth, Supabase, analytics or storage adapter is imported by this harness.
const params = new URLSearchParams(location.search);
const scenario = params.get('case') ?? 'today'; const base = fixture(scenario);
const target = params.get('step'); const draft = target ? answersTo(base.context,target) : [];
const insight = engineInsight();
const today = scenario === 'mirror' || scenario === 'done'
 ? {kind:'done' as const, insight:scenario === 'mirror' ? insight : undefined}
 : {kind:'rep' as const, ...base};
const audit: {answers:StepAnswer[];completed:boolean;feedback?:string;correction?:string;safety:boolean} = {answers:[],completed:false,safety:false};
// Structured review observability only: no text is accepted by these callbacks.
Object.defineProperty(window,'reviewAudit',{value:audit});
createRoot(document.getElementById('root')!).render(params.has('experience')?<ExperienceReview/>:<main><DailyInnerRep today={today} greeting="Good afternoon." draft={draft} onProgress={answers=>{audit.answers=answers;}} onDismiss={()=>{}}
 onComplete={async answers=>{if(nextStep(base.context,answers)) throw new Error('Incomplete contract');audit.answers=answers;if(scenario==='retry'&&!params.has('retry')) {params.set('retry','1');throw new Error('Review retry');} audit.completed=true;return {insight};}}
 onSafety={answers=>{audit.answers=answers;audit.safety=true;}}
 onFeedback={async (_id,value)=>{audit.feedback=value;}}
 onCorrection={async (_id,reason)=>{audit.correction=reason;}}
 /></main>);
