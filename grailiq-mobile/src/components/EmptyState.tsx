import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../theme/colors';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity style={styles.button} onPress={onAction}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['3xl'],
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  description: {
    color: colors.textSecondary,
    fontSize: fontSize.base,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  buttonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: '600',
  },
});
