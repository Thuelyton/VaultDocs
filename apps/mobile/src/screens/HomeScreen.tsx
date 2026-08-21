/**
 * HomeScreen - Real API Integration
 * Dashboard with real data from API
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { 
  colors, 
  spacing, 
  typography, 
  borderRadius, 
  shadows 
} from '../styles/theme';
import { 
  SearchBar, 
  StatsRow, 
  DocumentCard, 
  StatusBadge,
  SkeletonList 
} from '../components';
import { documentService, Document, DocumentStats } from '../services/documentService';

export function HomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Real data from API
  const [documents, setDocuments] = useState<Document[]>([]);
  const [expiringDocs, setExpiringDocs] = useState<Document[]>([]);
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load all home data
   */
  const loadHomeData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      // Load documents, expiring docs, and stats in parallel
      const [docsResult, expiringResult, statsResult] = await Promise.all([
        documentService.getDocuments({ limit: 5 }),
        documentService.getExpiringDocuments(30),
        documentService.getStats(),
      ]);

      setDocuments(docsResult.documents);
      setExpiringDocs(expiringResult);
      setStats(statsResult);
    } catch (err: any) {
      console.error('Error loading home data:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /**
   * Load on mount
   */
  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  /**
   * Handle pull to refresh
   */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHomeData(false);
  }, [loadHomeData]);

  /**
   * Get stats for display
   */
  const getStatsArray = () => {
    if (!stats) {
      return [
        { title: 'Ativos', value: 0, icon: 'document-text' as const, color: '#3B82F6' },
        { title: 'Vencendo', value: 0, icon: 'warning' as const, color: '#F59E0B' },
        { title: 'Arquivados', value: 0, icon: 'checkmark-circle' as const, color: '#10B981' },
      ];
    }

    return [
      { 
        title: 'Ativos', 
        value: stats.byStatus.active || 0, 
        icon: 'document-text' as const, 
        color: '#3B82F6' 
      },
      { 
        title: 'Vencendo', 
        value: expiringDocs.length, 
        icon: 'warning' as const, 
        color: '#F59E0B' 
      },
      { 
        title: 'Arquivados', 
        value: stats.byStatus.archived || 0, 
        icon: 'checkmark-circle' as const, 
        color: '#10B981' 
      },
    ];
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Olá, {user?.name?.split(' ')[0] || 'Usuário'} 👋
            </Text>
            <Text style={styles.subtitle}>Gerencie seus documentos</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={colors.text.primary} />
            {expiringDocs.length > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>{expiringDocs.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar documentos..."
          />
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <StatsRow stats={getStatsArray()} />
        </View>

        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.retryText} onPress={() => loadHomeData()}>
              Tentar novamente
            </Text>
          </View>
        )}

        {/* Expiring Alert */}
        {expiringDocs.length > 0 && (
          <View style={styles.alertContainer}>
            <View style={styles.alertHeader}>
              <Ionicons name="time" size={20} color={colors.status.expiring.text} />
              <Text style={styles.alertTitle}>Vencendo em breve</Text>
            </View>
            {expiringDocs.slice(0, 3).map(doc => (
              <View key={doc._id} style={styles.alertItem}>
                <Text style={styles.alertItemTitle} numberOfLines={1}>
                  {doc.title}
                </Text>
                <StatusBadge status="expiring" size="sm" />
              </View>
            ))}
            {expiringDocs.length > 3 && (
              <TouchableOpacity style={styles.alertAction}>
                <Text style={styles.alertActionText}>Ver todos</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.primary.DEFAULT} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Recent Documents */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Documentos recentes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Documents' as never)}>
              <Text style={styles.seeAll}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <SkeletonList count={3} />
          ) : documents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={48} color={colors.zinc[300]} />
              <Text style={styles.emptyText}>Nenhum documento ainda</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => navigation.navigate('Upload' as never)}
              >
                <Text style={styles.addButtonText}>Adicionar documento</Text>
              </TouchableOpacity>
            </View>
          ) : (
            documents.map(doc => (
              <DocumentCard
                key={doc._id}
                document={{
                  id: doc._id,
                  title: doc.title,
                  category: doc.category,
                  expirationDate: doc.expirationDate,
                  status: doc.status === 'active' ? 
                    (new Date(doc.expirationDate) > new Date() ? 'active' : 'expired') : 
                    doc.status as any,
                }}
                onPress={(id) => console.log('Document pressed:', id)}
              />
            ))
          )}
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  greeting: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.status.expired.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  
  // Search
  searchContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  
  // Stats
  statsContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  
  // Error
  errorContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: '#FEE2E2',
    borderRadius: borderRadius.card,
    alignItems: 'center',
  },
  errorText: {
    fontSize: typography.fontSize.md,
    color: colors.status.expired.text,
    textAlign: 'center',
  },
  retryText: {
    fontSize: typography.fontSize.md,
    color: colors.primary.DEFAULT,
    fontWeight: typography.fontWeight.medium,
    marginTop: spacing.sm,
  },
  
  // Alert
  alertContainer: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.status.expiring.bg,
    borderRadius: borderRadius.card,
    padding: spacing.md,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  alertTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.status.expiring.text,
    marginLeft: spacing.sm,
  },
  alertItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.sm,
  },
  alertItemTitle: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    marginRight: spacing.sm,
  },
  alertAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  alertActionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary.DEFAULT,
    marginRight: spacing.xs,
  },
  
  // Section
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  seeAll: {
    fontSize: typography.fontSize.md,
    color: colors.primary.DEFAULT,
    fontWeight: typography.fontWeight.medium,
  },
  
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    marginVertical: spacing.md,
  },
  addButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: borderRadius.md,
  },
  addButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  
  // Bottom
  bottomSpacing: {
    height: 100,
  },
});

export default HomeScreen;
