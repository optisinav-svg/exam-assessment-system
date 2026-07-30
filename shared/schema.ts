import { pgTable, serial, varchar, text, timestamp, integer, jsonb, boolean, primaryKey, doublePrecision } from 'drizzle-orm/pg-core';

// Kullanıcılar (Öğretmenler)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  password: text('password').notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).default('teacher'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Okullar
export const schools = pgTable('schools', {
  id: serial('id').primaryKey(),
  teacherId: integer('teacher_id').references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address'),
  phone: varchar('phone', { length: 20 }),
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
  studentNo: varchar('student_no', { length: 50 }).notNull(),
  classId: integer('class_id').references(() => classes.id),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  parentPhone: varchar('parent_phone', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow(),
  isActive: boolean('is_active').default(true),
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
