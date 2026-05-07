import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import { useMoneyMateStore } from '../store';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../constants';

interface BiometricLockProps {
  children: React.ReactNode;
}

const BiometricLock: React.FC<BiometricLockProps> = ({ children }) => {
  const biometricEnabled = useMoneyMateStore(s => s.settings.biometricEnabled);
  const [unlocked, setUnlocked] = useState(!biometricEnabled);

  const authenticate = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) {
        Alert.alert(
          'Biometrics unavailable',
          'No biometrics are enrolled on this device. Disabling biometric lock.',
          [{ text: 'OK', onPress: () => setUnlocked(true) }]
        );
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock MoneyMate',
        fallbackLabel: 'Use device passcode',
      });
      if (result.success) {
        setUnlocked(true);
      }
    } catch {
      // ignore — user can retry
    }
  };

  useEffect(() => {
    if (biometricEnabled && !unlocked) {
      authenticate();
    }
  }, [biometricEnabled]);

  if (!biometricEnabled || unlocked) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      <Ionicons name="lock-closed" size={64} color={COLORS.primary} />
      <Text style={styles.title}>MoneyMate is locked</Text>
      <Text style={styles.subtitle}>Authenticate to continue</Text>
      <TouchableOpacity style={styles.button} onPress={authenticate}>
        <Ionicons name="finger-print" size={20} color="white" />
        <Text style={styles.buttonText}>Unlock</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  buttonText: {
    color: 'white',
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
});

export default BiometricLock;
