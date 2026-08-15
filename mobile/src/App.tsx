import React, { useCallback, useState } from 'react';
import { 
  SafeAreaView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { NavigationContainer, useFocusEffect, DefaultTheme as NavigationDefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import StudentRegisterScreen from './screens/StudentRegisterScreen';
import PendingStudentsScreen from './screens/PendingStudentsScreen';
import CreateExamScreen from './screens/CreateExamScreen';
import ProfileScreen from './screens/ProfileScreen';
import OpticalTemplateScreen from './screens/OpticalTemplateScreen';
import SubscriptionScreen from './screens/SubscriptionScreen';
import PuanHesaplamaScreen from './screens/PuanHesaplamaScreen';
import KazanimYonetimiScreen from './screens/KazanimYonetimiScreen';
import DashboardScreen from './screens/DashboardScreen';
import KurumPaneliScreen from './screens/KurumPaneliScreen';
import PuanKatsayilariScreen from './screens/PuanKatsayilariScreen';
import DosyalarimScreen from './screens/DosyalarimScreen';
import FiyatlandirmaScreen from './screens/FiyatlandirmaScreen';
import { getExams, Exam } from './services/api';
import { ErrorBoundary } from './ErrorBoundary';

const Stack = createStackNavigator();
const AuthStack = createStackNavigator();

// Ana Ekran
function HomeScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const isTeacher = user?.role === 'teacher';

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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Çıkış</Text>
        </TouchableOpacity>
        <Text style={styles.title}>OptikSınav</Text>
        <Text style={styles.subtitle}>
          {user?.fullName ? `Hoş geldin, ${user.fullName}` : 'Eğitim Değerlendirme Sistemi'}
        </Text>
      </View>

      {isTeacher ? (
        <View style={styles.menu}>
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card }]} onPress={handleScan}>
            <Text style={styles.menuIcon}>📸</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>Optik Oku</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('Results')}
          >
            <Text style={styles.menuIcon}>📊</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>Sonuçlar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('Exams')}
          >
            <Text style={styles.menuIcon}>📝</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>Sınavlar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('PendingStudents')}
          >
            <Text style={styles.menuIcon}>🎓</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>Bekleyen{'\n'}Öğrenciler</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('OpticalTemplate')}
          >
            <Text style={styles.menuIcon}>🖨️</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>Optik{'\n'}Şablonlar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.menuIcon}>👤</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>Profil</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('Subscription')}
          >
            <Text style={styles.menuIcon}>💎</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>Abonelik</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card }]} onPress={() => navigation.navigate('PuanHesaplama')}>
            <Text style={styles.menuIcon}>🧮</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>Puan{ '\\n' }Hesaplama</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card }]} onPress={() => navigation.navigate('KazanimYonetimi')}>
            <Text style={styles.menuIcon}>🎯</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>Kazanım{ '\\n' }Yönetimi</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card }]} onPress={() => navigation.navigate('Dashboard')}>
            <Text style={styles.menuIcon}>📊</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>Genel{ '\\n' }Bakış</Text>
          </TouchableOpacity>
          {user?.accountType === 'kurum' && (
            <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card }]} onPress={() => navigation.navigate('KurumPaneli')}>
              <Text style={styles.menuIcon}>🏫</Text>
              <Text style={[styles.menuText, { color: colors.text }]}>Kurum{ '\\n' }Paneli</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card }]} onPress={() => navigation.navigate('PuanKatsayilari')}>
            <Text style={styles.menuIcon}>📐</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>Puan{ '\\n' }Katsayıları</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card }]} onPress={() => navigation.navigate('Dosyalarim')}>
            <Text style={styles.menuIcon}>🗂️</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>Dosyalarım</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card }]} onPress={() => navigation.navigate('Fiyatlandirma')}>
            <Text style={styles.menuIcon}>💳</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>Fiyatlandırma</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.centerMessage}>
          <Text style={styles.centerMessageIcon}>🎓</Text>
          <Text style={[styles.centerMessageText, { color: colors.textSecondary }]}>
            Öğrenci paneli yakında burada olacak.{'\n'}
            Sonuçlarını ve kazanımlarını yakında buradan görebileceksin.
          </Text>
          <TouchableOpacity
            style={styles.profileLinkButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.profileLinkButtonText}>👤 Profilim</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// Optik Okuma Ekranı (v1: gerçek okuma özelliği geliştirme aşamasında)
function ScanScreen() {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.scanContainer}>
        <View style={styles.centerMessage}>
          <Text style={styles.centerMessageIcon}>🚧</Text>
          <Text style={[styles.centerMessageText, { color: colors.textSecondary }]}>
            Optik okuma özelliği geliştirme aşamasındadır.{'\n'}
            Yakında burada olacak.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

// Örnek Sonuçlar Ekranı
function ResultsScreen() {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.title}>Sonuçlar</Text>
      </View>
      <View style={styles.resultsList}>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Henüz sonuç yok</Text>
      </View>
    </SafeAreaView>
  );
}

// Sınavlar Ekranı
function ExamsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadExams = useCallback(async () => {
    try {
      const data = await getExams();
      setExams(data);
    } catch (error) {
      // Hata durumunda liste boş kalır, tekrar odaklanınca yeniden denenir
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      loadExams();
    }, [loadExams])
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.title}>Sınavlar</Text>
        <TouchableOpacity
          style={styles.newExamButton}
          onPress={() => navigation.navigate('CreateExam')}
        >
          <Text style={styles.newExamButtonText}>+ Yeni Sınav</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.resultsList}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : exams.length === 0 ? (
        <View style={styles.resultsList}>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Henüz sınav yok</Text>
        </View>
      ) : (
        <FlatList
          data={exams}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.examList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.examCard, { backgroundColor: colors.card }]}
              onPress={() => navigation.navigate('CreateExam', { examId: item.id })}
            >
              <Text style={[styles.examCardTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.examCardDetail, { color: colors.textSecondary }]}>
                {item.examDate?.slice(0, 10)} · {item.totalQuestions} soru · {item.optionCount} seçenekli
                {(item as any).examType ? ` · ${(item as any).examType}` : ''}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

// Giriş yapılmamışken gösterilen ekranlar
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="StudentRegister" component={StudentRegisterScreen} />
    </AuthStack.Navigator>
  );
}

// Giriş yapıldıktan sonra gösterilen ekranlar
function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Scan" component={ScanScreen} />
      <Stack.Screen name="Results" component={ResultsScreen} />
      <Stack.Screen name="Exams" component={ExamsScreen} />
      <Stack.Screen name="CreateExam" component={CreateExamScreen} />
      <Stack.Screen name="PendingStudents" component={PendingStudentsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="OpticalTemplate" component={OpticalTemplateScreen} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
      <Stack.Screen name="PuanHesaplama" component={PuanHesaplamaScreen} />
      <Stack.Screen name="KazanimYonetimi" component={KazanimYonetimiScreen} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="KurumPaneli" component={KurumPaneliScreen} />
      <Stack.Screen name="PuanKatsayilari" component={PuanKatsayilariScreen} />
      <Stack.Screen name="Dosyalarim" component={DosyalarimScreen} />
      <Stack.Screen name="Fiyatlandirma" component={FiyatlandirmaScreen} />
    </Stack.Navigator>
  );
}

// Oturum durumuna göre doğru ekran grubunu seçer
function RootNavigator() {
  const { user, isLoading } = useAuth();
  const { colors, mode } = useTheme();

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.loadingScreen, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <NavigationContainer theme={mode === 'dark' ? NavigationDarkTheme : NavigationDefaultTheme}>
      {user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

// Ana Uygulama
export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
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
  newExamButton: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  newExamButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  examList: {
    padding: 16,
  },
  examCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  examCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
  },
  examCardDetail: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  logoutButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 1,
  },
  logoutText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
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
    textAlign: 'center',
  },
  centerMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  centerMessageIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  centerMessageText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  profileLinkButton: {
    marginTop: 24,
    backgroundColor: '#4A6CF7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  profileLinkButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
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
