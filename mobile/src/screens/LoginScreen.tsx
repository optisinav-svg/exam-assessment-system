import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import {
  UserRole,
  getRememberedCredentials,
  saveRememberedCredentials,
  clearRememberedCredentials,
} from '../services/api';

export default function LoginScreen({ navigation }: any) {
  const { login, isSubmitting } = useAuth();
  const [role, setRole] = useState<UserRole>('teacher');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const saved = await getRememberedCredentials();
        if (saved) {
          setEmail(saved.email);
          setPassword(saved.password);
          setRole(saved.role);
          setRememberMe(true);
        }
      } catch (error) {
        console.warn('Kayıtlı giriş bilgileri okunamadı:', error);
      }
    })();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Eksik bilgi', 'Lütfen e-posta ve şifrenizi girin.');
      return;
    }
    try {
      await login(email.trim(), password, role);
      if (rememberMe) {
        await saveRememberedCredentials({ email: email.trim(), password, role });
      } else {
        await clearRememberedCredentials();
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        'Giriş yapılamadı. E-posta veya şifreniz hatalı olabilir.';
      Alert.alert('Giriş başarısız', message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>📝</Text>
          <Text style={styles.title}>OptikSınav</Text>
          <Text style={styles.subtitle}>Giriş Yap</Text>
        </View>

        <View style={styles.roleSwitch}>
          <TouchableOpacity
            style={[styles.roleButton, role === 'teacher' && styles.roleButtonActive]}
            onPress={() => setRole('teacher')}
            disabled={isSubmitting}
          >
            <Text style={[styles.roleButtonText, role === 'teacher' && styles.roleButtonTextActive]}>
              Öğretmen
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleButton, role === 'student' && styles.roleButtonActive]}
            onPress={() => setRole('student')}
            disabled={isSubmitting}
          >
            <Text style={[styles.roleButtonText, role === 'student' && styles.roleButtonTextActive]}>
              Öğrenci
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>E-posta</Text>
          <TextInput
            style={styles.input}
            placeholder="ornek@okul.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!isSubmitting}
          />

          <Text style={styles.label}>Şifre</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!isSubmitting}
          />

          <TouchableOpacity
            style={styles.rememberRow}
            onPress={() => setRememberMe(!rememberMe)}
            disabled={isSubmitting}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              {rememberMe && <Text style={styles.checkboxTick}>✓</Text>}
            </View>
            <Text style={styles.rememberText}>Beni hatırla</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Giriş Yap</Text>
            )}
          </TouchableOpacity>

          {role === 'teacher' ? (
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.navigate('Register')}
              disabled={isSubmitting}
            >
              <Text style={styles.linkText}>
                Hesabın yok mu? <Text style={styles.linkTextBold}>Öğretmen Kaydı</Text>
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.navigate('StudentRegister')}
              disabled={isSubmitting}
            >
              <Text style={styles.linkText}>
                Hesabın yok mu? <Text style={styles.linkTextBold}>Öğrenci Kaydı</Text>
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A6CF7',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  roleSwitch: {
    flexDirection: 'row',
    backgroundColor: '#E0E7FF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: '#4A6CF7',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A6CF7',
  },
  roleButtonTextActive: {
    color: '#fff',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#C7D2FE',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4A6CF7',
    borderColor: '#4A6CF7',
  },
  checkboxTick: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  rememberText: {
    fontSize: 14,
    color: '#444',
  },
  button: {
    backgroundColor: '#4A6CF7',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#666',
    fontSize: 14,
  },
  linkTextBold: {
    color: '#4A6CF7',
    fontWeight: '700',
  },
});
