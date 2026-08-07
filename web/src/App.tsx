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
        <Route path="/schools" element={<SchoolsPage />} />
        <Route path="/score-coefficients" element={<ScoreCoefficientsPage />} />
        <Route path="/score-calculator" element={<ScoreCalculatorPage />} />
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

// Excel Import Sayfası - .xlsx Dosya Yükleme + JSON Yapıştırma
function ImportPage() {
  const { theme } = useTheme();
  const [jsonText, setJsonText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'file' | 'json'>('file');
  const [filePreview, setFilePreview] = useState<any[]>([]);
  const [selectedFileName, setSelectedFileName] = useState('');

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

  const handleImport = async (items: any[]) => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
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
      setError('Bağlantı hatası: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // .xlsx dosya okuma
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');
    setResult(null);
    setSelectedFileName(file.name);

    try {
      // SheetJS (xlsx) kütüphanesini CDN'den yükle
      const XLSX = await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
      const xlsx = XLSX.default || XLSX;

      const arrayBuffer = await file.arrayBuffer();
      const workbook = xlsx.read(arrayBuffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = xlsx.utils.sheet_to_json(firstSheet);

      // Excel satırlarını API formatına dönüştür
      const items = (jsonData as any[]).map(row => ({
        dersAdi: String(row['Ders adı'] || row['Ders Adı'] || row['dersAdi'] || row['ders'] || ''),
        sinif: String(row['Sınıf'] || row['sinif'] || row['sınıf'] || row['class'] || ''),
        kazanımKodu: String(row['Kazanım kodu'] || row['Kazanım Kodu'] || row['kazanımKodu'] || row['kod'] || ''),
        kazanımIsmi: String(row['Kazanım ismi'] || row['Kazanım İsmi'] || row['kazanımIsmi'] || row['kazanım'] || ''),
      })).filter(item => item.dersAdi || item.kazanımKodu); // Boş satırları filtrele

      setFilePreview(items);

      // Önizleme göster, kullanıcı onaylarsa gönder
      setResult(null);
      setLoading(false);
    } catch (err: any) {
      setError('Excel dosyası okunamadı: ' + err.message);
      setLoading(false);
    }

    // Input'u sıfırla (aynı dosyayı tekrar seçebilmek için)
    e.target.value = '';
  };

  const sendFileData = () => {
    if (filePreview.length > 0) {
      handleImport(filePreview);
    }
  };

  const handleJsonImport = () => {
    try {
      const items = JSON.parse(jsonText);
      if (Array.isArray(items)) {
        handleImport(items);
      } else {
        setError('JSON bir dizi (array) olmalıdır');
      }
    } catch (err: any) {
      setError('JSON formatı geçersiz: ' + err.message);
    }
  };

  const loadExample = () => {
    setJsonText(exampleJson);
  };

  return (
    <div className={`p-6 max-w-4xl mx-auto transition-colors duration-300`}>
      <h1 className={`text-2xl font-bold mb-2 ${textPrimary(theme)}`}>📥 Ders & Kazanım İçe Aktarma</h1>
      <p className={`mb-6 ${textMuted(theme)}`}>
        Excel dosyanızdaki ders ve kazanım bilgilerini sisteme aktarabilirsiniz.
        Sınıf sütunu boş olan satırlar otomatik olarak <strong>"Mezun"</strong> sınıfına atanır.
      </p>

      {/* Sekmeler */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('file')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'file'
              ? 'bg-blue-600 text-white'
              : theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
          }`}
        >
          📁 Excel Dosyası Yükle
        </button>
        <button
          onClick={() => setActiveTab('json')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'json'
              ? 'bg-blue-600 text-white'
              : theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {'{}'} JSON Yapıştır
        </button>
      </div>

      {/* Excel Dosya Yükleme Sekmesi */}
      {activeTab === 'file' && (
        <div className={`p-6 rounded-xl shadow-sm border ${bgCard(theme)} ${borderColor(theme)}`}>
          <h3 className={`text-lg font-semibold mb-4 ${textMuted(theme)}`}>Excel Dosyası Seçin</h3>

          <div className={`border-2 border-dashed rounded-xl p-8 text-center ${
            theme === 'dark' ? 'border-gray-600 hover:border-blue-400' : 'border-gray-300 hover:border-blue-500'
          } transition-colors`}>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
              id="excel-upload"
            />
            <label htmlFor="excel-upload" className="cursor-pointer">
              <div className="text-5xl mb-4">📄</div>
              <p className={`text-lg font-medium mb-2 ${textPrimary(theme)}`}>
                Excel dosyasını sürükleyin veya tıklayın
              </p>
              <p className={`text-sm ${textSecondary(theme)}`}>
                .xlsx, .xls veya .csv formatında olabilir
              </p>
              <p className={`text-xs mt-2 ${textMuted(theme)}`}>
                Sütunlar: Ders adı, Sınıf, Kazanım kodu, Kazanım ismi
              </p>
            </label>
          </div>

          {/* Dosya önizleme */}
          {selectedFileName && (
            <div className={`mt-4 p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-blue-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <p className={`font-medium ${textPrimary(theme)}`}>📎 {selectedFileName}</p>
                <span className={`text-sm ${textSecondary(theme)}`}>{filePreview.length} satır bulundu</span>
              </div>

              {filePreview.length > 0 && (
                <div className="overflow-x-auto mt-3">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className={theme === 'dark' ? 'bg-gray-600' : 'bg-blue-100'}>
                        <th className={`px-2 py-1 text-left ${textPrimary(theme)}`}>Ders</th>
                        <th className={`px-2 py-1 text-left ${textPrimary(theme)}`}>Sınıf</th>
                        <th className={`px-2 py-1 text-left ${textPrimary(theme)}`}>Kod</th>
                        <th className={`px-2 py-1 text-left ${textPrimary(theme)}`}>Kazanım</th>
                      </tr>
                    </thead>
                    <tbody className={borderColor2(theme)}>
                      {filePreview.slice(0, 10).map((item, i) => (
                        <tr key={i} className={borderColor2(theme)}>
                          <td className={`px-2 py-1 ${textPrimary(theme)}`}>{item.dersAdi}</td>
                          <td className={`px-2 py-1 ${textSecondary(theme)}`}>{item.sinif || <em>Mezun</em>}</td>
                          <td className={`px-2 py-1 ${textPrimary(theme)}`}>{item.kazanımKodu}</td>
                          <td className={`px-2 py-1 ${textPrimary(theme)}`}>{item.kazanımIsmi.substring(0, 40)}{item.kazanımIsmi.length > 40 ? '...' : ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filePreview.length > 10 && (
                    <p className={`text-xs mt-2 ${textMuted(theme)}`}>...ve {filePreview.length - 10} satır daha</p>
                  )}
                </div>
              )}
            </div>
          )}

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
            onClick={sendFileData}
            disabled={loading || filePreview.length === 0}
            className="mt-4 w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '🔄 İşleniyor...' : `📤 İçe Aktar (${filePreview.length} satır)`}
          </button>
        </div>
      )}

      {/* JSON Yapıştırma Sekmesi */}
      {activeTab === 'json' && (
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
            onClick={handleJsonImport}
            disabled={loading || !jsonText.trim()}
            className="mt-4 w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '🔄 İşleniyor...' : '📤 İçe Aktar'}
          </button>
        </div>
      )}

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

// ─── Okullar & Sınıflar Sayfası ───────────────────────────────────────────
function SchoolsPage() {
  const { theme } = useTheme();
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddSchool, setShowAddSchool] = useState(false);
  const [showAddClass, setShowAddClass] = useState<number | null>(null);
  const [expandedSchoolId, setExpandedSchoolId] = useState<number | null>(null);
  const [schoolClasses, setSchoolClasses] = useState<Record<number, any[]>>({});

  // Okul ekleme form
  const [schoolName, setSchoolName] = useState('');
  const [schoolAddress, setSchoolAddress] = useState('');
  const [schoolPhone, setSchoolPhone] = useState('');
  const [schoolLoading, setSchoolLoading] = useState(false);
  const [schoolSuccess, setSchoolSuccess] = useState(false);

  // Sınıf ekleme form
  const [className, setClassName] = useState('');
  const [classGradeLevel, setClassGradeLevel] = useState('');
  const [classAcademicYear, setClassAcademicYear] = useState('');
  const [classLoading, setClassLoading] = useState(false);
  const [classSuccess, setClassSuccess] = useState(false);

  const token = localStorage.getItem('optiksinav-token') || '';
  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Okulları yükle
  const fetchSchools = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/schools`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        setSchools(data.schools || []);
      }
    } catch (err: any) {
      setError('Okullar yüklenemedi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Bir okulun sınıflarını yükle
  const fetchClasses = async (schoolId: number) => {
    try {
      const response = await fetch(`${API_BASE}/schools/${schoolId}/classes`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        setSchoolClasses(prev => ({ ...prev, [schoolId]: data.classes || [] }));
      }
    } catch (err: any) {
      console.error('Sınıflar yüklenemedi:', err);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  // Okul ekleme
  const handleAddSchool = async () => {
    if (!schoolName.trim()) return;
    setSchoolLoading(true);
    setError('');
    setSchoolSuccess(false);
    try {
      const response = await fetch(`${API_BASE}/schools`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          name: schoolName.trim(),
          address: schoolAddress.trim() || undefined,
          phone: schoolPhone.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setSchoolSuccess(true);
        setSchoolName('');
        setSchoolAddress('');
        setSchoolPhone('');
        setShowAddSchool(false);
        fetchSchools();
      } else {
        setError(data.message || 'Okul eklenemedi');
      }
    } catch (err: any) {
      setError('Bağlantı hatası: ' + err.message);
    } finally {
      setSchoolLoading(false);
    }
  };

  // Okul silme
  const handleDeleteSchool = async (schoolId: number) => {
    if (!window.confirm('Bu okulu ve tüm sınıflarını silmek istediğinize emin misiniz?')) return;
    try {
      const response = await fetch(`${API_BASE}/schools/${schoolId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        fetchSchools();
      } else {
        const data = await response.json();
        setError(data.message || 'Okul silinemedi');
      }
    } catch (err: any) {
      setError('Bağlantı hatası: ' + err.message);
    }
  };

  // Sınıf ekleme
  const handleAddClass = async (schoolId: number) => {
    if (!className.trim()) return;
    setClassLoading(true);
    setError('');
    setClassSuccess(false);
    try {
      const response = await fetch(`${API_BASE}/schools/${schoolId}/classes`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          name: className.trim(),
          gradeLevel: classGradeLevel.trim() || undefined,
          academicYear: classAcademicYear.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setClassSuccess(true);
        setClassName('');
        setClassGradeLevel('');
        setClassAcademicYear('');
        setShowAddClass(null);
        fetchClasses(schoolId);
        fetchSchools();
      } else {
        setError(data.message || 'Sınıf eklenemedi');
      }
    } catch (err: any) {
      setError('Bağlantı hatası: ' + err.message);
    } finally {
      setClassLoading(false);
    }
  };

  // Sınıf silme
  const handleDeleteClass = async (schoolId: number, classId: number) => {
    if (!window.confirm('Bu sınıfı silmek istediğinize emin misiniz?')) return;
    try {
      const response = await fetch(`${API_BASE}/schools/${schoolId}/classes/${classId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        fetchClasses(schoolId);
        fetchSchools();
      } else {
        const data = await response.json();
        setError(data.message || 'Sınıf silinemedi');
      }
    } catch (err: any) {
      setError('Bağlantı hatası: ' + err.message);
    }
  };

  // Okul genişletme
  const toggleSchool = async (schoolId: number) => {
    if (expandedSchoolId === schoolId) {
      setExpandedSchoolId(null);
    } else {
      setExpandedSchoolId(schoolId);
      if (!schoolClasses[schoolId]) {
        await fetchClasses(schoolId);
      }
    }
  };

  // ─── Öğrenci Yönetimi State ───────────────────────────────────────────────
  const [expandedClassId, setExpandedClassId] = useState<number | null>(null);
  const [classStudents, setClassStudents] = useState<Record<number, any[]>>({});
  const [showAddStudent, setShowAddStudent] = useState<number | null>(null);
  const [studentFirstName, setStudentFirstName] = useState('');
  const [studentLastName, setStudentLastName] = useState('');
  const [studentNo, setStudentNo] = useState('');
  const [studentParentPhone, setStudentParentPhone] = useState('');
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentSuccess, setStudentSuccess] = useState(false);

  // Öğrencileri yükle
  const fetchStudents = async (classId: number) => {
    try {
      const response = await fetch(`${API_BASE}/roster/classes/${classId}/students`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setClassStudents(prev => ({ ...prev, [classId]: data.students || [] }));
      }
    } catch (err: any) {
      console.error('Öğrenciler yüklenemedi:', err);
    }
  };

  // Öğrenci ekleme
  const handleAddStudent = async (classId: number) => {
    if (!studentFirstName.trim() || !studentLastName.trim()) return;
    setStudentLoading(true);
    setError('');
    setStudentSuccess(false);
    try {
      const response = await fetch(`${API_BASE}/roster/students`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          classId,
          firstName: studentFirstName.trim(),
          lastName: studentLastName.trim(),
          studentNo: studentNo.trim() || undefined,
          parentPhone: studentParentPhone.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setStudentSuccess(true);
        setStudentFirstName('');
        setStudentLastName('');
        setStudentNo('');
        setStudentParentPhone('');
        setShowAddStudent(null);
        fetchStudents(classId);
        fetchClasses(schools.find(s => schoolClasses[s.id]?.some(c => c.id === classId))?.id || 0);
      } else {
        setError(data.message || 'Öğrenci eklenemedi');
      }
    } catch (err: any) {
      setError('Bağlantı hatası: ' + err.message);
    } finally {
      setStudentLoading(false);
    }
  };

  // Öğrenci silme
  const handleDeleteStudent = async (studentId: number, classId: number) => {
    if (!window.confirm('Bu öğrenciyi silmek istediğinize emin misiniz?')) return;
    try {
      const response = await fetch(`${API_BASE}/roster/students/${studentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        fetchStudents(classId);
      } else {
        const data = await response.json();
        setError(data.message || 'Öğrenci silinemedi');
      }
    } catch (err: any) {
      setError('Bağlantı hatası: ' + err.message);
    }
  };

  // ─── Sınıf Geçişi ve Geçmiş State ────────────────────────────────────────
  const [showTransferModal, setShowTransferModal] = useState<number | null>(null); // öğrenci id
  const [transferSelectedClassId, setTransferSelectedClassId] = useState<number | null>(null);
  const [transferLoading, setTransferLoading] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState<number | null>(null); // öğrenci id
  const [studentHistory, setStudentHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Tüm sınıfları al (transfer için)
  const getAllClasses = (): any[] => {
    const allClasses: any[] = [];
    Object.values(schoolClasses).forEach(classes => {
      allClasses.push(...classes);
    });
    return allClasses;
  };

  // Öğrenciyi sınıfa aktar
  const handleTransferStudent = async (studentId: number) => {
    if (!transferSelectedClassId) return;
    setTransferLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/roster/students/${studentId}/transfer`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ newClassId: transferSelectedClassId }),
      });
      const data = await response.json();
      if (response.ok) {
        setShowTransferModal(null);
        setTransferSelectedClassId(null);
        // Öğrenci listesini yenile
        const oldClass = Object.keys(schoolClasses).find(k =>
          schoolClasses[parseInt(k)]?.some(c => c.id === studentId) // Not: student değil class
        );
        // Tüm genişletilmiş sınıfların öğrencilerini yenile
        if (expandedClassId) {
          await fetchStudents(expandedClassId);
        }
        fetchSchools();
      } else {
        setError(data.message || 'Sınıf aktarımı başarısız');
      }
    } catch (err: any) {
      setError('Bağlantı hatası: ' + err.message);
    } finally {
      setTransferLoading(false);
    }
  };

  // Öğrenci geçmişini yükle
  const fetchStudentHistory = async (studentId: number) => {
    setShowHistoryModal(studentId);
    setHistoryLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/roster/students/${studentId}/history`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setStudentHistory(data.history || []);
      } else {
        const data = await response.json();
        setError(data.message || 'Geçmiş yüklenemedi');
        setStudentHistory([]);
      }
    } catch (err: any) {
      setError('Bağlantı hatası: ' + err.message);
      setStudentHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Sınıf genişletme (öğrenci göster)
  const toggleClassStudents = async (classId: number) => {
    if (expandedClassId === classId) {
      setExpandedClassId(null);
    } else {
      setExpandedClassId(classId);
      if (!classStudents[classId]) {
        await fetchStudents(classId);
      }
    }
  };

  return (
    <div className={`p-6 max-w-5xl mx-auto transition-colors duration-300`}>
      <div className="flex items-center justify-between mb-6">
        <h1 className={`text-2xl font-bold ${textPrimary(theme)}`}>🏫 Okullar & Sınıflar</h1>
        <div className="flex gap-2">
          <a href="/dashboard" className={`px-4 py-2 rounded-lg text-sm ${bgCard(theme)} ${textMuted(theme)} border ${borderColor(theme)}`}>
            ← Dashboard
          </a>
          <button
            onClick={() => setShowAddSchool(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            + Yeni Okul
          </button>
        </div>
      </div>

      {/* Hata Mesajı */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          ⚠️ {error}
          <button onClick={() => setError('')} className="ml-2 font-bold">&times;</button>
        </div>
      )}

      {/* Okul Ekleme Modal */}
      {showAddSchool && (
        <div className={`mb-6 p-6 rounded-xl shadow-sm border ${bgCard(theme)} ${borderColor(theme)}`}>
          <h3 className={`text-lg font-semibold mb-4 ${textMuted(theme)}`}>Yeni Okul Ekle</h3>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${textMuted(theme)}`}>Okul Adı *</label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="Örn: Atatürk Ortaokulu"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg(theme)}`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${textMuted(theme)}`}>Adres</label>
              <input
                type="text"
                value={schoolAddress}
                onChange={(e) => setSchoolAddress(e.target.value)}
                placeholder="Örn: Merkez Mah. Eğitim Sok. No:5"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg(theme)}`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${textMuted(theme)}`}>Telefon</label>
              <input
                type="text"
                value={schoolPhone}
                onChange={(e) => setSchoolPhone(e.target.value)}
                placeholder="Örn: 0(212) 555 1234"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg(theme)}`}
              />
            </div>

            {schoolSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                ✅ Okul başarıyla eklendi!
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleAddSchool}
                disabled={schoolLoading || !schoolName.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {schoolLoading ? '🔄 Ekleniyor...' : '✅ Okul Ekle'}
              </button>
              <button
                onClick={() => { setShowAddSchool(false); setSchoolSuccess(false); }}
                className={`px-6 py-2 rounded-lg ${bgCard(theme)} ${textMuted(theme)} border ${borderColor(theme)}`}
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Okul Listesi */}
      {loading ? (
        <div className={`p-12 text-center ${bgCard(theme)} rounded-xl`}>Yükleniyor...</div>
      ) : schools.length === 0 ? (
        <div className={`p-12 text-center ${bgCard(theme)} rounded-xl`}>
          <p className={`text-lg mb-2 ${textPrimary(theme)}`}>Henüz okul eklenmemiş</p>
          <p className={`text-sm ${textSecondary(theme)}`}>Yukarıdaki "Yeni Okul" butonuna tıklayarak ilk okulunuzu ekleyin.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {schools.map((school: any) => (
            <div key={school.id} className={`rounded-xl shadow-sm border overflow-hidden ${bgCard(theme)} ${borderColor(theme)}`}>
              {/* Okul Başlığı */}
              <div
                className={`flex items-center justify-between p-4 cursor-pointer ${
                  theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                } transition-colors`}
                onClick={() => toggleSchool(school.id)}
              >
                <div className="flex items-center gap-3">
                  <span className={`transform transition-transform ${expandedSchoolId === school.id ? 'rotate-90' : ''}`}>
                    ▶
                  </span>
                  <div>
                    <p className={`font-semibold ${textPrimary(theme)}`}>🏫 {school.name}</p>
                    <div className="flex gap-4 mt-1 text-xs">
                      {school.address && <span className={textSecondary(theme)}>📍 {school.address}</span>}
                      {school.phone && <span className={textSecondary(theme)}>📞 {school.phone}</span>}
                      <span className={textSecondary(theme)}>📚 {school.classCount || 0} sınıf</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSchool(school.id);
                  }}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs hover:bg-red-200 transition-colors"
                >
                  🗑️ Sil
                </button>
              </div>

              {/* Sınıflar */}
              {expandedSchoolId === school.id && (
                <div className={`border-t ${borderColor2(theme)} p-4`}>
                  {/* Sınıf Ekleme */}
                  {showAddClass === school.id ? (
                    <div className={`p-4 rounded-lg mb-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-blue-50'}`}>
                      <h4 className={`font-medium mb-3 ${textMuted(theme)}`}>Yeni Sınıf Ekle</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          type="text"
                          value={className}
                          onChange={(e) => setClassName(e.target.value)}
                          placeholder="Sınıf adı (örn: 8-A)"
                          className={`px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg(theme)}`}
                        />
                        <input
                          type="text"
                          value={classGradeLevel}
                          onChange={(e) => setClassGradeLevel(e.target.value)}
                          placeholder="Sınıf seviyesi (örn: 8. Sınıf)"
                          className={`px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg(theme)}`}
                        />
                        <input
                          type="text"
                          value={classAcademicYear}
                          onChange={(e) => setClassAcademicYear(e.target.value)}
                          placeholder="Akademik yıl (örn: 2025-2026)"
                          className={`px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg(theme)}`}
                        />
                      </div>
                      {classSuccess && (
                        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                          ✅ Sınıf başarıyla eklendi!
                        </div>
                      )}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleAddClass(school.id)}
                          disabled={classLoading || !className.trim()}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                        >
                          {classLoading ? '🔄' : '✅ Sınıf Ekle'}
                        </button>
                        <button
                          onClick={() => { setShowAddClass(null); setClassSuccess(false); }}
                          className={`px-4 py-2 rounded-lg text-sm ${bgCard(theme)} ${textMuted(theme)} border ${borderColor(theme)}`}
                        >
                          İptal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddClass(school.id)}
                      className="mb-4 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                    >
                      + Yeni Sınıf
                    </button>
                  )}

                  {/* Sınıf Listesi */}
                  {schoolClasses[school.id] && schoolClasses[school.id].length > 0 ? (
                    <div className="space-y-2">
                      <div className={`grid grid-cols-4 gap-4 px-3 py-2 rounded-lg text-xs font-semibold ${
                        theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <span>Sınıf Adı</span>
                        <span>Sınıf Seviyesi</span>
                        <span>Akademik Yıl</span>
                        <span className="text-right">İşlem</span>
                      </div>
                      {schoolClasses[school.id].map((cls: any) => (
                        <div key={cls.id}>
                          {/* Sınıf Satırı - Tıklanınca öğrenciler görünür */}
                          <div
                            className={`grid grid-cols-4 gap-4 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                              expandedClassId === cls.id
                                ? (theme === 'dark' ? 'bg-blue-900/30 border border-blue-500/30' : 'bg-blue-50 border border-blue-200')
                                : (theme === 'dark' ? 'bg-gray-700/50 hover:bg-gray-600/50' : 'bg-gray-50 hover:bg-gray-100')
                            }`}
                            onClick={() => toggleClassStudents(cls.id)}
                          >
                            <span className={`font-medium ${textPrimary(theme)}`}>▶ {cls.name}</span>
                            <span className={textSecondary(theme)}>{cls.gradeLevel || '—'}</span>
                            <span className={textSecondary(theme)}>{cls.academicYear || '—'}</span>
                            <span className="text-right flex items-center justify-end gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-gray-600 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                                👥 {classStudents[cls.id]?.length || 0} öğrenci
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClass(school.id, cls.id);
                                }}
                                className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                              >
                                🗑️
                              </button>
                            </span>
                          </div>

                          {/* Öğrenci Alt Görünümü */}
                          {expandedClassId === cls.id && (
                            <div className={`ml-4 mt-2 mb-3 p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700/30 border border-gray-600' : 'bg-white border border-gray-200'}`}>
                              {/* Öğrenci Ekleme */}
                              {showAddStudent === cls.id ? (
                                <div className={`p-3 rounded-lg mb-3 ${theme === 'dark' ? 'bg-gray-600' : 'bg-green-50'}`}>
                                  <h5 className={`text-sm font-medium mb-2 ${textMuted(theme)}`}>Yeni Öğrenci Ekle</h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                                    <input
                                      type="text"
                                      value={studentFirstName}
                                      onChange={(e) => setStudentFirstName(e.target.value)}
                                      placeholder="Ad *"
                                      className={`px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${inputBg(theme)}`}
                                    />
                                    <input
                                      type="text"
                                      value={studentLastName}
                                      onChange={(e) => setStudentLastName(e.target.value)}
                                      placeholder="Soyad *"
                                      className={`px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${inputBg(theme)}`}
                                    />
                                    <input
                                      type="text"
                                      value={studentNo}
                                      onChange={(e) => setStudentNo(e.target.value)}
                                      placeholder="Okul Numarası"
                                      className={`px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${inputBg(theme)}`}
                                    />
                                    <input
                                      type="text"
                                      value={studentParentPhone}
                                      onChange={(e) => setStudentParentPhone(e.target.value)}
                                      placeholder="Veli Telefonu"
                                      className={`px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${inputBg(theme)}`}
                                    />
                                  </div>
                                  {studentSuccess && (
                                    <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
                                      ✅ Öğrenci eklendi!
                                    </div>
                                  )}
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleAddStudent(cls.id)}
                                      disabled={studentLoading || !studentFirstName.trim() || !studentLastName.trim()}
                                      className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                                    >
                                      {studentLoading ? '🔄' : '✅ Ekle'}
                                    </button>
                                    <button
                                      onClick={() => { setShowAddStudent(null); setStudentSuccess(false); }}
                                      className={`px-4 py-1.5 rounded-lg text-sm ${bgCard(theme)} ${textMuted(theme)} border ${borderColor(theme)}`}
                                    >
                                      İptal
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setShowAddStudent(cls.id)}
                                  className="mb-3 px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                                >
                                  + Öğrenci Ekle
                                </button>
                              )}

                              {/* Öğrenci Listesi */}
                              {classStudents[cls.id] && classStudents[cls.id].length > 0 ? (
                                <div className="space-y-1">
                                  <div className={`grid grid-cols-5 gap-2 px-2 py-1.5 rounded text-xs font-semibold ${
                                    theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-500'
                                  }`}>
                                    <span>Ad Soyad</span>
                                    <span>No</span>
                                    <span>Veli Tel</span>
                                    <span>Durum</span>
                                    <span className="text-right">İşlem</span>
                                  </div>
                                  {classStudents[cls.id].map((student: any) => (
                                    <div
                                      key={student.id}
                                      className={`grid grid-cols-5 gap-2 px-2 py-1.5 rounded text-sm ${
                                        theme === 'dark' ? 'bg-gray-600/50' : 'bg-gray-50'
                                      }`}
                                    >
                                      <span className={`font-medium ${textPrimary(theme)}`}>
                                        {student.firstName} {student.lastName}
                                      </span>
                                      <span className={textSecondary(theme)}>{student.studentNo || '—'}</span>
                                      <span className={textSecondary(theme)}>{student.parentPhone || '—'}</span>
                                      <span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                                          student.isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                          {student.isApproved ? 'Aktif' : 'Beklemede'}
                                        </span>
                                      </span>
                                      <span className="text-right flex items-center justify-end gap-1">
                                        <button
                                          onClick={() => {
                                            setShowTransferModal(student.id);
                                            setTransferSelectedClassId(null);
                                          }}
                                          title="Sınıf Değiştir"
                                          className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                                        >
                                          🔄
                                        </button>
                                        <button
                                          onClick={() => fetchStudentHistory(student.id)}
                                          title="Geçmiş"
                                          className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200"
                                        >
                                          📋
                                        </button>
                                        <button
                                          onClick={() => handleDeleteStudent(student.id, cls.id)}
                                          title="Sil"
                                          className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                                        >
                                          🗑️
                                        </button>
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className={`text-center py-4 text-sm ${textSecondary(theme)}`}>
                                  Henüz öğrenci yok — "+ Öğrenci Ekle" butonuna tıklayın.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={`text-center py-6 text-sm ${textSecondary(theme)}`}>
                      Henüz sınıf eklenmemiş
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Sınıf Değiştirme Modal */}
      {showTransferModal !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`max-w-md w-full p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${textPrimary(theme)}`}>🔄 Sınıf Değiştir</h3>
            <p className={`text-sm mb-4 ${textSecondary(theme)}`}>
              Öğrenciyi aşağıdaki sınıflardan birine aktarın:
            </p>

            <select
              value={transferSelectedClassId || ''}
              onChange={(e) => setTransferSelectedClassId(e.target.value ? parseInt(e.target.value) : null)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg(theme)}`}
            >
              <option value="">-- Sınıf Seçin --</option>
              {getAllClasses().map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} {cls.gradeLevel ? `(${cls.gradeLevel})` : ''}
                </option>
              ))}
            </select>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => handleTransferStudent(showTransferModal)}
                disabled={transferLoading || !transferSelectedClassId}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {transferLoading ? '🔄 Aktarılıyor...' : '✅ Aktar'}
              </button>
              <button
                onClick={() => { setShowTransferModal(null); setTransferSelectedClassId(null); }}
                className={`px-5 py-2 rounded-lg text-sm ${bgCard(theme)} ${textMuted(theme)} border ${borderColor(theme)}`}
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Öğrenci Geçmişi Modal */}
      {showHistoryModal !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`max-w-lg w-full p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${textPrimary(theme)}`}>📋 Öğrenci Geçmişi</h3>
              <button
                onClick={() => setShowHistoryModal(null)}
                className={`text-xl ${textSecondary(theme)} hover:text-red-500`}
              >
                &times;
              </button>
            </div>

            {historyLoading ? (
              <p className={`text-center py-8 ${textSecondary(theme)}`}>Yükleniyor...</p>
            ) : studentHistory.length === 0 ? (
              <p className={`text-center py-8 ${textSecondary(theme)}`}>Geçmiş kaydı bulunamadı.</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {studentHistory.map((h: any, index: number) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-medium text-sm ${textPrimary(theme)}`}>
                        🏫 {h.className || h.schoolName || '—'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        h.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {h.isActive ? 'Aktif' : 'Geçmiş'}
                      </span>
                    </div>
                    <div className={`text-xs ${textSecondary(theme)}`}>
                      <span>📅 Başlangıç: {h.startDate ? new Date(h.startDate).toLocaleDateString('tr-TR') : '—'}</span>
                      {' | '}
                      <span>Bitiş: {h.endDate ? new Date(h.endDate).toLocaleDateString('tr-TR') : 'Devam ediyor'}</span>
                    </div>
                    {h.method && (
                      <p className={`text-xs mt-1 ${textMuted(theme)}`}>Katılım: {h.method}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowHistoryModal(null)}
              className={`mt-4 w-full py-2 rounded-lg text-sm ${bgCard(theme)} ${textMuted(theme)} border ${borderColor(theme)}`}
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      {/* Bilgi Kartı */}
      <div className={`mt-8 p-5 rounded-xl shadow-sm border ${bgCard(theme)} ${borderColor(theme)}`}>
        <h3 className={`text-sm font-semibold mb-2 ${textMuted(theme)}`}>💡 Bilgi</h3>
        <p className={`text-sm ${textSecondary(theme)}`}>
          Okul ve sınıflarınızı burada yönetebilirsiniz. Eklediğiniz okullar, sınav tanımlama ve öğrenci kayıt işlemlerinde kullanılacaktır.
          Her okul altında birden fazla sınıf oluşturabilirsiniz. Öğrenci satırındaki 🔄 butonu ile sınıf değiştirebilir,
          📋 butonu ile öğrencinin geçmişini görebilirsiniz.
        </p>
      </div>
    </div>
  );
}

// ─── Puan Katsayıları Yönetim Sayfası ─────────────────────────────────────
// Yıllık TYT/AYT/LGS puan hesaplama katsayıları
function ScoreCoefficientsPage() {
  const { theme } = useTheme();
  const [examType, setExamType] = useState('TYT');
  const [year, setYear] = useState('2026');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [rows, setRows] = useState<any[]>([]);

  const token = localStorage.getItem('optiksinav-token') || '';
  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Varsayılan dersler (her sınav türü için)
  const defaultSubjects: Record<string, string[]> = {
    TYT: ['turkce', 'matematik', 'sosyal', 'fen'],
    AYT: ['matematik', 'fizik', 'kimya', 'biyoloji', 'tarih1', 'tarih2', 'cografya1', 'cografya2', 'felsefe', 'din'],
    LGS: ['turkce', 'matematik', 'fen', 'sosyal', 'ingilizce', 'din'],
  };

  // Verileri yükle
  const fetchCoefficients = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `${API_BASE}/score-coefficients?examType=${examType}&year=${year}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.coefficients && data.coefficients.length > 0) {
          // Mevcut kayıtları kullan
          setRows(data.coefficients.map((c: any) => ({
            subjectCode: c.subjectCode,
            average: c.average || '',
            stdDeviation: c.stdDeviation || '',
            coefficient: c.coefficient || '',
            id: c.id,
          })));
        } else {
          // Varsayılan derslerle boş satırlar oluştur
          const subjects = defaultSubjects[examType] || defaultSubjects.TYT;
          setRows(subjects.map(s => ({
            subjectCode: s,
            average: '',
            stdDeviation: '',
            coefficient: '',
            id: null,
          })));
        }
      } else {
        // API yoksa varsayılan dersleri göster
        const subjects = defaultSubjects[examType] || defaultSubjects.TYT;
        setRows(subjects.map(s => ({
          subjectCode: s,
          average: '',
          stdDeviation: '',
          coefficient: '',
          id: null,
        })));
      }
    } catch (err: any) {
      // API yoksa varsayılan dersleri göster
      const subjects = defaultSubjects[examType] || defaultSubjects.TYT;
      setRows(subjects.map(s => ({
        subjectCode: s,
        average: '',
        stdDeviation: '',
        coefficient: '',
        id: null,
      })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoefficients();
  }, [examType, year]);

  // Satır güncelleme
  const updateRow = (index: number, field: string, value: string) => {
    setRows(prev => prev.map((row, i) =>
      i === index ? { ...row, [field]: value } : row
    ));
  };

  // Kaydet (bulk)
  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const items = rows.map(r => ({
        subjectCode: r.subjectCode,
        average: r.average ? parseFloat(r.average) : undefined,
        stdDeviation: r.stdDeviation ? parseFloat(r.stdDeviation) : undefined,
        coefficient: r.coefficient ? parseFloat(r.coefficient) : undefined,
      }));

      const response = await fetch(`${API_BASE}/score-coefficients/bulk`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ examType, year: parseInt(year), items }),
      });

      if (response.ok) {
        setSuccess(true);
        fetchCoefficients(); // Yeniden yükle
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await response.json();
        setError(data.message || 'Kaydedilemedi');
      }
    } catch (err: any) {
      setError('Bağlantı hatası: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const examTypeLabels: Record<string, string> = {
    TYT: '📝 TYT (Temel Yeterlilik)',
    AYT: '📚 AYT (Alan Yeterlilik)',
    LGS: '🎓 LGS (Lise Geçiş)',
  };

  return (
    <div className={`p-6 max-w-6xl mx-auto transition-colors duration-300`}>
      <div className="flex items-center justify-between mb-6">
        <h1 className={`text-2xl font-bold ${textPrimary(theme)}`}>📐 Puan Katsayıları</h1>
        <div className="flex gap-2">
          <a href="/dashboard" className={`px-4 py-2 rounded-lg text-sm ${bgCard(theme)} ${textMuted(theme)} border ${borderColor(theme)}`}>
            ← Dashboard
          </a>
        </div>
      </div>

      <p className={`mb-6 text-sm ${textSecondary(theme)}`}>
        TYT/AYT/LGS puan hesaplaması için kullanılan yıllık katsayıları (ham puan ortalaması, standart sapma, ağırlık katsayısı) yönetin.
      </p>

      {/* Filtre: Sınav Türü + Yıl */}
      <div className={`p-5 rounded-xl shadow-sm border ${bgCard(theme)} ${borderColor(theme)} mb-6`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${textMuted(theme)}`}>Sınav Türü</label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg(theme)}`}
            >
              <option value="TYT">TYT</option>
              <option value="AYT">AYT</option>
              <option value="LGS">LGS</option>
            </select>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 ${textMuted(theme)}`}>Yıl</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              min="2020"
              max="2030"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg(theme)}`}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchCoefficients}
              className={`px-4 py-2 rounded-lg text-sm ${bgCard(theme)} ${textMuted(theme)} border ${borderColor(theme)} hover:bg-blue-50`}
            >
              🔄 Yenile
            </button>
          </div>
        </div>
        <p className={`mt-2 text-xs ${textSecondary(theme)}`}>
          Seçili: {examTypeLabels[examType]} — {year}
        </p>
      </div>

      {/* Hata Mesajı */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          ⚠️ {error}
          <button onClick={() => setError('')} className="ml-2 font-bold">&times;</button>
        </div>
      )}

      {/* Başarı Mesajı */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          ✅ Katsayılar başarıyla kaydedildi!
        </div>
      )}

      {/* Katsayı Tablosu */}
      {loading ? (
        <div className={`p-12 text-center ${bgCard(theme)} rounded-xl`}>Yükleniyor...</div>
      ) : (
        <div className={`rounded-xl shadow-sm border overflow-hidden ${bgCard(theme)} ${borderColor(theme)}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-4 py-3 text-left ${textPrimary(theme)}`}>Ders Kodu</th>
                  <th className={`px-4 py-3 text-center ${textPrimary(theme)}`}>Ham Puan Ortalaması</th>
                  <th className={`px-4 py-3 text-center ${textPrimary(theme)}`}>Standart Sapma</th>
                  <th className={`px-4 py-3 text-center ${textPrimary(theme)}`}>Ağırlık Katsayısı</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${borderColor2(theme)}`}>
                {rows.map((row, index) => (
                  <tr key={row.subjectCode} className={theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                    <td className={`px-4 py-3 font-medium ${textPrimary(theme)}`}>{row.subjectCode}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={row.average}
                        onChange={(e) => updateRow(index, 'average', e.target.value)}
                        placeholder="0.00"
                        className={`w-24 px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg(theme)}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={row.stdDeviation}
                        onChange={(e) => updateRow(index, 'stdDeviation', e.target.value)}
                        placeholder="0.00"
                        className={`w-24 px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg(theme)}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.0001"
                        value={row.coefficient}
                        onChange={(e) => updateRow(index, 'coefficient', e.target.value)}
                        placeholder="0.0000"
                        className={`w-24 px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg(theme)}`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Kaydet Butonu */}
          <div className={`p-4 border-t ${borderColor2(theme)} flex justify-end`}>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '🔄 Kaydediliyor...' : '💾 Kaydet'}
            </button>
          </div>
        </div>
      )}

      {/* Bilgi Kartı */}
      <div className={`mt-6 p-5 rounded-xl shadow-sm border ${bgCard(theme)} ${borderColor(theme)}`}>
        <h3 className={`text-sm font-semibold mb-2 ${textMuted(theme)}`}>💡 Bilgi</h3>
        <p className={`text-sm ${textSecondary(theme)}`}>
          Bu katsayılar, öğrencilerin TYT/AYT/LGS puanlarının hesaplanmasında kullanılır.
          Her yıl ÖSYM tarafından yayınlanan yeni katsayıları buraya girebilirsiniz.
          Aynı sınav türü ve yıl kombinasyonu için yeni kayıt eklemek yerine mevcut kayıtlar güncellenir.
        </p>
      </div>
    </div>
  );
}

// ─── TYT/AYT/LGS Puan Hesaplama Sayfası (Public — Giriş Gerektirmez) ─────
function ScoreCalculatorPage() {
  const { theme } = useTheme();
  const [examType, setExamType] = useState('TYT');
  const [nets, setNets] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [comparison, setComparison] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectsLoaded, setSubjectsLoaded] = useState(false);

  const currentYear = new Date().getFullYear();

  // Varsayılan dersler (katsayı verisi yoksa fallback)
  const defaultSubjects: Record<string, string[]> = {
    TYT: ['turkce', 'matematik', 'sosyal', 'fen'],
    AYT: ['matematik', 'fizik', 'kimya', 'biyoloji', 'tarih1', 'tarih2', 'cografya1', 'cografya2', 'felsefe', 'din'],
    LGS: ['turkce', 'matematik', 'fen', 'sosyal', 'ingilizce', 'din'],
  };

  const subjectLabels: Record<string, string> = {
    turkce: '📖 Türkçe',
    matematik: '📐 Matematik',
    sosyal: '🌍 Sosyal Bilimler',
    fen: '🔬 Fen Bilimleri',
    fizik: '⚡ Fizik',
    kimya: '⚗️ Kimya',
    biyoloji: '🧬 Biyoloji',
    tarih1: '📜 Tarih-1',
    tarih2: '📜 Tarih-2',
    cografya1: '🗺️ Coğrafya-1',
    cografya2: '🗺️ Coğrafya-2',
    felsefe: '💭 Felsefe',
    din: '☪️ Din Kültürü',
    ingilizce: '🇬🇧 İngilizce',
    inkilap: '🏛️ İnkılap Tarihi',
  };

  // Sınav türü değişince dersleri yükle
  useEffect(() => {
    loadSubjects();
    setResult(null);
    setComparison([]);
  }, [examType]);

  const loadSubjects = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `${API_BASE}/score-coefficients?examType=${examType}&year=${currentYear}`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('optiksinav-token') || ''}` } }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.coefficients && data.coefficients.length > 0) {
          const subjectList = data.coefficients.map((c: any) => c.subjectCode);
          setSubjects(subjectList);
          // Nets'i güncelle (mevcut değerleri koru)
          setNets(prev => {
            const newNets: Record<string, string> = {};
            subjectList.forEach(s => {
              newNets[s] = prev[s] || '';
            });
            return newNets;
          });
          setSubjectsLoaded(true);
        } else {
          setSubjects(defaultSubjects[examType] || []);
          setSubjectsLoaded(false);
        }
      } else {
        setSubjects(defaultSubjects[examType] || []);
        setSubjectsLoaded(false);
      }
    } catch (err: any) {
      setSubjects(defaultSubjects[examType] || []);
      setSubjectsLoaded(false);
    } finally {
      setLoading(false);
    }
  };

  // Net değeri değişince
  const handleNetChange = (subjectCode: string, value: string) => {
    setNets(prev => ({ ...prev, [subjectCode]: value }));
  };

  // Puan hesapla (verilen yılın katsayıları ile)
  const calculateForYear = async (year: number, coefficients: any[]) => {
    const coeffs = coefficients.find((c: any) => c.year === year);
    if (!coeffs) return null;

    const coeffMap = new Map();
    coeffs.forEach((c: any) => coeffMap.set(c.subjectCode, c));

    // Ham puan hesapla
    let hamPuan = 0;
    let hasData = false;
    for (const subject of subjects) {
      const net = parseFloat(nets[subject] || '0');
      const coeff = coeffMap.get(subject);
      if (coeff && coeff.coefficient) {
        hamPuan += net * parseFloat(coeff.coefficient);
        hasData = true;
      }
    }

    if (!hasData) return null;

    // İlk dersin ortalama ve standart sapmasını kullan
    const firstCoeff = coeffs[0];
    const average = firstCoeff.average ? parseFloat(firstCoeff.average) : 0;
    const stdDev = firstCoeff.stdDeviation ? parseFloat(firstCoeff.stdDeviation) : 1;

    // Standart puan: 50 + 10 × (Ham - Ortalama) / StdDev
    const standardPuan = 50 + 10 * ((hamPuan - average) / stdDev);

    return {
      year,
      hamPuan: Math.round(hamPuan * 100) / 100,
      standardPuan: Math.round(standardPuan * 100) / 100,
      average,
      stdDeviation: stdDev,
    };
  };

  // Hesapla butonu
  const handleCalculate = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    setComparison([]);

    try {
      // Son 3 yılın katsayılarını çek
      const years = [currentYear, currentYear - 1, currentYear - 2];
      const allCoefficients: any[] = [];
      let hasAnyData = false;

      for (const year of years) {
        const response = await fetch(
          `${API_BASE}/score-coefficients?examType=${examType}&year=${year}`,
          { headers: { 'Authorization': `Bearer ${localStorage.getItem('optiksinav-token') || ''}` } }
        );
        if (response.ok) {
          const data = await response.json();
          if (data.coefficients && data.coefficients.length > 0) {
            allCoefficients.push(...data.coefficients);
            hasAnyData = true;
          }
        }
      }

      if (!hasAnyData) {
        setError(`${examType} için ${currentYear - 2}-${currentYear} yılları arasında henüz katsayı verisi girilmemiş.`);
        return;
      }

      // Güncel yıl için hesapla
      const currentResult = await calculateForYear(currentYear, allCoefficients);
      if (!currentResult) {
        setError(`${examType} için ${currentYear} yılı katsayı verisi eksik.`);
        return;
      }

      setResult(currentResult);

      // Karşılaştırma tablosu (son 3 yıl)
      const comparisons: any[] = [];
      for (const year of years) {
        const r = await calculateForYear(year, allCoefficients);
        if (r) {
          comparisons.push(r);
        }
      }
      setComparison(comparisons);
    } catch (err: any) {
      setError('Hesaplama sırasında bir hata oluştu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const examTypeLabels: Record<string, string> = {
    TYT: '📝 TYT (Temel Yeterlilik Testi)',
    AYT: '📚 AYT (Alan Yeterlilik Testi)',
    LGS: '🎓 LGS (Liseye Geçiş Sınavı)',
  };

  return (
    <div className={`p-6 max-w-4xl mx-auto transition-colors duration-300`}>
      <div className="flex items-center justify-between mb-6">
        <h1 className={`text-2xl font-bold ${textPrimary(theme)}`}>🧮 Puan Hesaplama</h1>
        <div className="flex gap-2">
          <a href="/dashboard" className={`px-4 py-2 rounded-lg text-sm ${bgCard(theme)} ${textMuted(theme)} border ${borderColor(theme)}`}>
            ← Dashboard
          </a>
          <a href="/score-coefficients" className={`px-4 py-2 rounded-lg text-sm ${bgCard(theme)} ${textMuted(theme)} border ${borderColor(theme)}`}>
            📐 Katsayılar
          </a>
        </div>
      </div>

      <p className={`mb-6 text-sm ${textSecondary(theme)}`}>
        Net sayılarınızı girerek tahmini YKS/LGS puanınızı hesaplayın. Son 3 yılın katsayılarıyla karşılaştırma yapılır.
      </p>

      {/* Sınav Türü Seçimi */}
      <div className={`p-5 rounded-xl shadow-sm border ${bgCard(theme)} ${borderColor(theme)} mb-6`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {['TYT', 'AYT', 'LGS'].map(type => (
            <button
              key={type}
              onClick={() => setExamType(type)}
              className={`px-4 py-3 rounded-lg font-semibold text-sm transition-colors ${
                examType === type
                  ? 'bg-blue-600 text-white shadow-md'
                  : `${bgCard(theme)} ${textPrimary(theme)} border ${borderColor(theme)} hover:bg-blue-50`
              }`}
            >
              {type}
            </button>
          ))}
        </div>
        <p className={`mt-3 text-xs ${textSecondary(theme)}`}>Seçili: {examTypeLabels[examType]}</p>
      </div>

      {/* Net Giriş Tablosu */}
      <div className={`rounded-xl shadow-sm border overflow-hidden ${bgCard(theme)} ${borderColor(theme)} mb-6`}>
        <div className={`p-4 border-b ${borderColor2(theme)}`}>
          <h3 className={`font-semibold text-sm ${textPrimary(theme)}`}>{examType} — Net Girişi</h3>
          <p className={`text-xs mt-1 ${textSecondary(theme)}`}>
            {subjectsLoaded ? '📊 Katsayı tablosundan dersler otomatik yüklendi' : 'ℹ️ Varsayılan ders listesi gösteriliyor (katsayı verisi yok)'}
          </p>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {subjects.map(subjectCode => (
              <div key={subjectCode}>
                <label className={`block text-sm font-medium mb-1 ${textMuted(theme)}`}>
                  {subjectLabels[subjectCode] || subjectCode}
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={nets[subjectCode] || ''}
                  onChange={(e) => handleNetChange(subjectCode, e.target.value)}
                  placeholder="0.00"
                  min="0"
                  max="40"
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg(theme)}`}
                />
              </div>
            ))}
          </div>

          <div className="mt-5 flex justify-end">
            <button
              onClick={handleCalculate}
              disabled={loading || subjects.length === 0}
              className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '🔄 Hesaplanıyor...' : '🧮 Hesapla'}
            </button>
          </div>
        </div>
      </div>

      {/* Hata Mesajı */}
      {error && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
          ⚠️ {error}
          <button onClick={() => setError('')} className="ml-2 font-bold">&times;</button>
        </div>
      )}

      {/* Sonuç */}
      {result && (
        <div className={`rounded-xl shadow-sm border overflow-hidden mb-6 ${bgCard(theme)} ${borderColor(theme)}`}>
          <div className="bg-green-600 text-white p-4">
            <h3 className="font-bold text-lg">✅ Tahmini Puan ({currentYear})</h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-green-50'}`}>
                <p className={`text-xs font-medium ${textMuted(theme)}`}>Ham Puan</p>
                <p className={`text-2xl font-bold ${textPrimary(theme)}`}>{result.hamPuan}</p>
              </div>
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-blue-50'}`}>
                <p className={`text-xs font-medium ${textMuted(theme)}`}>Standart Puan</p>
                <p className={`text-2xl font-bold text-blue-600`}>{result.standardPuan}</p>
              </div>
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-purple-50'}`}>
                <p className={`text-xs font-medium ${textMuted(theme)}`}>Sınıf Ortalaması</p>
                <p className={`text-2xl font-bold ${textSecondary(theme)}`}>{result.average}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Karşılaştırma Tablosu */}
      {comparison.length > 1 && (
        <div className={`rounded-xl shadow-sm border overflow-hidden ${bgCard(theme)} ${borderColor(theme)}`}>
          <div className={`p-4 border-b ${borderColor2(theme)}`}>
            <h3 className={`font-semibold text-sm ${textPrimary(theme)}`}>📊 Son 3 Yıl Karşılaştırması</h3>
            <p className={`text-xs mt-1 ${textSecondary(theme)}`}>Aynı netlerle farklı yılların katsayılarıyla hesaplanan tahmini puanlar</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-4 py-3 text-left ${textPrimary(theme)}`}>Yıl</th>
                  <th className={`px-4 py-3 text-center ${textPrimary(theme)}`}>Ham Puan</th>
                  <th className={`px-4 py-3 text-center ${textPrimary(theme)}`}>Standart Puan</th>
                  <th className={`px-4 py-3 text-center ${textPrimary(theme)}`}>Ortalama</th>
                  <th className={`px-4 py-3 text-center ${textPrimary(theme)}`}>Std. Sapma</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${borderColor2(theme)}`}>
                {comparison.map((r, i) => (
                  <tr
                    key={r.year}
                    className={i === 0
                      ? (theme === 'dark' ? 'bg-green-900/20' : 'bg-green-50')
                      : (theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50')
                    }
                  >
                    <td className={`px-4 py-3 font-medium ${textPrimary(theme)}`}>
                      {r.year} {i === 0 && '(Güncel)'}
                    </td>
                    <td className={`px-4 py-3 text-center ${textPrimary(theme)}`}>{r.hamPuan}</td>
                    <td className={`px-4 py-3 text-center font-bold ${i === 0 ? 'text-green-600' : textSecondary(theme)}`}>
                      {r.standardPuan}
                    </td>
                    <td className={`px-4 py-3 text-center ${textSecondary(theme)}`}>{r.average}</td>
                    <td className={`px-4 py-3 text-center ${textSecondary(theme)}`}>{r.stdDeviation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Formül Bilgisi */}
      <div className={`mt-6 p-5 rounded-xl shadow-sm border ${bgCard(theme)} ${borderColor(theme)}`}>
        <h3 className={`text-sm font-semibold mb-2 ${textMuted(theme)}`}>📐 Kullanılan Formül (Standart ÖSYM Yöntemi)</h3>
        <div className={`text-xs font-mono p-3 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <p>Ham Puan = Σ (ders_net × ders_katsayısı)</p>
          <p>Standart Puan = 50 + 10 × (Ham Puan − Ortalama) / Standart Sapma</p>
        </div>
        <p className={`text-xs mt-2 ${textSecondary(theme)}`}>
          Bu hesaplama tahminidir ve gerçekteki ÖSYM puanlama sisteminden farklılık gösterebilir.
          Otomatik sınav okuma tamamlandığında sistem her zaman en güncel yılın katsayılarını kullanacaktır.
        </p>
      </div>
    </div>
  );
}

export default App;
