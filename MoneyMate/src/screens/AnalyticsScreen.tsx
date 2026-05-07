import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMoneyMateStore } from '../store';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONT_SIZES } from '../constants';
import { formatCurrency, formatDate } from '../utils';

const { width } = Dimensions.get('window');

const AnalyticsScreen: React.FC = () => {
  const { getDashboardStats, getActiveTransactions, getOverdueTransactions } = useMoneyMateStore();
  
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

  const stats = getDashboardStats();
  const activeTransactions = getActiveTransactions();
  const overdueTransactions = getOverdueTransactions();

  // Calculate currency breakdown
  const currencyBreakdown = activeTransactions.reduce((acc, transaction) => {
    const currency = transaction.currency;
    if (!acc[currency]) {
      acc[currency] = { total: 0, count: 0 };
    }
    acc[currency].total += transaction.amount;
    acc[currency].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  // Calculate monthly trends (last 6 months)
  const monthlyTrends = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const month = date.toLocaleString('default', { month: 'short' });
    
    const monthTransactions = activeTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === date.getMonth() && 
             transactionDate.getFullYear() === date.getFullYear();
    });

    const monthlyTotal = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    return { month, total: monthlyTotal, count: monthTransactions.length };
  }).reverse();

  const renderPieChart = () => {
    const total = stats.outstandingLent + stats.outstandingBorrowed;
    if (total === 0) return null;

    const lentPercentage = (stats.outstandingLent / total) * 100;
    const borrowedPercentage = (stats.outstandingBorrowed / total) * 100;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Outstanding Balance Distribution</Text>
        <View style={styles.pieChart}>
          <View style={styles.pieChartContainer}>
            <View style={[styles.pieSlice, { backgroundColor: COLORS.primary }]} />
            <View style={[styles.pieSlice, { backgroundColor: COLORS.secondary }]} />
          </View>
          <View style={styles.pieChartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: COLORS.primary }]} />
              <Text style={styles.legendText}>
                Lent: {lentPercentage.toFixed(1)}%
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: COLORS.secondary }]} />
              <Text style={styles.legendText}>
                Borrowed: {borrowedPercentage.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderBarChart = () => {
    const maxValue = Math.max(...monthlyTrends.map(t => t.total));
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Monthly Transaction Trends</Text>
        <View style={styles.barChart}>
          {monthlyTrends.map((trend, index) => (
            <View key={index} style={styles.barContainer}>
              <View style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: maxValue > 0 ? (trend.total / maxValue) * 120 : 0,
                      backgroundColor: trend.total > 0 ? COLORS.primary : COLORS.border,
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{trend.month}</Text>
              <Text style={styles.barValue}>{formatCurrency(trend.total, 'EGP')}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Summary Cards */}
          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Financial Summary</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryCard}>
                <View style={[styles.summaryIcon, { backgroundColor: COLORS.primary }]}>
                  <Ionicons name="trending-up" size={24} color="white" />
                </View>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(stats.totalLent, 'EGP')}
                  </Text>
                  <Text style={styles.summaryLabel}>Total Lent</Text>
                </View>
              </View>

              <View style={styles.summaryCard}>
                <View style={[styles.summaryIcon, { backgroundColor: COLORS.secondary }]}>
                  <Ionicons name="trending-down" size={24} color="white" />
                </View>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(stats.totalBorrowed, 'EGP')}
                  </Text>
                  <Text style={styles.summaryLabel}>Total Borrowed</Text>
                </View>
              </View>

              <View style={styles.summaryCard}>
                <View style={[styles.summaryIcon, { backgroundColor: COLORS.warning }]}>
                  <Ionicons name="time" size={24} color="white" />
                </View>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(stats.outstandingLent, 'EGP')}
                  </Text>
                  <Text style={styles.summaryLabel}>Outstanding Lent</Text>
                </View>
              </View>

              <View style={styles.summaryCard}>
                <View style={[styles.summaryIcon, { backgroundColor: COLORS.error }]}>
                  <Ionicons name="alert-circle" size={24} color="white" />
                </View>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(stats.outstandingBorrowed, 'EGP')}
                  </Text>
                  <Text style={styles.summaryLabel}>Outstanding Borrowed</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Charts */}
          {renderPieChart()}
          {renderBarChart()}

          {/* Currency Breakdown */}
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Currency Breakdown</Text>
            <View style={styles.currencyList}>
              {Object.entries(currencyBreakdown).map(([currency, data]) => (
                <View key={currency} style={styles.currencyItem}>
                  <View style={styles.currencyHeader}>
                    <Text style={styles.currencyCode}>{currency}</Text>
                    <Text style={styles.currencyCount}>{data.count} transactions</Text>
                  </View>
                  <Text style={styles.currencyTotal}>
                    {formatCurrency(data.total, currency)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Overdue Transactions */}
          {overdueTransactions.length > 0 && (
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Overdue Transactions</Text>
              <View style={styles.overdueList}>
                {overdueTransactions.slice(0, 5).map((transaction) => (
                  <View key={transaction.id} style={styles.overdueItem}>
                    <View style={styles.overdueHeader}>
                      <Text style={styles.overduePerson}>{transaction.person}</Text>
                      <Text style={styles.overdueAmount}>
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </Text>
                    </View>
                    <View style={styles.overdueDetails}>
                      <Text style={styles.overdueDate}>
                        Due: {formatDate(transaction.dueDate)}
                      </Text>
                      <Text style={styles.overdueDays}>
                        {Math.ceil((new Date().getTime() - new Date(transaction.dueDate).getTime()) / (1000 * 60 * 60 * 24))} days overdue
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Empty State */}
          {activeTransactions.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="analytics" size={64} color={COLORS.textSecondary} />
              <Text style={styles.emptyStateTitle}>No Data to Analyze</Text>
              <Text style={styles.emptyStateSubtitle}>
                Add some transactions to see analytics and insights!
              </Text>
            </View>
          )}
          
          {/* Bottom spacing for tab bar */}
          <View style={styles.bottomSpacing} />
        </Animated.View>
      </ScrollView>
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
  content: {
    padding: SPACING.md,
    paddingTop: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  summarySection: {
    marginBottom: SPACING.xl,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  summaryCard: {
    flex: 1,
    minWidth: (width - SPACING.md * 3) / 2,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  summaryContent: {
    flex: 1,
  },
  summaryValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  chartContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
  },
  chartTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  pieChart: {
    alignItems: 'center',
  },
  pieChartContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  pieSlice: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  pieChartLegend: {
    gap: SPACING.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
    paddingTop: SPACING.md,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
  },
  barWrapper: {
    height: 120,
    justifyContent: 'flex-end',
    marginBottom: SPACING.sm,
  },
  bar: {
    width: 20,
    borderRadius: BORDER_RADIUS.sm,
    minHeight: 4,
  },
  barLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  barValue: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textPrimary,
    fontWeight: '500',
    textAlign: 'center',
  },
  currencyList: {
    gap: SPACING.md,
  },
  currencyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  currencyHeader: {
    flex: 1,
  },
  currencyCode: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  currencyCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  currencyTotal: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.primary,
  },
  overdueList: {
    gap: SPACING.md,
  },
  overdueItem: {
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
  },
  overdueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  overduePerson: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  overdueAmount: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.error,
  },
  overdueDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overdueDate: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  overdueDays: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    fontWeight: '500',
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

export default AnalyticsScreen;
