import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMoneyMateStore } from '../store';
import { SPACING, BORDER_RADIUS, FONT_SIZES, FONTS, CURRENCIES, WALLET_COLORS } from '../constants';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency } from '../utils';
import type { Wallet } from '../types';

const WalletScreen: React.FC = () => {
  const { colors, shadows } = useTheme();
  const {
    wallets,
    walletTransactions,
    addWallet,
    updateWallet,
    deleteWallet,
    updateWalletBalance,
    transferBetweenWallets,
    getWalletTransactions,
  } = useMoneyMateStore();

  const [showAddWallet, setShowAddWallet] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [showEditWallet, setShowEditWallet] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [newWalletData, setNewWalletData] = useState({
    name: '',
    currency: 'EGP',
    balance: 0,
    color: WALLET_COLORS[0],
  });
  const [editWalletData, setEditWalletData] = useState({
    name: '',
    currency: 'EGP',
    color: WALLET_COLORS[0],
  });
  const [transferData, setTransferData] = useState({
    fromWalletId: '',
    toWalletId: '',
    amount: '',
  });
  const [balanceData, setBalanceData] = useState({
    amount: '',
    type: 'credit' as 'credit' | 'debit',
  });

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

  const handleAddWallet = () => {
    if (!newWalletData.name.trim()) {
      Alert.alert('Error', 'Please enter a wallet name');
      return;
    }

    if (newWalletData.balance < 0) {
      Alert.alert('Error', 'Initial balance cannot be negative');
      return;
    }

    addWallet({
      ...newWalletData,
      isDefault: wallets.length === 0, // First wallet becomes default
    });

    setNewWalletData({
      name: '',
      currency: 'EGP',
      balance: 0,
      color: WALLET_COLORS[0],
    });
    setShowAddWallet(false);
  };

  const handleEditWallet = () => {
    if (!selectedWallet || !editWalletData.name.trim()) {
      Alert.alert('Error', 'Please enter a wallet name');
      return;
    }

    updateWallet(selectedWallet.id, {
      name: editWalletData.name,
      color: editWalletData.color,
    });

    setShowEditWallet(false);
    setSelectedWallet(null);
    setEditWalletData({ name: '', currency: 'EGP', color: WALLET_COLORS[0] });
  };

  const handleSetDefaultWallet = (wallet: Wallet) => {
    if (wallet.isDefault) return;

    // Update all wallets to remove default flag
    wallets.forEach(w => {
      if (w.isDefault) {
        updateWallet(w.id, { isDefault: false });
      }
    });

    // Set new default wallet
    updateWallet(wallet.id, { isDefault: true });
  };

  const handleUpdateBalance = () => {
    if (!selectedWallet || !balanceData.amount.trim()) {
      Alert.alert('Error', 'Please enter an amount');
      return;
    }

    const amount = parseFloat(balanceData.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    updateWalletBalance(selectedWallet.id, amount, balanceData.type);
    setShowBalanceModal(false);
    setSelectedWallet(null);
    setBalanceData({ amount: '', type: 'credit' });
  };

  const handleTransfer = () => {
    if (!transferData.fromWalletId || !transferData.toWalletId || !transferData.amount.trim()) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (transferData.fromWalletId === transferData.toWalletId) {
      Alert.alert('Error', 'Cannot transfer to the same wallet');
      return;
    }

    const amount = parseFloat(transferData.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const fromWallet = wallets.find(w => w.id === transferData.fromWalletId);
    if (fromWallet && fromWallet.balance < amount) {
      Alert.alert('Error', 'Insufficient balance in source wallet');
      return;
    }

    transferBetweenWallets(transferData.fromWalletId, transferData.toWalletId, amount);
    setShowTransferModal(false);
    setTransferData({ fromWalletId: '', toWalletId: '', amount: '' });
  };

  const handleDeleteWallet = (wallet: Wallet) => {
    if (wallet.isDefault) {
      Alert.alert('Error', 'Cannot delete the default wallet');
      return;
    }

    Alert.alert(
      'Delete Wallet',
      `Are you sure you want to delete "${wallet.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteWallet(wallet.id),
        },
      ]
    );
  };

  const openEditWallet = (wallet: Wallet) => {
    setEditWalletData({
      name: wallet.name,
      currency: wallet.currency,
      color: wallet.color,
    });
    setSelectedWallet(wallet);
    setShowEditWallet(true);
  };

  const getTotalBalance = () => {
    return wallets.reduce((total, wallet) => total + wallet.balance, 0);
  };

  const renderWalletCard = (wallet: Wallet) => {
    const transactions = getWalletTransactions(wallet.id);
    const recentTransactions = transactions.slice(0, 3);

    return (
      <View key={wallet.id} style={[styles.walletCard, { backgroundColor: colors.cardBackground, ...shadows.medium }]}>
        <View style={styles.walletHeader}>
          <View style={[styles.walletIcon, { backgroundColor: wallet.color }]}>
            <Ionicons name="wallet" size={24} color="white" />
          </View>
          <View style={styles.walletInfo}>
            <Text style={[styles.walletName, { color: colors.textPrimary }]}>{wallet.name}</Text>
            <Text style={[styles.walletCurrency, { color: colors.textSecondary }]}>{wallet.currency}</Text>
          </View>
          <View style={styles.walletActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
              onPress={() => {
                setSelectedWallet(wallet);
                setShowBalanceModal(true);
              }}
            >
              <Ionicons name="add-circle" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
              onPress={() => openEditWallet(wallet)}
            >
              <Ionicons name="create" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
              onPress={() => handleDeleteWallet(wallet)}
            >
              <Ionicons name="trash" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.walletBalance}>
          <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Current Balance</Text>
          <Text style={[styles.balanceAmount, { color: colors.textPrimary }]}>
            {formatCurrency(wallet.balance, wallet.currency)}
          </Text>
        </View>

        <View style={styles.walletDefault}>
          {wallet.isDefault && (
            <View style={[styles.defaultBadge, { backgroundColor: colors.warning + '20' }]}>
              <Ionicons name="star" size={16} color={colors.warning} />
              <Text style={[styles.defaultBadgeText, { color: colors.warning }]}>Default</Text>
            </View>
          )}
          {!wallet.isDefault && (
            <TouchableOpacity
              style={[styles.setDefaultButton, { backgroundColor: colors.primary + '20' }]}
              onPress={() => handleSetDefaultWallet(wallet)}
            >
              <Text style={[styles.setDefaultButtonText, { color: colors.primary }]}>Set as Default</Text>
            </TouchableOpacity>
          )}
        </View>

        {recentTransactions.length > 0 && (
          <View style={[styles.recentTransactions, { borderTopColor: colors.border }]}>
            <Text style={[styles.recentTitle, { color: colors.textPrimary }]}>Recent Activity</Text>
            {recentTransactions.map((transaction) => (
              <View key={transaction.id} style={[styles.transactionItem, { borderBottomColor: colors.border + '30' }]}>
                <View style={styles.transactionInfo}>
                  <Text style={[styles.transactionDescription, { color: colors.textPrimary }]} numberOfLines={1}>
                    {transaction.description}
                  </Text>
                  <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>
                    {new Date(transaction.date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.transactionAmount}>
                  <Text
                    style={[
                      styles.transactionAmountText,
                      { color: transaction.type === 'credit' ? colors.success : colors.error },
                    ]}
                  >
                    {transaction.type === 'credit' ? '+' : '-'}
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </Text>
                  <Text style={[styles.balanceAfter, { color: colors.textSecondary }]}>
                    Balance: {formatCurrency(transaction.balanceAfter, transaction.currency)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>My Wallets</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Manage your currency wallets</Text>
            </View>

            {/* Total Balance Card */}
            <View style={[styles.totalBalanceCard, { backgroundColor: colors.cardBackground, ...shadows.medium }]}>
              <View style={styles.totalBalanceHeader}>
                <Ionicons name="wallet" size={32} color={colors.primary} />
                <Text style={[styles.totalBalanceTitle, { color: colors.textPrimary }]}>Total Balance</Text>
              </View>
              <Text style={[styles.totalBalanceAmount, { color: colors.primary }]}>
                {formatCurrency(getTotalBalance(), 'EGP')}
              </Text>
              <Text style={[styles.totalBalanceSubtitle, { color: colors.textSecondary }]}>
                Across {wallets.length} wallet{wallets.length !== 1 ? 's' : ''}
              </Text>
            </View>

            {/* Wallets List */}
            <View style={styles.walletsSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Your Wallets</Text>
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: colors.primary, ...shadows.small }]}
                  onPress={() => setShowAddWallet(true)}
                >
                  <Ionicons name="add" size={20} color="white" />
                  <Text style={styles.addButtonText}>Add Wallet</Text>
                </TouchableOpacity>
              </View>

              {wallets.length > 0 ? (
                wallets.map(renderWalletCard)
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="wallet-outline" size={64} color={colors.textSecondary} />
                  <Text style={[styles.emptyStateTitle, { color: colors.textPrimary }]}>No Wallets Yet</Text>
                  <Text style={[styles.emptyStateSubtitle, { color: colors.textSecondary }]}>
                    Create your first wallet to start tracking your money
                  </Text>
                </View>
              )}
            </View>

            {/* Transfer Button */}
            {wallets.length > 1 && (
              <TouchableOpacity
                style={[styles.transferButton, { backgroundColor: colors.secondary, ...shadows.medium }]}
                onPress={() => setShowTransferModal(true)}
              >
                <Ionicons name="swap-horizontal" size={24} color="white" />
                <Text style={styles.transferButtonText}>Transfer Between Wallets</Text>
              </TouchableOpacity>
            )}
            
            {/* Bottom spacing for tab bar */}
            <View style={styles.bottomSpacing} />
          </Animated.View>
        </ScrollView>

        {/* Add Wallet Modal */}
        <Modal
          visible={showAddWallet}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowAddWallet(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Add New Wallet</Text>
                <TouchableOpacity onPress={() => setShowAddWallet(false)}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="Wallet Name"
                placeholderTextColor={colors.textSecondary}
                value={newWalletData.name}
                onChangeText={(text) => setNewWalletData(prev => ({ ...prev, name: text }))}
              />

              <View style={styles.currencyRow}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>Currency</Text>
                <View style={styles.currencyPicker}>
                  {CURRENCIES.map((currency) => (
                    <TouchableOpacity
                      key={currency.code}
                      style={[
                        styles.currencyOption,
                        newWalletData.currency === currency.code && styles.currencyOptionSelected,
                        { borderColor: colors.border }
                      ]}
                      onPress={() => setNewWalletData(prev => ({ ...prev, currency: currency.code }))}
                    >
                      <Text style={[
                        styles.currencyOptionText,
                        { color: newWalletData.currency === currency.code ? colors.primary : colors.textSecondary }
                      ]}>
                        {currency.code}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.balanceRow}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>Initial Balance</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="0.00"
                  placeholderTextColor={colors.textSecondary}
                  value={newWalletData.balance.toString()}
                  onChangeText={(text) => setNewWalletData(prev => ({ ...prev, balance: parseFloat(text) || 0 }))}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.colorRow}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>Wallet Color</Text>
                <View style={styles.colorPicker}>
                  {WALLET_COLORS.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        newWalletData.color === color && styles.colorOptionSelected,
                      ]}
                      onPress={() => setNewWalletData(prev => ({ ...prev, color }))}
                    >
                      {newWalletData.color === color && (
                        <Ionicons name="checkmark" size={20} color="white" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleAddWallet}
              >
                <Text style={[styles.modalButtonText, { color: 'white' }]}>Create Wallet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Edit Wallet Modal */}
        <Modal
          visible={showEditWallet}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowEditWallet(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Edit Wallet</Text>
                <TouchableOpacity onPress={() => setShowEditWallet(false)}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="Wallet Name"
                placeholderTextColor={colors.textSecondary}
                value={editWalletData.name}
                onChangeText={(text) => setEditWalletData(prev => ({ ...prev, name: text }))}
              />

              <View style={styles.currencyRow}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>Currency</Text>
                <View style={styles.currencyPicker}>
                  {CURRENCIES.map((currency) => (
                    <TouchableOpacity
                      key={currency.code}
                      style={[
                        styles.currencyOption,
                        editWalletData.currency === currency.code && styles.currencyOptionSelected,
                        { borderColor: colors.border }
                      ]}
                      onPress={() => setEditWalletData(prev => ({ ...prev, currency: currency.code }))}
                    >
                      <Text style={[
                        styles.currencyOptionText,
                        { color: editWalletData.currency === currency.code ? colors.primary : colors.textSecondary }
                      ]}>
                        {currency.code}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.colorRow}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>Wallet Color</Text>
                <View style={styles.colorPicker}>
                  {WALLET_COLORS.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        editWalletData.color === color && styles.colorOptionSelected,
                      ]}
                      onPress={() => setEditWalletData(prev => ({ ...prev, color }))}
                    >
                      {editWalletData.color === color && (
                        <Ionicons name="checkmark" size={20} color="white" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleEditWallet}
              >
                <Text style={[styles.modalButtonText, { color: 'white' }]}>Update Wallet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Balance Update Modal */}
        <Modal
          visible={showBalanceModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowBalanceModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Update Balance</Text>
                <TouchableOpacity onPress={() => setShowBalanceModal(false)}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Update balance for {selectedWallet?.name}
              </Text>

              <View style={styles.balanceTypeRow}>
                <TouchableOpacity
                  style={[
                    styles.balanceTypeButton,
                    { borderColor: colors.border },
                    balanceData.type === 'credit' && { backgroundColor: colors.success, borderColor: colors.success }
                  ]}
                  onPress={() => setBalanceData(prev => ({ ...prev, type: 'credit' }))}
                >
                  <Ionicons name="add-circle" size={20} color={balanceData.type === 'credit' ? 'white' : colors.success} />
                  <Text style={[
                    styles.balanceTypeButtonText,
                    { color: balanceData.type === 'credit' ? 'white' : colors.success }
                  ]}>
                    Credit
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.balanceTypeButton,
                    { borderColor: colors.border },
                    balanceData.type === 'debit' && { backgroundColor: colors.error, borderColor: colors.error }
                  ]}
                  onPress={() => setBalanceData(prev => ({ ...prev, type: 'debit' }))}
                >
                  <Ionicons name="remove-circle" size={20} color={balanceData.type === 'debit' ? 'white' : colors.error} />
                  <Text style={[
                    styles.balanceTypeButtonText,
                    { color: balanceData.type === 'debit' ? 'white' : colors.error }
                  ]}>
                    Debit
                  </Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="Amount"
                placeholderTextColor={colors.textSecondary}
                value={balanceData.amount}
                onChangeText={(text) => setBalanceData(prev => ({ ...prev, amount: text }))}
                keyboardType="numeric"
              />

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleUpdateBalance}
              >
                <Text style={[styles.modalButtonText, { color: 'white' }]}>Update Balance</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Transfer Modal */}
        <Modal
          visible={showTransferModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowTransferModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Transfer Between Wallets</Text>
                <TouchableOpacity onPress={() => setShowTransferModal(false)}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.transferRow}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>From Wallet</Text>
                <View style={styles.walletPicker}>
                  {wallets.map((wallet) => (
                    <TouchableOpacity
                      key={wallet.id}
                      style={[
                        styles.walletOption,
                        { borderColor: colors.border },
                        transferData.fromWalletId === wallet.id && { backgroundColor: colors.primary, borderColor: colors.primary }
                      ]}
                      onPress={() => setTransferData(prev => ({ ...prev, fromWalletId: wallet.id }))}
                    >
                      <View style={[styles.walletOptionIcon, { backgroundColor: wallet.color }]}>
                        <Ionicons name="wallet" size={16} color="white" />
                      </View>
                      <Text style={[
                        styles.walletOptionText,
                        { color: transferData.fromWalletId === wallet.id ? 'white' : colors.textPrimary }
                      ]}>
                        {wallet.name} ({wallet.currency})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.transferRow}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>To Wallet</Text>
                <View style={styles.walletPicker}>
                  {wallets.map((wallet) => (
                    <TouchableOpacity
                      key={wallet.id}
                      style={[
                        styles.walletOption,
                        { borderColor: colors.border },
                        transferData.toWalletId === wallet.id && { backgroundColor: colors.primary, borderColor: colors.primary }
                      ]}
                      onPress={() => setTransferData(prev => ({ ...prev, toWalletId: wallet.id }))}
                    >
                      <View style={[styles.walletOptionIcon, { backgroundColor: wallet.color }]}>
                        <Ionicons name="wallet" size={16} color="white" />
                      </View>
                      <Text style={[
                        styles.walletOptionText,
                        { color: transferData.toWalletId === wallet.id ? 'white' : colors.textPrimary }
                      ]}>
                        {wallet.name} ({wallet.currency})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="Transfer Amount"
                placeholderTextColor={colors.textSecondary}
                value={transferData.amount}
                onChangeText={(text) => setTransferData(prev => ({ ...prev, amount: text }))}
                keyboardType="numeric"
              />

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.secondary }]}
                onPress={handleTransfer}
              >
                <Text style={[styles.modalButtonText, { color: 'white' }]}>Transfer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Changed to transparent to allow background to show through
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.bold,
    color: 'white', // Changed to white to match background
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: 'white', // Changed to white to match background
  },
  totalBalanceCard: {
    backgroundColor: 'transparent', // Changed to transparent to allow background to show through
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  totalBalanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  totalBalanceTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.medium,
    color: 'white', // Changed to white to match background
    marginLeft: SPACING.sm,
  },
  totalBalanceAmount: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.bold,
    color: 'white', // Changed to white to match background
    marginBottom: SPACING.xs,
  },
  totalBalanceSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: 'white', // Changed to white to match background
  },
  walletsSection: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: 'white', // Changed to white to match background
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent', // Changed to transparent to allow background to show through
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  addButtonText: {
    color: 'white',
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    marginLeft: SPACING.xs,
  },
  walletCard: {
    backgroundColor: 'transparent', // Changed to transparent to allow background to show through
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  walletIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  walletInfo: {
    flex: 1,
  },
  walletName: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: 'white', // Changed to white to match background
    marginBottom: SPACING.xs,
  },
  walletCurrency: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: 'white', // Changed to white to match background
  },
  walletActions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: 'transparent', // Changed to transparent to allow background to show through
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'white', // Changed to white to match background
  },
  walletBalance: {
    marginBottom: SPACING.md,
  },
  balanceLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: 'white', // Changed to white to match background
    marginBottom: SPACING.xs,
  },
  balanceAmount: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: 'white', // Changed to white to match background
  },
  walletDefault: {
    marginBottom: SPACING.md,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent', // Changed to transparent to allow background to show through
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
  },
  defaultBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: 'white', // Changed to white to match background
    marginLeft: SPACING.xs,
  },
  setDefaultButton: {
    backgroundColor: 'transparent', // Changed to transparent to allow background to show through
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
  },
  setDefaultButtonText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: 'white', // Changed to white to match background
  },
  recentTransactions: {
    borderTopWidth: 1,
    borderTopColor: 'white', // Changed to white to match background
    paddingTop: SPACING.md,
  },
  recentTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    color: 'white', // Changed to white to match background
    marginBottom: SPACING.sm,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'white', // Changed to white to match background
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: 'white', // Changed to white to match background
    marginBottom: SPACING.xs,
  },
  transactionDate: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: 'white', // Changed to white to match background
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAmountText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bold,
    color: 'white', // Changed to white to match background
    marginBottom: SPACING.xs,
  },
  balanceAfter: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: 'white', // Changed to white to match background
  },
  transferButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent', // Changed to transparent to allow background to show through
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.xl,
  },
  transferButtonText: {
    color: 'white',
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    marginLeft: SPACING.sm,
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  emptyStateTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: 'white', // Changed to white to match background
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: 'white', // Changed to white to match background
    textAlign: 'center',
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'transparent', // Changed to transparent to allow background to show through
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: 'white', // Changed to white to match background
  },
  modalSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: 'white', // Changed to white to match background
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: 'white', // Changed to white to match background
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: 'white', // Changed to white to match background
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: 'white', // Changed to white to match background
    marginBottom: SPACING.sm,
  },
  currencyRow: {
    marginBottom: SPACING.md,
  },
  currencyPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  currencyOption: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: 'transparent', // Changed to transparent to allow background to show through
    borderWidth: 1,
    borderColor: 'white', // Changed to white to match background
  },
  currencyOptionSelected: {
    backgroundColor: 'white', // Changed to white to match background
    borderColor: 'white', // Changed to white to match background
  },
  currencyOptionText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: 'white', // Changed to white to match background
  },
  currencyOptionTextSelected: {
    color: 'white', // Changed to white to match background
  },
  colorRow: {
    marginBottom: SPACING.md,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: 'white', // Changed to white to match background
  },
  balanceTypeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  balanceTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'transparent', // Changed to transparent to allow background to show through
    borderWidth: 1,
    borderColor: 'white', // Changed to white to match background
  },
  balanceTypeButtonActive: {
    backgroundColor: 'white', // Changed to white to match background
    borderColor: 'white', // Changed to white to match background
  },
  balanceTypeButtonText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: 'white', // Changed to white to match background
    marginLeft: SPACING.xs,
  },
  balanceTypeButtonTextActive: {
    color: 'white', // Changed to white to match background
  },
  transferRow: {
    marginBottom: SPACING.md,
  },
  walletPicker: {
    gap: SPACING.xs,
  },
  walletOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: 'transparent', // Changed to transparent to allow background to show through
    borderWidth: 1,
    borderColor: 'white', // Changed to white to match background
  },
  walletOptionSelected: {
    backgroundColor: 'white', // Changed to white to match background
    borderColor: 'white', // Changed to white to match background
  },
  walletOptionIcon: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  walletOptionText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: 'white', // Changed to white to match background
  },
  walletOptionTextSelected: {
    color: 'white', // Changed to white to match background
  },
  modalButton: {
    backgroundColor: 'white', // Changed to white to match background
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white', // Changed to white to match background
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
  balanceRow: {
    marginBottom: SPACING.md,
  },
  bottomSpacing: {
    height: 80, // Space for tab bar
  },
});

export default WalletScreen;
