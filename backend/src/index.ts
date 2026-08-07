import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../../shared/schema';
import authRoutes from './routes/auth.routes';
import examRoutes from './routes/exam.routes';
import resultRoutes from './routes/result.routes';
import importRouter from './routes/import.routes';
import adminRouter from './routes/admin.routes';
import storageRouter from './routes/storage.routes';
import whatsappRouter from './routes/whatsapp.routes';
import analyticsRouter from './routes/analytics.routes';
import schoolRouter from './routes/school.routes';
import rosterRoutes from './routes/roster.routes';
import scoreCoefficientsRouter from './routes/score-coefficients.routes';
import studentAuthRoutes from './routes/student-auth.routes';
import studentRoutes from './routes/student.routes';
import subjectRoutes from './routes/subject.routes';
import { verifyToken } from './middleware/auth.middleware';
import { seedKazanimlar } from './seed-kazanimlar';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Veritabanı bağlantısı
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const db = drizzle(pool, { schema });

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Route'ları
app.use('/api/auth', authRoutes); // Giriş/kayıt - herkese açık
app.use('/api/exams', verifyToken, examRoutes); // Sınavlar - giriş gerektirir
app.use('/api/results', verifyToken, resultRoutes); // Sonuçlar - giriş gerektirir
app.use('/api/import', verifyToken, importRouter); // Excel import - giriş gerektirir
app.use('/api/admin', verifyToken, adminRouter); // Admin paneli - giriş + admin rolü gerektirir
app.use('/api/storage', verifyToken, storageRouter); // Dosya depolama - giriş gerektirir
app.use('/api/whatsapp', verifyToken, whatsappRouter); // WhatsApp mesajlaşma - giriş gerektirir
app.use('/api/analytics', verifyToken, analyticsRouter); // Analitik - giriş gerektirir
app.use('/api/schools', verifyToken, schoolRouter); // Okul/Sınıf yönetimi - giriş gerektirir
app.use('/api/roster', verifyToken, rosterRoutes); // Öğrenci manuel ekleme - giriş gerektirir
app.use('/api/score-coefficients', verifyToken, scoreCoefficientsRouter); // Puan katsayıları - giriş gerektirir
app.use('/api/student-auth', studentAuthRoutes); // Öğrenci kayıt/giriş/e-posta onayı - herkese açık
app.use('/api/students', verifyToken, studentRoutes); // Öğrenci onay/listeleme - öğretmen girişi gerektirir
app.use('/api/subjects', verifyToken, subjectRoutes); // Dersler - giriş gerektirir

// Global hata yakalama
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Sunucu hatası oluştu',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  seedKazanimlar();
});

export { db };
