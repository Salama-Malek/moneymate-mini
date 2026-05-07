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
  Share,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useMoneyMateStore } from '../store';
import { SPACING, BORDER_RADIUS, FONT_SIZES, CURRENCIES, REMINDER_OPTIONS, LANGUAGES } from '../constants';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { exportData, importData } from '../utils';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation';
import { soundVibrationService } from '../utils/soundVibrationService';
import { testNotification } from '../utils';

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { colors, shadows } = useTheme();
  const { t, setLanguage } = useLanguage();
  const { settings, updateSettings, transactions, archivedTransactions } = useMoneyMateStore();

  const [showReminderOptions, setShowReminderOptions] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
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

  const handleCurrencyChange = async (currency: string) => {
    await soundVibrationService.buttonPress();
    updateSettings({ defaultCurrency: currency });
  };

  const handleThemeChange = async (theme: 'light' | 'dark') => {
    await soundVibrationService.buttonPress();
    updateSettings({ theme });
  };

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

  const handleBiometricToggle = async (enabled: boolean) => {
    await soundVibrationService.buttonPress();
    updateSettings({ biometricEnabled: enabled });
  };

  const handleExportData = async () => {
    try {
      const allTransactions = [...transactions, ...archivedTransactions];
      const exportString = exportData(allTransactions);
      
      await soundVibrationService.buttonPress();
      await Alert.alert('Exporting Data', 'Please wait while your data is being exported...');
      await soundVibrationService.successAction();

      await soundVibrationService.buttonPress();
      await Share.share({
        message: `MoneyMate Data Export\n\n${exportString}`,
        title: 'MoneyMate Data Export',
      });
      await soundVibrationService.successAction();
    } catch (error) {
      await soundVibrationService.buttonPress();
      Alert.alert('Export Failed', 'Failed to export data. Please try again.');
    }
  };

  const handleImportData = () => {
    Alert.alert(
      'Import Data',
      'This will replace all existing data. Are you sure you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          style: 'destructive',
          onPress: () => {
            // In a real app, you would open a file picker here
            Alert.alert('Import', 'File picker would open here in a real app.');
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all transactions and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            // In a real app, you would clear all data here
            Alert.alert('Data Cleared', 'All data has been cleared.');
          },
        },
      ]
    );
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
    subtitle?: string,
    rightElement?: React.ReactNode,
    onPress?: () => void
  ) => (
    <TouchableOpacity
      style={[styles.settingItem, { backgroundColor: colors.cardBackground, ...shadows.small }, onPress && styles.settingItemPressable]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingItemLeft}>
        <View style={[styles.settingIcon, { backgroundColor: colors.background }]}>
          <Ionicons name={icon} size={24} color={colors.primary} />
        </View>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>{title}</Text>
          {subtitle && <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
        </View>
      </View>
      {rightElement && <View style={styles.settingItemRight}>{rightElement}</View>}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* App Information */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>App Information</Text>
            <View style={[styles.appInfoCard, { backgroundColor: colors.cardBackground, ...shadows.medium }]}>
              <View style={styles.appInfoHeader}>
                <View style={[styles.appIcon, { backgroundColor: colors.primary }]}>
                  <Ionicons name="wallet" size={32} color="white" />
                </View>
                <View style={styles.appInfoContent}>
                  <Text style={[styles.appName, { color: colors.textPrimary }]}>MoneyMate</Text>
                  <Text style={[styles.appVersion, { color: colors.textSecondary }]}>Version 1.0.0</Text>
                  <Text style={[styles.appAuthor, { color: colors.primary }]}>by Salama Malek</Text>
                </View>
              </View>
              <Text style={[styles.appDescription, { color: colors.textSecondary }]}>
                Track your money lending and borrowing with ease. Keep all your financial transactions organized and never miss a payment.
              </Text>
            </View>
          </View>

          {/* General Settings */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>General Settings</Text>
            
            {renderSettingItem(
              'globe',
              'Default Currency',
              `Currently: ${settings.defaultCurrency}`,
              <View style={styles.currencySelector}>
                {CURRENCIES.slice(0, 4).map((currency) => (
                  <TouchableOpacity
                    key={currency.code}
                    style={[
                      styles.currencyOption,
                      { backgroundColor: colors.background, borderColor: colors.border },
                      settings.defaultCurrency === currency.code && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => handleCurrencyChange(currency.code)}
                  >
                    <Text
                      style={[
                        styles.currencyOptionText,
                        { color: colors.textSecondary },
                        settings.defaultCurrency === currency.code && { color: 'white' },
                      ]}
                    >
                      {currency.code}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {renderSettingItem(
              'color-palette',
              'Theme',
              `Currently: ${settings.theme.charAt(0).toUpperCase() + settings.theme.slice(1)}`,
              <View style={styles.themeSelector}>
                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    settings.theme === 'light' && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => handleThemeChange('light')}
                >
                  <Ionicons
                    name="sunny"
                    size={20}
                    color={settings.theme === 'light' ? 'white' : colors.textSecondary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    settings.theme === 'dark' && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => handleThemeChange('dark')}
                >
                  <Ionicons
                    name="moon"
                    size={20}
                    color={settings.theme === 'dark' ? 'white' : colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            )}

            {renderSettingItem(
              'language',
              t('settings.language'),
              `Currently: ${LANGUAGES.find(lang => lang.code === settings.language)?.nativeName || 'English'}`,
              <TouchableOpacity
                style={styles.languageSelector}
                onPress={() => setShowLanguagePicker(true)}
              >
                <Text style={[styles.languageSelectorText, { color: colors.primary }]}>
                  {LANGUAGES.find(lang => lang.code === settings.language)?.flag} {t('common.change')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Notification Settings */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Notification Settings</Text>
            
            {renderSettingItem(
              'notifications',
              'Enable Notifications',
              'Receive notifications for important events',
              <Switch
                value={settings.notifications.enabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={settings.notifications.enabled ? 'white' : colors.textSecondary}
              />
            )}

            {settings.notifications.enabled && (
              <>
                {renderSettingItem(
                  'volume-high',
                  'Sound',
                  'Play sound with notifications',
                  <Switch
                    value={settings.notifications.sound}
                    onValueChange={handleSoundToggle}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={settings.notifications.sound ? 'white' : colors.textSecondary}
                  />
                )}

                {renderSettingItem(
                  'phone-portrait',
                  'Vibration',
                  'Vibrate with notifications',
                  <Switch
                    value={settings.notifications.vibration}
                    onValueChange={handleVibrationToggle}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={settings.notifications.vibration ? 'white' : colors.textSecondary}
                  />
                )}

                {renderSettingItem(
                  'hand-left',
                  'Haptics',
                  'Haptic feedback for interactions',
                  <Switch
                    value={settings.notifications.haptics}
                    onValueChange={handleHapticsToggle}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={settings.notifications.haptics ? 'white' : colors.textSecondary}
                  />
                )}

                {renderSettingItem(
                  'time',
                  'Payment Reminders',
                  'Days before due date to remind',
                  <TouchableOpacity
                    style={styles.expandButton}
                    onPress={() => setShowReminderOptions(!showReminderOptions)}
                  >
                    <Ionicons
                      name={showReminderOptions ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                )}

                {showReminderOptions && (
                  <View style={styles.reminderOptions}>
                    {REMINDER_OPTIONS.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={styles.reminderOption}
                        onPress={() => handleReminderToggle(option.value)}
                      >
                        <Ionicons
                          name={settings.notifications.reminderDays.includes(option.value) ? 'checkmark-circle' : 'ellipse-outline'}
                          size={20}
                          color={settings.notifications.reminderDays.includes(option.value) ? colors.primary : colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.reminderOptionText,
                            { color: colors.textSecondary },
                            settings.notifications.reminderDays.includes(option.value) && { color: colors.primary },
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Test Buttons */}
                <View style={styles.testButtonsContainer}>
                  <TouchableOpacity style={[styles.testButton, { backgroundColor: colors.primary }]} onPress={handleTestNotification}>
                    <Ionicons name="notifications" size={20} color="white" />
                    <Text style={styles.testButtonText}>Test Notification</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.testButton, { backgroundColor: colors.secondary }]} onPress={handleTestHaptics}>
                    <Ionicons name="hand-left" size={20} color="white" />
                    <Text style={styles.testButtonText}>Test Haptics</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.testButton, { backgroundColor: colors.secondary }]} onPress={handleTestVibration}>
                    <Ionicons name="phone-portrait" size={20} color="white" />
                    <Text style={styles.testButtonText}>Test Vibration</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          {/* Data Management */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Data Management</Text>
            
            {renderSettingItem(
              'download',
              'Export Data',
              `Export ${transactions.length + archivedTransactions.length} transactions`,
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={handleExportData}>
                <Text style={styles.actionButtonText}>Export</Text>
              </TouchableOpacity>
            )}

            {renderSettingItem(
              'cloud-upload',
              'Import Data',
              'Import transactions from backup file',
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={handleImportData}>
                <Text style={styles.actionButtonText}>Import</Text>
              </TouchableOpacity>
            )}

            {renderSettingItem(
              'trash',
              'Clear All Data',
              'Permanently delete all data',
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.error }]} onPress={handleClearData}>
                <Text style={styles.actionButtonText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Support */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Support</Text>
            
            {renderSettingItem(
              'help-circle',
              'Help & FAQ',
              'Get help and answers to common questions',
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            )}

            {renderSettingItem(
              'mail',
              'Contact Support',
              'Send us a message',
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            )}

            {renderSettingItem(
              'star',
              'Rate App',
              'Rate MoneyMate on the app store',
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            )}
          </View>
          
          {/* Bottom spacing for tab bar */}
          <View style={styles.bottomSpacing} />
        </Animated.View>
      </ScrollView>

      {/* Language Picker Modal */}
      <Modal
        visible={showLanguagePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguagePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {t('settings.language')}
              </Text>
              <TouchableOpacity
                onPress={() => setShowLanguagePicker(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.languageList}>
              {LANGUAGES.map((language) => (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.languageOption,
                    { borderColor: colors.border },
                    settings.language === language.code && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => {
                    setLanguage(language.code);
                    setShowLanguagePicker(false);
                  }}
                >
                  <Text style={styles.languageFlag}>{language.flag}</Text>
                  <View style={styles.languageInfo}>
                    <Text
                      style={[
                        styles.languageName,
                        { color: settings.language === language.code ? 'white' : colors.textPrimary },
                      ]}
                    >
                      {language.nativeName}
                    </Text>
                    <Text
                      style={[
                        styles.languageEnglishName,
                        { color: settings.language === language.code ? 'white' : colors.textSecondary },
                      ]}
                    >
                      {language.name}
                    </Text>
                  </View>
                  {settings.language === language.code && (
                    <Ionicons name="checkmark" size={20} color="white" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  sectionDescription: {
    fontSize: FONT_SIZES.md,
    marginBottom: SPACING.sm,
  },
  appInfoCard: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
  },
  appInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  appIcon: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  appInfoContent: {
    flex: 1,
  },
  appName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  appVersion: {
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.xs,
  },
  appAuthor: {
    fontSize: FONT_SIZES.sm,
    fontStyle: 'italic',
  },
  appDescription: {
    fontSize: FONT_SIZES.md,
    lineHeight: 22,
  },
  settingItem: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  settingItemPressable: {
    // Add pressable styling if needed
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
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
    marginBottom: SPACING.xs,
  },
  settingSubtitle: {
    fontSize: FONT_SIZES.sm,
  },
  settingItemRight: {
    marginLeft: SPACING.md,
  },
  currencySelector: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  currencyOption: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
  },
  currencyOptionActive: {
    // Active state styling
  },
  currencyOptionText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  currencyOptionTextActive: {
    color: 'white',
  },
  themeSelector: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  themeOption: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  themeOptionActive: {
    // Active state styling
  },
  expandButton: {
    padding: SPACING.xs,
  },
  reminderOptions: {
    marginTop: SPACING.sm,
    marginLeft: SPACING.xl,
  },
  reminderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  reminderOptionActive: {
    // Active state styling
  },
  reminderOptionText: {
    fontSize: FONT_SIZES.sm,
    marginLeft: SPACING.sm,
  },
  reminderOptionTextActive: {
    fontWeight: '500',
  },
  actionButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  actionButtonText: {
    color: 'white',
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  dangerButton: {
    // Danger button styling
  },
  testButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.md,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: 'blue', // Example color, adjust as needed
  },
  testButtonSecondary: {
    backgroundColor: 'purple', // Example color, adjust as needed
  },
  testButtonText: {
    color: 'white',
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  languageSelector: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  languageSelectorText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
  },
  closeButton: {
    padding: SPACING.xs,
  },
  languageList: {
    gap: SPACING.sm,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  languageFlag: {
    fontSize: FONT_SIZES.xl,
    marginRight: SPACING.md,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  languageEnglishName: {
    fontSize: FONT_SIZES.sm,
  },
  bottomSpacing: {
    height: 80, // Space for tab bar
  },
});

export default SettingsScreen;
