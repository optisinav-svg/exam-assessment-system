import { Router, Request, Response } from 'express';
import { db } from '../index';
import { users, exams, results, messages, students } from '../../../shared/schema';
import { eq, desc, count, sql } from 'drizzle-orm';

const router = Router();

/**
 * Admin yetkilendirme middleware
 * Kullanıcı role === 'admin' ise devam et, değilse 403 döndür
 */
function adminRequired(req: Request, res: Response, next: any) {
  const user = (req as any).user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Bu işlem için admin yetkisi gereklidir.' });
  }
  next();
}

/**
 * GET /api/admin/users
 * Tüm kullanıcıları listele (isim, e-posta, kayıt tarihi, rol)
 */
router.get('/users', adminRequired, async (req: Request, res: Response) => {
  try {
    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

    res.json({
      total: allUsers.length,
      users: allUsers,
    });
  } catch (error: any) {
    console.error('Admin users error:', error);
    res.status(500).json({ message: 'Kullanıcılar getirilirken hata oluştu', error: error.message });
  }
});

/**
 * GET /api/admin/stats
 * Sistem geneli özet istatistikler
 */
router.get('/stats', adminRequired, async (req: Request, res: Response) => {
  try {
    const totalUsers = await db.select({ count: sql<number>`count(*)` }).from(users);
    const totalTeachers = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, 'teacher'));
    const totalAdmins = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, 'admin'));
    const totalExams = await db.select({ count: sql<number>`count(*)` }).from(exams);
    const totalResults = await db.select({ count: sql<number>`count(*)` }).from(results);
    const totalStudents = await db.select({ count: sql<number>`count(*)` }).from(students);

    // Son 7 günde eklenen kullanıcılar
    const recentUsers = await db.select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(sql`${users.createdAt} >= NOW() - INTERVAL '7 days'`)
    .orderBy(desc(users.createdAt))
    .limit(10);

    // Son 7 günde eklenen sınavlar
    const recentExams = await db.select({
      id: exams.id,
      title: exams.title,
      examDate: exams.examDate,
      createdAt: exams.createdAt,
    })
    .from(exams)
    .where(sql`${exams.createdAt} >= NOW() - INTERVAL '7 days'`)
    .orderBy(desc(exams.createdAt))
    .limit(10);

    // Sonuç dağılımı
    const resultStatusCounts = await db.select({
      status: results.status,
      count: sql<number>`count(*)`,
    })
    .from(results)
    .groupBy(results.status);

    res.json({
      totals: {
        users: totalUsers[0]?.count || 0,
        teachers: totalTeachers[0]?.count || 0,
        admins: totalAdmins[0]?.count || 0,
        exams: totalExams[0]?.count || 0,
        results: totalResults[0]?.count || 0,
        students: totalStudents[0]?.count || 0,
      },
      recentUsers,
      recentExams,
      resultStatusCounts,
    });
  } catch (error: any) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'İstatistikler getirilirken hata oluştu', error: error.message });
  }
});

/**
 * POST /api/admin/messages
 * Sistem mesajı oluştur (tüm kullanıcılara veya belirli role)
 */
router.post('/messages', adminRequired, async (req: Request, res: Response) => {
  try {
    const senderId = (req as any).user?.id;
    const { title, content, recipientRole } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'title ve content alanları gereklidir.' });
    }

    const validRoles = ['all', 'teacher', 'student', 'admin'];
    const role = recipientRole || 'all';
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: `recipientRole şunlardan biri olmalıdır: ${validRoles.join(', ')}` });
    }

    const [newMessage] = await db.insert(messages).values({
      senderId,
      title,
      content,
      recipientRole: role,
      isSystemMessage: true,
      isRead: false,
      createdAt: new Date(),
    }).returning();

    res.status(201).json({
      message: 'Mesaj başarıyla gönderildi',
      data: newMessage,
    });
  } catch (error: any) {
    console.error('Admin message error:', error);
    res.status(500).json({ message: 'Mesaj gönderilirken hata oluştu', error: error.message });
  }
});

/**
 * GET /api/admin/messages
 * Tüm sistem mesajlarını listele
 */
router.get('/messages', adminRequired, async (req: Request, res: Response) => {
  try {
    const allMessages = await db.select()
      .from(messages)
      .orderBy(desc(messages.createdAt));

    res.json({
      total: allMessages.length,
      messages: allMessages,
    });
  } catch (error: any) {
    console.error('Admin messages error:', error);
    res.status(500).json({ message: 'Mesajlar getirilirken hata oluştu', error: error.message });
  }
});

export default router;
