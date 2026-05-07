import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Animated,
  View,
  Text,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONT_SIZES } from '../constants';

interface FloatingActionButtonProps {
  onPress: () => void;
  icon: keyof typeof Ionicons.glyphMap;
  label?: string;
  color?: string;
  size?: 'small' | 'medium' | 'large';
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  icon,
  label,
  color = COLORS.primary,
  size = 'medium',
}) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  
  // Calculate responsive values
  const isSmallScreen = screenWidth < 375;
  const isMediumScreen = screenWidth >= 375 && screenWidth < 768;
  const isLargeScreen = screenWidth >= 768;
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, []);

  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(rippleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(rippleOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      rippleAnim.setValue(0);
      rippleOpacity.setValue(1);
    });
  };

  const getSize = () => {
    if (isSmallScreen) {
      switch (size) {
        case 'small':
          return 44;
        case 'large':
          return 64;
        default:
          return 52;
      }
    } else if (isLargeScreen) {
      switch (size) {
        case 'small':
          return 56;
        case 'large':
          return 80;
        default:
          return 64;
      }
    } else {
      switch (size) {
        case 'small':
          return 48;
        case 'large':
          return 72;
        default:
          return 56;
      }
    }
  };

  const getIconSize = () => {
    if (isSmallScreen) {
      switch (size) {
        case 'small':
          return 18;
        case 'large':
          return 28;
        default:
          return 22;
      }
    } else if (isLargeScreen) {
      switch (size) {
        case 'small':
          return 24;
        case 'large':
          return 36;
        default:
          return 28;
      }
    } else {
      switch (size) {
        case 'small':
          return 20;
        case 'large':
          return 32;
        default:
          return 24;
      }
    }
  };

  const buttonSize = getSize();
  const iconSize = getIconSize();

  return (
    <View style={[
      styles.container,
      {
        bottom: isSmallScreen ? SPACING.xl : SPACING.xxl, // Increased bottom spacing
        right: isSmallScreen ? SPACING.lg : SPACING.xl,
      }
    ]}>
      <Animated.View
        style={[
          styles.ripple,
          {
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
            transform: [{ scale: rippleAnim }],
            opacity: rippleOpacity,
            backgroundColor: color,
          },
        ]}
      />
      
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
        style={[
          styles.button,
          {
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
            backgroundColor: color,
            transform: [
              { scale: Animated.multiply(scaleAnim, pulseAnim) },
            ],
          },
        ]}
      >
        <Ionicons name={icon} size={iconSize} color="white" />
      </TouchableOpacity>

      {label && (
        <View style={[
          styles.labelContainer,
          {
            marginTop: isSmallScreen ? SPACING.xs : SPACING.sm,
            paddingHorizontal: isSmallScreen ? SPACING.xs : SPACING.sm,
            paddingVertical: isSmallScreen ? SPACING.xs : SPACING.xs,
          }
        ]}>
          <Text style={[
            styles.label,
            { fontSize: isSmallScreen ? FONT_SIZES.xs : FONT_SIZES.sm }
          ]}>{label}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.large,
    elevation: 8,
  },
  ripple: {
    position: 'absolute',
    opacity: 0.3,
  },
  labelContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.sm,
    ...SHADOWS.small,
  },
  label: {
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
});

export default FloatingActionButton;
