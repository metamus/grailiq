import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../theme/colors';
import { supabase } from '../lib/supabase';
import { signInWithProvider } from '../lib/oauth';

type AuthMode = 'sign_in' | 'sign_up' | 'reset';

export function SignInScreen() {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>('sign_in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleEmailAuth = async () => {
    if (!email) {
      Alert.alert('Missing email', 'Enter your email to continue.');
      return;
    }
    if (mode !== 'reset' && password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'sign_up') {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        Alert.alert(
          'Check your email',
          'We sent you a confirmation link. Verify to continue.',
        );
      } else if (mode === 'sign_in') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
        if (error) throw error;
        Alert.alert('Check your email', 'Password reset link sent.');
        setMode('sign_in');
      }
    } catch (error: any) {
      Alert.alert('Auth error', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setLoading(true);
    const result = await signInWithProvider(provider);
    setLoading(false);
    if (!result.ok && result.error !== 'canceled') {
      Alert.alert(
        'Sign-in failed',
        result.error === 'no_auth_url'
          ? `${provider} is not enabled in Supabase Auth yet.`
          : (result.error ?? 'Try again in a moment.'),
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <Text style={styles.logo}>GrailIQ</Text>
        <Text style={styles.tagline}>Pokemon TCG Price Intelligence</Text>
        <Text style={styles.subtitle}>
          Track prices, manage your sealed collection, and get restock alerts.
        </Text>

        {/* Features */}
        <View style={styles.features}>
          <FeatureRow emoji="📊" text="Real-time price tracking across TCGPlayer & eBay" />
          <FeatureRow emoji="💼" text="Portfolio tracker with P&L analysis" />
          <FeatureRow emoji="🔔" text="Instant restock alerts from 5+ retailers" />
          <FeatureRow emoji="🧠" text="GrailIQ Score — AI-powered investment signals" />
        </View>

        {/* OAuth */}
        {mode !== 'reset' && (
          <View style={styles.oauthGroup}>
            <TouchableOpacity
              style={styles.oauthButton}
              onPress={() => handleOAuth('google')}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.oauthButtonText}>Continue with Google</Text>
            </TouchableOpacity>
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={[styles.oauthButton, styles.appleButton]}
                onPress={() => handleOAuth('apple')}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text style={[styles.oauthButtonText, styles.appleButtonText]}>
                   Continue with Apple
                </Text>
              </TouchableOpacity>
            )}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or email</Text>
              <View style={styles.dividerLine} />
            </View>
          </View>
        )}

        {/* Email/Password Form */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {mode !== 'reset' && (
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          )}

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleEmailAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>
                {mode === 'sign_in'
                  ? 'Sign In'
                  : mode === 'sign_up'
                  ? 'Create Account'
                  : 'Send reset link'}
              </Text>
            )}
          </TouchableOpacity>

          {mode === 'sign_in' && (
            <TouchableOpacity onPress={() => setMode('reset')} style={styles.toggleButton}>
              <Text style={styles.toggleText}>Forgot password?</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => setMode(mode === 'sign_in' ? 'sign_up' : 'sign_in')}
            style={styles.toggleButton}
          >
            <Text style={styles.toggleText}>
              {mode === 'sign_in'
                ? "Don't have an account? Sign Up"
                : mode === 'sign_up'
                ? 'Already have an account? Sign In'
                : 'Back to sign in'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FeatureRow({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureEmoji}>{emoji}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing['3xl'],
  },
  logo: {
    color: colors.primary,
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -2,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  tagline: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.base,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing['2xl'],
  },
  features: {
    marginBottom: spacing['3xl'],
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  featureEmoji: {
    fontSize: 20,
    marginRight: spacing.md,
    width: 28,
  },
  featureText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    flex: 1,
    lineHeight: 20,
  },
  oauthGroup: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  oauthButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.overlay05,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  oauthButtonText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  appleButton: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  appleButtonText: {
    color: '#000',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  form: {
    gap: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    color: colors.text,
    fontSize: fontSize.base,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: '700',
  },
  toggleButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  toggleText: {
    color: colors.primaryLight,
    fontSize: fontSize.sm,
  },
});
