import { Router, Request, Response } from 'express';
import { db } from '../index';
import { exams, results, subjects, classes, students, learningOutcomes, examClasses } from '../../../shared/schema';
import { eq, sql, desc, and, inArray } from 'drizzle-orm';

const router = Router();

// ─── GET /api/analytics/exam/:examId ─────────────────────────────────────────
// Bir sınavın detaylı analiz raporu
router.get('/exam/:examId', async (req: Request, res: Response) => {
  try {
    const examId = parseInt(req.params.examId);

    // Sınav bilgileri
    const [exam] = await db.select().from(exams).where(eq(exams.id, examId));
    if (!exam) {
      return res.status(404).json({ message: 'Sınav bulunamadı.' });
    }

    // Ders bilgisi
    let subjectName = 'Bilinmiyor';
    if (exam.subjectId) {
      const [subject] = await db.select().from(subjects).where(eq(subjects.id, exam.subjectId));
      subjectName = subject?.name || 'Bilinmiyor';
    }

    // Tüm sonuçları getir
    const examResults = await db.select().from(results).where(eq(results.examId, examId));

    if (examResults.length === 0) {
      return res.json({
        exam: { ...exam, subjectName },
        results: [],
        summary: {
          totalStudents: 0,
          avgNet: 0,
          avgScore: 0,
          highestNet: 0,
          lowestNet: 0,
          passRate: 0,
          correctDistribution: { correct: 0, wrong: 0, empty: 0 },
          classBreakdown: [],
        },
        outcomeAnalysis: [],
      });
    }

    // ── Özet İstatistikler ──────────────────────────────────────────────────
    const correctDistribution = examResults.reduce(
      (acc, r) => {
        acc.correct += r.correctCount || 0;
        acc.wrong += r.wrongCount || 0;
        acc.empty += r.emptyCount || 0;
        return acc;
      },
      { correct: 0, wrong: 0, empty: 0 }
    );

    const totalAnswers = correctDistribution.correct + correctDistribution.wrong + correctDistribution.empty;
    const avgNet = examResults.reduce((sum, r) => sum + (r.net || 0), 0) / examResults.length;
    const avgScore = examResults.reduce((sum, r) => sum + (r.score || 0), 0) / examResults.length;
    const highestNet = Math.max(...examResults.map(r => r.net || 0));
    const lowestNet = Math.min(...examResults.map(r => r.net || 0));

    // Başarı oranı (net / totalQuestions * 100)
    const passRate = avgNet > 0 ? (avgNet / (exam.totalQuestions || 1)) * 100 : 0;

    // ── Sınıf Bazlı Breakdown ───────────────────────────────────────────────
    // Sınavın hangi sınıflara atandığını bul
    const examClassRelations = await db.select().from(examClasses).where(eq(examClasses.examId, examId));
    const classIds = examClassRelations
      .map(ec => ec.classId)
      .filter((id): id is number => id !== null);

    let classBreakdown: any[] = [];
    if (classIds.length > 0) {
      // Her sınıfın sonuçlarını ayrı hesapla
      for (const classId of classIds) {
        const [classInfo] = await db.select().from(classes).where(eq(classes.id, classId));

        // Bu sınıftaki öğrencilerin sonuçlarını bul
        const classStudentNos = await db.select({ studentNo: students.studentNo })
          .from(students)
          .where(eq(students.classId, classId));

        const studentNos = classStudentNos.map(s => s.studentNo);
        if (studentNos.length === 0) continue;

        const classResults = examResults.filter(r => studentNos.includes(r.studentNo));
        if (classResults.length === 0) continue;

        const classAvgNet = classResults.reduce((sum, r) => sum + (r.net || 0), 0) / classResults.length;
        const classAvgScore = classResults.reduce((sum, r) => sum + (r.score || 0), 0) / classResults.length;

        classBreakdown.push({
          classId,
          className: classInfo?.name || `Sınıf ${classId}`,
          studentCount: classResults.length,
          avgNet: Math.round(classAvgNet * 100) / 100,
          avgScore: Math.round(classAvgScore * 100) / 100,
        });
      }
    }

    // ── Soru Bazlı Analiz ───────────────────────────────────────────────────
    const correctAnswersMap = exam.correctAnswers as Record<string, string>;
    const questionStats: any[] = [];

    for (const [questionKey, correctAnswer] of Object.entries(correctAnswersMap)) {
      let qCorrect = 0;
      let qWrong = 0;
      let qEmpty = 0;

      for (const result of examResults) {
        const studentAnswer = (result.answers as Record<string, string>)?.[questionKey];
        if (!studentAnswer || studentAnswer === '') {
          qEmpty++;
        } else if (studentAnswer === correctAnswer) {
          qCorrect++;
        } else {
          qWrong++;
        }
      }

      questionStats.push({
        question: questionKey,
        correct: qCorrect,
        wrong: qWrong,
        empty: qEmpty,
        successRate: Math.round((qCorrect / examResults.length) * 100),
        correctAnswer,
      });
    }

    // ── Kazanım Bazlı Analiz (eğer ders/sınav kazanımlarla ilişkiliyse) ──────
    const outcomeAnalysis: any[] = [];
    if (exam.subjectId) {
      const outcomes = await db.select()
        .from(learningOutcomes)
        .where(eq(learningOutcomes.subjectId, exam.subjectId))
        .limit(50);

      // Her kazanım için başarı oranı hesapla (soru bazlı eşleştirme ile)
      for (const outcome of outcomes) {
        // Kazanıma ait soruları bul (kazanım kodu ile soru eşleştirmesi)
        const relatedQuestions = questionStats.filter(q =>
          q.question.includes(outcome.code) || outcome.code.includes(q.question)
        );

        if (relatedQuestions.length > 0) {
          const avgSuccess = relatedQuestions.reduce((sum, q) => sum + q.successRate, 0) / relatedQuestions.length;
          outcomeAnalysis.push({
            outcomeId: outcome.id,
            code: outcome.code,
            description: outcome.description,
            questionCount: relatedQuestions.length,
            successRate: Math.round(avgSuccess),
          });
        }
      }
    }

    res.json({
      exam: { ...exam, subjectName },
      results: examResults.map(r => ({
        ...r,
        successRate: exam.totalQuestions > 0 ? Math.round(((r.net || 0) / exam.totalQuestions) * 100) : 0,
      })),
      summary: {
        totalStudents: examResults.length,
        avgNet: Math.round(avgNet * 100) / 100,
        avgScore: Math.round(avgScore),
        highestNet: Math.round(highestNet * 100) / 100,
        lowestNet: Math.round(lowestNet * 100) / 100,
        passRate: Math.round(passRate * 10) / 10,
        correctDistribution,
        totalAnswers,
        classBreakdown,
      },
      questionStats,
      outcomeAnalysis,
    });
  } catch (error: any) {
    console.error('Analytics exam error:', error);
    res.status(500).json({ message: 'Analiz verileri getirilirken hata oluştu', error: error.message });
  }
});

// ─── GET /api/analytics/dashboard ────────────────────────────────────────────
// Dashboard için özet veriler
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const teacherId = (req as any).user?.id;
    if (!teacherId) {
      return res.status(401).json({ message: 'Yetkilendirme gerekli' });
    }

    // Öğretmenin sınavları
    const teacherExams = await db.select().from(exams)
      .where(eq(exams.teacherId, teacherId))
      .orderBy(desc(exams.createdAt));

    // Her sınavın sonuç istatistikleri
    const examTrend: any[] = [];
    for (const exam of teacherExams.slice(0, 10)) {
      const examResults = await db.select().from(results).where(eq(results.examId, exam.id));
      if (examResults.length > 0) {
        const avgNet = examResults.reduce((sum, r) => sum + (r.net || 0), 0) / examResults.length;
        examTrend.push({
          examId: exam.id,
          name: exam.title,
          date: exam.examDate,
          studentCount: examResults.length,
          avgNet: Math.round(avgNet * 100) / 100,
          avgScore: Math.round(examResults.reduce((sum, r) => sum + (r.score || 0), 0) / examResults.length),
        });
      }
    }

    // Toplam öğrenci sayısı
    const totalStudents = await db.select({ count: sql<number>`count(*)` }).from(students);

    // Toplam sınav sayısı
    const totalExams = await db.select({ count: sql<number>`count(*)` }).from(exams)
      .where(eq(exams.teacherId, teacherId));

    // Toplam ders sayısı
    const totalSubjects = await db.select({ count: sql<number>`count(*)` }).from(subjects)
      .where(eq(subjects.teacherId, teacherId));

    // Genel başarı ortalaması
    const allResults = await db.select().from(results).where(
      sql`${results.examId} IN (SELECT id FROM exams WHERE teacher_id = ${teacherId})`
    );

    const avgScore = allResults.length > 0
      ? Math.round(allResults.reduce((sum, r) => sum + (r.score || 0), 0) / allResults.length)
      : 0;

    // Cevap dağılımı
    const answerDist = allResults.reduce(
      (acc, r) => {
        acc.correct += r.correctCount || 0;
        acc.wrong += r.wrongCount || 0;
        acc.empty += r.emptyCount || 0;
        return acc;
      },
      { correct: 0, wrong: 0, empty: 0 }
    );

    res.json({
      summary: {
        totalExams: totalExams[0]?.count || 0,
        totalStudents: totalStudents[0]?.count || 0,
        totalSubjects: totalSubjects[0]?.count || 0,
        avgScore,
      },
      examTrend,
      answerDistribution: {
        correct: answerDist.correct,
        wrong: answerDist.wrong,
        empty: answerDist.empty,
      },
      recentExams: teacherExams.slice(0, 5).map(e => ({
        id: e.id,
        title: e.title,
        examDate: e.examDate,
        status: e.status,
      })),
    });
  } catch (error: any) {
    console.error('Analytics dashboard error:', error);
    res.status(500).json({ message: 'Dashboard verileri getirilirken hata oluştu', error: error.message });
  }
});

// ─── GET /api/analytics/outcomes/:examId ─────────────────────────────────────
// Bir sınavın kazanım bazlı başarı analizi
router.get('/outcomes/:examId', async (req: Request, res: Response) => {
  try {
    const examId = parseInt(req.params.examId);

    const [exam] = await db.select().from(exams).where(eq(exams.id, examId));
    if (!exam || !exam.subjectId) {
      return res.status(404).json({ message: 'Sınav veya ders bilgisi bulunamadı.' });
    }

    const examResults = await db.select().from(results).where(eq(results.examId, examId));
    const correctAnswersMap = exam.correctAnswers as Record<string, string>;

    // Kazanımları getir
    const outcomes = await db.select()
      .from(learningOutcomes)
      .where(eq(learningOutcomes.subjectId, exam.subjectId));

    // Her soru için doğru/yanlış istatistikleri
    const questionStats: Record<string, { correct: number; total: number }> = {};
    for (const [qKey, correctAnswer] of Object.entries(correctAnswersMap)) {
      let correct = 0;
      for (const result of examResults) {
        const studentAnswer = (result.answers as Record<string, string>)?.[qKey];
        if (studentAnswer === correctAnswer) correct++;
      }
      questionStats[qKey] = { correct, total: examResults.length };
    }

    // Kazanım bazlı grupla (kazanım kodu ile soru eşleştirmesi)
    const outcomeAnalysis = outcomes.map(outcome => {
      const relatedQuestions = Object.entries(questionStats).filter(([qKey]) =>
        qKey.includes(outcome.code) || outcome.code.includes(qKey)
      );

      let totalCorrect = 0;
      let totalQuestions = 0;
      for (const [, stats] of relatedQuestions) {
        totalCorrect += stats.correct;
        totalQuestions += stats.total;
      }

      return {
        outcomeId: outcome.id,
        code: outcome.code,
        description: outcome.description,
        questionCount: relatedQuestions.length,
        successRate: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
        bloomLevel: outcome.bloomLevel,
      };
    });

    res.json({
      exam: { id: exam.id, title: exam.title },
      outcomes: outcomeAnalysis,
    });
  } catch (error: any) {
    console.error('Analytics outcomes error:', error);
    res.status(500).json({ message: 'Kazanım analizi getirilirken hata oluştu', error: error.message });
  }
});

export default router;
