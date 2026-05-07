import * as Notifications from 'expo-notifications';
import { Transaction, NotificationSettings, DashboardStats } from '../types';
import { format, addDays, isAfter, isBefore, parseISO } from 'date-fns';
import { soundVibrationService } from './soundVibrationService';

// Configure notifications
export const configureNotifications = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    return false;
  }

  // Set notification handler with enhanced feedback
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      // Trigger haptic feedback based on notification type
      const data = notification.request.content.data;
      if (data?.type === 'overdue') {
        await soundVibrationService.overdueReminder();
      } else if (data?.type === 'upcoming') {
        await soundVibrationService.upcomingReminder();
      } else {
        await soundVibrationService.triggerHaptic('light');
      }

      return {
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      };
    },
  });

  return true;
};

// Schedule notification for a transaction
export const scheduleNotification = async (
  transaction: Transaction,
  settings: NotificationSettings
) => {
  if (!settings.enabled || transaction.archived || transaction.status === 'paid') {
    return;
  }

  const dueDate = parseISO(transaction.dueDate);
  
  // Schedule notifications for each reminder day
  for (const reminderDay of settings.reminderDays) {
    const reminderDate = addDays(dueDate, -reminderDay);
    
    // Only schedule if reminder date is in the future
    if (isAfter(reminderDate, new Date())) {
      const identifier = `${transaction.id}_${reminderDay}`;
      
      // Determine notification type and content
      const isOverdue = isBefore(dueDate, new Date());
      const notificationType = isOverdue ? 'overdue' : 'upcoming';
      
      let title = 'Payment Reminder';
      let body = `${transaction.person} - ${transaction.amount} ${transaction.currency} due in ${reminderDay} day${reminderDay > 1 ? 's' : ''}`;
      
      if (isOverdue) {
        title = '⚠️ Overdue Payment';
        body = `${transaction.person} - ${transaction.amount} ${transaction.currency} is overdue!`;
      } else if (reminderDay === 1) {
        title = '🚨 Due Tomorrow';
        body = `${transaction.person} - ${transaction.amount} ${transaction.currency} is due tomorrow!`;
      } else if (reminderDay <= 3) {
        title = '⏰ Due Soon';
        body = `${transaction.person} - ${transaction.amount} ${transaction.currency} due in ${reminderDay} days`;
      }
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { 
            transactionId: transaction.id,
            type: notificationType,
            amount: transaction.amount,
            currency: transaction.currency,
            person: transaction.person,
          },
          sound: settings.sound ? 'default' : undefined,
          priority: isOverdue ? 'high' : 'default',
          categoryIdentifier: notificationType,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderDate,
        },
        identifier,
      });
    }
  }
};

// Send immediate notification (for testing or urgent alerts)
export const sendImmediateNotification = async (
  title: string,
  body: string,
  data?: any,
  type: 'info' | 'warning' | 'error' = 'info'
) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { ...data, type },
        sound: 'default',
        priority: type === 'error' ? 'high' : 'default',
      },
      trigger: null, // Immediate
    });

    // Trigger appropriate feedback
    switch (type) {
      case 'error':
        await soundVibrationService.overdueReminder();
        break;
      case 'warning':
        await soundVibrationService.upcomingReminder();
        break;
      default:
        await soundVibrationService.triggerHaptic('light');
    }
  } catch (error) {
    console.log('Failed to send immediate notification:', error);
  }
};

// Cancel all notifications for a transaction
export const cancelNotification = async (transactionId: string) => {
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  
  for (const notification of scheduledNotifications) {
    if (notification.content.data?.transactionId === transactionId) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
};

// Get all scheduled notifications
export const getAllScheduledNotifications = async () => {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.log('Failed to get scheduled notifications:', error);
    return [];
  }
};

// Clear all notifications
export const clearAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return true;
  } catch (error) {
    console.log('Failed to clear notifications:', error);
    return false;
  }
};

// Test notification with feedback
export const testNotification = async (settings: NotificationSettings) => {
  try {
    // Send test notification
    await sendImmediateNotification(
      'Test Notification',
      'This is a test notification to verify your settings',
      { test: true },
      'info'
    );

    // Trigger test feedback based on settings
    if (settings.sound) {
      await soundVibrationService.playSound('notification');
    }
    
    if (settings.vibration) {
      soundVibrationService.triggerVibration('notification');
    }

    return true;
  } catch (error) {
    console.log('Test notification failed:', error);
    return false;
  }
};

// Calculate dashboard statistics
export const calculateDashboardStats = (transactions: Transaction[]): DashboardStats => {
  const activeTransactions = transactions.filter(t => !t.archived);
  const now = new Date();

  const stats: DashboardStats = {
    totalLent: 0,
    totalBorrowed: 0,
    outstandingLent: 0,
    outstandingBorrowed: 0,
    overdueCount: 0,
    upcomingCount: 0,
    totalWalletBalance: 0,
    defaultCurrencyBalance: 0,
  };

  activeTransactions.forEach(transaction => {
    if (transaction.type === 'lend') {
      stats.totalLent += transaction.amount;
      if (transaction.status === 'pending') {
        stats.outstandingLent += transaction.amount;
        
        const dueDate = parseISO(transaction.dueDate);
        if (isBefore(dueDate, now)) {
          stats.overdueCount++;
        } else if (isBefore(dueDate, addDays(now, 7))) {
          stats.upcomingCount++;
        }
      }
    } else {
      stats.totalBorrowed += transaction.amount;
      if (transaction.status === 'pending') {
        stats.outstandingBorrowed += transaction.amount;
        
        const dueDate = parseISO(transaction.dueDate);
        if (isBefore(dueDate, now)) {
          stats.overdueCount++;
        } else if (isBefore(dueDate, addDays(now, 7))) {
          stats.upcomingCount++;
        }
      }
    }
  });

  return stats;
};

// Format currency amount
export const formatCurrency = (amount: number, currency: string): string => {
  const currencySymbols: { [key: string]: string } = {
    'EGP': 'E£',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'RUB': '₽',
    'JPY': '¥',
    'CNY': '¥',
    'INR': '₹',
  };

  const symbol = currencySymbols[currency] || currency;
  return `${symbol}${amount.toLocaleString()}`;
};

// Format date
export const formatDate = (date: string, formatString: string = 'MMM dd, yyyy'): string => {
  try {
    return format(parseISO(date), formatString);
  } catch {
    return date;
  }
};

// Get status color
export const getStatusColor = (status: 'pending' | 'paid', dueDate: string): string => {
  if (status === 'paid') return '#4CAF50';
  
  const due = parseISO(dueDate);
  const now = new Date();
  
  if (isBefore(due, now)) return '#F44336'; // Overdue - Red
  return '#FFC107'; // Pending - Yellow
};

// Get transaction type color
export const getTypeColor = (type: 'lend' | 'borrow'): string => {
  return type === 'lend' ? '#6C63FF' : '#FF6584';
};

// Generate unique ID
export const generateId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// Validate transaction data
export const validateTransaction = (data: Partial<Transaction>): string[] => {
  const errors: string[] = [];
  
  if (!data.person?.trim()) {
    errors.push('Person name is required');
  }
  
  if (!data.amount || data.amount <= 0) {
    errors.push('Amount must be greater than 0');
  }
  
  if (!data.currency) {
    errors.push('Currency is required');
  }
  
  if (!data.date) {
    errors.push('Date is required');
  }
  
  if (!data.dueDate) {
    errors.push('Due date is required');
  }
  
  if (data.date && data.dueDate) {
    const date = parseISO(data.date);
    const dueDate = parseISO(data.dueDate);
    
    if (isBefore(dueDate, date)) {
      errors.push('Due date must be after the transaction date');
    }
  }
  
  return errors;
};

// Export data to CSV
export const exportDataAsCSV = (transactions: Transaction[]): string => {
  const headers = ['id', 'type', 'person', 'amount', 'currency', 'category', 'date', 'dueDate', 'status', 'archived', 'notes'];
  const escape = (v: unknown) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(',')];
  for (const t of transactions) {
    lines.push([
      t.id, t.type, t.person, t.amount, t.currency, t.category || '',
      t.date, t.dueDate, t.status, t.archived, (t.notes || '').replace(/\n/g, ' '),
    ].map(escape).join(','));
  }
  return lines.join('\n');
};

// Export data to JSON
export const exportData = (transactions: Transaction[]): string => {
  const exportData = {
    transactions,
    exportDate: new Date().toISOString(),
    version: '1.0.0',
  };
  
  return JSON.stringify(exportData, null, 2);
};

// Import data from JSON
export const importData = (jsonString: string): Transaction[] => {
  try {
    const data = JSON.parse(jsonString);
    
    if (data.transactions && Array.isArray(data.transactions)) {
      return data.transactions.map((t: any) => ({
        ...t,
        id: t.id || generateId(),
        archived: t.archived || false,
      }));
    }
    
    throw new Error('Invalid data format');
  } catch (error) {
    throw new Error('Failed to parse import data');
  }
};
