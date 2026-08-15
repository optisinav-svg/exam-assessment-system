import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { DashboardSummary, getDashboardData } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const emptySummary: DashboardSummary = { totalExams: 0, totalStudents: 0, totalSubjects: 0, avgScore: 0 };

export default function DashboardScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary);
  const [trend, setTrend] = useState<Array<{ examId: number; name: string; date: string; studentCount: number; avgNet: number; avgScore: number }>>([]);
  const [recentExams, setRecentExams] = useState<Array<{ id: number; title: string; examDate: string; status: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadDashboard = async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    try {
      const data = await getDashboardData();
      setSummary(data.summary || emptySummary);
      setTrend(data.examTrend || []);
      setRecentExams(data.recentExams || []);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Dashboard verileri yüklenemedi.');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadDashboard(); }, []));

  const cards = [
    { label: 'Toplam Sınav', value: summary.totalExams, color: '#2563EB', icon: '📝' },
    { label: 'Öğrenci', value: summary.totalStudents, color: '#059669', icon: '👥' },
    { label: 'Ders', value: summary.totalSubjects, color: '#7C3AED', icon: '📚' },
    { label: 'Ortalama Puan', value: Number(summary.avgScore || 0).toFixed(1), color: '#D97706', icon: '📊' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Geri</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>📊 Genel Bakış</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadDashboard(true)} tintColor={colors.primary} />}>
        {loading ? <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 30 }} /> : <>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.cardGrid}>{cards.map((card) => <View key={card.label} style={[styles.statCard, { backgroundColor: colors.card }]}><Text style={styles.icon}>{card.icon}</Text><Text style={[styles.statValue, { color: card.color }]}>{card.value}</Text><Text style={[styles.statLabel, { color: colors.textSecondary }]}>{card.label}</Text></View>)}</View>
          <View style={[styles.panel, { backgroundColor: colors.card }]}>
            <Text style={[styles.panelTitle, { color: colors.text }]}>Son Sınavlar</Text>
            {recentExams.length === 0 ? <Text style={[styles.muted, { color: colors.textSecondary }]}>Henüz sınav kaydı yok.</Text> : recentExams.slice(0, 8).map((exam) => <View key={exam.id} style={styles.examRow}><View style={{ flex: 1 }}><Text style={[styles.examTitle, { color: colors.text }]}>{exam.title}</Text><Text style={[styles.examMeta, { color: colors.textSecondary }]}>{exam.examDate ? new Date(exam.examDate).toLocaleDateString('tr-TR') : 'Tarih yok'}</Text></View><View style={[styles.status, { backgroundColor: exam.status === 'completed' ? '#DCFCE7' : '#FEF3C7' }]}><Text style={{ color: exam.status === 'completed' ? '#166534' : '#92400E', fontSize: 11, fontWeight: '700' }}>{exam.status === 'completed' ? 'Tamamlandı' : exam.status}</Text></View></View>)}
          </View>
          <View style={[styles.panel, { backgroundColor: colors.card }]}>
            <Text style={[styles.panelTitle, { color: colors.text }]}>Sınav Trendi</Text>
            {trend.length === 0 ? <Text style={[styles.muted, { color: colors.textSecondary }]}>Trend verisi bulunmuyor.</Text> : trend.slice(-6).map((item) => <View key={`${item.examId}-${item.date}`} style={styles.trendRow}><View style={{ flex: 1 }}><Text style={[styles.examTitle, { color: colors.text }]}>{item.name}</Text><Text style={[styles.examMeta, { color: colors.textSecondary }]}>{item.studentCount} öğrenci · Net {Number(item.avgNet || 0).toFixed(1)}</Text></View><Text style={styles.trendScore}>{Number(item.avgScore || 0).toFixed(1)}</Text></View>)}
          </View>
          <View style={styles.quickLinks}><TouchableOpacity style={styles.quickButton} onPress={() => navigation.navigate('PuanHesaplama')}><Text style={styles.quickText}>🧮 Puan Hesapla</Text></TouchableOpacity><TouchableOpacity style={styles.quickButton} onPress={() => navigation.navigate('KazanimYonetimi')}><Text style={styles.quickText}>🎯 Kazanımlar</Text></TouchableOpacity></View>
        </>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 }, back: { color: '#fff', fontSize: 16, fontWeight: '600' }, headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' }, content: { padding: 16, paddingBottom: 36 }, cardGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 }, statCard: { width: '48%', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 }, icon: { fontSize: 22, marginBottom: 6 }, statValue: { fontSize: 24, fontWeight: '800' }, statLabel: { fontSize: 12, marginTop: 3 }, panel: { borderRadius: 14, padding: 15, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 }, panelTitle: { fontSize: 17, fontWeight: '800', marginBottom: 10 }, muted: { fontSize: 14, lineHeight: 20 }, examRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }, examTitle: { fontSize: 14, fontWeight: '700' }, examMeta: { fontSize: 12, marginTop: 3 }, status: { borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5 }, trendRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }, trendScore: { color: '#2563EB', fontSize: 18, fontWeight: '800' }, quickLinks: { flexDirection: 'row', gap: 8 }, quickButton: { flex: 1, backgroundColor: '#4A6CF7', borderRadius: 10, paddingVertical: 12, alignItems: 'center' }, quickText: { color: '#fff', fontSize: 12, fontWeight: '700' }, error: { color: '#DC2626', marginBottom: 12 },
});
