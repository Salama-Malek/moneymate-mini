import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useMoneyMateStore } from '../store';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONT_SIZES, REMINDER_OPTIONS } from '../constants';
import { testNotification } from '../utils';
import { soundVibrationService } from '../utils/soundVibrationService';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation';

type NotificationSettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'NotificationSettings'>;

const NotificationSettingsScreen: React.FC = () => {
  const navigation = useNavigation<NotificationSettingsScreenNavigationProp>();
  const { settings, updateSettings } = useMoneyMateStore();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleNotificationToggle = async (enabled: boolean) => {
    await soundVibrationService.buttonPress();
    updateSettings({
      notifications: { ...settings.notifications, enabled },
    });
  };

  const handleReminderToggle = async (days: number) => {
    await soundVibrationService.buttonPress();
    const currentReminders = settings.notifications.reminderDays;
    const newReminders = currentReminders.includes(days)
      ? currentReminders.filter(d => d !== days)
      : [...currentReminders, days];

    updateSettings({
      notifications: { ...settings.notifications, reminderDays: newReminders },
    });
  };

  const handleSoundToggle = async (enabled: boolean) => {
    await soundVibrationService.buttonPress();
    updateSettings({
      notifications: { ...settings.notifications, sound: enabled },
    });
    soundVibrationService.setSoundEnabled(enabled);
  };

  const handleVibrationToggle = async (enabled: boolean) => {
    await soundVibrationService.buttonPress();
    updateSettings({
      notifications: { ...settings.notifications, vibration: enabled },
    });
    soundVibrationService.setVibrationEnabled(enabled);
  };

  const handleHapticsToggle = async (enabled: boolean) => {
    await soundVibrationService.buttonPress();
    updateSettings({
      notifications: { ...settings.notifications, haptics: enabled },
    });
    soundVibrationService.setHapticsEnabled(enabled);
  };

  const handleTestNotification = async () => {
    await soundVibrationService.buttonPress();
    
    try {
      const success = await testNotification(settings.notifications);
      if (success) {
        Alert.alert(
          'Test Notification Sent',
          'Check your notification panel to see how it looks with your current settings.',
          [
            { text: 'OK', onPress: () => soundVibrationService.successAction() },
          ]
        );
      } else {
        throw new Error('Failed to send test notification');
      }
    } catch (error) {
      Alert.alert(
        'Test Failed',
        'Unable to send test notification. Please check your notification permissions.',
        [
          { text: 'OK', onPress: () => soundVibrationService.formValidation() },
        ]
      );
    }
  };

  const handleTestHaptics = async () => {
    await soundVibrationService.buttonPress();
    
    Alert.alert(
      'Test Haptic Feedback',
      'Choose a haptic feedback type to test:',
      [
        { text: 'Light', onPress: () => soundVibrationService.triggerHaptic('light') },
        { text: 'Medium', onPress: () => soundVibrationService.triggerHaptic('medium') },
        { text: 'Heavy', onPress: () => soundVibrationService.triggerHaptic('heavy') },
        { text: 'Success', onPress: () => soundVibrationService.triggerHaptic('success') },
        { text: 'Warning', onPress: () => soundVibrationService.triggerHaptic('warning') },
        { text: 'Error', onPress: () => soundVibrationService.triggerHaptic('error') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleTestVibration = async () => {
    await soundVibrationService.buttonPress();
    
    Alert.alert(
      'Test Vibration',
      'Choose a vibration pattern to test:',
      [
        { text: 'Short', onPress: () => soundVibrationService.triggerVibration('short') },
        { text: 'Medium', onPress: () => soundVibrationService.triggerVibration('medium') },
        { text: 'Long', onPress: () => soundVibrationService.triggerVibration('long') },
        { text: 'Notification', onPress: () => soundVibrationService.triggerVibration('notification') },
        { text: 'Success', onPress: () => soundVibrationService.triggerVibration('success') },
        { text: 'Warning', onPress: () => soundVibrationService.triggerVibration('warning') },
        { text: 'Error', onPress: () => soundVibrationService.triggerVibration('error') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const renderSettingItem = (
    icon: keyof typeof Ionicons.glyphMap,
    title: string,
    subtitle: string,
    rightElement: React.ReactNode
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingItemLeft}>
        <View style={styles.settingIcon}>
          <Ionicons name={icon} size={24} color={COLORS.primary} />
        </View>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <View style={styles.settingItemRight}>
        {rightElement}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header Info */}
        <View style={styles.headerSection}>
          <View style={styles.headerCard}>
            <View style={[styles.headerIcon, { backgroundColor: COLORS.primary }]}>
              <Ionicons name="notifications" size={32} color="white" />
            </View>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Notification Settings</Text>
              <Text style={styles.headerSubtitle}>
                Configure how and when you receive payment reminders
              </Text>
            </View>
          </View>
        </View>

        {/* Main Toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          
          {renderSettingItem(
            'notifications',
            'Enable Notifications',
            'Turn on all notification features',
            <Switch
              value={settings.notifications.enabled}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor="white"
            />
          )}
        </View>

        {settings.notifications.enabled && (
          <>
            {/* Reminder Timing */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reminder Timing</Text>
              <Text style={styles.sectionDescription}>
                Choose when you want to receive payment reminders before the due date
              </Text>
              
              <View style={styles.reminderOptions}>
                {REMINDER_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.reminderOption,
                      settings.notifications.reminderDays.includes(option.value) && styles.reminderOptionActive,
                    ]}
                    onPress={() => handleReminderToggle(option.value)}
                  >
                    <View style={styles.reminderOptionLeft}>
                      <Ionicons
                        name={settings.notifications.reminderDays.includes(option.value) ? 'checkmark-circle' : 'ellipse-outline'}
                        size={24}
                        color={settings.notifications.reminderDays.includes(option.value) ? COLORS.primary : COLORS.textSecondary}
                      />
                      <Text
                        style={[
                          styles.reminderOptionText,
                          settings.notifications.reminderDays.includes(option.value) && styles.reminderOptionTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </View>
                    <View style={styles.reminderOptionRight}>
                      <Text style={styles.reminderOptionDescription}>
                        {option.value === 1 ? '1 day before due date' : `${option.value} days before due date`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Notification Preferences */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notification Preferences</Text>
              
              {renderSettingItem(
                'volume-high',
                'Sound',
                'Play a sound when notifications arrive',
                <Switch
                  value={settings.notifications.sound}
                  onValueChange={handleSoundToggle}
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                  thumbColor="white"
                />
              )}

              {renderSettingItem(
                'phone-portrait',
                'Vibration',
                'Vibrate your device for notifications',
                <Switch
                  value={settings.notifications.vibration}
                  onValueChange={handleVibrationToggle}
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                  thumbColor="white"
                />
              )}

              {renderSettingItem(
                'hand-left',
                'Haptic Feedback',
                'Provide tactile feedback for interactions',
                <Switch
                  value={settings.notifications.haptics}
                  onValueChange={handleHapticsToggle}
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                  thumbColor="white"
                />
              )}

              {renderSettingItem(
                'musical-notes',
                'Custom Sounds',
                'Choose custom sounds from your device',
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: COLORS.primary }]}
                  onPress={() => {
                    // For now, show an alert. In a full implementation, you'd present the custom sound selector
                    Alert.alert(
                      'Custom Sounds',
                      'Custom sound selection feature is available. This would open a sound picker where you can choose audio files from your device.',
                      [{ text: 'OK' }]
                    );
                  }}
                >
                  <Text style={styles.actionButtonText}>Configure</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Notification Preview */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Preview</Text>
              <Text style={styles.sectionDescription}>
                See how your notifications will look with current settings
              </Text>
              
              <View style={styles.previewCard}>
                <View style={styles.previewHeader}>
                  <Ionicons name="notifications" size={20} color={COLORS.primary} />
                  <Text style={styles.previewTitle}>Payment Reminder</Text>
                </View>
                <Text style={styles.previewBody}>
                  Ahmed - 500 EGP due in 3 days
                </Text>
                <View style={styles.previewFooter}>
                  <Text style={styles.previewTime}>Just now</Text>
                  {settings.notifications.sound && (
                    <Ionicons name="volume-high" size={16} color={COLORS.textSecondary} />
                  )}
                  {settings.notifications.vibration && (
                    <Ionicons name="phone-portrait" size={16} color={COLORS.textSecondary} />
                  )}
                  {settings.notifications.haptics && (
                    <Ionicons name="hand-left" size={16} color={COLORS.textSecondary} />
                  )}
                </View>
              </View>

              <View style={styles.testButtonsContainer}>
                <TouchableOpacity style={styles.testButton} onPress={handleTestNotification}>
                  <Ionicons name="notifications" size={20} color="white" />
                  <Text style={styles.testButtonText}>Test Notification</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.testButton, styles.testButtonSecondary]} onPress={handleTestHaptics}>
                  <Ionicons name="hand-left" size={20} color="white" />
                  <Text style={styles.testButtonText}>Test Haptics</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.testButton, styles.testButtonSecondary]} onPress={handleTestVibration}>
                  <Ionicons name="phone-portrait" size={20} color="white" />
                  <Text style={styles.testButtonText}>Test Vibration</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Help */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Help & Tips</Text>
              
              <View style={styles.helpCard}>
                <View style={styles.helpItem}>
                  <Ionicons name="information-circle" size={20} color={COLORS.primary} />
                  <Text style={styles.helpText}>
                    Notifications are sent locally and don't require internet connection
                  </Text>
                </View>
                
                <View style={styles.helpItem}>
                  <Ionicons name="time" size={20} color={COLORS.warning} />
                  <Text style={styles.helpText}>
                    Reminders are scheduled based on transaction due dates
                  </Text>
                </View>
                
                <View style={styles.helpItem}>
                  <Ionicons name="archive" size={20} color={COLORS.textSecondary} />
                  <Text style={styles.helpText}>
                    Notifications stop automatically for archived transactions
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Disabled State */}
        {!settings.notifications.enabled && (
          <View style={styles.disabledSection}>
            <View style={styles.disabledCard}>
              <Ionicons name="notifications-off" size={64} color={COLORS.textSecondary} />
              <Text style={styles.disabledTitle}>Notifications Disabled</Text>
              <Text style={styles.disabledSubtitle}>
                Enable notifications above to receive payment reminders and configure your preferences.
              </Text>
            </View>
          </View>
        )}
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
  },
  headerSection: {
    marginBottom: SPACING.xl,
  },
  headerCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  sectionDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  settingItem: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  settingSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  settingItemRight: {
    marginLeft: SPACING.md,
  },
  reminderOptions: {
    gap: SPACING.sm,
  },
  reminderOption: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  reminderOptionActive: {
    backgroundColor: COLORS.primary,
  },
  reminderOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reminderOptionText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  reminderOptionTextActive: {
    color: 'white',
  },
  reminderOptionRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  reminderOptionDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  previewCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  previewTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  previewBody: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  previewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewTime: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  testButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.medium,
  },
  testButtonText: {
    color: 'white',
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  testButtonSecondary: {
    backgroundColor: COLORS.secondary,
  },
  testButtonsContainer: {
    gap: SPACING.sm,
  },
  helpCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  helpText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
    flex: 1,
    lineHeight: 20,
  },
  disabledSection: {
    marginTop: SPACING.xl,
  },
  disabledCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xxl,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  disabledTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  disabledSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  actionButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  actionButtonText: {
    color: 'white',
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
});

export default NotificationSettingsScreen;
