// Sistem Mesajları (Admin tarafından gönderilen)
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
