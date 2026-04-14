import { StyleSheet, Switch, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useMe, useUpdateNotifPrefs, type NotifPrefs } from '../hooks/useMe';
import { LoadingScreen } from '../components/LoadingScreen';
import { colors, fontSize, spacing, borderRadius } from '../theme/colors';

/**
 * Mobile notification preferences screen. Wrapped in Settings stack.
 * Reads GET /me, writes via PATCH /me/notifications. Optimistic feel —
 * the Switch flips immediately and the mutation reconciles on success.
 */
export function NotificationPrefsScreen() {
  const { data: me, isLoading } = useMe();
  const update = useUpdateNotifPrefs();

  if (isLoading || !me) return <LoadingScreen />;
  const prefs = me.notificationPrefs;

  function patch(partial: Partial<NotifPrefs>) {
    update.mutate(partial, {
      onError: () => Alert.alert('Could not save', 'Check your connection and try again.'),
    });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Section title="Restock alerts" hint="When a product you're alerting on is back in stock.">
        <Row
          label="Email"
          value={prefs.restock.email}
          onChange={(v) => patch({ restock: { ...prefs.restock, email: v } })}
        />
        <Row
          label="Push"
          value={prefs.restock.push}
          onChange={(v) => patch({ restock: { ...prefs.restock, push: v } })}
          last
        />
      </Section>

      <Section title="Price target" hint="When a watchlist item hits your target price.">
        <Row
          label="Email"
          value={prefs.priceTarget.email}
          onChange={(v) => patch({ priceTarget: { ...prefs.priceTarget, email: v } })}
        />
        <Row
          label="Push"
          value={prefs.priceTarget.push}
          onChange={(v) => patch({ priceTarget: { ...prefs.priceTarget, push: v } })}
          last
        />
      </Section>

      <Section
        title="Weekly digest"
        hint="Top movers + your portfolio snapshot on Monday mornings (Investor tier)."
      >
        <Row
          label="Email"
          value={prefs.weeklyDigest.email}
          onChange={(v) => patch({ weeklyDigest: { email: v } })}
          last
        />
      </Section>

      <Section
        title="Quiet hours"
        hint="Suppress push notifications during these hours. Email isn't affected."
      >
        <Row
          label="Enabled"
          value={prefs.quietHours.enabled}
          onChange={(v) => patch({ quietHours: { ...prefs.quietHours, enabled: v } })}
          last
        />
        <View style={styles.quietDetail}>
          <Text style={styles.quietText}>
            {prefs.quietHours.start} – {prefs.quietHours.end} ({prefs.quietHours.timezone})
          </Text>
          <Text style={styles.quietHint}>Adjust hours on the web at grailiq.com/app/settings</Text>
        </View>
      </Section>

      <TouchableOpacity
        onPress={() =>
          patch({
            restock: { email: true, push: true },
            priceTarget: { email: true, push: true },
            weeklyDigest: { email: true },
            quietHours: { enabled: false, start: '22:00', end: '07:00', timezone: 'UTC' },
          })
        }
        style={styles.reset}
      >
        <Text style={styles.resetText}>Reset to defaults</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {hint && <Text style={styles.sectionHint}>{hint}</Text>}
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Row({
  label,
  value,
  onChange,
  last,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.textMuted,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  sectionHint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    paddingHorizontal: 4,
    lineHeight: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  quietDetail: {
    padding: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  quietText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  quietHint: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 4,
  },
  reset: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  resetText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
