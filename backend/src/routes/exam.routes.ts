import { Router, Request, Response } from 'express';
import { db } from '../index';
import { exams, examClasses, results, examQuestions } from '../../../shared/schema';
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

// Tek bir sınavı, sorularıyla birlikte getir (düzenleme ekranı için)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const examId = parseInt(req.params.id);
    const [exam] = await db.select().from(exams).where(eq(exams.id, examId));
    if (!exam) {
      return res.status(404).json({ message: 'Sınav bulunamadı' });
    }
    const questions = await db
      .select()
      .from(examQuestions)
      .where(eq(examQuestions.examId, examId))
      .orderBy(examQuestions.questionNumber);
    const classAssignments = await db.select().from(examClasses).where(eq(examClasses.examId, examId));

    res.json({
      ...exam,
      questions,
      classIds: classAssignments.map((c) => c.classId),
    });
  } catch (error) {
    res.status(500).json({ message: 'Sınav getirilirken hata oluştu', error });
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
      examType, // 'TYT' | 'AYT' | 'LGS' | 'custom'
      relatedExamId, // AYT ise, hangi TYT sınavıyla eşleştiği
      totalScore, // sınavın tam puanı (varsayılan 100)
      questions, // [{ questionNumber, subjectId, learningOutcomeId?, customOutcomeText?, correctAnswer }]
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
      examType: examType ?? null,
      relatedExamId: relatedExamId ?? null,
      totalScore: totalScore ?? 100,
      createdAt: new Date(),
    }).returning();

    // Sınıfları ata
    if (classIds && classIds.length > 0) {
      await db.insert(examClasses).values(
        classIds.map((classId: number) => ({ examId: exam.id, classId }))
      );
    }

    // Soru bazlı ders/kazanım eşlemesini kaydet
    if (questions && Array.isArray(questions) && questions.length > 0) {
      await db.insert(examQuestions).values(
        questions.map((q: any) => ({
          examId: exam.id,
          questionNumber: q.questionNumber,
          subjectId: q.subjectId ?? null,
          learningOutcomeId: q.learningOutcomeId ?? null,
          customOutcomeText: q.customOutcomeText ?? null,
          correctAnswer: q.correctAnswer,
        }))
      );
    }

    res.status(201).json(exam);
  } catch (error) {
    console.error('Exam create error:', error);
    res.status(500).json({ message: 'Sınav oluşturulurken hata oluştu', error });
  }
});

// Sınav ayarlarını güncelle (tam düzenleme: başlık, cevap anahtarı, sorular, sınıflar, vb.)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const {
      optionCount,
      negativeMarking,
      title,
      correctAnswers,
      totalQuestions,
      examDate,
      examType,
      relatedExamId,
      totalScore,
      classIds,
      questions,
    } = req.body;

    const [updated] = await db.update(exams)
      .set({
        ...(optionCount !== undefined && { optionCount }),
        ...(negativeMarking !== undefined && { negativeMarking }),
        ...(title !== undefined && { title }),
        ...(correctAnswers !== undefined && { correctAnswers }),
        ...(totalQuestions !== undefined && { totalQuestions }),
        ...(examDate !== undefined && { examDate: new Date(examDate) }),
        ...(examType !== undefined && { examType }),
        ...(relatedExamId !== undefined && { relatedExamId }),
        ...(totalScore !== undefined && { totalScore }),
      })
      .where(eq(exams.id, id))
      .returning();

    // Sınıf ataması güncelleniyorsa: eskisini sil, yenisini ekle
    if (classIds !== undefined) {
      await db.delete(examClasses).where(eq(examClasses.examId, id));
      if (classIds.length > 0) {
        await db.insert(examClasses).values(
          classIds.map((classId: number) => ({ examId: id, classId }))
        );
      }
    }

    // Soru bazlı ders/kazanım eşlemesi güncelleniyorsa: eskisini sil, yenisini ekle
    if (questions !== undefined) {
      await db.delete(examQuestions).where(eq(examQuestions.examId, id));
      if (questions.length > 0) {
        await db.insert(examQuestions).values(
          questions.map((q: any) => ({
            examId: id,
            questionNumber: q.questionNumber,
            subjectId: q.subjectId ?? null,
            learningOutcomeId: q.learningOutcomeId ?? null,
            customOutcomeText: q.customOutcomeText ?? null,
            correctAnswer: q.correctAnswer,
          }))
        );
      }
    }

    res.json(updated);
  } catch (error) {
    console.error('Exam update error:', error);
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
