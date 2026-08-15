import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  createLearningOutcome,
  deleteLearningOutcome,
  getLearningOutcomeSubjects,
  getLearningOutcomes,
  LearningOutcome,
  LearningOutcomeSubject,
  searchLearningOutcomesManagement,
  updateLearningOutcome,
} from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function KazanimYonetimiScreen({ navigation }: any) {
  const { colors, mode } = useTheme();
  const [subjects, setSubjects] = useState<LearningOutcomeSubject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [outcomes, setOutcomes] = useState<LearningOutcome[]>([]);
  const [query, setQuery] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<LearningOutcome | null>(null);
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [modalGrade, setModalGrade] = useState('');
  const [saving, setSaving] = useState(false);

  const loadSubjects = async () => {
    try {
      const response = await getLearningOutcomeSubjects();
      const all = [...(response.userSubjects || []), ...(response.globalSubjects || [])];
      setSubjects(all.filter((subject, index) => all.findIndex((item) => item.id === subject.id) === index));
      if (all.length > 0) setSelectedSubjectId(all[0].id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Dersler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const loadOutcomes = async (subjectId = selectedSubjectId, pageNumber = page) => {
    if (!subjectId) return;
    setListLoading(true);
    setError('');
    try {
      if (query.trim().length >= 2) {
        const response = await searchLearningOutcomesManagement(subjectId, query.trim());
        setOutcomes(response.outcomes || []);
        setTotal(response.total || 0);
        setTotalPages(1);
      } else {
        const response = await getLearningOutcomes(subjectId, { page: pageNumber, pageSize: 20, gradeLevel: gradeLevel.trim() || undefined });
        setOutcomes(response.outcomes || []);
        setTotal(response.pagination?.total || 0);
        setTotalPages(response.pagination?.totalPages || 1);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kazanımlar yüklenemedi.');
      setOutcomes([]);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => { loadSubjects(); }, []);
  useEffect(() => {
    if (selectedSubjectId) loadOutcomes(selectedSubjectId, page);
  }, [selectedSubjectId, page, gradeLevel]);

  const runSearch = () => {
    setPage(1);
    loadOutcomes(selectedSubjectId, 1);
  };

  const openAdd = () => {
    setEditing(null);
    setCode(''); setDescription(''); setModalGrade(gradeLevel);
    setModalVisible(true);
  };

  const openEdit = (outcome: LearningOutcome) => {
    setEditing(outcome);
    setCode(outcome.code);
    setDescription(outcome.description);
    setModalGrade(outcome.gradeLevel || '');
    setModalVisible(true);
  };

  const saveOutcome = async () => {
    if (!code.trim() || !description.trim() || !selectedSubjectId) {
      Alert.alert('Eksik Bilgi', 'Kod ve açıklama alanları zorunludur.');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateLearningOutcome(editing.id, { code: code.trim(), description: description.trim(), gradeLevel: modalGrade.trim() || undefined });
      } else {
        await createLearningOutcome(selectedSubjectId, { code: code.trim(), description: description.trim(), gradeLevel: modalGrade.trim() || undefined });
      }
      setModalVisible(false);
      await loadOutcomes(selectedSubjectId, page);
    } catch (err: any) {
      Alert.alert('Hata', err.response?.data?.message || 'Kazanım kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const removeOutcome = (outcome: LearningOutcome) => {
    Alert.alert('Kazanımı Sil', `${outcome.code} kazanımını silmek istediğinize emin misiniz?`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => {
        try {
          await deleteLearningOutcome(outcome.id);
          await loadOutcomes(selectedSubjectId, page);
        } catch (err: any) {
          Alert.alert('Hata', err.response?.data?.message || 'Kazanım silinemedi.');
        }
      } },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Geri</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>🎯 Kazanım Yönetimi</Text>
        <TouchableOpacity onPress={openAdd}><Text style={styles.addHeader}>+ Ekle</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Ders Seçin</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subjectScroll}>
          {subjects.map((subject) => (
            <TouchableOpacity key={subject.id} onPress={() => { setSelectedSubjectId(subject.id); setPage(1); }} style={[styles.subjectChip, selectedSubjectId === subject.id && styles.subjectChipActive]}>
              <Text style={[styles.subjectChipText, selectedSubjectId === subject.id && styles.subjectChipTextActive]}>{subject.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.searchRow}>
          <TextInput value={query} onChangeText={setQuery} onSubmitEditing={runSearch} placeholder="Kod veya açıklama ara" placeholderTextColor="#9CA3AF" style={[styles.searchInput, { color: colors.text, backgroundColor: mode === 'dark' ? '#374151' : '#fff', borderColor: colors.border }]} />
          <TouchableOpacity style={styles.searchButton} onPress={runSearch}><Text style={styles.searchButtonText}>Ara</Text></TouchableOpacity>
        </View>
        <View style={styles.filterRow}>
          <TextInput value={gradeLevel} onChangeText={setGradeLevel} placeholder="Sınıf seviyesi (opsiyonel)" placeholderTextColor="#9CA3AF" style={[styles.gradeInput, { color: colors.text, backgroundColor: mode === 'dark' ? '#374151' : '#fff', borderColor: colors.border }]} />
          <Text style={[styles.totalText, { color: colors.textSecondary }]}>{total} kayıt</Text>
        </View>
        {loading || listLoading ? <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 24 }} /> : outcomes.length === 0 ? (
          <View style={styles.empty}><Text style={[styles.emptyText, { color: colors.textSecondary }]}>Bu ölçütlere uygun kazanım bulunamadı.</Text><TouchableOpacity style={styles.primaryButton} onPress={openAdd}><Text style={styles.primaryButtonText}>İlk Kazanımı Ekle</Text></TouchableOpacity></View>
        ) : outcomes.map((outcome) => (
          <View key={outcome.id} style={[styles.outcomeCard, { backgroundColor: colors.card }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.outcomeCode, { color: colors.primary }]}>{outcome.code}{outcome.gradeLevel ? ` · ${outcome.gradeLevel}` : ''}</Text>
              <Text style={[styles.outcomeDescription, { color: colors.text }]}>{outcome.description}</Text>
            </View>
            <View style={styles.actionColumn}>
              <TouchableOpacity onPress={() => openEdit(outcome)}><Text style={styles.editText}>Düzenle</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => removeOutcome(outcome)}><Text style={styles.deleteText}>Sil</Text></TouchableOpacity>
            </View>
          </View>
        ))}
        {totalPages > 1 && (
          <View style={styles.pagination}>
            <TouchableOpacity disabled={page <= 1} onPress={() => setPage((value) => Math.max(1, value - 1))} style={[styles.pageButton, page <= 1 && styles.disabled]}><Text style={styles.pageText}>Önceki</Text></TouchableOpacity>
            <Text style={[styles.pageInfo, { color: colors.textSecondary }]}>{page} / {totalPages}</Text>
            <TouchableOpacity disabled={page >= totalPages} onPress={() => setPage((value) => Math.min(totalPages, value + 1))} style={[styles.pageButton, page >= totalPages && styles.disabled]}><Text style={styles.pageText}>Sonraki</Text></TouchableOpacity>
          </View>
        )}
      </ScrollView>
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}><View style={[styles.modal, { backgroundColor: colors.card }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>{editing ? 'Kazanımı Düzenle' : 'Yeni Kazanım'}</Text>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Kazanım Kodu</Text>
          <TextInput value={code} onChangeText={setCode} placeholder="Örn. MAT.9.1.1" placeholderTextColor="#9CA3AF" style={[styles.modalInput, { color: colors.text, backgroundColor: mode === 'dark' ? '#374151' : '#F9FAFB', borderColor: colors.border }]} />
          <Text style={[styles.label, { color: colors.textSecondary }]}>Açıklama</Text>
          <TextInput value={description} onChangeText={setDescription} multiline placeholder="Kazanım açıklaması" placeholderTextColor="#9CA3AF" style={[styles.modalInput, styles.textArea, { color: colors.text, backgroundColor: mode === 'dark' ? '#374151' : '#F9FAFB', borderColor: colors.border }]} />
          <Text style={[styles.label, { color: colors.textSecondary }]}>Sınıf Seviyesi</Text>
          <TextInput value={modalGrade} onChangeText={setModalGrade} placeholder="Örn. 9. sınıf" placeholderTextColor="#9CA3AF" style={[styles.modalInput, { color: colors.text, backgroundColor: mode === 'dark' ? '#374151' : '#F9FAFB', borderColor: colors.border }]} />
          <View style={styles.modalActions}><TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}><Text style={styles.cancelText}>Vazgeç</Text></TouchableOpacity><TouchableOpacity style={styles.saveButton} onPress={saveOutcome} disabled={saving}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Kaydet</Text>}</TouchableOpacity></View>
        </View></View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 }, back: { color: '#fff', fontSize: 16, fontWeight: '600' }, headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' }, addHeader: { color: '#fff', fontSize: 15, fontWeight: '700' }, content: { padding: 16, paddingBottom: 40 }, error: { color: '#DC2626', marginBottom: 10 }, sectionLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 }, subjectScroll: { marginBottom: 14 }, subjectChip: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 }, subjectChipActive: { backgroundColor: '#4A6CF7', borderColor: '#4A6CF7' }, subjectChipText: { color: '#4B5563', fontSize: 13, fontWeight: '600' }, subjectChipTextActive: { color: '#fff' }, searchRow: { flexDirection: 'row', gap: 8 }, searchInput: { flex: 1, borderWidth: 1, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 10 }, searchButton: { backgroundColor: '#4A6CF7', borderRadius: 9, paddingHorizontal: 16, justifyContent: 'center' }, searchButtonText: { color: '#fff', fontWeight: '700' }, filterRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 10, gap: 10 }, gradeInput: { flex: 1, borderWidth: 1, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13 }, totalText: { fontSize: 12 }, outcomeCard: { flexDirection: 'row', borderRadius: 12, padding: 13, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 }, outcomeCode: { fontWeight: '800', fontSize: 13, marginBottom: 5 }, outcomeDescription: { fontSize: 14, lineHeight: 20 }, actionColumn: { justifyContent: 'space-around', marginLeft: 8 }, editText: { color: '#2563EB', fontSize: 12, fontWeight: '700' }, deleteText: { color: '#DC2626', fontSize: 12, fontWeight: '700' }, empty: { alignItems: 'center', marginTop: 36 }, emptyText: { textAlign: 'center', marginBottom: 16 }, primaryButton: { backgroundColor: '#4A6CF7', borderRadius: 9, paddingHorizontal: 16, paddingVertical: 11 }, primaryButtonText: { color: '#fff', fontWeight: '700' }, pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 12 }, pageButton: { backgroundColor: '#4A6CF7', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }, disabled: { opacity: 0.4 }, pageText: { color: '#fff', fontSize: 12, fontWeight: '700' }, pageInfo: { fontSize: 13 }, modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 18 }, modal: { borderRadius: 16, padding: 18 }, modalTitle: { fontSize: 19, fontWeight: '800', marginBottom: 12 }, label: { fontSize: 13, fontWeight: '600', marginTop: 8, marginBottom: 6 }, modalInput: { borderWidth: 1, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 }, textArea: { minHeight: 84, textAlignVertical: 'top' }, modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 18 }, cancelButton: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 9, paddingHorizontal: 15, paddingVertical: 10 }, cancelText: { color: '#4B5563', fontWeight: '600' }, saveButton: { backgroundColor: '#4A6CF7', borderRadius: 9, paddingHorizontal: 18, paddingVertical: 10, minWidth: 72, alignItems: 'center' }, saveText: { color: '#fff', fontWeight: '700' },
});
