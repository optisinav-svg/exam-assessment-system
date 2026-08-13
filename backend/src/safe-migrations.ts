import { db } from './index';
import { sql } from 'drizzle-orm';

/**
 * drizzle-kit push, VAR OLAN tablolara sütun eklerken (ALTER TABLE ADD COLUMN)
 * bazen etkileşimli bir onay bekleyip niyetlense de sessizce atlıyor. Bu script,
 * bunun yerine düz, kesin ve GÜVENLİ (IF NOT EXISTS) SQL komutlarıyla, her deploy'da
 * çalışıp eksik olan sütun/tabloyu tamamlıyor. Zaten varsa hiçbir şey yapmaz.
 */
export async function runSafeMigrations() {
  const statements = [
    // users
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_email_verified" boolean DEFAULT true`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verification_token" varchar(255)`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "account_type" varchar(20) DEFAULT 'teacher'`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "main_branch" varchar(100)`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "secondary_branch" varchar(100)`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "institution_levels" text`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profile_image" text`,

    // students
    `ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "profile_image" text`,
    `ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "diploma_score" double precision`,

    // schools
    `ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "join_code" varchar(12)`,

    // student_enrollments
    `ALTER TABLE "student_enrollments" ADD COLUMN IF NOT EXISTS "institution_student_no" varchar(50)`,

    // exams
    `ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "exam_type" varchar(20)`,
    `ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "related_exam_id" integer`,
    `ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "total_score" integer DEFAULT 100`,

    // results
    `ALTER TABLE "results" ADD COLUMN IF NOT EXISTS "student_id" integer`,
  ];

  for (const statement of statements) {
    try {
      await db.execute(sql.raw(statement));
    } catch (error: any) {
      console.error('[safe-migrations] Satır başarısız:', statement, '-', error?.message);
      // Bir satır başarısız olsa bile diğerlerini denemeye devam et, sunucuyu durdurma
    }
  }

  console.log(`[safe-migrations] ${statements.length} kontrol tamamlandı.`);
}
