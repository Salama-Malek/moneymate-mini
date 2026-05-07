import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMoneyMateStore } from '../store';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONT_SIZES, CURRENCIES, RECURRING_FREQUENCIES } from '../constants';
import { validateTransaction } from '../utils';
import type { Transaction } from '../types';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation';

type EditTransactionScreenRouteProp = RouteProp<RootStackParamList, 'EditTransaction'>;

const EditTransactionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<EditTransactionScreenRouteProp>();
  const { transactionId } = route.params;
  
  const { transactions, archivedTransactions, updateTransaction, deleteTransaction } = useMoneyMateStore();

  // Find the transaction to edit
  const transaction = [...transactions, ...archivedTransactions].find(t => t.id === transactionId);

  const [formData, setFormData] = useState<Partial<Transaction>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState<'date' | 'dueDate' | 'endDate'>('date');
  const [showRecurringOptions, setShowRecurringOptions] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (transaction) {
      setFormData({
        type: transaction.type,
        person: transaction.person,
        amount: transaction.amount.toString(),
        currency: transaction.currency,
        date: transaction.date,
        dueDate: transaction.dueDate,
        status: transaction.status,
        notes: transaction.notes || '',
        recurring: transaction.recurring,
      });
      setShowRecurringOptions(!!transaction.recurring);
    }

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [transaction]);

  if (!transaction) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={COLORS.error} />
        <Text style={styles.errorTitle}>Transaction Not Found</Text>
        <Text style={styles.errorSubtitle}>
          The transaction you're trying to edit could not be found.
        </Text>
        <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      
      switch (datePickerType) {
        case 'date':
          setFormData(prev => ({ ...prev, date: dateString }));
          break;
        case 'dueDate':
          setFormData(prev => ({ ...prev, dueDate: dateString }));
          break;
        case 'endDate':
          setFormData(prev => ({
            ...prev,
            recurring: prev.recurring ? { ...prev.recurring, endDate: dateString } : null,
          }));
          break;
      }
    }
    
    setShowDatePicker(false);
    setShowDueDatePicker(false);
    setShowEndDatePicker(false);
  };

  const handleRecurringToggle = () => {
    if (showRecurringOptions) {
      setFormData(prev => ({ ...prev, recurring: null }));
    }
    setShowRecurringOptions(!showRecurringOptions);
  };

  const handleRecurringFrequencySelect = (frequency: string) => {
    const selectedFrequency = RECURRING_FREQUENCIES.find(f => f.value === frequency);
    if (selectedFrequency) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + selectedFrequency.days * 12);
      
      setFormData(prev => ({
        ...prev,
        recurring: {
          frequency: selectedFrequency.value,
          endDate: endDate.toISOString().split('T')[0],
        },
      }));
    }
  };

  const handleSubmit = () => {
    const validationErrors = validateTransaction(formData);
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const updates: Partial<Transaction> = {
      ...formData,
      amount: parseFloat(formData.amount as string),
    };

    updateTransaction(transactionId, updates);
    
    Alert.alert(
      'Success',
      'Transaction updated successfully!',
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteTransaction(transactionId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const renderDateInput = (
    label: string,
    value: string,
    onPress: () => void,
    placeholder: string
  ) => (
    <TouchableOpacity style={styles.inputContainer} onPress={onPress}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.dateInput}>
        <Text style={[styles.dateInputText, !value && styles.placeholderText]}>
          {value || placeholder}
        </Text>
        <Ionicons name="calendar" size={20} color={COLORS.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Transaction Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transaction Type</Text>
            <View style={styles.typeContainer}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  formData.type === 'lend' && styles.typeButtonActive,
                ]}
                onPress={() => handleInputChange('type', 'lend')}
              >
                <Ionicons
                  name="trending-up"
                  size={24}
                  color={formData.type === 'lend' ? 'white' : COLORS.primary}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    formData.type === 'lend' && styles.typeButtonTextActive,
                  ]}
                >
                  Lend Money
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  formData.type === 'borrow' && styles.typeButtonActive,
                ]}
                onPress={() => handleInputChange('type', 'borrow')}
              >
                <Ionicons
                  name="trending-down"
                  size={24}
                  color={formData.type === 'borrow' ? 'white' : COLORS.secondary}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    formData.type === 'borrow' && styles.typeButtonTextActive,
                  ]}
                >
                  Borrow Money
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Person's Name</Text>
              <TextInput
                style={styles.textInput}
                value={formData.person}
                onChangeText={(value) => handleInputChange('person', value)}
                placeholder="Enter person's name"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: SPACING.sm }]}>
                <Text style={styles.inputLabel}>Amount</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.amount}
                  onChangeText={(value) => handleInputChange('amount', value)}
                  placeholder="0.00"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputContainer, { flex: 1, marginLeft: SPACING.sm }]}>
                <Text style={styles.inputLabel}>Currency</Text>
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerText}>{formData.currency}</Text>
                  <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
                </View>
              </View>
            </View>
          </View>

          {/* Dates */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dates</Text>
            
            {renderDateInput(
              'Transaction Date',
              formData.date || '',
              () => {
                setDatePickerType('date');
                setShowDatePicker(true);
              },
              'Select date'
            )}

            {renderDateInput(
              'Due Date',
              formData.dueDate || '',
              () => {
                setDatePickerType('dueDate');
                setShowDueDatePicker(true);
              },
              'Select due date'
            )}
          </View>

          {/* Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status</Text>
            <View style={styles.statusContainer}>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  formData.status === 'pending' && styles.statusButtonActive,
                ]}
                onPress={() => handleInputChange('status', 'pending')}
              >
                <Text
                  style={[
                    styles.statusButtonText,
                    formData.status === 'pending' && styles.statusButtonTextActive,
                  ]}
                >
                  Pending
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.statusButton,
                  formData.status === 'paid' && styles.statusButtonActive,
                ]}
                onPress={() => handleInputChange('status', 'paid')}
              >
                <Text
                  style={[
                    styles.statusButtonText,
                    formData.status === 'paid' && styles.statusButtonTextActive,
                  ]}
                >
                  Paid
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recurring */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.recurringToggle}
              onPress={handleRecurringToggle}
            >
              <Text style={styles.sectionTitle}>Recurring Transaction</Text>
              <Ionicons
                name={showRecurringOptions ? 'chevron-up' : 'chevron-down'}
                size={24}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>

            {showRecurringOptions && (
              <View style={styles.recurringOptions}>
                <Text style={styles.inputLabel}>Frequency</Text>
                <View style={styles.frequencyContainer}>
                  {RECURRING_FREQUENCIES.map((frequency) => (
                    <TouchableOpacity
                      key={frequency.value}
                      style={[
                        styles.frequencyButton,
                        formData.recurring?.frequency === frequency.value && styles.frequencyButtonActive,
                      ]}
                      onPress={() => handleRecurringFrequencySelect(frequency.value)}
                    >
                      <Text
                        style={[
                          styles.frequencyButtonText,
                          formData.recurring?.frequency === frequency.value && styles.frequencyButtonTextActive,
                        ]}
                      >
                        {frequency.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {formData.recurring && (
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>End Date</Text>
                    <TouchableOpacity
                      style={styles.dateInput}
                      onPress={() => {
                        setDatePickerType('endDate');
                        setShowEndDatePicker(true);
                      }}
                    >
                      <Text style={styles.dateInputText}>
                        {formData.recurring.endDate}
                      </Text>
                      <Ionicons name="calendar" size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.notesInput]}
              value={formData.notes}
              onChangeText={(value) => handleInputChange('notes', value)}
              placeholder="Add any additional notes..."
              placeholderTextColor={COLORS.textSecondary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Errors */}
          {errors.length > 0 && (
            <View style={styles.errorsContainer}>
              {errors.map((error, index) => (
                <Text key={index} style={styles.errorText}>
                  • {error}
                </Text>
              ))}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Ionicons name="trash" size={20} color="white" />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Update Transaction</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Date Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={new Date(formData.date || new Date())}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {showDueDatePicker && (
        <DateTimePicker
          value={new Date(formData.dueDate || new Date())}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={new Date(formData.recurring?.endDate || new Date())}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  formContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.medium,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  typeButtonTextActive: {
    color: 'white',
  },
  inputContainer: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
  },
  notesInput: {
    height: 80,
  },
  row: {
    flexDirection: 'row',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    backgroundColor: COLORS.background,
  },
  pickerText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    backgroundColor: COLORS.background,
  },
  dateInputText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  placeholderText: {
    color: COLORS.textSecondary,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  statusButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  statusButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  statusButtonTextActive: {
    color: 'white',
  },
  recurringToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recurringOptions: {
    marginTop: SPACING.md,
  },
  frequencyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  frequencyButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  frequencyButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  frequencyButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  frequencyButtonTextActive: {
    color: 'white',
  },
  errorsContainer: {
    backgroundColor: COLORS.error,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  errorText: {
    color: 'white',
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: COLORS.error,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  submitButton: {
    flex: 2,
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  submitButtonText: {
    color: 'white',
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
    backgroundColor: COLORS.background,
  },
  errorTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  errorSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  errorButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  errorButtonText: {
    color: 'white',
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
});

export default EditTransactionScreen;
