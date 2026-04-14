import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing, fontSize } from '../theme/colors';

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  valueColor?: string;
}

export function StatCard({ label, value, subtitle, valueColor }: StatCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, valueColor ? { color: valueColor } : undefined]}>
        {value}
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    flex: 1,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  value: {
    color: colors.text,
    fontSize: fontSize['2xl'],
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
});
