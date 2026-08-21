/**
 * ExpiringScreen - Real API Integration
 * Documents expiring soon with real data
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  RefreshControl,
  TouchableOpacity 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { DocumentCard, EmptyExpiring, SkeletonList } from '../components';
import { documentService, Document } from '../services/documentService';

/**
 * Get expiration status based on days until expiration
 */
function getExpirationStatus(expirationDate: string): {
  label: string;
  color: string;
  bgColor: string;
  daysLeft: number;
} {
  const now = new Date();
  const expDate = new Date(expirationDate);
  const diffTime = expDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: 'Vencido',
      color: '#991B1B',
      bgColor: '#FEE2E2',
      daysLeft: diffDays,
    };
  } else if (diffDays === 0) {
    return {
      label: 'Vence hoje',
      color: '#991B1B',
      bgColor: '#FEE2E2',
      daysLeft: diffDays,
    };
  } else if (diffDays <= 7) {
    return {
      label: `Vence em ${diffDays} dias`,
      color: '#92400E',
      bgColor: '#FEF3C7',
      daysLeft: diffDays,
    };
  } else if (diffDays <= 30) {
    return {
      label: `Vence em ${diffDays} dias`,
      color: '#A16207',
      bgColor: '#FEF9C3',
      daysLeft: diffDays,
    };
  } else {
    return {
      label: `Vence em ${diffDays} dias`,
      color: '#166534',
      bgColor: '#DCFCE7',
      daysLeft: diffDays,
    };
  }
}

export function ExpiringScreen() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [daysFilter, setDaysFilter] = useState(30);

  /**
   * Load expiring documents
   */
  const loadExpiringDocuments = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      const docs = await documentService.getExpiringDocuments(daysFilter);
      setDocuments(docs);
    } catch (err: any) {
      console.error('Error loading expiring documents:', err);
      setError(err.message || 'Erro ao carregar documentos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [daysFilter]);

  /**
   * Load on mount and filter change
   */
  useEffect(() => {
    loadExpiringDocuments();
  }, [loadExpiringDocuments]);

  /**
   * Handle pull to refresh
   */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadExpiringDocuments(false);
  }, [loadExpiringDocuments]);

  /**
   * Sort documents by expiration date (closest first)
   */
  const sortedDocuments = [...documents].sort((a, b) => {
    return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
  });

  /**
   * Group documents by expiration status
   */
  const expiredDocs = sortedDocuments.filter(d => getExpirationStatus(d.expirationDate).daysLeft < 0);
  const expiringSoonDocs = sortedDocuments.filter(d => {
    const status = getExpirationStatus(d.expirationDate);
    return status.daysLeft >= 0 && status.daysLeft <= 7;
  });
  const upcomingDocs = sortedDocuments.filter(d => {
    const status = getExpirationStatus(d.expirationDate);
    return status.daysLeft > 7;
  });

  const filters = [
    { label: '7 dias', value: 7 },
    { label: '30 dias', value: 30 },
    { label: '90 dias', value: 90 },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Vencimentos</Text>
          {documents.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{documents.length}</Text>
            </View>
          )}
        </View>
        <Text style={styles.subtitle}>
          Documentos vencendo nos próximos {daysFilter} dias
        </Text>
      </View>

      {/* Filter Chips */}
      <View style={styles.filtersContainer}>
        {filters.map(filter => (
          <TouchableOpacity
            key={filter.value}
            style={[
              styles.filterChip,
              daysFilter === filter.value && styles.filterChipActive
            ]}
            onPress={() => setDaysFilter(filter.value)}
          >
            <Text style={[
              styles.filterChipText,
              daysFilter === filter.value && styles.filterChipTextActive
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <SkeletonList count={4} />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.status.expired.text} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => loadExpiringDocuments()}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : documents.length === 0 ? (
        <EmptyExpiring />
      ) : (
        <FlatList
          data={sortedDocuments}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => {
            const status = getExpirationStatus(item.expirationDate);
            return (
              <View style={styles.documentWrapper}>
                <DocumentCard
                  document={{
                    id: item._id,
                    title: item.title,
                    category: item.category,
                    expirationDate: item.expirationDate,
                    status: status.daysLeft < 0 ? 'expired' : 'expiring',
                  }}
                  onPress={(id) => console.log('Document pressed:', id)}
                />
                <View style={[styles.statusBadge, { backgroundColor: status.bgColor }]}>
                  <Text style={[styles.statusText, { color: status.color }]}>
                    {status.label}
                  </Text>
                </View>
              </View>
            );
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            <>
              {/* Summary Cards */}
              <View style={styles.summaryContainer}>
                {expiredDocs.length > 0 && (
                  <View style={[styles.summaryCard, { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons name="alert-circle" size={24} color="#991B1B" />
                    <Text style={[styles.summaryValue, { color: '#991B1B' }]}>
                      {expiredDocs.length}
                    </Text>
                    <Text style={[styles.summaryLabel, { color: '#991B1B' }]}>
                      Vencidos
                    </Text>
                  </View>
                )}
                
                {expiringSoonDocs.length > 0 && (
                  <View style={[styles.summaryCard, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="warning" size={24} color="#92400E" />
                    <Text style={[styles.summaryValue, { color: '#92400E' }]}>
                      {expiringSoonDocs.length}
                    </Text>
                    <Text style={[styles.summaryLabel, { color: '#92400E' }]}>
                      Vence em 7 dias
                    </Text>
                  </View>
                )}
                
                {upcomingDocs.length > 0 && (
                  <View style={[styles.summaryCard, { backgroundColor: '#DCFCE7' }]}>
                    <Ionicons name="time" size={24} color="#166534" />
                    <Text style={[styles.summaryValue, { color: '#166534' }]}>
                      {upcomingDocs.length}
                    </Text>
                    <Text style={[styles.summaryLabel, { color: '#166534' }]}>
                      Próximos
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
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
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.zinc[100],
  },
  filterChipActive: {
    backgroundColor: colors.primary.DEFAULT,
  },
  filterChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  summaryCard: {
    flex: 1,
    minWidth: 100,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.card,
  },
  summaryValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    marginTop: spacing.xs,
  },
  summaryLabel: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  documentWrapper: {
    position: 'relative',
  },
  statusBadge: {
    position: 'absolute',
    top: spacing.sm + 2,
    right: spacing.md + 30,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  retryText: {
    fontSize: typography.fontSize.md,
    color: colors.primary.DEFAULT,
    fontWeight: typography.fontWeight.medium,
    marginTop: spacing.md,
  },
});

export default ExpiringScreen;
