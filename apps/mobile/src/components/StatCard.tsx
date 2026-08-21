/**
 * StatCard Component - Premium SaaS Design
 * Metric display card for dashboard
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  style?: ViewStyle;
}

export function StatCard({ 
  title, 
  value, 
  icon, 
  color,
  trend,
  style 
}: StatCardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
      
      {trend && (
        <View style={styles.trendContainer}>
          <Ionicons 
            name={trend.isPositive ? 'trending-up' : 'trending-down'} 
            size={14} 
            color={trend.isPositive ? colors.status.active.text : colors.status.expired.text}
          />
          <Text style={[
            styles.trendText,
            { color: trend.isPositive ? colors.status.active.text : colors.status.expired.text }
          ]}>
            {trend.value}%
          </Text>
        </View>
      )}
    </View>
  );
}

// Stats row component
interface StatsRowProps {
  stats: Array<{
    title: string;
    value: number | string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
  }>;
}

export function StatsRow({ stats }: StatsRowProps) {
  return (
    <View style={styles.statsRow}>
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          {...stat}
          style={styles.statItem}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    ...shadows.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  value: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  trendText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statItem: {
    flex: 1,
  },
});

export default StatCard;
