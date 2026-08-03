import React, { useCallback, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getPendingStudents, approveStudent, rejectStudent, PendingStudent } from '../services/api';

export default function PendingStudentsScreen({ navigation }: any) {
  const [students, setStudents] = useState<PendingStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const loadStudents = useCallback(async () => {
    try {
      const data = await getPendingStudents();
      setStudents(data);
    } catch (error: any) {
      Alert.alert('Hata', 'Bekleyen istekler yüklenemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      loadStudents();
    }, [loadStudents])
  );

  const handleApprove = async (student: PendingStudent) => {
    setProcessingId(student.id);
    try {
      await approveStudent(student.id);
      setStudents((prev) => prev.filter((s) => s.id !== student.id));
      Alert.alert('Onaylandı', `${student.firstName} ${student.lastName} onaylandı.`);
    } catch (error: any) {
      Alert.alert('Hata', 'Onaylama işlemi başarısız oldu.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = (student: PendingStudent) => {
    Alert.alert(
      'İsteği Reddet',
      `${student.firstName} ${student.lastName} adlı öğrencinin isteğini reddetmek istediğinize emin misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Reddet',
          style: 'destructive',
          onPress: async () => {
            setProcessingId(student.id);
            try {
              await rejectStudent(student.id);
              setStudents((prev) => prev.filter((s) => s.id !== student.id));
            } catch (error: any) {
              Alert.alert('Hata', 'Reddetme işlemi başarısız oldu.');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>‹ Geri</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Bekleyen Öğrenciler</Text>
        <Text style={styles.subtitle}>
          {students.length > 0
            ? `${students.length} bekleyen istek`
            : 'Bekleyen istek yok'}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#4A6CF7" />
        </View>
      ) : students.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>Şu anda bekleyen öğrenci isteği yok</Text>
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true);
                loadStudents();
              }}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>
                  {item.firstName} {item.lastName}
                </Text>
                <Text style={styles.cardEmail}>{item.email}</Text>
                {!!item.studentNo && (
                  <Text style={styles.cardDetail}>Öğrenci No: {item.studentNo}</Text>
                )}
              </View>

              {processingId === item.id ? (
                <ActivityIndicator color="#4A6CF7" />
              ) : (
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleApprove(item)}
                  >
                    <Text style={styles.approveButtonText}>Onayla</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleReject(item)}
                  >
                    <Text style={styles.rejectButtonText}>Reddet</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        />
      )}
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
  backButton: {
    marginBottom: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#E0E7FF',
    marginTop: 4,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#888',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardInfo: {
    marginBottom: 12,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
  },
  cardEmail: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  cardDetail: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#E8F5E9',
  },
  approveButtonText: {
    color: '#2E7D32',
    fontWeight: '700',
    fontSize: 14,
  },
  rejectButton: {
    backgroundColor: '#FFEBEE',
  },
  rejectButtonText: {
    color: '#C62828',
    fontWeight: '700',
    fontSize: 14,
  },
});
