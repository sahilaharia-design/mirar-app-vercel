import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { withTimeout } from '../../lib/with-timeout';
import { useColors } from '../../contexts/theme-context';
import { FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';
import { normalizePhone } from '../../lib/phone';

// The daily cue: one WhatsApp message each morning with a link to check in.
// Consent is an explicit, un-pre-ticked choice (Meta policy + India's DPDP
// Act), recorded with a timestamp, and turning it off clears the number.
export function MorningNudgeCard({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const colors = useColors();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [savedNumber, setSavedNumber] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await withTimeout(
          supabase.from('users').select('whatsapp_number, whatsapp_opt_in').eq('id', userId).maybeSingle()
        );
        if (mounted && data) {
          setEnabled(!!data.whatsapp_opt_in);
          setSavedNumber(data.whatsapp_number ?? null);
        }
      } catch {
        // Column may not exist yet (migration 013 not run) — card stays in its "off" state.
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [userId]);

  const turnOn = async () => {
    setError(null);
    const normalized = normalizePhone(phone);
    if (!normalized) { setError(t('nudge.error_number')); return; }
    if (!consent) { setError(t('nudge.error_consent')); return; }
    setSaving(true);
    try {
      const { error: err } = await withTimeout(
        supabase.from('users').update({
          whatsapp_number: normalized,
          whatsapp_opt_in: true,
          whatsapp_opt_in_at: new Date().toISOString(),
        }).eq('id', userId)
      );
      if (err) throw err;
      setEnabled(true); setSavedNumber(normalized); setPhone(''); setConsent(false);
    } catch {
      setError(t('nudge.error_save'));
    } finally {
      setSaving(false);
    }
  };

  const turnOff = async () => {
    setError(null);
    setSaving(true);
    try {
      const { error: err } = await withTimeout(
        supabase.from('users').update({ whatsapp_opt_in: false, whatsapp_number: null }).eq('id', userId)
      );
      if (err) throw err;
      setEnabled(false); setSavedNumber(null);
    } catch {
      setError(t('nudge.error_save'));
    } finally {
      setSaving(false);
    }
  };

  const masked = savedNumber ? savedNumber.slice(0, 3) + ' •••••• ' + savedNumber.slice(-3) : '';

  return (
    <View style={[styles.card, { backgroundColor: colors.white, borderColor: colors.borderLight }]}>
      <Text style={[styles.title, { color: colors.slate }]}>{t('nudge.title')}</Text>
      <Text style={[styles.body, { color: colors.slateMid }]}>{t('nudge.body')}</Text>

      {loading ? (
        <ActivityIndicator color={colors.slateMid} />
      ) : enabled ? (
        <>
          <Text style={[styles.on, { color: colors.aligned }]}>● {t('nudge.on_label', { number: masked })}</Text>
          <TouchableOpacity onPress={turnOff} disabled={saving} style={[styles.btnGhost, { borderColor: colors.border }]}>
            <Text style={[styles.btnGhostText, { color: colors.slateMid }]}>{t('nudge.turn_off')}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder={t('nudge.placeholder')}
            placeholderTextColor={colors.slateLight}
            keyboardType="phone-pad"
            style={[styles.input, { borderColor: colors.border, color: colors.slate, backgroundColor: colors.cream }]}
            accessibilityLabel={t('nudge.title')}
          />
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
          <TouchableOpacity onPress={turnOn} disabled={saving} style={[styles.btn, { backgroundColor: colors.slate }]}>
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
  input: { borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 12, fontSize: FONT_SIZE.base },
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
