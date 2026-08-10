import React, { useEffect, useMemo, useState } from 'react';
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
  updateExam,
  getExams,
  getExamById,
  getSchools,
  getClassesBySchool,
  searchLearningOutcomes,
  Subject,
  Exam,
  School,
  SchoolClass,
  LearningOutcome,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const OPTION_LETTERS: Record<number, string[]> = {
  3: ['A', 'B', 'C'],
  4: ['A', 'B', 'C', 'D'],
  5: ['A', 'B', 'C', 'D', 'E'],
};

// ─── TYT / AYT / LGS resmi ders-soru sayısı matrisleri ─────────────────────
type ExamMode = 'TYT' | 'AYT' | 'LGS' | 'custom';

const TYT_SUBJECTS: { name: string; count: number }[] = [
  { name: 'Türkçe', count: 40 },
  { name: 'Tarih', count: 5 },
  { name: 'Coğrafya', count: 5 },
  { name: 'Felsefe', count: 5 },
  { name: 'Din Kültürü ve Ahlak Bilgisi', count: 5 },
  { name: 'Matematik', count: 30 },
  { name: 'Geometri', count: 10 },
  { name: 'Fizik', count: 7 },
  { name: 'Kimya', count: 7 },
  { name: 'Biyoloji', count: 6 },
];

const AYT_SUBJECTS: { name: string; count: number }[] = [
  { name: 'Türk Dili ve Edebiyatı', count: 24 },
  { name: 'Tarih-1', count: 10 },
  { name: 'Coğrafya-1', count: 6 },
  { name: 'Matematik', count: 40 },
  { name: 'Tarih-2', count: 11 },
  { name: 'Coğrafya-2', count: 11 },
  { name: 'Felsefe Grubu (Felsefe, Psikoloji, Sosyoloji, Mantık)', count: 12 },
  { name: 'Din Kültürü ve Ahlak Bilgisi-2', count: 6 },
  { name: 'Fizik', count: 14 },
  { name: 'Kimya', count: 13 },
  { name: 'Biyoloji', count: 13 },
];

const LGS_SUBJECTS: { name: string; count: number }[] = [
  { name: 'Türkçe', count: 20 },
  { name: 'T.C. İnkılap Tarihi ve Atatürkçülük', count: 10 },
  { name: 'Din Kültürü ve Ahlak Bilgisi', count: 10 },
  { name: 'Yabancı Dil', count: 10 },
  { name: 'Matematik', count: 20 },
  { name: 'Fen Bilimleri', count: 20 },
];

// Kayıt ekranındaki "Ana Branş" seçiminin, gerçek ders (subject) adlarıyla eşleşmesi
// (öğretmen sadece kendi branşıyla ilgili derslerden konu taraması oluşturabilsin diye)
const BRANCH_SUBJECT_MAP: Record<string, string[]> = {
  'Türkçe / Türk Dili ve Edebiyatı': ['Türkçe', 'Türk Dili ve Edebiyatı'],
  'Matematik / Geometri': ['Matematik', 'Geometri'],
  'Fen Bilimleri': ['Fen', 'Fen Bilimleri', 'Fizik', 'Kimya', 'Biyoloji'],
  'Sosyal Bilgiler': ['Sosyal', 'Sosyal Bilgiler'],
  Tarih: ['Tarih', 'T.C.İnkılap Tarihi ve Atatürkçülük', 'T.C. İnkılap Tarihi ve Atatürkçülük'],
  Coğrafya: ['Coğrafya'],
  Felsefe: ['Felsefe'],
  Fizik: ['Fizik'],
  Kimya: ['Kimya'],
  Biyoloji: ['Biyoloji'],
  'Din Kültürü ve Ahlak Bilgisi': ['Din Kültürü ve Ahlak Bilgisi'],
  İngilizce: ['İngilizce', 'Yabancı Dil'],
  'T.C. İnkılap Tarihi ve Atatürkçülük': ['T.C.İnkılap Tarihi ve Atatürkçülük', 'T.C. İnkılap Tarihi ve Atatürkçülük'],
  'Hayat Bilgisi': ['Hayat Bilgisi'],
};

function todayIso(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

interface SubjectBlock {
  name: string;
  count: number;
  subjectId: number | null;
}

interface QuestionOutcome {
  learningOutcomeId?: number;
  learningOutcomeLabel?: string;
  customText?: string;
}

export default function CreateExamScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const isKurum = user?.accountType === 'kurum';
  const editingExamId: number | undefined = route?.params?.examId;
  const [isEditMode] = useState(!!editingExamId);
  const [isLoadingExam, setIsLoadingExam] = useState(!!editingExamId);

  const [title, setTitle] = useState('');
  const [examDate, setExamDate] = useState(todayIso());
  const [totalScore, setTotalScore] = useState('100');
  const [optionCount, setOptionCount] = useState<3 | 4 | 5>(4);
  const [negativeMarking, setNegativeMarking] = useState(true);

  const [examMode, setExamMode] = useState<ExamMode>('custom');
  const [subjectBlocks, setSubjectBlocks] = useState<SubjectBlock[]>([]);

  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCount, setNewSubjectCount] = useState('10');

  const [correctAnswers, setCorrectAnswers] = useState<Record<string, string>>({});
  const [questionOutcomes, setQuestionOutcomes] = useState<Record<string, QuestionOutcome>>({});
  const [activeSearchQuestion, setActiveSearchQuestion] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LearningOutcome[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [relatedTytExamId, setRelatedTytExamId] = useState<number | null>(null);
  const [tytExams, setTytExams] = useState<Exam[]>([]);

  const [schools, setSchools] = useState<School[]>([]);
  const [classesBySchool, setClassesBySchool] = useState<Record<number, SchoolClass[]>>({});
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);
  const [isLoadingSchools, setIsLoadingSchools] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await getSubjects();
        setAllSubjects(data);
      } catch (error) {
        // sessiz geç
      } finally {
        setIsLoadingSubjects(false);
      }
    })();

    (async () => {
      try {
        const schoolList = await getSchools();
        setSchools(schoolList);
        for (const s of schoolList) {
          try {
            const classes = await getClassesBySchool(s.id);
            setClassesBySchool((prev) => ({ ...prev, [s.id]: classes }));
          } catch (e) {
            // sessiz geç
          }
        }
      } catch (error) {
        // sessiz geç
      } finally {
        setIsLoadingSchools(false);
      }
    })();
  }, []);

  // Düzenleme modu: mevcut sınavı çek, formu doldur (dersler yüklendikten sonra)
  useEffect(() => {
    if (!editingExamId || isLoadingSubjects) return;
    (async () => {
      try {
        const exam = await getExamById(editingExamId);
        setTitle(exam.title);
        setExamDate(exam.examDate?.slice(0, 10) || todayIso());
        setTotalScore(String(exam.totalScore ?? 100));
        setOptionCount((exam.optionCount as 3 | 4 | 5) || 4);
        setNegativeMarking(exam.negativeMarking);
        setSelectedClassIds(exam.classIds || []);

        const mode = (exam.examType as ExamMode) || 'custom';
        setExamMode(mode);
        if (exam.relatedExamId) setRelatedTytExamId(exam.relatedExamId);
        if (mode === 'AYT') loadTytExams();

        // Soruları ders bloklarına grupla (ardışık aynı subjectId = 1 blok)
        const sortedQuestions = [...(exam.questions || [])].sort(
          (a, b) => a.questionNumber - b.questionNumber
        );
        const blocks: SubjectBlock[] = [];
        const newAnswers: Record<string, string> = {};
        const newOutcomes: Record<string, QuestionOutcome> = {};

        for (const q of sortedQuestions) {
          newAnswers[String(q.questionNumber)] = q.correctAnswer;
          if (q.learningOutcomeId) {
            newOutcomes[String(q.questionNumber)] = {
              learningOutcomeId: q.learningOutcomeId,
              learningOutcomeLabel: `Kazanım #${q.learningOutcomeId} (seçili)`,
            };
          } else if (q.customOutcomeText) {
            newOutcomes[String(q.questionNumber)] = { customText: q.customOutcomeText };
          }

          const lastBlock = blocks[blocks.length - 1];
          if (lastBlock && lastBlock.subjectId === (q.subjectId ?? null)) {
            lastBlock.count += 1;
          } else {
            const subjectName =
              allSubjects.find((s) => s.id === q.subjectId)?.name || 'Ders';
            blocks.push({ name: subjectName, count: 1, subjectId: q.subjectId ?? null });
          }
        }

        setSubjectBlocks(blocks);
        setCorrectAnswers(newAnswers);
        setQuestionOutcomes(newOutcomes);
      } catch (error) {
        Alert.alert('Hata', 'Sınav bilgileri yüklenemedi.');
      } finally {
        setIsLoadingExam(false);
      }
    })();
  }, [editingExamId, isLoadingSubjects]);

  const applyExamMode = (mode: ExamMode) => {
    setExamMode(mode);
    setCorrectAnswers({});
    setQuestionOutcomes({});
    setRelatedTytExamId(null);

    let matrix: { name: string; count: number }[] = [];
    if (mode === 'TYT') matrix = TYT_SUBJECTS;
    else if (mode === 'AYT') matrix = AYT_SUBJECTS;
    else if (mode === 'LGS') matrix = LGS_SUBJECTS;

    if (mode === 'custom') {
      setSubjectBlocks([]);
    } else {
      setSubjectBlocks(matrix.map((m) => ({ name: m.name, count: m.count, subjectId: null })));
    }

    if (mode === 'AYT') {
      loadTytExams();
    }
  };

  const loadTytExams = async () => {
    try {
      const exams = await getExams();
      setTytExams(exams.filter((e: any) => e.examType === 'TYT'));
    } catch (error) {
      // sessiz geç
    }
  };

  const addExistingSubjectBlock = (subject: Subject) => {
    if (subjectBlocks.some((b) => b.subjectId === subject.id)) return;
    setSubjectBlocks((prev) => [...prev, { name: subject.name, count: 10, subjectId: subject.id }]);
  };

  const addNewSubjectBlock = async () => {
    if (!newSubjectName.trim()) return;
    const count = Math.max(1, Math.min(100, parseInt(newSubjectCount, 10) || 10));
    try {
      const created = await createSubject(newSubjectName.trim());
      setAllSubjects((prev) => [...prev, created]);
      setSubjectBlocks((prev) => [...prev, { name: created.name, count, subjectId: created.id }]);
      setNewSubjectName('');
      setNewSubjectCount('10');
    } catch (error) {
      Alert.alert('Hata', 'Ders eklenemedi. Lütfen tekrar deneyin.');
    }
  };

  const removeSubjectBlock = (index: number) => {
    setSubjectBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  const updateBlockCount = (index: number, count: string) => {
    const n = Math.max(1, Math.min(100, parseInt(count, 10) || 1));
    setSubjectBlocks((prev) => prev.map((b, i) => (i === index ? { ...b, count: n } : b)));
  };

  const flattenedQuestions = useMemo(() => {
    const list: { globalNo: number; blockIndex: number; subjectName: string }[] = [];
    let counter = 1;
    subjectBlocks.forEach((block, blockIndex) => {
      for (let i = 0; i < block.count; i++) {
        list.push({ globalNo: counter, blockIndex, subjectName: block.name });
        counter++;
      }
    });
    return list;
  }, [subjectBlocks]);

  const totalQuestions = flattenedQuestions.length;
  const letters = OPTION_LETTERS[optionCount];

  const setAnswer = (globalNo: number, letter: string) => {
    setCorrectAnswers((prev) => ({ ...prev, [String(globalNo)]: letter }));
  };

  const openOutcomeSearch = (globalNo: number) => {
    setActiveSearchQuestion(activeSearchQuestion === globalNo ? null : globalNo);
    setSearchQuery('');
    setSearchResults([]);
  };

  const runOutcomeSearch = async (globalNo: number, blockIndex: number, text: string) => {
    setSearchQuery(text);
    const block = subjectBlocks[blockIndex];
    if (!block?.subjectId || text.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await searchLearningOutcomes(block.subjectId, text.trim());
      setSearchResults(results);
    } catch (error) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectOutcome = (globalNo: number, outcome: LearningOutcome) => {
    setQuestionOutcomes((prev) => ({
      ...prev,
      [String(globalNo)]: {
        learningOutcomeId: outcome.id,
        learningOutcomeLabel: `${outcome.code} — ${outcome.description.slice(0, 40)}${
          outcome.description.length > 40 ? '…' : ''
        }`,
      },
    }));
    setActiveSearchQuestion(null);
  };

  const setCustomOutcomeText = (globalNo: number, text: string) => {
    setQuestionOutcomes((prev) => ({ ...prev, [String(globalNo)]: { customText: text } }));
  };

  const clearOutcome = (globalNo: number) => {
    setQuestionOutcomes((prev) => {
      const next = { ...prev };
      delete next[String(globalNo)];
      return next;
    });
  };

  const toggleClass = (classId: number) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
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
    if (subjectBlocks.length === 0) {
      Alert.alert(
        'Eksik bilgi',
        examMode === 'custom' ? 'En az bir ders ekleyin.' : 'Bir sorun oluştu, sınav türünü yeniden seçin.'
      );
      return;
    }
    if (examMode === 'AYT' && !relatedTytExamId) {
      Alert.alert(
        'TYT eşleştirmesi gerekli',
        'AYT sınavları TYT netleriyle birlikte puanlandığı için, bu sınavın hangi TYT sınavına ait olduğunu seçmelisiniz.'
      );
      return;
    }

    const answeredCount = flattenedQuestions.filter((q) => correctAnswers[String(q.globalNo)]).length;
    if (answeredCount < totalQuestions) {
      Alert.alert(
        'Cevap anahtarı eksik',
        `${totalQuestions} sorudan ${answeredCount} tanesinin doğru cevabını işaretlediniz. Eksik soruların doğru cevabını seçin.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const resolvedBlocks = [...subjectBlocks];
      for (let i = 0; i < resolvedBlocks.length; i++) {
        if (!resolvedBlocks[i].subjectId) {
          const existing = allSubjects.find(
            (s) => s.name.toLowerCase() === resolvedBlocks[i].name.toLowerCase()
          );
          if (existing) {
            resolvedBlocks[i].subjectId = existing.id;
          } else {
            const created = await createSubject(resolvedBlocks[i].name);
            setAllSubjects((prev) => [...prev, created]);
            resolvedBlocks[i].subjectId = created.id;
          }
        }
      }

      const questions = flattenedQuestions.map((q) => {
        const outcome = questionOutcomes[String(q.globalNo)];
        return {
          questionNumber: q.globalNo,
          subjectId: resolvedBlocks[q.blockIndex].subjectId!,
          learningOutcomeId: outcome?.learningOutcomeId,
          customOutcomeText: outcome?.customText,
          correctAnswer: correctAnswers[String(q.globalNo)],
        };
      });

      const payload = {
        title: title.trim(),
        subjectId: resolvedBlocks.length === 1 ? resolvedBlocks[0].subjectId! : undefined,
        examDate,
        totalQuestions,
        correctAnswers,
        optionCount,
        negativeMarking,
        examType: examMode,
        relatedExamId: examMode === 'AYT' ? relatedTytExamId! : undefined,
        totalScore: Math.max(1, parseInt(totalScore, 10) || 100),
        classIds: selectedClassIds,
        questions,
      };

      if (isEditMode && editingExamId) {
        await updateExam(editingExamId, payload);
      } else {
        await createExam(payload);
      }

      Alert.alert('Başarılı', isEditMode ? 'Sınav güncellendi.' : 'Sınav oluşturuldu.', [
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

  if (isLoadingExam) {
    return (
      <SafeAreaView style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#4A6CF7" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>‹ Geri</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{isEditMode ? 'Sınavı Düzenle' : 'Yeni Sınav Oluştur'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Sınav Başlığı</Text>
        <TextInput
          style={styles.input}
          placeholder="Örn. 1. Dönem Genel Deneme"
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

        {isKurum ? (
          <>
            <Text style={[styles.label, { marginTop: 20 }]}>Sınav Türü</Text>
            <View style={styles.modeRow}>
              {(['TYT', 'AYT', 'LGS', 'custom'] as ExamMode[]).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.modeButton, examMode === mode && styles.modeButtonActive]}
                  onPress={() => applyExamMode(mode)}
                  disabled={isSubmitting}
                >
                  <Text style={[styles.modeButtonText, examMode === mode && styles.modeButtonTextActive]}>
                    {mode === 'custom' ? 'Konu Taraması' : mode}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <Text style={[styles.helperText, { marginTop: 20 }]}>
            Bu hesap türü sadece Konu Taraması testi oluşturabilir (kendi branşınız). TYT/AYT/LGS
            denemesi hazırlamak Kurum hesaplarına özeldir.
          </Text>
        )}

        {examMode === 'AYT' && (
          <View style={styles.tytLinkBox}>
            <Text style={styles.label}>Hangi TYT sınavının netleriyle birlikte puanlanacak?</Text>
            {tytExams.length === 0 ? (
              <Text style={styles.helperText}>
                Henüz tanımlı bir TYT sınavı yok. Önce TYT sınavını oluşturun.
              </Text>
            ) : (
              <View style={styles.chipRow}>
                {tytExams.map((e) => (
                  <TouchableOpacity
                    key={e.id}
                    style={[styles.chip, relatedTytExamId === e.id && styles.chipActive]}
                    onPress={() => setRelatedTytExamId(e.id)}
                  >
                    <Text style={[styles.chipText, relatedTytExamId === e.id && styles.chipTextActive]}>
                      {e.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {examMode === 'custom' && (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.label}>Dersler</Text>
            {isLoadingSubjects ? (
              <ActivityIndicator color="#4A6CF7" />
            ) : (
              <View style={styles.chipRow}>
                {allSubjects
                  .filter((s) => !subjectBlocks.some((b) => b.subjectId === s.id))
                  .filter((s) => {
                    if (isKurum) return true; // Kurum tüm derslerden test oluşturabilir
                    const allowedNames = [
                      ...(user?.mainBranch ? BRANCH_SUBJECT_MAP[user.mainBranch] || [user.mainBranch] : []),
                      ...(user?.secondaryBranch ? BRANCH_SUBJECT_MAP[user.secondaryBranch] || [user.secondaryBranch] : []),
                    ];
                    return allowedNames.length === 0 || allowedNames.includes(s.name);
                  })
                  .map((s) => (
                    <TouchableOpacity key={s.id} style={styles.chip} onPress={() => addExistingSubjectBlock(s)}>
                      <Text style={styles.chipText}>+ {s.name}</Text>
                    </TouchableOpacity>
                  ))}
              </View>
            )}
            <View style={styles.addSubjectRow}>
              <TextInput
                style={styles.addSubjectInput}
                placeholder="Yeni ders adı"
                value={newSubjectName}
                onChangeText={setNewSubjectName}
              />
              <TextInput
                style={styles.addSubjectCountInput}
                placeholder="Soru"
                value={newSubjectCount}
                onChangeText={setNewSubjectCount}
                keyboardType="number-pad"
              />
              <TouchableOpacity style={styles.addSubjectButton} onPress={addNewSubjectBlock}>
                <Text style={styles.addSubjectButtonText}>Ekle</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {subjectBlocks.length > 0 && (
          <View style={{ marginTop: 16 }}>
            {subjectBlocks.map((block, index) => (
              <View key={index} style={styles.subjectBlockHeader}>
                <Text style={styles.subjectBlockName}>{block.name}</Text>
                {examMode === 'custom' ? (
                  <View style={styles.subjectBlockCountRow}>
                    <TextInput
                      style={styles.subjectBlockCountInput}
                      value={String(block.count)}
                      onChangeText={(t) => updateBlockCount(index, t)}
                      keyboardType="number-pad"
                    />
                    <Text style={styles.helperText}> soru</Text>
                    <TouchableOpacity onPress={() => removeSubjectBlock(index)} style={{ marginLeft: 8 }}>
                      <Text style={{ color: '#EF4444', fontWeight: '700' }}>Kaldır</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={styles.helperText}>{block.count} soru</Text>
                )}
              </View>
            ))}
          </View>
        )}

        <Text style={styles.label}>Seçenek Sayısı</Text>
        <View style={styles.optionCountRow}>
          {[3, 4, 5].map((n) => (
            <TouchableOpacity
              key={n}
              style={[styles.optionCountButton, optionCount === n && styles.optionCountButtonActive]}
              onPress={() => setOptionCount(n as 3 | 4 | 5)}
              disabled={isSubmitting}
            >
              <Text style={[styles.optionCountText, optionCount === n && styles.optionCountTextActive]}>
                {n} Seçenekli
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Yanlışlar Doğruyu Eksiltsin</Text>
          </View>
          <Switch value={negativeMarking} onValueChange={setNegativeMarking} disabled={isSubmitting} />
        </View>

        <Text style={styles.label}>Sınavın Tam Puanı</Text>
        <TextInput
          style={styles.input}
          value={totalScore}
          onChangeText={setTotalScore}
          keyboardType="number-pad"
          editable={!isSubmitting}
        />
        <Text style={styles.helperText}>Tüm sorular doğru olursa öğrenci bu puanı alır (varsayılan 100).</Text>

        <Text style={[styles.label, { marginTop: 20 }]}>Hangi Sınıflara Uygulanacak</Text>
        {isLoadingSchools ? (
          <ActivityIndicator color="#4A6CF7" />
        ) : schools.length === 0 ? (
          <Text style={styles.helperText}>
            Henüz tanımlı okul/sınıf yok. Web panelinden okul ve sınıf ekleyebilirsiniz.
          </Text>
        ) : (
          schools.map((school) => (
            <View key={school.id} style={{ marginBottom: 8 }}>
              <Text style={styles.schoolName}>{school.name}</Text>
              <View style={styles.chipRow}>
                {(classesBySchool[school.id] || []).map((cls) => (
                  <TouchableOpacity
                    key={cls.id}
                    style={[styles.chip, selectedClassIds.includes(cls.id) && styles.chipActive]}
                    onPress={() => toggleClass(cls.id)}
                  >
                    <Text
                      style={[styles.chipText, selectedClassIds.includes(cls.id) && styles.chipTextActive]}
                    >
                      {cls.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        )}

        {totalQuestions > 0 && (
          <>
            <Text style={[styles.label, { marginTop: 20 }]}>Cevap Anahtarı ve Kazanımlar</Text>
            <Text style={styles.helperText}>
              Her sorunun doğru cevabını seçin (
              {Object.keys(correctAnswers).filter((k) => Number(k) <= totalQuestions).length}/{totalQuestions}{' '}
              tamamlandı). Kazanım seçimi isteğe bağlıdır.
            </Text>

            <View style={styles.answersGrid}>
              {flattenedQuestions.map((q) => {
                const outcome = questionOutcomes[String(q.globalNo)];
                return (
                  <View key={q.globalNo} style={styles.answerBlock}>
                    <View style={styles.answerRow}>
                      <View style={{ width: 70 }}>
                        <Text style={styles.answerQuestionNo}>{q.globalNo}.</Text>
                        <Text style={styles.answerSubjectLabel} numberOfLines={1}>
                          {q.subjectName}
                        </Text>
                      </View>
                      <View style={styles.answerLetters}>
                        {letters.map((letter) => (
                          <TouchableOpacity
                            key={letter}
                            style={[
                              styles.letterButton,
                              correctAnswers[String(q.globalNo)] === letter && styles.letterButtonActive,
                            ]}
                            onPress={() => setAnswer(q.globalNo, letter)}
                            disabled={isSubmitting}
                          >
                            <Text
                              style={[
                                styles.letterText,
                                correctAnswers[String(q.globalNo)] === letter && styles.letterTextActive,
                              ]}
                            >
                              {letter}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <TouchableOpacity style={styles.outcomeButton} onPress={() => openOutcomeSearch(q.globalNo)}>
                      <Text style={styles.outcomeButtonText} numberOfLines={1}>
                        {outcome?.learningOutcomeLabel ||
                          outcome?.customText ||
                          '🎯 Kazanım seç veya yaz (isteğe bağlı)'}
                      </Text>
                      {outcome && (
                        <TouchableOpacity onPress={() => clearOutcome(q.globalNo)}>
                          <Text style={{ color: '#EF4444', fontWeight: '700', marginLeft: 8 }}>✕</Text>
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>

                    {activeSearchQuestion === q.globalNo && (
                      <View style={styles.outcomeSearchBox}>
                        <TextInput
                          style={styles.outcomeSearchInput}
                          placeholder="Kazanım ara (en az 2 harf)..."
                          value={searchQuery}
                          onChangeText={(t) => runOutcomeSearch(q.globalNo, q.blockIndex, t)}
                          autoFocus
                        />
                        {isSearching && <ActivityIndicator color="#4A6CF7" style={{ marginTop: 6 }} />}
                        {searchResults.map((r) => (
                          <TouchableOpacity
                            key={r.id}
                            style={styles.outcomeResultRow}
                            onPress={() => selectOutcome(q.globalNo, r)}
                          >
                            <Text style={styles.outcomeResultCode}>{r.code}</Text>
                            <Text style={styles.outcomeResultText} numberOfLines={2}>
                              {r.description}
                            </Text>
                          </TouchableOpacity>
                        ))}
                        {searchQuery.trim().length >= 2 && !isSearching && (
                          <TouchableOpacity
                            style={styles.outcomeCustomButton}
                            onPress={() => {
                              setCustomOutcomeText(q.globalNo, searchQuery.trim());
                              setActiveSearchQuestion(null);
                            }}
                          >
                            <Text style={styles.outcomeCustomButtonText}>
                              "{searchQuery.trim()}" olarak kendim yazayım
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
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
            <Text style={styles.submitButtonText}>{isEditMode ? 'Sınavı Güncelle' : 'Sınavı Oluştur'}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF' },
  header: {
    padding: 20,
    paddingTop: 12,
    backgroundColor: '#4A6CF7',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButtonText: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  content: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 16 },
  helperText: { fontSize: 12, color: '#888', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  modeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  modeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modeButtonActive: { backgroundColor: '#4A6CF7', borderColor: '#4A6CF7' },
  modeButtonText: { fontSize: 13, fontWeight: '700', color: '#333' },
  modeButtonTextActive: { color: '#fff' },
  tytLinkBox: { marginTop: 12, backgroundColor: '#FFF7E6', borderRadius: 12, padding: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  chipActive: { backgroundColor: '#4A6CF7', borderColor: '#4A6CF7' },
  chipText: { fontSize: 13, color: '#333', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  addSubjectRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 10 },
  addSubjectInput: {
    flex: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    backgroundColor: '#fff',
  },
  addSubjectCountInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    backgroundColor: '#fff',
  },
  addSubjectButton: { backgroundColor: '#4A6CF7', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  addSubjectButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  subjectBlockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
  },
  subjectBlockName: { fontSize: 14, fontWeight: '600', color: '#333' },
  subjectBlockCountRow: { flexDirection: 'row', alignItems: 'center' },
  subjectBlockCountInput: {
    width: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 13,
    textAlign: 'center',
    backgroundColor: '#FAFAFA',
  },
  optionCountRow: { flexDirection: 'row', gap: 8 },
  optionCountButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  optionCountButtonActive: { backgroundColor: '#4A6CF7', borderColor: '#4A6CF7' },
  optionCountText: { fontSize: 13, fontWeight: '600', color: '#333' },
  optionCountTextActive: { color: '#fff' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
  },
  schoolName: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 6 },
  answersGrid: { gap: 10 },
  answerBlock: { backgroundColor: '#fff', borderRadius: 12, padding: 10 },
  answerRow: { flexDirection: 'row', alignItems: 'center' },
  answerQuestionNo: { fontSize: 14, fontWeight: '700', color: '#333' },
  answerSubjectLabel: { fontSize: 10, color: '#999' },
  answerLetters: { flexDirection: 'row', gap: 6, flex: 1 },
  letterButton: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F5F5F5', alignItems: 'center' },
  letterButtonActive: { backgroundColor: '#4A6CF7' },
  letterText: { fontSize: 13, fontWeight: '700', color: '#666' },
  letterTextActive: { color: '#fff' },
  outcomeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    backgroundColor: '#F0F4FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  outcomeButtonText: { fontSize: 12, color: '#4A6CF7', flex: 1 },
  outcomeSearchBox: { marginTop: 8, backgroundColor: '#FAFAFA', borderRadius: 8, padding: 8 },
  outcomeSearchInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    backgroundColor: '#fff',
  },
  outcomeResultRow: { marginTop: 6, paddingVertical: 6, paddingHorizontal: 8, backgroundColor: '#fff', borderRadius: 6 },
  outcomeResultCode: { fontSize: 11, fontWeight: '700', color: '#4A6CF7' },
  outcomeResultText: { fontSize: 12, color: '#333' },
  outcomeCustomButton: { marginTop: 8, paddingVertical: 8, alignItems: 'center' },
  outcomeCustomButtonText: { fontSize: 12, color: '#4A6CF7', fontWeight: '600' },
  submitButton: { backgroundColor: '#4A6CF7', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 28 },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
