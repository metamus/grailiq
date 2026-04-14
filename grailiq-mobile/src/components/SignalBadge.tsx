import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing, fontSize } from '../theme/colors';

type Signal = 'buy' | 'hold' | 'watch' | 'avoid';

const SIGNAL_CONFIG: Record<Signal, { bg: string; text: string; label: string }> = {
  buy: { bg: '#05966915', text: colors.buy, label: 'BUY' },
  hold: { bg: '#D9770615', text: colors.hold, label: 'HOLD' },
  watch: { bg: '#6B728015', text: colors.watch, label: 'WATCH' },
  avoid: { bg: '#DC262615', text: colors.avoid, label: 'AVOID' },
};

interface SignalBadgeProps {
  signal: Signal | null;
  size?: 'sm' | 'md';
}

export function SignalBadge({ signal, size = 'sm' }: SignalBadgeProps) {
  if (!signal) return null;
  const config = SIGNAL_CONFIG[signal];

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, size === 'md' && styles.badgeMd]}>
      <Text style={[styles.text, { color: config.text }, size === 'md' && styles.textMd]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
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
