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
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMoneyMateStore } from '../store';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONT_SIZES, CURRENCIES, RECURRING_FREQUENCIES, FONTS, CATEGORIES, DEFAULT_CATEGORY_ID } from '../constants';
import { validateTransaction, formatCurrency } from '../utils';
import type { Transaction } from '../types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const AddTransactionScreen: React.FC = () => {
  const navigation = useNavigation();
  const { addTransaction, settings, getWalletByCurrency } = useMoneyMateStore();

  const [formData, setFormData] = useState({
    type: 'lend' as 'lend' | 'borrow',
    person: '',
    amount: 0,
    currency: settings.defaultCurrency,
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'pending' as 'pending' | 'paid',
    notes: '',
    category: DEFAULT_CATEGORY_ID,
    recurring: null as { frequency: string; endDate: string } | null,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState<'date' | 'dueDate' | 'endDate'>('date');
  const [showRecurringOptions, setShowRecurringOptions] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
  }, []);

  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleCurrencySelect = (currency: string) => {
    setFormData(prev => ({ ...prev, currency }));
    setShowCurrencyPicker(false);
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
      endDate.setDate(endDate.getDate() + selectedFrequency.days * 12); // 12 cycles
      
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
    const errors = validateTransaction(formData);
    if (errors.length > 0) {
      Alert.alert('Validation Error', errors.join('\n'));
      return;
    }

    // Check wallet balance for lending transactions
    if (formData.type === 'lend') {
      const wallet = getWalletByCurrency(formData.currency);
      if (wallet && wallet.balance < formData.amount) {
        Alert.alert(
          'Insufficient Funds',
          `You only have ${formatCurrency(wallet.balance, formData.currency)} in your ${formData.currency} wallet. Do you want to continue?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Continue', style: 'destructive', onPress: submitTransaction },
          ]
        );
        return;
      }
    }

    submitTransaction();
  };

  const submitTransaction = () => {
    const payload: Omit<Transaction, 'id'> = {
      ...formData,
      archived: false,
    } as Omit<Transaction, 'id'>;
    addTransaction(payload);
    navigation.goBack();
  };

  const getWalletBalance = (currency: string) => {
    const wallet = getWalletByCurrency(currency);
    return wallet ? wallet.balance : 0;
  };

  const renderWalletBalance = () => {
    const balance = getWalletBalance(formData.currency);
    return (
      <View style={styles.walletBalanceContainer}>
        <Text style={styles.walletBalanceLabel}>
          Available in {formData.currency} wallet:
        </Text>
        <Text style={[
          styles.walletBalanceAmount,
          { color: balance >= formData.amount ? COLORS.success : COLORS.error }
        ]}>
          {formatCurrency(balance, formData.currency)}
        </Text>
        {formData.type === 'lend' && balance < formData.amount && (
          <Text style={styles.insufficientFundsWarning}>
            ⚠️ Insufficient funds for this transaction
          </Text>
        )}
      </View>
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

  const renderCurrencyPicker = () => (
    <Modal
      visible={showCurrencyPicker}
      transparent
      animationType="slide"
      onRequestClose={() => setShowCurrencyPicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.currencyPickerContainer}>
          <View style={styles.currencyPickerHeader}>
            <Text style={styles.currencyPickerTitle}>Select Currency</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCurrencyPicker(false)}
            >
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.currencyList} showsVerticalScrollIndicator={false}>
            {CURRENCIES.map((currency) => (
              <TouchableOpacity
                key={currency.code}
                style={[
                  styles.currencyOption,
                  formData.currency === currency.code && styles.currencyOptionSelected
                ]}
                onPress={() => handleCurrencySelect(currency.code)}
              >
                <View style={styles.currencyOptionContent}>
                  <Text style={[
                    styles.currencyOptionCode,
                    formData.currency === currency.code && styles.currencyCodeSelected
                  ]}>
                    {currency.code}
                  </Text>
                  <Text style={[
                    styles.currencyOptionName,
                    formData.currency === currency.code && styles.currencyNameSelected
                  ]}>
                    {currency.name}
                  </Text>
                </View>
                <Text style={[
                  styles.currencyOptionSymbol,
                  formData.currency === currency.code && styles.currencySymbolSelected
                ]}>
                  {currency.symbol}
                </Text>
                {formData.currency === currency.code && (
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
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
                    value={formData.amount.toString()}
                    onChangeText={(value) => handleInputChange('amount', parseFloat(value) || 0)}
                    placeholder="0.00"
                    placeholderTextColor={COLORS.textSecondary}
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.inputContainer, { flex: 1, marginLeft: SPACING.sm }]}>
                  <Text style={styles.inputLabel}>Currency</Text>
                  <TouchableOpacity
                    style={styles.pickerContainer}
                    onPress={() => setShowCurrencyPicker(true)}
                  >
                    <View style={styles.currencyDisplay}>
                      <Text style={styles.currencyCode}>{formData.currency}</Text>
                      <Text style={styles.currencySymbol}>
                        {CURRENCIES.find(c => c.code === formData.currency)?.symbol || ''}
                      </Text>
                    </View>
                    <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Wallet Balance Display */}
              {renderWalletBalance()}
            </View>

            {/* Dates */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dates</Text>
              
              {renderDateInput(
                'Transaction Date',
                formData.date,
                () => {
                  setDatePickerType('date');
                  setShowDatePicker(true);
                },
                'Select date'
              )}

              {renderDateInput(
                'Due Date',
                formData.dueDate,
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

            {/* Category */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: SPACING.sm, gap: SPACING.sm }}>
                {CATEGORIES.map((cat) => {
                  const selected = formData.category === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => handleInputChange('category', cat.id)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: SPACING.md,
                        paddingVertical: SPACING.sm,
                        marginRight: SPACING.sm,
                        borderRadius: BORDER_RADIUS.md,
                        backgroundColor: selected ? cat.color : COLORS.cardBackground,
                        borderWidth: 1,
                        borderColor: selected ? cat.color : COLORS.border,
                      }}
                    >
                      <Ionicons name={cat.icon as any} size={16} color={selected ? 'white' : cat.color} />
                      <Text style={{ marginLeft: SPACING.xs, color: selected ? 'white' : COLORS.textPrimary, fontWeight: '600' }}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
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

            {/* Submit Button */}
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Add Transaction</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>

        {/* Currency Picker Modal */}
        {renderCurrencyPicker()}

        {/* Date Pickers */}
        {showDatePicker && (
          <DateTimePicker
            value={new Date(formData.date)}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}

        {showDueDatePicker && (
          <DateTimePicker
            value={new Date(formData.dueDate)}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
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
  currencyDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  currencyCode: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  currencySymbol: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
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
  submitButton: {
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
  // Wallet Balance Styles
  walletBalanceContainer: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  walletBalanceLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    fontFamily: FONTS.regular,
  },
  walletBalanceAmount: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  insufficientFundsWarning: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    marginTop: SPACING.xs,
    fontFamily: FONTS.medium,
  },
  // Currency Picker Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  currencyPickerContainer: {
    backgroundColor: COLORS.cardBackground,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: screenHeight * 0.7,
    paddingBottom: SPACING.lg,
  },
  currencyPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  currencyPickerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: SPACING.sm,
  },
  currencyList: {
    maxHeight: screenHeight * 0.5,
  },
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  currencyOptionSelected: {
    backgroundColor: COLORS.primary + '10',
  },
  currencyOptionContent: {
    flex: 1,
  },
  currencyOptionCode: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  currencyCodeSelected: {
    color: COLORS.primary,
  },
  currencyOptionName: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  currencyNameSelected: {
    color: COLORS.primary,
  },
  currencyOptionSymbol: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginRight: SPACING.md,
  },
  currencySymbolSelected: {
    color: COLORS.primary,
  },
});

export default AddTransactionScreen;
