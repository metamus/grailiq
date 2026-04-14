import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { promptBiometric, shouldChallenge, resetUnlockClock, getCapability } from '../lib/biometrics';
import { useAuthStore } from '../stores/useAuthStore';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';

/**
 * Wrap the app tree with <BiometricGate>. When the user has enabled
 * biometric lock, it shows a blocking overlay on cold launch and after the
 * app returns from background (with a short idle timeout).
 *
 *   - If no user is signed in, never shows (Supabase auth handles that).
 *   - If biometric is disabled or hardware unavailable, renders children.
 *   - On successful unlock, renders children and refreshes the unlock clock.
 */
export function BiometricGate({ children }: { children: React.ReactNode }) {
  const session = useAuthStore((s) => s.session);
  const [locked, setLocked] = useState(false);
  const [label, setLabel] = useState('Face ID');
  const promptingRef = useRef(false);

  const evaluate = useCallback(async () => {
    if (!session) {
      setLocked(false);
      return;
    }
    const cap = await getCapability();
    setLabel(cap.label);
    const challenge = await shouldChallenge();
    setLocked(challenge);
  }, [session]);

  // Initial + on sign-in evaluation
  useEffect(() => {
    void evaluate();
  }, [evaluate]);

  // Challenge on app foregrounding
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'background' || next === 'inactive') {
        // Expire the unlock clock when app goes to background so foreground
        // re-entry forces a fresh biometric prompt per idle timeout logic.
        // (We don't clear immediately — `shouldChallenge` handles the timeout.)
      } else if (next === 'active') {
        void evaluate();
      }
    });
    return () => sub.remove();
  }, [evaluate]);

  // Auto-prompt once when locked
  useEffect(() => {
    const run = async () => {
      if (!locked || promptingRef.current) return;
      promptingRef.current = true;
      const result = await promptBiometric(`Unlock GrailIQ`);
      promptingRef.current = false;
      if (result.success) setLocked(false);
    };
    void run();
  }, [locked]);

  const handleRetry = async () => {
    const result = await promptBiometric(`Unlock GrailIQ`);
    if (result.success) setLocked(false);
  };

  const handleSignOut = async () => {
    await resetUnlockClock();
    await supabase.auth.signOut();
  };

  if (!locked || !session) return <>{children}</>;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>🔒</Text>
        </View>
        <Text style={styles.title}>GrailIQ is locked</Text>
        <Text style={styles.subtitle}>
          Authenticate with {label} to access your portfolio and alerts.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={handleRetry} activeOpacity={0.85}>
          <Text style={styles.primaryButtonText}>Use {label}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSignOut} activeOpacity={0.7}>
          <Text style={styles.linkText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 9999,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  iconCircle: {
    height: 72,
    width: 72,
    borderRadius: 36,
    backgroundColor: colors.primary + '22',
    borderWidth: 1,
    borderColor: colors.primary + '44',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconText: { fontSize: 32 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  linkText: {
    color: colors.textMuted,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
