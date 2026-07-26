import { Router, Request, Response } from 'express';
import { db } from '../index';
import { results } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Bir sınava ait sonuçları getir
router.get('/exam/:examId', async (req: Request, res: Response) => {
  try {
    const examId = parseInt(req.params.examId);
    const examResults = await db.select().from(results).where(eq(results.examId, examId));
    res.json(examResults);
  } catch (error) {
    res.status(500).json({ message: 'Sonuçlar getirilirken hata oluştu', error });
  }
});

// Yeni sonuç ekle
router.post('/', async (req: Request, res: Response) => {
  try {
    const { examId, studentNo, answers, score, correctCount, wrongCount, emptyCount, scannedImage } = req.body;

    const [result] = await db.insert(results).values({
      examId,
      studentNo,
      answers,
      score,
      correctCount,
      wrongCount,
      emptyCount,
      scannedImage,
      processedAt: new Date(),
      status: 'completed',
    }).returning();

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Sonuç eklenirken hata oluştu', error });
  }
});

// Sonuç güncelle
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { score, correctCount, wrongCount, emptyCount } = req.body;

    const [updated] = await db.update(results)
      .set({ score, correctCount, wrongCount, emptyCount })
      .where(eq(results.id, id))
      .returning();

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Sonuç güncellenirken hata oluştu', error });
  }
});

export default router;