import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect } from '@react-navigation/native';
import { deleteStoredFile, getStorageStats, getStoredFiles, StoredFile, uploadStoredFile } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function DosyalarimScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [stats, setStats] = useState({ totalFiles: 0, totalSizeFormatted: '0 B' });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const loadFiles = async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    try {
      const [list, storageStats] = await Promise.all([getStoredFiles(), getStorageStats()]);
      setFiles(list.files || []);
      setStats({ totalFiles: storageStats.totalFiles || list.total || 0, totalSizeFormatted: storageStats.totalSizeFormatted || '0 B' });
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Dosyalar yüklenemedi.');
    } finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { loadFiles(); }, []));

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false, type: '*/*' });
      if (result.canceled || !result.assets?.[0]) return;
      const file = result.assets[0];
      setUploading(true);
      await uploadStoredFile(file.uri, file.name || 'dosya', file.mimeType || 'application/octet-stream');
      Alert.alert('Başarılı', 'Dosyanız yüklendi.');
      await loadFiles(true);
    } catch (err: any) {
      Alert.alert('Hata', err.response?.data?.message || 'Dosya yüklenemedi.');
    } finally { setUploading(false); }
  };

  const removeFile = (file: StoredFile) => {
    Alert.alert('Dosyayı Sil', `${file.originalName || file.fileName} silinsin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => { try { await deleteStoredFile(file.id); await loadFiles(true); } catch (err: any) { Alert.alert('Hata', err.response?.data?.message || 'Dosya silinemedi.'); } } },
    ]);
  };

  const formatDate = (value: string) => { try { return new Date(value).toLocaleDateString('tr-TR'); } catch { return ''; } };
  const iconFor = (mime: string) => mime.includes('pdf') ? '📄' : mime.startsWith('image/') ? '🖼️' : mime.includes('sheet') || mime.includes('excel') ? '📊' : '📁';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}><TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Geri</Text></TouchableOpacity><Text style={styles.headerTitle}>🗂️ Dosyalarım</Text><TouchableOpacity onPress={pickFile}><Text style={styles.addText}>+ Yükle</Text></TouchableOpacity></View>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadFiles(true)} tintColor={colors.primary} />}>
        {loading ? <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 30 }} /> : <>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.statRow}><View style={[styles.statCard, { backgroundColor: colors.card }]}><Text style={styles.statIcon}>📁</Text><Text style={[styles.statValue, { color: colors.primary }]}>{stats.totalFiles}</Text><Text style={[styles.statLabel, { color: colors.textSecondary }]}>Toplam Dosya</Text></View><View style={[styles.statCard, { backgroundColor: colors.card }]}><Text style={styles.statIcon}>💾</Text><Text style={[styles.statValue, { color: '#059669' }]}>{stats.totalSizeFormatted}</Text><Text style={[styles.statLabel, { color: colors.textSecondary }]}>Kullanılan Alan</Text></View></View>
          <TouchableOpacity style={styles.uploadButton} onPress={pickFile} disabled={uploading}>{uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.uploadText}>＋ Cihazdan Dosya Seç</Text>}</TouchableOpacity>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Dosyalar</Text>
          {files.length === 0 ? <View style={styles.empty}><Text style={[styles.emptyText, { color: colors.textSecondary }]}>Henüz yüklenmiş dosyanız yok.</Text></View> : files.map((file) => <View key={file.id} style={[styles.fileCard, { backgroundColor: colors.card }]}><Text style={styles.fileIcon}>{iconFor(file.mimeType)}</Text><View style={{ flex: 1 }}><Text numberOfLines={1} style={[styles.fileName, { color: colors.text }]}>{file.originalName || file.fileName}</Text><Text style={[styles.fileMeta, { color: colors.textSecondary }]}>{file.formattedSize || `${Math.round(file.fileSize / 1024)} KB`} · {formatDate(file.createdAt)}</Text>{file.category ? <Text style={[styles.category, { color: colors.primary }]}>{file.category}</Text> : null}</View><TouchableOpacity onPress={() => removeFile(file)}><Text style={styles.deleteText}>Sil</Text></TouchableOpacity></View>)}
        </>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 }, back: { color: '#fff', fontSize: 16, fontWeight: '600' }, headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' }, addText: { color: '#fff', fontSize: 15, fontWeight: '700' }, content: { padding: 16, paddingBottom: 36 }, error: { color: '#DC2626', marginBottom: 12 }, statRow: { flexDirection: 'row', gap: 10, marginBottom: 14 }, statCard: { flex: 1, borderRadius: 14, padding: 14, elevation: 1 }, statIcon: { fontSize: 21, marginBottom: 5 }, statValue: { fontSize: 21, fontWeight: '800' }, statLabel: { fontSize: 12, marginTop: 3 }, uploadButton: { backgroundColor: '#4A6CF7', borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginBottom: 20 }, uploadText: { color: '#fff', fontWeight: '700' }, sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 10 }, fileCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 13, marginBottom: 9, elevation: 1 }, fileIcon: { fontSize: 28, marginRight: 11 }, fileName: { fontSize: 14, fontWeight: '700' }, fileMeta: { fontSize: 12, marginTop: 4 }, category: { fontSize: 11, fontWeight: '700', marginTop: 3 }, deleteText: { color: '#DC2626', fontSize: 12, fontWeight: '700', marginLeft: 8 }, empty: { alignItems: 'center', paddingVertical: 32 }, emptyText: { fontSize: 14 },
});
