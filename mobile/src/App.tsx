import React, { useState } from 'react';
import { 
  SafeAreaView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import { ErrorBoundary } from './ErrorBoundary';

const Stack = createStackNavigator();
const AuthStack = createStackNavigator();

// Ana Ekran
function HomeScreen({ navigation }: any) {
  const { user, logout } = useAuth();

  const handleScan = () => {
    navigation.navigate('Scan');
  };

  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Oturumu kapatmak istediğinize emin misiniz?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Çıkış</Text>
        </TouchableOpacity>
        <Text style={styles.title}>OptikSınav</Text>
        <Text style={styles.subtitle}>
          {user?.fullName ? `Hoş geldin, ${user.fullName}` : 'Eğitim Değerlendirme Sistemi'}
        </Text>
      </View>
      
      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem} onPress={handleScan}>
          <Text style={styles.menuIcon}>📸</Text>
          <Text style={styles.menuText}>Optik Oku</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Results')}>
          <Text style={styles.menuIcon}>📊</Text>
          <Text style={styles.menuText}>Sonuçlar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Exams')}>
          <Text style={styles.menuIcon}>📝</Text>
          <Text style={styles.menuText}>Sınavlar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Optik Okuma Ekranı
function ScanScreen({ navigation }: any) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const takePhoto = async () => {
    const response = await launchCamera({ 
      mediaType: 'photo',
      quality: 0.8,
    });
    
    if (response.assets && response.assets.length > 0 && response.assets[0].uri) {
      setImageUri(response.assets[0].uri);
      processImage(response.assets[0].uri);
    }
  };

  const pickImage = async () => {
    const response = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
    });
    
    if (response.assets && response.assets.length > 0 && response.assets[0].uri) {
      setImageUri(response.assets[0].uri);
      processImage(response.assets[0].uri);
    }
  };

  const processImage = async (uri: string) => {
    setLoading(true);
    try {
      // OCR işlemi - backend servisine gönderebilirsiniz
      setResult({
        text: 'OCR işlemi tamamlandı',
        answers: ['A', 'B', 'C', 'D'],
        score: 75,
      });
    } catch (error: any) {
      Alert.alert('Hata', 'Optik okuma başarısız: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.scanContainer}>
        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        )}
        
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A6CF7" />
            <Text style={styles.loadingText}>Okunuyor...</Text>
          </View>
        )}
        
        {result && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Sonuç</Text>
