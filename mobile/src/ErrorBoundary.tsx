import React from 'react';
import { SafeAreaView, ScrollView, Text, StyleSheet } from 'react-native';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Uygulama hatası yakalandı:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>Bir hata oluştu</Text>
            <Text style={styles.subtitle}>
              Uygulama beklenmedik bir hatayla karşılaştı. Lütfen bu ekranın görüntüsünü alıp geliştiriciyle paylaşın.
            </Text>
            <Text style={styles.errorLabel}>Hata mesajı:</Text>
            <Text style={styles.errorText}>{String(this.state.error?.message || this.state.error)}</Text>
            {!!this.state.error?.stack && (
              <>
                <Text style={styles.errorLabel}>Detay:</Text>
                <Text style={styles.stackText}>{this.state.error.stack}</Text>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#C53030',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#742A2A',
    marginBottom: 20,
  },
  errorLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#742A2A',
    marginTop: 12,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#742A2A',
    backgroundColor: '#FED7D7',
    padding: 10,
    borderRadius: 8,
  },
  stackText: {
    fontSize: 11,
    color: '#742A2A',
    backgroundColor: '#FED7D7',
    padding: 10,
    borderRadius: 8,
    fontFamily: 'monospace',
  },
});
