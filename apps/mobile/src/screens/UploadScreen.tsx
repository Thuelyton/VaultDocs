/**
 * UploadScreen - Real Upload Flow
 * Camera, Gallery, and Document selection
 */

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/theme';
import { Button, Input } from '../components';
import { uploadService } from '../services/uploadService';
import { documentService, DocumentCategory } from '../services/documentService';
import { useNavigation } from '@react-navigation/native';
import { MainTabNavigationProp } from '../navigation/types';

type UploadState = 'idle' | 'selected' | 'uploading' | 'success' | 'error';

interface SelectedFile {
  uri: string;
  name: string;
  type: string;
  size: number;
}

export function UploadScreen() {
  const navigation = useNavigation<MainTabNavigationProp>();
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('outros');
  const [expirationDate, setExpirationDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const categories: { value: DocumentCategory; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { value: 'cnh', label: 'CNH', icon: 'car-outline' },
    { value: 'rg', label: 'RG', icon: 'card-outline' },
    { value: 'boleto', label: 'Boleto', icon: 'receipt-outline' },
    { value: 'contrato', label: 'Contrato', icon: 'document-text-outline' },
    { value: 'garantia', label: 'Garantia', icon: 'shield-checkmark-outline' },
    { value: 'outros', label: 'Outros', icon: 'folder-outline' },
  ];

  /**
   * Pick image from camera
   */
  const pickFromCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera para fotos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          name: asset.fileName || `photo_${Date.now()}.jpg`,
          type: asset.mimeType || 'image/jpeg',
          size: asset.fileSize || 0,
        });
        setUploadState('selected');
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      Alert.alert('Erro', 'Não foi possível acessar a câmera.');
    }
  };

  /**
   * Pick image from gallery
   */
  const pickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          type: asset.mimeType || 'image/jpeg',
          size: asset.fileSize || 0,
        });
        setUploadState('selected');
      }
    } catch (err: any) {
      console.error('Gallery error:', err);
      Alert.alert('Erro', 'Não foi possível acessar a galeria.');
    }
  };

  /**
   * Pick document file
   */
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/octet-stream',
          size: asset.size || 0,
        });
        setUploadState('selected');
      }
    } catch (err: any) {
      console.error('Document picker error:', err);
      Alert.alert('Erro', 'Não foi possível selecionar o arquivo.');
    }
  };

  /**
   * Validate form
   */
  const validate = (): boolean => {
    if (!selectedFile) {
      Alert.alert('Erro', 'Selecione um arquivo primeiro.');
      return false;
    }
    if (!title.trim()) {
      Alert.alert('Erro', 'Informe um título para o documento.');
      return false;
    }
    if (!expirationDate.trim()) {
      Alert.alert('Erro', 'Informe a data de vencimento.');
      return false;
    }
    // Validate date format (DD/MM/YYYY)
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(expirationDate)) {
      Alert.alert('Erro', 'Formato de data inválido. Use DD/MM/AAAA.');
      return false;
    }
    return true;
  };

  /**
   * Upload file to API
   */
  const handleUpload = async () => {
    if (!validate()) return;

    setUploadState('uploading');
    setError(null);

    try {
      // Convert date from DD/MM/YYYY to ISO format
      const [day, month, year] = expirationDate.split('/');
      const isoDate = `${year}-${month}-${day}T00:00:00.000Z`;

      // Upload and create document
      const response = await uploadService.uploadAndCreateDocument(
        selectedFile!.uri,
        title.trim(),
        category,
        isoDate
      );

      // Navigate to Processing screen with document ID
      const documentId = response.document._id;
      navigation.navigate('Processing', { documentId });
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Erro ao fazer upload do arquivo.');
      setUploadState('error');
    }
  };

  /**
   * Reset form
   */
  const resetForm = () => {
    setSelectedFile(null);
    setTitle('');
    setCategory('outros');
    setExpirationDate('');
    setError(null);
    setUploadState('idle');
  };

  /**
   * Cancel selection
   */
  const handleCancel = () => {
    setSelectedFile(null);
    setUploadState('idle');
  };

  /**
   * Format file size
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * Check if file is image
   */
  const isImage = (type: string): boolean => {
    return type.startsWith('image/');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Novo Documento</Text>
          <Text style={styles.subtitle}>Adicione um documento ao seu cofre</Text>
        </View>

        {/* Success State */}
        {uploadState === 'success' && (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={80} color={colors.status.active.dot} />
            <Text style={styles.successTitle}>Documento salvo!</Text>
            <Text style={styles.successSubtitle}>Seu documento foi adicionado com sucesso.</Text>
          </View>
        )}

        {/* Idle State - Source Selection */}
        {uploadState === 'idle' && (
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Escolha a origem</Text>
            
            <TouchableOpacity 
              style={styles.sourceButton}
              onPress={pickFromCamera}
              activeOpacity={0.7}
            >
              <View style={[styles.sourceIcon, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="camera" size={28} color={colors.primary.DEFAULT} />
              </View>
              <View style={styles.sourceContent}>
                <Text style={styles.sourceTitle}>Tirar foto</Text>
                <Text style={styles.sourceSubtitle}>Capture o documento com a câmera</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.zinc[300]} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.sourceButton}
              onPress={pickFromGallery}
              activeOpacity={0.7}
            >
              <View style={[styles.sourceIcon, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="images" size={28} color="#10B981" />
              </View>
              <View style={styles.sourceContent}>
                <Text style={styles.sourceTitle}>Galeria</Text>
                <Text style={styles.sourceSubtitle}>Selecionar foto existente</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.zinc[300]} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.sourceButton}
              onPress={pickDocument}
              activeOpacity={0.7}
            >
              <View style={[styles.sourceIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="document" size={28} color="#F59E0B" />
              </View>
              <View style={styles.sourceContent}>
                <Text style={styles.sourceTitle}>Arquivo</Text>
                <Text style={styles.sourceSubtitle}>PDF ou outro documento</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.zinc[300]} />
            </TouchableOpacity>
          </View>
        )}

        {/* Selected State - Preview and Form */}
        {(uploadState === 'selected' || uploadState === 'uploading' || uploadState === 'error') && selectedFile && (
          <View style={styles.content}>
            {/* Preview */}
            <View style={styles.previewContainer}>
              {isImage(selectedFile.type) ? (
                <Image source={{ uri: selectedFile.uri }} style={styles.previewImage} />
              ) : (
                <View style={styles.previewDocument}>
                  <Ionicons name="document-text" size={48} color={colors.primary.DEFAULT} />
                  <Text style={styles.previewFileName} numberOfLines={1}>
                    {selectedFile.name}
                  </Text>
                </View>
              )}
              
              <TouchableOpacity 
                style={styles.changeFileButton}
                onPress={handleCancel}
              >
                <Ionicons name="close-circle" size={24} color={colors.white} />
              </TouchableOpacity>
            </View>

            {/* File Info */}
            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={1}>{selectedFile.name}</Text>
              <Text style={styles.fileSize}>{formatFileSize(selectedFile.size)}</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <Input
                label="Título do documento"
                placeholder="Ex: CNH, Contrato de Aluguel..."
                value={title}
                onChangeText={setTitle}
                leftIcon="document-text-outline"
                editable={uploadState !== 'uploading'}
              />

              <Text style={styles.label}>Categoria</Text>
              <View style={styles.categoriesContainer}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.categoryChip,
                      category === cat.value && styles.categoryChipActive
                    ]}
                    onPress={() => setCategory(cat.value)}
                    disabled={uploadState === 'uploading'}
                  >
                    <Ionicons 
                      name={cat.icon} 
                      size={16} 
                      color={category === cat.value ? colors.white : colors.text.secondary} 
                    />
                    <Text style={[
                      styles.categoryChipText,
                      category === cat.value && styles.categoryChipTextActive
                    ]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Input
                label="Data de vencimento"
                placeholder="DD/MM/AAAA"
                value={expirationDate}
                onChangeText={setExpirationDate}
                leftIcon="calendar-outline"
                keyboardType="numeric"
                maxLength={10}
                editable={uploadState !== 'uploading'}
              />
            </View>

            {/* Error */}
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color={colors.status.expired.text} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              <Button
                title={uploadState === 'uploading' ? 'Enviando...' : 'Enviar documento'}
                onPress={handleUpload}
                loading={uploadState === 'uploading'}
                disabled={uploadState === 'uploading'}
                fullWidth
                leftIcon={uploadState === 'uploading' ? undefined : 'cloud-upload-outline'}
              />
              
              <Button
                title="Cancelar"
                onPress={resetForm}
                variant="ghost"
                fullWidth
                disabled={uploadState === 'uploading'}
              />
            </View>
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
    paddingHorizontal: spacing.lg,
  },
  
  // Section Title
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  
  // Source Buttons
  sourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  sourceIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  sourceContent: {
    flex: 1,
  },
  sourceTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  sourceSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  
  // Preview
  previewContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.card,
    backgroundColor: colors.zinc[100],
  },
  previewDocument: {
    width: '100%',
    height: 150,
    borderRadius: borderRadius.card,
    backgroundColor: colors.zinc[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewFileName: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    textAlign: 'center',
  },
  changeFileButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // File Info
  fileInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  fileName: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  fileSize: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginLeft: spacing.sm,
  },
  
  // Form
  form: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.zinc[100],
    gap: spacing.xs,
  },
  categoryChipActive: {
    backgroundColor: colors.primary.DEFAULT,
  },
  categoryChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  categoryChipTextActive: {
    color: colors.white,
    fontWeight: typography.fontWeight.medium,
  },
  
  // Error
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: '#FEE2E2',
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.status.expired.text,
    marginLeft: spacing.sm,
  },
  
  // Actions
  actions: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  
  // Success
  successContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  successTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginTop: spacing.lg,
  },
  successSubtitle: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});

export default UploadScreen;
