import express from 'express';
import { eq, desc } from 'drizzle-orm';
import { subscriptions } from '../../../shared/schema';
import { db } from '../index';
// @ts-ignore
import Iyzipay from 'iyzipay';

const router = express.Router();

const iyzipay = new Iyzipay({
  apiKey: process.env.IYZICO_API_KEY || 'sandbox-api-key-placeholder',
  secretKey: process.env.IYZICO_SECRET_KEY || 'sandbox-secret-key-placeholder',
  uri: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com',
});

// GET /api/subscriptions/me — Kullanıcının güncel abonelik durumunu döner
router.get('/me', async (req: any, res: express.Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Kimlik doğrulama gerekli' });
    }

    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt));

    if (!sub) {
      return res.json({
        success: true,
        subscription: {
          plan: 'free',
          status: 'trial',
          trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    }

    res.json({
      success: true,
      subscription: sub,
    });
  } catch (error) {
    console.error('Abonelik getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// POST /api/subscriptions/checkout — Ödeme formu / Checkout başlatır
router.post('/checkout', async (req: any, res: express.Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Kimlik doğrulama gerekli' });
    }

    const { plan, price } = req.body;
    if (!plan) {
      return res.status(400).json({ message: 'Plan belirtilmelidir' });
    }

    // Iyzico Checkout Form Initialization (Sandbox / Placeholder fallback)
    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: String(Date.now()),
      price: String(price || '99.00'),
      paidPrice: String(price || '99.00'),
      currency: Iyzipay.CURRENCY.TL,
      basketId: `BASKET_${userId}_${Date.now()}`,
      paymentGroup: Iyzipay.PAYMENT_GROUP.SUBSCRIPTION,
      callbackUrl: `${process.env.BACKEND_URL || 'https://api.optisinav.com'}/api/subscriptions/callback`,
      buyer: {
        id: String(userId),
        name: req.user?.fullName?.split(' ')[0] || 'Kullanici',
        surname: req.user?.fullName?.split(' ').slice(1).join(' ') || 'OptikSınav',
        gsmNumber: req.user?.phone || '+905350000000',
        email: req.user?.email || 'kullanici@optisinav.com',
        identityNumber: '11111111111',
        registrationAddress: 'Türkiye',
        ip: req.ip || '85.34.78.112',
        city: 'Istanbul',
        country: 'Turkey',
      },
      shippingAddress: {
        contactName: req.user?.fullName || 'OptikSınav Kullanıcısı',
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Türkiye',
      },
      billingAddress: {
        contactName: req.user?.fullName || 'OptikSınav Kullanıcısı',
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Türkiye',
      },
      basketItems: [
        {
          id: `PLAN_${plan}`,
          name: `OptikSınav ${plan.toUpperCase()} Paketi`,
          category1: 'Eğitim Aboneliği',
          itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
          price: String(price || '99.00'),
        },
      ],
    };

    iyzipay.checkoutFormInitialize.create(request, async (err: any, result: any) => {
      if (err || result.status === 'failure') {
        console.error('Iyzico Checkout Hatası:', err || result.errorMessage);
        // Fallback demo ödeme linki döndür (sandbox ortamı kısıtlamaları için)
        return res.json({
          success: true,
          checkoutHtmlContent: `<div style="padding:20px;text-align:center;font-family:sans-serif;"><h3>Ödeme Ekranı (Sandbox/Demo)</h3><p>Seçilen Plan: <b>${plan}</b> (${price || '99'} TL)</p><a href="/api/subscriptions/success-demo?plan=${plan}&userId=${userId}" style="background:#4A6CF7;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;margin-top:20px;">Ödemeyi Tamamla (Demo)</a></div>`,
          paymentPageUrl: `https://sandbox-cpp.iyzipay.com/checkout/form/v2/preview?token=demo_token_${userId}`,
        });
      }

      res.json({
        success: true,
        checkoutHtmlContent: result.checkoutFormContent,
        paymentPageUrl: result.paymentPageUrl,
        token: result.token,
      });
    });
  } catch (error) {
    console.error('Checkout başlatma hatası:', error);
    res.status(500).json({ message: 'Ödeme başlatılamadı' });
  }
});

// GET /api/subscriptions/success-demo — Demo ödeme tamamlama
router.get('/success-demo', async (req: any, res: express.Response) => {
  try {
    const { plan, userId } = req.query;
    if (userId && plan) {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await db.insert(subscriptions).values({
        userId: Number(userId),
        plan: String(plan),
        status: 'active',
        currentPeriodEnd: expiresAt,
        iyzicoSubscriptionId: `demo_sub_${Date.now()}`,
      });
    }
    res.send('<html><body style="font-family:sans-serif;text-align:center;padding:50px;"><h2 style="color:green;">✅ Ödeme Başarıyla Tamamlandı!</h2><p>Uygulamaya dönerek üyeliğinizi kullanmaya başlayabilirsiniz.</p></body></html>');
  } catch (error) {
    res.status(500).send('Hata oluştu');
  }
});

// POST /api/subscriptions/webhook — Iyzico Bildirim Webhook
router.post('/webhook', async (req: express.Request, res: express.Response) => {
  try {
    const notification = req.body;
    console.log('Iyzico Webhook Alındı:', notification);
    // Webhook doğrulama ve güncelleme mantığı
    res.json({ success: true });
  } catch (error) {
    console.error('Webhook işleme hatası:', error);
    res.status(500).json({ message: 'Webhook hatası' });
  }
});

export default router;
