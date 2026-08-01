import nodemailer from 'nodemailer';

/**
 * Gmail SMTP üzerinden e-posta gönderimi.
 *
 * Gerekli ortam değişkenleri (.env):
 *   GMAIL_USER=ornek@gmail.com
 *   GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx   (Google hesabında oluşturulan "Uygulama Şifresi")
 *
 * Bu değişkenler tanımlı değilse, gerçek gönderim yapılmaz;
 * bunun yerine e-posta içeriği konsola yazdırılır (test modu).
 */

function isEmailConfigured(): boolean {
  return !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!isEmailConfigured()) {
    console.log(`[E-POSTA TEST MODU] Alıcı: ${to}`);
    console.log(`[E-POSTA TEST MODU] Konu: ${subject}`);
    console.log(`[E-POSTA TEST MODU] İçerik:\n${html}`);
    return;
  }

  await getTransporter().sendMail({
    from: `"OptikSınav" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

export function isMailerConfigured() {
  return isEmailConfigured();
}

// ─── Hazır e-posta şablonları ────────────────────────────────────────────────

export function verificationEmailHtml(fullName: string, verifyUrl: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #4A6CF7;">OptikSınav - E-posta Onayı</h2>
      <p>Merhaba ${fullName},</p>
      <p>OptikSınav sistemine kayıt olduğunuz için teşekkürler. Kaydınızı tamamlamak için lütfen aşağıdaki bağlantıya tıklayın:</p>
      <p style="margin: 24px 0;">
        <a href="${verifyUrl}" style="background: #4A6CF7; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
          E-postamı Onayla
        </a>
      </p>
      <p>E-postanızı onayladıktan sonra, öğretmeninizin hesabınızı onaylamasını beklemeniz gerekecek.</p>
      <p style="color: #888; font-size: 12px;">Bu bağlantıyı siz istemediyseniz bu e-postayı yok sayabilirsiniz.</p>
    </div>
  `;
}

export function teacherNewRequestEmailHtml(teacherName: string, studentName: string, studentEmail: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #4A6CF7;">OptikSınav - Yeni Öğrenci Kayıt İsteği</h2>
      <p>Merhaba ${teacherName},</p>
      <p><strong>${studentName}</strong> (${studentEmail}) adlı bir öğrenci, sizin öğretmeniniz olarak sisteme kayıt olmak istiyor.</p>
      <p>Bu isteği onaylamak veya reddetmek için uygulamadaki "Bekleyen Öğrenci İstekleri" ekranını kullanabilirsiniz.</p>
    </div>
  `;
}

export function studentApprovedEmailHtml(studentName: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #4A6CF7;">OptikSınav - Hesabınız Onaylandı</h2>
      <p>Merhaba ${studentName},</p>
      <p>Öğretmeniniz kayıt isteğinizi onayladı. Artık uygulamaya giriş yapabilir, sınav sonuçlarınızı görüntüleyebilirsiniz.</p>
    </div>
  `;
}
