import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing, fontSize } from '../theme/colors';

type Signal = 'buy' | 'hold' | 'watch' | 'avoid';

const SIGNAL_CONFIG: Record<Signal, { bg: string; text: string; border: string; label: string }> = {
  buy: { bg: 'rgba(34,197,94,0.12)', text: colors.buy, border: 'rgba(34,197,94,0.35)', label: 'BUY' },
  hold: { bg: 'rgba(245,158,11,0.12)', text: colors.hold, border: 'rgba(245,158,11,0.35)', label: 'HOLD' },
  watch: { bg: 'rgba(100,116,139,0.18)', text: '#CBD5E1', border: 'rgba(100,116,139,0.45)', label: 'WATCH' },
  avoid: { bg: 'rgba(239,68,68,0.12)', text: colors.avoid, border: 'rgba(239,68,68,0.35)', label: 'AVOID' },
};

interface SignalBadgeProps {
  signal: Signal | null;
  size?: 'sm' | 'md';
}

export function SignalBadge({ signal, size = 'sm' }: SignalBadgeProps) {
  if (!signal) return null;
  const config = SIGNAL_CONFIG[signal];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg, borderColor: config.border },
        size === 'md' && styles.badgeMd,
      ]}
    >
      <Text style={[styles.text, { color: config.text }, size === 'md' && styles.textMd]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  badgeMd: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textMd: {
    fontSize: fontSize.sm,
  },
});
