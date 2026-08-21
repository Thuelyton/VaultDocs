/**
 * StatusBadge Component - Premium SaaS Design
 * Displays document status with color coding
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../styles/theme';

type StatusType = 'active' | 'expiring' | 'expired' | 'archived';

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function StatusBadge({ status, size = 'md', style }: StatusBadgeProps) {
  const statusConfig = colors.status[status];
  
  return (
    <View style={[
      styles.badge,
      styles[`size_${size}`],
      { backgroundColor: statusConfig.bg },
      style,
    ]}>
      <View style={[styles.dot, { backgroundColor: statusConfig.dot }]} />
      <Text style={[
        styles.text,
        styles[`text_${size}`],
        { color: statusConfig.text }
      ]}>
        {statusConfig.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.badge,
    alignSelf: 'flex-start',
  },
  size_sm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  size_md: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  text: {
    fontWeight: typography.fontWeight.medium,
  },
  text_sm: {
    fontSize: typography.fontSize.xs,
  },
  text_md: {
    fontSize: typography.fontSize.sm,
  },
});

export default StatusBadge;
