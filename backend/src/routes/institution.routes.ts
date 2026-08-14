import express from 'express';
import { eq, and, sql } from 'drizzle-orm';
import { institutionMembers, users, students, exams } from '../../../shared/schema';
import { db } from '../index';

const router = express.Router();

// Kurum kontrolü için yardımcı middleware veya kontrol fonksiyonu
async function verifyInstitution(req: any, res: express.Response, next: express.NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Kimlik doğrulama gerekli' });
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user || user.accountType !== 'kurum') {
      return res.status(403).json({ message: 'Bu işlem yalnızca Kurum hesapları tarafından yapılabilir' });
    }

    req.institutionUser = user;
    next();
  } catch (error) {
    console.error('Kurum doğrulama hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
}

// GET /api/institution/members — Kurum hesabına bağlı tüm öğretmen ve öğrencileri listele
router.get('/members', verifyInstitution, async (req: any, res: express.Response) => {
  try {
    const institutionId = req.institutionUser.id;

    const members = await db
      .select()
      .from(institutionMembers)
      .where(eq(institutionMembers.institutionUserId, institutionId))
      .orderBy(institutionMembers.joinedAt);

    // Üye detaylarını zenginleştir
    const detailedMembers = await Promise.all(
      members.map(async (m) => {
        let memberDetails = null;
        if (m.memberUserId) {
          const [teacher] = await db
            .select({
              id: users.id,
              fullName: users.fullName,
              email: users.email,
              mainBranch: users.mainBranch,
              accountType: users.accountType,
            })
            .from(users)
            .where(eq(users.id, m.memberUserId));
          memberDetails = teacher;
        } else if (m.memberStudentId) {
          const [student] = await db
            .select({
              id: students.id,
              firstName: students.firstName,
              lastName: students.lastName,
              email: students.email,
              studentNo: students.studentNo,
            })
            .from(students)
            .where(eq(students.id, m.memberStudentId));
          memberDetails = student;
        }

        return {
          ...m,
          details: memberDetails,
        };
      })
    );

    res.json({
      success: true,
      members: detailedMembers,
      total: detailedMembers.length,
    });
  } catch (error) {
    console.error('Kurum üyeleri listelenirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// POST /api/institution/invite — Öğretmen veya öğrenciyi kuruma davet et / ekle
router.post('/invite', verifyInstitution, async (req: any, res: express.Response) => {
  try {
    const institutionId = req.institutionUser.id;
    const { email, role } = req.body; // role: 'teacher' | 'student'

    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'E-posta adresi zorunludur' });
    }

    if (!role || !['teacher', 'student'].includes(role)) {
      return res.status(400).json({ message: "Geçersiz rol. 'teacher' veya 'student' olmalıdır." });
    }

    const targetEmail = email.trim().toLowerCase();

    let memberUserId: number | null = null;
    let memberStudentId: number | null = null;
    let status = 'pending';

    if (role === 'teacher') {
      const [existingTeacher] = await db.select().from(users).where(eq(users.email, targetEmail));
      if (existingTeacher) {
        memberUserId = existingTeacher.id;
        status = 'active'; // Sistemde kayıtlıysa doğrudan aktif
      }
    } else {
      const [existingStudent] = await db.select().from(students).where(eq(students.email, targetEmail));
      if (existingStudent) {
        memberStudentId = existingStudent.id;
        status = 'active';
      }
    }

    // Daha önce eklenmiş mi kontrol et
    const existingMembership = await db
      .select()
      .from(institutionMembers)
      .where(
        and(
          eq(institutionMembers.institutionUserId, institutionId),
          eq(institutionMembers.email, targetEmail)
        )
      );

    if (existingMembership.length > 0) {
      return res.status(400).json({ message: 'Bu e-posta adresi zaten kurum üyeleri arasında kayıtlı.' });
    }

    const [newMember] = await db
      .insert(institutionMembers)
      .values({
        institutionUserId: institutionId,
        memberUserId,
        memberStudentId,
        role,
        status,
        email: targetEmail,
      })
      .returning();

    res.status(201).json({
      success: true,
      message: status === 'active' ? 'Üye başarıyla kuruma eklendi.' : 'Davet başarıyla gönderildi (beklemede).',
      member: newMember,
    });
  } catch (error) {
    console.error('Kurum davet hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// GET /api/institution/stats — Kurum özet istatistikleri (öğretmen sayısı, öğrenci sayısı, toplam sınav sayısı)
router.get('/stats', verifyInstitution, async (req: any, res: express.Response) => {
  try {
    const institutionId = req.institutionUser.id;

    const members = await db
      .select()
      .from(institutionMembers)
      .where(eq(institutionMembers.institutionUserId, institutionId));

    const teacherCount = members.filter((m) => m.role === 'teacher').length;
    const studentCount = members.filter((m) => m.role === 'student').length;

    // Kurumun kendisinin ve bağlı öğretmenlerin oluşturduğu sınavları say
    const teacherUserIds = members
      .filter((m) => m.memberUserId !== null)
      .map((m) => m.memberUserId as number);
    teacherUserIds.push(institutionId);

    let totalExams = 0;
    if (teacherUserIds.length > 0) {
      const institutionExams = await db
        .select({ id: exams.id })
        .from(exams)
        .where(sql`${exams.teacherId} = ANY(${teacherUserIds})`);
      totalExams = institutionExams.length;
    }

    res.json({
      success: true,
      stats: {
        teacherCount,
        studentCount,
        totalExams,
        totalMembers: members.length,
      },
    });
  } catch (error) {
    console.error('Kurum istatistikleri alınırken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

export default router;
