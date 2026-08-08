import express from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { learningOutcomes, subjects } from '../../../shared/schema';
import { db } from '../index';

const router = express.Router();

// GET /api/learning-outcomes/subjects — Dersleri listele
router.get('/subjects', async (req: any, res: express.Response) => {
  try {
    const userId = req.user?.id;
    const allSubjects = await db.select().from(subjects);
    
    // Öğretmenin kendi dersleri + global (kazanım içeren) dersler
    const results = await db.select().from(learningOutcomes);
    const subjectIds = [...new Set(results.map(r => r.subjectId).filter(Boolean))];
    const userSubjects = allSubjects.filter(s => s.teacherId === userId);
    const globalSubjects = allSubjects.filter(s => subjectIds.includes(s.id) && s.teacherId !== userId);
    
    res.json({ success: true, userSubjects, globalSubjects });
  } catch (error) {
    console.error('Ders listeleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// GET /api/learning-outcomes/:subjectId — Sayfalanmış kazanım listesi
router.get('/:subjectId', async (req: any, res: express.Response) => {
  try {
    const subjectId = parseInt(req.params.subjectId);
    const gradeLevel = (req.query.gradeLevel as string) || '';
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 50));
    const offset = (page - 1) * pageSize;

    const conditions = [eq(learningOutcomes.subjectId, subjectId)];
    if (gradeLevel) {
      conditions.push(eq(learningOutcomes.gradeLevel, gradeLevel));
    }

    const [results, totalResult] = await Promise.all([
      db.select().from(learningOutcomes)
        .where(and(...conditions))
        .orderBy(desc(learningOutcomes.id))
        .limit(pageSize)
        .offset(offset),
      db.select({ count: learningOutcomes.id }).from(learningOutcomes)
        .where(and(...conditions)),
    ]);

    res.json({
      success: true,
      outcomes: results,
      pagination: {
        page,
        pageSize,
        total: totalResult.length,
        totalPages: Math.ceil(totalResult.length / pageSize),
      },
    });
  } catch (error) {
    console.error('Kazanım listeleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// GET /api/learning-outcomes/search/:subjectId?q=... — Arama
router.get('/search/:subjectId', async (req: any, res: express.Response) => {
  try {
    const subjectId = parseInt(req.params.subjectId);
    const q = (req.query.q as string) || '';

    if (q.length < 2) {
      return res.status(400).json({ message: 'Arama için en az 2 karakter gerekli' });
    }

    const allOutcomes = await db.select().from(learningOutcomes)
      .where(eq(learningOutcomes.subjectId, subjectId));
    
    const filtered = allOutcomes.filter(o =>
      o.code.toLowerCase().includes(q.toLowerCase()) ||
      o.description.toLowerCase().includes(q.toLowerCase())
    );

    res.json({
      success: true,
      outcomes: filtered.slice(0, 50), // Max 50 sonuç
      total: filtered.length,
    });
  } catch (error) {
    console.error('Kazanım arama hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// POST /api/learning-outcomes/:subjectId — Yeni kazanım ekle
router.post('/:subjectId', async (req: any, res: express.Response) => {
  try {
    const subjectId = parseInt(req.params.subjectId);
    const { code, description, gradeLevel } = req.body;

    if (!code || !description) {
      return res.status(400).json({ message: 'code ve description zorunludur' });
    }

    const [newOutcome] = await db
      .insert(learningOutcomes)
      .values({
        subjectId,
        code,
        description,
        gradeLevel: gradeLevel || null,
      })
      .returning();

    res.status(201).json({
      success: true,
      message: 'Kazanım eklendi',
      outcome: newOutcome,
    });
  } catch (error) {
    console.error('Kazanım ekleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// PUT /api/learning-outcomes/outcome/:id — Kazanım düzenle
router.put('/outcome/:id', async (req: any, res: express.Response) => {
  try {
    const id = parseInt(req.params.id);
    const { code, description, gradeLevel } = req.body;

    const existing = await db
      .select()
      .from(learningOutcomes)
      .where(eq(learningOutcomes.id, id));

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Kazanım bulunamadı' });
    }

    const [updated] = await db
      .update(learningOutcomes)
      .set({
        code: code !== undefined ? code : existing[0].code,
        description: description !== undefined ? description : existing[0].description,
        gradeLevel: gradeLevel !== undefined ? gradeLevel : existing[0].gradeLevel,
      })
      .where(eq(learningOutcomes.id, id))
      .returning();

    res.json({
      success: true,
      message: 'Kazanım güncellendi',
      outcome: updated,
    });
  } catch (error) {
    console.error('Kazanım güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// DELETE /api/learning-outcomes/outcome/:id — Kazanım sil
router.delete('/outcome/:id', async (req: any, res: express.Response) => {
  try {
    const id = parseInt(req.params.id);

    const existing = await db
      .select()
      .from(learningOutcomes)
      .where(eq(learningOutcomes.id, id));

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Kazanım bulunamadı' });
    }

    await db.delete(learningOutcomes).where(eq(learningOutcomes.id, id));

    res.json({
      success: true,
      message: 'Kazanım silindi',
    });
  } catch (error) {
    console.error('Kazanım silme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

export default router;
