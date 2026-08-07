import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { db } from '../index';
import { students } from '../../../shared/schema';
import { studentEnrollments } from '../../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { sendEmail, studentApprovedEmailHtml } from '../utils/email';

const router = Router();

// ─── GET /api/students/me ─────────────────────────────────────────────────
// Giriş yapmış öğrencinin kendi profil bilgilerini getirir
router.get('/me', async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).user?.id;
    const [student] = await db.select().from(students).where(eq(students.id, studentId));
    if (!student) {
      return res.status(404).json({ message: 'Öğrenci bulunamadı' });
    }
    res.json({
      id: student.id,
      email: student.email,
      fullName: `${student.firstName} ${student.lastName}`,
      role: 'student',
      profileImage: student.profileImage,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Profil getirilirken hata oluştu', error: error.message });
  }
});

// ─── PUT /api/students/me/profile ─────────────────────────────────────────
router.put('/me/profile', async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).user?.id;
    const { fullName, profileImage } = req.body;

    const updates: Record<string, any> = {};
    if (fullName !== undefined) {
      const parts = String(fullName).trim().split(/\s+/);
      updates.firstName = parts[0] || fullName;
      updates.lastName = parts.slice(1).join(' ') || '-';
    }
    if (profileImage !== undefined) updates.profileImage = profileImage;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'Güncellenecek bir alan gönderilmedi.' });
    }

    const [updated] = await db.update(students).set(updates).where(eq(students.id, studentId)).returning();

    res.json({
      id: updated.id,
      email: updated.email,
      fullName: `${updated.firstName} ${updated.lastName}`,
      role: 'student',
      profileImage: updated.profileImage,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Profil güncellenirken hata oluştu', error: error.message });
  }
});

// ─── PUT /api/students/me/password ────────────────────────────────────────
router.put('/me/password', async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Mevcut ve yeni şifre gereklidir.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Yeni şifre en az 6 karakter olmalıdır.' });
    }

    const [student] = await db.select().from(students).where(eq(students.id, studentId));
    if (!student || !student.password) {
      return res.status(404).json({ message: 'Öğrenci bulunamadı' });
    }

    const isValid = await bcrypt.compare(currentPassword, student.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Mevcut şifre hatalı.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.update(students).set({ password: hashedPassword }).where(eq(students.id, studentId));

    res.json({ message: 'Şifre başarıyla güncellendi.' });
  } catch (error: any) {
    res.status(500).json({ message: 'Şifre güncellenirken hata oluştu', error: error.message });
  }
});

// ─── GET /api/students/pending ───────────────────────────────────────────────
// Giriş yapan öğretmenin, e-postasını onaylamış ama henüz kendisi tarafından
// onaylanmamış öğrenci isteklerini listeler
router.get('/pending', async (req: Request, res: Response) => {
  try {
    const teacherId = (req as any).user?.id;
    if (!teacherId) {
      return res.status(401).json({ message: 'Yetkilendirme gerekli' });
    }

    const pendingStudents = await db
      .select({
        id: students.id,
        firstName: students.firstName,
        lastName: students.lastName,
        email: students.email,
        studentNo: students.studentNo,
        createdAt: students.createdAt,
      })
      .from(students)
      .where(and(
        eq(students.teacherId, teacherId),
        eq(students.isApproved, false),
        eq(students.isEmailVerified, true)
      ));

    res.json(pendingStudents);
  } catch (error: any) {
    console.error('Pending students error:', error);
    res.status(500).json({ message: 'Bekleyen istekler getirilirken hata oluştu', error: error.message });
  }
});

// ─── GET /api/students ───────────────────────────────────────────────────────
// Öğretmenin onaylanmış tüm öğrencilerini listeler
router.get('/', async (req: Request, res: Response) => {
  try {
    const teacherId = (req as any).user?.id;
    if (!teacherId) {
      return res.status(401).json({ message: 'Yetkilendirme gerekli' });
    }

    const approvedStudents = await db
      .select({
        id: students.id,
        firstName: students.firstName,
        lastName: students.lastName,
        email: students.email,
        studentNo: students.studentNo,
        classId: students.classId,
        parentPhone: students.parentPhone,
        isActive: students.isActive,
      })
      .from(students)
      .where(and(
        eq(students.teacherId, teacherId),
        eq(students.isApproved, true)
      ));

    res.json(approvedStudents);
  } catch (error: any) {
    console.error('Students list error:', error);
    res.status(500).json({ message: 'Öğrenciler getirilirken hata oluştu', error: error.message });
  }
});

// ─── POST /api/students/:id/approve ──────────────────────────────────────────
// Bekleyen bir öğrenci isteğini onaylar, isteğe bağlı olarak sınıf ve öğrenci no atar
router.post('/:id/approve', async (req: Request, res: Response) => {
  try {
    const teacherId = (req as any).user?.id;
    const studentId = parseInt(req.params.id);
    const { classId, studentNo } = req.body;

    const [student] = await db
      .select()
      .from(students)
      .where(and(eq(students.id, studentId), eq(students.teacherId, teacherId)));

    if (!student) {
      return res.status(404).json({ message: 'Öğrenci isteği bulunamadı.' });
    }

    const [updated] = await db.update(students)
      .set({
        isApproved: true,
        ...(classId !== undefined && { classId }),
        ...(studentNo !== undefined && { studentNo }),
      })
      .where(eq(students.id, studentId))
      .returning();

    // Kayıt geçmişi: onaylanan öğrenci için aktif bir kayıt oluştur (sınıf belirtildiyse)
    if (classId !== undefined) {
      await db.insert(studentEnrollments).values({
        studentId,
        classId,
        teacherId,
        status: 'active',
        joinMethod: 'email_request',
      });
    }

    if (student.email) {
      await sendEmail(
        student.email,
        'OptikSınav - Hesabınız Onaylandı',
        studentApprovedEmailHtml(`${student.firstName} ${student.lastName}`)
      );
    }

    res.json({ message: 'Öğrenci onaylandı', student: updated });
  } catch (error: any) {
    console.error('Approve student error:', error);
    res.status(500).json({ message: 'Onaylama sırasında hata oluştu', error: error.message });
  }
});

// ─── POST /api/students/:id/reject ───────────────────────────────────────────
// Bekleyen bir öğrenci isteğini reddeder (kaydı siler)
router.post('/:id/reject', async (req: Request, res: Response) => {
  try {
    const teacherId = (req as any).user?.id;
    const studentId = parseInt(req.params.id);

    const [student] = await db
      .select()
      .from(students)
      .where(and(eq(students.id, studentId), eq(students.teacherId, teacherId)));

    if (!student) {
      return res.status(404).json({ message: 'Öğrenci isteği bulunamadı.' });
    }

    await db.delete(students).where(eq(students.id, studentId));

    res.json({ message: 'Öğrenci isteği reddedildi.' });
  } catch (error: any) {
    console.error('Reject student error:', error);
    res.status(500).json({ message: 'Reddetme sırasında hata oluştu', error: error.message });
  }
});

export default router;
