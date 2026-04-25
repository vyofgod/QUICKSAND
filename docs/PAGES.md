# DevFocus Dashboard - Sayfa Dokümantasyonu

Bu dokümanda uygulamadaki tüm sayfalar ve özellikleri açıklanmaktadır.

## 📄 Sayfa Listesi

### 1. 🏠 Dashboard (`/dashboard`)
Ana kontrol paneli sayfası.

**Özellikler:**
- İstatistik kartları (toplam görevler, tamamlanan görevler, odaklanma süresi, haftalık ilerleme)
- Görev panosu (Kanban board)
- Pomodoro zamanlayıcı
- AI önerileri paneli
- Aktivite akışı

**Bileşenler:**
- `DashboardStats` - İstatistik kartları
- `TaskBoard` - Görev panosu
- `PomodoroTimer` - Zamanlayıcı
- `AIInsightsPanel` - AI önerileri
- `ActivityFeed` - Aktivite akışı

---

### 2. ✅ Tasks (`/dashboard/tasks`)
Görev yönetimi sayfası.

**Özellikler:**
- Gelişmiş arama ve filtreleme
- Öncelik bazlı filtreleme (Urgent, High, Medium, Low)
- Durum bazlı filtreleme (To Do, In Progress, In Review, Done)
- Yeni görev oluşturma
- Sürükle-bırak ile görev taşıma
- Görev detayları ve düzenleme

**Kullanım:**
```typescript
// Görev oluşturma
<CreateTaskDialog>
  <Button>New Task</Button>
</CreateTaskDialog>

// Filtreleme
<Select defaultValue="all">
  <SelectItem value="urgent">Urgent</SelectItem>
  <SelectItem value="high">High</SelectItem>
</Select>
```

---

### 3. ⏱️ Focus (`/dashboard/focus`)
Pomodoro ve odaklanma takip sayfası.

**Özellikler:**
- Günlük oturum sayısı ve süre
- Haftalık streak takibi
- Toplam oturum sayısı
- Günlük hedef ilerleme çubuğu
- Son oturumlar geçmişi
- Haftalık analitik grafikler
- Pomodoro zamanlayıcı

**İstatistikler:**
- Today's Sessions - Bugünkü oturum sayısı
- Week Streak - Haftalık seri
- Total Sessions - Toplam oturum
- Daily Goal - Günlük hedef

**Sekmeler:**
- **History** - Oturum geçmişi
- **Analytics** - Haftalık analitikler

---

### 4. 🔀 Repositories (`/dashboard/repositories`)
GitHub ve GitLab repository yönetim sayfası.

**Özellikler:**
- Repository listesi ve detayları
- GitHub/GitLab senkronizasyonu
- Repository istatistikleri (commits, stars, forks)
- Dil dağılımı
- Branch ve commit takibi
- Arşivlenmiş repository filtreleme
- Provider bazlı filtreleme (GitHub/GitLab)

**İstatistikler:**
- Total Repositories - Toplam repository sayısı
- Total Commits - Toplam commit sayısı
- Recent Commits - Son 7 gündeki commit'ler
- Top Languages - En çok kullanılan diller

**Repository Bilgileri:**
- Repository adı ve açıklaması
- Public/Private durumu
- Arşiv durumu
- Yıldız, fork ve issue sayıları
- Commit ve branch sayıları
- Konular (topics)
- Programlama dili

**Senkronizasyon:**
- Sync All - Tüm provider'ları senkronize et
- Sync GitHub - Sadece GitHub'ı senkronize et
- Sync GitLab - Sadece GitLab'ı senkronize et

---

### 5. 📊 Activity (`/dashboard/activity`)
Geliştirme aktivitelerini takip sayfası.

**Özellikler:**
- Günlük aktivite sayısı
- Haftalık commit sayısı
- Pull request takibi
- GitHub/GitLab entegrasyonu
- Aktivite akışı
- Kaynak bazlı filtreleme

**Aktivite Tipleri:**
- 🔄 Commit
- 🔀 Pull Request / Merge Request
- 💬 Issue / Review / Comment
- ✅ Task Completed
- ⏱️ Focus Session

**Sekmeler:**
- **All Activity** - Tüm aktiviteler
- **GitHub** - GitHub aktiviteleri
- **GitLab** - GitLab aktiviteleri
- **Local** - Yerel aktiviteler

---

### 5. ✨ AI Insights (`/dashboard/insights`)
AI destekli öneriler ve analiz sayfası.

**Özellikler:**
- Üretkenlik trendleri
- Odaklanma kalitesi analizi
- Görev tamamlama önerileri
- AI sohbet asistanı
- Öneri geçmişi
- Kişiselleştirilmiş öneriler

**Öneri Kategorileri:**
- **PRODUCTIVITY** - Üretkenlik önerileri
- **FOCUS** - Odaklanma önerileri
- **TASKS** - Görev yönetimi önerileri
- **HABITS** - Alışkanlık önerileri

**Sekmeler:**
- **Recommendations** - AI önerileri
- **AI Chat** - AI asistan sohbeti
- **History** - Öneri geçmişi

---

### 6. 👤 Profile (`/dashboard/profile`)
Kullanıcı profil ve istatistik sayfası.

**Özellikler:**
- Profil bilgileri ve avatar
- Toplam görev istatistikleri
- Odaklanma süresi takibi
- Streak (seri) takibi
- Başarım (achievement) sistemi
- Haftalık aktivite grafiği
- Tamamlanma oranı

**İstatistikler:**
- Total Tasks - Toplam görevler
- Focus Time - Toplam odaklanma süresi
- Current Streak - Mevcut seri
- Achievements - Kazanılan rozetler

**Başarımlar:**
- 🎯 First Steps - İlk görevi tamamla
- ⏱️ Focus Master - 50 odaklanma oturumu
- 🔥 Week Warrior - 7 günlük seri
- ✅ Task Crusher - 100 görev tamamla
- 🌅 Early Bird - Sabah 8'den önce başla
- 🦉 Night Owl - Gece 10'dan sonra tamamla

**Sekmeler:**
- **Achievements** - Başarımlar
- **Activity** - Haftalık aktivite
- **Statistics** - Detaylı istatistikler

---

### 7. ⚙️ Settings (`/dashboard/settings`)
Uygulama ayarları sayfası.

**Özellikler:**
- Profil bilgileri düzenleme
- Avatar değiştirme
- Şifre güvenliği
- Tema ayarları (Light/Dark/System)
- Pomodoro zamanlayıcı ayarları
- AI model konfigürasyonu
- Bildirim tercihleri
- GitHub/GitLab entegrasyonları
- Veri dışa aktarma
- Hesap silme

**Sekmeler:**

#### Profile
- Profil bilgileri
- Avatar yönetimi
- Biyografi
- Güvenlik ve şifre

#### Appearance
- Tema modu (Light/Dark/System)
- Kompakt mod
- Sidebar varsayılan durumu

#### Pomodoro
- Çalışma süresi (varsayılan: 25 dk)
- Kısa mola süresi (varsayılan: 5 dk)
- Uzun mola süresi (varsayılan: 15 dk)
- Uzun molaya kadar oturum sayısı (varsayılan: 4)
- Otomatik başlatma ayarları

#### AI Settings
- AI model seçimi (GPT-4, GPT-3.5, Claude)
- Temperature ayarı (0-1)
- Max tokens
- Özel sistem promptu
- AI insights açma/kapama
- Günlük özet

#### Notifications
- Bildirim açma/kapama
- Görev deadline bildirimleri
- Odaklanma oturumu bildirimleri
- Mola hatırlatıcıları
- AI insights bildirimleri
- Ses uyarıları

#### Integrations
- GitHub bağlantısı
- GitLab bağlantısı
- Veri dışa aktarma
- Hesap silme

---

## 🎨 Kullanılan UI Bileşenleri

### Shadcn/ui Components
- `Card` - Kart bileşeni
- `Button` - Buton bileşeni
- `Input` - Giriş alanı
- `Textarea` - Çok satırlı giriş
- `Select` - Seçim kutusu
- `Switch` - Anahtar
- `Progress` - İlerleme çubuğu
- `Badge` - Rozet
- `Avatar` - Avatar
- `Dialog` - Modal pencere
- `Tabs` - Sekmeler
- `Separator` - Ayırıcı
- `Skeleton` - Yükleme iskelet

### Icons (Lucide React)
- `LayoutDashboard`, `CheckSquare`, `Timer`, `Activity`
- `Settings`, `Sparkles`, `User`, `Bell`
- `Github`, `Gitlab`, `Calendar`, `Clock`
- `TrendingUp`, `Target`, `Flame`, `Award`
- Ve daha fazlası...

---

## 🔄 Routing Yapısı

```
/                           → Ana sayfa (redirect to /dashboard)
/auth/signin               → Giriş sayfası
/auth/error                → Hata sayfası
/dashboard                 → Dashboard
/dashboard/tasks           → Görevler
/dashboard/focus           → Odaklanma
/dashboard/activity        → Aktivite
/dashboard/insights        → AI Önerileri
/dashboard/profile         → Profil
/dashboard/settings        → Ayarlar
```

---

## 🔐 Kimlik Doğrulama

Tüm dashboard sayfaları NextAuth v5 ile korunmaktadır:

```typescript
const session = await auth();
if (!session) {
  redirect("/auth/signin");
}
```

---

## 📱 Responsive Tasarım

Tüm sayfalar mobil, tablet ve masaüstü için optimize edilmiştir:

- **Mobile**: Tek sütun layout
- **Tablet**: 2 sütun grid
- **Desktop**: 3-4 sütun grid

Tailwind CSS breakpoints:
- `sm:` - 640px+
- `md:` - 768px+
- `lg:` - 1024px+
- `xl:` - 1280px+

---

## 🚀 Gelecek Özellikler

- [ ] Gerçek zamanlı bildirimler
- [ ] Takım işbirliği özellikleri
- [ ] Özel raporlar ve dışa aktarma
- [ ] Mobil uygulama
- [ ] Takvim entegrasyonu
- [ ] Slack/Discord entegrasyonları
- [ ] Özelleştirilebilir dashboard widget'ları
- [ ] Karanlık mod geliştirmeleri

---

## 📝 Notlar

- Tüm sayfalar TypeScript ile yazılmıştır
- Server Components ve Client Components ayrımı yapılmıştır
- Suspense ile loading state'leri yönetilmektedir
- tRPC ile tip güvenli API çağrıları yapılmaktadır
- Prisma ile veritabanı yönetimi sağlanmaktadır

---

**Son Güncelleme:** 2026-04-24
**Versiyon:** 0.1.0
