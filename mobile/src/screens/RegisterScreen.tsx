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

export default function RegisterScreen({ navigation }: any) {
  const { register, isSubmitting } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

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
    try {
      await register(email.trim(), password, fullName.trim());
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        'Kayıt oluşturulamadı. Bu e-posta adresi zaten kayıtlı olabilir.';
      Alert.alert('Kayıt başarısız', message);
    }
  };

  return (
    <KeyboardAvoidingView
