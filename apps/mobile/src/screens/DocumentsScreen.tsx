/**
 * DocumentsScreen - Premium SaaS Design
 * List of all documents with filters and search
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../styles/theme';
import { SearchBar, DocumentCard, EmptyDocuments, SkeletonList } from '../components';

// Mock data for demo
const MOCK_DOCUMENTS = [
  {
    id: '1',
    title: 'CNH - Carteira de Habilitação',
    category: 'cnh' as const,
    expirationDate: '2025-06-15',
    status: 'active' as const,
  },
  {
    id: '2',
    title: 'Contrato de Aluguel',
    category: 'contrato' as const,
    expirationDate: '2024-12-31',
    status: 'expiring' as const,
  },
  {
    id: '3',
    title: 'Boleto Energia - Janeiro',
    category: 'boleto' as const,
    expirationDate: '2024-02-10',
    status: 'expired' as const,
  },
  {
    id: '4',
    title: 'RG - Registro Geral',
    category: 'rg' as const,
    expirationDate: '2030-05-20',
    status: 'active' as const,
  },
];

export function DocumentsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredDocuments = MOCK_DOCUMENTS.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDocumentPress = (id: string) => {
    console.log('Document pressed:', id);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Meus Documentos</Text>
        <Text style={styles.subtitle}>{MOCK_DOCUMENTS.length} documentos</Text>
      </View>

      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar documentos..."
        />
      </View>

      {/* Filter chips */}
      <View style={styles.filtersContainer}>
        <FilterChip label="Todos" active />
        <FilterChip label="Ativos" />
        <FilterChip label="Vencendo" />
        <FilterChip label="Vencidos" />
      </View>

      {loading ? (
        <SkeletonList count={4} />
      ) : filteredDocuments.length === 0 ? (
        <EmptyDocuments onAdd={() => console.log('Add document')} />
      ) : (
        <FlatList
          data={filteredDocuments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DocumentCard
              document={item}
              onPress={handleDocumentPress}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// Filter Chip Component
function FilterChip({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <View style={[styles.chip, active && styles.chipActive]}>
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
});

// Need borderRadius import
import { borderRadius } from '../styles/theme';

export default DocumentsScreen;
