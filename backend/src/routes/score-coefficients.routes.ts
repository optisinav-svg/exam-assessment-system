import express from 'express';
import { eq, and } from 'drizzle-orm';
import { scoreCoefficients } from '../../../shared/schema';
import { db } from '../index';

const router = express.Router();

// GET /api/score-coefficients — Sınav türü ve yıla göre katsayıları listele
router.get('/', async (req: any, res: express.Response) => {
  try {
    const { examType, year } = req.query;

    if (!examType || !year) {
      return res.status(400).json({ message: 'examType ve year parametreleri zorunludur' });
    }

    const yearNum = parseInt(year as string);
    if (isNaN(yearNum)) {
      return res.status(400).json({ message: 'Geçersiz yıl değeri' });
    }

    const results = await db
      .select()
      .from(scoreCoefficients)
      .where(and(
        eq(scoreCoefficients.examType, examType as string),
        eq(scoreCoefficients.year, yearNum)
      ))
      .orderBy(scoreCoefficients.subjectCode);

    res.json({
      success: true,
      coefficients: results,
      total: results.length,
    });
  } catch (error) {
    console.error('Katsayı listeleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// POST /api/score-coefficients — Tek kayıt ekle/güncelle (upsert)
router.post('/', async (req: any, res: express.Response) => {
  try {
    const { examType, year, subjectCode, average, stdDeviation, coefficient } = req.body;

    if (!examType || !year || !subjectCode) {
      return res.status(400).json({ message: 'examType, year ve subjectCode zorunludur' });
    }

    const yearNum = parseInt(year);
    if (isNaN(yearNum)) {
      return res.status(400).json({ message: 'Geçersiz yıl değeri' });
    }

    // Aynı kayıt varsa güncelle, yoksa ekle (upsert)
    const existing = await db
      .select()
      .from(scoreCoefficients)
      .where(and(
        eq(scoreCoefficients.examType, examType),
        eq(scoreCoefficients.year, yearNum),
        eq(scoreCoefficients.subjectCode, subjectCode)
      ));

    if (existing.length > 0) {
      // Güncelle
      const [updated] = await db
        .update(scoreCoefficients)
        .set({
          average: average !== undefined ? average : existing[0].average,
          stdDeviation: stdDeviation !== undefined ? stdDeviation : existing[0].stdDeviation,
          coefficient: coefficient !== undefined ? coefficient : existing[0].coefficient,
        })
        .where(eq(scoreCoefficients.id, existing[0].id))
        .returning();

      res.json({
        success: true,
        message: 'Katsayı güncellendi',
        coefficient: updated,
        action: 'updated',
      });
    } else {
      // Yeni ekle
      const [newRecord] = await db
        .insert(scoreCoefficients)
        .values({
          examType,
          year: yearNum,
          subjectCode,
          average: average || null,
          stdDeviation: stdDeviation || null,
          coefficient: coefficient || null,
        })
        .returning();

      res.status(201).json({
        success: true,
        message: 'Katsayı eklendi',
        coefficient: newRecord,
        action: 'created',
      });
    }
  } catch (error) {
    console.error('Katsayı ekleme/güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// POST /api/score-coefficients/bulk — Bir yıl için tüm dersleri tek seferde ekle/güncelle
router.post('/bulk', async (req: any, res: express.Response) => {
  try {
    const { examType, year, items } = req.body;

    if (!examType || !year || !items || !Array.isArray(items)) {
      return res.status(400).json({ message: 'examType, year ve items (dizi) zorunludur' });
    }

    const yearNum = parseInt(year);
    if (isNaN(yearNum)) {
      return res.status(400).json({ message: 'Geçersiz yıl değeri' });
    }

    const results = [];
    for (const item of items) {
      const { subjectCode, average, stdDeviation, coefficient } = item;

      if (!subjectCode) continue;

      const existing = await db
        .select()
        .from(scoreCoefficients)
        .where(and(
          eq(scoreCoefficients.examType, examType),
          eq(scoreCoefficients.year, yearNum),
          eq(scoreCoefficients.subjectCode, subjectCode)
        ));

      if (existing.length > 0) {
        const [updated] = await db
          .update(scoreCoefficients)
          .set({
            average: average !== undefined ? average : null,
            stdDeviation: stdDeviation !== undefined ? stdDeviation : null,
            coefficient: coefficient !== undefined ? coefficient : null,
          })
          .where(eq(scoreCoefficients.id, existing[0].id))
          .returning();
        results.push({ id: updated.id, action: 'updated', subjectCode });
      } else {
        const [created] = await db
          .insert(scoreCoefficients)
          .values({
            examType,
            year: yearNum,
            subjectCode,
            average: average || null,
            stdDeviation: stdDeviation || null,
            coefficient: coefficient || null,
          })
          .returning();
        results.push({ id: created.id, action: 'created', subjectCode });
      }
    }

    res.status(201).json({
      success: true,
      message: `${results.length} kayıt işlendi`,
      results,
    });
  } catch (error) {
    console.error('Toplu katsayı ekleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// DELETE /api/score-coefficients/:id — Katsayı kaydını sil
router.delete('/:id', async (req: any, res: express.Response) => {
  try {
    const id = parseInt(req.params.id);

    const existing = await db
      .select()
      .from(scoreCoefficients)
      .where(eq(scoreCoefficients.id, id));

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Kayıt bulunamadı' });
    }

    await db.delete(scoreCoefficients).where(eq(scoreCoefficients.id, id));

    res.json({
      success: true,
      message: 'Katsayı kaydı silindi',
    });
  } catch (error) {
    console.error('Katsayı silme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

export default router;
