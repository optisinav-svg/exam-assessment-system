import { Router, Request, Response } from 'express';
import { db } from '../index';
import { whatsappLogs, students } from '../../../shared/schema';
import { eq, desc, sql, inArray } from 'drizzle-orm';
import crypto from 'crypto';

const router = Router();

// ─── Twilio WhatsApp Helper ──────────────────────────────────────────────────

function isTwilioConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_NUMBER
  );
}

/**
 * Twilio WhatsApp API ile mesaj gönder
 * API key yoksa test modunda çalış (veritabanına kaydet + konsol)
 */
async function sendWhatsAppMessage(
  toPhone: string,
  messageText: string
): Promise<{ success: boolean; sid?: string; error?: string }> {
  if (!isTwilioConfigured()) {
    // Test modu - gerçek gönderim yok
    console.log(`[WhatsApp TEST] To: ${toPhone}, Message: ${messageText.substring(0, 50)}...`);
    return { success: true, sid: `test_${crypto.randomBytes(8).toString('hex')}` };
  }

  try {
    // Twilio REST API ile mesaj gönder
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER; // whatsapp:+14155238886 formatında

    // Telefon numarasını WhatsApp formatına çevir
    const toNumber = toPhone.startsWith('whatsapp:') ? toPhone : `whatsapp:${toPhone}`;

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          From: fromNumber,
          To: toNumber,
          Body: messageText,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || `Twilio API error: ${response.status}`,
      };
    }

    return { success: true, sid: data.sid };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Twilio bağlantı hatası',
    };
  }
}

// ─── POST /api/whatsapp/send ─────────────────────────────────────────────────
// Tek bir kişiye mesaj gönder
router.post('/send', async (req: Request, res: Response) => {
  try {
    const senderId = (req as any).user?.id;
    const { phone, recipientName, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ message: 'phone ve message alanları gereklidir.' });
    }

    // Telefon numarası kontrolü (basit doğrulama)
    const phoneRegex = /^\+?[\d\s\-\(\)]{7,20}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: 'Geçersiz telefon numarası formatı.' });
    }

    // Mesaj uzunluğu kontrolü (WhatsApp 1000 karakter limit)
    if (message.length > 1000) {
      return res.status(400).json({ message: 'Mesaj en fazla 1000 karakter olabilir.' });
    }

    // Mesaj gönder
    const result = await sendWhatsAppMessage(phone, message);

    // Veritabanına kaydet
    const [log] = await db.insert(whatsappLogs).values({
      senderId,
      recipientPhone: phone,
      recipientName: recipientName || null,
      message,
      status: result.success ? 'sent' : 'failed',
      isBulkMessage: false,
      sentAt: result.success ? new Date() : null,
      errorDetail: result.error || null,
      createdAt: new Date(),
    }).returning();

    res.status(result.success ? 201 : 200).json({
      message: result.success ? 'Mesaj başarıyla gönderildi' : 'Mesaj kaydedildi ama gönderilemedi',
      data: log,
      sid: result.sid,
      testMode: !isTwilioConfigured(),
    });
  } catch (error: any) {
    console.error('WhatsApp send error:', error);
    res.status(500).json({ message: 'Mesaj gönderilirken hata oluştu', error: error.message });
  }
});

// ─── POST /api/whatsapp/send-bulk ────────────────────────────────────────────
// Birden fazla kişiye toplu mesaj gönder
router.post('/send-bulk', async (req: Request, res: Response) => {
  try {
    const senderId = (req as any).user?.id;
    const { recipients, message, includeStudentName } = req.body;

    // recipients: [{ phone: '+905551234567', name: 'Ahmet Velisi', studentNo?: '1001' }]
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ message: 'recipients alanı boş bir dizi olamaz.' });
    }

    if (!message) {
      return res.status(400).json({ message: 'message alanı gereklidir.' });
    }

    if (recipients.length > 50) {
      return res.status(400).json({ message: 'Tek seferde en fazla 50 kişiye mesaj gönderebilirsiniz.' });
    }

    // Toplu gönderim ID oluştur
    const bulkGroupId = `bulk_${crypto.randomBytes(8).toString('hex')}`;

    // Tüm alıcıları veritabanına kaydet (önce status: pending)
    const logEntries = await Promise.all(
      recipients.map((r: any) =>
        db.insert(whatsappLogs).values({
          senderId,
          recipientPhone: r.phone,
          recipientName: r.name || null,
          message,
          status: 'pending',
          isBulkMessage: true,
          bulkGroupId,
          createdAt: new Date(),
        }).returning()
      )
    );

    // Sıra ile mesaj gönder (Twilio rate limit'ine takılmamak için arada bekleme)
    const results = [];
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      const logId = logEntries[i][0].id;

      // Mesajı kişiselleştir (isim varsa)
      let personalizedMessage = message;
      if (includeStudentName && recipient.name) {
        personalizedMessage = message.replace(/\{isim\}/g, recipient.name);
        personalizedMessage = message.replace(/\{adi\}/g, recipient.name);
      }

      // Gönder
      const result = await sendWhatsAppMessage(recipient.phone, personalizedMessage);

      // Durumu güncelle
      await db.update(whatsappLogs)
        .set({
          status: result.success ? 'sent' : 'failed',
          sentAt: result.success ? new Date() : null,
          errorDetail: result.error || null,
        })
        .where(eq(whatsappLogs.id, logId));

      results.push({
        phone: recipient.phone,
        name: recipient.name,
        success: result.success,
        sid: result.sid,
      });

      // Rate limit: her mesaj arası 500ms bekle
      if (i < recipients.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Özet
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    res.status(201).json({
      message: `Toplu mesaj gönderimi tamamlandı: ${successCount} başarılı, ${failedCount} başarısız`,
      bulkGroupId,
      total: recipients.length,
      successCount,
      failedCount,
      results,
      testMode: !isTwilioConfigured(),
    });
  } catch (error: any) {
    console.error('WhatsApp bulk send error:', error);
    res.status(500).json({ message: 'Toplu mesaj gönderilirken hata oluştu', error: error.message });
  }
});

// ─── GET /api/whatsapp/send-class ────────────────────────────────────────────
// Bir sınıfın tüm velilerine mesaj gönder (öğrenci veritabanından telefonları çek)
router.post('/send-class', async (req: Request, res: Response) => {
  try {
    const senderId = (req as any).user?.id;
    const { classId, message } = req.body;

    if (!classId || !message) {
      return res.status(400).json({ message: 'classId ve message alanları gereklidir.' });
    }

    // Sınıfın öğrencilerini bul
    const classStudents = await db.select({
      id: students.id,
      studentNo: students.studentNo,
      firstName: students.firstName,
      lastName: students.lastName,
      parentPhone: students.parentPhone,
    })
    .from(students)
    .where(eq(students.classId, classId))
    .where(sql`${students.parentPhone} IS NOT NULL AND ${students.parentPhone} != ''`);

    if (classStudents.length === 0) {
      return res.status(404).json({ message: 'Bu sınıfta telefon numarası olan öğrenci bulunamadı.' });
    }

    // recipients formatına çevir
    const recipients = classStudents.map(s => ({
      phone: s.parentPhone,
      name: `${s.firstName} ${s.lastName} (No: ${s.studentNo})`,
      studentNo: s.studentNo,
    }));

    // Toplu gönderim ID
    const bulkGroupId = `class_${classId}_${crypto.randomBytes(4).toString('hex')}`;

    // Kayıtları oluştur
    const logEntries = await Promise.all(
      recipients.map(r =>
        db.insert(whatsappLogs).values({
          senderId,
          recipientPhone: r.phone,
          recipientName: r.name,
          message,
          status: 'pending',
          isBulkMessage: true,
          bulkGroupId,
          createdAt: new Date(),
        }).returning()
      )
    );

    // Sıra ile gönder
    const results = [];
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      const logId = logEntries[i][0].id;

      const personalizedMessage = message
        .replace(/\{öğrenci\}/g, recipient.name)
        .replace(/\{no\}/g, recipient.studentNo);

      const result = await sendWhatsAppMessage(recipient.phone, personalizedMessage);

      await db.update(whatsappLogs)
        .set({
          status: result.success ? 'sent' : 'failed',
          sentAt: result.success ? new Date() : null,
          errorDetail: result.error || null,
        })
        .where(eq(whatsappLogs.id, logId));

      results.push({ phone: recipient.phone, name: recipient.name, success: result.success });

      if (i < recipients.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    const successCount = results.filter(r => r.success).length;

    res.status(201).json({
      message: `Sınıf mesajı gönderildi: ${successCount}/${recipients.length} başarılı`,
      bulkGroupId,
      total: recipients.length,
      successCount,
      failedCount: recipients.length - successCount,
      testMode: !isTwilioConfigured(),
    });
  } catch (error: any) {
    console.error('WhatsApp class send error:', error);
    res.status(500).json({ message: 'Sınıf mesajı gönderilirken hata oluştu', error: error.message });
  }
});

// ─── GET /api/whatsapp/logs ──────────────────────────────────────────────────
// Gönderilen mesajların geçmişini listele
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const status = req.query.status as string;
    const bulkGroupId = req.query.bulkGroupId as string;

    let query = db
      .select({
        id: whatsappLogs.id,
        recipientPhone: whatsappLogs.recipientPhone,
        recipientName: whatsappLogs.recipientName,
        message: whatsappLogs.message,
        status: whatsappLogs.status,
        isBulkMessage: whatsappLogs.isBulkMessage,
        bulkGroupId: whatsappLogs.bulkGroupId,
        sentAt: whatsappLogs.sentAt,
        errorDetail: whatsappLogs.errorDetail,
        createdAt: whatsappLogs.createdAt,
      })
      .from(whatsappLogs)
      .orderBy(desc(whatsappLogs.createdAt));

    if (status) {
      const filteredLogs = await db
        .select({
          id: whatsappLogs.id,
          recipientPhone: whatsappLogs.recipientPhone,
          recipientName: whatsappLogs.recipientName,
          message: whatsappLogs.message,
          status: whatsappLogs.status,
          isBulkMessage: whatsappLogs.isBulkMessage,
          bulkGroupId: whatsappLogs.bulkGroupId,
          sentAt: whatsappLogs.sentAt,
          errorDetail: whatsappLogs.errorDetail,
          createdAt: whatsappLogs.createdAt,
        })
        .from(whatsappLogs)
        .where(eq(whatsappLogs.status, status))
        .orderBy(desc(whatsappLogs.createdAt))
        .limit(limit);
      return res.json({ total: filteredLogs.length, logs: filteredLogs });
    }

    if (bulkGroupId) {
      const groupLogs = await db
        .select({
          id: whatsappLogs.id,
          recipientPhone: whatsappLogs.recipientPhone,
          recipientName: whatsappLogs.recipientName,
          message: whatsappLogs.message,
          status: whatsappLogs.status,
          isBulkMessage: whatsappLogs.isBulkMessage,
          bulkGroupId: whatsappLogs.bulkGroupId,
          sentAt: whatsappLogs.sentAt,
          errorDetail: whatsappLogs.errorDetail,
          createdAt: whatsappLogs.createdAt,
        })
        .from(whatsappLogs)
        .where(eq(whatsappLogs.bulkGroupId, bulkGroupId))
        .orderBy(desc(whatsappLogs.createdAt));
      return res.json({ total: groupLogs.length, logs: groupLogs });
    }

    const logs = await query.limit(limit);
    res.json({ total: logs.length, logs });
  } catch (error: any) {
    console.error('WhatsApp logs error:', error);
    res.status(500).json({ message: 'Loglar getirilirken hata oluştu', error: error.message });
  }
});

// ─── GET /api/whatsapp/stats ─────────────────────────────────────────────────
// WhatsApp gönderim istatistikleri
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const totalMessages = await db.select({ count: sql<number>`count(*)` }).from(whatsappLogs);

    const byStatus = await db.select({
      status: whatsappLogs.status,
      count: sql<number>`count(*)`,
    })
    .from(whatsappLogs)
    .groupBy(whatsappLogs.status);

    const bulkMessages = await db.select({ count: sql<number>`count(*)` }).from(whatsappLogs)
      .where(sql`${whatsappLogs.isBulkMessage} = true`);

    const singleMessages = await db.select({ count: sql<number>`count(*)` }).from(whatsappLogs)
      .where(sql`${whatsappLogs.isBulkMessage} = false`);

    res.json({
      totalMessages: totalMessages[0]?.count || 0,
      bulkMessages: bulkMessages[0]?.count || 0,
      singleMessages: singleMessages[0]?.count || 0,
      byStatus,
      testMode: !isTwilioConfigured(),
    });
  } catch (error: any) {
    console.error('WhatsApp stats error:', error);
    res.status(500).json({ message: 'İstatistikler getirilirken hata oluştu', error: error.message });
  }
});

export default router;
