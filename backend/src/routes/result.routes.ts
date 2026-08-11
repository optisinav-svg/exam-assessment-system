import { Router, Request, Response } from 'express';
import { db } from '../index';
import { results, exams, examQuestions, resultQuestionAnswers, examClasses, students, studentEnrollments } from '../../../shared/schema';
import { eq, inArray, and } from 'drizzle-orm';
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

// Bir sınava atanmış sınıflardaki, HENÜZ SONUCU OLMAYAN (sınava girmemiş) öğrencileri listele
router.get('/exam/:examId/missing-students', async (req: Request, res: Response) => {
  try {
    const examId = parseInt(req.params.examId);

    const assignedClasses = await db.select().from(examClasses).where(eq(examClasses.examId, examId));
    const classIds = assignedClasses.map((c) => c.classId).filter((id): id is number => id !== null);

    if (classIds.length === 0) {
      return res.json([]);
    }

    const classStudents = await db.select().from(students).where(inArray(students.classId, classIds));
    const existingResults = await db.select().from(results).where(eq(results.examId, examId));
    const resultStudentIds = new Set(existingResults.map((r) => r.studentId).filter((id) => id !== null));

    const missing = classStudents.filter((s) => !resultStudentIds.has(s.id));
    res.json(missing.map((s) => ({ id: s.id, firstName: s.firstName, lastName: s.lastName, studentNo: s.studentNo })));
  } catch (error) {
    res.status(500).json({ message: 'Liste getirilirken hata oluştu', error });
  }
});

// Yeni sonuç ekle (doğru/yanlış/net, sınavın doğru cevap anahtarına göre SUNUCUDA hesaplanır)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { examId, studentNo, studentId: providedStudentId, answers, scannedImage } = req.body;

    // İlgili sınavı getir (doğru cevaplar, seçenek sayısı, net ayarı, tam puan burada)
    const [exam] = await db.select().from(exams).where(eq(exams.id, examId));
    if (!exam) {
      return res.status(404).json({ message: 'Sınav bulunamadı' });
    }

    // ── Öğrenciyi eşleştir ──────────────────────────────────────────────
    // Öncelik: doğrudan studentId verilmişse onu kullan; yoksa studentNo ile,
    // sınavın atandığı sınıflardaki öğrenciler arasında ara (numara çakışması olmasın diye).
    let studentId: number | null = providedStudentId ?? null;

    if (!studentId && studentNo) {
      const assignedClasses = await db.select().from(examClasses).where(eq(examClasses.examId, examId));
      const classIds = assignedClasses.map((c) => c.classId).filter((id): id is number => id !== null);

      if (classIds.length > 0) {
        // 1) Kurum bazlı numaraya (institutionStudentNo) bakarak dene
        const enrollments = await db
          .select()
          .from(studentEnrollments)
          .where(and(inArray(studentEnrollments.classId, classIds), eq(studentEnrollments.institutionStudentNo, studentNo)));
        if (enrollments.length === 1) {
          studentId = enrollments[0].studentId;
        } else {
          // 2) students.studentNo alanına bakarak dene
          const matches = await db
            .select()
            .from(students)
            .where(and(inArray(students.classId, classIds), eq(students.studentNo, studentNo)));
          if (matches.length === 1) {
            studentId = matches[0].id;
          }
          // Birden fazla veya hiç eşleşme yoksa studentId null kalır — öğretmen elle eşleştirecek
        }
      }
    }

    // ── Ders/kazanım bazlı sorular tanımlıysa (yeni model) onları kullan,
    //    yoksa eski (tek blok) correctAnswers alanına düş ──────────────
    const questions = await db.select().from(examQuestions).where(eq(examQuestions.examId, examId));

    let correctCount = 0;
    let wrongCount = 0;

    if (questions.length > 0) {
      for (const q of questions) {
        const given = (answers ?? {})[String(q.questionNumber)];
        if (!given) continue;
        if (given === q.correctAnswer) correctCount++;
        else wrongCount++;
      }
    } else {
      const correctAnswersMap = exam.correctAnswers as Record<string, string>;
      const cmp = compareAnswers(answers ?? {}, correctAnswersMap);
      correctCount = cmp.correctCount;
      wrongCount = cmp.wrongCount;
    }

    const { net, score, emptyCount } = calculateNet({
      correctCount,
      wrongCount,
      totalQuestions: exam.totalQuestions,
      optionCount: exam.optionCount ?? 4,
      negativeMarking: exam.negativeMarking ?? true,
      totalScore: exam.totalScore ?? 100,
    });

    const [result] = await db.insert(results).values({
      examId,
      studentId,
      studentNo,
      answers,
      score,
      net,
      correctCount,
      wrongCount,
      emptyCount,
      scannedImage,
      processedAt: new Date(),
      status: studentId ? 'completed' : 'needs_student_match',
    }).returning();

    // Soru bazlı cevapları kaydet (kazanım/ders bazlı analiz için)
    if (questions.length > 0) {
      const detailRows = questions.map((q) => {
        const given = (answers ?? {})[String(q.questionNumber)] ?? null;
        return {
          resultId: result.id,
          examQuestionId: q.id,
          studentAnswer: given,
          isCorrect: given ? given === q.correctAnswer : null,
        };
      });
      if (detailRows.length > 0) {
        await db.insert(resultQuestionAnswers).values(detailRows);
      }
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Result create error:', error);
    res.status(500).json({ message: 'Sonuç eklenirken hata oluştu', error });
  }
});

// Sonuca sonradan öğrenci eşleştirme (öğretmen elle düzeltirse)
router.put('/:id/match-student', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { studentId } = req.body;
    if (!studentId) {
      return res.status(400).json({ message: 'studentId zorunludur' });
    }
    const [updated] = await db.update(results)
      .set({ studentId, status: 'completed' })
      .where(eq(results.id, id))
      .returning();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Eşleştirme sırasında hata oluştu', error });
  }
});

// Sonuç güncelle (öğretmen bir soruyu elle değiştirirse — bkz. manuel değerlendirme ekranı)
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
