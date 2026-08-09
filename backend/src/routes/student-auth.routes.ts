import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../index';
import { students, users, schools, classes, studentEnrollments } from '../../../shared/schema';
import { eq, and } from 'drizzle-orm';
import {
  sendEmail,
  verificationEmailHtml,
  teacherNewRequestEmailHtml,
} from '../utils/email';

const router = Router();

// ─── GET /api/student-auth/school-lookup/:code ───────────────────────────────
// Öğrenci, öğretmenden aldığı okul koduyla o okulun adını ve sınıf listesini görür.
// Kimlik doğrulaması gerektirmez (kayıt ekranında kullanılır).
router.get('/school-lookup/:code', async (req: Request, res: Response) => {
  try {
    const code = req.params.code.trim().toUpperCase();
    const [school] = await db.select().from(schools).where(eq(schools.joinCode, code));
    if (!school) {
      return res.status(404).json({ message: 'Bu koda ait bir okul bulunamadı.' });
    }
    const schoolClasses = await db.select().from(classes).where(eq(classes.schoolId, school.id));
    res.json({
      schoolId: school.id,
      schoolName: school.name,
      classes: schoolClasses.map((c) => ({ id: c.id, name: c.name })),
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Okul aranırken hata oluştu', error: error.message });
  }
});

// ─── POST /api/student-auth/register ─────────────────────────────────────────
// Öğrenci kendi hesabıyla kayıt olur, bir öğretmene bağlanma isteği gönderir
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, studentNo, teacherEmail, schoolCode, classId } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({
        message: 'email, password ve fullName alanları gereklidir.',
      });
    }
    if (!teacherEmail && !(schoolCode && classId)) {
      return res.status(400).json({
        message: 'teacherEmail veya (schoolCode + classId) alanlarından biri gereklidir.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Şifre en az 6 karakter olmalıdır.' });
    }

    // Bu e-posta zaten kayıtlı mı?
    const existing = await db.select().from(students).where(eq(students.email, email));
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Bu e-posta adresi zaten kayıtlı.' });
    }

    // Ad-soyadı ayır
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || fullName;
    const lastName = nameParts.slice(1).join(' ') || '-';

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // ── Yöntem 1: Okul kodu + sınıf seçimi (anında katılım, öğretmen onayı gerekmez) ──
    if (schoolCode && classId) {
      const [cls] = await db.select().from(classes).where(eq(classes.id, parseInt(classId)));
      if (!cls) {
        return res.status(404).json({ message: 'Seçilen sınıf bulunamadı.' });
      }
      const [school] = await db
        .select()
        .from(schools)
        .where(and(eq(schools.id, cls.schoolId!), eq(schools.joinCode, schoolCode.trim().toUpperCase())));
      if (!school) {
        return res.status(404).json({ message: 'Okul kodu geçersiz.' });
      }

      const [newStudent] = await db.insert(students).values({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        studentNo: studentNo || null,
        classId: cls.id,
        teacherId: school.teacherId,
        isApproved: true, // kod ile katılım = anında onay
        isEmailVerified: false,
        emailVerificationToken: verificationToken,
        isActive: true,
        createdAt: new Date(),
      }).returning();

      await db.insert(studentEnrollments).values({
        studentId: newStudent.id,
        classId: cls.id,
        teacherId: school.teacherId!,
        status: 'active',
        joinMethod: 'code',
      });

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const verifyUrl = `${baseUrl}/api/student-auth/verify-email/${verificationToken}`;
      await sendEmail(email, 'OptikSınav - E-posta Onayı', verificationEmailHtml(fullName, verifyUrl));

      return res.status(201).json({
        message: `${school.name} - ${cls.name} sınıfına katıldınız. Lütfen e-postanızı onaylayın.`,
        studentId: newStudent.id,
      });
    }

    // ── Yöntem 2: Öğretmen e-postası ile istek gönderme (öğretmen onayı beklenir) ──
    const [teacher] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, teacherEmail), eq(users.role, 'teacher')));

    if (!teacher) {
      return res.status(404).json({
        message: 'Belirtilen e-posta adresine sahip bir öğretmen bulunamadı.',
      });
    }

    const [newStudent] = await db.insert(students).values({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      studentNo: studentNo || null,
      teacherId: teacher.id,
      isApproved: false,
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      isActive: true,
      createdAt: new Date(),
    }).returning();

    // E-posta onay bağlantısı gönder
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const verifyUrl = `${baseUrl}/api/student-auth/verify-email/${verificationToken}`;
    await sendEmail(
      email,
      'OptikSınav - E-posta Onayı',
      verificationEmailHtml(fullName, verifyUrl)
    );

    res.status(201).json({
      message: 'Kayıt isteğiniz alındı. Lütfen e-postanızı onaylayın, ardından öğretmeninizin onayını bekleyin.',
      studentId: newStudent.id,
    });
  } catch (error: any) {
    console.error('Student register error:', error);
    res.status(500).json({ message: 'Kayıt sırasında hata oluştu', error: error.message });
  }
});

// ─── GET /api/student-auth/verify-email/:token ───────────────────────────────
// Öğrencinin e-posta onay bağlantısına tıklamasıyla çalışır
router.get('/verify-email/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.emailVerificationToken, token));

    if (!student) {
      return res.status(400).send(
        '<h2>Geçersiz veya süresi dolmuş onay bağlantısı.</h2>'
      );
    }

    await db.update(students)
      .set({ isEmailVerified: true, emailVerificationToken: null })
      .where(eq(students.id, student.id));

    // Öğretmene, yeni bir isteğin e-postasını onayladığını bildir
    if (student.teacherId) {
      const [teacher] = await db.select().from(users).where(eq(users.id, student.teacherId));
      if (teacher) {
        await sendEmail(
          teacher.email,
          'OptikSınav - Yeni Öğrenci Kayıt İsteği',
          teacherNewRequestEmailHtml(
            teacher.fullName,
            `${student.firstName} ${student.lastName}`,
            student.email || ''
          )
        );
      }
    }

    res.send(`
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 40px;">
        <h2 style="color: #4A6CF7;">E-postanız onaylandı! ✅</h2>
        <p>Artık öğretmeninizin hesabınızı onaylamasını bekleyebilirsiniz.</p>
        <p>Bu sayfayı kapatabilirsiniz.</p>
      </div>
    `);
  } catch (error: any) {
    console.error('Email verify error:', error);
    res.status(500).send('<h2>Onay sırasında bir hata oluştu.</h2>');
  }
});

// ─── POST /api/student-auth/login ────────────────────────────────────────────
// Öğrenci girişi (e-posta onaylı VE öğretmen onaylı olmalı)
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email ve password alanları gereklidir.' });
    }

    const [student] = await db.select().from(students).where(eq(students.email, email));

    if (!student || !student.password) {
      return res.status(401).json({ message: 'E-posta veya şifre hatalı.' });
    }

    const passwordMatches = await bcrypt.compare(password, student.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'E-posta veya şifre hatalı.' });
    }

    if (!student.isEmailVerified) {
      return res.status(403).json({
        message: 'Lütfen önce e-postanızı onaylayın (kayıt olurken gönderilen bağlantı).',
      });
    }

    if (!student.isApproved) {
      return res.status(403).json({
        message: 'Hesabınız henüz öğretmeniniz tarafından onaylanmadı.',
      });
    }

    const token = jwt.sign(
      { id: student.id, email: student.email, role: 'student' },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: student.id,
        email: student.email,
        fullName: `${student.firstName} ${student.lastName}`,
        role: 'student',
      },
    });
  } catch (error: any) {
    console.error('Student login error:', error);
    res.status(500).json({ message: 'Giriş sırasında hata oluştu', error: error.message });
  }
});

export default router;
