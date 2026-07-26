import { Router, Request, Response } from 'express';
import { db } from '../index';
import { exams, examClasses, results } from '../../../shared/schema';
import { eq, and } from 'drizzle-orm';

const router = Router();

// Tüm sınavları getir
router.get('/', async (req: Request, res: Response) => {
  try {
    const teacherId = req.user?.id;
    const allExams = await db.select().from(exams).where(eq(exams.teacherId, teacherId));
    res.json(allExams);
  } catch (error) {
    res.status(500).json({ message: 'Sınavlar getirilirken hata oluştu', error });
  }
});

// Yeni sınav oluştur
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, subjectId, templateId, examDate, duration, totalQuestions, correctAnswers, classIds } = req.body;
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

// Sınav sonuçlarını getir
router.get('/:id/results', async (req: Request, res: Response) => {
  try {
    const examId = parseInt(req.params.id);
    const results = await db.select().from(results).where(eq(results.examId, examId));
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Sonuçlar getirilirken hata oluştu', error });
  }
});

export default router;