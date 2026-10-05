import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { withTimeout } from '../../lib/with-timeout';
import { useColors } from '../../contexts/theme-context';
import { FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';

// The daily cue: one email each morning with a link to check in. Free to run
// (Brevo free plan), uses the account email, no phone number needed. Consent
// is an explicit, un-pre-ticked choice recorded with a timestamp; every email
// also carries a one-click unsubscribe (see supabase/functions/email-nudge).
export function MorningNudgeCard({ userId, email }: { userId: string; email: string }) {
  const { t } = useTranslation();
  const colors = useColors();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await withTimeout(
          supabase.from('users').select('email_nudge_opt_in').eq('id', userId).maybeSingle()
        );
        if (mounted && data) setEnabled(!!data.email_nudge_opt_in);
      } catch {
        // Column may not exist yet (migration 015 not run) — card stays "off".
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [userId]);

  const save = async (on: boolean) => {
    setError(null);
    if (on && !consent) { setError(t('nudge.error_consent')); return; }
    setSaving(true);
    try {
      const { error: err } = await withTimeout(
        supabase.from('users').update(
          on
            ? { email_nudge_opt_in: true, email_nudge_opt_in_at: new Date().toISOString() }
            : { email_nudge_opt_in: false }
        ).eq('id', userId)
      );
      if (err) throw err;
      setEnabled(on);
      if (on) setConsent(false);
    } catch {
      setError(t('nudge.error_save'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.white, borderColor: colors.borderLight }]}>
      <Text style={[styles.title, { color: colors.slate }]}>{t('nudge.title')}</Text>
      <Text style={[styles.body, { color: colors.slateMid }]}>{t('nudge.body')}</Text>

      {loading ? (
        <ActivityIndicator color={colors.slateMid} />
      ) : enabled ? (
        <>
          <Text style={[styles.on, { color: colors.aligned }]}>● {t('nudge.on_label', { email })}</Text>
          <TouchableOpacity onPress={() => save(false)} disabled={saving} style={[styles.btnGhost, { borderColor: colors.border }]}>
            <Text style={[styles.btnGhostText, { color: colors.slateMid }]}>{t('nudge.turn_off')}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TouchableOpacity
            onPress={() => setConsent((c) => !c)}
            style={styles.consentRow}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: consent }}
          >
            <View style={[styles.box, { borderColor: colors.slateMid, backgroundColor: consent ? colors.slate : 'transparent' }]}>
              {consent && <Text style={{ color: colors.cream, fontSize: 12 }}>✓</Text>}
            </View>
            <Text style={[styles.consentText, { color: colors.slateMid }]}>{t('nudge.consent')}</Text>
          </TouchableOpacity>
          {error && <Text style={[styles.error, { color: colors.underLoad }]}>{error}</Text>}
          <TouchableOpacity onPress={() => save(true)} disabled={saving} style={[styles.btn, { backgroundColor: colors.slate }]}>
            <Text style={[styles.btnText, { color: colors.cream }]}>{saving ? t('nudge.saving') : t('nudge.turn_on')}</Text>
          </TouchableOpacity>
        </>
      )}
      {enabled && error && <Text style={[styles.error, { color: colors.underLoad }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: RADIUS.lg, borderWidth: 1, padding: SPACING.md, gap: SPACING.sm },
  title: { fontSize: FONT_SIZE.base, fontWeight: '600' },
  body: { fontSize: FONT_SIZE.sm, lineHeight: 20 },
  consentRow: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start' },
  box: { width: 20, height: 20, borderWidth: 1.5, borderRadius: 5, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  consentText: { flex: 1, fontSize: FONT_SIZE.xs, lineHeight: 18 },
  error: { fontSize: FONT_SIZE.xs },
  btn: { borderRadius: RADIUS.md, paddingVertical: 13, alignItems: 'center' },
  btnText: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  btnGhost: { borderRadius: RADIUS.md, borderWidth: 1, paddingVertical: 12, alignItems: 'center' },
  btnGhostText: { fontSize: FONT_SIZE.sm, fontWeight: '500' },
  on: { fontSize: FONT_SIZE.sm, fontWeight: '500' },
});
