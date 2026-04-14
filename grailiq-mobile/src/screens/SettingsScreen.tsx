import { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  getCapability,
  isBiometricEnabled,
  setBiometricEnabled,
  promptBiometric,
  type BiometricCapability,
} from '../lib/biometrics';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/useAuthStore';
import { colors, fontSize } from '../theme/colors';

export function SettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const tier = useAuthStore((s) => s.tier);
  const nav = useNavigation<any>();

  const [capability, setCapability] = useState<BiometricCapability | null>(null);
  const [bioOn, setBioOn] = useState(false);

  useEffect(() => {
    (async () => {
      setCapability(await getCapability());
      setBioOn(await isBiometricEnabled());
    })();
  }, []);

  const handleToggleBio = async (next: boolean) => {
    if (!capability?.available) {
      Alert.alert(
        `${capability?.label ?? 'Biometrics'} not available`,
        capability?.hasHardware
          ? 'You have no biometrics enrolled on this device. Add one in Settings first.'
          : 'This device does not support biometric authentication.',
      );
      return;
    }

    // Require fresh prompt before enabling — proves the user can actually unlock.
    if (next) {
      const result = await promptBiometric('Enable app lock');
      if (!result.success) return;
    }

    setBioOn(next);
    await setBiometricEnabled(next);
  };

  const handleSignOut = async () => {
    Alert.alert('Sign out?', 'You will need to sign in again to access your portfolio.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Account */}
      <Section title="Account">
        <Row label="Signed in as" value={user?.email ?? '—'} />
        <Row label="Plan" value={formatTier(tier)} valueAccent />
      </Section>

      {/* Security */}
      <Section title="Security">
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>
              {capability?.label ?? 'Biometrics'} app lock
            </Text>
            <Text style={styles.rowHint}>
              Require authentication to open GrailIQ after backgrounding.
            </Text>
          </View>
          <Switch
            value={bioOn}
            onValueChange={handleToggleBio}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#fff"
            disabled={!capability?.hasHardware}
          />
        </View>
        {!capability?.available && capability?.hasHardware && (
          <Text style={styles.warning}>
            Enroll {capability.label} in your device settings to enable this.
          </Text>
        )}
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => nav.navigate('NotificationPrefs')}
          style={styles.row}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>Notification preferences</Text>
            <Text style={styles.rowHint}>
              Channels (email / push) + quiet hours per alert type.
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <Row
          label="Permission"
          value="Managed in device Settings"
          hint="Restock alerts deliver via Expo Push when enabled."
        />
      </Section>

      {/* About */}
      <Section title="About">
        <Row label="Version" value="1.0.0" />
        <Row label="API" value="grailiq-production.up.railway.app" />
      </Section>

      <TouchableOpacity style={styles.signOut} onPress={handleSignOut} activeOpacity={0.85}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function formatTier(tier: 'free' | 'collector' | 'investor'): string {
  if (tier === 'free') return 'Free';
  if (tier === 'collector') return 'Collector';
  return 'Investor';
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Row({
  label,
  value,
  valueAccent,
  hint,
}: {
  label: string;
  value?: string;
  valueAccent?: boolean;
  hint?: string;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {hint && <Text style={styles.rowHint}>{hint}</Text>}
      </View>
      {value && (
        <Text
          style={[styles.rowValue, valueAccent && { color: colors.primary, fontWeight: '700' }]}
          numberOfLines={1}
        >
          {value}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.textMuted,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 12,
  },
  rowLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  rowHint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 3,
    lineHeight: 16,
  },
  rowValue: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    maxWidth: '55%',
    textAlign: 'right',
  },
  warning: {
    fontSize: fontSize.xs,
    color: colors.warning,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.warning + '10',
  },
  signOut: {
    marginTop: 28,
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.avoid + '66',
    backgroundColor: colors.avoid + '15',
  },
  signOutText: {
    color: colors.avoid,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  chevron: {
    color: colors.textMuted,
    fontSize: 20,
    fontWeight: '400',
  },
});
