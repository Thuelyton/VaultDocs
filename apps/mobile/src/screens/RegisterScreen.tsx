/**
 * Register Screen - Premium SaaS Design
 * Clean, modern registration screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input } from '../components';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import Alert from '../utils/alert';

interface RegisterScreenProps {
  navigation: any;
}

export function RegisterScreen({ navigation }: RegisterScreenProps) {
  const { register } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!name) {
      newErrors.name = 'Nome é obrigatório';
    } else if (name.length < 2) {
      newErrors.name = 'Nome deve ter no mínimo 2 caracteres';
    }
    
    if (!email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (password.length < 6) {
      newErrors.password = 'Senha deve ter no mínimo 6 caracteres';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'As senhas não conferem';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    
    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
      });
    } catch (error: any) {
      Alert.alert(
        'Erro ao criar conta',
        error.message || 'Tente novamente mais tarde.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="person-add" size={32} color={colors.primary.DEFAULT} />
            </View>
            <Text style={styles.title}>Criar Conta</Text>
            <Text style={styles.subtitle}>Preencha seus dados para começar</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Nome completo"
              placeholder="Seu nome"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              leftIcon="person-outline"
              error={errors.name}
              editable={!loading}
            />

            <Input
              label="Email"
              placeholder="seu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              leftIcon="mail-outline"
              error={errors.email}
              editable={!loading}
            />

            <Input
              label="Senha"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              leftIcon="lock-closed-outline"
              rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
              onRightIconPress={() => setShowPassword(!showPassword)}
              error={errors.password}
              hint="Mínimo de 6 caracteres"
              editable={!loading}
            />

            <Input
              label="Confirmar senha"
              placeholder="Digite a senha novamente"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              leftIcon="lock-closed-outline"
              error={errors.confirmPassword}
              editable={!loading}
            />

            <Button
              title="Criar conta"
              onPress={handleRegister}
              loading={loading}
              disabled={loading}
              fullWidth
              style={styles.registerButton}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Já tem uma conta?</Text>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={styles.loginLink}>Fazer login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  
  // Back button
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    alignSelf: 'flex-start',
  },
  
  // Header
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  
  // Form
  form: {
    marginBottom: spacing.xl,
  },
  registerButton: {
    marginTop: spacing.md,
  },
  
  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
  footerText: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
  },
  loginLink: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary.DEFAULT,
    marginLeft: spacing.sm,
  },
});

export default RegisterScreen;
