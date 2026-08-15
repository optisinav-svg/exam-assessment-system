import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getInstitutionMembers, getInstitutionStats, InstitutionMember, inviteInstitutionMember } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function KurumPaneliScreen({ navigation }: any) {
  const { user } = useAuth();
  const { colors, mode } = useTheme();
  const [members, setMembers] = useState<InstitutionMember[]>([]);
  const [stats, setStats] = useState({ teacherCount: 0, studentCount: 0, totalExams: 0, totalMembers: 0 });
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'teacher' | 'student'>('teacher');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');

  const loadPanel = async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    try {
      const [membersResponse, statsResponse] = await Promise.all([getInstitutionMembers(), getInstitutionStats()]);
      setMembers(membersResponse.members || []);
      setStats(statsResponse.stats || stats);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kurum paneli yüklenemedi.');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { if (user?.accountType === 'kurum') loadPanel(); }, [user?.accountType]));

  if (user?.accountType !== 'kurum') {
    return <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}><View style={styles.accessDenied}><Text style={styles.deniedIcon}>🔒</Text><Text style={[styles.deniedTitle, { color: colors.text }]}>Kurum Paneli</Text><Text style={[styles.deniedText, { color: colors.textSecondary }]}>Bu ekran yalnızca kurum hesaplarına açıktır.</Text><TouchableOpacity onPress={() => navigation.goBack()} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Geri Dön</Text></TouchableOpacity></View></SafeAreaView>;
  }

  const invite = async () => {
    if (!email.trim() || !email.includes('@')) { Alert.alert('Eksik Bilgi', 'Geçerli bir e-posta adresi girin.'); return; }
    setInviting(true);
    try {
      const response = await inviteInstitutionMember(email.trim(), role);
      Alert.alert('Başarılı', response.message || 'Davet gönderildi.');
      setEmail('');
      await loadPanel(true);
    } catch (err: any) {
      Alert.alert('Hata', err.response?.data?.message || 'Davet gönderilemedi.');
    } finally { setInviting(false); }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}><TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Geri</Text></TouchableOpacity><Text style={styles.headerTitle}>🏫 Kurum Paneli</Text><View style={{ width: 40 }} /></View>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadPanel(true)} tintColor={colors.primary} />}>
        {loading ? <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 30 }} /> : <>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.statGrid}>{[
            ['👨‍🏫', String(stats.teacherCount), 'Öğretmen', '#2563EB'],
            ['👨‍🎓', String(stats.studentCount), 'Öğrenci', '#059669'],
            ['📝', String(stats.totalExams), 'Sınav', '#7C3AED'],
            ['👥', String(stats.totalMembers), 'Toplam Üye', '#D97706'],
          ].map(([icon, value, label, color]) => <View key={label} style={[styles.statCard, { backgroundColor: colors.card }]}><Text style={styles.icon}>{icon}</Text><Text style={[styles.statValue, { color }]}>{value}</Text><Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text></View>)}</View>
          <View style={[styles.panel, { backgroundColor: colors.card }]}><Text style={[styles.panelTitle, { color: colors.text }]}>Üye Davet Et</Text><TextInput value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="E-posta adresi" placeholderTextColor="#9CA3AF" style={[styles.input, { color: colors.text, backgroundColor: mode === 'dark' ? '#374151' : '#F9FAFB', borderColor: colors.border }]} /><View style={styles.roleRow}><TouchableOpacity onPress={() => setRole('teacher')} style={[styles.roleChip, role === 'teacher' && styles.roleActive]}><Text style={[styles.roleText, role === 'teacher' && styles.roleTextActive]}>Öğretmen</Text></TouchableOpacity><TouchableOpacity onPress={() => setRole('student')} style={[styles.roleChip, role === 'student' && styles.roleActive]}><Text style={[styles.roleText, role === 'student' && styles.roleTextActive]}>Öğrenci</Text></TouchableOpacity><TouchableOpacity onPress={invite} disabled={inviting} style={styles.inviteButton}>{inviting ? <ActivityIndicator color="#fff" /> : <Text style={styles.inviteText}>Davet Et</Text>}</TouchableOpacity></View></View>
          <View style={[styles.panel, { backgroundColor: colors.card }]}><Text style={[styles.panelTitle, { color: colors.text }]}>Bağlı Üyeler</Text>{members.length === 0 ? <Text style={[styles.muted, { color: colors.textSecondary }]}>Henüz bağlı üye yok.</Text> : members.map((member) => { const name = member.details?.fullName || [member.details?.firstName, member.details?.lastName].filter(Boolean).join(' ') || member.email; return <View key={member.id} style={styles.memberRow}><View style={{ flex: 1 }}><Text style={[styles.memberName, { color: colors.text }]}>{name}</Text><Text style={[styles.memberMeta, { color: colors.textSecondary }]}>{member.email} · {member.role === 'teacher' ? 'Öğretmen' : 'Öğrenci'}</Text></View><View style={[styles.status, { backgroundColor: member.status === 'active' ? '#DCFCE7' : '#FEF3C7' }]}><Text style={{ color: member.status === 'active' ? '#166534' : '#92400E', fontSize: 11, fontWeight: '700' }}>{member.status === 'active' ? 'Aktif' : 'Beklemede'}</Text></View></View>; })}</View>
        </>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 }, back: { color: '#fff', fontSize: 16, fontWeight: '600' }, headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' }, content: { padding: 16, paddingBottom: 36 }, statGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 14 }, statCard: { width: '48%', borderRadius: 14, padding: 14, marginBottom: 10, elevation: 1 }, icon: { fontSize: 21, marginBottom: 5 }, statValue: { fontSize: 23, fontWeight: '800' }, statLabel: { fontSize: 12, marginTop: 3 }, panel: { borderRadius: 14, padding: 15, marginBottom: 14, elevation: 1 }, panelTitle: { fontSize: 17, fontWeight: '800', marginBottom: 12 }, input: { borderWidth: 1, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 }, roleRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 10 }, roleChip: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 18, paddingHorizontal: 10, paddingVertical: 8 }, roleActive: { backgroundColor: '#4A6CF7', borderColor: '#4A6CF7' }, roleText: { color: '#4B5563', fontSize: 12, fontWeight: '600' }, roleTextActive: { color: '#fff' }, inviteButton: { flex: 1, backgroundColor: '#4A6CF7', borderRadius: 9, alignItems: 'center', paddingVertical: 10 }, inviteText: { color: '#fff', fontWeight: '700', fontSize: 12 }, memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }, memberName: { fontSize: 14, fontWeight: '700' }, memberMeta: { fontSize: 12, marginTop: 3 }, status: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 5 }, muted: { fontSize: 14 }, error: { color: '#DC2626', marginBottom: 12 }, accessDenied: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 25 }, deniedIcon: { fontSize: 46, marginBottom: 12 }, deniedTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8 }, deniedText: { fontSize: 14, textAlign: 'center', marginBottom: 18 }, primaryButton: { backgroundColor: '#4A6CF7', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12 }, primaryButtonText: { color: '#fff', fontWeight: '700' },
});
