import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../index';
import { users } from '../../../shared/schema';
import { eq } from 'drizzle-orm';
import { sendEmail, verificationEmailHtml } from '../utils/email';

const router = Router();

// Kayıt ol
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, role } = req.body;

    // Email kontrolü
    const existingUser = await db.select().from(users).where(eq(users.email, email));
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Bu email zaten kayıtlı' });
    }

    // Şifre hashle
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Kullanıcı oluştur (e-posta onaylanana kadar isEmailVerified: false)
    const [newUser] = await db.insert(users).values({
      email,
      password: hashedPassword,
      fullName,
      role: role || 'teacher',
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      createdAt: new Date(),
    }).returning();

    // Onay e-postası gönder
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const verifyUrl = `${baseUrl}/api/auth/verify-email/${verificationToken}`;
    await sendEmail(email, 'OptikSınav - E-posta Onayı', verificationEmailHtml(fullName, verifyUrl));

    res.status(201).json({
      message: 'Kayıt başarılı. Lütfen e-postanıza gönderilen bağlantıyla hesabınızı onaylayın.',
      requiresEmailVerification: true,
    });
  } catch (error) {
    res.status(500).json({ message: 'Kayıt olurken hata oluştu', error });
  }
});

// ─── GET /api/auth/verify-email/:token ────────────────────────────────────
router.get('/verify-email/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const [user] = await db.select().from(users).where(eq(users.emailVerificationToken, token));

    if (!user) {
      return res.status(400).send('<h2>Geçersiz veya süresi dolmuş onay bağlantısı.</h2>');
    }

    await db.update(users)
      .set({ isEmailVerified: true, emailVerificationToken: null })
      .where(eq(users.id, user.id));

    res.send('<h2>E-posta adresiniz onaylandı! Artık uygulamaya giriş yapabilirsiniz.</h2>');
  } catch (error) {
    res.status(500).send('<h2>Onay sırasında bir hata oluştu.</h2>');
  }
});

// Giriş yap
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) {
      return res.status(401).json({ message: 'Email veya şifre hatalı' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Email veya şifre hatalı' });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: 'E-posta adresiniz henüz onaylanmamış. Lütfen e-postanızı kontrol edin.',
        requiresEmailVerification: true,
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Giriş yaparken hata oluştu', error });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────
// Giriş yapmış öğretmenin kendi profil bilgilerini getirir
router.get('/me', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    res.json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      profileImage: user.profileImage,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Profil getirilirken hata oluştu', error: error.message });
  }
});

// ─── PUT /api/auth/profile ────────────────────────────────────────────────
// Ad-soyad ve/veya profil fotoğrafını günceller
router.put('/profile', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { fullName, profileImage } = req.body;

    const updates: Record<string, any> = {};
    if (fullName !== undefined) updates.fullName = fullName;
    if (profileImage !== undefined) updates.profileImage = profileImage;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'Güncellenecek bir alan gönderilmedi.' });
    }

    const [updated] = await db.update(users).set(updates).where(eq(users.id, userId)).returning();

    res.json({
      id: updated.id,
      email: updated.email,
      fullName: updated.fullName,
      role: updated.role,
      profileImage: updated.profileImage,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Profil güncellenirken hata oluştu', error: error.message });
  }
});

// ─── PUT /api/auth/password ───────────────────────────────────────────────
// Mevcut şifreyi doğrulayıp yeni şifreyi kaydeder
router.put('/password', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Mevcut ve yeni şifre gereklidir.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Yeni şifre en az 6 karakter olmalıdır.' });
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Mevcut şifre hatalı.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));

    res.json({ message: 'Şifre başarıyla güncellendi.' });
  } catch (error: any) {
    res.status(500).json({ message: 'Şifre güncellenirken hata oluştu', error: error.message });
  }
});

export default router;