import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import {
  getSubjects,
  createSubject,
  createExam,
  Subject,
} from '../services/api';

const OPTION_LETTERS: Record<number, string[]> = {
  3: ['A', 'B', 'C'],
  4: ['A', 'B', 'C', 'D'],
  5: ['A', 'B', 'C', 'D', 'E'],
};

function todayIso(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function CreateExamScreen({ navigation }: any) {
  const [title, setTitle] = useState('');
  const [examDate, setExamDate] = useState(todayIso());
  const [totalQuestions, setTotalQuestions] = useState('10');
  const [optionCount, setOptionCount] = useState<3 | 4 | 5>(4);
  const [negativeMarking, setNegativeMarking] = useState(true);
  const [correctAnswers, setCorrectAnswers] = useState<Record<string, string>>({});

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const data = await getSubjects();
      setSubjects(data);
    } catch (error) {
      // Ders listesi alınamazsa sessizce devam et, ders seçimi olmadan da sınav oluşturulabilir
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) return;
    try {
      const created = await createSubject(newSubjectName.trim());
      setSubjects((prev) => [...prev, created]);
      setSelectedSubjectId(created.id);
      setNewSubjectName('');
      setIsAddingSubject(false);
    } catch (error) {
      Alert.alert('Hata', 'Ders eklenemedi. Lütfen tekrar deneyin.');
    }
  };

  const questionCount = Math.max(0, Math.min(200, parseInt(totalQuestions, 10) || 0));
  const letters = OPTION_LETTERS[optionCount];

  const setAnswer = (questionNo: number, letter: string) => {
    setCorrectAnswers((prev) => ({ ...prev, [String(questionNo)]: letter }));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Eksik bilgi', 'Lütfen sınav başlığını girin.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(examDate)) {
      Alert.alert('Geçersiz tarih', 'Tarihi YYYY-AA-GG formatında girin (örn. 2026-08-03).');
      return;
    }
    if (questionCount <= 0) {
      Alert.alert('Eksik bilgi', 'Toplam soru sayısı 1 veya daha fazla olmalı.');
      return;
    }

    const answeredCount = Object.keys(correctAnswers).filter(
      (k) => Number(k) <= questionCount
    ).length;
    if (answeredCount < questionCount) {
      Alert.alert(
        'Cevap anahtarı eksik',
        `${questionCount} sorudan ${answeredCount} tanesinin doğru cevabını işaretlediniz. Eksik soruların doğru cevabını seçin.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await createExam({
        title: title.trim(),
        subjectId: selectedSubjectId || undefined,
        examDate,
        totalQuestions: questionCount,
        correctAnswers,
        optionCount,
        negativeMarking,
      });
      Alert.alert('Başarılı', 'Sınav oluşturuldu.', [
        { text: 'Tamam', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      const message =
        error?.response?.data?.message || 'Sınav oluşturulamadı. Lütfen tekrar deneyin.';
      Alert.alert('Hata', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>‹ Geri</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Yeni Sınav Oluştur</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Sınav Başlığı</Text>
        <TextInput
          style={styles.input}
          placeholder="Örn. 1. Dönem Matematik Sınavı"
          value={title}
          onChangeText={setTitle}
          editable={!isSubmitting}
        />

        <Text style={styles.label}>Sınav Tarihi (YYYY-AA-GG)</Text>
        <TextInput
          style={styles.input}
          placeholder="2026-08-03"
          value={examDate}
          onChangeText={setExamDate}
          editable={!isSubmitting}
        />

        <Text style={styles.label}>Ders (isteğe bağlı)</Text>
        {isLoadingSubjects ? (
          <ActivityIndicator color="#4A6CF7" />
        ) : (
          <View style={styles.chipRow}>
            {subjects.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[
                  styles.chip,
                  selectedSubjectId === s.id && styles.chipActive,
                ]}
                onPress={() =>
                  setSelectedSubjectId(selectedSubjectId === s.id ? null : s.id)
                }
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedSubjectId === s.id && styles.chipTextActive,
                  ]}
                >
                  {s.name}
                </Text>
              </TouchableOpacity>
            ))}

            {isAddingSubject ? (
              <View style={styles.addSubjectRow}>
                <TextInput
                  style={styles.addSubjectInput}
                  placeholder="Ders adı"
                  value={newSubjectName}
                  onChangeText={setNewSubjectName}
                  autoFocus
                />
                <TouchableOpacity style={styles.addSubjectButton} onPress={handleAddSubject}>
                  <Text style={styles.addSubjectButtonText}>Ekle</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.chip}
                onPress={() => setIsAddingSubject(true)}
              >
                <Text style={styles.chipText}>+ Yeni Ders</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <Text style={styles.label}>Toplam Soru Sayısı</Text>
        <TextInput
          style={styles.input}
          placeholder="Örn. 20"
          value={totalQuestions}
          onChangeText={setTotalQuestions}
          keyboardType="number-pad"
          editable={!isSubmitting}
        />

        <Text style={styles.label}>Seçenek Sayısı</Text>
        <View style={styles.optionCountRow}>
          {[3, 4, 5].map((n) => (
            <TouchableOpacity
              key={n}
              style={[
                styles.optionCountButton,
                optionCount === n && styles.optionCountButtonActive,
              ]}
              onPress={() => setOptionCount(n as 3 | 4 | 5)}
              disabled={isSubmitting}
            >
              <Text
                style={[
                  styles.optionCountText,
                  optionCount === n && styles.optionCountTextActive,
                ]}
              >
                {n} Seçenekli
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Yanlışlar Doğruyu Eksiltsin</Text>
            <Text style={styles.helperText}>
              {optionCount === 5
                ? '4 yanlış, 1 doğruyu eksiltir'
                : optionCount === 4
                ? '3 yanlış, 1 doğruyu eksiltir'
                : '2 yanlış, 1 doğruyu eksiltir'}
            </Text>
          </View>
          <Switch value={negativeMarking} onValueChange={setNegativeMarking} disabled={isSubmitting} />
        </View>

        {questionCount > 0 && (
          <>
            <Text style={[styles.label, { marginTop: 20 }]}>Cevap Anahtarı</Text>
            <Text style={styles.helperText}>
              Her sorunun doğru cevabını seçin ({Object.keys(correctAnswers).filter(k => Number(k) <= questionCount).length}/{questionCount} tamamlandı)
            </Text>

            <View style={styles.answersGrid}>
              {Array.from({ length: questionCount }, (_, i) => i + 1).map((q) => (
                <View key={q} style={styles.answerRow}>
                  <Text style={styles.answerQuestionNo}>{q}.</Text>
                  <View style={styles.answerLetters}>
                    {letters.map((letter) => (
                      <TouchableOpacity
                        key={letter}
                        style={[
                          styles.letterButton,
                          correctAnswers[String(q)] === letter && styles.letterButtonActive,
                        ]}
                        onPress={() => setAnswer(q, letter)}
                        disabled={isSubmitting}
                      >
                        <Text
                          style={[
                            styles.letterText,
                            correctAnswers[String(q)] === letter && styles.letterTextActive,
                          ]}
                        >
                          {letter}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Sınavı Oluştur</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4FF',
  },
  header: {
    padding: 20,
    paddingTop: 12,
    backgroundColor: '#4A6CF7',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginTop: 16,
  },
  helperText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  chipActive: {
    backgroundColor: '#4A6CF7',
    borderColor: '#4A6CF7',
  },
  chipText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
  },
  addSubjectRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  addSubjectInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    backgroundColor: '#fff',
    minWidth: 120,
  },
  addSubjectButton: {
    backgroundColor: '#4A6CF7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addSubjectButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  optionCountRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionCountButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  optionCountButtonActive: {
    backgroundColor: '#4A6CF7',
    borderColor: '#4A6CF7',
  },
  optionCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  optionCountTextActive: {
    color: '#fff',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
  },
  answersGrid: {
    gap: 8,
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
  },
  answerQuestionNo: {
    width: 30,
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  answerLetters: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
  },
  letterButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  letterButtonActive: {
    backgroundColor: '#4A6CF7',
  },
  letterText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
  },
  letterTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#4A6CF7',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
