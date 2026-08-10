import fs from 'fs';
import path from 'path';
import { db } from './index';
import { users, subjects, learningOutcomes } from '../../shared/schema';
import { eq, and, count } from 'drizzle-orm';

// Bir kereye mahsus, deploy sırasında otomatik çalışan kazanım aktarım script'i.
// Belirli tek bir öğretmene değil, sistemde kayıtlı TÜM öğretmenlere kazanım
// aktarır (her biri kendi ders listesine sahip olacağı için, henüz kazanımı
// olmayan her öğretmen için ayrı ayrı çalışır).
const CSV_PATH = path.join(__dirname, '../data/kazanimlar.csv');
const ALREADY_IMPORTED_THRESHOLD = 5000;

function parseCsvLine(line: string): string[] {
  return line.split(',');
}

function normalizeGrade(sinif: string): string {
  if (sinif === '21' || sinif === '22') return 'Mezun';
  return sinif;
}

export async function seedKazanimlar() {
  try {
    const allTeachers = await db.select().from(users).where(eq(users.role, 'teacher'));
    if (allTeachers.length === 0) {
      console.log('[seed-kazanimlar] Sistemde kayıtlı öğretmen yok, atlanıyor.');
      return;
    }

    if (!fs.existsSync(CSV_PATH)) {
      console.log('[seed-kazanimlar] CSV dosyası bulunamadı:', CSV_PATH);
      return;
    }

    const raw = fs.readFileSync(CSV_PATH, 'utf-8');
    const lines = raw.split('\n').filter((l) => l.trim().length > 0);
    lines.shift(); // başlık satırını at

    const batch: { subjectName: string; grade: string; code: string; text: string }[] = [];
    for (const line of lines) {
      const cols = parseCsvLine(line);
      if (cols.length < 4) continue;
      const [dersAdi, sinif, kod, ...rest] = cols;
      const metin = rest.join(',');
      if (!dersAdi || !kod || !metin) continue;
      batch.push({ subjectName: dersAdi.trim(), grade: sinif.trim(), code: kod.trim(), text: metin.trim() });
    }

    for (const teacher of allTeachers) {
      const [existingCount] = await db
        .select({ n: count() })
        .from(learningOutcomes)
        .innerJoin(subjects, eq(learningOutcomes.subjectId, subjects.id))
        .where(eq(subjects.teacherId, teacher.id));

      if (existingCount && Number(existingCount.n) >= ALREADY_IMPORTED_THRESHOLD) {
        console.log(`[seed-kazanimlar] ${teacher.email} için zaten aktarılmış, atlanıyor.`);
        continue;
      }

      const subjectCache = new Map<string, number>();
      const uniqueSubjectNames = Array.from(new Set(batch.map((b) => b.subjectName)));
      for (const name of uniqueSubjectNames) {
        const [existing] = await db
          .select()
          .from(subjects)
          .where(and(eq(subjects.teacherId, teacher.id), eq(subjects.name, name)));
        if (existing) {
          subjectCache.set(name, existing.id);
        } else {
          const [created] = await db
            .insert(subjects)
            .values({ teacherId: teacher.id, name })
            .returning();
          subjectCache.set(name, created.id);
        }
      }

      const CHUNK_SIZE = 500;
      let inserted = 0;
      for (let i = 0; i < batch.length; i += CHUNK_SIZE) {
        const chunk = batch.slice(i, i + CHUNK_SIZE);
        const values = chunk.map((b) => ({
          subjectId: subjectCache.get(b.subjectName)!,
          code: b.code,
          description: b.text,
          gradeLevel: normalizeGrade(b.grade),
        }));
        await db.insert(learningOutcomes).values(values);
        inserted += values.length;
      }

      console.log(`[seed-kazanimlar] ${teacher.email} için ${inserted} kazanım eklendi.`);
    }
  } catch (error: any) {
    console.error('[seed-kazanimlar] Hata:', error.message);
    // Hata olsa bile sunucunun başlamasını engellemiyoruz
  }
}
