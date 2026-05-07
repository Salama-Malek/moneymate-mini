import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useMoneyMateStore } from '../store';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONT_SIZES, CURRENCIES } from '../constants';
import TransactionCard from '../components/TransactionCard';
import { formatCurrency } from '../utils';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation';

type TransactionsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

type TabType = 'active' | 'archived';

const TransactionsScreen: React.FC = () => {
  const navigation = useNavigation<TransactionsScreenNavigationProp>();
  const {
    transactions,
    archivedTransactions,
    archiveTransaction,
    restoreTransaction,
    deleteTransaction,
    searchTransactions,
    filterTransactions,
  } = useMoneyMateStore();

  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    type: '',
    status: '',
    currency: '',
  });

  const slideAnim = useRef(new Animated.Value(0)).current;
  const filterAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate tab indicator
    Animated.spring(slideAnim, {
      toValue: activeTab === 'active' ? 0 : 1,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  }, [activeTab]);

  useEffect(() => {
    // Animate filters
    Animated.timing(filterAnim, {
      toValue: showFilters ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showFilters]);

  const handleTabPress = (tab: TabType) => {
    setActiveTab(tab);
    setSearchQuery('');
    setSelectedFilters({ type: '', status: '', currency: '' });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (filterType: keyof typeof selectedFilters, value: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType] === value ? '' : value,
    }));
  };

  const handleEditTransaction = (transactionId: string) => {
    navigation.navigate('EditTransaction', { transactionId });
  };

  const handleArchiveTransaction = (transactionId: string) => {
    Alert.alert(
      'Archive Transaction',
      'Are you sure you want to archive this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Archive', style: 'destructive', onPress: () => archiveTransaction(transactionId) },
      ]
    );
  };

  const handleDeleteTransaction = (transactionId: string) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteTransaction(transactionId) },
      ]
    );
  };

  const handleRestoreTransaction = (transactionId: string) => {
    restoreTransaction(transactionId);
  };

  const getFilteredTransactions = () => {
    let source = activeTab === 'active' ? transactions.filter(t => !t.archived) : archivedTransactions;

    // Apply search
    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      source = source.filter(t =>
        t.person.toLowerCase().includes(lower) ||
        t.notes?.toLowerCase().includes(lower) ||
        t.amount.toString().includes(lower)
      );
    }

    // Apply filters
    if (selectedFilters.type) source = source.filter(t => t.type === selectedFilters.type);
    if (selectedFilters.status) source = source.filter(t => t.status === selectedFilters.status);
    if (selectedFilters.currency) source = source.filter(t => t.currency === selectedFilters.currency);

    return source;
  };

  const filteredTransactions = getFilteredTransactions();

  const tabIndicatorLeft = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 150], // Adjust based on tab width
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Search and Filter Header */}
        <View style={styles.header}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={COLORS.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search transactions..."
              placeholderTextColor={COLORS.textSecondary}
              value={searchQuery}
              onChangeText={handleSearch}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.filterButton, showFilters && styles.filterButtonActive]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="filter" size={20} color={showFilters ? COLORS.primary : COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <Animated.View
          style={[
            styles.filtersContainer,
            {
              maxHeight: filterAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 200],
              }),
              opacity: filterAnim,
            },
          ]}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedFilters.type === 'lend' && styles.filterChipActive,
              ]}
              onPress={() => handleFilterChange('type', 'lend')}
            >
              <Text style={[styles.filterChipText, selectedFilters.type === 'lend' && styles.filterChipTextActive]}>
                Lend
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedFilters.type === 'borrow' && styles.filterChipActive,
              ]}
              onPress={() => handleFilterChange('type', 'borrow')}
            >
              <Text style={[styles.filterChipText, selectedFilters.type === 'borrow' && styles.filterChipTextActive]}>
                Borrow
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedFilters.status === 'pending' && styles.filterChipActive,
              ]}
              onPress={() => handleFilterChange('status', 'pending')}
            >
              <Text style={[styles.filterChipText, selectedFilters.status === 'pending' && styles.filterChipTextActive]}>
                Pending
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedFilters.status === 'paid' && styles.filterChipActive,
              ]}
              onPress={() => handleFilterChange('status', 'paid')}
            >
              <Text style={[styles.filterChipText, selectedFilters.status === 'paid' && styles.filterChipTextActive]}>
                Paid
              </Text>
            </TouchableOpacity>

            {CURRENCIES.map((currency) => (
              <TouchableOpacity
                key={currency.code}
                style={[
                  styles.filterChip,
                  selectedFilters.currency === currency.code && styles.filterChipActive,
                ]}
                onPress={() => handleFilterChange('currency', currency.code)}
              >
                <Text style={[styles.filterChipText, selectedFilters.currency === currency.code && styles.filterChipTextActive]}>
                  {currency.code}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => handleTabPress('active')}
          >
            <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
              Active ({transactions.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tab}
            onPress={() => handleTabPress('archived')}
          >
            <Text style={[styles.tabText, activeTab === 'archived' && styles.tabTextActive]}>
              Archived ({archivedTransactions.length})
            </Text>
          </TouchableOpacity>

          <Animated.View
            style={[
              styles.tabIndicator,
              {
                left: tabIndicatorLeft,
              },
            ]}
          />
        </View>

        {/* Transactions List */}
        <ScrollView style={styles.transactionsList} showsVerticalScrollIndicator={false}>
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                onEdit={() => handleEditTransaction(transaction.id)}
                onArchive={() => handleArchiveTransaction(transaction.id)}
                onDelete={() => handleDeleteTransaction(transaction.id)}
                onRestore={activeTab === 'archived' ? () => handleRestoreTransaction(transaction.id) : undefined}
                onPress={() => handleEditTransaction(transaction.id)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons
                name={activeTab === 'active' ? 'document-text' : 'archive'}
                size={64}
                color={COLORS.textSecondary}
              />
              <Text style={styles.emptyStateTitle}>
                {searchQuery || Object.values(selectedFilters).some(f => f)
                  ? 'No transactions found'
                  : activeTab === 'active'
                  ? 'No active transactions'
                  : 'No archived transactions'
                }
              </Text>
              <Text style={styles.emptyStateSubtitle}>
                {searchQuery || Object.values(selectedFilters).some(f => f)
                  ? 'Try adjusting your search or filters'
                  : activeTab === 'active'
                  ? 'Add your first transaction to get started!'
                  : 'Archived transactions will appear here'
                }
              </Text>
            </View>
          )}
          
          {/* Bottom spacing for tab bar */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    ...SHADOWS.small,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filtersContainer: {
    overflow: 'hidden',
  },
  filtersScroll: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.cardBackground,
    marginRight: SPACING.sm,
    ...SHADOWS.small,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: 'white',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xs,
    ...SHADOWS.small,
    position: 'relative',
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  tabText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    top: SPACING.xs,
    bottom: SPACING.xs,
    width: 150,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    opacity: 0.2,
  },
  transactionsList: {
    flex: 1,
    paddingHorizontal: SPACING.sm,
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xxl,
    marginTop: SPACING.xl,
  },
  emptyStateTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomSpacing: {
    height: 80, // Space for tab bar
  },
});

export default TransactionsScreen;
