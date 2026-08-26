/**
 * DocumentsScreen - Vault Document Manager
 * File manager style with sidebar categories
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/theme';
import { 
  SearchBar, 
  DocumentCard, 
  EmptyDocuments, 
  SkeletonList 
} from '../components';
import { documentService, Document, DocumentFilters, DocumentCategory } from '../services/documentService';
import { useNavigation } from '@react-navigation/native';
import Alert from '../utils/alert';

/**
 * Category/Folder definitions
 */
interface CategoryItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  category?: DocumentCategory; // undefined = all documents
}

const categories: CategoryItem[] = [
  { id: 'todos', label: 'Todos', icon: 'folder-outline', color: colors.zinc[500] },
  { id: 'contas_fixas', label: 'Contas Fixas', icon: 'repeat-outline', color: '#2563EB', category: 'contas_fixas' },
  { id: 'despesas_rotativas', label: 'Despesas Rotativas', icon: 'swap-horizontal-outline', color: '#8B5CF6', category: 'despesas_rotativas' },
  { id: 'documentos_pessoais', label: 'Documentos Pessoais', icon: 'person-outline', color: '#10B981', category: 'documentos_pessoais' },
  { id: 'contratos', label: 'Contratos', icon: 'document-text-outline', color: '#059669', category: 'contratos' },
  { id: 'comprovantes', label: 'Comprovantes', icon: 'receipt-outline', color: '#D97706', category: 'comprovantes' },
  { id: 'garantias', label: 'Garantias', icon: 'shield-checkmark-outline', color: '#DC2626', category: 'garantias' },
  { id: 'impostos', label: 'Impostos', icon: 'calculator-outline', color: '#7C3AED', category: 'impostos' },
  { id: 'outros', label: 'Outros', icon: 'folder-open-outline', color: '#6B7280', category: 'outros' },
];

export function DocumentsScreen() {
  const navigation = useNavigation<any>();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
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

      // Add category filter
      const cat = categories.find(c => c.id === selectedCategory);
      if (cat?.category) {
        filters.category = cat.category;
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
  }, [pagination.page, pagination.limit, searchQuery, selectedCategory]);

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
   * Handle document press - navigate to detail
   */
  const handleDocumentPress = useCallback((id: string) => {
    navigation.navigate('DocumentDetail', { documentId: id });
  }, [navigation]);

  /**
   * Handle add document
   */
  const handleAddDocument = useCallback(() => {
    navigation.navigate('Upload');
  }, [navigation]);

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
   * Get category count
   */
  const getCategoryCount = (categoryId: string): number => {
    if (categoryId === 'todos') return pagination.total;
    const cat = categories.find(c => c.id === categoryId);
    if (!cat?.category) return 0;
    // This would need a stats endpoint in production
    return documents.filter(d => d.category === cat.category).length;
  };

  /**
   * Render sidebar category item
   */
  const renderCategoryItem = (category: CategoryItem) => {
    const isSelected = selectedCategory === category.id;
    const count = getCategoryCount(category.id);
    
    return (
      <TouchableOpacity
        key={category.id}
        style={[styles.sidebarItem, isSelected && styles.sidebarItemActive]}
        onPress={() => setSelectedCategory(category.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.sidebarIcon, { backgroundColor: category.color + '15' }]}>
          <Ionicons 
            name={category.icon} 
            size={20} 
            color={isSelected ? colors.white : category.color}
          />
        </View>
        <Text style={[styles.sidebarLabel, isSelected && styles.sidebarLabelActive]} numberOfLines={1}>
          {category.label}
        </Text>
        {count > 0 && (
          <View style={[styles.countBadge, isSelected && styles.countBadgeActive]}>
            <Text style={[styles.countText, isSelected && styles.countTextActive]}>
              {count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const selectedCat = categories.find(c => c.id === selectedCategory);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.mainContainer}>
        {/* Sidebar - Desktop/Web */}
        {Platform.OS === 'web' ? (
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <Ionicons name="folder-open" size={24} color={colors.primary.DEFAULT} />
              <Text style={styles.sidebarTitle}>Pastas</Text>
            </View>
            <ScrollView style={styles.sidebarContent}>
              {categories.map(renderCategoryItem)}
            </ScrollView>
          </View>
        ) : null}

        {/* Main Content */}
        <View style={styles.contentContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {/* Mobile: Show back button for category */}
              {Platform.OS !== 'web' && selectedCategory !== 'todos' && (
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => setSelectedCategory('todos')}
                >
                  <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              )}
              <View>
                <Text style={styles.title}>
                  {selectedCat?.label || 'Documentos'}
                </Text>
                <Text style={styles.subtitle}>
                  {pagination.total} {pagination.total === 1 ? 'documento' : 'documentos'}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity style={styles.addButton} onPress={handleAddDocument}>
              <Ionicons name="add" size={24} color={colors.white} />
              <Text style={styles.addButtonText}>Adicionar</Text>
            </TouchableOpacity>
          </View>

          {/* Mobile: Category Chips */}
          {Platform.OS !== 'web' && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.chipsContainer}
              contentContainerStyle={styles.chipsContent}
            >
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    selectedCategory === cat.id && styles.categoryChipActive
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Ionicons 
                    name={cat.icon} 
                    size={14} 
                    color={selectedCategory === cat.id ? colors.white : cat.color} 
                  />
                  <Text style={[
                    styles.categoryChipText,
                    selectedCategory === cat.id && styles.categoryChipTextActive
                  ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Search */}
          <View style={styles.searchContainer}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar documentos..."
            />
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
          ) : documents.length === 0 ? (
            <EmptyDocuments onAdd={handleAddDocument} />
          ) : (
            <FlatList
              data={documents}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <DocumentCard
                  document={{
                    id: item._id,
                    title: item.title,
                    category: item.category,
                    expirationDate: item.expirationDate,
                    status: item.status === 'active' ? 
                      (item.expirationDate && new Date(item.expirationDate) < new Date() ? 'expired' : 'active') : 
                      item.status as any,
                    file: item.file,
                    createdAt: item.createdAt,
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
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  
  // Sidebar (Web/Desktop)
  sidebar: {
    width: 260,
    backgroundColor: colors.white,
    borderRightWidth: 1,
    borderRightColor: colors.border.default,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    gap: spacing.sm,
  },
  sidebarTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  sidebarContent: {
    flex: 1,
    padding: spacing.sm,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  sidebarItemActive: {
    backgroundColor: colors.primary.DEFAULT,
  },
  sidebarIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarLabel: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  sidebarLabelActive: {
    color: colors.white,
  },
  countBadge: {
    backgroundColor: colors.zinc[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  countText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },
  countTextActive: {
    color: colors.white,
  },
  
  // Content
  contentContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.button,
    gap: spacing.xs,
    ...shadows.sm,
  },
  addButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  
  // Category Chips (Mobile)
  chipsContainer: {
    maxHeight: 44,
    marginBottom: spacing.md,
  },
  chipsContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    gap: spacing.xs,
    ...shadows.xs,
  },
  categoryChipActive: {
    backgroundColor: colors.primary.DEFAULT,
  },
  categoryChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },
  categoryChipTextActive: {
    color: colors.white,
  },
  
  // Search
  searchContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  
  // List
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  
  // Error
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
