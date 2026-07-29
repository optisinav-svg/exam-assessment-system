import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../../shared/schema';
import authRoutes from './routes/auth.routes';
import examRoutes from './routes/exam.routes';
import resultRoutes from './routes/result.routes';
import { verifyToken } from './middleware/auth.middleware';

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
});

export { db };
