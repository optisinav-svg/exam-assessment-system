# OptikSınav - APK Üretim Rehberi

## Yapılan Değişiklikler

Projeniz **Expo SDK 57** ve **React Native 0.86** tabanına geçirildi. Bu değişikliklerle:

- EAS Build (Expo Application Services) yapılandırması eklendi
- `tesseract.js` kaldırıldı (native build ile uyumlu değil)
- Expo uyumlu babel ve metro yapılandırmaları eklendi
- Tüm değişiklikler GitHub'a kaydedildi

---

## APK Nasıl Üretilir?

### Yöntem 1: EAS Build (Önerilen - Bulut Tabanlı)

EAS Build, APK'yı **Expo'nun bulut sunucularında** üretir. Kendi bilgisayarınızda Android Studio, JDK veya SDK kurmanıza gerek yoktur.

#### Adım 1: Expo Hesabı Oluşturun

1. [expo.dev](https://expo.dev) adresine gidin
2. "Sign Up" ile ücretsiz bir hesap oluşturun

#### Adım 2: EAS CLI Kurun

Tabletinizde veya bilgisayarınızda Terminal'i açın ve şu komutları çalıştırın:

```bash
# Node.js kurulu olması gerekir (https://nodejs.org)
npm install -g eas-cli
```

#### Adım 3: Projeyi İndirin

```bash
git clone https://github.com/optisinav-svg/exam-assessment-system.git
cd exam-assessment-system/mobile
```

#### Adım 4: Expo Projesini Oluşturun

```bash
# Expo hesabınıza giriş yapın
eas login

# Projeyi Expo'ya bağlayın
eas project:init
```

> Bu komut `app.json` dosyasındaki `projectId` alanını otomatik olarak doldurur.

#### Adım 5: APK Üretin

```bash
# APK üretimi başlatın
eas build --platform android --profile preview
```

Build süreci yaklaşık **5-10 dakika** sürer. Expo'nun bulut sunucuları derlemeyi yapar. Tamamlandığında APK indirme linki verilir.

---

### Yöntem 2: Android Studio ile (Kendi Bilgisayarınızda)

Eğer kendi bilgisayarınızda APK üretmek isterseniz:

#### Gerekli Kurulumlar

1. [Android Studio](https://developer.android.com/studio) kurun
2. Node.js kurun: https://nodejs.org
3. Java JDK 17 kurun

#### APK Üretimi

```bash
# Projeyi indirin
git clone https://github.com/optisinav-svg/exam-assessment-system.git
cd exam-assessment-system/mobile

# Bağımlılıkları kurun
npm install

# Android native dosyalarını oluşturun
npx expo prebuild --platform android

# APK'yı oluşturun
cd android
./gradlew assembleRelease
```

APK dosyası şu yolda oluşur:
```
mobile/android/app/build/outputs/apk/release/app-release.apk
```

---

## Play Store İçin Hazırlık

Play Store'a yüklemek için **AAB (Android App Bundle)** formatı gerekir:

```bash
eas build --platform android --profile production
```

Bu komut Play Store uyumlu bir AAB dosyası üretir.

---

## Güncelleme Yapmak

Kodda değişiklik yapmak istediğinizde:

1. GitHub'dan projeyi indirin: `git clone` veya `git pull`
2. `mobile/src/App.tsx` dosyasını düzenleyin
3. Değişiklikleri GitHub'a gönderin:
   ```bash
   git add .
   git commit -m "Açıklama"
   git push origin main
   ```
4. Yeni APK üretmek için tekrar:
   ```bash
   eas build --platform android --profile preview
   ```

---

## iOS İçin APK (IPA) Üretimi

iOS için build almak:

```bash
eas build --platform ios
```

> iOS için Apple Developer hesabı ($99/yıl) gereklidir.

---

## Web Versiyonu

Web versiyonu için:

```bash
eas build --platform web
```

---

## Özet

| Platform | Komut | Süre | Gereksinim |
|----------|-------|------|-----------|
| Android APK | `eas build --platform android --profile preview` | 5-10 dk | Expo hesabı |
| Android AAB (Play Store) | `eas build --platform android --profile production` | 5-10 dk | Expo hesabı + keystore |
| iOS IPA | `eas build --platform ios` | 10-20 dk | Apple Developer hesabı |
| Web | `eas build --platform web` | 3-5 dk | Expo hesabı |
