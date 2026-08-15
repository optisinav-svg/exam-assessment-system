import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const plans = [
  { id: 'ogrenci', name: 'Öğrenci', price: '69 TL', suffix: '/ ay', color: '#2563EB', description: 'Bireysel gelişimini takip et.', features: ['Sınırsız sınav analizi', 'Kazanım takibi', 'Gelişim raporları'] },
  { id: 'ogretmen', name: 'Öğretmen', price: '149 TL', suffix: '/ ay', color: '#7C3AED', description: 'Sınıfınızı veriye dayalı yönetin.', features: ['Optik form okuma', 'Sınıf yönetimi', 'Gelişmiş istatistikler'] },
  { id: 'kurum', name: 'Kurum', price: '19 TL', suffix: 'öğrenci / ay', color: '#059669', description: 'Tüm kurumunuzu tek panelden yönetin.', features: ['Kurum paneli', 'Toplu kullanıcı yönetimi', 'Şube karşılaştırmaları'] },
  { id: 'koc', name: 'Eğitim Koçu', price: '24 TL', suffix: 'öğrenci / ay', color: '#D97706', description: 'Öğrencilerinizin hedeflerine eşlik edin.', features: ['Öğrenci takibi', 'Koçluk raporları', 'Ödev takip sistemi'] },
];

export default function FiyatlandirmaScreen({ navigation }: any) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}><TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Geri</Text></TouchableOpacity><Text style={styles.headerTitle}>💳 Fiyatlandırma</Text><View style={{ width: 40 }} /></View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Size uygun planı seçin</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>OptikSınav ile sınav, öğrenci ve gelişim süreçlerinizi tek yerde yönetin.</Text>
        {plans.map((plan) => <View key={plan.id} style={[styles.plan, { backgroundColor: colors.card, borderTopColor: plan.color }]}><View style={styles.planHeader}><View><Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text><Text style={[styles.description, { color: colors.textSecondary }]}>{plan.description}</Text></View><View style={styles.priceBox}><Text style={[styles.price, { color: plan.color }]}>{plan.price}</Text><Text style={[styles.suffix, { color: colors.textSecondary }]}>{plan.suffix}</Text></View></View><View style={styles.features}>{plan.features.map((feature) => <Text key={feature} style={[styles.feature, { color: colors.text }]}>✓ {feature}</Text>)}</View><TouchableOpacity onPress={() => navigation.navigate('Subscription')} style={[styles.cta, { backgroundColor: plan.color }]}><Text style={styles.ctaText}>Bu Planı İncele</Text></TouchableOpacity></View>)}
        <Text style={[styles.note, { color: colors.textSecondary }]}>Fiyatlar bilgilendirme amaçlıdır. Ödeme ve aktif abonelik işlemleri Abonelik ekranından yürütülür.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 }, back: { color: '#fff', fontSize: 16, fontWeight: '600' }, headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' }, content: { padding: 16, paddingBottom: 36 }, title: { fontSize: 24, fontWeight: '800', marginBottom: 6 }, subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 18 }, plan: { borderRadius: 15, borderTopWidth: 4, padding: 16, marginBottom: 14, elevation: 2 }, planHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 }, planName: { fontSize: 20, fontWeight: '800' }, description: { fontSize: 12, lineHeight: 17, marginTop: 5, maxWidth: 190 }, priceBox: { alignItems: 'flex-end' }, price: { fontSize: 21, fontWeight: '800' }, suffix: { fontSize: 11, marginTop: 2 }, features: { marginTop: 15, marginBottom: 14, gap: 6 }, feature: { fontSize: 13, fontWeight: '600' }, cta: { borderRadius: 9, paddingVertical: 11, alignItems: 'center' }, ctaText: { color: '#fff', fontWeight: '700' }, note: { textAlign: 'center', fontSize: 12, lineHeight: 18, marginTop: 4 },
});
