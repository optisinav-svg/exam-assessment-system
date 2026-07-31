import { Router, Request, Response } from 'express';
import { db } from '../index';
import { results, exams } from '../../../shared/schema';
import { eq } from 'drizzle-orm';
import { calculateNet, compareAnswers } from '../utils/scoring';

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

// Yeni sonuç ekle (doğru/yanlış/net, sınavın doğru cevap anahtarına göre SUNUCUDA hesaplanır)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { examId, studentNo, answers, scannedImage } = req.body;

    // İlgili sınavı getir (doğru cevaplar, seçenek sayısı, net ayarı burada)
    const [exam] = await db.select().from(exams).where(eq(exams.id, examId));
    if (!exam) {
      return res.status(404).json({ message: 'Sınav bulunamadı' });
    }

    const correctAnswersMap = exam.correctAnswers as Record<string, string>;
    const { correctCount, wrongCount } = compareAnswers(answers ?? {}, correctAnswersMap);

    const { net, score, emptyCount } = calculateNet({
      correctCount,
      wrongCount,
      totalQuestions: exam.totalQuestions,
      optionCount: exam.optionCount ?? 4,
      negativeMarking: exam.negativeMarking ?? true,
    });

    const [result] = await db.insert(results).values({
      examId,
      studentNo,
      answers,
      score,
      net,
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
