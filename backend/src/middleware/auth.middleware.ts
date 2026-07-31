import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthUser {
  id: number;
  email: string;
  role: string;
}

// Express'in Request tipine "user" alanını ekliyoruz
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * İstekteki "Authorization: Bearer <token>" başlığını doğrular.
 * Geçerliyse req.user'ı doldurur, değilse 401 döner.
 */
export function verifyToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Yetkilendirme gerekli, lütfen giriş yapın' });
  }

  const token = authHeader.slice('Bearer '.length);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthUser;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Oturum geçersiz veya süresi dolmuş, lütfen tekrar giriş yapın' });
  }
}
