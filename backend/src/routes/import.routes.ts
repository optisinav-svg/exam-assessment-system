import { Router, Request, Response } from 'express';
import { db } from '../index';
import { subjects, learningOutcomes } from '../../../shared/schema';
import { eq, isNotNull } from 'drizzle-orm';

const router = Router();

/**
 * Excel'den ders ve kazanım import etme
 * 
 * Beklenen JSON formatı:
 * {
 *   "items": [
 *     {
 *       "dersAdi": "Matematik",
 *       "sinif": "8A",           // Boş ise "Mezun" olarak işlenir
 *       "kazanımKodu": "M.8.1.1.1",
 *       "kazanımIsmi": "Tam sayılarla toplama işlemi yapar"
 *     }
 *   ]
 * }
 * 
 * İş mantığı:
 * 1. Aynı ders adı + sınıf kombinasyonu tek bir "subject" oluşturur
 * 2. Her satır bir "learningOutcome" (kazanım) oluşturur
 * 3. "sinif" sütunu boş olan satırlar "Mezun" sınıfına atanır
 */
router.post('/excel', async (req: Request, res: Response) => {
  try {
    const teacherId = (req as any).user?.id;
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Geçersiz veri formatı. items dizisi gereklidir.' });
    }

    const createdSubjects: any[] = [];
    const createdOutcomes: any[] = [];
    let skippedCount = 0;

    // Dersleri grupla: aynı dersAdi + sinif kombinasyonu tek bir subject olur
    const subjectMap = new Map<string, number>(); // key: "dersAdi|sinif", value: subjectId

    // Önce mevcut dersleri kontrol et ve yeni olanları oluştur
    for (const item of items) {
      const dersAdi = (item.dersAdi || item.ders_adi || item.dersadı || '').trim();
      const sinif = (item.sinif || item.sınıf || item['class'] || '').trim() || 'Mezun';
      const kazanımKodu = (item.kazanımKodu || item['kazanım kodu'] || item.kazanım_kodu || '').trim();
      const kazanımIsmi = (item.kazanımIsmi || item['kazanım ismi'] || item.kazanım_ismi || '').trim();

      if (!dersAdi || !kazanımIsmi) {
        skippedCount++;
        continue;
      }

      const subjectKey = `${dersAdi}|${sinif}`;

      if (!subjectMap.has(subjectKey)) {
        // Bu ders-sınıf kombinasyonu için mevcut subject var mı kontrol et
        const existing = await db.select()
          .from(subjects)
          .where(eq(subjects.name, dersAdi));

        let subjectId: number;

        if (existing.length > 0) {
          // Mevcut dersi kullan
          subjectId = existing[0].id;
        } else {
          // Yeni ders oluştur
          const [newSubject] = await db.insert(subjects).values({
            teacherId,
            name: dersAdi,
            code: dersAdi.substring(0, 10).toUpperCase(),
            description: `${dersAdi} - ${sinif} sınıfı`,
            createdAt: new Date(),
          }).returning();
          subjectId = newSubject.id;
          createdSubjects.push(newSubject);
        }

        subjectMap.set(subjectKey, subjectId);
      }

      // Kazanım ekle
      const [newOutcome] = await db.insert(learningOutcomes).values({
        subjectId: subjectMap.get(subjectKey)!,
        code: kazanımKodu || `K${createdOutcomes.length + 1}`,
        description: kazanımIsmi,
        gradeLevel: sinif,
        category: sinif,
        createdAt: new Date(),
      }).returning();

      createdOutcomes.push(newOutcome);
    }

    res.status(201).json({
      message: 'Import işlemi başarıyla tamamlandı',
      stats: {
        totalRows: items.length,
        subjectsCreated: createdSubjects.length,
        outcomesCreated: createdOutcomes.length,
        skippedRows: skippedCount,
      },
      subjects: createdSubjects,
      outcomes: createdOutcomes.slice(0, 10), // İlk 10 kazanımı göster
    });
  } catch (error: any) {
    console.error('Import error:', error);
    res.status(500).json({
      message: 'Import sırasında hata oluştu',
      error: error.message,
    });
  }
});

/**
 * Sınıf bazında kazanım listesi getir
 */
router.get('/outcomes/grade/:gradeLevel', async (req: Request, res: Response) => {
  try {
    const gradeLevel = req.params.gradeLevel;
    const outcomes = await db.select()
      .from(learningOutcomes)
      .where(eq(learningOutcomes.gradeLevel, gradeLevel));

    res.json(outcomes);
  } catch (error: any) {
    res.status(500).json({ message: 'Kazanımlar getirilirken hata oluştu', error: error.message });
  }
});

/**
 * Tüm sınıf seviyeleri listesini getir
 */
router.get('/grades', async (req: Request, res: Response) => {
  try {
    const results = await db.select({
      gradeLevel: learningOutcomes.gradeLevel,
    })
    .from(learningOutcomes)
    .where(isNotNull(learningOutcomes.gradeLevel));

    // Benzersiz sınıf seviyelerini çıkar
    const uniqueGrades = [...new Set(results.map(r => r.gradeLevel))].filter(Boolean);
    uniqueGrades.sort();

    res.json({ grades: uniqueGrades });
  } catch (error: any) {
    res.status(500).json({ message: 'Sınıf seviyeleri getirilirken hata oluştu', error: error.message });
  }
});

export default router;
