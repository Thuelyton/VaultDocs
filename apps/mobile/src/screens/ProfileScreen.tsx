/**
 * ProfileScreen - Premium SaaS Design
 * User profile and settings
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components';

export function ProfileScreen() {
  const { user, logout } = useAuth();

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
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
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Documentos</Text>
          </View>
          <View style={[styles.statItem, styles.statBorder]}>
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Vencendo</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>2</Text>
            <Text style={styles.statLabel}>Arquivados</Text>
          </View>
        </View>

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
            rightBadge="3"
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
