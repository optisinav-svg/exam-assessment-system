import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import './App.css';

// API Base URL
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/results/:examId" element={<ResultsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

// Ana Sayfa
function HomePage() {
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
  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Giriş Yap</h2>
      <form>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Email</label>
          <input type="email" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Şifre</label>
          <input type="password" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
          Giriş Yap
        </button>
      </form>
      <p className="text-center mt-4 text-sm text-gray-600">
        Hesabın yok mu? <a href="/register" className="text-blue-600 hover:underline">Kayıt Ol</a>
      </p>
    </div>
  );
}

// Kayıt Sayfası
function RegisterPage() {
  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Kayıt Ol</h2>
      <form>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Ad Soyad</label>
          <input type="text" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Email</label>
          <input type="email" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Şifre</label>
          <input type="password" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
          Kayıt Ol
        </button>
      </form>
      <p className="text-center mt-4 text-sm text-gray-600">
        Zaten hesabın var mı? <a href="/login" className="text-blue-600 hover:underline">Giriş Yap</a>
      </p>
    </div>
  );
}

// Dashboard Sayfası - Grafiklerle
function DashboardPage() {
  // Örnek veri (API bağlantısı sonrası gerçek veriye dönüşecek)
  const [examStats] = useState({
    totalExams: 12,
    totalStudents: 245,
    avgScore: 72,
  });

  // Son 6 sınav ortalamaları - çizgi grafik
  const examTrend = [
    { name: 'Sınav 1', ortalama: 65 },
    { name: 'Sınav 2', ortalama: 72 },
    { name: 'Sınav 3', ortalama: 68 },
    { name: 'Sınav 4', ortalama: 78 },
    { name: 'Sınav 5', ortalama: 75 },
    { name: 'Sınav 6', ortalama: 82 },
  ];

  // Doğru/Yanlış/Boş dağılımı - pasta grafik
  const answerDistribution = [
    { name: 'Doğru', value: 6200, color: '#10B981' },
    { name: 'Yanlış', value: 1800, color: '#EF4444' },
    { name: 'Boş', value: 600, color: '#F59E0B' },
  ];

  // Kazanım bazlı başarı oranları - çubuk grafik
  const outcomeStats = [
    { kazanım: 'K1', basarı: 85 },
    { kazanım: 'K2', basarı: 72 },
    { kazanım: 'K3', basarı: 90 },
    { kazanım: 'K4', basarı: 55 },
    { kazanım: 'K5', basarı: 78 },
    { kazanım: 'K6', basarı: 63 },
  ];

  // Sınıf bazlı ortalama puanlar
  const classAverages = [
    { sinif: '8A', ortalama: 78 },
    { sinif: '8B', ortalama: 71 },
    { sinif: '8C', ortalama: 82 },
    { sinif: '7A', ortalama: 69 },
    { sinif: '7B', ortalama: 74 },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">📊 Dashboard</h1>
        <nav className="flex gap-3">
          <a href="/import" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
            Excel Import
          </a>
        </nav>
      </div>

      {/* Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm">Toplam Sınav</h3>
          <p className="text-3xl font-bold text-blue-600">{examStats.totalExams}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm">Toplam Öğrenci</h3>
          <p className="text-3xl font-bold text-purple-600">{examStats.totalStudents}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm">Ortalama Başarı</h3>
          <p className="text-3xl font-bold text-green-600">{examStats.avgScore}%</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm">Aktif Ders</h3>
          <p className="text-3xl font-bold text-orange-600">5</p>
        </div>
      </div>

      {/* Grafik Satır 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Sınav Trendi */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Sınav Ortalama Trendi</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={examTrend}>
              <defs>
                <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4A6CF7" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4A6CF7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value: number) => `${value}%`} />
              <Area type="monotone" dataKey="ortalama" stroke="#4A6CF7" fill="url(#colorAvg)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Doğru/Yanlış/Boş */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Cevap Dağılımı</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={answerDistribution}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {answerDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grafik Satır 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Kazanım Başarı Oranları */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Kazanım Bazlı Başarı</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={outcomeStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="kazanım" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value: number) => `${value}%`} />
              <Bar dataKey="basarı" fill="#4A6CF7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sınıf Bazlı Ortalamalar */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Sınıf Bazlı Ortalamalar</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={classAverages} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="sinif" type="category" width={40} />
              <Tooltip formatter={(value: number) => `${value} puan`} />
              <Bar dataKey="ortalama" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// Excel Import Sayfası
function ImportPage() {
  const [jsonText, setJsonText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Örnek JSON formatı
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
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">📥 Ders & Kazanım İçe Aktarma</h1>
      <p className="text-gray-600 mb-6">
        Excel dosyanızdaki ders ve kazanım bilgilerini JSON formatında girerek sisteme aktarabilirsiniz.
        Sınıf sütunu boş olan satırlar otomatik olarak <strong>"Mezun"</strong> sınıfına atanır.
      </p>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700">JSON Verisi</h3>
          <button
            onClick={loadExample}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
          >
            Örnek Yükle
          </button>
        </div>

        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder={exampleJson}
          className="w-full h-64 p-4 border rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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

      {/* Sınıf Seviyeleri */}
      <div className="mt-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Mevcut Sınıf Seviyeleri</h3>
        <div className="flex flex-wrap gap-2">
          {['7A', '7B', '8A', '8B', '8C', 'Mezun'].map((grade) => (
            <span key={grade} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
              {grade}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Sınav Sonuçları Sayfası - Detaylı grafikler
function ResultsPage() {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'correct' | 'wrong'>('all');

  // Örnek öğrenci sonuçları
  const studentResults = [
    { no: '1001', ad: 'Ahmet Yılmaz', dogru: 18, yanlis: 4, bos: 3, net: 17, basari: 85 },
    { no: '1002', ad: 'Ayşe Demir', dogru: 20, yanlis: 5, bos: 0, net: 18.75, basari: 94 },
    { no: '1003', ad: 'Mehmet Kaya', dogru: 15, yanlis: 8, bos: 2, net: 13, basari: 65 },
    { no: '1004', ad: 'Zeynep Çelik', dogru: 19, yanlis: 3, bos: 3, net: 18.25, basari: 91 },
    { no: '1005', ad: 'Ali Veli', dogru: 12, yanlis: 10, bos: 3, net: 9.5, basari: 48 },
  ];

  // Soru bazlı doğru/yanlış oranı
  const questionStats = Array.from({ length: 20 }, (_, i) => ({
    soru: `S${i + 1}`,
    dogru: Math.floor(Math.random() * 80) + 20,
    yanlis: Math.floor(Math.random() * 40) + 5,
    bos: Math.floor(Math.random() * 20) + 2,
  }));

  const COLORS = ['#10B981', '#EF4444', '#F59E0B'];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">📋 Sınav Sonuçları</h1>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            📄 PDF İndir
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
            📊 Excel İndir
          </button>
        </div>
      </div>

      {/* Özet */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-xs text-gray-500">Katılımcı</p>
          <p className="text-xl font-bold">5</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-xs text-gray-500">Ortalama Net</p>
          <p className="text-xl font-bold text-blue-600">15.3</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-xs text-gray-500">En Yüksek</p>
          <p className="text-xl font-bold text-green-600">18.75</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-xs text-gray-500">En Düşük</p>
          <p className="text-xl font-bold text-red-600">9.5</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-xs text-gray-500">Başarı %</p>
          <p className="text-xl font-bold text-purple-600">76.6%</p>
        </div>
      </div>

      {/* Grafikler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Soru bazlı doğru/yanlış */}
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Soru Bazlı Analiz</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={questionStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="soru" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="dogru" stackId="a" fill="#10B981" name="Doğru" />
              <Bar dataKey="yanlis" stackId="a" fill="#EF4444" name="Yanlış" />
              <Bar dataKey="bos" stackId="a" fill="#F59E0B" name="Boş" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Net dağılımı */}
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Öğrenci Net Dağılımı</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={studentResults}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ad" />
              <YAxis domain={[0, 25]} />
              <Tooltip />
              <Bar dataKey="net" fill="#4A6CF7" radius={[4, 4, 0, 0]} name="Net" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Öğrenci Detayları</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">No</th>
                <th className="px-4 py-3 text-left">Ad Soyad</th>
                <th className="px-4 py-3 text-center">Doğru</th>
                <th className="px-4 py-3 text-center">Yanlış</th>
                <th className="px-4 py-3 text-center">Boş</th>
                <th className="px-4 py-3 text-center">Net</th>
                <th className="px-4 py-3 text-center">Başarı %</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {studentResults.map((s, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{s.no}</td>
                  <td className="px-4 py-3 font-medium">{s.ad}</td>
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

export default App;
