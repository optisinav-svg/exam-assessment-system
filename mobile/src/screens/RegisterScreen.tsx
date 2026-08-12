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
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// Ana branşlar — MEB branş eşleştirme kuralına göre bazıları birleşik
// (Matematik seçilince Geometri, Türkçe seçilince Türk Dili ve Edebiyatı
// da aynı ana branşın parçası sayılır, ayrıca seçtirilmez).
const MAIN_BRANCHES = [
  'Türkçe / Türk Dili ve Edebiyatı',
  'Matematik / Geometri',
  'Fen Bilimleri',
  'Sosyal Bilgiler',
  'Tarih',
  'Coğrafya',
  'Felsefe',
  'Fizik',
  'Kimya',
  'Biyoloji',
  'Din Kültürü ve Ahlak Bilgisi',
  'İngilizce',
  'T.C. İnkılap Tarihi ve Atatürkçülük',
  'Hayat Bilgisi',
  'Diğer',
];

const INSTITUTION_LEVELS = ['İlkokul', 'Ortaokul', 'Lise', 'Kurs'];

export default function RegisterScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { register, isSubmitting } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const [accountType, setAccountType] = useState<'teacher' | 'kurum'>('teacher');
  const [mainBranch, setMainBranch] = useState<string | null>(null);
  const [secondaryBranch, setSecondaryBranch] = useState<string | null>(null);
  const [showSecondaryBranch, setShowSecondaryBranch] = useState(false);
  const [institutionLevels, setInstitutionLevels] = useState<string[]>([]);

  const toggleInstitutionLevel = (level: string) => {
    setInstitutionLevels((prev) => {
      const has = prev.includes(level);
      if (has) return prev.filter((l) => l !== level);
      // "Kurs" dışındaki seviyeler tekil seçilir; Kurs varsa çoklu seçime izin ver
      if (prev.includes('Kurs') || level === 'Kurs') {
        return [...prev, level];
      }
      return [level];
    });
  };

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password) {
      Alert.alert('Eksik bilgi', 'Lütfen tüm alanları doldurun.');
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
    if (accountType === 'teacher' && !mainBranch) {
      Alert.alert('Eksik bilgi', 'Lütfen ana branşınızı seçin.');
      return;
    }
    if (accountType === 'teacher' && institutionLevels.length === 0) {
      Alert.alert('Eksik bilgi', 'Lütfen okul kademenizi seçin.');
      return;
    }
    try {
      await register({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        accountType,
        mainBranch: accountType === 'teacher' ? mainBranch! : undefined,
        secondaryBranch: accountType === 'teacher' ? secondaryBranch || undefined : undefined,
        institutionLevels: accountType === 'teacher' ? institutionLevels : undefined,
      });
      Alert.alert(
        'Kayıt başarılı',
        'E-posta adresinize gönderilen bağlantıyla hesabınızı onaylayın, ardından giriş yapabilirsiniz.',
        [{ text: 'Tamam', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error: any) {
      const detail = error?.response?.data?.error;
      const message =
        (error?.response?.data?.message || 'Kayıt oluşturulamadı. Bu e-posta adresi zaten kayıtlı olabilir.') +
        (detail ? `\n\n(Teknik detay: ${detail})` : '');
      Alert.alert('Kayıt başarısız', message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.logo}>📝</Text>
            <Text style={styles.title}>Öğretmen Kaydı</Text>
            <Text style={styles.subtitle}>Yeni bir hesap oluştur</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Hesap Türü</Text>
            <View style={styles.accountTypeRow}>
              <TouchableOpacity
                style={[styles.accountTypeButton, accountType === 'teacher' && styles.accountTypeButtonActive]}
                onPress={() => setAccountType('teacher')}
                disabled={isSubmitting}
              >
                <Text style={[styles.accountTypeText, accountType === 'teacher' && styles.accountTypeTextActive]}>
                  Öğretmen
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.accountTypeButton, accountType === 'kurum' && styles.accountTypeButtonActive]}
                onPress={() => setAccountType('kurum')}
                disabled={isSubmitting}
              >
                <Text style={[styles.accountTypeText, accountType === 'kurum' && styles.accountTypeTextActive]}>
                  Kurum (Okul/Kurs)
                </Text>
              </TouchableOpacity>
            </View>
            {accountType === 'kurum' && (
              <Text style={styles.helperText}>
                Kurum hesapları TYT/AYT/LGS deneme hazırlayabilir ve kendi öğretmen/öğrencilerinin
                trafiğini görebilir.
              </Text>
            )}

            <Text style={styles.label}>Ad Soyad</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
              placeholder="Ayşe Yılmaz"
              value={fullName}
              onChangeText={setFullName}
              editable={!isSubmitting}
            />

            <Text style={styles.label}>E-posta</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
              placeholder="ornek@okul.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isSubmitting}
            />

            <Text style={styles.label}>Şifre</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
              placeholder="En az 6 karakter"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isSubmitting}
            />

            <Text style={styles.label}>Şifre (Tekrar)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
              placeholder="••••••••"
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              secureTextEntry
              editable={!isSubmitting}
            />

            {accountType === 'teacher' && (
              <>
                <Text style={styles.label}>Ana Branş</Text>
                <View style={styles.chipRow}>
                  {MAIN_BRANCHES.map((b) => (
                    <TouchableOpacity
                      key={b}
                      style={[styles.chip, mainBranch === b && styles.chipActive]}
                      onPress={() => setMainBranch(b)}
                      disabled={isSubmitting}
                    >
                      <Text style={[styles.chipText, mainBranch === b && styles.chipTextActive]}>{b}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {!showSecondaryBranch ? (
                  <TouchableOpacity onPress={() => setShowSecondaryBranch(true)} style={{ marginTop: 10 }}>
                    <Text style={styles.linkTextBold}>+ Yan branş ekle (isteğe bağlı)</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <Text style={styles.label}>Yan Branş</Text>
                    <View style={styles.chipRow}>
                      {MAIN_BRANCHES.filter((b) => b !== mainBranch).map((b) => (
                        <TouchableOpacity
                          key={b}
                          style={[styles.chip, secondaryBranch === b && styles.chipActive]}
                          onPress={() => setSecondaryBranch(secondaryBranch === b ? null : b)}
                          disabled={isSubmitting}
                        >
                          <Text style={[styles.chipText, secondaryBranch === b && styles.chipTextActive]}>{b}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                <Text style={styles.label}>Okul Kademesi</Text>
                <Text style={styles.helperText}>
                  "Kurs" seçerseniz birden fazla kademe seçebilirsiniz.
                </Text>
                <View style={styles.chipRow}>
                  {INSTITUTION_LEVELS.map((lvl) => (
                    <TouchableOpacity
                      key={lvl}
                      style={[styles.chip, institutionLevels.includes(lvl) && styles.chipActive]}
                      onPress={() => toggleInstitutionLevel(lvl)}
                      disabled={isSubmitting}
                    >
                      <Text
                        style={[styles.chipText, institutionLevels.includes(lvl) && styles.chipTextActive]}
                      >
                        {lvl}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

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
    marginBottom: 32,
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
    fontSize: 16,
    color: '#666',
    marginTop: 4,
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
  accountTypeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  accountTypeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  accountTypeButtonActive: {
    backgroundColor: '#4A6CF7',
    borderColor: '#4A6CF7',
  },
  accountTypeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
  },
  accountTypeTextActive: {
    color: '#fff',
  },
  helperText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    marginBottom: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  chipActive: {
    backgroundColor: '#4A6CF7',
    borderColor: '#4A6CF7',
  },
  chipText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
  },
});
