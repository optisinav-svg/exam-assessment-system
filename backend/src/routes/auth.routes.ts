import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../index';
import { users } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

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

    // Kullanıcı oluştur
    const [newUser] = await db.insert(users).values({
      email,
      password: hashedPassword,
      fullName,
      role: role || 'teacher',
      createdAt: new Date(),
    }).returning();

    // Token oluştur
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Kayıt olurken hata oluştu', error });
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

export default router;