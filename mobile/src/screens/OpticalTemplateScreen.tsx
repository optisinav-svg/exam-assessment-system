import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Dimensions,
  PanResponder,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function OpticalTemplateScreen({ navigation }: any) {
  const { colors, mode } = useTheme();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Oluşturma / Düzenleme Modu
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [templateType, setTemplateType] = useState<'4_choice' | '5_choice'>('5_choice');
  const [previewImage, setPreviewImage] = useState<string>('');
  const [imageWidth, setImageWidth] = useState(1200);
  const [imageHeight, setImageHeight] = useState(1600);

  // İşaretlenen Alanlar
  const [corners, setCorners] = useState<{ x: number; y: number }[] | null>(null);
  const [nameBlock, setNameBlock] = useState<any>(null);
  const [studentNoBlock, setStudentNoBlock] = useState<any>(null);
  const [answerBlocks, setAnswerBlocks] = useState<any[]>([]);

  // Aktif Araç ve Çizim Durumu
  const [activeTool, setActiveTool] = useState<'none' | 'name' | 'studentNo' | 'answer' | 'corners'>('none');
  const [tempRect, setTempRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [tempCorners, setTempCorners] = useState<{ x: number; y: number }[]>([]);
  const [imageLayout, setImageLayout] = useState<{ width: number; height: number }>({ width: 300, height: 400 });

  // Cevap Alanı Modal Parametreleri
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [pendingAnswerRect, setPendingAnswerRect] = useState<any>(null);
  const [subjectLabel, setSubjectLabel] = useState('Türkçe');
  const [startQuestion, setStartQuestion] = useState(1);
  const [questionCount, setQuestionCount] = useState(20);
  const [optionCount, setOptionCount] = useState(5);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/optical-templates');
      setTemplates(res.data.templates || res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Şablonlar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartNew = () => {
    setIsEditing(true);
    setEditingId(null);
    setName('');
    setTemplateType('5_choice');
    setPreviewImage('');
    setCorners(null);
    setNameBlock(null);
    setStudentNoBlock(null);
    setAnswerBlocks([]);
    setActiveTool('none');
    setError('');
    setSuccess('');
  };

  const handleEditTemplate = (tmpl: any) => {
    setIsEditing(true);
    setEditingId(tmpl.id);
    setName(tmpl.name);
    setTemplateType(tmpl.type || '5_choice');
    setPreviewImage(tmpl.previewImage || '');
    const fields = tmpl.fields || {};
    setImageWidth(fields.imageWidth || 1200);
    setImageHeight(fields.imageHeight || 1600);
    setCorners(fields.corners || null);
    setNameBlock(fields.nameBlock || null);
    setStudentNoBlock(fields.studentNoBlock || null);
    setAnswerBlocks(fields.answerBlocks || []);
    setActiveTool('none');
    setError('');
    setSuccess('');
  };

  const handleDeleteTemplate = async (id: number) => {
    Alert.alert('Sil', 'Bu şablonu silmek istediğinize emin misiniz?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/optical-templates/${id}`);
            setSuccess('Şablon silindi.');
            fetchTemplates();
          } catch (err: any) {
            setError(err.response?.data?.message || 'Silinemedi.');
          }
        },
      },
    ]);
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('İzin Gerekli', 'Fotoğraf seçmek için galeri izni gereklidir.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const base64Uri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
      setPreviewImage(base64Uri);
      setImageWidth(asset.width || 1200);
      setImageHeight(asset.height || 1600);
    }
  };

  // PanResponder ile görsel üzerinde sürükle-bırak dikdörtgen çizme
  let startX = 0;
  let startY = 0;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => activeTool !== 'none' && activeTool !== 'corners',
    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      startX = Math.round((locationX / imageLayout.width) * imageWidth);
      startY = Math.round((locationY / imageLayout.height) * imageHeight);
      setTempRect({ x: startX, y: startY, width: 0, height: 0 });
    },
    onPanResponderMove: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      const currentX = Math.round((locationX / imageLayout.width) * imageWidth);
      const currentY = Math.round((locationY / imageLayout.height) * imageHeight);

      const x = Math.min(startX, currentX);
      const y = Math.min(startY, currentY);
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);

      setTempRect({ x, y, width, height });
    },
    onPanResponderRelease: () => {
      if (!tempRect || tempRect.width < 20 || tempRect.height < 20) {
        setTempRect(null);
        return;
      }

      if (activeTool === 'name') {
        setNameBlock({ ...tempRect, rows: 26, cols: 15 });
        setActiveTool('none');
      } else if (activeTool === 'studentNo') {
        setStudentNoBlock({ ...tempRect, rows: 10, cols: 6 });
        setActiveTool('none');
      } else if (activeTool === 'answer') {
        setPendingAnswerRect(tempRect);
        setShowAnswerModal(true);
        setActiveTool('none');
      }
      setTempRect(null);
    },
  });

  const handleImageTouch = (evt: any) => {
    if (activeTool !== 'corners') return;
    const { locationX, locationY } = evt.nativeEvent;
    const x = Math.round((locationX / imageLayout.width) * imageWidth);
    const y = Math.round((locationY / imageLayout.height) * imageHeight);

    const updated = [...tempCorners, { x, y }];
    setTempCorners(updated);
    if (updated.length === 4) {
      setCorners(updated);
      setTempCorners([]);
      setActiveTool('none');
      Alert.alert('Başarılı', '4 köşe başarıyla işaretlendi.');
    }
  };

  const handleSaveAnswerBlock = () => {
    if (!pendingAnswerRect) return;
    const newBlock = {
      subjectLabel,
      startQuestion: Number(startQuestion),
      questionCount: Number(questionCount),
      optionCount: Number(optionCount),
      ...pendingAnswerRect,
    };
    setAnswerBlocks([...answerBlocks, newBlock]);
    setShowAnswerModal(false);
    setPendingAnswerRect(null);
  };

  const handleSaveTemplate = async () => {
    if (!name.trim()) {
      Alert.alert('Hata', 'Lütfen şablon adını girin.');
      return;
    }
    if (!previewImage) {
      Alert.alert('Hata', 'Lütfen boş form görseli seçin.');
      return;
    }

    const fields = {
      imageWidth,
      imageHeight,
      corners,
      nameBlock,
      studentNoBlock,
      answerBlocks,
    };

    const payload = {
      name: name.trim(),
      type: templateType,
      fields,
      previewImage,
    };

    try {
      if (editingId) {
        await api.put(`/optical-templates/${editingId}`, payload);
      } else {
        await api.post('/optical-templates', payload);
      }
      Alert.alert('Başarılı', 'Optik şablon kaydedildi.');
      setIsEditing(false);
      fetchTemplates();
    } catch (err: any) {
      Alert.alert('Hata', err.response?.data?.message || 'Kaydedilemedi.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🖨️ Optik Şablonlar</Text>
        {!isEditing && (
          <TouchableOpacity onPress={handleStartNew} style={styles.newButton}>
            <Text style={styles.newButtonText}>+ Yeni</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {error ? <Text style={styles.errorText}>⚠️ {error}</Text> : null}
        {success ? <Text style={styles.successText}>✅ {success}</Text> : null}

        {isEditing ? (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {editingId ? 'Şablonu Düzenle' : 'Yeni Şablon Tanımla'}
            </Text>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Şablon Adı</Text>
            <TextInput
              style={[styles.input, { backgroundColor: mode === 'dark' ? '#374151' : '#F9FAFB', color: colors.text, borderColor: colors.border }]}
              value={name}
              onChangeText={setName}
              placeholder="Örn: TYT Optik Formu"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Şablon Türü</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeButton, templateType === '5_choice' && styles.typeButtonActive]}
                onPress={() => setTemplateType('5_choice')}
              >
                <Text style={[styles.typeButtonText, templateType === '5_choice' && styles.typeButtonTextActive]}>5 Seçenekli</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, templateType === '4_choice' && styles.typeButtonActive]}
                onPress={() => setTemplateType('4_choice')}
              >
                <Text style={[styles.typeButtonText, templateType === '4_choice' && styles.typeButtonTextActive]}>4 Seçenekli</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.pickImageButton} onPress={handlePickImage}>
              <Text style={styles.pickImageButtonText}>📷 Boş Form Fotoğrafı Seç</Text>
            </TouchableOpacity>

            {previewImage ? (
              <View style={styles.previewContainer}>
                <View style={styles.toolsRow}>
                  <TouchableOpacity
                    style={[styles.toolBtn, activeTool === 'name' && styles.toolBtnActive]}
                    onPress={() => setActiveTool('name')}
                  >
                    <Text style={styles.toolBtnText}>{nameBlock ? '✓ İsim' : '+ İsim Alanı'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.toolBtn, activeTool === 'studentNo' && styles.toolBtnActive]}
                    onPress={() => setActiveTool('studentNo')}
                  >
                    <Text style={styles.toolBtnText}>{studentNoBlock ? '✓ No' : '+ Öğrenci No'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.toolBtn, activeTool === 'answer' && styles.toolBtnActive]}
                    onPress={() => setActiveTool('answer')}
                  >
                    <Text style={styles.toolBtnText}>+ Cevap ({answerBlocks.length})</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.toolBtn, activeTool === 'corners' && styles.toolBtnActive]}
                    onPress={() => { setActiveTool('corners'); setTempCorners([]); }}
                  >
                    <Text style={styles.toolBtnText}>{corners ? '✓ 4 Köşe' : `4 Köşe (${tempCorners.length}/4)`}</Text>
                  </TouchableOpacity>
                </View>

                {activeTool !== 'none' && (
                  <Text style={styles.activeToolHint}>
                    {activeTool === 'corners' ? 'Formun 4 köşesine sırasıyla dokunun.' : 'Üzerine parmağınızla sürükleyerek dikdörtgen çizin.'}
                  </Text>
                )}

                <View
                  style={styles.imageWrapper}
                  onLayout={(e) => {
                    const { width, height } = e.nativeEvent.layout;
                    setImageLayout({ width, height });
                  }}
                  onTouchEnd={handleImageTouch}
                  {...panResponder.panHandlers}
                >
                  <Image source={{ uri: previewImage }} style={styles.formImage} resizeMode="contain" />

                  {/* Name Block Overlay */}
                  {nameBlock && (
                    <View
                      style={[
                        styles.overlayBox,
                        {
                          left: `${(nameBlock.x / imageWidth) * 100}%`,
                          top: `${(nameBlock.y / imageHeight) * 100}%`,
                          width: `${(nameBlock.width / imageWidth) * 100}%`,
                          height: `${(nameBlock.height / imageHeight) * 100}%`,
                          borderColor: '#3B82F6',
                          backgroundColor: 'rgba(59, 130, 246, 0.3)',
                        },
                      ]}
                    >
                      <Text style={styles.overlayText}>İsim</Text>
                    </View>
                  )}

                  {/* Student No Block Overlay */}
                  {studentNoBlock && (
                    <View
                      style={[
                        styles.overlayBox,
                        {
                          left: `${(studentNoBlock.x / imageWidth) * 100}%`,
                          top: `${(studentNoBlock.y / imageHeight) * 100}%`,
                          width: `${(studentNoBlock.width / imageWidth) * 100}%`,
                          height: `${(studentNoBlock.height / imageHeight) * 100}%`,
                          borderColor: '#8B5CF6',
                          backgroundColor: 'rgba(139, 92, 246, 0.3)',
                        },
                      ]}
                    >
                      <Text style={styles.overlayText}>Öğrenci No</Text>
                    </View>
                  )}

                  {/* Answer Blocks Overlays */}
                  {answerBlocks.map((b, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.overlayBox,
                        {
                          left: `${(b.x / imageWidth) * 100}%`,
                          top: `${(b.y / imageHeight) * 100}%`,
                          width: `${(b.width / imageWidth) * 100}%`,
                          height: `${(b.height / imageHeight) * 100}%`,
                          borderColor: '#10B981',
                          backgroundColor: 'rgba(16, 185, 129, 0.3)',
                        },
                      ]}
                    >
                      <Text style={styles.overlayText}>{b.subjectLabel}</Text>
                    </View>
                  ))}

                  {/* Temp Rect */}
                  {tempRect && (
                    <View
                      style={[
                        styles.overlayBox,
                        {
                          left: `${(tempRect.x / imageWidth) * 100}%`,
                          top: `${(tempRect.y / imageHeight) * 100}%`,
                          width: `${(tempRect.width / imageWidth) * 100}%`,
                          height: `${(tempRect.height / imageHeight) * 100}%`,
                          borderColor: '#EF4444',
                          backgroundColor: 'rgba(239, 68, 68, 0.3)',
                        },
                      ]}
                    />
                  )}
                </View>

                <TouchableOpacity
                  style={styles.clearBlocksButton}
                  onPress={() => { setNameBlock(null); setStudentNoBlock(null); setAnswerBlocks([]); setCorners(null); }}
                >
                  <Text style={styles.clearBlocksText}>Tüm İşaretlemeleri Temizle</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.editActionRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditing(false)}>
                <Text style={styles.cancelBtnText}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveTemplate}>
                <Text style={styles.saveBtnText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View>
            {loading ? (
              <ActivityIndicator size="large" color="#4A6CF7" style={{ marginTop: 30 }} />
            ) : templates.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Henüz kayıtlı optik şablonunuz yok.</Text>
                <TouchableOpacity style={styles.pickImageButton} onPress={handleStartNew}>
                  <Text style={styles.pickImageButtonText}>+ Yeni Şablon Tanımla</Text>
                </TouchableOpacity>
              </View>
            ) : (
              templates.map((tmpl) => (
                <View key={tmpl.id} style={[styles.templateCard, { backgroundColor: colors.card }]}>
                  {tmpl.previewImage ? (
                    <Image source={{ uri: tmpl.previewImage }} style={styles.tmplThumb} resizeMode="contain" />
                  ) : null}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.tmplTitle, { color: colors.text }]}>{tmpl.name}</Text>
                    <Text style={[styles.tmplSub, { color: colors.textSecondary }]}>
                      {tmpl.type === '4_choice' ? '4 Seçenekli' : '5 Seçenekli'} · {(tmpl.fields?.answerBlocks || []).length} Ders Alanı
                    </Text>
                    <View style={styles.tmplActionRow}>
                      <TouchableOpacity onPress={() => handleEditTemplate(tmpl)} style={styles.tmplEditBtn}>
                        <Text style={styles.tmplEditTxt}>Düzenle</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteTemplate(tmpl.id)} style={styles.tmplDelBtn}>
                        <Text style={styles.tmplDelTxt}>Sil</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Cevap Alanı Ekleme Modalı */}
      <Modal visible={showAnswerModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Cevap Alanı Detayları</Text>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Ders Adı</Text>
            <TextInput
              style={[styles.input, { backgroundColor: mode === 'dark' ? '#374151' : '#F9FAFB', color: colors.text, borderColor: colors.border }]}
              value={subjectLabel}
              onChangeText={setSubjectLabel}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Başlangıç Soru No</Text>
            <TextInput
              style={[styles.input, { backgroundColor: mode === 'dark' ? '#374151' : '#F9FAFB', color: colors.text, borderColor: colors.border }]}
              value={String(startQuestion)}
              onChangeText={(v) => setStartQuestion(Number(v))}
              keyboardType="numeric"
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Toplam Soru Sayısı</Text>
            <TextInput
              style={[styles.input, { backgroundColor: mode === 'dark' ? '#374151' : '#F9FAFB', color: colors.text, borderColor: colors.border }]}
              value={String(questionCount)}
              onChangeText={(v) => setQuestionCount(Number(v))}
              keyboardType="numeric"
            />

            <View style={styles.editActionRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAnswerModal(false)}>
                <Text style={styles.cancelBtnText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveAnswerBlock}>
                <Text style={styles.saveBtnText}>Ekle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: { color: '#fff', fontSize: 16, fontWeight: '600' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  newButton: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  newButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  content: { padding: 16 },
  errorText: { color: '#EF4444', marginBottom: 12, fontSize: 14 },
  successText: { color: '#10B981', marginBottom: 12, fontSize: 14 },
  card: { borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 10 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  typeRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  typeButton: { flex: 1, paddingVertical: 10, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, alignItems: 'center' },
  typeButtonActive: { backgroundColor: '#4A6CF7', borderColor: '#4A6CF7' },
  typeButtonText: { fontSize: 14, color: '#4B5563', fontWeight: '500' },
  typeButtonTextActive: { color: '#fff', fontWeight: '600' },
  pickImageButton: { backgroundColor: '#8B5CF6', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 16 },
  pickImageButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  previewContainer: { marginTop: 16 },
  toolsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  toolBtn: { backgroundColor: '#E0E7FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  toolBtnActive: { backgroundColor: '#4A6CF7' },
  toolBtnText: { fontSize: 12, color: '#1E40AF', fontWeight: '600' },
  activeToolHint: { fontSize: 12, color: '#D97706', marginBottom: 8, fontWeight: '500' },
  imageWrapper: { width: '100%', height: 350, backgroundColor: '#111', borderRadius: 8, overflow: 'hidden', position: 'relative' },
  formImage: { width: '100%', height: '100%' },
  overlayBox: { position: 'absolute', borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  overlayText: { color: '#fff', fontSize: 10, fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 2 },
  clearBlocksButton: { marginTop: 10, backgroundColor: '#FEE2E2', padding: 8, borderRadius: 8, alignItems: 'center' },
  clearBlocksText: { color: '#B91C1C', fontSize: 12, fontWeight: '600' },
  editActionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB' },
  cancelBtnText: { fontSize: 14, color: '#4B5563' },
  saveBtn: { backgroundColor: '#4A6CF7', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  saveBtnText: { fontSize: 14, color: '#fff', fontWeight: '600' },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 15, marginBottom: 16 },
  templateCard: { flexDirection: 'row', padding: 12, borderRadius: 12, marginBottom: 12, alignItems: 'center', gap: 12 },
  tmplThumb: { width: 60, height: 80, backgroundColor: '#eee', borderRadius: 6 },
  tmplTitle: { fontSize: 16, fontWeight: 'bold' },
  tmplSub: { fontSize: 13, marginTop: 2 },
  tmplActionRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  tmplEditBtn: { backgroundColor: '#E0E7FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  tmplEditTxt: { color: '#1E40AF', fontSize: 12, fontWeight: '600' },
  tmplDelBtn: { backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  tmplDelTxt: { color: '#B91C1C', fontSize: 12, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 16, padding: 20 },
});
