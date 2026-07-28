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

const Stack = createStackNavigator();

// Ana Ekran
function HomeScreen({ navigation }: any) {
  const handleScan = () => {
    navigation.navigate('Scan');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>OptikSınav</Text>
        <Text style={styles.subtitle}>Eğitim Değerlendirme Sistemi</Text>
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
            <Text style={styles.resultScore}>Puan: {result.score}</Text>
            <Text style={styles.resultAnswers}>
              Cevaplar: {result.answers.join(', ')}
            </Text>
          </View>
        )}
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.scanButton} onPress={takePhoto}>
            <Text style={styles.buttonText}>Fotoğraf Çek</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.scanButton} onPress={pickImage}>
            <Text style={styles.buttonText}>Galeriden Seç</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// Örnek Sonuçlar Ekranı
function ResultsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sonuçlar</Text>
      </View>
      <View style={styles.resultsList}>
        <Text style={styles.subtitle}>Henüz sonuç yok</Text>
      </View>
    </SafeAreaView>
  );
}

// Örnek Sınavlar Ekranı
function ExamsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sınavlar</Text>
      </View>
      <View style={styles.resultsList}>
        <Text style={styles.subtitle}>Henüz sınav yok</Text>
      </View>
    </SafeAreaView>
  );
}

// Ana Uygulama
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Scan" component={ScanScreen} />
        <Stack.Screen name="Results" component={ResultsScreen} />
        <Stack.Screen name="Exams" component={ExamsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4FF',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#4A6CF7',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#E0E7FF',
    marginTop: 4,
  },
  menu: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 20,
    gap: 16,
  },
  menuItem: {
    width: 100,
    height: 100,
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  scanContainer: {
    flex: 1,
    padding: 20,
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#4A6CF7',
    marginTop: 12,
  },
  resultContainer: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  resultScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  resultAnswers: {
    fontSize: 14,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  scanButton: {
    backgroundColor: '#4A6CF7',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginVertical: 8,
    flex: 1,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
