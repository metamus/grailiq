import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../theme/colors';
import { supabase } from '../lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

export function SignInScreen() {
  const [loading, setLoading] = useState(false);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const redirectTo = makeRedirectUri();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type === 'success') {
          const url = new URL(result.url);
          const params = new URLSearchParams(url.hash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          if (accessToken && refreshToken) {
            await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          }
        }
      }
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setLoading(false);
    }
  };

  const signInWithApple = async () => {
    setLoading(true);
    try {
      const redirectTo = makeRedirectUri();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type === 'success') {
          const url = new URL(result.url);
          const params = new URLSearchParams(url.hash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          if (accessToken && refreshToken) {
            await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          }
        }
      }
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <Text style={styles.logo}>GrailIQ</Text>
        <Text style={styles.tagline}>
          Pokemon TCG Price Intelligence
        </Text>
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

        {/* Auth Buttons */}
        <View style={styles.authButtons}>
          <TouchableOpacity
            style={styles.googleButton}
            onPress={signInWithGoogle}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.black} />
            ) : (
              <Text style={styles.googleText}>Continue with Google</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.appleButton}
            onPress={signInWithApple}
            disabled={loading}
          >
            <Text style={styles.appleText}>Continue with Apple</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
    justifyContent: 'center',
  },
  content: {
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
    marginBottom: spacing['3xl'],
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
  authButtons: {
    gap: spacing.md,
  },
  googleButton: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  googleText: {
    color: colors.black,
    fontSize: fontSize.base,
    fontWeight: '700',
  },
  appleButton: {
    backgroundColor: colors.black,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  appleText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: '700',
  },
});
