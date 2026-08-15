import express from 'express';
import multer from 'multer';
import { eq, and } from 'drizzle-orm';
import { opticalTemplates } from '../../../shared/schema';
import { db } from '../index';
import { readOpticalForm } from '../utils/omr-reader';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const router = express.Router();

// POST /api/omr/read — Optik form fotoğrafını oku ve sonuç önizlemesi döndür
router.post('/read', upload.single('photo'), async (req: any, res: express.Response) => {
  try {
    const teacherId = req.user?.id;
    if (!teacherId) {
      return res.status(401).json({ message: 'Kimlik doğrulama gerekli' });
    }

    const { templateId } = req.body;
    if (!templateId) {
      return res.status(400).json({ message: 'templateId gereklidir' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Okunacak form fotoğrafı (photo) yüklenmelidir' });
    }

    // Şablonu getir
    const [template] = await db
      .select()
      .from(opticalTemplates)
      .where(and(eq(opticalTemplates.id, Number(templateId)), eq(opticalTemplates.teacherId, teacherId)));

    if (!template) {
      return res.status(404).json({ message: 'Optik şablon bulunamadı' });
    }

    // OMR motorunu çalıştır
    const omrResult = await readOpticalForm(req.file.buffer, template.fields as any);

    res.json({
      success: true,
      message: 'Optik form başarıyla okundu',
      templateName: template.name,
      result: omrResult,
    });
  } catch (error) {
    console.error('OMR Okuma Rota Hatası:', error);
    res.status(500).json({ message: 'Optik form okunamadı' });
  }
});

export default router;
