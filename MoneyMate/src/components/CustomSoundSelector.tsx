import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, FONT_SIZES, FONTS } from '../constants';
import { 
  soundVibrationService, 
  CustomSound, 
  SoundType 
} from '../utils/soundVibrationService';

interface CustomSoundSelectorProps {
  onSoundSelected?: (sound: CustomSound) => void;
}

const SOUND_TYPES: { type: SoundType; label: string; icon: string; description: string }[] = [
  {
    type: 'notification',
    label: 'Notification Sound',
    icon: 'notifications',
    description: 'Sound for payment reminders and alerts'
  },
  {
    type: 'success',
    label: 'Success Sound',
    icon: 'checkmark-circle',
    description: 'Sound for successful actions'
  },
  {
    type: 'warning',
    label: 'Warning Sound',
    icon: 'warning',
    description: 'Sound for warnings and cautions'
  },
  {
    type: 'error',
    label: 'Error Sound',
    icon: 'close-circle',
    description: 'Sound for errors and failures'
  },
  {
    type: 'click',
    label: 'Click Sound',
    icon: 'hand-left',
    description: 'Sound for button presses'
  },
  {
    type: 'swipe',
    label: 'Swipe Sound',
    icon: 'swap-horizontal',
    description: 'Sound for swipe actions'
  }
];

const CustomSoundSelector: React.FC<CustomSoundSelectorProps> = ({ onSoundSelected }) => {
  const { colors, shadows } = useTheme();
  const [selectedSounds, setSelectedSounds] = useState<Map<SoundType, CustomSound>>(
    new Map(SOUND_TYPES.map(st => [st.type, soundVibrationService.getCustomSoundByType(st.type)]).filter(([_, sound]) => sound !== null))
  );

  const handlePickSound = async (soundType: SoundType) => {
    try {
      const customSound = await soundVibrationService.pickCustomSound(soundType);
      if (customSound) {
        const newSelectedSounds = new Map(selectedSounds);
        newSelectedSounds.set(soundType, customSound);
        setSelectedSounds(newSelectedSounds);
        
        if (onSoundSelected) {
          onSoundSelected(customSound);
        }

        // Test the sound
        await soundVibrationService.playSound(soundType);
        
        Alert.alert(
          'Sound Selected',
          `"${customSound.name}" has been set as your ${soundType} sound.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to select sound. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleRemoveSound = (soundType: SoundType) => {
    const sound = selectedSounds.get(soundType);
    if (sound) {
      Alert.alert(
        'Remove Sound',
        `Are you sure you want to remove "${sound.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              soundVibrationService.removeCustomSound(sound.id);
              const newSelectedSounds = new Map(selectedSounds);
              newSelectedSounds.delete(soundType);
              setSelectedSounds(newSelectedSounds);
            }
          }
        ]
      );
    }
  };

  const handleTestSound = async (soundType: SoundType) => {
    await soundVibrationService.playSound(soundType);
  };

  const renderSoundType = (soundType: SoundType, label: string, icon: string, description: string) => {
    const selectedSound = selectedSounds.get(soundType);
    const hasCustomSound = soundVibrationService.hasCustomSound(soundType);

    return (
      <View key={soundType} style={[styles.soundTypeCard, { backgroundColor: colors.cardBackground, ...shadows.small }]}>
        <View style={styles.soundTypeHeader}>
          <View style={[styles.soundTypeIcon, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name={icon as any} size={24} color={colors.primary} />
          </View>
          <View style={styles.soundTypeInfo}>
            <Text style={[styles.soundTypeLabel, { color: colors.textPrimary }]}>{label}</Text>
            <Text style={[styles.soundTypeDescription, { color: colors.textSecondary }]}>{description}</Text>
          </View>
        </View>

        <View style={styles.soundTypeActions}>
          {hasCustomSound && selectedSound ? (
            <>
              <View style={styles.selectedSoundInfo}>
                <Ionicons name="musical-notes" size={16} color={colors.success} />
                <Text style={[styles.selectedSoundName, { color: colors.success }]} numberOfLines={1}>
                  {selectedSound.name}
                </Text>
              </View>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.primary }]}
                  onPress={() => handleTestSound(soundType)}
                >
                  <Ionicons name="play" size={16} color="white" />
                  <Text style={styles.actionButtonText}>Test</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.error }]}
                  onPress={() => handleRemoveSound(soundType)}
                >
                  <Ionicons name="trash" size={16} color="white" />
                  <Text style={styles.actionButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.selectSoundButton, { backgroundColor: colors.primary, ...shadows.medium }]}
              onPress={() => handlePickSound(soundType)}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.selectSoundButtonText}>Select Sound</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Custom Sound Selection</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Choose custom sounds from your device for different app actions
        </Text>
      </View>

      <View style={styles.soundTypesContainer}>
        {SOUND_TYPES.map(({ type, label, icon, description }) =>
          renderSoundType(type, label, icon, description)
        )}
      </View>

      <View style={styles.helpSection}>
        <View style={[styles.helpCard, { backgroundColor: colors.cardBackground, ...shadows.small }]}>
          <View style={styles.helpHeader}>
            <Ionicons name="information-circle" size={24} color={colors.primary} />
            <Text style={[styles.helpTitle, { color: colors.textPrimary }]}>How It Works</Text>
          </View>
          <Text style={[styles.helpText, { color: colors.textSecondary }]}>
            • Tap "Select Sound" to choose an audio file from your device{'\n'}
            • Supported formats: MP3, WAV, M4A, and other common audio formats{'\n'}
            • Custom sounds will play instead of default haptic feedback{'\n'}
            • You can test sounds before confirming your selection{'\n'}
            • Remove sounds anytime to revert to default behavior
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    marginBottom: SPACING.sm,
    fontFamily: FONTS.bold,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: FONTS.regular,
  },
  soundTypesContainer: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  soundTypeCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  soundTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  soundTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  soundTypeInfo: {
    flex: 1,
  },
  soundTypeLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    fontFamily: FONTS.semiBold,
  },
  soundTypeDescription: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 18,
    fontFamily: FONTS.regular,
  },
  soundTypeActions: {
    gap: SPACING.sm,
  },
  selectedSoundInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
  },
  selectedSoundName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    fontFamily: FONTS.medium,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.xs,
  },
  actionButtonText: {
    color: 'white',
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  selectSoundButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  selectSoundButtonText: {
    color: 'white',
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  helpSection: {
    padding: SPACING.lg,
    marginTop: SPACING.md,
  },
  helpCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  helpTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  helpText: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
    fontFamily: FONTS.regular,
  },
});

export default CustomSoundSelector;
