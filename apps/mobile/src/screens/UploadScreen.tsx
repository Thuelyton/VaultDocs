/**
 * UploadScreen - Premium SaaS Design
 * Smart upload flow with camera and AI analysis
 */

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/theme';
import { Button } from '../components';

type UploadState = 'idle' | 'capturing' | 'analyzing' | 'complete';

export function UploadScreen() {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [extractedData, setExtractedData] = useState<any>(null);

  const handleCapture = async () => {
    setUploadState('capturing');
    
    // Simulate camera capture
    setTimeout(() => {
      setUploadState('analyzing');
      
      // Simulate AI analysis
      setTimeout(() => {
        setExtractedData({
          type: 'CNH',
          name: 'João Silva',
          cpf: '123.456.789-00',
          expiryDate: '2025-06-15',
          registry: 'SP-123456789',
        });
        setUploadState('complete');
      }, 2500);
    }, 1000);
  };

  const handleReset = () => {
    setUploadState('idle');
    setExtractedData(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Novo Documento</Text>
        <Text style={styles.subtitle}>Escanear ou selecionar arquivo</Text>
      </View>

      {uploadState === 'idle' && (
        <View style={styles.content}>
          {/* Camera Capture */}
          <TouchableOpacity 
            style={styles.captureButton}
            onPress={handleCapture}
            activeOpacity={0.8}
          >
            <View style={styles.captureIconContainer}>
              <Ionicons name="camera" size={48} color={colors.white} />
            </View>
            <Text style={styles.captureTitle}>Tirar foto</Text>
            <Text style={styles.captureSubtitle}>
              Capture o documento com a câmera
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Other options */}
          <View style={styles.optionsContainer}>
            <OptionButton
              icon="images-outline"
              title="Galeria"
              subtitle="Selecionar foto existente"
              onPress={() => console.log('Gallery')}
            />
            <OptionButton
              icon="document-outline"
              title="Arquivo"
              subtitle="PDF ou outro documento"
              onPress={() => console.log('File')}
            />
          </View>
        </View>
      )}

      {uploadState === 'capturing' && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
          <Text style={styles.loadingText}>Capturando documento...</Text>
        </View>
      )}

      {uploadState === 'analyzing' && (
        <View style={styles.loadingContainer}>
          <View style={styles.aiIndicator}>
            <Ionicons name="sparkles" size={32} color={colors.primary.DEFAULT} />
          </View>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} style={styles.spinner} />
          <Text style={styles.loadingTitle}>Analisando documento com IA...</Text>
          <Text style={styles.loadingSubtitle}>
            Identificando tipo e extraindo dados
          </Text>
        </View>
      )}

      {uploadState === 'complete' && extractedData && (
        <View style={styles.completeContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={56} color={colors.status.active.dot} />
          </View>
          
          <Text style={styles.successTitle}>Documento analisado!</Text>
          
          {/* Extracted Data Card */}
          <View style={styles.extractedCard}>
            <View style={styles.extractedHeader}>
              <Ionicons name="document-text" size={20} color={colors.primary.DEFAULT} />
              <Text style={styles.extractedType}>{extractedData.type}</Text>
            </View>
            
            <DataField label="Nome" value={extractedData.name} />
            <DataField label="CPF" value={extractedData.cpf} />
            <DataField label="Validade" value={extractedData.expiryDate} />
            <DataField label="Registro" value={extractedData.registry} />
          </View>

          <View style={styles.actions}>
            <Button
              title="Confirmar e salvar"
              onPress={() => console.log('Save')}
              fullWidth
              style={styles.saveButton}
            />
            <Button
              title="Editar dados"
              onPress={() => console.log('Edit')}
              variant="outline"
              fullWidth
            />
            <TouchableOpacity onPress={handleReset}>
              <Text style={styles.resetLink}>Escanear novamente</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// Option Button Component
function OptionButton({ 
  icon, 
  title, 
  subtitle, 
  onPress 
}: { 
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.optionButton} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.optionIcon}>
        <Ionicons name={icon} size={24} color={colors.text.primary} />
      </View>
      <View style={styles.optionContent}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.zinc[300]} />
    </TouchableOpacity>
  );
}

// Data Field Component
function DataField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.dataField}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={styles.dataValue}>{value}</Text>
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
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  
  // Capture Button
  captureButton: {
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
    ...shadows.lg,
  },
  captureIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  captureTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  captureSubtitle: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  
  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.default,
  },
  dividerText: {
    paddingHorizontal: spacing.md,
    color: colors.text.tertiary,
    fontSize: typography.fontSize.sm,
  },
  
  // Options
  optionsContainer: {
    gap: spacing.sm,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    ...shadows.sm,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.zinc[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  optionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  loadingText: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    marginTop: spacing.lg,
  },
  aiIndicator: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  spinner: {
    marginBottom: spacing.lg,
  },
  loadingTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  loadingSubtitle: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  
  // Complete
  completeContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  successIcon: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  successTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  extractedCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  extractedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  extractedType: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary.DEFAULT,
    marginLeft: spacing.sm,
  },
  dataField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
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
  actions: {
    gap: spacing.md,
  },
  saveButton: {
    marginBottom: spacing.sm,
  },
  resetLink: {
    fontSize: typography.fontSize.md,
    color: colors.primary.DEFAULT,
    textAlign: 'center',
    fontWeight: typography.fontWeight.medium,
  },
});

export default UploadScreen;
