/**
 * EmptyState Component - Premium SaaS Design
 * Displayed when there's no content
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../styles/theme';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionTitle?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function EmptyState({
  icon = 'document-text-outline',
  title,
  description,
  actionTitle,
  onAction,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={56} color={colors.zinc[300]} />
      </View>
      
      <Text style={styles.title}>{title}</Text>
      
      {description && (
        <Text style={styles.description}>{description}</Text>
      )}
      
      {actionTitle && onAction && (
        <Button
          title={actionTitle}
          onPress={onAction}
          variant="primary"
          leftIcon="add"
          style={styles.button}
        />
      )}
    </View>
  );
}

// Preset empty states
export function EmptyDocuments({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyState
      icon="folder-open-outline"
      title="Nenhum documento ainda"
      description="Comece adicionando seus primeiros documentos para gerenciá-los em um só lugar."
      actionTitle="Adicionar documento"
      onAction={onAdd}
    />
  );
}

export function EmptySearch({ query }: { query: string }) {
  return (
    <EmptyState
      icon="search-outline"
      title="Nenhum resultado encontrado"
      description={`Não encontramos documentos para "${query}". Tente buscar com outros termos.`}
    />
  );
}

export function EmptyExpiring() {
  return (
    <EmptyState
      icon="checkmark-circle-outline"
      title="Tudo em dia!"
      description="Nenhum documento vencendo nos próximos 30 dias."
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.zinc[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  button: {
    minWidth: 200,
  },
});

export default EmptyState;
