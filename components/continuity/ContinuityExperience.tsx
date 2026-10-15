import React, {useState} from 'react';
import {View, StyleSheet} from 'react-native';
import {Action, Body, Eyebrow, Prompt} from '../inner-rep/v2/Foundation';
import {Chapter, ExperiencePage, SectionTitle, X} from '../experience/ExperienceKit';
import {WindowBoundary} from '../experience/WindowStudy';
import {MIRAR as M} from '../../design-system/native';
import {statusTitle, statusDetail, type ContinuityPort, type ContinuityIntent, type ContinuitySnapshot} from './contract';

export function continuityPrivacy(s:ContinuitySnapshot) {
 const scope=s.scope==='engine_only'?'Look Again and Attend stay on this device. ':'Daily Inner Reps, Look Again and Attend are included. ';
 return `${s.enabled?'Backup is on for supported structured choices.':s.accountCopy==='verified'?'Backup is off. An earlier account copy is kept.':'Practice is only on this device.'} ${scope}Optional words are never included in practice history.`;
}
/** Compact, factual status below the practice. No progress score or retention nudge. */
export function ContinuityStatus({port,onManage}:{port:ContinuityPort;onManage?:()=>void}) {
 const s=port.snapshot;
 return <View style={S.status}><WindowBoundary/><View accessibilityLiveRegion="polite" aria-busy={s.requestPending||['syncing','recovering','deleting'].includes(s.phase)}><Eyebrow>Where practice lives</Eyebrow><Body style={S.ink}>{statusTitle[s.phase]}</Body><Body>{statusDetail[s.phase]}</Body><Body style={X.small}>{s.scope==='engine_only'?'Account backup covers Daily Inner Reps only. Look Again, Attend and unfinished sessions stay on this device.':'Completed Daily Inner Reps and structured pilot choices are included. Unfinished sessions stay on this device.'}</Body></View>
 {s.lastConfirmedDay&&<Body style={X.small}>Last confirmed backup: {s.lastConfirmedDay}. {s.pending>0?`${s.pending} changes still waiting.`:''}</Body>}
 {onManage&&<Action secondary onPress={onManage}>Manage practice history</Action>}</View>;
}
export function BackupInvitation({onOpen,onDismiss}:{onOpen:()=>void;onDismiss:()=>void}) {
 return <View style={S.status}><Eyebrow>An optional way to return</Eyebrow><SectionTitle>Keep the thread of your practice.</SectionTitle><Body>A copy in your account can bring back your structured choices on another device. It does not make the Mirror an assessment.</Body><View style={X.row}><Action secondary onPress={onOpen}>Explore backup</Action><Action secondary onPress={onDismiss}>Not now</Action></View></View>;
}
/** Full account surface. All consequential buttons emit intent; service owns acknowledgment and truth. */
export function ContinuitySettings({port,onBack}:{port:ContinuityPort;onBack:()=>void}) {
 const s=port.snapshot;
 const [screen,setScreen]=useState<'overview'|'consent'|'off'|'delete'|'signout'|'replace_account'|'replace_device'>('overview');
 const [ack,setAck]=useState(false);
 const busy=!!s.requestPending||['syncing','recovering','deleting'].includes(s.phase);
 const request=(intent:ContinuityIntent)=>{setScreen('overview');setAck(false);port.request(intent);};
 const cancel=()=>{setScreen('overview');setAck(false);};
 const confirmation=screen!=='overview'&&screen!=='consent';
 const signoutDetail=s.pending>0||['syncing','offline','conflict','unavailable','error'].includes(s.phase)
 ? 'Some changes are not confirmed in your account. Signing out clears them from this device; they may not be recoverable.'
 : s.accountCopy==='verified'?'The confirmed account copy will remain. Sign in again to recover that copy. Device-only practice and unfinished sessions will be cleared.'
 :'There is no confirmed account copy to restore. Signing in again will not bring this practice back.';
 return <ExperiencePage key={screen} action={<Action secondary onPress={onBack}>Back</Action>}>
 <Eyebrow>Your practice · your choice</Eyebrow><Prompt key={screen} display>{screen==='consent'?'Keep the thread. Keep the choice.':confirmation?(screen==='off'?'Stop new backups?':screen==='delete'?'Delete practice history?':screen==='signout'?'Sign out?':screen==='replace_account'?'Use account history?':'Use device history?'):'Where your practice lives.'}</Prompt>
 {screen==='overview'?<>
 <Body style={X.lede}>Keeping your choices can give the Mirror something to return to. Backup is optional. It does not change what Mirar can infer about you.</Body>
 <ContinuityStatus port={port}/>
 <View style={X.row}><Action secondary disabled={busy} onPress={()=>setScreen(s.enabled?'off':'consent')}>{s.enabled?'Turn off backup':'Back up my practice'}</Action></View>
 {['offline','unavailable','error'].includes(s.phase)&&<View style={S.panel}><SectionTitle>Keep practising here.</SectionTitle><Body>No account restoration or successful backup is being claimed. Retry when a connection is available.</Body><Action secondary onPress={()=>request('retry')}>Try again</Action></View>}
 {s.phase==='recoverable'&&<View style={S.panel}><SectionTitle>Bring back the account copy?</SectionTitle><Body>This device has no practice history. Recovery brings the confirmed, supported history onto this device. Optional words and unfinished sessions are not restored.</Body><Action onPress={()=>request('recover')}>Restore account history</Action><Action secondary onPress={onBack}>Not now</Action></View>}
 {s.phase==='conflict'&&<View style={S.panel}><SectionTitle>Keep both in view before choosing.</SectionTitle><Body>This device and your account contain different practice. They have not been combined. Replacing a copy can change what Today and the Mirror show.</Body><Body style={S.ink}>This device: {s.deviceSummary?`${s.deviceSummary.completedReps} completed Daily Inner Reps · through ${s.deviceSummary.throughDay}`:'Summary not available yet'}. Account: {s.accountSummary?`${s.accountSummary.completedReps} completed Daily Inner Reps · through ${s.accountSummary.throughDay}`:'Summary not available yet'}.</Body><Action secondary disabled={busy||!s.deviceSummary||!s.accountSummary} onPress={()=>setScreen('replace_account')}>Review using account history</Action><Action secondary disabled={busy||!s.deviceSummary||!s.accountSummary} onPress={()=>setScreen('replace_device')}>Review using device history</Action><Action secondary disabled={!s.canExport} onPress={()=>request('export_then_account')}>Keep a device file, then use account history</Action>{!s.canExport&&<Body style={X.small}>File export is not available in this prototype. Nothing will be silently discarded.</Body>}<Action secondary onPress={onBack}>Decide later</Action></View>}
 {s.phase==='deleted'&&<View accessibilityLiveRegion="polite" style={S.panel}><SectionTitle>Room to begin again.</SectionTitle><Body>{s.enabled?'Backup remains on. Future supported practice can create a new account history.':'Backup is off. Future practice stays on this device.'} Your sign-in account has not been deleted.</Body></View>}
 <Chapter label="What travels" title="Choices, with their context."><Body>Completed Daily Inner Reps: offered options, selected answers, unknown and skip choices, and the calendar day. Chosen commitments include their authored label, timeframe and status. Mirror feedback includes your verdict and structured correction reason.</Body><Body>These choices can still be personal and sensitive, even without written words. They are linked to your account.</Body><Body style={S.ink}>{s.scope==='engine_only'?'In this proposed first release, Look Again and Attend remain on this device. They are not restored from account history.':'The supplied scope also includes structured Look Again and Attend choices. Written sentences remain excluded.'}</Body></Chapter>
 <Chapter label="What does not travel" title="Your words stay out of history."><Body>Optional words, camera sentences, correction notes and safety-check inputs are not backed up. A halted safety session is not included. No time of day, location or device identifier is added to practice history.</Body><Body style={X.small}>Optional words still go to the existing safety check. This describes practice storage, not authentication or infrastructure logs.</Body></Chapter>
 <Chapter label="Control" title="Off and deleted mean different things."><Body>Turning backup off stops new backups. It leaves the earlier account copy in place. Deleting history removes the backed-up history and, for this proposed flow, clears this device’s practice too. It does not delete your sign-in account.</Body><Body>{s.deletionDisclosure??'Prototype disclosure pending: the provider’s backup-retention period and access policy must be verified before release. No deletion timing or exclusive-access guarantee is made here.'}</Body><Action secondary disabled={busy||s.accountCopy!=='verified'} onPress={()=>setScreen('delete')}>Delete my backed-up practice</Action></Chapter>
 <View style={S.status}><Body>Signing out clears practice from this device, including device-only pilots and unfinished sessions.</Body><Action secondary disabled={s.requestPending||s.phase==='deleting'} onPress={()=>setScreen('signout')}>Sign out</Action></View>
 </>:screen==='consent'?<>
 <Body style={X.lede}>A confirmed account copy can survive signing out or changing devices. You can keep using Mirar with backup off.</Body>
 <View style={S.pair}><View style={S.plane}><Eyebrow>Current choice</Eyebrow><SectionTitle>Only on this device</SectionTitle><Body>Signing out or clearing this browser removes local practice. Sign-in alone does not preserve it.</Body></View><View style={S.plane}><Eyebrow>Optional</Eyebrow><SectionTitle>Backed up to my account</SectionTitle><Body>Supported structured choices are linked to your account. New-device recovery needs a confirmed copy and a connection.</Body></View></View>
 <Body>Included: completed Daily Inner Rep choices and dates, authored commitments and their status, Mirror feedback and structured correction reasons. These may be sensitive. {s.scope==='engine_only'?'Look Again and Attend are not included in this proposed release.':'Structured pilot choices are included in the supplied scope.'}</Body>
 <Body>Turning this on includes completed Daily Inner Reps already on this device, then future supported choices. An existing account history must be checked before any replacement.</Body>
 <Body>Not included: anything you type, unfinished sessions, safety-check inputs, time of day or location in practice history.</Body>
 <Body>You can turn off new backups or separately delete saved history. Account access uses your sign-in; the final access and provider-backup retention disclosure needs qualified review.</Body>
 {s.accountCopy==='verified'&&<Body style={S.ink}>An earlier account copy exists. Turning on backup must check both histories before combining or replacing anything.</Body>}
 <View style={X.row}><Action secondary onPress={cancel}>Not now</Action><Action secondary disabled={busy} onPress={()=>request('enable')}>Turn on backup</Action></View>
 </>:<View style={S.panel}>
 <Body style={S.ink}>{screen==='off'?'New choices will stay on this device. Your earlier account copy is kept until you delete it.':screen==='delete'?'This removes your backed-up practice and clears practice from this device. Today and the Mirror will start without this history. Your sign-in account remains.':screen==='signout'?signoutDetail:screen==='replace_account'?'This replaces this device’s practice with the account copy. Device-only changes will not be added to that copy.':'This replaces account history with this device’s history. Other devices must reconcile before they can continue backing up.'}</Body>
 {screen==='signout'&&<Body>{s.scope==='engine_only'?'Look Again, Attend and unfinished sessions are only on this device and will be cleared.':'Unfinished sessions are only on this device and will be cleared.'} {s.accountCopy==='verified'?'Your confirmed account copy remains.':'No account recovery is promised without a confirmed copy.'}</Body>}
 {screen==='delete'&&<><Body>{s.deletionDisclosure??'Provider-backup removal timing is not yet verified. This confirmation is for prototype review only.'}</Body><Body>{s.enabled?'Backup stays on for future practice unless you turn it off separately.':'Backup stays off.'}</Body></>}
 {(screen==='delete'||screen.startsWith('replace'))&&<Action secondary selected={ack} onPress={()=>setAck(!ack)}>{ack?'Understood · selected':'I understand which history will be removed'}</Action>}
 <View style={X.row}><Action secondary onPress={cancel}>Cancel</Action><Action secondary disabled={busy||((screen==='delete'||screen.startsWith('replace'))&&!ack)} onPress={()=>request(screen==='off'?'disable':screen==='delete'?'delete':screen==='signout'?'sign_out':screen==='replace_account'?'keep_account':'keep_device')}>{screen==='off'?'Turn off backup':screen==='delete'?'Delete account and device history':screen==='signout'?'Sign out':'Confirm replacement'}</Action></View>
 {screen==='signout'&&!s.enabled&&<Action secondary onPress={()=>setScreen('consent')}>Review backup first</Action>}
 </View>}
 </ExperiencePage>;
}
const S=StyleSheet.create({status:{gap:16,paddingVertical:24,borderTopWidth:1,borderColor:M.color.border},ink:{color:M.color.ink},panel:{gap:20,marginVertical:24,padding:24,backgroundColor:M.color.paper,borderLeftWidth:2,borderColor:M.color.warmInk},pair:{flexDirection:'row',flexWrap:'wrap',gap:16,marginVertical:24},plane:{flexGrow:1,flexBasis:240,padding:24,gap:16,backgroundColor:M.color.paper,borderTopWidth:2,borderColor:M.color.warmInk}});
