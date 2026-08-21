/**
 * ProfileScreen - Real API Integration
 * User profile with real data from AuthContext and API
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components';
import { documentService, DocumentStats } from '../services/documentService';

export function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load user stats from API
   */
  const loadStats = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      const statsResult = await documentService.getStats();
      setStats(statsResult);
    } catch (err: any) {
      console.error('Error loading stats:', err);
      setError(err.message || 'Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /**
   * Load on mount
   */
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  /**
   * Handle pull to refresh
   */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadStats(false);
    refreshUser();
  }, [loadStats, refreshUser]);

  /**
   * Handle logout
   */
  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Deseja realmente sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: logout },
      ]
    );
  };

  /**
   * Get total documents count
   */
  const getTotalDocuments = () => {
    if (!stats) return 0;
    return Object.values(stats.byStatus).reduce((sum, count) => sum + count, 0);
  };

  /**
   * Get active documents count
   */
  const getActiveDocuments = () => {
    return stats?.byStatus.active || 0;
  };

  /**
   * Get archived documents count
   */
  const getArchivedDocuments = () => {
    return stats?.byStatus.archived || 0;
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
          <Text style={styles.title}>Perfil</Text>
        </View>

        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'Usuário'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'email@example.com'}</Text>
          {user?.createdAt && (
            <Text style={styles.memberSince}>
              Membro desde {new Date(user.createdAt).toLocaleDateString('pt-BR', {
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          )}
        </View>

        {/* Stats */}
        {loading ? (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={styles.skeletonStat} />
            </View>
            <View style={[styles.statItem, styles.statBorder]}>
              <View style={styles.skeletonStat} />
            </View>
            <View style={styles.statItem}>
              <View style={styles.skeletonStat} />
            </View>
          </View>
        ) : error ? (
          <View style={styles.errorStats}>
            <Text style={styles.errorStatsText}>Erro ao carregar estatísticas</Text>
          </View>
        ) : (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{getTotalDocuments()}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={[styles.statItem, styles.statBorder]}>
              <Text style={styles.statValue}>{getActiveDocuments()}</Text>
              <Text style={styles.statLabel}>Ativos</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{getArchivedDocuments()}</Text>
              <Text style={styles.statLabel}>Arquivados</Text>
            </View>
          </View>
        )}

        {/* Categories breakdown */}
        {stats && Object.keys(stats.byCategory).length > 0 && (
          <View style={styles.categoriesCard}>
            <Text style={styles.categoriesTitle}>Por Categoria</Text>
            <View style={styles.categoriesGrid}>
              {Object.entries(stats.byCategory).map(([category, count]) => (
                <View key={category} style={styles.categoryItem}>
                  <Text style={styles.categoryCount}>{count}</Text>
                  <Text style={styles.categoryName}>{category.toUpperCase()}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Conta</Text>
          
          <MenuItem
            icon="person-outline"
            title="Editar perfil"
            onPress={() => console.log('Edit profile')}
          />
          <MenuItem
            icon="notifications-outline"
            title="Notificações"
            onPress={() => console.log('Notifications')}
          />
          <MenuItem
            icon="shield-checkmark-outline"
            title="Segurança"
            onPress={() => console.log('Security')}
          />
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Preferências</Text>
          
          <MenuItem
            icon="moon-outline"
            title="Modo escuro"
            onPress={() => console.log('Dark mode')}
            rightContent={<ToggleSwitch />}
          />
          <MenuItem
            icon="language-outline"
            title="Idioma"
            onPress={() => console.log('Language')}
            rightContent={<Text style={styles.menuValue}>Português</Text>}
          />
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Suporte</Text>
          
          <MenuItem
            icon="help-circle-outline"
            title="Central de ajuda"
            onPress={() => console.log('Help')}
          />
          <MenuItem
            icon="chatbubble-outline"
            title="Falar com suporte"
            onPress={() => console.log('Support')}
          />
          <MenuItem
            icon="document-text-outline"
            title="Termos de uso"
            onPress={() => console.log('Terms')}
          />
        </View>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <Button
            title="Sair da conta"
            onPress={handleLogout}
            variant="outline"
            leftIcon="log-out-outline"
            fullWidth
            style={styles.logoutButton}
          />
        </View>

        {/* App Version */}
        <Text style={styles.version}>VaultDocs v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// Menu Item Component
function MenuItem({
  icon,
  title,
  onPress,
  rightBadge,
  rightContent,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
  rightBadge?: string;
  rightContent?: React.ReactNode;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuIcon}>
        <Ionicons name={icon} size={22} color={colors.text.primary} />
      </View>
      <Text style={styles.menuTitle}>{title}</Text>
      <View style={styles.menuRight}>
        {rightBadge && (
          <View style={styles.menuBadge}>
            <Text style={styles.menuBadgeText}>{rightBadge}</Text>
          </View>
        )}
        {rightContent}
        <Ionicons name="chevron-forward" size={20} color={colors.zinc[300]} />
      </View>
    </TouchableOpacity>
  );
}

// Toggle Switch Component (visual only)
function ToggleSwitch() {
  return (
    <View style={styles.toggle}>
      <View style={styles.toggleKnob} />
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
  
  // User Card
  userCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  userName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  userEmail: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  memberSince: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
  },
  
  // Stats
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    ...shadows.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  statBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border.default,
  },
  statValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  skeletonStat: {
    width: 40,
    height: 40,
    backgroundColor: colors.zinc[200],
    borderRadius: borderRadius.md,
  },
  errorStats: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.md,
    backgroundColor: '#FEE2E2',
    borderRadius: borderRadius.card,
    alignItems: 'center',
  },
  errorStatsText: {
    fontSize: typography.fontSize.sm,
    color: colors.status.expired.text,
  },
  
  // Categories
  categoriesCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    ...shadows.sm,
  },
  categoriesTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryItem: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.zinc[100],
    borderRadius: borderRadius.md,
    minWidth: 70,
  },
  categoryCount: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.DEFAULT,
  },
  categoryName: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  
  // Menu
  menuSection: {
    marginBottom: spacing.lg,
  },
  menuSectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.zinc[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  menuTitle: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuBadge: {
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
  },
  menuBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  menuValue: {
    fontSize: typography.fontSize.md,
    color: colors.text.tertiary,
    marginRight: spacing.sm,
  },
  
  // Toggle
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.zinc[300],
    padding: 2,
    marginRight: spacing.sm,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  
  // Logout
  logoutContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  logoutButton: {
    borderColor: colors.status.expired.text,
  },
  
  // Version
  version: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
    paddingBottom: spacing.xl,
  },
});

export default ProfileScreen;
