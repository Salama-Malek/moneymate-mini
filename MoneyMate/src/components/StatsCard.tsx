import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONT_SIZES, FONTS } from '../constants';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color,
  trend,
  trendValue,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  
  // Calculate responsive values
  const isSmallScreen = screenWidth < 375;
  const isMediumScreen = screenWidth >= 375 && screenWidth < 768;
  const isLargeScreen = screenWidth >= 768;
  
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const valueAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate value counting up
    if (typeof value === 'number') {
      Animated.timing(valueAnim, {
        toValue: value,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }
  }, [value]);

  const animatedValue = valueAnim.interpolate({
    inputRange: [0, typeof value === 'number' ? value : 0],
    outputRange: [0, typeof value === 'number' ? value : 0],
  });

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      default:
        return 'remove';
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return COLORS.success;
      case 'down':
        return COLORS.error;
      default:
        return COLORS.textSecondary;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
          padding: isSmallScreen ? SPACING.md : SPACING.lg,
          minHeight: isSmallScreen ? 120 : 140,
        },
      ]}
    >
      {/* Header with Icon and Trend */}
      <View style={styles.header}>
        <View style={[
          styles.iconContainer, 
          { 
            backgroundColor: color,
            width: isSmallScreen ? 36 : 40,
            height: isSmallScreen ? 36 : 40,
          }
        ]}>
          <Ionicons name={icon} size={isSmallScreen ? 18 : 20} color="white" />
        </View>
        
        {trend && (
          <View style={[
            styles.trendContainer,
            {
              paddingHorizontal: isSmallScreen ? SPACING.xs : SPACING.xs,
              paddingVertical: isSmallScreen ? 1 : 2,
            }
          ]}>
            <Ionicons
              name={getTrendIcon()}
              size={isSmallScreen ? 12 : 14}
              color={getTrendColor()}
            />
            {trendValue && (
              <Text style={[
                styles.trendValue, 
                { 
                  color: getTrendColor(),
                  fontSize: isSmallScreen ? FONT_SIZES.xs : FONT_SIZES.xs,
                  marginLeft: isSmallScreen ? SPACING.xs : SPACING.xs,
                }
              ]}>
                {trendValue}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={[
          styles.title, 
          { 
            fontSize: isSmallScreen ? FONT_SIZES.xs : FONT_SIZES.sm,
            marginBottom: isSmallScreen ? SPACING.xs : SPACING.sm,
          }
        ]} numberOfLines={2}>{title}</Text>
        
        {typeof value === 'number' ? (
          <Animated.Text style={[
            styles.value,
            { fontSize: isSmallScreen ? FONT_SIZES.lg : FONT_SIZES.xl }
          ]}>
            {Math.round(animatedValue as any).toLocaleString()}
          </Animated.Text>
        ) : (
          <Text style={[
            styles.value,
            { fontSize: isSmallScreen ? FONT_SIZES.lg : FONT_SIZES.xl }
          ]}>{value}</Text>
        )}
        
        {subtitle && (
          <Text style={[
            styles.subtitle, 
            { 
              fontSize: isSmallScreen ? FONT_SIZES.xs : FONT_SIZES.xs,
              marginBottom: isSmallScreen ? SPACING.xs : SPACING.sm,
            }
          ]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      {/* Subtle watermark */}
      <View style={[
        styles.watermark,
        {
          bottom: isSmallScreen ? SPACING.xs : SPACING.xs,
          right: isSmallScreen ? SPACING.xs : SPACING.xs,
        }
      ]}>
        <Text style={[
          styles.watermarkText,
          { fontSize: isSmallScreen ? FONT_SIZES.xs : FONT_SIZES.xs }
        ]}>SM</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.xs,
    marginVertical: SPACING.xs,
    ...SHADOWS.medium,
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  iconContainer: {
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.sm,
  },
  trendValue: {
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    color: COLORS.textSecondary,
    fontWeight: '500',
    fontFamily: FONTS.medium,
    lineHeight: 18,
  },
  value: {
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    fontFamily: FONTS.bold,
    lineHeight: 28,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontWeight: '400',
    fontFamily: FONTS.regular,
  },
  watermark: {
    position: 'absolute',
    opacity: 0.1,
  },
  watermarkText: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.bold,
  },
});

export default StatsCard;
