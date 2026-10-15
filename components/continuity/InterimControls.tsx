import React from 'react';
import { View } from 'react-native';
import { useContinuityStore } from '../../stores/continuity-store';
import type { AnyIntent } from '../../lib/innerRep/backup/continuity';
import { Action, Body, Eyebrow } from '../inner-rep/v2/Foundation';
import { X } from '../experience/ExperienceKit';

// INTERIM. Plain controls for the founder's 15 October decisions, so the local-only build is usable before Codex's screens exist
// (docs/experience/CONTINUITY_G3_UI_CHANGE_REQUESTS.md, revision 2). Codex replaces this file; it holds no logic, only intents and snapshot fields.
export function InterimControls() {
  const controller = useContinuityStore((s) => s.controller); const s = useContinuityStore((s) => s.snapshot);
  if (!controller || !s) return null;
  const send = (i: AnyIntent) => () => { void controller.request(i); };
  return <View role="group" accessibilityLabel="Backup choices" style={[X.rule, X.space]}>
    <Eyebrow>YOUR CHOICES · interim screen</Eyebrow>
    {s.confirmUpload ? <View style={X.space}>
      <Body>Turning on will back up {s.confirmUpload.count} {s.confirmUpload.count === 1 ? 'choice' : 'choices'} from {s.confirmUpload.fromDay} to {s.confirmUpload.throughDay} that are currently only on this device.</Body>
      <View style={X.row}><Action onPress={send('enable_and_upload')}>Back these up and turn on</Action><Action secondary onPress={send('stay_on_device')}>Keep them on this device</Action></View>
    </View> : null}
    {!s.enabled && !s.confirmUpload ? <View style={X.space}>
      <Body style={X.small}>Nothing is checked unless you ask. This looks for a backed-up copy in your account and changes nothing.</Body>
      <View style={X.row}><Action secondary onPress={send('check_account')}>Check for a backed-up copy</Action></View>
    </View> : null}
    {s.enabled ? <Body style={X.small}>Backup is on: Mirar checks your account copy when the app opens and after changes, to keep both the same.</Body> : null}
    {s.canExport ? <View style={X.row}><Action secondary onPress={send('save_file')}>Save a file of my history</Action></View> : null}
    {s.notice === 'file_saved' ? <Body accessibilityLiveRegion="polite" style={X.small}>A copy of your history was saved. Nothing else changed.</Body> : null}
    {s.error ? <Body accessibilityLiveRegion="polite">{s.error.message}</Body> : null}
    {s.signOutWarning ? <Body style={X.small}>{s.signOutWarning.unsent} {s.signOutWarning.unsent === 1 ? 'choice is' : 'choices are'} not in your account. Signing out removes {s.signOutWarning.unsent === 1 ? 'it' : 'them'} from this device.{s.signOutWarning.canSaveFile ? ' You can save a file first.' : ' A file cannot be saved here.'}</Body> : null}
  </View>;
}
