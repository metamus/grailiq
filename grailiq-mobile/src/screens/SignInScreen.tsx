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

type AuthMode = 'sign_in' | 'sign_up';

export function SignInScreen() {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>('sign_in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter both email and password.');
      return;
    }
    if (password.length < 6) {
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
          'We sent you a confirmation link. Please verify your email to continue.',
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      Alert.alert('Auth error', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
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
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleEmailAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>
                {mode === 'sign_in' ? 'Sign In' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setMode(mode === 'sign_in' ? 'sign_up' : 'sign_in')}
            style={styles.toggleButton}
          >
            <Text style={styles.toggleText}>
              {mode === 'sign_in'
                ? "Don't have an account? Sign Up"
                : 'Already have an account? Sign In'}
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
