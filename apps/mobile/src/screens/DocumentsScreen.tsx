/**
 * DocumentsScreen - Real API Integration
 * List of all documents from API
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  RefreshControl,
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { 
  SearchBar, 
  DocumentCard, 
  EmptyDocuments, 
  SkeletonList 
} from '../components';
import { documentService, Document, DocumentFilters } from '../services/documentService';

export function DocumentsScreen() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('Todos');
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  /**
   * Load documents from API
   */
  const loadDocuments = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      const filters: DocumentFilters = {
        page: pagination.page,
        limit: pagination.limit,
      };

      // Add search filter
      if (searchQuery) {
        filters.search = searchQuery;
      }

      // Add status filter
      if (activeFilter !== 'Todos') {
        const statusMap: Record<string, string> = {
          'Ativos': 'active',
          'Vencendo': 'active', // Will filter by expiration date
          'Vencidos': 'expired',
          'Arquivados': 'archived',
        };
        if (statusMap[activeFilter] && activeFilter !== 'Vencendo') {
          filters.status = statusMap[activeFilter] as any;
        }
      }

      const result = await documentService.getDocuments(filters);
      setDocuments(result.documents);
      setPagination(result.pagination);
    } catch (err: any) {
      console.error('Error loading documents:', err);
      setError(err.message || 'Erro ao carregar documentos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pagination.page, pagination.limit, searchQuery, activeFilter]);

  /**
   * Load on mount and when filters change
   */
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  /**
   * Handle pull to refresh
   */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDocuments(false);
  }, [loadDocuments]);

  /**
   * Handle document press
   */
  const handleDocumentPress = useCallback((id: string) => {
    console.log('Document pressed:', id);
    // TODO: Navigate to document detail
  }, []);

  /**
   * Handle document delete
   */
  const handleDocumentDelete = useCallback((id: string) => {
    Alert.alert(
      'Excluir documento',
      'Tem certeza que deseja excluir este documento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await documentService.deleteDocument(id);
              loadDocuments(false);
            } catch (err: any) {
              Alert.alert('Erro', 'Não foi possível excluir o documento');
            }
          },
        },
      ]
    );
  }, [loadDocuments]);

  /**
   * Filter documents by expiration status
   */
  const getFilteredDocuments = () => {
    if (activeFilter === 'Vencendo') {
      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      return documents.filter(doc => {
        if (doc.status !== 'active') return false;
        const expDate = new Date(doc.expirationDate);
        return expDate > now && expDate <= thirtyDaysFromNow;
      });
    }
    return documents;
  };

  const filteredDocuments = getFilteredDocuments();
  const filters = ['Todos', 'Ativos', 'Vencendo', 'Vencidos', 'Arquivados'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Meus Documentos</Text>
        <Text style={styles.subtitle}>
          {pagination.total} {pagination.total === 1 ? 'documento' : 'documentos'}
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar documentos..."
        />
      </View>

      {/* Filter Chips */}
      <View style={styles.filtersContainer}>
        {filters.map(filter => (
          <FilterChip
            key={filter}
            label={filter}
            active={activeFilter === filter}
            onPress={() => setActiveFilter(filter)}
          />
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <SkeletonList count={4} />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.status.expired.text} />
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.retryText} onPress={() => loadDocuments()}>
            Tentar novamente
          </Text>
        </View>
      ) : filteredDocuments.length === 0 ? (
        <EmptyDocuments onAdd={() => console.log('Add document')} />
      ) : (
        <FlatList
          data={filteredDocuments}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <DocumentCard
              document={{
                id: item._id,
                title: item.title,
                category: item.category,
                expirationDate: item.expirationDate,
                status: item.status === 'active' ? 
                  (new Date(item.expirationDate) > new Date() ? 'active' : 'expired') : 
                  item.status as any,
              }}
              onPress={handleDocumentPress}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// Filter Chip Component
function FilterChip({ 
  label, 
  active = false,
  onPress 
}: { 
  label: string; 
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <View style={[styles.chip, active && styles.chipActive]} onTouchEnd={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </View>
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
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.zinc[100],
  },
  chipActive: {
    backgroundColor: colors.primary.DEFAULT,
  },
  chipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },
  chipTextActive: {
    color: colors.white,
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

export default DocumentsScreen;
