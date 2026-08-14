import express from 'express';
import { eq, and } from 'drizzle-orm';
import { opticalTemplates } from '../../../shared/schema';
import { db } from '../index';

const router = express.Router();

// GET /api/optical-templates — Öğretmenin tüm optik şablonlarını listele
router.get('/', async (req: any, res: express.Response) => {
  try {
    const teacherId = req.user?.id;
    if (!teacherId) {
      return res.status(401).json({ message: 'Kimlik doğrulama gerekli' });
    }

    const templates = await db
      .select()
      .from(opticalTemplates)
      .where(eq(opticalTemplates.teacherId, teacherId))
      .orderBy(opticalTemplates.createdAt);

    res.json({
      success: true,
      templates,
      total: templates.length,
    });
  } catch (error) {
    console.error('Optik şablonları listeleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// GET /api/optical-templates/:id — Tek şablon getir
router.get('/:id', async (req: any, res: express.Response) => {
  try {
    const teacherId = req.user?.id;
    const templateId = parseInt(req.params.id);
    if (!teacherId) {
      return res.status(401).json({ message: 'Kimlik doğrulama gerekli' });
    }

    const [template] = await db
      .select()
      .from(opticalTemplates)
      .where(and(eq(opticalTemplates.id, templateId), eq(opticalTemplates.teacherId, teacherId)));

    if (!template) {
      return res.status(404).json({ message: 'Şablon bulunamadı' });
    }

    res.json({
      success: true,
      template,
    });
  } catch (error) {
    console.error('Optik şablon getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// POST /api/optical-templates — Yeni şablon oluştur
router.post('/', async (req: any, res: express.Response) => {
  try {
    const teacherId = req.user?.id;
    if (!teacherId) {
      return res.status(401).json({ message: 'Kimlik doğrulama gerekli' });
    }

    const { name, type, fields, previewImage } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Şablon adı zorunludur' });
    }

    if (!fields) {
      return res.status(400).json({ message: 'Şablon alanları (fields) zorunludur' });
    }

    const [newTemplate] = await db
      .insert(opticalTemplates)
      .values({
        teacherId,
        name: name.trim(),
        type: type || '5_choice',
        fields,
        previewImage: previewImage || null,
      })
      .returning();

    res.status(201).json({
      success: true,
      message: 'Optik şablon başarıyla oluşturuldu',
      template: newTemplate,
    });
  } catch (error) {
    console.error('Optik şablon oluşturma hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// PUT /api/optical-templates/:id — Güncelle
router.put('/:id', async (req: any, res: express.Response) => {
  try {
    const teacherId = req.user?.id;
    const templateId = parseInt(req.params.id);
    if (!teacherId) {
      return res.status(401).json({ message: 'Kimlik doğrulama gerekli' });
    }

    const [existing] = await db
      .select()
      .from(opticalTemplates)
      .where(and(eq(opticalTemplates.id, templateId), eq(opticalTemplates.teacherId, teacherId)));

    if (!existing) {
      return res.status(404).json({ message: 'Şablon bulunamadı' });
    }

    const { name, type, fields, previewImage } = req.body;

    const [updated] = await db
      .update(opticalTemplates)
      .set({
        name: name ? name.trim() : existing.name,
        type: type || existing.type,
        fields: fields !== undefined ? fields : existing.fields,
        previewImage: previewImage !== undefined ? previewImage : existing.previewImage,
      })
      .where(eq(opticalTemplates.id, templateId))
      .returning();

    res.json({
      success: true,
      message: 'Optik şablon güncellendi',
      template: updated,
    });
  } catch (error) {
    console.error('Optik şablon güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// DELETE /api/optical-templates/:id — Sil
router.delete('/:id', async (req: any, res: express.Response) => {
  try {
    const teacherId = req.user?.id;
    const templateId = parseInt(req.params.id);
    if (!teacherId) {
      return res.status(401).json({ message: 'Kimlik doğrulama gerekli' });
    }

    const [existing] = await db
      .select()
      .from(opticalTemplates)
      .where(and(eq(opticalTemplates.id, templateId), eq(opticalTemplates.teacherId, teacherId)));

    if (!existing) {
      return res.status(404).json({ message: 'Şablon bulunamadı' });
    }

    await db.delete(opticalTemplates).where(eq(opticalTemplates.id, templateId));

    res.json({
      success: true,
      message: 'Optik şablon silindi',
    });
  } catch (error) {
    console.error('Optik şablon silme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

export default router;
