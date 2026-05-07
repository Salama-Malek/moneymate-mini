import { Currency, RecurringFrequency, Language, Translations } from '../types';

// Color Theme based on moneymate_theme_animations.txt
export const COLORS = {
  primary: '#6C63FF',
  secondary: '#FF6584',
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  background: '#F5F6FA',
  cardBackground: '#FFFFFF',
  textPrimary: '#333333',
  textSecondary: '#666666',
  border: '#E0E0E0',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

// Dark mode colors
export const DARK_COLORS = {
  primary: '#8B7FFF',
  secondary: '#FF8FA3',
  success: '#66BB6A',
  warning: '#FFD54F',
  error: '#EF5350',
  background: '#121212',
  cardBackground: '#1E1E1E',
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0B0',
  border: '#333333',
  overlay: 'rgba(0, 0, 0, 0.7)',
};

// Function to get colors based on theme
export const getColors = (theme: 'light' | 'dark') => {
  return theme === 'dark' ? DARK_COLORS : COLORS;
};

export const GRADIENTS = {
  primary: ['#6C63FF', '#FF6584'],
  success: ['#4CAF50', '#45A049'],
  warning: ['#FFC107', '#FF9800'],
  error: ['#F44336', '#D32F2F'],
};

// Typography
export const FONTS = {
  regular: 'Poppins-Regular',
  medium: 'Poppins-Medium',
  semiBold: 'Poppins-SemiBold',
  bold: 'Poppins-Bold',
  light: 'Poppins-Light',
};

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius
export const BORDER_RADIUS = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// Shadows
export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Dark mode shadows
export const DARK_SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Function to get shadows based on theme
export const getShadows = (theme: 'light' | 'dark') => {
  return theme === 'dark' ? DARK_SHADOWS : SHADOWS;
};

// Languages
export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
];

// Default language
export const DEFAULT_LANGUAGE = 'en';

// Export translations
export { TRANSLATIONS } from './translations';

// Currencies
export const CURRENCIES: Currency[] = [
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
];

// Recurring frequencies
export const RECURRING_FREQUENCIES: RecurringFrequency[] = [
  { value: 'weekly', label: 'Weekly', days: 7 },
  { value: 'biweekly', label: 'Bi-weekly', days: 14 },
  { value: 'monthly', label: 'Monthly', days: 30 },
  { value: 'quarterly', label: 'Quarterly', days: 90 },
  { value: 'yearly', label: 'Yearly', days: 365 },
];

// Reminder options
export const REMINDER_OPTIONS = [
  { value: 1, label: '1 day before' },
  { value: 3, label: '3 days before' },
  { value: 7, label: '1 week before' },
  { value: 14, label: '2 weeks before' },
];

// Storage keys
export const STORAGE_KEYS = {
  MONEY_MATE_STORAGE: 'moneymate-storage',
};

// Animation duration
export const ANIMATION_DURATION = {
  fast: 200,
  normal: 300,
  slow: 500,
  verySlow: 800,
};

// Branding
export const BRANDING = {
  name: 'MoneyMate',
  author: 'Smart Money',
  version: '1.0.0',
};

// Wallet colors
export const WALLET_COLORS = [
  '#6C63FF', // Primary
  '#FF6584', // Secondary
  '#4CAF50', // Success
  '#FFC107', // Warning
  '#F44336', // Error
  '#9C27B0', // Purple
  '#00BCD4', // Cyan
  '#FF9800', // Orange
  '#795548', // Brown
  '#607D8B', // Blue Grey
];

// Default wallets
export const DEFAULT_WALLETS = [
  {
    id: 'default-egp',
    currency: 'EGP',
    balance: 10000,
    name: 'Egyptian Pound Wallet',
    color: '#6C63FF',
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-usd',
    currency: 'USD',
    balance: 1000,
    name: 'US Dollar Wallet',
    color: '#FF6584',
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
