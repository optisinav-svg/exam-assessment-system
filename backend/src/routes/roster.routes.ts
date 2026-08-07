import express from 'express';
import { eq, and } from 'drizzle-orm';
import { students, classes, schools } from '../../../shared/schema';
import { db } from '../index';

const router = express.Router();

// POST /api/roster/students — Öğretmen bir sınıfa öğrenci ekler (onay beklemeden aktif)
router.post('/students', async (req: any, res: express.Response) => {
  try {
    const teacherId = req.user?.id;
    if (!teacherId) {
      return res.status(401).json({ message: 'Kimlik doğrulama gerekli' });
    }

    const { classId, firstName, lastName, studentNo, parentPhone } = req.body;

    if (!classId || !firstName?.trim() || !lastName?.trim()) {
      return res.status(400).json({ message: 'Sınıf, ad ve soyad zorunludur' });
    }

    // Sınıfın öğretmene ait olduğunu kontrol et (school -> teacherId zinciri)
    const cls = await db
      .select({
        classId: classes.id,
        schoolId: classes.schoolId,
      })
      .from(classes)
      .where(eq(classes.id, parseInt(classId)));

    if (cls.length === 0) {
      return res.status(404).json({ message: 'Sınıf bulunamadı' });
    }
    const clsSchoolId = cls[0].schoolId;
    if (clsSchoolId === null) {
      return res.status(404).json({ message: 'Sınıfın bağlı olduğu okul bulunamadı' });
    }

    const school = await db
      .select({ teacherId: schools.teacherId })
      .from(schools)
      .where(eq(schools.id, clsSchoolId));

    if (school.length === 0 || school[0].teacherId !== teacherId) {
      return res.status(403).json({ message: 'Bu sınıfa öğrenci ekleme yetkiniz yok' });
    }

    const [newStudent] = await db
      .insert(students)
      .values({
        classId: parseInt(classId),
        teacherId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        studentNo: studentNo?.trim() || null,
        parentPhone: parentPhone?.trim() || null,
        isApproved: true, // Onay beklemeden aktif
        isEmailVerified: true, // E-posta onayı gerekli değil
        email: null,
        password: null,
        isActive: true,
      })
      .returning();

    res.status(201).json({
      success: true,
      message: 'Öğrenci başarıyla eklendi',
      student: newStudent,
    });
  } catch (error) {
    console.error('Öğrenci ekleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// GET /api/roster/classes/:classId/students — Bir sınıftaki tüm öğrencileri listele
router.get('/classes/:classId/students', async (req: any, res: express.Response) => {
  try {
    const teacherId = req.user?.id;
    const classId = parseInt(req.params.classId);

    if (!teacherId) {
      return res.status(401).json({ message: 'Kimlik doğrulama gerekli' });
    }

    // Sınıfın öğretmene ait olduğunu kontrol et
    const cls = await db
      .select({ classId: classes.id, schoolId: classes.schoolId })
      .from(classes)
      .where(eq(classes.id, classId));

    if (cls.length === 0) {
      return res.status(404).json({ message: 'Sınıf bulunamadı' });
    }
    const clsSchoolId = cls[0].schoolId;
    if (clsSchoolId === null) {
      return res.status(404).json({ message: 'Sınıfın bağlı olduğu okul bulunamadı' });
    }

    const school = await db
      .select({ teacherId: schools.teacherId })
      .from(schools)
      .where(eq(schools.id, clsSchoolId));

    if (school.length === 0 || school[0].teacherId !== teacherId) {
      return res.status(403).json({ message: 'Bu sınıfa erişim yetkiniz yok' });
    }

    const studentList = await db
      .select()
      .from(students)
      .where(eq(students.classId, classId))
      .orderBy(students.lastName, students.firstName);

    res.json({
      success: true,
      students: studentList,
      total: studentList.length,
    });
  } catch (error) {
    console.error('Öğrenci listeleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// PUT /api/roster/students/:id — Öğrenci bilgilerini düzenle
router.put('/students/:id', async (req: any, res: express.Response) => {
  try {
    const teacherId = req.user?.id;
    const studentId = parseInt(req.params.id);

    if (!teacherId) {
      return res.status(401).json({ message: 'Kimlik doğrulama gerekli' });
    }

    const { firstName, lastName, studentNo, parentPhone } = req.body;

    // Öğrencinin öğretmene ait olduğunu kontrol et
    const student = await db
      .select()
      .from(students)
      .where(and(eq(students.id, studentId), eq(students.teacherId, teacherId)));

    if (student.length === 0) {
      return res.status(404).json({ message: 'Öğrenci bulunamadı' });
    }

    const updateData: Record<string, any> = {};
    if (firstName !== undefined && firstName.trim()) updateData.firstName = firstName.trim();
    if (lastName !== undefined && lastName.trim()) updateData.lastName = lastName.trim();
    if (studentNo !== undefined) updateData.studentNo = studentNo?.trim() || null;
    if (parentPhone !== undefined) updateData.parentPhone = parentPhone?.trim() || null;

    const [updatedStudent] = await db
      .update(students)
      .set(updateData)
      .where(eq(students.id, studentId))
      .returning();

    res.json({
      success: true,
      message: 'Öğrenci bilgileri güncellendi',
      student: updatedStudent,
    });
  } catch (error) {
    console.error('Öğrenci güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// DELETE /api/roster/students/:id — Öğrenciyi sil
router.delete('/students/:id', async (req: any, res: express.Response) => {
  try {
    const teacherId = req.user?.id;
    const studentId = parseInt(req.params.id);

    if (!teacherId) {
      return res.status(401).json({ message: 'Kimlik doğrulama gerekli' });
    }

    // Öğrencinin öğretmene ait olduğunu kontrol et
    const student = await db
      .select()
      .from(students)
      .where(and(eq(students.id, studentId), eq(students.teacherId, teacherId)));

    if (student.length === 0) {
      return res.status(404).json({ message: 'Öğrenci bulunamadı' });
    }

    await db.delete(students).where(eq(students.id, studentId));

    res.json({
      success: true,
      message: 'Öğrenci silindi',
    });
  } catch (error) {
    console.error('Öğrenci silme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

export default router;
