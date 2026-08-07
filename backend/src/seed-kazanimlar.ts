import fs from 'fs';
import path from 'path';
import { db } from './index';
import { users, subjects, learningOutcomes } from '../../shared/schema';
import { eq, and, count } from 'drizzle-orm';

// Bir kereye mahsus, deploy sırasında otomatik çalışan kazanım aktarım script'i.
// Zaten aktarılmışsa (öğretmenin kazanım sayısı belirli bir eşiği geçmişse) tekrar çalışmaz.
const TEACHER_EMAIL = 'optisinav@gmail.com';
const CSV_PATH = path.join(__dirname, '../data/kazanimlar.csv');
const ALREADY_IMPORTED_THRESHOLD = 5000;

function parseCsvLine(line: string): string[] {
  // Basit CSV ayrıştırıcı (veri setinde tırnak/virgül içeren alan olmadığı doğrulandı)
  return line.split(',');
}

function normalizeGrade(sinif: string): string {
  if (sinif === '21' || sinif === '22') return 'Mezun';
  return sinif;
}

export async function seedKazanimlar() {
  try {
    const [teacher] = await db.select().from(users).where(eq(users.email, TEACHER_EMAIL));
    if (!teacher) {
      console.log('[seed-kazanimlar] Öğretmen bulunamadı, atlanıyor:', TEACHER_EMAIL);
      return;
    }

    const [existingCount] = await db
      .select({ n: count() })
      .from(learningOutcomes)
      .innerJoin(subjects, eq(learningOutcomes.subjectId, subjects.id))
      .where(eq(subjects.teacherId, teacher.id));

    if (existingCount && Number(existingCount.n) >= ALREADY_IMPORTED_THRESHOLD) {
      console.log('[seed-kazanimlar] Zaten aktarılmış, atlanıyor. Mevcut kayıt:', existingCount.n);
      return;
    }

    if (!fs.existsSync(CSV_PATH)) {
      console.log('[seed-kazanimlar] CSV dosyası bulunamadı:', CSV_PATH);
      return;
    }

    const raw = fs.readFileSync(CSV_PATH, 'utf-8');
    const lines = raw.split('\n').filter((l) => l.trim().length > 0);
    lines.shift(); // başlık satırını at

    // Dersleri grupla
    const subjectCache = new Map<string, number>(); // dersAdi -> subjectId
    let inserted = 0;
    let skipped = 0;

    const batch: { subjectName: string; grade: string; code: string; text: string }[] = [];
    for (const line of lines) {
      const cols = parseCsvLine(line);
      if (cols.length < 4) {
        skipped++;
        continue;
      }
      const [dersAdi, sinif, kod, ...rest] = cols;
      const metin = rest.join(','); // olası virgülleri geri birleştir (güvenlik payı)
      if (!dersAdi || !kod || !metin) {
        skipped++;
        continue;
      }
      batch.push({ subjectName: dersAdi.trim(), grade: sinif.trim(), code: kod.trim(), text: metin.trim() });
    }

    console.log(`[seed-kazanimlar] ${batch.length} kayıt işlenecek, ${skipped} satır atlandı.`);

    // Önce tüm dersleri oluştur (varsa mevcut olanı kullan)
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
    console.log(`[seed-kazanimlar] ${subjectCache.size} ders hazır.`);

    // Kazanımları toplu (chunk'lar hâlinde) ekle
    const CHUNK_SIZE = 500;
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

    console.log(`[seed-kazanimlar] Tamamlandı. ${inserted} kazanım eklendi.`);
  } catch (error: any) {
    console.error('[seed-kazanimlar] Hata:', error.message);
    // Hata olsa bile sunucunun başlamasını engellemiyoruz
  }
}
