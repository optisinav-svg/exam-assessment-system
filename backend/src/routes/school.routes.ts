import express from 'express';
import { eq, and } from 'drizzle-orm';
import { schools, classes } from '../../../shared/schema';
import { db } from '../index';

const router = express.Router();

// GET /api/schools — Öğretmenin okullarını listele
router.get('/', async (req: any, res: express.Response) => {
  try {
    const teacherId = req.user?.id;
    if (!teacherId) {
      return res.status(401).json({ message: 'Kimlik doğrulama gerekli' });
    }

    const teacherSchools = await db
      .select()
      .from(schools)
      .where(eq(schools.teacherId, teacherId))
      .orderBy(schools.createdAt);

    // Her okul için sınıf sayısını ekle
    const schoolsWithCounts = await Promise.all(
      teacherSchools.map(async (school) => {
        const classCount = await db
          .select()
          .from(classes)
          .where(eq(classes.schoolId, school.id));

        return {
          ...school,
          classCount: classCount.length,
        };
      })
    );

    res.json({
      success: true,
      schools: schoolsWithCounts,
      total: schoolsWithCounts.length,
    });
  } catch (error) {
    console.error('Okul listeleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// POST /api/schools — Yeni okul ekle
router.post('/', async (req: any, res: express.Response) => {
  try {
    const teacherId = req.user?.id;
    if (!teacherId) {
      return res.status(401).json({ message: 'Kimlik doğrulama gerekli' });
    }

    const { name, address, phone } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Okul adı zorunludur' });
    }

    // Benzersiz, kolay okunur bir katılım kodu üret (örn. AB3X9K)
    function generateJoinCode() {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // karışabilecek 0/O, 1/I çıkarıldı
      let code = '';
      for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
      return code;
    }
    let joinCode = generateJoinCode();
    // Çakışma ihtimaline karşı (çok düşük ama) kontrol
    for (let attempt = 0; attempt < 5; attempt++) {
      const existing = await db.select().from(schools).where(eq(schools.joinCode, joinCode));
      if (existing.length === 0) break;
      joinCode = generateJoinCode();
    }

    const [newSchool] = await db
      .insert(schools)
      .values({
        teacherId,
        name: name.trim(),
        address: address?.trim() || null,
        phone: phone?.trim() || null,
        joinCode,
      })
      .returning();

    res.status(201).json({
      success: true,
      message: 'Okul başarıyla eklendi',
      school: newSchool,
    });
  } catch (error) {
    console.error('Okul ekleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// DELETE /api/schools/:schoolId — Okul sil
router.delete('/:schoolId', async (req: any, res: express.Response) => {
  try {
    const teacherId = req.user?.id;
    const schoolId = parseInt(req.params.schoolId);

    if (!teacherId) {
      return res.status(401).json({ message: 'Kimlik doğrulama gerekli' });
    }

    // Okulun öğretmene ait olduğunu kontrol et
    const school = await db
      .select()
      .from(schools)
      .where(and(eq(schools.id, schoolId), eq(schools.teacherId, teacherId)));

    if (school.length === 0) {
      return res.status(404).json({ message: 'Okul bulunamadı' });
    }

    // Önce sınıfları sil
    await db.delete(classes).where(eq(classes.schoolId, schoolId));

    // Sonra okulu sil
    await db.delete(schools).where(eq(schools.id, schoolId));

    res.json({
      success: true,
      message: 'Okul ve ilişkili sınıflar silindi',
    });
  } catch (error) {
    console.error('Okul silme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// GET /api/schools/:schoolId/classes — Bir okulun sınıflarını listele
router.get('/:schoolId/classes', async (req: any, res: express.Response) => {
  try {
    const teacherId = req.user?.id;
    const schoolId = parseInt(req.params.schoolId);

    if (!teacherId) {
      return res.status(401).json({ message: 'Kimlik doğrulama gerekli' });
    }

    // Okulun öğretmene ait olduğunu kontrol et
    const school = await db
      .select()
      .from(schools)
      .where(and(eq(schools.id, schoolId), eq(schools.teacherId, teacherId)));

    if (school.length === 0) {
      return res.status(404).json({ message: 'Okul bulunamadı' });
    }

    const schoolClasses = await db
      .select()
      .from(classes)
      .where(eq(classes.schoolId, schoolId))
      .orderBy(classes.name);

    res.json({
      success: true,
      classes: schoolClasses,
      total: schoolClasses.length,
    });
  } catch (error) {
    console.error('Sınıf listeleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// POST /api/schools/:schoolId/classes — Yeni sınıf ekle
router.post('/:schoolId/classes', async (req: any, res: express.Response) => {
  try {
    const teacherId = req.user?.id;
    const schoolId = parseInt(req.params.schoolId);

    if (!teacherId) {
      return res.status(401).json({ message: 'Kimlik doğrulama gerekli' });
    }

    // Okulun öğretmene ait olduğunu kontrol et
    const school = await db
      .select()
      .from(schools)
      .where(and(eq(schools.id, schoolId), eq(schools.teacherId, teacherId)));

    if (school.length === 0) {
      return res.status(404).json({ message: 'Okul bulunamadı' });
    }

    const { name, gradeLevel, academicYear } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Sınıf adı zorunludur' });
    }

    const [newClass] = await db
      .insert(classes)
      .values({
        schoolId,
        name: name.trim(),
        gradeLevel: gradeLevel?.trim() || null,
        academicYear: academicYear?.trim() || null,
      })
      .returning();

    res.status(201).json({
      success: true,
      message: 'Sınıf başarıyla eklendi',
      class: newClass,
    });
  } catch (error) {
    console.error('Sınıf ekleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// DELETE /api/schools/:schoolId/classes/:classId — Sınıf sil
router.delete('/:schoolId/classes/:classId', async (req: any, res: express.Response) => {
  try {
    const teacherId = req.user?.id;
    const schoolId = parseInt(req.params.schoolId);
    const classId = parseInt(req.params.classId);

    if (!teacherId) {
      return res.status(401).json({ message: 'Kimlik doğrulama gerekli' });
    }

    // Okulun öğretmene ait olduğunu kontrol et
    const school = await db
      .select()
      .from(schools)
      .where(and(eq(schools.id, schoolId), eq(schools.teacherId, teacherId)));

    if (school.length === 0) {
      return res.status(404).json({ message: 'Okul bulunamadı' });
    }

    // Sınıfın o okula ait olduğunu kontrol et
    const cls = await db
      .select()
      .from(classes)
      .where(and(eq(classes.id, classId), eq(classes.schoolId, schoolId)));

    if (cls.length === 0) {
      return res.status(404).json({ message: 'Sınıf bulunamadı' });
    }

    await db.delete(classes).where(eq(classes.id, classId));

    res.json({
      success: true,
      message: 'Sınıf silindi',
    });
  } catch (error) {
    console.error('Sınıf silme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

export default router;
