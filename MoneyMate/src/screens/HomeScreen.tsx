import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Animated,
  Alert,
  Dimensions,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useMoneyMateStore } from '../store';
import { SPACING, BORDER_RADIUS, FONT_SIZES, FONTS, BRANDING } from '../constants';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { soundVibrationService } from '../utils/soundVibrationService';

import TransactionCard from '../components/TransactionCard';
import FloatingActionButton from '../components/FloatingActionButton';
import { formatCurrency } from '../utils';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { colors, shadows } = useTheme();
  const { t } = useLanguage();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const {
    getDashboardStats,
    getUpcomingTransactions,
    getOverdueTransactions,
    wallets,
    isLoading,
    setLoading,
  } = useMoneyMateStore();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Animate screen entrance
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

  const stats = getDashboardStats();
  const upcomingTransactions = getUpcomingTransactions();
  const overdueTransactions = getOverdueTransactions();

  // Calculate responsive values
  const isSmallScreen = screenWidth < 375;
  const isMediumScreen = screenWidth >= 375 && screenWidth < 768;
  const isLargeScreen = screenWidth >= 768;
  
  const cardWidth = isLargeScreen ? (screenWidth - SPACING.lg * 3) / 2 : screenWidth - SPACING.lg * 2;
  const walletCardWidth = isLargeScreen ? (screenWidth - SPACING.lg * 4) / 3 : (screenWidth - SPACING.lg * 3) / 2;

  // Enhanced stats data with real values and better formatting
  const enhancedStats = [
    {
      id: 'totalLent',
      title: t('analytics.totalLent'),
      value: stats.totalLent,
      subtitle: t('analytics.overview'),
      icon: 'trending-up',
      color: colors.primary,
      trend: 'up',
      description: t('analytics.totalLent'),
      change: '+12.5%',
      changeType: 'positive' as const,
    },
    {
      id: 'totalBorrowed',
      title: t('analytics.totalBorrowed'),
      value: stats.totalBorrowed,
      subtitle: t('analytics.overview'),
      icon: 'trending-down',
      color: colors.secondary,
      trend: 'down',
      description: t('analytics.totalBorrowed'),
      change: '+8.2%',
      changeType: 'positive' as const,
    },
    {
      id: 'outstandingLent',
      title: t('analytics.outstanding'),
      value: stats.outstandingLent,
      subtitle: t('transaction.pending'),
      icon: 'time',
      color: colors.warning,
      trend: 'neutral',
      description: t('analytics.outstanding'),
      change: stats.overdueCount > 0 ? `${stats.overdueCount} ${t('analytics.overdue')}` : t('transaction.paid'),
      changeType: stats.overdueCount > 0 ? 'negative' as const : 'positive' as const,
    },
    {
      id: 'outstandingBorrowed',
      title: t('analytics.outstanding'),
      value: stats.outstandingBorrowed,
      subtitle: t('transaction.pending'),
      icon: 'card',
      color: colors.error,
      trend: 'neutral',
      description: t('analytics.outstanding'),
      change: t('analytics.upcoming'),
      changeType: 'neutral' as const,
    },
    {
      id: 'totalWalletBalance',
      title: t('home.totalBalance'),
      value: stats.totalWalletBalance || 0,
      subtitle: t('home.totalBalance'),
      icon: 'wallet',
      color: colors.success,
      trend: 'up',
      description: t('home.totalBalance'),
      change: '+15.3%',
      changeType: 'positive' as const,
    },
    {
      id: 'defaultCurrencyBalance',
      title: t('home.totalBalance'),
      value: stats.defaultCurrencyBalance || 0,
      subtitle: t('home.totalBalance'),
      icon: 'star',
      color: colors.primary,
      trend: 'neutral',
      description: t('home.totalBalance'),
      change: t('home.totalBalance'),
      changeType: 'neutral' as const,
    },
  ];

  const handleRefresh = async () => {
    await soundVibrationService.buttonPress();
    setLoading(true);
    // Simulate refresh delay
    setTimeout(() => setLoading(false), 1000);
  };

  const handleAddTransaction = async () => {
    await soundVibrationService.buttonPress();
    navigation.navigate('AddTransaction');
  };

  const handleEditTransaction = async (transactionId: string) => {
    await soundVibrationService.buttonPress();
    navigation.navigate('EditTransaction', { transactionId });
  };

  const handleArchiveTransaction = async (transactionId: string) => {
    await soundVibrationService.buttonPress();
    Alert.alert(
      'Archive Transaction',
      'Are you sure you want to archive this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Archive', 
          style: 'destructive',
          onPress: () => soundVibrationService.transactionUpdated(),
        },
      ]
    );
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    await soundVibrationService.buttonPress();
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => soundVibrationService.transactionDeleted(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <Animated.View
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                backgroundColor: colors.cardBackground,
                ...shadows.small,
              },
            ]}
          >
            <View style={styles.titleContainer}>
              <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>{t('home.welcome')}</Text>
              <Text style={[styles.appTitle, { color: colors.primary }]}>{BRANDING.name}</Text>
              <Text style={[styles.authorText, { color: colors.textSecondary }]}>by {BRANDING.author}</Text>
            </View>
          </Animated.View>

          {/* Wallet Overview Section */}
          {wallets.length > 0 && (
            <View style={styles.walletSection}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('nav.wallets')}</Text>
              <View style={[styles.walletGrid, { gap: isSmallScreen ? SPACING.sm : SPACING.md }]}>
                {wallets.slice(0, isLargeScreen ? 6 : 4).map((wallet) => (
                  <View 
                    key={wallet.id} 
                    style={[
                      styles.walletCard, 
                      { 
                        backgroundColor: colors.cardBackground, 
                        width: walletCardWidth,
                        ...shadows.medium 
                      }
                    ]}
                  >
                    <View style={styles.walletCardHeader}>
                      <View style={[styles.walletIcon, { backgroundColor: wallet.color }]}>
                        <Ionicons name="wallet" size={isSmallScreen ? 14 : 16} color="white" />
                      </View>
                      <Text style={[
                        styles.walletName, 
                        { 
                          color: colors.textSecondary,
                          fontSize: isSmallScreen ? FONT_SIZES.xs : FONT_SIZES.sm
                        }
                      ]} numberOfLines={1}>
                        {wallet.name}
                      </Text>
                    </View>
                    <Text style={[
                      styles.walletBalance, 
                      { 
                        color: colors.textPrimary,
                        fontSize: isSmallScreen ? FONT_SIZES.md : FONT_SIZES.lg
                      }
                    ]}>
                      {formatCurrency(wallet.balance, wallet.currency)}
                    </Text>
                    <Text style={[
                      styles.walletCurrency, 
                      { 
                        color: colors.textSecondary,
                        fontSize: isSmallScreen ? FONT_SIZES.xs : FONT_SIZES.sm
                      }
                    ]}>{wallet.currency}</Text>
                  </View>
                ))}
                {wallets.length > (isLargeScreen ? 6 : 4) && (
                  <TouchableOpacity
                    style={[
                      styles.viewAllWalletsButton, 
                      { 
                        backgroundColor: colors.background, 
                        borderColor: colors.border,
                        width: walletCardWidth
                      }
                    ]}
                    onPress={async () => {
                      await soundVibrationService.buttonPress();
                      navigation.navigate('MainTabs', { screen: 'Wallet' });
                    }}
                  >
                    <Ionicons name="ellipsis-horizontal" size={isSmallScreen ? 20 : 24} color={colors.primary} />
                    <Text style={[
                      styles.viewAllText, 
                      { 
                        color: colors.primary,
                        fontSize: isSmallScreen ? FONT_SIZES.xs : FONT_SIZES.sm
                      }
                    ]}>{t('home.viewAllWallets')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Enhanced Financial Overview Section with Horizontal Slider */}
          <View style={styles.statsSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('analytics.overview')}</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Swipe to see all metrics</Text>
            </View>
            
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              pagingEnabled={false}
              snapToInterval={cardWidth + (isSmallScreen ? SPACING.sm : SPACING.md)}
              decelerationRate="fast"
              contentContainerStyle={styles.statsScrollContent}
            >
              {enhancedStats.map((stat, index) => (
                <View key={stat.id} style={[styles.statsCardWrapper, { width: cardWidth }]}>
                  <View style={[
                    styles.enhancedStatsCard, 
                    { 
                      borderLeftColor: stat.color, 
                      backgroundColor: colors.cardBackground, 
                      ...shadows.medium,
                      padding: isSmallScreen ? SPACING.md : SPACING.lg
                    }
                  ]}>
                    <View style={styles.statsCardHeader}>
                      <View style={[
                        styles.statsIconContainer, 
                        { 
                          backgroundColor: stat.color + '20',
                          width: isSmallScreen ? 40 : 48,
                          height: isSmallScreen ? 40 : 48
                        }
                      ]}>
                        <Ionicons name={stat.icon as any} size={isSmallScreen ? 20 : 24} color={stat.color} />
                      </View>
                      <View style={styles.statsCardTitleContainer}>
                        <Text style={[
                          styles.statsCardTitle, 
                          { 
                            color: colors.textPrimary,
                            fontSize: isSmallScreen ? FONT_SIZES.md : FONT_SIZES.lg
                          }
                        ]}>{stat.title}</Text>
                        <Text style={[
                          styles.statsCardSubtitle, 
                          { 
                            color: colors.textSecondary,
                            fontSize: isSmallScreen ? FONT_SIZES.xs : FONT_SIZES.sm
                          }
                        ]}>{stat.subtitle}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.statsCardValueContainer}>
                      <Text style={[
                        styles.statsCardValue, 
                        { 
                          color: stat.color,
                          fontSize: isSmallScreen ? FONT_SIZES.xl : FONT_SIZES.xxl
                        }
                      ]}>
                        {formatCurrency(stat.value, 'EGP')}
                      </Text>
                      <View style={styles.statsCardChangeContainer}>
                        <Text style={[
                          styles.statsCardChange,
                          { 
                            color: stat.changeType === 'positive' ? colors.success : 
                                    stat.changeType === 'negative' ? colors.error : colors.textSecondary,
                            fontSize: isSmallScreen ? FONT_SIZES.xs : FONT_SIZES.sm
                          }
                        ]}>
                          {stat.change}
                        </Text>
                        {stat.changeType === 'positive' && (
                          <Ionicons name="trending-up" size={isSmallScreen ? 14 : 16} color={colors.success} />
                        )}
                        {stat.changeType === 'negative' && (
                          <Ionicons name="trending-down" size={isSmallScreen ? 14 : 16} color={colors.error} />
                        )}
                      </View>
                    </View>
                    
                    <Text style={[
                      styles.statsCardDescription, 
                      { 
                        color: colors.textSecondary,
                        fontSize: isSmallScreen ? FONT_SIZES.xs : FONT_SIZES.sm
                      }
                    ]}>{stat.description}</Text>
                    
                    <View style={styles.statsCardFooter}>
                      <View style={[styles.statsCardTrend, { backgroundColor: stat.color + '20' }]}>
                        <Ionicons 
                          name={stat.trend === 'up' ? 'arrow-up' : stat.trend === 'down' ? 'arrow-down' : 'remove'} 
                          size={isSmallScreen ? 14 : 16} 
                          color={stat.color} 
                        />
                        <Text style={[
                          styles.statsCardTrendText, 
                          { 
                            color: stat.color,
                            fontSize: isSmallScreen ? FONT_SIZES.xs : FONT_SIZES.sm
                          }
                        ]}>
                          {stat.trend === 'up' ? 'Growing' : stat.trend === 'down' ? 'Declining' : 'Stable'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
            
            {/* Stats Navigation Dots */}
            <View style={styles.statsNavigation}>
              {enhancedStats.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.statsDot,
                    { backgroundColor: colors.border },
                    index === 0 && { backgroundColor: colors.primary, width: 12, height: 12, borderRadius: 6 }
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Quick Summary Cards */}
          <View style={styles.quickSummarySection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Summary</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Key metrics at a glance</Text>
            </View>
            
            <View style={[
              styles.quickSummaryGrid, 
              { 
                gap: isSmallScreen ? SPACING.sm : SPACING.md,
                flexDirection: isLargeScreen ? 'row' : 'column'
              }
            ]}>
              {/* Overdue Transactions Card */}
              <View style={[
                styles.quickSummaryCard, 
                { 
                  backgroundColor: colors.cardBackground, 
                  ...shadows.medium,
                  flex: isLargeScreen ? 1 : undefined
                }
              ]}>
                <View style={styles.quickSummaryCardHeader}>
                  <View style={[
                    styles.quickSummaryIcon, 
                    { 
                      backgroundColor: colors.error,
                      width: isSmallScreen ? 28 : 32,
                      height: isSmallScreen ? 28 : 32
                    }
                  ]}>
                    <Ionicons name="warning" size={isSmallScreen ? 16 : 18} color="white" />
                  </View>
                  <View style={styles.quickSummaryHeaderContent}>
                    <Text style={[
                      styles.quickSummaryLabel, 
                      { 
                        color: colors.textPrimary,
                        fontSize: isSmallScreen ? FONT_SIZES.sm : FONT_SIZES.md
                      }
                    ]}>Overdue</Text>
                    <Text style={[
                      styles.quickSummarySubtitle, 
                      { 
                        color: colors.textSecondary,
                        fontSize: isSmallScreen ? FONT_SIZES.xs : FONT_SIZES.sm
                      }
                    ]}>Requires attention</Text>
                  </View>
                </View>
                <View style={styles.quickSummaryCardBody}>
                  <Text style={[
                    styles.quickSummaryValue, 
                    { 
                      color: colors.error,
                      fontSize: isSmallScreen ? FONT_SIZES.xl : FONT_SIZES.xxl
                    }
                  ]}>{stats.overdueCount}</Text>
                  <Text style={[
                    styles.quickSummaryUnit, 
                    { 
                      color: colors.textSecondary,
                      fontSize: isSmallScreen ? FONT_SIZES.xs : FONT_SIZES.sm
                    }
                  ]}>transactions</Text>
                </View>
                <View style={styles.quickSummaryCardFooter}>
                  <View style={[styles.quickSummaryTrend, { backgroundColor: colors.error + '20' }]}>
                    <Ionicons name="arrow-up" size={isSmallScreen ? 10 : 12} color={colors.error} />
                    <Text style={[
                      styles.quickSummaryTrendText, 
                      { 
                        color: colors.error,
                        fontSize: isSmallScreen ? FONT_SIZES.xs : FONT_SIZES.sm
                      }
                    ]}>
                      {stats.overdueCount > 0 ? 'Urgent' : 'Clear'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Upcoming Transactions Card */}
              <View style={[
                styles.quickSummaryCard, 
                { 
                  backgroundColor: colors.cardBackground, 
                  ...shadows.medium,
                  flex: isLargeScreen ? 1 : undefined
                }
              ]}>
                <View style={styles.quickSummaryCardHeader}>
                  <View style={[
                    styles.quickSummaryIcon, 
                    { 
                      backgroundColor: colors.warning,
                      width: isSmallScreen ? 28 : 32,
                      height: isSmallScreen ? 28 : 32
                    }
                  ]}>
                    <Ionicons name="calendar" size={isSmallScreen ? 16 : 18} color="white" />
                  </View>
                  <View style={styles.quickSummaryHeaderContent}>
                    <Text style={[
                      styles.quickSummaryLabel, 
                      { 
                        color: colors.textPrimary,
                        fontSize: isSmallScreen ? FONT_SIZES.sm : FONT_SIZES.md
                      }
                    ]}>Upcoming</Text>
                    <Text style={[
                      styles.quickSummarySubtitle, 
                      { 
                        color: colors.textSecondary,
                        fontSize: isSmallScreen ? FONT_SIZES.xs : FONT_SIZES.sm
                      }
                    ]}>This week</Text>
                  </View>
                </View>
                <View style={styles.quickSummaryCardBody}>
                  <Text style={[
                    styles.quickSummaryValue, 
                    { 
                      color: colors.warning,
                      fontSize: isSmallScreen ? FONT_SIZES.xl : FONT_SIZES.xxl
                    }
                  ]}>{stats.upcomingCount}</Text>
                  <Text style={[
                    styles.quickSummaryUnit, 
                    { 
                      color: colors.textSecondary,
                      fontSize: isSmallScreen ? FONT_SIZES.xs : FONT_SIZES.sm
                    }
                  ]}>transactions</Text>
                </View>
                <View style={styles.quickSummaryCardFooter}>
                  <View style={[styles.quickSummaryTrend, { backgroundColor: colors.warning + '20' }]}>
                    <Ionicons name="time" size={isSmallScreen ? 10 : 12} color={colors.warning} />
                    <Text style={[
                      styles.quickSummaryTrendText, 
                      { 
                        color: colors.warning,
                        fontSize: isSmallScreen ? FONT_SIZES.xs : FONT_SIZES.sm
                      }
                    ]}>
                      {stats.upcomingCount > 0 ? 'Due soon' : 'Clear'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Transactions Sections */}
          <View style={styles.transactionsSection}>
            {/* Overdue Transactions */}
            {overdueTransactions.length > 0 && (
              <View style={[styles.transactionGroup, { backgroundColor: colors.cardBackground, ...shadows.medium }]}>
                <View style={[styles.transactionGroupHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                  <View style={[
                    styles.transactionGroupIconContainer, 
                    { 
                      backgroundColor: colors.error,
                      width: isSmallScreen ? 36 : 40,
                      height: isSmallScreen ? 36 : 40
                    }
                  ]}>
                    <Ionicons name="warning" size={isSmallScreen ? 18 : 20} color="white" />
                  </View>
                  <View style={styles.transactionGroupHeaderContent}>
                    <Text style={[
                      styles.transactionGroupTitle, 
                      { 
                        color: colors.textPrimary,
                        fontSize: isSmallScreen ? FONT_SIZES.md : FONT_SIZES.lg
                      }
                    ]}>{t('analytics.overdue')}</Text>
                    <Text style={[
                      styles.transactionGroupSubtitle, 
                      { 
                        color: colors.textSecondary,
                        fontSize: isSmallScreen ? FONT_SIZES.xs : FONT_SIZES.sm
                      }
                    ]}>
                      {overdueTransactions.length} transaction{overdueTransactions.length !== 1 ? 's' : ''} require attention
                    </Text>
                  </View>
                </View>
                <View style={styles.transactionList}>
                  {overdueTransactions.slice(0, 3).map((transaction) => (
                    <View key={transaction.id} style={styles.transactionCardWrapper}>
                      <TransactionCard
                        transaction={transaction}
                        onEdit={() => handleEditTransaction(transaction.id)}
                        onArchive={() => handleArchiveTransaction(transaction.id)}
                        onDelete={() => handleDeleteTransaction(transaction.id)}
                        onPress={() => handleEditTransaction(transaction.id)}
                        showActions={false}
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Upcoming Transactions */}
            {upcomingTransactions.length > 0 && (
              <View style={[styles.transactionGroup, { backgroundColor: colors.cardBackground, ...shadows.medium }]}>
                <View style={[styles.transactionGroupHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                  <View style={[
                    styles.transactionGroupIconContainer, 
                    { 
                      backgroundColor: colors.warning,
                      width: isSmallScreen ? 36 : 40,
                      height: isSmallScreen ? 36 : 40
                    }
                  ]}>
                    <Ionicons name="calendar" size={isSmallScreen ? 18 : 20} color="white" />
                  </View>
                  <View style={styles.transactionGroupHeaderContent}>
                    <Text style={[
                      styles.transactionGroupTitle, 
                      { 
                        color: colors.textPrimary,
                        fontSize: isSmallScreen ? FONT_SIZES.md : FONT_SIZES.lg
                      }
                    ]}>{t('analytics.upcoming')}</Text>
                    <Text style={[
                      styles.transactionGroupSubtitle, 
                      { 
                        color: colors.textSecondary,
                        fontSize: isSmallScreen ? FONT_SIZES.xs : FONT_SIZES.sm
                      }
                    ]}>
                      {upcomingTransactions.length} transaction{upcomingTransactions.length !== 1 ? 's' : ''} due soon
                    </Text>
                  </View>
                </View>
                <View style={styles.transactionList}>
                  {upcomingTransactions.slice(0, 3).map((transaction) => (
                    <View key={transaction.id} style={styles.transactionCardWrapper}>
                      <TransactionCard
                        transaction={transaction}
                        onEdit={() => handleEditTransaction(transaction.id)}
                        onArchive={() => handleArchiveTransaction(transaction.id)}
                        onDelete={() => handleDeleteTransaction(transaction.id)}
                        onPress={() => handleEditTransaction(transaction.id)}
                        showActions={false}
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Empty State */}
            {upcomingTransactions.length === 0 && overdueTransactions.length === 0 && (
              <View style={[styles.emptyState, { backgroundColor: colors.cardBackground, ...shadows.small }]}>
                <View style={[
                  styles.emptyStateIconContainer, 
                  { 
                    backgroundColor: colors.background,
                    width: isSmallScreen ? 64 : 80,
                    height: isSmallScreen ? 64 : 80,
                    borderRadius: isSmallScreen ? 32 : 40
                  }
                ]}>
                  <Ionicons name="happy" size={isSmallScreen ? 36 : 48} color={colors.textSecondary} />
                </View>
                <Text style={[
                  styles.emptyStateTitle, 
                  { 
                    color: colors.textPrimary,
                    fontSize: isSmallScreen ? FONT_SIZES.md : FONT_SIZES.lg
                  }
                ]}>{t('empty.noTransactions')}</Text>
                <Text style={[
                  styles.emptyStateSubtitle, 
                  { 
                    color: colors.textSecondary,
                    fontSize: isSmallScreen ? FONT_SIZES.sm : FONT_SIZES.md
                  }
                ]}>
                  Add your first transaction to get started with tracking your money!
                </Text>
              </View>
            )}
          </View>

          {/* Bottom Spacing for FAB and Tab Bar */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Floating Action Button */}
        <FloatingActionButton
          onPress={handleAddTransaction}
          icon="add"
          label={t('action.addTransaction')}
          color={colors.primary}
          size="large"
        />
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  
  // Header Section
  header: {
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  titleContainer: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: FONT_SIZES.md,
    marginBottom: SPACING.xs,
    fontFamily: FONTS.regular,
  },
  appTitle: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    marginBottom: SPACING.xs,
    fontFamily: FONTS.bold,
  },
  authorText: {
    fontSize: FONT_SIZES.sm,
    fontStyle: 'italic',
    fontFamily: FONTS.light,
  },

  // Enhanced Stats Section
  statsSection: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    fontFamily: FONTS.semiBold,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  statsScrollContent: {
    paddingHorizontal: SPACING.lg,
  },
  statsCardWrapper: {
    paddingRight: SPACING.md,
  },
  enhancedStatsCard: {
    borderRadius: BORDER_RADIUS.lg,
    minHeight: 200,
  },
  statsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  statsIconContainer: {
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  statsCardTitleContainer: {
    flex: 1,
  },
  statsCardTitle: {
    fontWeight: '600',
    marginBottom: SPACING.xs,
    fontFamily: FONTS.semiBold,
  },
  statsCardSubtitle: {
    fontFamily: FONTS.regular,
  },
  statsCardValueContainer: {
    marginBottom: SPACING.lg,
  },
  statsCardValue: {
    fontWeight: '700',
    marginBottom: SPACING.sm,
    fontFamily: FONTS.bold,
  },
  statsCardChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statsCardChange: {
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  statsCardDescription: {
    marginBottom: SPACING.lg,
    fontFamily: FONTS.regular,
    lineHeight: 18,
  },
  statsCardFooter: {
    alignItems: 'flex-end',
  },
  statsCardTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.xs,
  },
  statsCardTrendText: {
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  statsNavigation: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
    gap: SPACING.xs,
  },
  statsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Quick Summary Section
  quickSummarySection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  quickSummaryGrid: {
    justifyContent: 'space-between',
  },
  quickSummaryCard: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    flexDirection: 'column',
    alignItems: 'center',
    minHeight: 160,
  },
  quickSummaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  quickSummaryIcon: {
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  quickSummaryHeaderContent: {
    flex: 1,
  },
  quickSummaryLabel: {
    fontWeight: '600',
    marginBottom: SPACING.xs,
    fontFamily: FONTS.semiBold,
  },
  quickSummarySubtitle: {
    fontFamily: FONTS.regular,
  },
  quickSummaryCardBody: {
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  quickSummaryValue: {
    fontWeight: '700',
    marginBottom: SPACING.xs,
    fontFamily: FONTS.bold,
  },
  quickSummaryUnit: {
    fontFamily: FONTS.regular,
  },
  quickSummaryCardFooter: {
    alignItems: 'flex-end',
  },
  quickSummaryTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.xs,
  },
  quickSummaryTrendText: {
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },

  // Transactions Section
  transactionsSection: {
    paddingHorizontal: SPACING.lg,
  },
  transactionGroup: {
    marginBottom: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  transactionGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
  },
  transactionGroupIconContainer: {
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  transactionGroupHeaderContent: {
    flex: 1,
  },
  transactionGroupTitle: {
    fontWeight: '600',
    marginBottom: SPACING.xs,
    fontFamily: FONTS.semiBold,
  },
  transactionGroupSubtitle: {
    fontFamily: FONTS.regular,
  },
  transactionList: {
    padding: SPACING.md,
  },
  transactionCardWrapper: {
    marginBottom: SPACING.md,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xxl,
    marginTop: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.lg,
  },
  emptyStateIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyStateTitle: {
    fontWeight: '600',
    marginBottom: SPACING.sm,
    textAlign: 'center',
    fontFamily: FONTS.semiBold,
  },
  emptyStateSubtitle: {
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: FONTS.regular,
  },

  // Bottom Spacing - Increased for tab bar
  bottomSpacing: {
    height: 120, // Increased from 100 to account for tab bar height (60) + FAB + extra spacing
  },

  // Wallet Section
  walletSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  walletGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  walletCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
  },
  walletCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  walletIcon: {
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xs,
  },
  walletName: {
    fontFamily: FONTS.medium,
    flex: 1,
  },
  walletBalance: {
    fontWeight: '700',
    marginBottom: SPACING.xs,
    fontFamily: FONTS.bold,
  },
  walletCurrency: {
    fontFamily: FONTS.regular,
  },
  viewAllWalletsButton: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  viewAllText: {
    marginTop: SPACING.xs,
    fontFamily: FONTS.medium,
  },
});

export default HomeScreen;
