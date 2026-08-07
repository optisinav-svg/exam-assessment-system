import React, { useEffect, useState } from 'react';
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
import { getMyProfile, updateMyProfile, updateMyPassword } from '../services/api';

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const role = (user?.role === 'student' ? 'student' : 'teacher') as 'teacher' | 'student';

  const [isLoading, setIsLoading] = useState(true);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [savingName, setSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordAgain, setNewPasswordAgain] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const profile = await getMyProfile(role);
        setFullName(profile.fullName);
        setEmail(profile.email);
      } catch (error) {
        // Profil alınamazsa, elimizdeki (giriş sırasında gelen) bilgilerle devam ederiz
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleSaveName = async () => {
    if (!fullName.trim()) {
      Alert.alert('Eksik bilgi', 'Ad soyad boş olamaz.');
      return;
    }
    setSavingName(true);
    try {
      await updateMyProfile(role, { fullName: fullName.trim() });
      Alert.alert('Başarılı', 'Bilgileriniz güncellendi.');
    } catch (error: any) {
      Alert.alert('Hata', error?.response?.data?.message || 'Güncelleme başarısız oldu.');
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !newPasswordAgain) {
      Alert.alert('Eksik bilgi', 'Lütfen tüm şifre alanlarını doldurun.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Geçersiz şifre', 'Yeni şifre en az 6 karakter olmalıdır.');
      return;
    }
    if (newPassword !== newPasswordAgain) {
      Alert.alert('Şifreler uyuşmuyor', 'Yeni şifre alanları birbirinin aynısı olmalı.');
      return;
    }
    setSavingPassword(true);
    try {
      await updateMyPassword(role, { currentPassword, newPassword });
      Alert.alert('Başarılı', 'Şifreniz güncellendi.');
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordAgain('');
    } catch (error: any) {
      Alert.alert('Hata', error?.response?.data?.message || 'Şifre güncellenemedi.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Oturumu kapatmak istediğinize emin misiniz?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: logout },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#4A6CF7" />
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>‹ Geri</Text>
          </TouchableOpacity>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {fullName ? fullName.trim().charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
          <Text style={styles.title}>Profil</Text>
          <Text style={styles.avatarNote}>Profil fotoğrafı yakında eklenecek</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Kişisel Bilgiler</Text>

            <Text style={styles.label}>Ad Soyad</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Ad Soyad"
            />

            <Text style={styles.label}>E-posta</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={email}
              editable={false}
            />
            <Text style={styles.helperText}>E-posta adresi değiştirilemez.</Text>

            <TouchableOpacity
              style={[styles.button, savingName && styles.buttonDisabled]}
              onPress={handleSaveName}
              disabled={savingName}
            >
              {savingName ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Kaydet</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Şifre Değiştir</Text>

            <Text style={styles.label}>Mevcut Şifre</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              placeholder="••••••••"
            />

            <Text style={styles.label}>Yeni Şifre</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholder="••••••••"
            />

            <Text style={styles.label}>Yeni Şifre (Tekrar)</Text>
            <TextInput
              style={styles.input}
              value={newPasswordAgain}
              onChangeText={setNewPasswordAgain}
              secureTextEntry
              placeholder="••••••••"
            />

            <TouchableOpacity
              style={[styles.button, savingPassword && styles.buttonDisabled]}
              onPress={handleChangePassword}
              disabled={savingPassword}
            >
              {savingPassword ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Şifreyi Güncelle</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
          </TouchableOpacity>
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
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
  },
  header: {
    padding: 20,
    paddingTop: 12,
    alignItems: 'center',
    backgroundColor: '#4A6CF7',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarInitial: {
    fontSize: 30,
    fontWeight: '700',
    color: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  avatarNote: {
    fontSize: 12,
    color: '#E0E7FF',
    marginTop: 4,
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
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
  inputDisabled: {
    color: '#999',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#4A6CF7',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  logoutButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
  },
});
