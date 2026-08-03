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
  ScrollView,
} from 'react-native';
import { studentRegisterRequest } from '../services/api';

export default function StudentRegisterScreen({ navigation }: any) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [studentNo, setStudentNo] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password || !teacherEmail.trim()) {
      Alert.alert('Eksik bilgi', 'Ad soyad, e-posta, şifre ve öğretmen e-postası zorunludur.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Şifre çok kısa', 'Şifreniz en az 6 karakter olmalı.');
      return;
    }
    if (password !== passwordConfirm) {
      Alert.alert('Şifreler uyuşmuyor', 'Girdiğiniz iki şifre birbirinin aynısı değil.');
      return;
    }

    setIsSubmitting(true);
    try {
      await studentRegisterRequest({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        studentNo: studentNo.trim() || undefined,
        teacherEmail: teacherEmail.trim(),
      });
      Alert.alert(
        'Kayıt isteği alındı',
        'E-posta adresinize gönderilen bağlantıyla e-postanızı onaylayın. Ardından öğretmeninizin onayını bekleyin.',
        [{ text: 'Tamam', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        'Kayıt oluşturulamadı. Bilgilerinizi kontrol edip tekrar deneyin.';
      Alert.alert('Kayıt başarısız', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.logo}>🎓</Text>
            <Text style={styles.title}>Öğrenci Kaydı</Text>
            <Text style={styles.subtitle}>Öğretmeninize bağlanmak için kayıt olun</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Ad Soyad</Text>
            <TextInput
              style={styles.input}
              placeholder="Ali Yılmaz"
              value={fullName}
              onChangeText={setFullName}
              editable={!isSubmitting}
            />

            <Text style={styles.label}>E-posta</Text>
            <TextInput
              style={styles.input}
              placeholder="ornek@mail.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isSubmitting}
            />

            <Text style={styles.label}>Şifre</Text>
            <TextInput
              style={styles.input}
              placeholder="En az 6 karakter"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isSubmitting}
            />

            <Text style={styles.label}>Şifre (Tekrar)</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              secureTextEntry
              editable={!isSubmitting}
            />

            <Text style={styles.label}>Öğrenci Numarası (varsa)</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn. 105"
              value={studentNo}
              onChangeText={setStudentNo}
              editable={!isSubmitting}
            />

            <Text style={styles.label}>Öğretmeninizin E-postası</Text>
            <TextInput
              style={styles.input}
              placeholder="ogretmen@okul.com"
              value={teacherEmail}
              onChangeText={setTeacherEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isSubmitting}
            />
            <Text style={styles.helperText}>
              Sisteme bağlanmak istediğiniz öğretmeninizin kayıtlı e-posta adresini girin.
              Öğretmeniniz isteğinizi onayladıktan sonra giriş yapabileceksiniz.
            </Text>

            <TouchableOpacity
              style={[styles.button, isSubmitting && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Kayıt Ol</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.navigate('Login')}
              disabled={isSubmitting}
            >
              <Text style={styles.linkText}>
                Zaten hesabın var mı? <Text style={styles.linkTextBold}>Giriş yap</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4FF',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
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
    fontSize: 26,
    fontWeight: 'bold',
    color: '#4A6CF7',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
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
  helperText: {
    fontSize: 12,
    color: '#888',
    marginTop: 6,
    lineHeight: 17,
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
