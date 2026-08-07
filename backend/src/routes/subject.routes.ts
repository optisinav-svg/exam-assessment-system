import { Router, Request, Response } from 'express';
import { db } from '../index';
import { subjects, learningOutcomes } from '../../../shared/schema';
import { eq, and, ilike } from 'drizzle-orm';

const router = Router();

// ─── GET /api/subjects ────────────────────────────────────────────────────────
// Giriş yapan öğretmenin derslerini listeler
router.get('/', async (req: Request, res: Response) => {
  try {
    const teacherId = (req as any).user?.id;
    if (!teacherId) {
      return res.status(401).json({ message: 'Yetkilendirme gerekli' });
    }

    const teacherSubjects = await db
      .select()
      .from(subjects)
      .where(eq(subjects.teacherId, teacherId));

    res.json(teacherSubjects);
  } catch (error: any) {
    console.error('Subjects list error:', error);
    res.status(500).json({ message: 'Dersler getirilirken hata oluştu', error: error.message });
  }
});

// ─── POST /api/subjects ───────────────────────────────────────────────────────
// Yeni ders oluşturur
router.post('/', async (req: Request, res: Response) => {
  try {
    const teacherId = (req as any).user?.id;
    if (!teacherId) {
      return res.status(401).json({ message: 'Yetkilendirme gerekli' });
    }

    const { name, code, color } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Ders adı gereklidir.' });
    }

    const [newSubject] = await db.insert(subjects).values({
      teacherId,
      name: name.trim(),
      code: code || null,
      color: color || '#3B82F6',
      createdAt: new Date(),
    }).returning();

    res.status(201).json(newSubject);
  } catch (error: any) {
    console.error('Subject create error:', error);
    res.status(500).json({ message: 'Ders oluşturulurken hata oluştu', error: error.message });
  }
});

// ─── GET /api/subjects/:id/learning-outcomes/search?q=... ────────────────────
// Sınav oluştururken, yazılan birkaç harfe göre uygun kazanımları önerir.
router.get('/:id/learning-outcomes/search', async (req: Request, res: Response) => {
  try {
    const subjectId = parseInt(req.params.id);
    const q = String(req.query.q || '').trim();
    const gradeLevel = req.query.gradeLevel ? String(req.query.gradeLevel) : undefined;

    if (q.length < 2) {
      return res.json([]); // çok kısa aramada sonuç dönme (performans + gürültü)
    }

    const conditions = [eq(learningOutcomes.subjectId, subjectId), ilike(learningOutcomes.description, `%${q}%`)];
    if (gradeLevel) {
      conditions.push(eq(learningOutcomes.gradeLevel, gradeLevel));
    }

    const outcomes = await db
      .select()
      .from(learningOutcomes)
      .where(and(...conditions))
      .limit(25);

    res.json(outcomes);
  } catch (error: any) {
    console.error('Learning outcome search error:', error);
    res.status(500).json({ message: 'Kazanım aranırken hata oluştu', error: error.message });
  }
});

export default router;
