import React, {useEffect,useState} from 'react';
import {View, StyleSheet} from 'react-native';
import {Action, Body, Eyebrow, Prompt} from '../inner-rep/v2/Foundation';
import {Chapter, ExperiencePage, SectionTitle, X} from '../experience/ExperienceKit';
import {WindowBoundary} from '../experience/WindowStudy';
import {MIRAR as M} from '../../design-system/native';
import {statusTitle, statusDetail, type ContinuityPort, type ContinuityIntent, type ContinuitySnapshot} from './contract';

const scope='Account backup covers Daily Inner Reps only. Look Again, Attend, unfinished practice and offers stay on this device.';
const notices = {
 account_copy_removed:'The account copy was removed. Backup is off; this device kept its practice.',
 history_reset:'Account history was started again elsewhere. This device stopped backing up and kept its practice.',
 turned_off_elsewhere:'Backup was turned off elsewhere. This device stopped uploading and kept its practice.',
 account_copy_deleted_device_kept:'Account history was deleted. Backup is off; this device’s practice was kept.',
 file_saved:'A copy of your history was saved. Nothing else changed.',
 server_flag_pending:'New uploads have stopped on this device. The service has not yet confirmed that backup is off.',
};
const retention='PROVISIONAL · Pending qualified review. Provider-backup retention and deletion timing have not been verified. No timing or exclusive-access guarantee is made.';
/** Presentation fallback for the original G3 DTO, not a replacement for owner policy. */
function controls(s:ContinuitySnapshot) {
 return s.actions ?? {turnOn:!s.enabled,turnOff:s.enabled,deleteBackedUp:s.accountCopy==='verified',exportFile:false,importFile:false,reviewDropped:false,chooseHistory:s.phase==='conflict',recover:s.phase==='recoverable',clearDevice:true,retry:!!s.error,signOut:true};
}
export function continuityPrivacy(s:ContinuitySnapshot) {
 return `${s.decision==='copy_was_deleted'?'The account copy was deleted. Backup is off; this device kept its practice.':s.enabled?'Backup is on for supported structured choices.':s.accountCopy==='verified'?'Backup is off. An earlier account copy is kept.':s.accountCopy==='unknown'?'Backup is off. The account copy has not been checked.':'Practice is only on this device.'} Look Again, Attend, unfinished practice and offers stay on this device. Optional words are not part of practice history.`;
}
function ServiceDisclosure({port}:{port:ContinuityPort}) {
 return port.serviceMode==='live'?null:<Body style={[X.small,S.ink]}>LOCAL-ONLY PREVIEW · Service responses below are simulated. No real account backup or recovery takes place.</Body>;
}
function summary(s:ContinuitySnapshot['deviceSummary']) {
 if(!s)return 'Summary not available';
 const count=s.completedReps!==undefined?`${s.completedReps} completed Daily Inner Reps`:s.events!==undefined?`${s.events} structured entries`:'Count not available';
 return count+(s.throughDay?` · through ${s.throughDay}`:'');
}
export function ContinuityStatus({port,onManage,showServiceDisclosure=true}:{port:ContinuityPort;onManage?:()=>void;showServiceDisclosure?:boolean}) {
 const s=port.snapshot;
 return <View style={S.status}><WindowBoundary/>{showServiceDisclosure&&<ServiceDisclosure port={port}/>}<View accessibilityLiveRegion="polite"><Eyebrow>Where practice lives</Eyebrow><Body style={S.ink}>{s.decision==='copy_was_deleted'?'The account copy was deleted':statusTitle[s.phase]}</Body><Body>{s.decision==='copy_was_deleted'?'This device kept its history. Nothing will be uploaded again without an explicit choice.':statusDetail[s.phase]}</Body>{s.notice&&<Body style={S.ink}>{notices[s.notice]}</Body>}<Body style={X.small}>{scope}</Body></View>
 {s.accountCopy==='unknown'&&<Body style={X.small}>The account copy has not been confirmed. An explicit check is available in practice history.</Body>}
 {s.automaticChecks==='while_backup_on'&&<Body style={X.small}>Mirar checks your account copy when the app opens and after changes, to keep both consistent.</Body>}{s.automaticChecks==='none'&&<Body style={X.small}>Nothing is checked unless you ask.</Body>}
 {s.pending>0&&<Body style={X.small}>{s.pending} changes are waiting for confirmation.</Body>}
 {!!s.unsentOnDevice&&!s.enabled&&<Body style={X.small}>{s.unsentOnDevice} unsent changes stay on this device. They upload only if you turn backup on again.</Body>}
 {s.enabled&&s.phase==='ready'&&s.pending===0&&s.accountCopy==='verified'&&s.lastConfirmedDay&&<Body style={X.small}>Last confirmed backup: {s.lastConfirmedDay}.</Body>}
 {onManage&&<Action secondary onPress={onManage}>Manage practice history</Action>}</View>;
}
export function BackupInvitation({onOpen,onDismiss}:{onOpen:()=>void;onDismiss:()=>void}) {
 return <View style={S.status}><Eyebrow>An optional way to return</Eyebrow><SectionTitle>Keep the thread of your practice.</SectionTitle><Body>A copy in your account can bring back your structured choices on another device. It does not make the Mirror an assessment.</Body><View style={X.row}><Action secondary onPress={onOpen}>Explore backup</Action><Action secondary onPress={onDismiss}>Not now</Action></View></View>;
}
type Screen='overview'|'consent'|'off'|'delete_account'|'delete_both'|'clear_device'|'signout'|'replace_account'|'recover'|'upload_again';
/** All outcomes come from the owner snapshot; a click never mutates history or claims success. */
export function ContinuitySettings({port,onBack,initialScreen='overview',reviewControls}:{port:ContinuityPort;onBack:()=>void;initialScreen?:Screen;reviewControls?:React.ReactNode}) {
 const s=port.snapshot,a=controls(s); const [screen,setScreen]=useState<Screen>(initialScreen);const [ack,setAck]=useState(false);
 useEffect(()=>{setScreen(initialScreen);setAck(false);},[initialScreen]);
 const [reviewedVersion,setReviewedVersion]=useState<string|null>(null);
 const open=(next:Screen)=>{setAck(false);setScreen(next);if(next==='consent')setReviewedVersion(s.consentVersion??null);};
 const currentWording=!!reviewedVersion&&reviewedVersion===s.consentVersion;
 const busy=!!s.requestPending||['syncing','recovering','deleting'].includes(s.phase);
 const canSave=s.canExport===true;const removed=s.decision==='copy_was_deleted';
 const send=(intent:ContinuityIntent)=>{if((intent==='enable'||intent==='enable_and_upload')&&!currentWording)return;setScreen('overview');setAck(false);port.request(intent,(intent==='enable'||intent==='enable_and_upload')?{consentVersion:reviewedVersion!}:undefined);};
 const cancelled=()=>open('overview');
 const titles:Record<Screen,string>={overview:'Where your practice lives.',consent:'Keep the thread. Keep the choice.',off:'Stop new backups?',delete_account:'Delete account history?',delete_both:'Delete account and device history?',clear_device:'Clear device history?',signout:'Sign out?',replace_account:'Use account history?',recover:'Restore and turn on backup?',upload_again:'Upload this history again?'};
 const finalIntent:Partial<Record<Screen,ContinuityIntent>>={off:'disable',delete_account:'delete_account_copy',delete_both:'delete',clear_device:'clear_device',signout:'sign_out',replace_account:'keep_account',recover:'recover',upload_again:'upload_again'};
 const labels:Partial<Record<Screen,string>>={off:'Turn off backup',delete_account:'Delete account history',delete_both:'Delete both copies',clear_device:'Clear device history',signout:'Sign out',replace_account:'Save device copy, then use account history',recover:'Restore and turn on backup',upload_again:'Upload it again'};
 const confirmed=screen==='delete_account'||screen==='delete_both'||screen==='clear_device'||screen.startsWith('replace')||screen==='upload_again';
 const allowed=screen==='off'?a.turnOff:screen==='delete_account'?canSave&&a.deleteBackedUp:screen==='delete_both'?canSave:screen==='clear_device'?canSave&&a.clearDevice&&(!removed||s.canClearDeletedDecision===true):screen==='signout'?a.signOut:screen.startsWith('replace')?canSave&&a.chooseHistory:screen==='recover'?a.recover:screen==='upload_again'?s.canUploadAgain===true:true;
 const waiting=s.signOutWarning?.unsent??(s.pending+(s.unsentOnDevice??0));
 return <ExperiencePage key={screen} action={<Action secondary onPress={onBack}>Back</Action>}>
 <Eyebrow>Your practice · your choice</Eyebrow><Prompt key={screen} display>{titles[screen]}</Prompt>
 <ServiceDisclosure port={port}/>
 {screen!=='overview'&&screen!=='consent'&&<Body style={X.small}>{scope}</Body>}
 {screen==='overview'?<>
 <Body style={X.lede}>Keeping your choices can give the Mirror something to return to. Backup is optional. It does not change what Mirar can infer about you.</Body>
 <ContinuityStatus port={port} showServiceDisclosure={false}/>
 <View style={X.row}><Action secondary disabled={busy} onPress={()=>send('check_account')}>Check for a backed-up copy</Action></View><Body style={X.small}>Looks for a backed-up copy in your account. Changes nothing.</Body>
 {s.confirmUpload&&<View style={S.panel}><SectionTitle>Include the choices kept here?</SectionTitle><Body>Turning on will back up {s.confirmUpload.count} structured records from {s.confirmUpload.fromDay} to {s.confirmUpload.throughDay} that are currently only on this device.</Body><View style={X.row}><Action secondary disabled={busy} onPress={()=>currentWording?send('enable_and_upload'):open('consent')}>{currentWording?'Back up these and turn on':'Review and back up these choices'}</Action><Action secondary disabled={busy} onPress={()=>send('stay_on_device')}>Keep them on this device</Action></View></View>}
 <View style={X.row}>{a.turnOff&&<Action secondary disabled={!!s.requestPending} onPress={()=>open('off')}>Turn off backup</Action>}{a.turnOn&&!s.confirmUpload&&<Action secondary disabled={busy||s.phase==='conflict'} onPress={()=>open('consent')}>{s.consent==='needs_reconsent'?'Review backup consent':'Back up my practice'}</Action>}</View>
 {s.error&&<View role="alert" style={S.panel}><SectionTitle>That change was not completed.</SectionTitle><Body style={S.ink}>{s.error.message}</Body><Action secondary disabled={!!s.requestPending} onPress={()=>send('retry')}>Try again</Action></View>}
 {!s.error&&['offline','unavailable'].includes(s.phase)&&<View style={S.panel}><Body>The account copy could not be confirmed. Your device copy has not been replaced.</Body><Action secondary disabled={busy} onPress={()=>send('check_account')}>Check again</Action></View>}
 {s.phase==='recoverable'&&a.recover&&<View style={S.panel}><SectionTitle>Bring back the account copy?</SectionTitle><Body>Restoring brings supported account history onto this device and turns backup on for future Daily Inner Reps. It does not restore pilot practice, unfinished sessions or offers.</Body><Action secondary disabled={busy} onPress={()=>open('recover')}>Review recovery</Action><Action secondary onPress={onBack}>Not now</Action></View>}
 {s.phase==='conflict'&&<View style={S.panel}><SectionTitle>{removed?'This device still has the history.':'Keep both in view before choosing.'}</SectionTitle>
 {removed?<><Body>The account copy was deleted. Nothing will be uploaded again without your explicit choice. This is not a restoration.</Body><Action secondary disabled={busy||s.canUploadAgain!==true} onPress={()=>open('upload_again')}>Review uploading it again</Action><Action secondary disabled={busy||s.canKeepDeviceOnly!==true} onPress={()=>send('stay_on_device')}>Keep it only on this device</Action>{!s.canClearDeletedDecision&&<Body style={X.small}>Clearing this pending decision is awaiting the controller connection. Uploading again and keeping history on this device are available above.</Body>}<Action secondary disabled={busy||!canSave||s.canClearDeletedDecision!==true} onPress={()=>open('clear_device')}>Save a copy, then clear this device</Action></>:<><Body>This device and the account hold different practice. Nothing has been replaced.</Body><Body style={S.ink}>This device: {summary(s.deviceSummary)}. Account: {summary(s.accountSummary)}. These are records, not progress scores.</Body>{canSave?<><Body>A saved file is confirmed first. If saving is cancelled or cannot be verified, nothing changes.</Body><Action secondary disabled={busy||!a.chooseHistory||!s.deviceSummary||!s.accountSummary} onPress={()=>open('replace_account')}>Review using account history</Action></>:<Body>Saving a copy is unavailable here, so neither history can be replaced.</Body>}</>}
 {!canSave&&removed&&<Body>Saving a copy is unavailable here, so this device cannot be cleared from this decision.</Body>}<Action secondary disabled={busy} onPress={()=>{send('stay_on_device');onBack();}}>Decide later</Action></View>}
 {s.actions?.reviewDropped&&<View style={S.panel}><SectionTitle>Kept here, separately.</SectionTitle><Body>{s.droppedCount??s.dropped?.length} entries were not added to the account copy.</Body>{s.dropped?.map((d,i)=><Body key={i}>{d.day} · {d.reason==='day_already_recorded'?'Another device recorded this day first.':d.reason==='account_chosen'?'The account history was chosen.':'The account history changed, so this entry could not be added.'}</Body>)}</View>}
 <Chapter label="What travels" title="Choices, with their context."><Body>Your selected options and context, calendar days, and records of completed or abandoned reps. Chosen intentions, their dates, Mirror feedback and correction choices can be reconstructed from these structured choices.</Body><Body>These choices can still be personal and sensitive, even without written words. They are linked to your account.</Body><Body style={S.ink}>{scope}</Body></Chapter>
 <Chapter label="What does not travel" title="Your words stay out of history."><Body>Optional words, camera sentences, correction notes and safety-check inputs are not backed up. A halted safety session is not included. No time of day, location or device identifier is added to practice history.</Body><Body style={X.small}>Optional words still go to the existing safety check. This describes practice storage, not authentication or infrastructure logs.</Body></Chapter>
 {canSave&&<View style={S.status}><Action secondary disabled={busy} onPress={()=>send('save_file')}>Save a file of my history</Action><Body style={X.small}>Saves a verified file of this device’s supported history. Nothing else changes.</Body></View>}
 <Chapter label="Control" title="Off and deleted mean different things."><Body>Turning off stops new uploads and keeps the account copy. Account deletion keeps device practice. Device clearing keeps the account copy. Combined deletion is a separate, explicit choice.</Body><Body style={S.ink}>{retention}</Body>{s.deletionDisclosure&&<Body style={X.small}>{s.deletionDisclosure}</Body>}
 {a.deleteBackedUp&&<Action secondary disabled={busy} onPress={()=>open('delete_account')}>Delete my backed-up practice</Action>}{a.clearDevice&&<Action secondary disabled={busy} onPress={()=>open('clear_device')}>Clear practice on this device</Action>}<Action secondary disabled={busy} onPress={()=>open('delete_both')}>Delete account and device history</Action>
 <Body style={X.small}>A confirmed saved file is required wherever a history would otherwise be lost. If saving is unavailable, the service refuses that action.</Body></Chapter>
 <View style={S.status}><Body>Signing out clears device practice, including device-only pilots and unfinished sessions.</Body><Action secondary disabled={!a.signOut} onPress={()=>open('signout')}>Sign out</Action></View>
 </>:screen==='consent'?<>
 <Body style={X.lede}>A confirmed account copy can survive signing out or changing devices. You can keep using Mirar with backup off.</Body>
 <View style={S.pair}><View style={S.plane}><Eyebrow>Current choice</Eyebrow><SectionTitle>Only on this device</SectionTitle><Body>Signing out or clearing this browser removes local practice. Sign-in alone does not preserve it.</Body></View><View style={S.plane}><Eyebrow>Optional</Eyebrow><SectionTitle>Backed up to my account</SectionTitle><Body>Supported choices are linked to your account. Recovery needs a confirmed copy and a connection.</Body></View></View>
 <Body>Included: Daily Inner Rep choices and calendar days, completed and abandoned rep records, intention choices, Mirror feedback and correction choices. These may be sensitive.</Body><Body style={S.ink}>{scope}</Body><Body>Not included: anything you type, unfinished draft answers, safety-check inputs, time of day or location in practice history.</Body>{s.confirmUpload&&<Body>Turning on will back up {s.confirmUpload.count} structured records from {s.confirmUpload.fromDay} to {s.confirmUpload.throughDay} currently only on this device. All are needed to reconstruct the practice accurately.</Body>}<Body>Turning this on checks the recorded device history against the account before any replacement. You can stop new backups or delete the account copy separately.</Body><Body>{retention}</Body>
 {!currentWording&&<Body role="status">The disclosure version is unavailable or has changed. Go back and review the current wording.</Body>}<View style={X.row}><Action secondary disabled={!!s.requestPending} onPress={()=>send('decline')}>Not now</Action><Action secondary disabled={busy||!a.turnOn||!currentWording} onPress={()=>send(s.confirmUpload?'enable_and_upload':'enable')}>{s.confirmUpload?'Back up these and turn on':'Turn on backup'}</Action></View>
 </>:<View style={S.panel}>
 {screen==='off'&&<><Body>New uploads stop. The existing account copy stays until you delete it.</Body><Body>{s.unsentOnDevice??s.pending} changes are currently waiting on this device. Changes made while backup is off stay here and upload only if you turn backup on again.</Body>{s.notice==='server_flag_pending'&&<Body style={S.ink}>{notices.server_flag_pending}</Body>}</>}
 {screen==='delete_account'&&<><Body>This removes only the account history. Backup becomes off. This device keeps its practice, and your sign-in account remains.</Body><Body>A saved file of the account history must be verified before deletion. Saving capability alone is not confirmation that the file exists.</Body></>}
 {screen==='clear_device'&&<><Body>This clears practice from this device, including pilots, unfinished sessions and offers. It does not delete the account copy. Backup becomes off; recovery is offered if a confirmed account copy remains.</Body><Body>A verified saved device file is required before clearing practice.</Body></>}
 {screen==='delete_both'&&<><Body>This removes both account history and practice on this device, including pilots, unfinished sessions and offers. Backup becomes off. The sign-in account remains.</Body><Body>A verified saved file of this device’s history is required before history is removed. The service must protect any account-only history too.</Body>{!canSave&&<Body style={S.ink}>Saving a copy is unavailable here. Combined deletion cannot proceed.</Body>}</>}
 {screen==='replace_account'&&<Body>First, a copy of this device’s history must be saved and confirmed. Then Today and the Mirror use account history. This device’s earlier history is set aside and kept on the device, not deleted.</Body>}
 {screen==='recover'&&<><Body>Restore the confirmed account history and turn on backup for future Daily Inner Reps. Look Again, Attend, unfinished practice and offers remain device-only.</Body><Body>{retention}</Body></>}
 {screen==='upload_again'&&<><Body>The account copy was deleted. This deliberately starts an account copy again from this device’s history and turns backup on. It is not automatic recovery.</Body><Body>{retention}</Body></>}
 {screen==='signout'&&<><Body>Signing out removes your practice from this device.</Body><Body>{waiting>0?`${waiting} changes are not confirmed in your account. They will be cleared from this device.`:s.accountCopy==='verified'?'Your confirmed account copy remains.':'The account copy is not confirmed; signing in again does not guarantee recovery.'}</Body></>}
 {['delete_account','clear_device','delete_both'].includes(screen)&&<><Body style={S.ink}>{retention}</Body>{s.deletionDisclosure&&<Body>{s.deletionDisclosure}</Body>}</>}
 {screen==='upload_again'&&!s.canUploadAgain&&<Body>This choice is not connected in this local build. Nothing will be uploaded.</Body>}
 {['delete_account','clear_device'].includes(screen)&&!canSave&&<Body style={S.ink}>Saving a copy is unavailable here. This action cannot proceed.</Body>}
 {confirmed&&<Action secondary selected={ack} onPress={()=>setAck(!ack)}>{ack?'Understood · selected':'I understand what this choice changes'}</Action>}
 <View style={X.row}><Action secondary onPress={cancelled}>Cancel</Action><Action secondary disabled={(screen!=='signout'&&busy)||!allowed||(confirmed&&!ack)} onPress={()=>send(finalIntent[screen]!)}>{labels[screen]??'Continue'}</Action></View>
 {screen==='signout'&&waiting>0&&(s.signOutWarning?.canSaveFile??canSave)&&<Action secondary disabled={busy} onPress={()=>send('save_file')}>Save a file first</Action>}{screen==='signout'&&waiting>0&&!(s.signOutWarning?.canSaveFile??canSave)&&<Body>A file cannot be saved here. You can cancel or sign out; sign-out is not blocked.</Body>}
 {screen==='signout'&&a.turnOn&&<Action secondary onPress={()=>open('consent')}>Review backup first</Action>}{screen==='signout'&&waiting>0&&s.enabled&&<Action secondary onPress={cancelled}>Wait while it finishes</Action>}
 </View>}
 {reviewControls}
 </ExperiencePage>;
}
const S=StyleSheet.create({status:{gap:16,paddingVertical:24,borderTopWidth:1,borderColor:M.color.border},ink:{color:M.color.ink},panel:{gap:20,marginVertical:24,padding:24,backgroundColor:M.color.paper,borderLeftWidth:2,borderColor:M.color.warmInk},pair:{flexDirection:'row',flexWrap:'wrap',gap:16,marginVertical:24},plane:{flexGrow:1,flexBasis:240,padding:24,gap:16,backgroundColor:M.color.paper,borderTopWidth:2,borderColor:M.color.warmInk}});
