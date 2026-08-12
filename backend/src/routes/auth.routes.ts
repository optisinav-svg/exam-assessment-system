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
    const {
      email, password, fullName, role,
      accountType, mainBranch, secondaryBranch, institutionLevels,
    } = req.body;

    // Kurum hariç herkes için ana branş zorunlu
    if (accountType !== 'kurum' && (!mainBranch || !mainBranch.trim())) {
      return res.status(400).json({ message: 'Ana branş seçimi zorunludur.' });
    }

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
      accountType: accountType || 'teacher',
      mainBranch: mainBranch || null,
      secondaryBranch: secondaryBranch || null,
      institutionLevels: Array.isArray(institutionLevels) ? institutionLevels.join(',') : (institutionLevels || null),
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      createdAt: new Date(),
    }).returning();

    // Onay e-postası gönder — bu başarısız olsa bile kayıt işlemi iptal OLMASIN
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const verifyUrl = `${baseUrl}/api/auth/verify-email/${verificationToken}`;
    let emailSent = true;
    try {
      await sendEmail(email, 'OptikSınav - E-posta Onayı', verificationEmailHtml(fullName, verifyUrl));
    } catch (emailError: any) {
      emailSent = false;
      console.error('[auth/register] E-posta gönderilemedi:', emailError?.message || emailError);
    }

    res.status(201).json({
      message: emailSent
        ? 'Kayıt başarılı. Lütfen e-postanıza gönderilen bağlantıyla hesabınızı onaylayın.'
        : 'Kayıt başarılı, ancak onay e-postası gönderilemedi. Lütfen "Onay e-postasını tekrar gönder" seçeneğini kullanın.',
      requiresEmailVerification: true,
      emailSent,
    });
  } catch (error: any) {
    console.error('[auth/register] Hata:', error?.message || error, error?.stack);
    res.status(500).json({ message: 'Kayıt olurken hata oluştu', error: error?.message });
  }
});

// ─── POST /api/auth/resend-verification ───────────────────────────────────
// E-posta gönderimi başarısız olduysa veya kullanıcı maili bulamadıysa
router.post('/resend-verification', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
      return res.status(404).json({ message: 'Bu e-posta ile kayıtlı bir hesap bulunamadı.' });
    }
    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Bu hesap zaten onaylı. Doğrudan giriş yapabilirsiniz.' });
    }

    // Token yoksa (eski kayıt) yeni bir tane üret
    let token = user.emailVerificationToken;
    if (!token) {
      token = crypto.randomBytes(32).toString('hex');
      await db.update(users).set({ emailVerificationToken: token }).where(eq(users.id, user.id));
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const verifyUrl = `${baseUrl}/api/auth/verify-email/${token}`;
    await sendEmail(email, 'OptikSınav - E-posta Onayı', verificationEmailHtml(user.fullName, verifyUrl));

    res.json({ message: 'Onay e-postası tekrar gönderildi. Lütfen gelen kutunuzu (ve spam klasörünü) kontrol edin.' });
  } catch (error: any) {
    res.status(500).json({ message: 'E-posta gönderilirken hata oluştu', error: error.message });
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
        accountType: user.accountType,
        mainBranch: user.mainBranch,
        secondaryBranch: user.secondaryBranch,
        institutionLevels: user.institutionLevels,
      },
    });
  } catch (error: any) {
    console.error('[auth/login] Hata:', error?.message || error);
    console.error('[auth/login] Neden:', error?.cause?.message || error?.cause || 'yok');
    res.status(500).json({ message: 'Giriş yaparken hata oluştu', error: error?.cause?.message || error?.message });
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
      accountType: user.accountType,
      mainBranch: user.mainBranch,
      secondaryBranch: user.secondaryBranch,
      institutionLevels: user.institutionLevels,
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

// ─── GEÇİCİ TEŞHİS: users tablosundaki sütunları listeler (sorun çözülünce silinecek) ──
router.get('/_debug-columns', async (req: Request, res: Response) => {
  try {
    const result = await db.execute(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position`
    );
    res.json(result.rows || result);
  } catch (error: any) {
    res.status(500).json({ message: 'Sorgu hatası', error: error?.message });
  }
});

export default router;