/**
 * SearchBar Component - Premium SaaS Design
 * Global search with icon and clear button
 */

import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity,
  ViewStyle 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../styles/theme';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onSubmit?: (text: string) => void;
  onClear?: () => void;
  autoFocus?: boolean;
  style?: ViewStyle;
}

export function SearchBar({
  placeholder = 'Buscar documentos...',
  value = '',
  onChangeText,
  onSubmit,
  onClear,
  autoFocus = false,
  style,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    onChangeText?.('');
    onClear?.();
  };

  return (
    <View style={[
      styles.container,
      isFocused && styles.containerFocused,
      style,
    ]}>
      <Ionicons 
        name="search" 
        size={20} 
        color={isFocused ? colors.primary.DEFAULT : colors.zinc[400]}
        style={styles.searchIcon}
      />
      
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.zinc[400]}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={() => onSubmit?.(value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        autoFocus={autoFocus}
        autoCorrect={false}
        returnKeyType="search"
      />
      
      {value.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
          <Ionicons name="close-circle" size={20} color={colors.zinc[400]} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.zinc[100],
    borderRadius: borderRadius.input,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  containerFocused: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.primary.DEFAULT,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  clearButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
});

export default SearchBar;
