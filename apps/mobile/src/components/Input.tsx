/**
 * Input Component - Premium SaaS Design
 * Supports labels, icons, errors, and hints
 */

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TextInputProps,
  ViewStyle,
  TouchableOpacity 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../styles/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  style,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, error && styles.labelError]}>
          {label}
        </Text>
      )}
      
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputFocused,
        error && styles.inputError,
        props.editable === false && styles.inputDisabled,
      ]}>
        {leftIcon && (
          <Ionicons 
            name={leftIcon} 
            size={20} 
            color={error ? colors.status.expired.text : isFocused ? colors.primary.DEFAULT : colors.zinc[400]} 
            style={styles.iconLeft}
          />
        )}
        
        <TextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
            style,
          ]}
          placeholderTextColor={colors.zinc[400]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            style={styles.iconRightContainer}
          >
            <Ionicons 
              name={rightIcon} 
              size={20} 
              color={colors.zinc[400]}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {(error || hint) && (
        <View style={styles.messageContainer}>
          {error ? (
            <>
              <Ionicons name="alert-circle" size={14} color={colors.status.expired.text} />
              <Text style={styles.errorText}>{error}</Text>
            </>
          ) : hint ? (
            <Text style={styles.hintText}>{hint}</Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  labelError: {
    color: colors.status.expired.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    borderRadius: borderRadius.input,
    minHeight: layout.input.height,
  },
  inputFocused: {
    borderColor: colors.primary.DEFAULT,
    backgroundColor: colors.white,
  },
  inputError: {
    borderColor: colors.status.expired.text,
  },
  inputDisabled: {
    backgroundColor: colors.zinc[100],
    borderColor: colors.border.default,
  },
  iconLeft: {
    paddingLeft: spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
  },
  inputWithLeftIcon: {
    paddingLeft: spacing.sm,
  },
  inputWithRightIcon: {
    paddingRight: spacing.sm,
  },
  iconRightContainer: {
    padding: spacing.md,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingLeft: spacing.xs,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.status.expired.text,
    marginLeft: spacing.xs,
  },
  hintText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
});

// Need layout import
import { layout } from '../styles/theme';

export default Input;
