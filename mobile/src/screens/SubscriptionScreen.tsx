import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

const PLANS = [
  { id: 'ogrenci', title: 'Öğrenci Paketi', price: 69, period: 'Ay', desc: 'Sınırsız deneme sınavı analizi, detaylı kazanım takibi ve kişisel gelişim raporları.' },
  { id: 'ogretmen', title: 'Öğretmen Paketi', price: 149, period: 'Ay', desc: 'Sınırsız optik okuma, şablon tanımlama, sınıf yönetimi ve gelişmiş istatistikler.' },
  { id: 'kurum', title: 'Kurum Paketi', price: 19, period: 'Öğrenci/Ay', desc: 'Kurum paneli, toplu öğretmen ve öğrenci yönetimi, detaylı şube karşılaştırmaları.' },
  { id: 'koc', title: 'Eğitim Koçu Paketi', price: 24, period: 'Öğrenci/Ay', desc: 'Birden fazla öğrenciyi takip etme, koçluk raporları ve ödev takip sistemi.' },
];

export default function SubscriptionScreen({ navigation }: any) {
  const { colors, isDark } = useTheme();
  const [currentSub, setCurrentSub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [checkoutHtml, setCheckoutHtml] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const res = await api.get('/subscriptions/me');
      setCurrentSub(res.data.subscription);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan: any) => {
    try {
      setLoading(true);
      const res = await api.post('/subscriptions/checkout', {
        plan: plan.id,
        price: plan.price,
      });

      if (res.data.paymentPageUrl) {
        setCheckoutUrl(res.data.paymentPageUrl);
      } else if (res.data.checkoutHtmlContent) {
        setCheckoutHtml(res.data.checkoutHtmlContent);
      }
    } catch (err: any) {
      Alert.alert('Hata', err.response?.data?.message || 'Ödeme başlatılamadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💎 Abonelik & Paketler</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Mevcut Durum Kartı */}
        <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.statusTitle, { color: colors.text }]}>Mevcut Üyeliğiniz</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#4A6CF7" />
          ) : (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.activePlanText}>
                Paket: <Text style={{ fontWeight: 'bold', color: '#4A6CF7' }}>{currentSub?.plan?.toUpperCase() || 'ÜCRETSİZ / DENEME'}</Text>
              </Text>
              <Text style={[styles.activePlanSub, { color: colors.textSecondary }]}>
                Durum: {currentSub?.status === 'active' ? '✅ Aktif' : '⏳ Deneme Sürümü'}
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Yayın Lansman Fiyatları</Text>

        {PLANS.map((plan) => (
          <View key={plan.id} style={[styles.planCard, { backgroundColor: colors.card }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.planTitle, { color: colors.text }]}>{plan.title}</Text>
              <Text style={[styles.planDesc, { color: colors.textSecondary }]}>{plan.desc}</Text>
              <Text style={styles.planPrice}>
                ₺{plan.price} <Text style={{ fontSize: 13, color: '#6B7280' }}>/ {plan.period}</Text>
              </Text>
            </View>
            <TouchableOpacity style={styles.buyButton} onPress={() => handleSubscribe(plan)}>
              <Text style={styles.buyButtonText}>Abone Ol</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Ödeme Webview Modalı */}
      <Modal visible={!!checkoutUrl || !!checkoutHtml} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={styles.modalHeader}>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>İyzico Güvenli Ödeme</Text>
            <TouchableOpacity onPress={() => { setCheckoutUrl(null); setCheckoutHtml(null); fetchSubscription(); }}>
              <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>Kapat</Text>
            </TouchableOpacity>
          </View>
          {checkoutUrl ? (
            <WebView source={{ uri: checkoutUrl }} style={{ flex: 1 }} />
          ) : checkoutHtml ? (
            <WebView source={{ html: checkoutHtml }} style={{ flex: 1 }} />
          ) : null}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  backButton: { color: '#fff', fontSize: 16, fontWeight: '600' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  content: { padding: 16 },
  statusCard: { borderRadius: 16, padding: 16, marginBottom: 20 },
  statusTitle: { fontSize: 16, fontWeight: 'bold' },
  activePlanText: { fontSize: 15, fontWeight: '500' },
  activePlanSub: { fontSize: 13, marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  planCard: { borderRadius: 16, padding: 16, marginBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planTitle: { fontSize: 16, fontWeight: 'bold' },
  planDesc: { fontSize: 12, marginTop: 4, marginRight: 12, lineHeight: 16 },
  planPrice: { fontSize: 18, fontWeight: 'bold', color: '#10B981', marginTop: 8 },
  buyButton: { backgroundColor: '#4A6CF7', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  buyButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
});
