import { pgTable, serial, varchar, text, timestamp, integer, jsonb, boolean, primaryKey, doublePrecision, numeric } from 'drizzle-orm/pg-core';

// Puan Hesaplama Katsayıları (Yıllık)
export const scoreCoefficients = pgTable('score_coefficients', {
  id: serial('id').primaryKey(),
  examType: varchar('exam_type', { length: 20 }).notNull(), // 'TYT' | 'AYT' | 'LGS'
  year: integer('year').notNull(),
  subjectCode: varchar('subject_code', { length: 50 }).notNull(), // örn. 'turkce','matematik'
  average: numeric('average'),        // ham puan ortalaması
  stdDeviation: numeric('std_deviation'), // standart sapma
  coefficient: numeric('coefficient'),    // ağırlık katsayısı
  createdAt: timestamp('created_at').defaultNow(),
});

// Kullanıcılar (Öğretmenler)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  password: text('password').notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).default('teacher'),
  profileImage: text('profile_image'),
  isEmailVerified: boolean('is_email_verified').default(true), // mevcut hesaplar etkilenmesin diye varsayılan true; yeni kayıtlar kodda elle false yapılıyor
  emailVerificationToken: varchar('email_verification_token', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// Okullar
export const schools = pgTable('schools', {
  id: serial('id').primaryKey(),
  teacherId: integer('teacher_id').references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address'),
  phone: varchar('phone', { length: 20 }),
  joinCode: varchar('join_code', { length: 12 }).unique(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Sınıflar
export const classes = pgTable('classes', {
  id: serial('id').primaryKey(),
  schoolId: integer('school_id').references(() => schools.id),
  name: varchar('name', { length: 100 }).notNull(),
  gradeLevel: varchar('grade_level', { length: 50 }),
  academicYear: varchar('academic_year', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// Öğrenciler
export const students = pgTable('students', {
  id: serial('id').primaryKey(),
  studentNo: varchar('student_no', { length: 50 }),
  classId: integer('class_id').references(() => classes.id),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  parentPhone: varchar('parent_phone', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow(),
  isActive: boolean('is_active').default(true),
  // Öğrenci kendi hesabıyla kayıt olduğunda kullanılır
  email: varchar('email', { length: 255 }).unique(),
  password: text('password'),
  teacherId: integer('teacher_id').references(() => users.id), // bağlanmak istediği öğretmen
  isApproved: boolean('is_approved').default(false), // öğretmen onayı
  isEmailVerified: boolean('is_email_verified').default(false), // e-posta onayı
  emailVerificationToken: varchar('email_verification_token', { length: 255 }),
  profileImage: text('profile_image'),
  diplomaScore: doublePrecision('diploma_score'), // TYT/AYT puan hesaplamasında kullanılır
});

// Öğrenci Kayıt Geçmişi — bir öğrenci birden fazla öğretmen/sınıfa bağlı
// olabilir, sınıf değiştirdiğinde eski kayıt kapanır (endDate), yenisi açılır.
// students.classId / students.teacherId "şu anki / birincil" durumu tutar;
// bu tablo TAM GEÇMİŞİ tutar, hiçbir kayıt silinmez.
export const studentEnrollments = pgTable('student_enrollments', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').references(() => students.id).notNull(),
  classId: integer('class_id').references(() => classes.id).notNull(),
  teacherId: integer('teacher_id').references(() => users.id).notNull(),
  status: varchar('status', { length: 20 }).default('active'), // active | transferred | pending
  joinMethod: varchar('join_method', { length: 20 }), // roster | code | email_request
  startDate: timestamp('start_date').defaultNow(),
  endDate: timestamp('end_date'), // null = hâlâ aktif
});

// Optik Şablonlar
export const opticalTemplates = pgTable('optical_templates', {
  id: serial('id').primaryKey(),
  teacherId: integer('teacher_id').references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 10 }).notNull(), // '4_choice' veya '5_choice'
  fields: jsonb('fields').notNull(),
  previewImage: text('preview_image'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Dersler
export const subjects = pgTable('subjects', {
  id: serial('id').primaryKey(),
  teacherId: integer('teacher_id').references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }),
  description: text('description'),
  color: varchar('color', { length: 7 }).default('#3B82F6'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Kazanımlar
export const learningOutcomes = pgTable('learning_outcomes', {
  id: serial('id').primaryKey(),
  subjectId: integer('subject_id').references(() => subjects.id),
  code: varchar('code', { length: 50 }).notNull(),
  description: text('description').notNull(),
  gradeLevel: varchar('grade_level', { length: 50 }),
  category: varchar('category', { length: 100 }),
  bloomLevel: varchar('bloom_level', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// Sınavlar
export const exams = pgTable('exams', {
  id: serial('id').primaryKey(),
  teacherId: integer('teacher_id').references(() => users.id),
  subjectId: integer('subject_id').references(() => subjects.id),
  templateId: integer('template_id').references(() => opticalTemplates.id),
  title: varchar('title', { length: 255 }).notNull(),
  examDate: timestamp('exam_date').notNull(),
  duration: integer('duration'),
  totalQuestions: integer('total_questions').notNull(),
  correctAnswers: jsonb('correct_answers').notNull(),
  optionCount: integer('option_count').default(4), // 3, 4 veya 5 seçenekli
  negativeMarking: boolean('negative_marking').default(true), // yanlış doğruyu eksiltsin mi
  status: varchar('status', { length: 50 }).default('draft'),
  totalScore: integer('total_score').default(100), // sınavın tam puanı (tüm sorular doğru olursa)
  examType: varchar('exam_type', { length: 20 }), // 'TYT' | 'AYT' | 'LGS' | 'custom'
  // AYT sınavı, hangi TYT sınavının netleriyle birlikte puanlanacaksa onu gösterir.
  // (TYT ve AYT ayrı günlerde uygulanır; puan hesaplaması ikisinin netlerini birlikte kullanır.
  //  LGS için buna gerek yok: LGS zaten tek sınav içinde iki oturum/ders grubu olarak tanımlanıyor.)
  relatedExamId: integer('related_exam_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Sınav-Sınıf İlişkisi
export const examClasses = pgTable('exam_classes', {
  examId: integer('exam_id').references(() => exams.id),
  classId: integer('class_id').references(() => classes.id),
}, (t) => ({
  pk: primaryKey({ columns: [t.examId, t.classId] }),
}));

// Sonuçlar
export const results = pgTable('results', {
  id: serial('id').primaryKey(),
  examId: integer('exam_id').references(() => exams.id),
  studentId: integer('student_id').references(() => students.id), // zaman içi analiz için
  studentNo: varchar('student_no', { length: 50 }),
  answers: jsonb('answers').notNull(),
  score: integer('score'),
  net: doublePrecision('net'), // yanlış-doğru dengeli net puan
  correctCount: integer('correct_count'),
  wrongCount: integer('wrong_count'),
  emptyCount: integer('empty_count'),
  scannedImage: text('scanned_image'),
  processedAt: timestamp('processed_at').defaultNow(),
  status: varchar('status', { length: 50 }).default('pending'),
});

// Sınav Soruları — her sorunun hangi derse ve hangi kazanıma ait olduğunu
// tutar. Çok derslik sınavlarda (TYT/AYT/LGS gibi) her soru farklı derse
// ait olabilir; bu yüzden ders/kazanım bilgisi sınav (exams) seviyesinde
// değil, SORU seviyesinde tutuluyor.
export const examQuestions = pgTable('exam_questions', {
  id: serial('id').primaryKey(),
  examId: integer('exam_id').references(() => exams.id).notNull(),
  questionNumber: integer('question_number').notNull(),
  subjectId: integer('subject_id').references(() => subjects.id),
  learningOutcomeId: integer('learning_outcome_id').references(() => learningOutcomes.id),
  customOutcomeText: text('custom_outcome_text'), // öğretmen kendi yazdıysa (hazır listede yoksa)
  correctAnswer: varchar('correct_answer', { length: 1 }).notNull(),
});

// Soru Bazlı Öğrenci Cevapları — kazanım/ders bazlı analiz burada hesaplanır.
export const resultQuestionAnswers = pgTable('result_question_answers', {
  id: serial('id').primaryKey(),
  resultId: integer('result_id').references(() => results.id).notNull(),
  examQuestionId: integer('exam_question_id').references(() => examQuestions.id).notNull(),
  studentAnswer: varchar('student_answer', { length: 1 }), // null = boş bırakılmış
  isCorrect: boolean('is_correct'),
});
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  senderId: integer('sender_id').references(() => users.id),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  recipientRole: varchar('recipient_role', { length: 50 }).default('all'), // 'all', 'teacher', 'student'
  isSystemMessage: boolean('is_system_message').default(true),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Yüklenen Dosyalar (Bulut Depolama)
export const uploadedFiles = pgTable('uploaded_files', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileSize: integer('file_size').notNull(), // bytes
  filePath: text('file_path').notNull(),
  category: varchar('category', { length: 50 }), // 'import', 'exam_result', 'optical_template', 'report'
  examId: integer('exam_id').references(() => exams.id),
  isPublic: boolean('is_public').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// WhatsApp Mesaj Geçmişi
export const whatsappLogs = pgTable('whatsapp_logs', {
  id: serial('id').primaryKey(),
  senderId: integer('sender_id').references(() => users.id),
  recipientPhone: varchar('recipient_phone', { length: 20 }).notNull(),
  recipientName: varchar('recipient_name', { length: 255 }),
  message: text('message').notNull(),
  status: varchar('status', { length: 50 }).default('pending'), // 'pending', 'sent', 'failed', 'delivered'
  isBulkMessage: boolean('is_bulk_message').default(false),
  bulkGroupId: varchar('bulk_group_id', { length: 100 }),
  errorDetail: text('error_detail'),
  sentAt: timestamp('sent_at'),
  createdAt: timestamp('created_at').defaultNow(),
});
