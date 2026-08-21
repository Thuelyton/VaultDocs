/**
 * CategoryBadge Component - Premium SaaS Design
 * Displays document category with icon and color
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../styles/theme';

type CategoryType = 'cnh' | 'rg' | 'boleto' | 'contrato' | 'garantia' | 'outros';

interface CategoryBadgeProps {
  category: CategoryType;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  style?: ViewStyle;
}

const categoryConfig: Record<CategoryType, {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}> = {
  cnh: { label: 'CNH', icon: 'car-outline', color: '#3B82F6' },
  rg: { label: 'RG', icon: 'card-outline', color: '#8B5CF6' },
  boleto: { label: 'Boleto', icon: 'receipt-outline', color: '#F59E0B' },
  contrato: { label: 'Contrato', icon: 'document-text-outline', color: '#10B981' },
  garantia: { label: 'Garantia', icon: 'shield-checkmark-outline', color: '#EC4899' },
  outros: { label: 'Outros', icon: 'folder-outline', color: '#6B7280' },
};

export function CategoryBadge({ 
  category, 
  size = 'md', 
  showIcon = true,
  style 
}: CategoryBadgeProps) {
  const config = categoryConfig[category] || categoryConfig.outros;
  const iconSize = size === 'sm' ? 12 : 14;
  
  return (
    <View style={[
      styles.badge,
      styles[`size_${size}`],
      { backgroundColor: config.color + '15' },
      style,
    ]}>
      {showIcon && (
        <Ionicons 
          name={config.icon} 
          size={iconSize} 
          color={config.color}
          style={styles.icon}
        />
      )}
      <Text style={[
        styles.text,
        styles[`text_${size}`],
        { color: config.color }
      ]}>
        {config.label}
      </Text>
    </View>
  );
}

// Get category config for external use
export function getCategoryConfig(category: CategoryType) {
  return categoryConfig[category] || categoryConfig.outros;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  size_sm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  size_md: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: typography.fontWeight.medium,
  },
  text_sm: {
    fontSize: typography.fontSize['2xs'],
  },
  text_md: {
    fontSize: typography.fontSize.xs,
  },
});

export default CategoryBadge;
