import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../index';
import { students, users } from '../../../shared/schema';
import { eq, and } from 'drizzle-orm';
import {
  sendEmail,
  verificationEmailHtml,
  teacherNewRequestEmailHtml,
} from '../utils/email';

const router = Router();

// ─── POST /api/student-auth/register ─────────────────────────────────────────
// Öğrenci kendi hesabıyla kayıt olur, bir öğretmene bağlanma isteği gönderir
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, studentNo, teacherEmail } = req.body;

    if (!email || !password || !fullName || !teacherEmail) {
      return res.status(400).json({
        message: 'email, password, fullName ve teacherEmail alanları gereklidir.',
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

    // Belirtilen öğretmen var mı?
    const [teacher] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, teacherEmail), eq(users.role, 'teacher')));

    if (!teacher) {
      return res.status(404).json({
        message: 'Belirtilen e-posta adresine sahip bir öğretmen bulunamadı.',
      });
    }

    // Ad-soyadı ayır
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || fullName;
    const lastName = nameParts.slice(1).join(' ') || '-';

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

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
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';
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
