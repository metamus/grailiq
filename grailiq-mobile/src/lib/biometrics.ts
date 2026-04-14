import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Biometric "app lock" for GrailIQ mobile.
 *
 * Design:
 *   - Not used as the primary auth — Supabase email/OAuth is still the
 *     system of record.
 *   - Used as a SECOND factor that gates app re-entry after backgrounding.
 *     When enabled, the app challenges with FaceID/TouchID/fingerprint on
 *     cold launch and after the configured idle timeout.
 *   - Preference is stored in SecureStore so nothing sensitive lives in
 *     AsyncStorage. A disabled preference means skip the biometric prompt.
 */

const PREF_KEY = 'biometric.enabled';
const LAST_UNLOCK_KEY = 'biometric.lastUnlockAt';
const DEFAULT_IDLE_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

export interface BiometricCapability {
  available: boolean;
  hasHardware: boolean;
  enrolled: boolean;
  types: LocalAuthentication.AuthenticationType[];
  label: string; // "Face ID" | "Touch ID" | "Fingerprint" | "Biometrics"
}

export async function getCapability(): Promise<BiometricCapability> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const enrolled = hasHardware ? await LocalAuthentication.isEnrolledAsync() : false;
  const types: LocalAuthentication.AuthenticationType[] =
    hasHardware ? await LocalAuthentication.supportedAuthenticationTypesAsync() : [];

  let label = 'Biometrics';
  if (Platform.OS === 'ios') {
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      label = 'Face ID';
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      label = 'Touch ID';
    }
  } else if (Platform.OS === 'android') {
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      label = 'Fingerprint';
    } else if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      label = 'Face Unlock';
    }
  }

  return {
    available: hasHardware && enrolled,
    hasHardware,
    enrolled,
    types,
    label,
  };
}

export async function isBiometricEnabled(): Promise<boolean> {
  const v = await SecureStore.getItemAsync(PREF_KEY);
  return v === '1';
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  if (enabled) await SecureStore.setItemAsync(PREF_KEY, '1');
  else await SecureStore.deleteItemAsync(PREF_KEY);
}

export async function promptBiometric(
  reason = 'Unlock GrailIQ',
): Promise<{ success: boolean; error?: string }> {
  const cap = await getCapability();
  if (!cap.available) return { success: false, error: 'unavailable' };

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    fallbackLabel: 'Use passcode',
    cancelLabel: 'Cancel',
    disableDeviceFallback: false,
  });

  if (result.success) {
    await SecureStore.setItemAsync(LAST_UNLOCK_KEY, String(Date.now()));
    return { success: true };
  }
  return { success: false, error: result.error };
}

/**
 * Should the app challenge for biometrics right now?
 *
 *  - `true` if the user enabled biometric lock AND more than
 *    `idleTimeoutMs` has passed since the last successful unlock.
 *  - `false` otherwise (including when biometric lock is disabled).
 */
export async function shouldChallenge(
  idleTimeoutMs = DEFAULT_IDLE_TIMEOUT_MS,
): Promise<boolean> {
  const enabled = await isBiometricEnabled();
  if (!enabled) return false;
  const last = await SecureStore.getItemAsync(LAST_UNLOCK_KEY);
  if (!last) return true;
  const ts = parseInt(last, 10);
  if (!Number.isFinite(ts)) return true;
  return Date.now() - ts > idleTimeoutMs;
}

export async function resetUnlockClock(): Promise<void> {
  await SecureStore.deleteItemAsync(LAST_UNLOCK_KEY);
}
