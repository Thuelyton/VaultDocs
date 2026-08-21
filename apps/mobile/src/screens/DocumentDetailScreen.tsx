/**
 * DocumentDetailScreen - Document Preview
 * View document details and preview
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/theme';
import { Button, StatusBadge, CategoryBadge } from '../components';
import { documentService, Document } from '../services/documentService';

interface DocumentDetailScreenProps {
  route: {
    params: {
      id: string;
    };
  };
  navigation: any;
}

export function DocumentDetailScreen({ route, navigation }: DocumentDetailScreenProps) {
  const { id } = route.params;
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load document details
   */
  useEffect(() => {
    loadDocument();
  }, [id]);

  /**
   * Fetch document from API
   */
  const loadDocument = async () => {
    try {
      setLoading(true);
      setError(null);
      const doc = await documentService.getDocument(id);
      setDocument(doc);
    } catch (err: any) {
      console.error('Error loading document:', err);
      setError(err.message || 'Erro ao carregar documento');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle delete
   */
  const handleDelete = () => {
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
              navigation.goBack();
            } catch (err: any) {
              Alert.alert('Erro', 'Não foi possível excluir o documento');
            }
          },
        },
      ]
    );
  };

  /**
   * Handle open file
   */
  const handleOpenFile = async () => {
    if (!document?.file?.storageKey) return;
    
    // For now, just show the storage key
    // In production, this would generate a presigned URL
    Alert.alert(
      'Arquivo',
      `Storage Key: ${document.file.storageKey}`,
      [{ text: 'OK' }]
    );
  };

  /**
   * Get status based on expiration
   */
  const getStatus = () => {
    if (!document) return 'active';
    
    if (document.status === 'archived') return 'archived';
    
    const now = new Date();
    const expDate = new Date(document.expirationDate);
    
    if (expDate < now) return 'expired';
    
    const daysUntilExpiry = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry <= 30) return 'expiring';
    
    return 'active';
  };

  /**
   * Format date
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  /**
   * Check if file is image
   */
  const isImage = (mimeType: string) => {
    return mimeType?.startsWith('image/');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
          <Text style={styles.loadingText}>Carregando documento...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !document) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.status.expired.text} />
          <Text style={styles.errorText}>{error || 'Documento não encontrado'}</Text>
          <Button
            title="Voltar"
            onPress={() => navigation.goBack()}
            variant="outline"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Detalhes
          </Text>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={24} color={colors.status.expired.text} />
          </TouchableOpacity>
        </View>

        {/* Document Card */}
        <View style={styles.documentCard}>
          {/* Preview */}
          <TouchableOpacity 
            style={styles.previewContainer}
            onPress={handleOpenFile}
            activeOpacity={0.8}
          >
            {isImage(document.file?.mimeType) ? (
              <Image 
                source={{ uri: document.file?.storageKey }} 
                style={styles.previewImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.previewPlaceholder}>
                <Ionicons name="document-text" size={64} color={colors.primary.DEFAULT} />
                <Text style={styles.previewText}>Visualizar arquivo</Text>
              </View>
            )}
            <View style={styles.previewOverlay}>
              <Ionicons name="eye" size={24} color={colors.white} />
            </View>
          </TouchableOpacity>

          {/* Info */}
          <View style={styles.documentInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.documentTitle} numberOfLines={2}>
                {document.title}
              </Text>
            </View>
            
            <View style={styles.badgesRow}>
              <CategoryBadge category={document.category} />
              <StatusBadge status={getStatus()} size="sm" />
            </View>
          </View>
        </View>

        {/* Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações</Text>
          
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Vencimento</Text>
              <Text style={styles.detailValue}>{formatDate(document.expirationDate)}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={20} color={colors.text.secondary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Criado em</Text>
              <Text style={styles.detailValue}>{formatDate(document.createdAt)}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="file-tray-outline" size={20} color={colors.text.secondary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Tipo do arquivo</Text>
              <Text style={styles.detailValue}>{document.file?.mimeType || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="resize-outline" size={20} color={colors.text.secondary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Tamanho</Text>
              <Text style={styles.detailValue}>
                {document.file?.sizeBytes 
                  ? `${(document.file.sizeBytes / 1024 / 1024).toFixed(2)} MB`
                  : 'N/A'
                }
              </Text>
            </View>
          </View>
        </View>

        {/* Extracted Data Section */}
        {document.extractedData && Object.keys(document.extractedData).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dados Extraídos</Text>
            {Object.entries(document.extractedData).map(([key, value]) => (
              <View key={key} style={styles.detailRow}>
                <Ionicons name="information-circle-outline" size={20} color={colors.text.secondary} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>{key}</Text>
                  <Text style={styles.detailValue}>{String(value)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Abrir arquivo"
            onPress={handleOpenFile}
            leftIcon="open-outline"
            fullWidth
          />
          <Button
            title="Excluir"
            onPress={handleDelete}
            variant="danger"
            leftIcon="trash-outline"
            fullWidth
          />
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    textAlign: 'center',
    marginHorizontal: spacing.md,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Document Card
  documentCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    overflow: 'hidden',
    ...shadows.md,
  },
  previewContainer: {
    position: 'relative',
    height: 200,
    backgroundColor: colors.zinc[100],
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  previewOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentInfo: {
    padding: spacing.lg,
  },
  titleRow: {
    marginBottom: spacing.md,
  },
  documentTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  
  // Section
  section: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  detailContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  detailLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  detailValue: {
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
    marginTop: 2,
  },
  
  // Actions
  actions: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
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
    marginBottom: spacing.lg,
  },
});

export default DocumentDetailScreen;
