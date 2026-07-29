import { Router, Request, Response } from 'express';
import { db } from '../index';
import { exams, examClasses, results } from '../../../shared/schema';
import { eq, and } from 'drizzle-orm';

const router = Router();

// Tüm sınavları getir
router.get('/', async (req: Request, res: Response) => {
  try {
    const teacherId = req.user?.id;
    if (!teacherId) {
      return res.status(401).json({ message: 'Yetkilendirme gerekli' });
    }
    const allExams = await db.select().from(exams).where(eq(exams.teacherId, teacherId));
    res.json(allExams);
  } catch (error) {
    res.status(500).json({ message: 'Sınavlar getirilirken hata oluştu', error });
  }
});

// Yeni sınav oluştur
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      title,
      subjectId,
      templateId,
      examDate,
      duration,
      totalQuestions,
      correctAnswers,
      classIds,
      optionCount, // 3, 4 veya 5 (varsayılan 4)
      negativeMarking, // yanlış doğruyu eksiltsin mi (varsayılan true)
    } = req.body;
    const teacherId = req.user?.id;

    const [exam] = await db.insert(exams).values({
      teacherId,
      subjectId,
      templateId,
      title,
      examDate: new Date(examDate),
      duration,
      totalQuestions,
      correctAnswers,
      optionCount: optionCount ?? 4,
      negativeMarking: negativeMarking ?? true,
      status: 'draft',
      createdAt: new Date(),
    }).returning();

    // Sınıfları ata
    if (classIds && classIds.length > 0) {
      await db.insert(examClasses).values(
        classIds.map((classId: number) => ({ examId: exam.id, classId }))
      );
    }

    res.status(201).json(exam);
  } catch (error) {
    res.status(500).json({ message: 'Sınav oluşturulurken hata oluştu', error });
  }
});

// Sınav ayarlarını güncelle (ör. "yanlış doğruyu eksiltsin mi" butonu)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { optionCount, negativeMarking, title, correctAnswers, totalQuestions } = req.body;

    const [updated] = await db.update(exams)
      .set({
        ...(optionCount !== undefined && { optionCount }),
        ...(negativeMarking !== undefined && { negativeMarking }),
        ...(title !== undefined && { title }),
        ...(correctAnswers !== undefined && { correctAnswers }),
        ...(totalQuestions !== undefined && { totalQuestions }),
      })
      .where(eq(exams.id, id))
      .returning();

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Sınav güncellenirken hata oluştu', error });
  }
});

// Sınav sonuçlarını getir
router.get('/:id/results', async (req: Request, res: Response) => {
  try {
    const examId = parseInt(req.params.id);
    const examResults = await db.select().from(results).where(eq(results.examId, examId));
    res.json(examResults);
  } catch (error) {
    res.status(500).json({ message: 'Sonuçlar getirilirken hata oluştu', error });
  }
});

export default router;
