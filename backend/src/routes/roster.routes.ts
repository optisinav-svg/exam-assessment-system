import express from 'express';
import { eq, and } from 'drizzle-orm';
import { students, classes, schools, studentEnrollments } from '../../../shared/schema';
import { db } from '../index';
import multer from 'multer';
import path from 'path';
import os from 'os';
import { createWorker } from 'tesseract.js';

// Multer konfigürasyonu (geçici dosya saklama)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(os.tmpdir(), 'ocr-uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

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

// POST /api/roster/classes/:classId/import-photo — Fotoğraf/PDF'den OCR ile isim oku
router.post('/classes/:classId/import-photo', upload.single('file'), async (req: any, res: express.Response) => {
  try {
    const teacherId = req.user?.id;
    const classId = parseInt(req.params.classId);

    if (!teacherId) {
      return res.status(401).json({ message: 'Kimlik doğrulama gerekli' });
    }

    // Sınıf yetki kontrolü
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

    if (!req.file) {
      return res.status(400).json({ message: 'Dosya gerekli' });
    }

    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();

    // PDF mi kontrol et
    let imagePath = filePath;
    if (fileExt === '.pdf') {
      // PDF'den ilk sayfayı görsel olarak çıkar (basit yaklaşım)
      // tesseract.js PDF'i doğrudan desteklemez, pdf'ten sadece metin katmanı varsa okunabilir
      // En yaygın kullanım fotoğraf (jpg/png) olacağı için PDF'yi basit metin çıkarmayla dene
      const pdfText = await extractPdfText(filePath);
      if (pdfText) {
        const detectedNames = parseNamesFromText(pdfText);
        return res.json({
          success: true,
          detectedNames,
          message: 'PDF metin katmanından isimler çıkarıldı',
        });
      } else {
        // PDF'de metin katmanı yoksa, fotoğrafa dönüştürülebilir
        return res.status(400).json({
          message: 'Bu PDF metin katmanı içermez. Lütfen listeden doğrudan bir fotoğraf (jpg/png) yükleyin.',
        });
      }
    }

    // Fotoğraf: Tesseract.js ile OCR
    const worker = await createWorker('tur+eng');
    const { data: { text } } = await worker.recognize(imagePath);
    await worker.terminate();

    const detectedNames = parseNamesFromText(text);

    // Geçici dosyayı sil
    try { require('fs').unlinkSync(imagePath); } catch (e) { /* */ }

    res.json({
      success: true,
      detectedNames,
      message: `OCR tamamlandı, ${detectedNames.length} isim tespit edildi`,
    });
  } catch (error) {
    console.error('OCR import hatası:', error);
    res.status(500).json({ message: 'OCR işlemi sırasında hata oluştu' });
  }
});

// POST /api/roster/classes/:classId/import-confirm — OCR ile tespit edilen isimleri toplu ekle
router.post('/classes/:classId/import-confirm', async (req: any, res: express.Response) => {
  try {
    const teacherId = req.user?.id;
    const classId = parseInt(req.params.classId);

    if (!teacherId) {
      return res.status(401).json({ message: 'Kimlik doğrulama gerekli' });
    }

    const { names } = req.body;

    if (!names || !Array.isArray(names) || names.length === 0) {
      return res.status(400).json({ message: 'names dizisi gerekli' });
    }

    // Sınıf yetki kontrolü
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

    // Toplu ekle
    const addedStudents = [];
    for (const nameStr of names) {
      if (!nameStr?.trim()) continue;

      // "Ad Soyad" formatından ayır
      const parts = nameStr.trim().split(/\s+/);
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';

      if (!firstName || !lastName) {
        // Tek kelime varsa, hepini firstName yap
        addedStudents.push({ name: nameStr.trim(), error: 'Tek kelime — Ad Soyad olarak ayırlamadı' });
        continue;
      }

      const [newStudent] = await db
        .insert(students)
        .values({
          classId,
          teacherId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          studentNo: null,
          parentPhone: null,
          isApproved: true,
          isEmailVerified: true,
          email: null,
          password: null,
          isActive: true,
        })
        .returning();

      addedStudents.push({ name: nameStr.trim(), studentId: newStudent.id, error: null });
    }

    res.json({
      success: true,
      message: `${addedStudents.filter(s => !s.error).length} öğrenci eklendi`,
      results: addedStudents,
    });
  } catch (error) {
    console.error('Import confirm hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// PDF'den metin çıkar (pdfjs-lite yerine basit regex yaklaşımı)
async function extractPdfText(filePath: string): Promise<string> {
  try {
    // pdf-parse veya benzeri bir kütüphane kullan
    // Eğer yoksa, PDF'in metin katmanı var mı kontrol et
    const fs = require('fs');
    const buffer = fs.readFileSync(filePath);
    const text = buffer.toString('latin1');
    
    // PDF'de metin akışı var mı?
    const textStream = text.match(/\(([^)]{3,})\)\s*Tj/g);
    if (textStream && textStream.length > 3) {
      return textStream.map((t: string) => t.replace(/\(.*?\)\s*Tj/, (_: string, g: string) => g)).join('\n');
    }
    return '';
  } catch (e) {
    return '';
  }
}

// OCR metninden isim listesi çıkar
function parseNamesFromText(text: string): string[] {
  const lines = text.split('\n');
  const names: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Satırda sayı varsa atla (numara, tarih, vs.)
    if (/\d/.test(trimmed)) continue;

    // 2+ kelime olmalı
    const words = trimmed.split(/\s+/).filter(w => w.length > 0);
    if (words.length < 2) continue;

    // Çok uzun satırları atla (başlık, adres vs.)
    if (trimmed.length > 50) continue;

    // Her kelime en az 2 karakter olmalı (Türkçe isimler)
    if (words.some(w => w.length < 2)) continue;

    names.push(trimmed);
  }

  return [...new Set(names)]; // Tekrar edenleri temizle
}

// PUT /api/roster/students/:id/transfer — Öğrenciyi başka bir sınıfa geçir
// (geçmiş kaybolmaz: eski kayıt "transferred" olarak kapanır, yenisi açılır)
router.put('/students/:id/transfer', async (req: any, res: express.Response) => {
  try {
    const teacherId = req.user?.id;
    const studentId = parseInt(req.params.id);
    const { newClassId } = req.body;

    if (!teacherId) {
      return res.status(401).json({ message: 'Kimlik doğrulama gerekli' });
    }
    if (!newClassId) {
      return res.status(400).json({ message: 'newClassId zorunludur' });
    }

    const [student] = await db.select().from(students).where(eq(students.id, studentId));
    if (!student) {
      return res.status(404).json({ message: 'Öğrenci bulunamadı' });
    }

    // Yeni sınıfın, isteği yapan öğretmene ait olduğunu doğrula
    const [cls] = await db.select().from(classes).where(eq(classes.id, parseInt(newClassId)));
    if (!cls || cls.schoolId === null) {
      return res.status(404).json({ message: 'Yeni sınıf bulunamadı' });
    }
    const [school] = await db.select().from(schools).where(eq(schools.id, cls.schoolId));
    if (!school || school.teacherId !== teacherId) {
      return res.status(403).json({ message: 'Bu sınıfa geçiş yapma yetkiniz yok' });
    }

    const oldClassId = student.classId;

    // 1) Öğrencinin "şu anki" sınıf/öğretmen bilgisini güncelle
    const [updated] = await db
      .update(students)
      .set({ classId: cls.id, teacherId: school.teacherId })
      .where(eq(students.id, studentId))
      .returning();

    // 2) Eski aktif kaydı varsa kapat (geçmiş olarak kalır)
    if (oldClassId !== null) {
      await db
        .update(studentEnrollments)
        .set({ status: 'transferred', endDate: new Date() })
        .where(
          and(
            eq(studentEnrollments.studentId, studentId),
            eq(studentEnrollments.classId, oldClassId),
            eq(studentEnrollments.status, 'active')
          )
        );
    }

    // 3) Yeni kaydı aç
    await db.insert(studentEnrollments).values({
      studentId,
      classId: cls.id,
      teacherId: school.teacherId!,
      status: 'active',
      joinMethod: 'roster',
    });

    res.json({
      success: true,
      message: 'Öğrenci yeni sınıfa aktarıldı, geçmiş kaydı korundu',
      student: updated,
    });
  } catch (error) {
    console.error('Sınıf geçişi hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// GET /api/roster/students/:id/history — Öğrencinin sınıf/öğretmen geçmişi
router.get('/students/:id/history', async (req: any, res: express.Response) => {
  try {
    const teacherId = req.user?.id;
    const studentId = parseInt(req.params.id);
    if (!teacherId) {
      return res.status(401).json({ message: 'Kimlik doğrulama gerekli' });
    }

    const history = await db
      .select({
        id: studentEnrollments.id,
        classId: studentEnrollments.classId,
        className: classes.name,
        status: studentEnrollments.status,
        joinMethod: studentEnrollments.joinMethod,
        startDate: studentEnrollments.startDate,
        endDate: studentEnrollments.endDate,
      })
      .from(studentEnrollments)
      .leftJoin(classes, eq(studentEnrollments.classId, classes.id))
      .where(eq(studentEnrollments.studentId, studentId))
      .orderBy(studentEnrollments.startDate);

    res.json({ success: true, history });
  } catch (error) {
    console.error('Geçmiş getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});


export default router;
