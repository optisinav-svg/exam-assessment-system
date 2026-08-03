import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect, createContext, useContext } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import './App.css';

// API Base URL
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ─── Tema Context ─────────────────────────────────────────────────────────────
type Theme = 'light' | 'dark';

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
}>({
  theme: 'light',
  toggleTheme: () => {},
});

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('optiksinav-theme');
    return (saved === 'dark' ? 'dark' : 'light') as Theme;
  });

  useEffect(() => {
    localStorage.setItem('optiksinav-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function useTheme() {
  return useContext(ThemeContext);
}

// ─── Tema Butonu (Tüm sayfalarda görünür) ─────────────────────────────────────
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      title={theme === 'light' ? 'Karanlık moda geç' : 'Açık moda geç'}
      className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-xl transition-all duration-300 hover:scale-110"
      style={{
        backgroundColor: theme === 'light' ? '#1e293b' : '#fbbf24',
        color: theme === 'light' ? '#fbbf24' : '#1e293b',
      }}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}

// ─── Karanlık Mod Renk Yardımcıları ──────────────────────────────────────────
function bgMain(theme: Theme) {
  return theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50';
}
function bgCard(theme: Theme) {
  return theme === 'dark' ? 'bg-gray-800' : 'bg-white';
}
function textPrimary(theme: Theme) {
  return theme === 'dark' ? 'text-gray-100' : 'text-gray-800';
}
function textSecondary(theme: Theme) {
  return theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
}
function textMuted(theme: Theme) {
  return theme === 'dark' ? 'text-gray-300' : 'text-gray-600';
}
function borderColor(theme: Theme) {
  return theme === 'dark' ? 'border-gray-700' : 'border-gray-100';
}
function borderColor2(theme: Theme) {
  return theme === 'dark' ? 'border-gray-600' : 'border-gray-200';
}
function inputBg(theme: Theme) {
  return theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-800';
}

function App() {
  return (
    <ThemeContext.Provider value={useContext(ThemeContext)}>
      <ThemeProvider>
        <Router>
          <AppRoutes />
        </Router>
        <ThemeToggle />
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

// Inner routes (theme-aware)
function AppRoutes() {
  const { theme } = useTheme();
  return (
    <div className={`min-h-screen transition-colors duration-300 ${bgMain(theme)}`}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/import" element={<ImportPage />} />
        <Route path="/results/:examId" element={<ResultsPage />} />
        <Route path="/exam/:examId" element={<ExamDetailPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/messages" element={<AdminMessagesPage />} />
      </Routes>
    </div>
  );
}

// Ana Sayfa
function HomePage() {
  const { theme } = useTheme();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
      <h1 className="text-4xl font-bold mb-4">📚 OptikSınav</h1>
      <p className="text-xl mb-8">Eğitim Değerlendirme Sistemi</p>
      <div className="flex gap-4">
        <a href="/login" className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100">
          Giriş Yap
        </a>
        <a href="/register" className="bg-transparent border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600">
          Kayıt Ol
        </a>
      </div>
    </div>
  );
}

// Giriş Sayfası
function LoginPage() {
  const { theme } = useTheme();
  return (
    <div className={`max-w-md mx-auto mt-20 p-6 rounded-lg shadow-md ${bgCard(theme)}`}>
      <h2 className={`text-2xl font-bold text-center mb-6 ${textPrimary(theme)}`}>Giriş Yap</h2>
      <form>
        <div className="mb-4">
          <label className={`block mb-2 ${textMuted(theme)}`}>Email</label>
          <input type="email" className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg(theme)}`} />
        </div>
        <div className="mb-6">
          <label className={`block mb-2 ${textMuted(theme)}`}>Şifre</label>
          <input type="password" className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg(theme)}`} />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
          Giriş Yap
        </button>
      </form>
      <p className={`text-center mt-4 text-sm ${textMuted(theme)}`}>
        Hesabın yok mu? <a href="/register" className="text-blue-600 hover:underline">Kayıt Ol</a>
      </p>
    </div>
  );
}

// Kayıt Sayfası
function RegisterPage() {
  const { theme } = useTheme();
  return (
    <div className={`max-w-md mx-auto mt-20 p-6 rounded-lg shadow-md ${bgCard(theme)}`}>
      <h2 className={`text-2xl font-bold text-center mb-6 ${textPrimary(theme)}`}>Kayıt Ol</h2>
      <form>
        <div className="mb-4">
          <label className={`block mb-2 ${textMuted(theme)}`}>Ad Soyad</label>
          <input type="text" className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg(theme)}`} />
        </div>
        <div className="mb-4">
          <label className={`block mb-2 ${textMuted(theme)}`}>Email</label>
          <input type="email" className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg(theme)}`} />
        </div>
        <div className="mb-6">
          <label className={`block mb-2 ${textMuted(theme)}`}>Şifre</label>
          <input type="password" className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg(theme)}`} />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
          Kayıt Ol
        </button>
      </form>
      <p className={`text-center mt-4 text-sm ${textMuted(theme)}`}>
        Zaten hesabın var mı? <a href="/login" className="text-blue-600 hover:underline">Giriş Yap</a>
      </p>
    </div>
  );
}

// Dashboard Sayfası - Gerçek API Verileriyle Bağlı
function DashboardPage() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/analytics/dashboard`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('optiksinav-token') || ''}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setDashboardData(data);
        } else {
          // API yoksa örnek veri göster
          setDashboardData(null);
        }
      } catch (err) {
        setDashboardData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const chartTextColor = theme === 'dark' ? '#e5e7eb' : '#374151';
  const chartGridColor = theme === 'dark' ? '#374151' : '#e5e7eb';

  // Fallback sabit veriler (API yoksa gösterilir)
  const summary = dashboardData?.summary || {
    totalExams: 12,
    totalStudents: 245,
    avgScore: 72,
    totalSubjects: 5,
  };

  const examTrend = (dashboardData?.examTrend || []).map(e => ({
    name: e.name?.substring(0, 15) || `Sınav ${e.examId}`,
    ortalama: e.avgScore || e.avgNet || 0,
    studentCount: e.studentCount || 0,
    date: e.date,
    examId: e.examId,
  }));

  const answerDist = dashboardData?.answerDistribution || { correct: 6200, wrong: 1800, empty: 600 };
  const answerDistribution = [
    { name: 'Doğru', value: answerDist.correct, color: '#10B981' },
    { name: 'Yanlış', value: answerDist.wrong, color: '#EF4444' },
    { name: 'Boş', value: answerDist.empty, color: '#F59E0B' },
  ];

  return (
    <div className={`p-6 max-w-7xl mx-auto transition-colors duration-300`}>
      <div className="flex items-center justify-between mb-6">
        <h1 className={`text-2xl font-bold ${textPrimary(theme)}`}>📊 Dashboard</h1>
        <nav className="flex gap-3">
          <a href="/import" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
            Excel Import
          </a>
        </nav>
      </div>

      {loading ? (
        <div className={`p-12 text-center ${bgCard(theme)} rounded-xl`}>Yükleniyor...</div>
      ) : (
        <>
          {/* Özet Kartları */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className={`p-5 rounded-xl shadow-sm border ${bgCard(theme)} ${borderColor(theme)}`}>
              <h3 className={textSecondary(theme) + ' text-sm'}>Toplam Sınav</h3>
              <p className="text-3xl font-bold text-blue-600">{summary.totalExams}</p>
            </div>
            <div className={`p-5 rounded-xl shadow-sm border ${bgCard(theme)} ${borderColor(theme)}`}>
              <h3 className={textSecondary(theme) + ' text-sm'}>Toplam Öğrenci</h3>
              <p className="text-3xl font-bold text-purple-600">{summary.totalStudents}</p>
            </div>
            <div className={`p-5 rounded-xl shadow-sm border ${bgCard(theme)} ${borderColor(theme)}`}>
              <h3 className={textSecondary(theme) + ' text-sm'}>Ortalama Başarı</h3>
              <p className="text-3xl font-bold text-green-600">{summary.avgScore}%</p>
            </div>
            <div className={`p-5 rounded-xl shadow-sm border ${bgCard(theme)} ${borderColor(theme)}`}>
              <h3 className={textSecondary(theme) + ' text-sm'}>Aktif Ders</h3>
              <p className="text-3xl font-bold text-orange-600">{summary.totalSubjects || 5}</p>
            </div>
          </div>

          {/* Grafik Satır 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className={`p-5 rounded-xl shadow-sm border ${bgCard(theme)} ${borderColor(theme)}`}>
              <h3 className={`text-lg font-semibold mb-4 ${textMuted(theme)}`}>Sınav Ortalama Trendi</h3>
              {examTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={examTrend}>
                    <defs>
                      <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4A6CF7" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4A6CF7" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                    <XAxis dataKey="name" tick={{ fill: chartTextColor }} />
                    <YAxis domain={[0, 100]} tick={{ fill: chartTextColor }} />
                    <Tooltip formatter={(value: number) => `${value}%`} contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', border: 'none', borderRadius: 8 }} />
                    <Area type="monotone" dataKey="ortalama" stroke="#4A6CF7" fill="url(#colorAvg)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className={`text-center py-12 ${textSecondary(theme)}`}>Henüz sınav sonucu yok</p>
              )}
            </div>

            <div className={`p-5 rounded-xl shadow-sm border ${bgCard(theme)} ${borderColor(theme)}`}>
              <h3 className={`text-lg font-semibold mb-4 ${textMuted(theme)}`}>Cevap Dağılımı</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={answerDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: chartTextColor }}
                  >
                    {answerDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', border: 'none', borderRadius: 8 }} />
                  <Legend wrapperStyle={{ color: chartTextColor }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Son Sınavlar Listesi */}
          {dashboardData?.recentExams && dashboardData.recentExams.length > 0 && (
            <div className={`p-5 rounded-xl shadow-sm border ${bgCard(theme)} ${borderColor(theme)} mb-6`}>
              <h3 className={`text-lg font-semibold mb-4 ${textMuted(theme)}`}>Son Sınavlar</h3>
              <div className="space-y-2">
                {dashboardData.recentExams.map((exam: any) => (
                  <a
                    key={exam.id}
                    href={`/results/${exam.id}`}
                    className={`flex items-center justify-between p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} transition-colors`}
                  >
                    <div>
                      <p className={`font-medium ${textPrimary(theme)}`}>{exam.title}</p>
                      <p className={`text-sm ${textSecondary(theme)}`}>Tarih: {new Date(exam.examDate).toLocaleDateString('tr-TR')}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      exam.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {exam.status === 'published' ? 'Yayında' : 'Taslak'}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Excel Import Sayfası - Karanlık Mod Uyumlu
function ImportPage() {
  const { theme } = useTheme();
  const [jsonText, setJsonText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const exampleJson = `[
  {
    "dersAdi": "Matematik",
    "sinif": "8A",
    "kazanımKodu": "M.8.1.1.1",
    "kazanımIsmi": "Tam sayılarla toplama işlemi yapar"
  },
  {
    "dersAdi": "Matematik",
    "sinif": "8A",
    "kazanımKodu": "M.8.1.1.2",
    "kazanımIsmi": "Tam sayılarla çıkarma işlemi yapar"
  },
  {
    "dersAdi": "Fen Bilimleri",
    "sinif": "",
    "kazanımKodu": "F.1.1",
    "kazanımIsmi": "Canlıların özelliklerini tanır"
  }
]`;

  const handleImport = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const items = JSON.parse(jsonText);
      const response = await fetch(`${API_BASE}/import/excel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.message || 'Import işlemi başarısız');
      }
    } catch (err: any) {
      setError('JSON formatı geçersiz: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadExample = () => {
    setJsonText(exampleJson);
  };

  return (
    <div className={`p-6 max-w-4xl mx-auto transition-colors duration-300`}>
      <h1 className={`text-2xl font-bold mb-2 ${textPrimary(theme)}`}>📥 Ders & Kazanım İçe Aktarma</h1>
      <p className={`mb-6 ${textMuted(theme)}`}>
        Excel dosyanızdaki ders ve kazanım bilgilerini JSON formatında girerek sisteme aktarabilirsiniz.
        Sınıf sütunu boş olan satırlar otomatik olarak <strong>"Mezun"</strong> sınıfına atanır.
      </p>

      <div className={`p-6 rounded-xl shadow-sm border ${bgCard(theme)} ${borderColor(theme)}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${textMuted(theme)}`}>JSON Verisi</h3>
          <button
            onClick={loadExample}
            className={`px-3 py-1 text-sm rounded hover:bg-gray-200 ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}
          >
            Örnek Yükle
          </button>
        </div>

        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder={exampleJson}
          className={`w-full h-64 p-4 border rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${inputBg(theme)}`}
        />

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            ⚠️ {error}
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">✅ Import Başarılı!</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Toplam Satır:</span>
                <p className="font-bold text-green-700">{result.stats.totalRows}</p>
              </div>
              <div>
                <span className="text-gray-500">Oluşturulan Ders:</span>
                <p className="font-bold text-blue-700">{result.stats.subjectsCreated}</p>
              </div>
              <div>
                <span className="text-gray-500">Eklenen Kazanım:</span>
                <p className="font-bold text-purple-700">{result.stats.outcomesCreated}</p>
              </div>
              <div>
                <span className="text-gray-500">Atlanan Satır:</span>
                <p className="font-bold text-orange-700">{result.stats.skippedRows}</p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleImport}
          disabled={loading || !jsonText.trim()}
          className="mt-4 w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '🔄 İşleniyor...' : '📤 İçe Aktar'}
        </button>
      </div>

      <div className={`mt-6 p-6 rounded-xl shadow-sm border ${bgCard(theme)} ${borderColor(theme)}`}>
        <h3 className={`text-lg font-semibold mb-4 ${textMuted(theme)}`}>Mevcut Sınıf Seviyeleri</h3>
        <div className="flex flex-wrap gap-2">
          {['7A', '7B', '8A', '8B', '8C', 'Mezun'].map((grade) => (
            <span key={grade} className={`px-4 py-2 rounded-full text-sm font-medium ${
              theme === 'dark' ? 'bg-gray-700 text-blue-300' : 'bg-blue-50 text-blue-700'
            }`}>
              {grade}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Rapor Çıktıları Sayfası (PDF / Excel / JPEG) ────────────────────────────
// Bu bileşen tamamen tarayıcı tarafında çalışır, backend'e dokunmaz.
// jsPDF, xlsx (SheetJS) ve html2canvas CDN'den yüklenir.

function ReportButtons({ examId }: { examId: string }) {
  const [downloading, setDownloading] = useState<string | null>(null);

  // Örnek veri - gerçek API'den gelecek
  const studentResults = [
    { no: '1001', ad: 'Ahmet Yılmaz', dogru: 18, yanlis: 4, bos: 3, net: 17, basari: 85 },
    { no: '1002', ad: 'Ayşe Demir', dogru: 20, yanlis: 5, bos: 0, net: 18.75, basari: 94 },
    { no: '1003', ad: 'Mehmet Kaya', dogru: 15, yanlis: 8, bos: 2, net: 13, basari: 65 },
    { no: '1004', ad: 'Zeynep Çelik', dogru: 19, yanlis: 3, bos: 3, net: 18.25, basari: 91 },
    { no: '1005', ad: 'Ali Veli', dogru: 12, yanlis: 10, bos: 3, net: 9.5, basari: 48 },
  ];

  const examTitle = 'Matematik 1. Dönem Sınavı';
  const examDate = '2026-01-15';

  // ── PDF İndirme ──────────────────────────────────────────────────────────
  const downloadPDF = async () => {
    setDownloading('pdf');
    try {
      // jsPDF ve autoTable plugin'i CDN'den yükle
      const [jspdfModule, jspdfAutotable] = await Promise.all([
        import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm'),
        import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/+esm'),
      ]);

      const { jsPDF } = jspdfModule;
      const doc = new jsPDF();

      // Başlık
      doc.setFontSize(18);
      doc.text('OptikSınav - Sınav Sonuç Raporu', 14, 20);

      doc.setFontSize(12);
      doc.text(`Sınav: ${examTitle}`, 14, 32);
      doc.text(`Tarih: ${examDate}`, 14, 40);
      doc.text(`Katılımcı: ${studentResults.length} öğrenci`, 14, 48);

      // Özet
      const avgNet = (studentResults.reduce((sum, s) => sum + s.net, 0) / studentResults.length).toFixed(2);
      const maxNet = Math.max(...studentResults.map(s => s.net));
      const minNet = Math.min(...studentResults.map(s => s.net));
      doc.setFontSize(11);
      doc.text(`Ortalama Net: ${avgNet} | En Yüksek: ${maxNet} | En Düşük: ${minNet}`, 14, 58);

      // Tablo
      const tableData = studentResults.map(s => [
        s.no, s.ad, String(s.dogru), String(s.yanlis), String(s.bos), String(s.net), `${s.basari}%`
      ]);

      (jspdfAutotable as any).default(doc, {
        head: [['No', 'Ad Soyad', 'Doğru', 'Yanlış', 'Boş', 'Net', 'Başarı']],
        body: tableData,
        startY: 65,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [74, 108, 247], textColor: 255 },
      });

      doc.save(`sinav-${examId}-rapor.pdf`);
    } catch (err: any) {
      console.error('PDF hata:', err);
      alert('PDF oluşturma sırasında hata: ' + err.message);
    } finally {
      setDownloading(null);
    }
  };

  // ── Excel İndirme ────────────────────────────────────────────────────────
  const downloadExcel = async () => {
    setDownloading('excel');
    try {
      const XLSX = await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm');

      // Sınav bilgileri
      const headerRows = [
        ['OptikSınav - Sınav Sonuç Raporu'],
        ['Sınav:', examTitle],
        ['Tarih:', examDate],
        [],
      ];

      // Özet
      const avgNet = (studentResults.reduce((sum, s) => sum + s.net, 0) / studentResults.length).toFixed(2);
      const summaryRows = [
        ['Özet'],
        ['Katılımcı', studentResults.length],
        ['Ortalama Net', avgNet],
        ['En Yüksek Net', Math.max(...studentResults.map(s => s.net))],
        ['En Düşük Net', Math.min(...studentResults.map(s => s.net))],
        [],
      ];

      // Öğrenci verileri
      const dataRows = [
        ['No', 'Ad Soyad', 'Doğru', 'Yanlış', 'Boş', 'Net', 'Başarı %'],
        ...studentResults.map(s => [s.no, s.ad, s.dogru, s.yanlis, s.bos, s.net, s.basari]),
      ];

      const ws = XLSX.utils.aoa_to_sheet([...headerRows, ...summaryRows, ...dataRows]);

      // Sütun genişlikleri
      ws['!cols'] = [
        { wch: 8 }, { wch: 25 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 10 }
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sınav Sonuçları');

      // Kazanım analizi sheet
      const kazanımData = [
        ['Kazanım Bazlı Analiz'],
        [],
        ['Kazanım', 'Başarı %'],
        ['K1 - Toplama işlemi', 85],
        ['K2 - Çıkarma işlemi', 72],
        ['K3 - Çarpma işlemi', 90],
        ['K4 - Bölme işlemi', 55],
        ['K5 - Denklem çözme', 78],
        ['K6 - Problem çözme', 63],
      ];
      const ws2 = XLSX.utils.aoa_to_sheet(kazanımData);
      ws2['!cols'] = [{ wch: 30 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, ws2, 'Kazanım Analizi');

      XLSX.writeFile(wb, `sinav-${examId}-rapor.xlsx`);
    } catch (err: any) {
      console.error('Excel hata:', err);
      alert('Excel oluşturma sırasında hata: ' + err.message);
    } finally {
      setDownloading(null);
    }
  };

  // ── JPEG İndirme ─────────────────────────────────────────────────────────
  const downloadJPEG = async () => {
    setDownloading('jpeg');
    try {
      const html2canvas = (await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/+esm')).default;

      // Geçici rapor alanı oluştur
      const reportDiv = document.createElement('div');
      reportDiv.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:800px;background:#fff;padding:40px;font-family:Arial,sans-serif;z-index:99999';
      reportDiv.innerHTML = `
        <h1 style="color:#4A6CF7;font-size:24px;margin-bottom:8px;">📚 OptikSınav</h1>
        <h2 style="color:#333;font-size:18px;margin-bottom:4px;">Sınav Sonuç Raporu</h2>
        <p style="color:#666;margin-bottom:20px;">${examTitle} | ${examDate}</p>
        <div style="display:flex;gap:16px;margin-bottom:20px;">
          <div style="background:#EFF6FF;padding:12px 20px;border-radius:8px;text-align:center;flex:1;">
            <div style="font-size:12px;color:#666;">Katılımcı</div>
            <div style="font-size:24px;font-weight:bold;color:#4A6CF7;">${studentResults.length}</div>
          </div>
          <div style="background:#F0FDF4;padding:12px 20px;border-radius:8px;text-align:center;flex:1;">
            <div style="font-size:12px;color:#666;">Ortalama Net</div>
            <div style="font-size:24px;font-weight:bold;color:#16A34A;">${(studentResults.reduce((sum, s) => sum + s.net, 0) / studentResults.length).toFixed(1)}</div>
          </div>
          <div style="background:#FEF2F2;padding:12px 20px;border-radius:8px;text-align:center;flex:1;">
            <div style="font-size:12px;color:#666;">Başarı %</div>
            <div style="font-size:24px;font-weight:bold;color:#DC2626;">${(studentResults.reduce((sum, s) => sum + s.basari, 0) / studentResults.length).toFixed(1)}%</div>
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-top:10px;">
          <tr style="background:#4A6CF7;color:#fff;">
            <th style="padding:10px;text-align:left;">No</th>
            <th style="padding:10px;text-align:left;">Ad Soyad</th>
            <th style="padding:10px;text-align:center;">Doğru</th>
            <th style="padding:10px;text-align:center;">Yanlış</th>
            <th style="padding:10px;text-align:center;">Boş</th>
            <th style="padding:10px;text-align:center;">Net</th>
            <th style="padding:10px;text-align:center;">Başarı</th>
          </tr>
          ${studentResults.map((s, i) => `
            <tr style="background:${i % 2 === 0 ? '#F9FAFB' : '#fff'};border-bottom:1px solid #E5E7EB;">
              <td style="padding:10px;">${s.no}</td>
              <td style="padding:10px;">${s.ad}</td>
              <td style="padding:10px;text-align:center;color:#16A34A;">${s.dogru}</td>
              <td style="padding:10px;text-align:center;color:#DC2626;">${s.yanlis}</td>
              <td style="padding:10px;text-align:center;color:#D97706;">${s.bos}</td>
              <td style="padding:10px;text-align:center;font-weight:bold;color:#4A6CF7;">${s.net}</td>
              <td style="padding:10px;text-align:center;">${s.basari}%</td>
            </tr>
          `).join('')}
        </table>
        <p style="margin-top:20px;color:#999;font-size:11px;text-align:center;">OptikSınav Eğitim Değerlendirme Sistemi</p>
      `;

      document.body.appendChild(reportDiv);

      const canvas = await html2canvas(reportDiv, { scale: 2, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `sinav-${examId}-rapor.jpeg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();

      document.body.removeChild(reportDiv);
    } catch (err: any) {
      console.error('JPEG hata:', err);
      alert('JPEG oluşturma sırasında hata: ' + err.message);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={downloadPDF}
        disabled={downloading !== null}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
      >
        {downloading === 'pdf' ? '🔄 Hazırlanıyor...' : '📄 PDF İndir'}
      </button>
      <button
        onClick={downloadExcel}
        disabled={downloading !== null}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50"
      >
        {downloading === 'excel' ? '🔄 Hazırlanıyor...' : '📊 Excel İndir'}
      </button>
      <button
        onClick={downloadJPEG}
        disabled={downloading !== null}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm disabled:opacity-50"
      >
        {downloading === 'jpeg' ? '🔄 Hazırlanıyor...' : '🖼️ JPEG İndir'}
      </button>
    </div>
  );
}

// Sınav Sonuçları Sayfası - Karanlık Mod + Rapor Çıktıları
function ResultsPage() {
  const { theme } = useTheme();
  const location = useLocation();
  const examId = location.pathname.split('/results/')[1] || 'demo';

  const studentResults = [
    { no: '1001', ad: 'Ahmet Yılmaz', dogru: 18, yanlis: 4, bos: 3, net: 17, basari: 85 },
    { no: '1002', ad: 'Ayşe Demir', dogru: 20, yanlis: 5, bos: 0, net: 18.75, basari: 94 },
    { no: '1003', ad: 'Mehmet Kaya', dogru: 15, yanlis: 8, bos: 2, net: 13, basari: 65 },
    { no: '1004', ad: 'Zeynep Çelik', dogru: 19, yanlis: 3, bos: 3, net: 18.25, basari: 91 },
    { no: '1005', ad: 'Ali Veli', dogru: 12, yanlis: 10, bos: 3, net: 9.5, basari: 48 },
  ];

  const questionStats = Array.from({ length: 20 }, (_, i) => ({
    soru: `S${i + 1}`,
    dogru: Math.floor(Math.random() * 80) + 20,
    yanlis: Math.floor(Math.random() * 40) + 5,
    bos: Math.floor(Math.random() * 20) + 2,
  }));

  const chartTextColor = theme === 'dark' ? '#e5e7eb' : '#374151';
  const chartGridColor = theme === 'dark' ? '#374151' : '#e5e7eb';

  return (
    <div className={`p-6 max-w-7xl mx-auto transition-colors duration-300`}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className={`text-2xl font-bold ${textPrimary(theme)}`}>📋 Sınav Sonuçları</h1>
        <ReportButtons examId={examId} />
      </div>

      {/* Özet */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className={`p-4 rounded-lg shadow-sm ${bgCard(theme)} ${borderColor(theme)} border`}>
          <p className={`text-xs ${textSecondary(theme)}`}>Katılımcı</p>
          <p className={`text-xl font-bold ${textPrimary(theme)}`}>5</p>
        </div>
        <div className={`p-4 rounded-lg shadow-sm ${bgCard(theme)} ${borderColor(theme)} border`}>
          <p className={`text-xs ${textSecondary(theme)}`}>Ortalama Net</p>
          <p className="text-xl font-bold text-blue-600">15.3</p>
        </div>
        <div className={`p-4 rounded-lg shadow-sm ${bgCard(theme)} ${borderColor(theme)} border`}>
          <p className={`text-xs ${textSecondary(theme)}`}>En Yüksek</p>
          <p className="text-xl font-bold text-green-600">18.75</p>
        </div>
        <div className={`p-4 rounded-lg shadow-sm ${bgCard(theme)} ${borderColor(theme)} border`}>
          <p className={`text-xs ${textSecondary(theme)}`}>En Düşük</p>
          <p className="text-xl font-bold text-red-600">9.5</p>
        </div>
        <div className={`p-4 rounded-lg shadow-sm ${bgCard(theme)} ${borderColor(theme)} border`}>
          <p className={`text-xs ${textSecondary(theme)}`}>Başarı %</p>
          <p className="text-xl font-bold text-purple-600">76.6%</p>
        </div>
      </div>

      {/* Grafikler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className={`p-5 rounded-xl shadow-sm border ${bgCard(theme)} ${borderColor(theme)}`}>
          <h3 className={`text-lg font-semibold mb-4 ${textMuted(theme)}`}>Soru Bazlı Analiz</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={questionStats}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
              <XAxis dataKey="soru" tick={{ fontSize: 10, fill: chartTextColor }} />
              <YAxis domain={[0, 100]} tick={{ fill: chartTextColor }} />
              <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', border: 'none', borderRadius: 8 }} />
              <Legend wrapperStyle={{ color: chartTextColor }} />
              <Bar dataKey="dogru" stackId="a" fill="#10B981" name="Doğru" />
              <Bar dataKey="yanlis" stackId="a" fill="#EF4444" name="Yanlış" />
              <Bar dataKey="bos" stackId="a" fill="#F59E0B" name="Boş" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={`p-5 rounded-xl shadow-sm border ${bgCard(theme)} ${borderColor(theme)}`}>
          <h3 className={`text-lg font-semibold mb-4 ${textMuted(theme)}`}>Öğrenci Net Dağılımı</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={studentResults}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
              <XAxis dataKey="ad" tick={{ fill: chartTextColor }} />
              <YAxis domain={[0, 25]} tick={{ fill: chartTextColor }} />
              <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', border: 'none', borderRadius: 8 }} />
              <Bar dataKey="net" fill="#4A6CF7" radius={[4, 4, 0, 0]} name="Net" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tablo */}
      <div className={`rounded-xl shadow-sm border overflow-hidden ${bgCard(theme)} ${borderColor(theme)}`}>
        <div className={`p-4 border-b ${borderColor2(theme)}`}>
          <h3 className={`font-semibold ${textPrimary(theme)}`}>Öğrenci Detayları</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className={`px-4 py-3 text-left ${textPrimary(theme)}`}>No</th>
                <th className={`px-4 py-3 text-left ${textPrimary(theme)}`}>Ad Soyad</th>
                <th className={`px-4 py-3 text-center ${textPrimary(theme)}`}>Doğru</th>
                <th className={`px-4 py-3 text-center ${textPrimary(theme)}`}>Yanlış</th>
                <th className={`px-4 py-3 text-center ${textPrimary(theme)}`}>Boş</th>
                <th className={`px-4 py-3 text-center ${textPrimary(theme)}`}>Net</th>
                <th className={`px-4 py-3 text-center ${textPrimary(theme)}`}>Başarı %</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${borderColor2(theme)}`}>
              {studentResults.map((s, i) => (
                <tr key={i} className={theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                  <td className={`px-4 py-3 ${textPrimary(theme)}`}>{s.no}</td>
                  <td className={`px-4 py-3 font-medium ${textPrimary(theme)}`}>{s.ad}</td>
                  <td className="px-4 py-3 text-center text-green-600 font-medium">{s.dogru}</td>
                  <td className="px-4 py-3 text-center text-red-600 font-medium">{s.yanlis}</td>
                  <td className="px-4 py-3 text-center text-yellow-600 font-medium">{s.bos}</td>
                  <td className="px-4 py-3 text-center font-bold text-blue-600">{s.net}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      s.basari >= 80 ? 'bg-green-100 text-green-700' :
                      s.basari >= 60 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {s.basari}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Paneli ────────────────────────────────────────────────────────────
function AdminPage() {
  const { theme } = useTheme();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'stats' | 'users'>('stats');

  useEffect(() => {
    // Örnek veriler (API bağlantısı sonrası gerçek veriye dönüşecek)
    setStats({
      totals: {
        users: 15,
        teachers: 12,
        admins: 3,
        exams: 47,
        results: 1250,
        students: 480,
      },
      recentUsers: [
        { id: 1, fullName: 'Ahmet Öğretmen', email: 'ahmet@okul.com', role: 'teacher', createdAt: '2026-07-25' },
        { id: 2, fullName: 'Zeynep Öğretmen', email: 'zeynep@okul.com', role: 'teacher', createdAt: '2026-07-24' },
      ],
      recentExams: [
        { id: 1, title: 'Matematik 1. Dönem', examDate: '2026-01-15', createdAt: '2026-01-10' },
        { id: 2, title: 'Fen Bilimleri 2. Dönem', examDate: '2026-03-20', createdAt: '2026-03-15' },
      ],
    });
    setUsers([
      { id: 1, fullName: 'Admin Kullanıcı', email: 'admin@optiksinav.com', role: 'admin', createdAt: '2026-01-01' },
      { id: 2, fullName: 'Ahmet Öğretmen', email: 'ahmet@okul.com', role: 'teacher', createdAt: '2026-07-25' },
      { id: 3, fullName: 'Zeynep Öğretmen', email: 'zeynep@okul.com', role: 'teacher', createdAt: '2026-07-24' },
      { id: 4, fullName: 'Mehmet Öğretmen', email: 'mehmet@okul.com', role: 'teacher', createdAt: '2026-07-20' },
      { id: 5, fullName: 'Ayşe Öğretmen', email: 'ayse@okul.com', role: 'teacher', createdAt: '2026-07-18' },
    ]);
    setLoading(false);
  }, []);

  const roleColors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700',
    teacher: 'bg-blue-100 text-blue-700',
    student: 'bg-green-100 text-green-700',
  };

  return (
    <div className={`p-6 max-w-7xl mx-auto transition-colors duration-300`}>
      <div className="flex items-center justify-between mb-6">
        <h1 className={`text-2xl font-bold ${textPrimary(theme)}`}>⚙️ Admin Paneli</h1>
        <nav className="flex gap-2">
          <a href="/admin" className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'stats' ? 'bg-blue-600 text-white' : `${bgCard(theme)} ${textMuted(theme)}`}`}>
            İstatistikler
          </a>
          <a href="/admin" className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'users' ? 'bg-blue-600 text-white' : `${bgCard(theme)} ${textMuted(theme)}`}`}>
            Kullanıcılar
          </a>
          <a href="/admin/messages" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
            Mesaj Gönder
          </a>
        </nav>
      </div>

      {loading ? (
        <div className={`p-8 text-center ${bgCard(theme)} rounded-xl`}>Yükleniyor...</div>
      ) : (
        <>
          {/* İstatistik Kartları */}
          {activeTab === 'stats' && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                <div className={`p-5 rounded-xl shadow-sm border ${bgCard(theme)} ${borderColor(theme)}`}>
                  <p className={`text-xs ${textSecondary(theme)}`}>Toplam Kullanıcı</p>
                  <p className="text-2xl font-bold text-blue-600">{stats?.totals?.users || 0}</p>
                </div>
                <div className={`p-5 rounded-xl shadow-sm border ${bgCard(theme)} ${borderColor(theme)}`}>
                  <p className={`text-xs ${textSecondary(theme)}`}>Öğretmen</p>
                  <p className="text-2xl font-bold text-green-600">{stats?.totals?.teachers || 0}</p>
                </div>
                <div className={`p-5 rounded-xl shadow-sm border ${bgCard(theme)} ${borderColor(theme)}`}>
                  <p className={`text-xs ${textSecondary(theme)}`}>Admin</p>
                  <p className="text-2xl font-bold text-purple-600">{stats?.totals?.admins || 0}</p>
                </div>
                <div className={`p-5 rounded-xl shadow-sm border ${bgCard(theme)} ${borderColor(theme)}`}>
                  <p className={`text-xs ${textSecondary(theme)}`}>Sınav</p>
                  <p className="text-2xl font-bold text-orange-600">{stats?.totals?.exams || 0}</p>
                </div>
                <div className={`p-5 rounded-xl shadow-sm border ${bgCard(theme)} ${borderColor(theme)}`}>
                  <p className={`text-xs ${textSecondary(theme)}`}>Sonuç</p>
                  <p className="text-2xl font-bold text-red-600">{stats?.totals?.results || 0}</p>
                </div>
                <div className={`p-5 rounded-xl shadow-sm border ${bgCard(theme)} ${borderColor(theme)}`}>
                  <p className={`text-xs ${textSecondary(theme)}`}>Öğrenci</p>
                  <p className="text-2xl font-bold text-indigo-600">{stats?.totals?.students || 0}</p>
                </div>
              </div>

              {/* Son Kullanıcılar */}
              <div className={`p-5 rounded-xl shadow-sm border ${bgCard(theme)} ${borderColor(theme)} mb-6`}>
                <h3 className={`text-lg font-semibold mb-4 ${textMuted(theme)}`}>Son Eklenen Kullanıcılar</h3>
                <div className="space-y-3">
                  {(stats?.recentUsers || []).map((u: any) => (
                    <div key={u.id} className={`flex items-center justify-between p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div>
                        <p className={`font-medium ${textPrimary(theme)}`}>{u.fullName}</p>
                        <p className={`text-sm ${textSecondary(theme)}`}>{u.email}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleColors[u.role] || 'bg-gray-100 text-gray-700'}`}>
                        {u.role === 'admin' ? 'Admin' : 'Öğretmen'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Son Sınavlar */}
              <div className={`p-5 rounded-xl shadow-sm border ${bgCard(theme)} ${borderColor(theme)}`}>
                <h3 className={`text-lg font-semibold mb-4 ${textMuted(theme)}`}>Son Oluşturulan Sınavlar</h3>
                <div className="space-y-3">
                  {(stats?.recentExams || []).map((e: any) => (
                    <div key={e.id} className={`flex items-center justify-between p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div>
                        <p className={`font-medium ${textPrimary(theme)}`}>{e.title}</p>
                        <p className={`text-sm ${textSecondary(theme)}`}>Tarih: {e.examDate}</p>
                      </div>
                      <a href={`/results/${e.id}`} className="text-sm text-blue-600 hover:underline">Sonuçları Gör →</a>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Kullanıcılar Tablosu */}
          {activeTab === 'users' && (
            <div className={`rounded-xl shadow-sm border overflow-hidden ${bgCard(theme)} ${borderColor(theme)}`}>
              <div className={`p-4 border-b ${borderColor2(theme)}`}>
                <h3 className={`font-semibold ${textPrimary(theme)}`}>Tüm Kullanıcılar ({users.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
                    <tr>
                      <th className={`px-4 py-3 text-left ${textPrimary(theme)}`}>ID</th>
                      <th className={`px-4 py-3 text-left ${textPrimary(theme)}`}>Ad Soyad</th>
                      <th className={`px-4 py-3 text-left ${textPrimary(theme)}`}>Email</th>
                      <th className={`px-4 py-3 text-center ${textPrimary(theme)}`}>Rol</th>
                      <th className={`px-4 py-3 text-left ${textPrimary(theme)}`}>Kayıt Tarihi</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${borderColor2(theme)}`}>
                    {users.map((u) => (
                      <tr key={u.id} className={theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                        <td className={`px-4 py-3 ${textPrimary(theme)}`}>{u.id}</td>
                        <td className={`px-4 py-3 font-medium ${textPrimary(theme)}`}>{u.fullName}</td>
                        <td className={`px-4 py-3 ${textSecondary(theme)}`}>{u.email}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleColors[u.role] || 'bg-gray-100 text-gray-700'}`}>
                            {u.role === 'admin' ? 'Admin' : 'Öğretmen'}
                          </span>
                        </td>
                        <td className={`px-4 py-3 ${textSecondary(theme)}`}>{u.createdAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Admin Mesaj Gönderme Sayfası ────────────────────────────────────────────
function AdminMessagesPage() {
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [recipientRole, setRecipientRole] = useState('all');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Başlık ve içerik alanları zorunludur.');
      return;
    }

    setSending(true);
    setError('');
    setSent(false);

    try {
      const response = await fetch(`${API_BASE}/admin/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, content, recipientRole }),
      });

      const data = await response.json();

      if (response.ok) {
        setSent(true);
        setTitle('');
        setContent('');
        setRecipientRole('all');
      } else {
        setError(data.message || 'Mesaj gönderilemedi.');
      }
    } catch (err: any) {
      setError('Bağlantı hatası: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`p-6 max-w-3xl mx-auto transition-colors duration-300`}>
      <div className="flex items-center gap-4 mb-6">
        <h1 className={`text-2xl font-bold ${textPrimary(theme)}`}>💬 Sistem Mesajı Gönder</h1>
        <a href="/admin" className={`px-4 py-2 rounded-lg text-sm ${bgCard(theme)} ${textMuted(theme)} border ${borderColor(theme)}`}>
          ← Admin Paneli
        </a>
      </div>

      <div className={`p-6 rounded-xl shadow-sm border ${bgCard(theme)} ${borderColor(theme)}`}>
        <div className="space-y-4">
          {/* Başlık */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${textMuted(theme)}`}>Başlık</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Sistem Bakım Bildirimi"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg(theme)}`}
            />
          </div>

          {/* Alıcı */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${textMuted(theme)}`}>Alıcı Grubu</label>
            <select
              value={recipientRole}
              onChange={(e) => setRecipientRole(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg(theme)}`}
            >
              <option value="all">Tüm Kullanıcılar</option>
              <option value="teacher">Sadece Öğretmenler</option>
              <option value="student">Sadece Öğrenciler</option>
              <option value="admin">Sadece Adminler</option>
            </select>
          </div>

          {/* İçerik */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${textMuted(theme)}`}>Mesaj İçeriği</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Mesajınızı buraya yazın..."
              rows={6}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${inputBg(theme)}`}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              ⚠️ {error}
            </div>
          )}

          {sent && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              ✅ Mesaj başarıyla kaydedildi!
            </div>
          )}

          <button
            onClick={handleSend}
            disabled={sending || !title.trim() || !content.trim()}
            className="w-full py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? '🔄 Gönderiliyor...' : '📤 Mesaj Gönder'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Öğretmen Detaylı Sonuç Raporu ─────────────────────────────────────────
function ExamDetailPage() {
  const { theme } = useTheme();
  const location = useLocation();
  const examId = location.pathname.split('/exam/')[1] || '';
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchExamDetail = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/analytics/exam/${examId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('optiksinav-token') || ''}`,
          },
        });
        if (response.ok) {
          const jsonData = await response.json();
          setData(jsonData);
        } else {
          setError('Sınav verileri yüklenemedi.');
        }
      } catch (err: any) {
        setError('Bağlantı hatası: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    if (examId) fetchExamDetail();
  }, [examId]);

  const chartTextColor = theme === 'dark' ? '#e5e7eb' : '#374151';
  const chartGridColor = theme === 'dark' ? '#374151' : '#e5e7eb';

  if (loading) {
    return (
      <div className={`p-6 max-w-7xl mx-auto`}>
        <div className={`p-12 text-center ${bgCard(theme)} rounded-xl`}>Yükleniyor...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`p-6 max-w-7xl mx-auto`}>
        <div className={`p-8 text-center ${bgCard(theme)} rounded-xl ${textPrimary(theme)}`}>
          <p className="text-lg mb-4">⚠️ {error || 'Veri bulunamadı'}</p>
          <a href="/dashboard" className="text-blue-600 hover:underline">← Dashboard'a Dön</a>
        </div>
      </div>
    );
  }

  const { exam, summary, questionStats, outcomeAnalysis, results: examResults } = data;

  return (
    <div className={`p-6 max-w-7xl mx-auto transition-colors duration-300`}>
      {/* Başlık */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${textPrimary(theme)}`}>📋 {exam.title}</h1>
          <p className={`text-sm ${textSecondary(theme)}`}>{exam.subjectName} | {new Date(exam.examDate).toLocaleDateString('tr-TR')} | {exam.totalQuestions} Soru | {exam.optionCount} Seçenekli</p>
        </div>
        <div className="flex gap-2">
          <a href="/dashboard" className={`px-4 py-2 rounded-lg text-sm ${bgCard(theme)} ${textMuted(theme)} border ${borderColor(theme)}`}>
            ← Dashboard
          </a>
          <ReportButtons examId={examId} />
        </div>
      </div>

      {/* Özet Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className={`p-4 rounded-lg shadow-sm ${bgCard(theme)} ${borderColor(theme)} border`}>
          <p className={`text-xs ${textSecondary(theme)}`}>Katılımcı</p>
          <p className={`text-xl font-bold ${textPrimary(theme)}`}>{summary.totalStudents}</p>
        </div>
        <div className={`p-4 rounded-lg shadow-sm ${bgCard(theme)} ${borderColor(theme)} border`}>
          <p className={`text-xs ${textSecondary(theme)}`}>Ortalama Net</p>
          <p className="text-xl font-bold text-blue-600">{summary.avgNet}</p>
        </div>
        <div className={`p-4 rounded-lg shadow-sm ${bgCard(theme)} ${borderColor(theme)} border`}>
          <p className={`text-xs ${textSecondary(theme)}`}>En Yüksek Net</p>
          <p className="text-xl font-bold text-green-600">{summary.highestNet}</p>
        </div>
        <div className={`p-4 rounded-lg shadow-sm ${bgCard(theme)} ${borderColor(theme)} border`}>
          <p className={`text-xs ${textSecondary(theme)}`}>En Düşük Net</p>
          <p className="text-xl font-bold text-red-600">{summary.lowestNet}</p>
        </div>
        <div className={`p-4 rounded-lg shadow-sm ${bgCard(theme)} ${borderColor(theme)} border`}>
          <p className={`text-xs ${textSecondary(theme)}`}>Başarı %</p>
          <p className="text-xl font-bold text-purple-600">{summary.passRate}%</p>
        </div>
      </div>

      {/* Grafikler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Soru Bazlı Analiz */}
        <div className={`p-5 rounded-xl shadow-sm border ${bgCard(theme)} ${borderColor(theme)}`}>
          <h3 className={`text-lg font-semibold mb-4 ${textMuted(theme)}`}>Soru Bazlı Analiz</h3>
          {questionStats && questionStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={questionStats.map(q => ({
                soru: q.question,
                dogru: q.correct,
                yanlis: q.wrong,
                bos: q.empty,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                <XAxis dataKey="soru" tick={{ fontSize: 10, fill: chartTextColor }} />
                <YAxis domain={[0, 100]} tick={{ fill: chartTextColor }} />
                <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', border: 'none', borderRadius: 8 }} />
                <Legend wrapperStyle={{ color: chartTextColor }} />
                <Bar dataKey="dogru" stackId="a" fill="#10B981" name="Doğru" />
                <Bar dataKey="yanlis" stackId="a" fill="#EF4444" name="Yanlış" />
                <Bar dataKey="bos" stackId="a" fill="#F59E0B" name="Boş" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className={`text-center py-12 ${textSecondary(theme)}`}>Soru verisi yok</p>
          )}
        </div>

        {/* Kazanım Bazlı Başarı */}
        <div className={`p-5 rounded-xl shadow-sm border ${bgCard(theme)} ${borderColor(theme)}`}>
          <h3 className={`text-lg font-semibold mb-4 ${textMuted(theme)}`}>Kazanım Bazlı Başarı</h3>
          {outcomeAnalysis && outcomeAnalysis.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={outcomeAnalysis.map(o => ({
                kazanım: o.code,
                basarı: o.successRate,
              }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: chartTextColor }} />
                <YAxis dataKey="kazanım" type="category" width={80} tick={{ fontSize: 10, fill: chartTextColor }} />
                <Tooltip formatter={(value: number) => `${value}%`} contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', border: 'none', borderRadius: 8 }} />
                <Bar dataKey="başarı" fill="#4A6CF7" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className={`text-center py-12 ${textSecondary(theme)}`}>Kazanım verisi yok</p>
          )}
        </div>
      </div>

      {/* Sınıf Bazlı Breakdown */}
      {summary.classBreakdown && summary.classBreakdown.length > 0 && (
        <div className={`p-5 rounded-xl shadow-sm border ${bgCard(theme)} ${borderColor(theme)} mb-6`}>
          <h3 className={`text-lg font-semibold mb-4 ${textMuted(theme)}`}>Sınıf Bazlı Ortalamalar</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {summary.classBreakdown.map((cb: any) => (
              <div key={cb.classId} className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className={`font-medium ${textPrimary(theme)}`}>{cb.className}</p>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  <span className={textSecondary(theme)}>Net Ort.</span>
                  <span className={`font-bold ${textPrimary(theme)}`}>{cb.avgNet}</span>
                  <span className={textSecondary(theme)}>Puan Ort.</span>
                  <span className={`font-bold ${textPrimary(theme)}`}>{cb.avgScore}</span>
                  <span className={textSecondary(theme)}>Öğrenci</span>
                  <span className={`font-bold ${textPrimary(theme)}`}>{cb.studentCount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Öğrenci Sonuç Tablosu */}
      <div className={`rounded-xl shadow-sm border overflow-hidden ${bgCard(theme)} ${borderColor(theme)}`}>
        <div className={`p-4 border-b ${borderColor2(theme)}`}>
          <h3 className={`font-semibold ${textPrimary(theme)}`}>Öğrenci Sonuçları ({examResults?.length || 0})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className={`px-4 py-3 text-left ${textPrimary(theme)}`}>No</th>
                <th className={`px-4 py-3 text-center ${textPrimary(theme)}`}>Doğru</th>
                <th className={`px-4 py-3 text-center ${textPrimary(theme)}`}>Yanlış</th>
                <th className={`px-4 py-3 text-center ${textPrimary(theme)}`}>Boş</th>
                <th className={`px-4 py-3 text-center ${textPrimary(theme)}`}>Net</th>
                <th className={`px-4 py-3 text-center ${textPrimary(theme)}`}>Başarı %</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${borderColor2(theme)}`}>
              {(examResults || []).map((r: any, i: number) => (
                <tr key={i} className={theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                  <td className={`px-4 py-3 ${textPrimary(theme)}`}>{r.studentNo}</td>
                  <td className="px-4 py-3 text-center text-green-600 font-medium">{r.correctCount}</td>
                  <td className="px-4 py-3 text-center text-red-600 font-medium">{r.wrongCount}</td>
                  <td className="px-4 py-3 text-center text-yellow-600 font-medium">{r.emptyCount}</td>
                  <td className="px-4 py-3 text-center font-bold text-blue-600">{r.net}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      r.successRate >= 80 ? 'bg-green-100 text-green-700' :
                      r.successRate >= 60 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {r.successRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cevap Dağılımı */}
      <div className={`p-5 rounded-xl shadow-sm border ${bgCard(theme)} ${borderColor(theme)} mt-6`}>
        <h3 className={`text-lg font-semibold mb-4 ${textMuted(theme)}`}>Genel Cevap Dağılımı</h3>
        <div className="flex gap-8 justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl font-bold text-green-600">{summary.correctDistribution?.correct || 0}</span>
            </div>
            <p className={`text-sm ${textSecondary(theme)}`}>Doğru</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl font-bold text-red-600">{summary.correctDistribution?.wrong || 0}</span>
            </div>
            <p className={`text-sm ${textSecondary(theme)}`}>Yanlış</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl font-bold text-yellow-600">{summary.correctDistribution?.empty || 0}</span>
            </div>
            <p className={`text-sm ${textSecondary(theme)}`}>Boş</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
