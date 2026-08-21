/**
 * HomeScreen - Premium SaaS Design
 * Dashboard with greeting, search, metrics, alerts, recent docs
 */

import React, { useState } from 'react';
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

// Mock data
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
    expirationDate: '2024-02-15',
    status: 'expiring' as const,
  },
  {
    id: '3',
    title: 'Boleto Energia',
    category: 'boleto' as const,
    expirationDate: '2024-02-10',
    status: 'expired' as const,
  },
];

export function HomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => setRefreshing(false), 1500);
  };

  const stats = [
    {
      title: 'Ativos',
      value: 12,
      icon: 'document-text' as const,
      color: '#3B82F6',
    },
    {
      title: 'Vencendo',
      value: 3,
      icon: 'warning' as const,
      color: '#F59E0B',
    },
    {
      title: 'Arquivados',
      value: 2,
      icon: 'checkmark-circle' as const,
      color: '#10B981',
    },
  ];

  const expiringDocs = MOCK_DOCUMENTS.filter(d => d.status === 'expiring');

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
            <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0] || 'Usuário'} 👋</Text>
            <Text style={styles.subtitle}>Gerencie seus documentos</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={colors.text.primary} />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>2</Text>
            </View>
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
          <StatsRow stats={stats} />
        </View>

        {/* Expiring Alert */}
        {expiringDocs.length > 0 && (
          <View style={styles.alertContainer}>
            <View style={styles.alertHeader}>
              <Ionicons name="time" size={20} color={colors.status.expiring.text} />
              <Text style={styles.alertTitle}>Vencendo em breve</Text>
            </View>
            {expiringDocs.map(doc => (
              <View key={doc.id} style={styles.alertItem}>
                <Text style={styles.alertItemTitle} numberOfLines={1}>{doc.title}</Text>
                <StatusBadge status="expiring" size="sm" />
              </View>
            ))}
            <TouchableOpacity style={styles.alertAction}>
              <Text style={styles.alertActionText}>Ver todos</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.primary.DEFAULT} />
            </TouchableOpacity>
          </View>
        )}

        {/* Recent Documents */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Documentos recentes</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          
          {MOCK_DOCUMENTS.slice(0, 3).map(doc => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onPress={(id) => (navigation as any).navigate('DocumentDetail', { id })}
            />
          ))}
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
  
  // Bottom
  bottomSpacing: {
    height: 100,
  },
});

export default HomeScreen;
