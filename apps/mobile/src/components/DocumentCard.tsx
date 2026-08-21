/**
 * DocumentCard Component - Premium SaaS Design
 * Clean display: Icon, Title, Category, Status, Expiration
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';
import { StatusBadge } from './StatusBadge';
import { CategoryBadge, getCategoryConfig } from './CategoryBadge';

type StatusType = 'active' | 'expiring' | 'expired' | 'archived';
type CategoryType = 'cnh' | 'rg' | 'boleto' | 'contrato' | 'garantia' | 'outros';

interface Document {
  id: string;
  title: string;
  category: CategoryType;
  expirationDate: string;
  status: StatusType;
}

interface DocumentCardProps {
  document: Document;
  onPress: (id: string) => void;
  style?: ViewStyle;
}

export function DocumentCard({ document, onPress, style }: DocumentCardProps) {
  const categoryConfig = getCategoryConfig(document.category);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDaysUntilExpiration = (dateString: string) => {
    const today = new Date();
    const expiration = new Date(dateString);
    const diffTime = expiration.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysLeft = getDaysUntilExpiration(document.expirationDate);
  
  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={() => onPress(document.id)}
      activeOpacity={0.7}
    >
      {/* Category Icon */}
      <View style={[
        styles.iconContainer,
        { backgroundColor: categoryConfig.color + '15' }
      ]}>
        <Ionicons 
          name={categoryConfig.icon} 
          size={24} 
          color={categoryConfig.color}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>
            {document.title}
          </Text>
          <StatusBadge status={document.status} size="sm" />
        </View>
        
        <View style={styles.metaRow}>
          <CategoryBadge category={document.category} size="sm" />
          
          <View style={styles.expirationContainer}>
            <Ionicons 
              name="time-outline" 
              size={12} 
              color={daysLeft <= 7 ? colors.status.expiring.text : colors.text.tertiary}
            />
            <Text style={[
              styles.expirationText,
              daysLeft <= 7 && styles.expirationWarning,
            ]}>
              {daysLeft > 0 ? `${daysLeft} dias` : 'Vencido'}
            </Text>
          </View>
        </View>
      </View>

      {/* Arrow */}
      <Ionicons 
        name="chevron-forward" 
        size={20} 
        color={colors.zinc[300]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginRight: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expirationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expirationText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginLeft: 4,
  },
  expirationWarning: {
    color: colors.status.expiring.text,
    fontWeight: typography.fontWeight.medium,
  },
});

export default DocumentCard;
