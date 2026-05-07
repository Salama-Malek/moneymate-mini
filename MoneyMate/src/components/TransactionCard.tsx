import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { Transaction } from '../types';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONT_SIZES, FONTS } from '../constants';
import { formatCurrency, formatDate, getStatusColor, getTypeColor } from '../utils';

interface TransactionCardProps {
  transaction: Transaction;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onRestore?: () => void;
  onPress?: () => void;
  showActions?: boolean;
}

const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  onEdit,
  onArchive,
  onDelete,
  onRestore,
  onPress,
  showActions = true,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  
  // Calculate responsive values
  const isSmallScreen = screenWidth < 375;
  const isMediumScreen = screenWidth >= 375 && screenWidth < 768;
  const isLargeScreen = screenWidth >= 768;

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    const opacity = dragX.interpolate({
      inputRange: [-100, -50, 0],
      outputRange: [1, 0.5, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.rightActions}>
        <Animated.View
          style={[
            styles.actionButton,
            styles.editButton,
            { transform: [{ scale }], opacity },
          ]}
        >
          <TouchableOpacity onPress={onEdit} style={styles.actionTouchable}>
            <Ionicons name="pencil" size={isSmallScreen ? 16 : 18} color="white" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={[
            styles.actionButton,
            styles.archiveButton,
            { transform: [{ scale }], opacity },
          ]}
        >
          <TouchableOpacity onPress={onArchive} style={styles.actionTouchable}>
            <Ionicons name="archive" size={isSmallScreen ? 16 : 18} color="white" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={[
            styles.actionButton,
            styles.deleteButton,
            { transform: [{ scale }], opacity },
          ]}
        >
          <TouchableOpacity onPress={onDelete} style={styles.actionTouchable}>
            <Ionicons name="trash" size={isSmallScreen ? 16 : 18} color="white" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  const renderLeftActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    if (!onRestore) return null;

    const scale = dragX.interpolate({
      inputRange: [0, 100],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

    const opacity = dragX.interpolate({
      inputRange: [0, 50, 100],
      outputRange: [0, 0.5, 1],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.leftActions}>
        <Animated.View
          style={[
            styles.actionButton,
            styles.restoreButton,
            { transform: [{ scale }], opacity },
          ]}
        >
          <TouchableOpacity onPress={onRestore} style={styles.actionTouchable}>
            <Ionicons name="refresh" size={isSmallScreen ? 16 : 18} color="white" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  const cardContent = (
    <TouchableOpacity 
      style={[
        styles.card,
        {
          padding: isSmallScreen ? SPACING.md : SPACING.lg,
          marginHorizontal: isSmallScreen ? SPACING.sm : SPACING.md,
        }
      ]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Watermark */}
      <Text style={[
        styles.watermark,
        {
          fontSize: isSmallScreen ? FONT_SIZES.xs : FONT_SIZES.sm,
          top: isSmallScreen ? SPACING.xs : SPACING.sm,
          right: isSmallScreen ? SPACING.xs : SPACING.sm,
        }
      ]}>SM</Text>
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.personContainer}>
          <Text style={[
            styles.personName,
            {
              fontSize: isSmallScreen ? FONT_SIZES.md : FONT_SIZES.lg,
              marginBottom: isSmallScreen ? SPACING.xs : SPACING.sm,
            }
          ]} numberOfLines={1}>
            {transaction.person}
          </Text>
          <View
            style={[
              styles.typeBadge,
              { 
                backgroundColor: getTypeColor(transaction.type),
                paddingHorizontal: isSmallScreen ? SPACING.xs : SPACING.sm,
                paddingVertical: isSmallScreen ? SPACING.xs : SPACING.xs,
              },
            ]}
          >
            <Text style={[
              styles.typeText,
              { fontSize: isSmallScreen ? FONT_SIZES.xs : FONT_SIZES.xs }
            ]}>
              {transaction.type.toUpperCase()}
            </Text>
          </View>
        </View>
        
        <View style={styles.amountContainer}>
          <Text style={[
            styles.amount,
            { fontSize: isSmallScreen ? FONT_SIZES.lg : FONT_SIZES.xl }
          ]}>
            {formatCurrency(transaction.amount, transaction.currency)}
          </Text>
        </View>
      </View>

      {/* Details */}
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <View style={[
            styles.iconContainer,
            { width: isSmallScreen ? 18 : 20 }
          ]}>
            <Ionicons name="calendar-outline" size={isSmallScreen ? 14 : 16} color={COLORS.textSecondary} />
          </View>
          <Text style={[
            styles.detailText,
            { 
              fontSize: isSmallScreen ? FONT_SIZES.xs : FONT_SIZES.sm,
              marginLeft: isSmallScreen ? SPACING.xs : SPACING.sm,
            }
          ]}>
            Due: {formatDate(transaction.dueDate)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <View style={[
            styles.iconContainer,
            { width: isSmallScreen ? 18 : 20 }
          ]}>
            <Ionicons name="time-outline" size={isSmallScreen ? 14 : 16} color={COLORS.textSecondary} />
          </View>
          <Text style={[
            styles.detailText,
            { 
              fontSize: isSmallScreen ? FONT_SIZES.xs : FONT_SIZES.sm,
              marginLeft: isSmallScreen ? SPACING.xs : SPACING.sm,
            }
          ]}>
            {formatDate(transaction.date)}
          </Text>
        </View>

        {transaction.notes && (
          <View style={styles.detailRow}>
            <View style={[
              styles.iconContainer,
              { width: isSmallScreen ? 18 : 20 }
            ]}>
              <Ionicons name="document-text-outline" size={isSmallScreen ? 14 : 16} color={COLORS.textSecondary} />
            </View>
            <Text style={[
              styles.detailText,
              { 
                fontSize: isSmallScreen ? FONT_SIZES.xs : FONT_SIZES.sm,
                marginLeft: isSmallScreen ? SPACING.xs : SPACING.sm,
              }
            ]} numberOfLines={2}>
              {transaction.notes}
            </Text>
          </View>
        )}
      </View>

      {/* Status */}
      <View style={styles.statusContainer}>
        <View
          style={[
            styles.statusBadge,
            { 
              backgroundColor: getStatusColor(transaction.status, transaction.dueDate),
              paddingHorizontal: isSmallScreen ? SPACING.xs : SPACING.sm,
              paddingVertical: isSmallScreen ? SPACING.xs : SPACING.xs,
            },
          ]}
        >
          <Text style={[
            styles.statusText,
            { fontSize: isSmallScreen ? FONT_SIZES.xs : FONT_SIZES.xs }
          ]}>
            {transaction.status === 'paid' ? 'PAID' : 'PENDING'}
          </Text>
        </View>
        
        {transaction.recurring && (
          <View style={[
            styles.recurringBadge,
            {
              paddingHorizontal: isSmallScreen ? SPACING.xs : SPACING.sm,
              paddingVertical: isSmallScreen ? SPACING.xs : SPACING.xs,
            }
          ]}>
            <Ionicons name="repeat" size={isSmallScreen ? 10 : 12} color={COLORS.primary} />
            <Text style={[
              styles.recurringText,
              { 
                fontSize: isSmallScreen ? FONT_SIZES.xs : FONT_SIZES.xs,
                marginLeft: isSmallScreen ? SPACING.xs : SPACING.xs,
              }
            ]}>
              {transaction.recurring.frequency}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (!showActions) {
    return cardContent;
  }

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      renderLeftActions={onRestore ? renderLeftActions : undefined}
      rightThreshold={40}
      leftThreshold={40}
    >
      {cardContent}
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    marginVertical: SPACING.sm,
    ...SHADOWS.medium,
    position: 'relative',
    overflow: 'hidden',
  },
  watermark: {
    position: 'absolute',
    color: COLORS.primary,
    opacity: 0.05,
    fontWeight: 'bold',
    fontFamily: FONTS.bold,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  personContainer: {
    flex: 1,
    marginRight: SPACING.md,
  },
  personName: {
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: FONTS.semiBold,
    lineHeight: 22,
  },
  typeBadge: {
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
  },
  typeText: {
    color: 'white',
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.bold,
    lineHeight: 28,
  },
  details: {
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 2,
  },
  detailText: {
    color: COLORS.textSecondary,
    flex: 1,
    fontFamily: FONTS.regular,
    lineHeight: 18,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    borderRadius: BORDER_RADIUS.sm,
  },
  statusText: {
    color: 'white',
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.sm,
  },
  recurringText: {
    color: COLORS.primary,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 120,
    height: '100%',
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: 80,
    height: '100%',
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: '100%',
    marginHorizontal: 2,
  },
  actionTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
  },
  editButton: {
    backgroundColor: COLORS.primary,
  },
  archiveButton: {
    backgroundColor: COLORS.warning,
  },
  deleteButton: {
    backgroundColor: COLORS.error,
  },
  restoreButton: {
    backgroundColor: COLORS.success,
  },
});

export default TransactionCard;
