// LOCAL REVIEW ONLY. Uses actual engine templates; these are not app selection rules.
import { TEMPLATES, TEMPLATE_BY_ID } from '../lib/innerRep/v2/templates';
import { nextStep, type StepAnswer } from '../lib/innerRep/v2/contracts';
import { decide } from '../lib/innerRep/v2/engine';
import { createState, flowContext, applyRep } from '../lib/innerRep/v2/state';
import { computeEvidence } from '../lib/innerRep/v2/evidence';
import { chooseInsight } from '../lib/innerRep/v2/insights';
import type { Instance, Frame } from '../lib/innerRep/v2/types';
import type { ShownInsight } from '../components/inner-rep/v2/HonestMirror';

export function fixture(name: string) {
 const s = createState(42); const decision = decide(s,1);
 const variants: Record<string,string | undefined> = {
  compare: TEMPLATES.find(t => t.interaction === 'compare')?.id,
  words: TEMPLATES.find(t => t.words)?.id,
  followup: TEMPLATES.find(t => t.followUp)?.id,
  context: 'presence', open: 'probe_anchor', commitment: 'cont_commitment', continuity: 'cont_thread', timeframe: 'act_tiny', acknowledge: 'rel_connect',
 };
 const template = TEMPLATE_BY_ID[variants[name] ?? decision.templateId!];
 const frame: Frame = name === 'commitment' ? 'commitment_check' : name === 'continuity' ? 'thread_check' : 'base';
 if (name === 'commitment') s.commitments.push({id:1,kind:'reach_out',label:'Reach out to a friend',timeframe:'specific_date',createdDay:0,dueDay:2,status:'open',statusSource:'user',asks:0,noneRevisits:0,events:[]});
 const context = flowContext(s,1,template.id,frame,name === 'continuity' ? 'partner' : undefined,undefined,decision.variant,name === 'commitment' ? 1 : undefined);
 const payload = { instanceId: 1, templateId: template.id, frame, ...(template.role === 'training' ? {capacityLabel: template.capacity[0].toUpperCase()+template.capacity.slice(1)} : {}), intensity: template.intensity, estimatedSeconds: template.seconds, dismissible: true as const };
 return { context,payload };
}
export function engineInsight(): ShownInsight | undefined {
 const s = createState(42);
 for (let day=1; day<=5; day++) {
  const decision = decide(s,day); const t = TEMPLATE_BY_ID.probe_anchor;
  const ctx = flowContext(s,day,t.id,'base',undefined);
  const inst: Instance = { id: ++s.seq.inst, day, templateId:t.id, frame:'base', capacity:t.capacity, mechanism:t.mechanism, intensity:t.intensity, layer:'probe', intent:'probe', variant:0, trace:decision.trace, completed:false, unknownPrimary:false,burden:false, skippedAll:false };
  s.instances.push(inst); applyRep(s,inst,ctx,[{stepId:'primary',kind:'option',optionId:'work'},{stepId:'thread_offer',kind:'no'}]);
 }
 const result = computeEvidence(s,5); const shown = chooseInsight(s,result.evidence,5,result.tentativeMode).shown;
 return shown ? {id:1,tier:shown.tier,text:shown.text,evidence:shown.snapshot} : undefined;
}
export function answersTo(ctx: ReturnType<typeof fixture>['context'], target: string): StepAnswer[] {
 const answers: StepAnswer[] = [];
 for(let i=0;i<10;i++) { const step = nextStep(ctx,answers); if(!step || step.id === target) return answers;
  if(step.type === 'choice') { const option = step.id === 'primary' ? ctx.template.options.find(o=>o.creates || o.burden || o.polarity!=='absent') : undefined; answers.push({stepId:step.id,kind:'option',optionId:option?.id ?? step.options[0].id}); }
  else answers.push({stepId:step.id,kind:'skip'});
 }
 return answers;
}
