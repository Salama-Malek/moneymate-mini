import { Vibration, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

// Haptic feedback types
export type HapticType = 
  | 'light' 
  | 'medium' 
  | 'heavy' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'selection';

// Vibration patterns
export type VibrationPattern = 
  | 'short' 
  | 'medium' 
  | 'long' 
  | 'notification' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'custom';

// Sound types
export type SoundType = 
  | 'notification' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'click' 
  | 'swipe' 
  | 'custom';

// Custom sound interface
export interface CustomSound {
  id: string;
  name: string;
  uri: string;
  type: SoundType;
  duration?: number;
}

class SoundVibrationService {
  private isEnabled: boolean = true;
  private hapticsEnabled: boolean = true;
  private soundEnabled: boolean = true;
  private vibrationEnabled: boolean = true;
  private customSounds: Map<string, CustomSound> = new Map();

  constructor() {
    // Initialize service
  }

  // Enable/disable the entire service
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  // Enable/disable haptics
  setHapticsEnabled(enabled: boolean) {
    this.hapticsEnabled = enabled;
  }

  // Enable/disable sounds
  setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  // Enable/disable vibration
  setVibrationEnabled(enabled: boolean) {
    this.vibrationEnabled = enabled;
  }

  // Pick custom sound from device
  async pickCustomSound(type: SoundType): Promise<CustomSound | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      const customSound: CustomSound = {
        id: Date.now().toString(),
        name: asset.name || 'Custom Sound',
        uri: asset.uri,
        type,
      };

      this.customSounds.set(customSound.id, customSound);
      return customSound;
    } catch (error) {
      console.log('Failed to pick custom sound:', error);
      return null;
    }
  }

  // Get all custom sounds
  getCustomSounds(): CustomSound[] {
    return Array.from(this.customSounds.values());
  }

  // Get custom sound by type
  getCustomSoundByType(type: SoundType): CustomSound | null {
    return Array.from(this.customSounds.values()).find(sound => sound.type === type) || null;
  }

  // Remove custom sound
  removeCustomSound(soundId: string): boolean {
    return this.customSounds.delete(soundId);
  }

  // Check if custom sound exists for type
  hasCustomSound(type: SoundType): boolean {
    return this.getCustomSoundByType(type) !== null;
  }

  // Trigger haptic feedback (fallback to vibration)
  async triggerHaptic(type: HapticType) {
    if (!this.isEnabled || !this.hapticsEnabled) return;

    try {
      // Fallback to vibration patterns for haptic feedback
      switch (type) {
        case 'light':
          this.triggerVibration('short');
          break;
        case 'medium':
          this.triggerVibration('medium');
          break;
        case 'heavy':
          this.triggerVibration('long');
          break;
        case 'success':
          this.triggerVibration('success');
          break;
        case 'warning':
          this.triggerVibration('warning');
          break;
        case 'error':
          this.triggerVibration('error');
          break;
        case 'selection':
          this.triggerVibration('short');
          break;
      }
    } catch (error) {
      console.log('Haptic feedback failed:', error);
    }
  }

  // Trigger vibration
  triggerVibration(pattern: VibrationPattern, customPattern?: number[]) {
    if (!this.isEnabled || !this.vibrationEnabled) return;

    try {
      let vibrationPattern: number[] | number;

      switch (pattern) {
        case 'short':
          vibrationPattern = 50;
          break;
        case 'medium':
          vibrationPattern = 100;
          break;
        case 'long':
          vibrationPattern = 200;
          break;
        case 'notification':
          vibrationPattern = [0, 100, 50, 100];
          break;
        case 'success':
          vibrationPattern = [0, 50, 100, 50];
          break;
        case 'warning':
          vibrationPattern = [0, 100, 50, 100, 50, 100];
          break;
        case 'error':
          vibrationPattern = [0, 200, 100, 200, 100, 200];
          break;
        case 'custom':
          vibrationPattern = customPattern || [0, 100];
          break;
        default:
          vibrationPattern = 100;
      }

      if (Array.isArray(vibrationPattern)) {
        Vibration.vibrate(vibrationPattern);
      } else {
        Vibration.vibrate(vibrationPattern);
      }
    } catch (error) {
      console.log('Vibration failed:', error);
    }
  }

  // Play sound (with custom sound support)
  async playSound(type: SoundType) {
    if (!this.isEnabled || !this.soundEnabled) return;

    try {
      // Check if custom sound exists for this type
      if (this.hasCustomSound(type)) {
        // For now, we'll use haptic feedback as a placeholder
        // In a full implementation, you'd play the actual audio file
        console.log(`Playing custom sound for ${type}`);
        await this.triggerHaptic('light');
        return;
      }

      // Fallback to haptic feedback if no custom sound
      switch (type) {
        case 'notification':
          await this.triggerHaptic('light');
          break;
        case 'success':
          await this.triggerHaptic('success');
          break;
        case 'warning':
          await this.triggerHaptic('warning');
          break;
        case 'error':
          await this.triggerHaptic('error');
          break;
        case 'click':
          await this.triggerHaptic('light');
          break;
        case 'swipe':
          await this.triggerHaptic('selection');
          break;
        default:
          await this.triggerHaptic('light');
      }
    } catch (error) {
      console.log('Sound playback failed:', error);
    }
  }

  // Combined feedback for different scenarios
  async transactionAdded() {
    await Promise.all([
      this.triggerHaptic('success'),
      this.triggerVibration('success'),
      this.playSound('success'),
    ]);
  }

  async transactionUpdated() {
    await Promise.all([
      this.triggerHaptic('medium'),
      this.triggerVibration('medium'),
      this.playSound('notification'),
    ]);
  }

  async transactionDeleted() {
    await Promise.all([
      this.triggerHaptic('warning'),
      this.triggerVibration('warning'),
      this.playSound('warning'),
    ]);
  }

  async overdueReminder() {
    await Promise.all([
      this.triggerHaptic('error'),
      this.triggerVibration('error'),
      this.playSound('error'),
    ]);
  }

  async upcomingReminder() {
    await Promise.all([
      this.triggerHaptic('warning'),
      this.triggerVibration('warning'),
      this.playSound('warning'),
    ]);
  }

  async buttonPress() {
    await Promise.all([
      this.triggerHaptic('light'),
      this.triggerVibration('short'),
      this.playSound('click'),
    ]);
  }

  async swipeAction() {
    await Promise.all([
      this.triggerHaptic('selection'),
      this.triggerVibration('short'),
      this.playSound('swipe'),
    ]);
  }

  async formValidation() {
    await Promise.all([
      this.triggerHaptic('warning'),
      this.triggerVibration('short'),
      this.playSound('warning'),
    ]);
  }

  async successAction() {
    await Promise.all([
      this.triggerHaptic('success'),
      this.triggerVibration('success'),
      this.playSound('success'),
    ]);
  }

  // Cleanup
  async cleanup() {
    try {
      // Stop any ongoing vibrations
      Vibration.cancel();
      
      // Clear custom sounds
      this.customSounds.clear();
    } catch (error) {
      console.log('Cleanup failed:', error);
    }
  }
}

// Export singleton instance
export const soundVibrationService = new SoundVibrationService();

// Export individual functions for convenience
export const {
  triggerHaptic,
  triggerVibration,
  playSound,
  transactionAdded,
  transactionUpdated,
  transactionDeleted,
  overdueReminder,
  upcomingReminder,
  buttonPress,
  swipeAction,
  formValidation,
  successAction,
  pickCustomSound,
  getCustomSounds,
  getCustomSoundByType,
  removeCustomSound,
  hasCustomSound,
} = soundVibrationService;
