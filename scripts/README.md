# DevFocus Dashboard - Setup Scripts

Bu klasör, projeyi hızlı ve kolay bir şekilde başlatmak için cross-platform scriptler içerir.

## 📜 Mevcut Scriptler

### 1. 🚀 Setup Script (`setup.js`)

Projeyi ilk kez kurmak için kullanılır.

**Çalıştırma:**
```bash
npm run setup
```

**Ne yapar:**
- ✅ Gerekli araçları kontrol eder (Node.js, npm, Git)
- ✅ `.env` dosyasını oluşturur
- ✅ Bağımlılıkları yükler (`npm install`)
- ✅ Prisma client'ı oluşturur
- ✅ Veritabanı şemasını push eder
- ✅ Type check ve lint kontrolü yapar
- ✅ Sonraki adımları gösterir

**İnteraktif:**
- Mevcut dosyaların üzerine yazılıp yazılmayacağını sorar
- Veritabanı kurulumunu atlama seçeneği sunar
- Her adımda kullanıcıya bilgi verir

---

### 2. 🏃 Quick Start Script (`start.js`)

Geliştirme sunucusunu başlatır.

**Çalıştırma:**
```bash
npm run quick-start
```

**Ne yapar:**
- ✅ Kurulum kontrolü yapar
- ✅ `.env` dosyasının varlığını kontrol eder
- ✅ Geliştirme sunucusunu başlatır (`npm run dev`)
- ✅ Sunucu URL'sini gösterir
- ✅ Ctrl+C ile güvenli kapatma

**Otomatik:**
- Herhangi bir kullanıcı etkileşimi gerektirmez
- Hataları renkli olarak gösterir
- Cross-platform çalışır (Windows, macOS, Linux)

---

### 3. 🏗️ Build Script (`build.js`)

Production build oluşturur.

**Çalıştırma:**
```bash
npm run prod-build
```

**Ne yapar:**
- ✅ Kurulum kontrolü yapar
- ✅ Lint kontrolü yapar
- ✅ Type check yapar
- ✅ Production build oluşturur
- ✅ Build bilgilerini gösterir
- ✅ Deploy seçeneklerini listeler

**Otomatik:**
- Type check başarısız olursa durur
- Lint hataları varsa uyarı verir ama devam eder
- Build başarılı olursa sonraki adımları gösterir

---

## 🎯 Kullanım Senaryoları

### İlk Kurulum
```bash
# 1. Projeyi klonla
git clone <repo-url>
cd devfocus-dashboard

# 2. Setup script'ini çalıştır
npm run setup

# 3. .env dosyasını düzenle
nano .env  # veya code .env

# 4. Geliştirme sunucusunu başlat
npm run quick-start
```

### Günlük Geliştirme
```bash
# Geliştirme sunucusunu başlat
npm run quick-start

# veya direkt
npm run dev
```

### Production Build
```bash
# Build oluştur
npm run prod-build

# Build'i test et
npm start

# Deploy et
vercel --prod
```

---

## 🎨 Özellikler

### Cross-Platform
- ✅ Windows (cmd, PowerShell)
- ✅ macOS (Terminal, iTerm)
- ✅ Linux (bash, zsh)

### Renkli Çıktı
- 🔵 Bilgi mesajları (mavi)
- 🟢 Başarı mesajları (yeşil)
- 🟡 Uyarı mesajları (sarı)
- 🔴 Hata mesajları (kırmızı)
- 🔷 Adım başlıkları (cyan)

### Hata Yönetimi
- Anlaşılır hata mesajları
- Çözüm önerileri
- Güvenli çıkış (exit codes)

### İnteraktif
- Kullanıcı onayı isteme
- Adım atlama seçenekleri
- İlerleme göstergeleri

---

## 🔧 Teknik Detaylar

### Gereksinimler
- Node.js >= 18.17.0
- npm >= 9.0.0
- Git (opsiyonel)

### Kullanılan Modüller
- `child_process` - Komut çalıştırma
- `fs` - Dosya işlemleri
- `path` - Yol işlemleri
- `readline` - Kullanıcı girişi

### Script Yapısı
```javascript
// Her script şu yapıyı takip eder:
1. Import'lar ve yardımcı fonksiyonlar
2. Renkli log fonksiyonları
3. Kontrol fonksiyonları
4. Ana işlem fonksiyonları
5. Main fonksiyon
6. Hata yakalama
```

---

## 📝 Notlar

### Windows Kullanıcıları
- PowerShell veya cmd kullanabilirsiniz
- Git Bash de desteklenir
- Renkler PowerShell 5.1+ ve Windows Terminal'de çalışır

### macOS/Linux Kullanıcıları
- Herhangi bir terminal emülatörü kullanabilirsiniz
- Scriptler executable olarak işaretlenmiştir
- Direkt çalıştırabilirsiniz: `./scripts/setup.js`

### CI/CD
Scriptler CI/CD pipeline'larında da kullanılabilir:
```yaml
# GitHub Actions örneği
- name: Setup project
  run: npm run setup
  env:
    CI: true
```

---

## 🐛 Sorun Giderme

### "Command not found" hatası
```bash
# Node.js yüklü mü kontrol et
node --version

# npm yüklü mü kontrol et
npm --version

# Script'i direkt çalıştırmayı dene
node scripts/setup.js
```

### "Permission denied" hatası (macOS/Linux)
```bash
# Script'leri executable yap
chmod +x scripts/*.js

# Sonra tekrar dene
npm run setup
```

### ".env file not found" hatası
```bash
# .env.example var mı kontrol et
ls -la .env.example

# Varsa manuel kopyala
cp .env.example .env

# Setup script'ini tekrar çalıştır
npm run setup
```

### "Database connection failed" hatası
```bash
# .env dosyasında DATABASE_URL'i kontrol et
cat .env | grep DATABASE_URL

# PostgreSQL çalışıyor mu kontrol et
# Docker kullanıyorsan:
docker-compose up -d postgres

# Yerel PostgreSQL kullanıyorsan:
sudo systemctl status postgresql
```

---

## 🤝 Katkıda Bulunma

Script'leri geliştirmek isterseniz:

1. Yeni özellik ekleyin
2. Cross-platform uyumluluğu test edin
3. Hata yönetimi ekleyin
4. Dokümantasyonu güncelleyin
5. Pull request açın

---

## 📚 Daha Fazla Bilgi

- [Ana README](../README.md)
- [Sayfa Dokümantasyonu](../docs/PAGES.md)
- [Özellik Listesi](../docs/FEATURES.md)
- [Proje Durumu](../PROJECT_STATUS.md)

---

**Made with ❤️ for developers**
