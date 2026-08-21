/**
 * Button Component - Premium SaaS Design
 * Variants: primary, secondary, outline, ghost, danger
 * Sizes: sm, md, lg
 */

import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  ViewStyle,
  TextStyle 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
}: ButtonProps) {
  const buttonStyles = [
    styles.base,
    styles[`variant_${variant}`],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${variant}`],
    styles[`textSize_${size}`],
    disabled && styles.textDisabled,
    textStyle,
  ];

  const iconColor = getIconColor(variant, disabled);
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator 
          color={iconColor} 
          size="small" 
        />
      ) : (
        <>
          {leftIcon && (
            <Ionicons 
              name={leftIcon} 
              size={iconSize} 
              color={iconColor}
              style={styles.leftIcon}
            />
          )}
          <Text style={textStyles}>{title}</Text>
          {rightIcon && (
            <Ionicons 
              name={rightIcon} 
              size={iconSize} 
              color={iconColor}
              style={styles.rightIcon}
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

function getIconColor(variant: string, disabled: boolean): string {
  if (disabled) return colors.zinc[400];
  
  switch (variant) {
    case 'primary':
    case 'secondary':
    case 'danger':
      return colors.white;
    case 'outline':
    case 'ghost':
      return colors.primary.DEFAULT;
    default:
      return colors.white;
  }
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.button,
    ...shadows.sm,
  },
  
  // Variants
  variant_primary: {
    backgroundColor: colors.primary.DEFAULT,
  },
  variant_secondary: {
    backgroundColor: colors.zinc[800],
  },
  variant_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.border.default,
    shadowOpacity: 0,
  },
  variant_ghost: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
  },
  variant_danger: {
    backgroundColor: '#EF4444',
  },
  
  // Sizes
  size_sm: {
    height: 36,
    paddingHorizontal: spacing.md,
  },
  size_md: {
    height: 48,
    paddingHorizontal: spacing.lg,
  },
  size_lg: {
    height: 56,
    paddingHorizontal: spacing.xl,
  },
  
  // Full Width
  fullWidth: {
    width: '100%',
  },
  
  // Disabled
  disabled: {
    opacity: 0.5,
    shadowOpacity: 0,
  },
  
  // Text
  text: {
    fontWeight: typography.fontWeight.semibold,
  },
  text_primary: {
    color: colors.white,
  },
  text_secondary: {
    color: colors.white,
  },
  text_outline: {
    color: colors.text.primary,
  },
  text_ghost: {
    color: colors.primary.DEFAULT,
  },
  text_danger: {
    color: colors.white,
  },
  textDisabled: {
    color: colors.zinc[400],
  },
  
  // Text sizes
  textSize_sm: {
    fontSize: typography.fontSize.sm,
  },
  textSize_md: {
    fontSize: typography.fontSize.md,
  },
  textSize_lg: {
    fontSize: typography.fontSize.lg,
  },
  
  // Icons
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },
});

export default Button;
