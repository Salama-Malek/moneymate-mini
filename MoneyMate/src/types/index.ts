export interface Transaction {
  id: string;
  type: 'lend' | 'borrow';
  person: string;
  amount: number;
  currency: string;
  date: string;
  dueDate: string;
  status: 'pending' | 'paid';
  archived: boolean;
  notes?: string;
  category?: string;
  recurring?: {
    frequency: string;
    endDate: string;
    lastGeneratedDate?: string;
  } | null;
}

export interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export interface Wallet {
  id: string;
  currency: string;
  balance: number;
  name: string;
  color: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: 'credit' | 'debit' | 'transfer';
  amount: number;
  currency: string;
  description: string;
  relatedTransactionId?: string;
  date: string;
  balanceAfter: number;
}

export interface NotificationSettings {
  enabled: boolean;
  reminderDays: number[];
  sound: boolean;
  vibration: boolean;
  haptics: boolean;
}

export interface AppSettings {
  defaultCurrency: string;
  theme: 'light' | 'dark';
  language: string;
  notifications: NotificationSettings;
  biometricEnabled: boolean;
}

export interface DashboardStats {
  totalLent: number;
  totalBorrowed: number;
  outstandingLent: number;
  outstandingBorrowed: number;
  overdueCount: number;
  upcomingCount: number;
  totalWalletBalance: number;
  defaultCurrencyBalance: number;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export interface RecurringFrequency {
  value: string;
  label: string;
  days: number;
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export interface Translations {
  [key: string]: {
    [languageCode: string]: string;
  };
}
