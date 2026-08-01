import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { db } from '../index';
import { uploadedFiles } from '../../../shared/schema';
import { eq, desc, sql, and } from 'drizzle-orm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// ─── Multer yapılandırması ───────────────────────────────────────────────────
const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');

// Uploads klasörünü oluştur
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    const sanitized = file.originalname
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .substring(0, 100);
    cb(null, `${uniqueSuffix}_${sanitized}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB limit
  fileFilter: (_req, file, cb) => {
    // Kabul edilen dosya türleri
    const allowedMimes = [
      // Belgeler
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/json',
      // Görseller
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/svg+xml',
      // Arşiv
      'application/zip',
      'application/x-rar-compressed',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Desteklenmeyen dosya türü: ${file.mimetype}`));
    }
  },
});

// ─── Middleware: Dosya yükleme hata yakalama ─────────────────────────────────
function handleMulterError(err: any, _req: Request, res: Response, next: any) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Dosya boyutu 50 MB\'dan küçük olmalıdır.' });
    }
    return res.status(400).json({ message: `Yükleme hatası: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
}

// ─── GET /api/storage/list ───────────────────────────────────────────────────
// Kullanıcının yüklediği dosyaları listele
router.get('/list', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const category = req.query.category as string | undefined;

    const conditions = [];
    if (userId) conditions.push(eq(uploadedFiles.userId, userId));
    if (category) conditions.push(eq(uploadedFiles.category, category));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const files = await db
      .select({
        id: uploadedFiles.id,
        fileName: uploadedFiles.fileName,
        originalName: uploadedFiles.originalName,
        mimeType: uploadedFiles.mimeType,
        fileSize: uploadedFiles.fileSize,
        category: uploadedFiles.category,
        isPublic: uploadedFiles.isPublic,
        createdAt: uploadedFiles.createdAt,
      })
      .from(uploadedFiles)
      .where(whereClause)
      .orderBy(desc(uploadedFiles.createdAt))
      .limit(100);

    res.json({ total: files.length, files });
  } catch (error: any) {
    console.error('Storage list error:', error);
    res.status(500).json({ message: 'Dosyalar listelenirken hata oluştu', error: error.message });
  }
});

// ─── POST /api/storage/upload ────────────────────────────────────────────────
// Dosya yükle
router.post('/upload', upload.single('file'), handleMulterError, async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Dosya yüklenmedi.' });
    }

    const userId = (req as any).user?.id;
    const category = req.body.category || 'general';
    const examId = req.body.examId ? parseInt(req.body.examId) : null;

    const filePath = path.join(UPLOAD_DIR, req.file.filename);
    const stats = fs.statSync(filePath);

    const [newFile] = await db.insert(uploadedFiles).values({
      userId,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: stats.size,
      filePath,
      category,
      examId,
      isPublic: false,
      createdAt: new Date(),
    }).returning();

    // Dosya istatistiklerini formatla
    const formattedSize = stats.size < 1024
      ? `${stats.size} B`
      : stats.size < 1024 * 1024
        ? `${(stats.size / 1024).toFixed(1)} KB`
        : `${(stats.size / (1024 * 1024)).toFixed(1)} MB`;

    res.status(201).json({
      message: 'Dosya başarıyla yüklendi',
      file: {
        ...newFile,
        formattedSize,
        downloadUrl: `/api/storage/download/${newFile.id}`,
      },
    });
  } catch (error: any) {
    console.error('Storage upload error:', error);
    // Başarısız yüklemeyi temizle
    if (req.file) {
      fs.unlinkSync(path.join(UPLOAD_DIR, req.file.filename));
    }
    res.status(500).json({ message: 'Dosya yüklenirken hata oluştu', error: error.message });
  }
});

// ─── GET /api/storage/download/:id ───────────────────────────────────────────
// Dosya indir
router.get('/download/:id', async (req: Request, res: Response) => {
  try {
    const fileId = parseInt(req.params.id);
    const [file] = await db.select().from(uploadedFiles).where(eq(uploadedFiles.id, fileId));

    if (!file) {
      return res.status(404).json({ message: 'Dosya bulunamadı.' });
    }

    // Dosya var mı kontrol et
    if (!fs.existsSync(file.filePath)) {
      return res.status(404).json({ message: 'Dosya diskte bulunamadı.' });
    }

    res.download(file.filePath, file.originalName);
  } catch (error: any) {
    console.error('Storage download error:', error);
    res.status(500).json({ message: 'Dosya indirilirken hata oluştu', error: error.message });
  }
});

// ─── DELETE /api/storage/:id ─────────────────────────────────────────────────
// Dosya sil
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const fileId = parseInt(req.params.id);
    const [file] = await db.select().from(uploadedFiles).where(eq(uploadedFiles.id, fileId));

    if (!file) {
      return res.status(404).json({ message: 'Dosya bulunamadı.' });
    }

    // Diskten dosyayı sil
    if (fs.existsSync(file.filePath)) {
      fs.unlinkSync(file.filePath);
    }

    // Veritabanından kaydı sil
    await db.delete(uploadedFiles).where(eq(uploadedFiles.id, fileId));

    res.json({ message: 'Dosya başarıyla silindi' });
  } catch (error: any) {
    console.error('Storage delete error:', error);
    res.status(500).json({ message: 'Dosya silinirken hata oluştu', error: error.message });
  }
});

// ─── GET /api/storage/stats ──────────────────────────────────────────────────
// Depolama istatistikleri
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    // Toplam dosya sayısı
    const totalFiles = await db.select({ count: sql<number>`count(*)` }).from(uploadedFiles);

    // Toplam boyut
    const totalSize = await db.select({ sum: sql<number>`sum(${uploadedFiles.fileSize})` }).from(uploadedFiles);

    // Kategori bazlı dağılım
    const byCategory = await db.select({
      category: uploadedFiles.category,
      count: sql<number>`count(*)`,
      totalSize: sql<number>`sum(${uploadedFiles.fileSize})`,
    })
    .from(uploadedFiles)
    .groupBy(uploadedFiles.category);
