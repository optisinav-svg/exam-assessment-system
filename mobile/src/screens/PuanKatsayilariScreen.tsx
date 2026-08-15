import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getScoreCoefficients, saveScoreCoefficientsBulk, ScoreCoefficient } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const TYPES = ['TYT', 'AYT', 'LGS'];

type EditableCoefficient = { subjectCode: string; average: string; stdDeviation: string; coefficient: string };

export default function PuanKatsayilariScreen({ navigation }: any) {
  const { colors, mode } = useTheme();
  const [examType, setExamType] = useState('TYT');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [rows, setRows] = useState<EditableCoefficient[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    const yearNumber = Number(year);
    if (!Number.isInteger(yearNumber) || yearNumber < 2000) { setError('Geçerli bir yıl girin.'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      const response = await getScoreCoefficients(examType, yearNumber);
      setRows((response.coefficients || []).map((item: ScoreCoefficient) => ({ subjectCode: item.subjectCode, average: item.average == null ? '' : String(item.average), stdDeviation: item.stdDeviation == null ? '' : String(item.stdDeviation), coefficient: item.coefficient == null ? '' : String(item.coefficient) })));
    } catch (err: any) {
      setRows([]); setError(err.response?.data?.message || 'Katsayılar yüklenemedi.');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [examType]);

  const updateRow = (index: number, key: keyof EditableCoefficient, value: string) => setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value.replace(',', '.') } : row));

  const save = async () => {
    const yearNumber = Number(year);
    if (!Number.isInteger(yearNumber) || yearNumber < 2000) { Alert.alert('Hata', 'Geçerli bir yıl girin.'); return; }
    if (rows.length === 0) { Alert.alert('Hata', 'Kaydedilecek katsayı satırı yok.'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      await saveScoreCoefficientsBulk({ examType, year: yearNumber, items: rows.filter((row) => row.subjectCode.trim()).map((row) => ({ subjectCode: row.subjectCode.trim(), average: row.average ? Number(row.average) : undefined, stdDeviation: row.stdDeviation ? Number(row.stdDeviation) : undefined, coefficient: row.coefficient ? Number(row.coefficient) : undefined })) });
      setSuccess('Katsayılar başarıyla kaydedildi.');
      await load();
    } catch (err: any) { setError(err.response?.data?.message || 'Katsayılar kaydedilemedi.'); } finally { setSaving(false); }
  };

  const addRow = () => setRows((current) => [...current, { subjectCode: '', average: '', stdDeviation: '', coefficient: '' }]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}><TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Geri</Text></TouchableOpacity><Text style={styles.headerTitle}>📐 Puan Katsayıları</Text><View style={{ width: 40 }} /></View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.description, { color: colors.textSecondary }]}>TYT, AYT ve LGS için yıl bazlı ortalama, standart sapma ve katsayı değerlerini yönetin.</Text>
        <View style={styles.typeRow}>{TYPES.map((type) => <TouchableOpacity key={type} onPress={() => setExamType(type)} style={[styles.typeChip, examType === type && styles.typeActive]}><Text style={[styles.typeText, examType === type && styles.typeTextActive]}>{type}</Text></TouchableOpacity>)}</View>
        <View style={styles.yearRow}><Text style={[styles.label, { color: colors.text }]}>Yıl</Text><TextInput value={year} onChangeText={setYear} keyboardType="number-pad" style={[styles.yearInput, { color: colors.text, backgroundColor: mode === 'dark' ? '#374151' : '#fff', borderColor: colors.border }]} /><TouchableOpacity onPress={load} style={styles.loadButton}><Text style={styles.loadText}>Yükle</Text></TouchableOpacity></View>
        {error ? <Text style={styles.error}>{error}</Text> : null}{success ? <Text style={styles.success}>{success}</Text> : null}
        {loading ? <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 26 }} /> : <View style={[styles.panel, { backgroundColor: colors.card }]}>
          <View style={styles.tableHeader}><Text style={[styles.headerCell, { flex: 1.1 }]}>Ders</Text><Text style={styles.headerCell}>Ortalama</Text><Text style={styles.headerCell}>Sapma</Text><Text style={styles.headerCell}>Katsayı</Text></View>
          {rows.map((row, index) => <View key={`${row.subjectCode}-${index}`} style={styles.tableRow}><TextInput value={row.subjectCode} onChangeText={(value) => updateRow(index, 'subjectCode', value)} placeholder="Ders" placeholderTextColor="#9CA3AF" style={[styles.cellInput, styles.codeInput, { color: colors.text, backgroundColor: mode === 'dark' ? '#374151' : '#F9FAFB', borderColor: colors.border }]} /><TextInput value={row.average} onChangeText={(value) => updateRow(index, 'average', value)} keyboardType="decimal-pad" style={[styles.cellInput, { color: colors.text, backgroundColor: mode === 'dark' ? '#374151' : '#F9FAFB', borderColor: colors.border }]} /><TextInput value={row.stdDeviation} onChangeText={(value) => updateRow(index, 'stdDeviation', value)} keyboardType="decimal-pad" style={[styles.cellInput, { color: colors.text, backgroundColor: mode === 'dark' ? '#374151' : '#F9FAFB', borderColor: colors.border }]} /><TextInput value={row.coefficient} onChangeText={(value) => updateRow(index, 'coefficient', value)} keyboardType="decimal-pad" style={[styles.cellInput, { color: colors.text, backgroundColor: mode === 'dark' ? '#374151' : '#F9FAFB', borderColor: colors.border }]} /></View>)}
          {rows.length === 0 && <Text style={[styles.empty, { color: colors.textSecondary }]}>Bu yıl için kayıt yok. Yeni satır ekleyin.</Text>}
          <View style={styles.actions}><TouchableOpacity onPress={addRow} style={styles.secondaryButton}><Text style={styles.secondaryText}>+ Satır Ekle</Text></TouchableOpacity><TouchableOpacity onPress={save} disabled={saving} style={styles.saveButton}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Kaydet</Text>}</TouchableOpacity></View>
        </View>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 }, back: { color: '#fff', fontSize: 16, fontWeight: '600' }, headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' }, content: { padding: 16, paddingBottom: 36 }, description: { fontSize: 14, lineHeight: 20, marginBottom: 15 }, typeRow: { flexDirection: 'row', gap: 8, marginBottom: 14 }, typeChip: { flex: 1, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 9, alignItems: 'center', paddingVertical: 10 }, typeActive: { backgroundColor: '#4A6CF7', borderColor: '#4A6CF7' }, typeText: { color: '#4B5563', fontWeight: '700' }, typeTextActive: { color: '#fff' }, yearRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 12 }, label: { fontWeight: '700' }, yearInput: { width: 100, borderWidth: 1, borderRadius: 8, paddingHorizontal: 11, paddingVertical: 9 }, loadButton: { backgroundColor: '#6B7280', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 10 }, loadText: { color: '#fff', fontWeight: '700' }, error: { color: '#DC2626', marginBottom: 10 }, success: { color: '#059669', marginBottom: 10 }, panel: { borderRadius: 14, padding: 12, elevation: 1 }, tableHeader: { flexDirection: 'row', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#D1D5DB' }, headerCell: { flex: 1, color: '#6B7280', fontSize: 11, fontWeight: '700', textAlign: 'center' }, tableRow: { flexDirection: 'row', gap: 4, paddingVertical: 6 }, cellInput: { flex: 1, minWidth: 0, borderWidth: 1, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 8, fontSize: 12, textAlign: 'center' }, codeInput: { flex: 1.1 }, empty: { textAlign: 'center', paddingVertical: 25 }, actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, gap: 10 }, secondaryButton: { flex: 1, borderWidth: 1, borderColor: '#4A6CF7', borderRadius: 9, paddingVertical: 11, alignItems: 'center' }, secondaryText: { color: '#4A6CF7', fontWeight: '700' }, saveButton: { flex: 1, backgroundColor: '#4A6CF7', borderRadius: 9, paddingVertical: 11, alignItems: 'center' }, saveText: { color: '#fff', fontWeight: '700' },
});
