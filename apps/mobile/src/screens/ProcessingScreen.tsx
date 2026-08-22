/**
 * ProcessingScreen - Document Processing
 * Shows OCR + AI processing status and results
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/theme';
import { Button, Input, StatusBadge } from '../components';
import { documentService, Document, ProcessingStatus } from '../services/documentService';

interface ProcessingScreenProps {
  route: {
    params: {
      documentId: string;
    };
  };
  navigation: any;
}

export function ProcessingScreen({ route, navigation }: ProcessingScreenProps) {
  const { documentId } = route.params;
  const [document, setDocument] = useState<Document | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editableData, setEditableData] = useState<Record<string, any>>({});

  /**
   * Load document and processing status
   */
  useEffect(() => {
    loadDocument();
  }, [documentId]);

  /**
   * Poll processing status when processing
   */
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (processing && processingStatus?.status === 'PROCESSING') {
      interval = setInterval(() => {
        checkProcessingStatus();
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [processing, processingStatus?.status]);

  /**
   * Load document
   */
  const loadDocument = async () => {
    try {
      setLoading(true);
      setError(null);

      const [doc, status] = await Promise.all([
        documentService.getDocument(documentId),
        documentService.getProcessingStatus(documentId),
      ]);

      setDocument(doc);
      setProcessingStatus(status);
      setEditableData(doc.extractedData || {});
    } catch (err: any) {
      console.error('Error loading document:', err);
      setError(err.message || 'Erro ao carregar documento');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check processing status
   */
  const checkProcessingStatus = async () => {
    try {
      const status = await documentService.getProcessingStatus(documentId);
      setProcessingStatus(status);

      if (status.status !== 'PROCESSING') {
        setProcessing(false);
        
        if (status.status === 'COMPLETED' || status.status === 'REVIEW_REQUIRED') {
          // Reload document to get extracted data
          const doc = await documentService.getDocument(documentId);
          setDocument(doc);
          setEditableData(doc.extractedData || {});
        }
      }
    } catch (err) {
      console.error('Error checking status:', err);
    }
  };

  /**
   * Start processing
   */
  const handleProcess = async () => {
    try {
      setProcessing(true);
      setError(null);

      await documentService.processDocument(documentId);
      
      // Start polling
      setProcessingStatus({ status: 'PROCESSING' });
    } catch (err: any) {
      console.error('Error starting processing:', err);
      setError(err.message || 'Erro ao iniciar processamento');
      setProcessing(false);
    }
  };

  /**
   * Update extracted data field
   */
  const handleUpdateField = (key: string, value: string) => {
    setEditableData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  /**
   * Save updated data
   */
  const handleSaveData = async () => {
    try {
      await documentService.updateExtractedData(documentId, editableData);
      Alert.alert('Sucesso', 'Dados atualizados com sucesso');
    } catch (err: any) {
      Alert.alert('Erro', 'Não foi possível salvar os dados');
    }
  };

  /**
   * Confirm extracted data
   */
  const handleConfirm = async () => {
    try {
      await documentService.confirmExtractedData(documentId);
      Alert.alert('Sucesso', 'Documento confirmado!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Erro', 'Não foi possível confirmar o documento');
    }
  };

  /**
   * Reprocess document
   */
  const handleReprocess = async () => {
    try {
      await documentService.reprocessDocument(documentId);
      setProcessing(true);
      setProcessingStatus({ status: 'PROCESSING' });
    } catch (err: any) {
      Alert.alert('Erro', 'Não foi possível reprocessar o documento');
    }
  };

  /**
   * Get status icon
   */
  const getStatusIcon = () => {
    switch (processingStatus?.status) {
      case 'PROCESSING':
        return <ActivityIndicator size="large" color={colors.primary.DEFAULT} />;
      case 'COMPLETED':
        return <Ionicons name="checkmark-circle" size={64} color={colors.status.active.dot} />;
      case 'REVIEW_REQUIRED':
        return <Ionicons name="warning" size={64} color={colors.status.expiring.dot} />;
      case 'FAILED':
        return <Ionicons name="close-circle" size={64} color={colors.status.expired.dot} />;
      default:
        return <Ionicons name="document-text" size={64} color={colors.zinc[400]} />;
    }
  };

  /**
   * Get status message
   */
  const getStatusMessage = () => {
    switch (processingStatus?.status) {
      case 'PROCESSING':
        return 'Analisando documento...';
      case 'COMPLETED':
        return 'Documento identificado com sucesso!';
      case 'REVIEW_REQUIRED':
        return 'Revise as informações extraídas';
      case 'FAILED':
        return processingStatus.error || 'Falha no processamento';
      default:
        return 'Pronto para processar';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
          <Text style={styles.loadingText}>Carregando...</Text>
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
          <Text style={styles.headerTitle}>Processamento</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusIconContainer}>
            {getStatusIcon()}
          </View>
          <Text style={styles.statusMessage}>{getStatusMessage()}</Text>
          
          {processingStatus?.processingTime && (
            <Text style={styles.processingTime}>
              Tempo: {(processingStatus.processingTime / 1000).toFixed(1)}s
            </Text>
          )}
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={colors.status.expired.text} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Actions based on status */}
        {processingStatus?.status === 'PENDING' && (
          <View style={styles.actions}>
            <Button
              title="Iniciar processamento"
              onPress={handleProcess}
              leftIcon="scan-outline"
              fullWidth
            />
          </View>
        )}

        {processingStatus?.status === 'PROCESSING' && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="small" color={colors.primary.DEFAULT} />
            <Text style={styles.processingText}>Processando...</Text>
          </View>
        )}

        {(processingStatus?.status === 'COMPLETED' || processingStatus?.status === 'REVIEW_REQUIRED') && (
          <>
            {/* Extracted Data */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Dados Extraídos</Text>
                {processingStatus?.status === 'REVIEW_REQUIRED' && (
                  <View style={styles.reviewBadge}>
                    <Ionicons name="warning" size={14} color={colors.status.expiring.text} />
                    <Text style={styles.reviewBadgeText}>Revisar</Text>
                  </View>
                )}
              </View>

              {/* Document Type */}
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Tipo de documento</Text>
                <Text style={styles.dataValue}>
                  {editableData.documentType || 'Não identificado'}
                </Text>
              </View>

              {/* Person Info */}
              {editableData.person && (
                <>
                  <Text style={styles.subsectionTitle}>Pessoa</Text>
                  
                  <Input
                    label="Nome"
                    value={editableData.person.name || ''}
                    onChangeText={(v) => handleUpdateField('person', { ...editableData.person, name: v })}
                    leftIcon="person-outline"
                  />

                  <Input
                    label="CPF"
                    value={editableData.person.cpf || ''}
                    onChangeText={(v) => handleUpdateField('person', { ...editableData.person, cpf: v })}
                    leftIcon="card-outline"
                  />

                  <Input
                    label="RG"
                    value={editableData.person.rg || ''}
                    onChangeText={(v) => handleUpdateField('person', { ...editableData.person, rg: v })}
                    leftIcon="card-outline"
                  />
                </>
              )}

              {/* Document Info */}
              <Text style={styles.subsectionTitle}>Informações do Documento</Text>

              <Input
                label="Número do documento"
                value={editableData.documentNumber || ''}
                onChangeText={(v) => handleUpdateField('documentNumber', v)}
                leftIcon="pricetag-outline"
              />

              <Input
                label="Data de emissão"
                value={editableData.issueDate || ''}
                onChangeText={(v) => handleUpdateField('issueDate', v)}
                leftIcon="calendar-outline"
              />

              <Input
                label="Data de validade"
                value={editableData.expirationDate || ''}
                onChangeText={(v) => handleUpdateField('expirationDate', v)}
                leftIcon="calendar-outline"
              />

              <Input
                label="Órgão emissor"
                value={editableData.issuer || ''}
                onChangeText={(v) => handleUpdateField('issuer', v)}
                leftIcon="business-outline"
              />

              {/* Confidence */}
              {editableData.confidence && (
                <View style={styles.confidenceContainer}>
                  <Text style={styles.confidenceLabel}>Confiança da extração:</Text>
                  <View style={styles.confidenceBar}>
                    <View 
                      style={[
                        styles.confidenceFill,
                        { 
                          width: `${Math.round(editableData.confidence * 100)}%`,
                          backgroundColor: editableData.confidence >= 0.8 
                            ? colors.status.active.dot 
                            : colors.status.expiring.dot,
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.confidenceValue}>
                    {Math.round(editableData.confidence * 100)}%
                  </Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              {processingStatus?.status === 'REVIEW_REQUIRED' && (
                <Button
                  title="Salvar alterações"
                  onPress={handleSaveData}
                  variant="outline"
                  leftIcon="save-outline"
                  fullWidth
                />
              )}
              
              <Button
                title="Confirmar documento"
                onPress={handleConfirm}
                leftIcon="checkmark-circle-outline"
                fullWidth
              />

              <Button
                title="Reprocessar"
                onPress={handleReprocess}
                variant="ghost"
                leftIcon="refresh-outline"
                fullWidth
              />
            </View>
          </>
        )}

        {processingStatus?.status === 'FAILED' && (
          <View style={styles.actions}>
            <Button
              title="Tentar novamente"
              onPress={handleReprocess}
              leftIcon="refresh-outline"
              fullWidth
            />
          </View>
        )}
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
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  
  // Status Card
  statusCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    ...shadows.sm,
  },
  statusIconContainer: {
    marginBottom: spacing.md,
  },
  statusMessage: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  processingTime: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
  },
  
  // Processing
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.card,
  },
  processingText: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.md,
    color: colors.primary.DEFAULT,
  },
  
  // Error
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: '#FEE2E2',
    borderRadius: borderRadius.md,
  },
  errorText: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.status.expired.text,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  reviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.status.expiring.bg,
    borderRadius: borderRadius.full,
  },
  reviewBadgeText: {
    marginLeft: 4,
    fontSize: typography.fontSize.xs,
    color: colors.status.expiring.text,
    fontWeight: typography.fontWeight.medium,
  },
  subsectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  dataLabel: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
  },
  dataValue: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  
  // Confidence
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  confidenceLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginRight: spacing.sm,
  },
  confidenceBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.zinc[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 4,
  },
  confidenceValue: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
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
});

export default ProcessingScreen;
