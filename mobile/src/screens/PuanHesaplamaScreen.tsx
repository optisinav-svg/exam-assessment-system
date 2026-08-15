import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getScoreCoefficientYears, ScoreCoefficient } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const EXAM_TYPES = ['TYT', 'AYT', 'LGS'] as const;
type ExamType = (typeof EXAM_TYPES)[number];

interface ScoreResult {
  year: number;
  hamPuan: number;
  standardPuan: number;
  average: number;
  stdDeviation: number;
}

function numeric(value: string | number | null | undefined, fallback = 0) {
  const result = Number(value);
  return Number.isFinite(result) ? result : fallback;
}

export default function PuanHesaplamaScreen({ navigation }: any) {
  const { colors, mode } = useTheme();
  const currentYear = new Date().getFullYear();
  const [examType, setExamType] = useState<ExamType>('TYT');
  const [coefficients, setCoefficients] = useState<ScoreCoefficient[]>([]);
  const [nets, setNets] = useState<Record<string, string>>({});
  const [results, setResults] = useState<ScoreResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState('');

  const loadCoefficients = async () => {
    setLoading(true);
    setError('');
    try {
      const years = [currentYear, currentYear - 1, currentYear - 2];
      const yearResults = await getScoreCoefficientYears(examType, years);
      const available = yearResults.find((item) => item.coefficients.length > 0);
      setCoefficients(available?.coefficients || []);
      if (!available) setError(`${examType} için katsayı kaydı bulunamadı.`);
      setResults([]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Katsayılar yüklenemedi.');
      setCoefficients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoefficients();
  }, [examType]);

  const subjects = useMemo(
    () => Array.from(new Set(coefficients.map((item) => item.subjectCode))),
    [coefficients]
  );

  const calculateForYear = (year: number, yearCoefficients: ScoreCoefficient[]): ScoreResult | null => {
    const coefficientMap = new Map(yearCoefficients.map((item) => [item.subjectCode, item]));
    let hamPuan = 0;
    let hasData = false;
    subjects.forEach((subject) => {
      const coefficient = coefficientMap.get(subject);
      const net = numeric(nets[subject]);
      if (coefficient && coefficient.coefficient !== null && coefficient.coefficient !== undefined && nets[subject] !== '') {
        hamPuan += net * numeric(coefficient.coefficient);
        hasData = true;
      }
    });
    if (!hasData) return null;
    const first = yearCoefficients[0];
    const average = numeric(first?.average);
    const stdDeviation = numeric(first?.stdDeviation, 1) || 1;
    const standardPuan = 50 + 10 * ((hamPuan - average) / stdDeviation);
    return {
      year,
      hamPuan: Math.round(hamPuan * 100) / 100,
      standardPuan: Math.round(standardPuan * 100) / 100,
      average,
      stdDeviation,
    };
  };

  const handleCalculate = async () => {
    if (Object.values(nets).every((value) => !value.trim())) {
      Alert.alert('Eksik Bilgi', 'En az bir ders için net girmelisiniz.');
      return;
    }
    setCalculating(true);
    setError('');
    try {
      const years = [currentYear, currentYear - 1, currentYear - 2];
      const yearResults = await getScoreCoefficientYears(examType, years);
      const calculated = yearResults
        .map((item) => calculateForYear(item.year, item.coefficients))
        .filter((item): item is ScoreResult => Boolean(item));
      if (calculated.length === 0) {
        setError('Girdiğiniz netlerle puan hesaplanamadı. Katsayı ve net bilgilerini kontrol edin.');
      }
      setResults(calculated);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Puan hesaplanamadı.');
    } finally {
      setCalculating(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🧮 Puan Hesaplama</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.description, { color: colors.textSecondary }]}>Netlerinizi girerek tahmini puanınızı ve son üç yıl karşılaştırmasını görün.</Text>
        <View style={styles.segmentRow}>
          {EXAM_TYPES.map((type) => (
            <TouchableOpacity key={type} onPress={() => setExamType(type)} style={[styles.segment, examType === type && styles.segmentActive]}>
              <Text style={[styles.segmentText, examType === type && styles.segmentTextActive]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Ders Netleri</Text>
          {loading ? <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} /> : subjects.length === 0 ? (
            <Text style={[styles.muted, { color: colors.textSecondary }]}>Bu sınav türü için henüz ders katsayısı yok.</Text>
          ) : subjects.map((subject) => (
            <View key={subject} style={styles.inputRow}>
              <Text style={[styles.subject, { color: colors.text }]}>{subject}</Text>
              <TextInput
                value={nets[subject] ?? ''}
                onChangeText={(value) => setNets((previous) => ({ ...previous, [subject]: value.replace(',', '.') }))}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor="#9CA3AF"
                style={[styles.input, { color: colors.text, backgroundColor: mode === 'dark' ? '#374151' : '#F9FAFB', borderColor: colors.border }]}
              />
            </View>
          ))}
          <TouchableOpacity style={styles.calculateButton} onPress={handleCalculate} disabled={calculating || loading}>
            {calculating ? <ActivityIndicator color="#fff" /> : <Text style={styles.calculateText}>Puanı Hesapla</Text>}
          </TouchableOpacity>
        </View>
        {!!error && <Text style={styles.error}>{error}</Text>}
        {results.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Sonuçlar</Text>
            {results.map((result, index) => (
              <View key={result.year} style={[styles.resultRow, index === 0 && styles.currentResult]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.resultYear, { color: colors.text }]}>{result.year} {index === 0 ? '(Güncel)' : ''}</Text>
                  <Text style={[styles.resultMeta, { color: colors.textSecondary }]}>Ham: {result.hamPuan} · Ortalama: {result.average}</Text>
                </View>
                <Text style={styles.score}>{result.standardPuan}</Text>
              </View>
            ))}
            <Text style={[styles.note, { color: colors.textSecondary }]}>Standart puan: 50 + 10 × (Ham Puan − Ortalama) / Standart Sapma</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  back: { color: '#fff', fontSize: 16, fontWeight: '600' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  content: { padding: 16, paddingBottom: 36 },
  description: { fontSize: 14, lineHeight: 20, marginBottom: 14 },
  segmentRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  segment: { flex: 1, borderWidth: 1, borderColor: '#D1D5DB', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  segmentActive: { backgroundColor: '#4A6CF7', borderColor: '#4A6CF7' },
  segmentText: { color: '#4B5563', fontWeight: '600' },
  segmentTextActive: { color: '#fff' },
  card: { borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 14 },
  muted: { fontSize: 14, lineHeight: 20 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  subject: { flex: 1, fontSize: 14, fontWeight: '600' },
  input: { width: 90, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9, textAlign: 'right' },
  calculateButton: { backgroundColor: '#4A6CF7', borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 8 },
  calculateText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  error: { color: '#DC2626', fontSize: 14, marginBottom: 14 },
  resultRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingVertical: 13 },
  currentResult: { backgroundColor: 'rgba(16, 185, 129, 0.08)', borderRadius: 8, paddingHorizontal: 8 },
  resultYear: { fontSize: 15, fontWeight: '700' },
  resultMeta: { fontSize: 12, marginTop: 4 },
  score: { color: '#2563EB', fontSize: 24, fontWeight: '800' },
  note: { fontSize: 12, lineHeight: 18, marginTop: 14 },
});
