/**
 * ExpiringScreen - Premium SaaS Design
 * Documents expiring soon with alerts
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { DocumentCard, EmptyExpiring } from '../components';

// Mock data
const MOCK_EXPIRING = [
  {
    id: '1',
    title: 'Contrato de Aluguel',
    category: 'contrato' as const,
    expirationDate: '2024-02-15',
    status: 'expiring' as const,
  },
  {
    id: '2',
    title: 'Seguro do Carro',
    category: 'garantia' as const,
    expirationDate: '2024-02-28',
    status: 'expiring' as const,
  },
];

export function ExpiringScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Vencimentos</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{MOCK_EXPIRING.length}</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>
          Documentos vencendo nos próximos 30 dias
        </Text>
      </View>

      {/* Alert Card */}
      <View style={styles.alertCard}>
        <Ionicons name="warning" size={24} color={colors.status.expiring.text} />
        <View style={styles.alertContent}>
          <Text style={styles.alertTitle}>Atenção!</Text>
          <Text style={styles.alertText}>
            Você tem {MOCK_EXPIRING.length} documentos vencendo em breve
          </Text>
        </View>
      </View>

      {MOCK_EXPIRING.length === 0 ? (
        <EmptyExpiring />
      ) : (
        <FlatList
          data={MOCK_EXPIRING}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DocumentCard
              document={item}
              onPress={(id) => console.log('Document pressed:', id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  badge: {
    backgroundColor: colors.status.expiring.bg,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginLeft: spacing.sm,
  },
  badgeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.status.expiring.text,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.expiring.bg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  alertContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  alertTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.status.expiring.text,
  },
  alertText: {
    fontSize: typography.fontSize.sm,
    color: colors.status.expiring.text,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
});

export default ExpiringScreen;
