# Repository Integration Guide

Bu doküman, DevFocus Dashboard'a GitHub ve GitLab repository entegrasyonunun nasıl çalıştığını açıklar.

## Özellikler

### Otomatik Repository Senkronizasyonu
- Kullanıcı GitHub veya GitLab ile giriş yaptığında, tüm repoları otomatik olarak çekilir
- Repository bilgileri (description, stars, forks, issues, vb.) kaydedilir
- Son 30 günün commit'leri otomatik olarak senkronize edilir
- Branch bilgileri de dahil edilir

### Repository Bilgileri
Her repository için şu bilgiler saklanır:
- **Temel Bilgiler**: İsim, açıklama, URL, homepage
- **İstatistikler**: Stars, forks, open issues, watchers
- **Metadata**: Dil, topics/tags, private/public durumu, archived durumu
- **Owner Bilgileri**: Owner adı ve avatar
- **Tarihler**: Oluşturulma, güncellenme, son push tarihleri

### Commit Bilgileri
Her commit için:
- SHA, mesaj, yazar bilgileri
- Eklenen/silinen satır sayıları
- Değiştirilen dosya sayısı
- Commit tarihi ve URL

### Branch Bilgileri
Her branch için:
- Branch adı
- Default/protected durumu
- Son commit bilgileri

## Kurulum

### 1. OAuth Uygulamaları Oluşturun

#### GitHub OAuth App
1. GitHub'da Settings > Developer settings > OAuth Apps'e gidin
2. "New OAuth App" butonuna tıklayın
3. Şu bilgileri girin:
   - **Application name**: DevFocus Dashboard
   - **Homepage URL**: `http://localhost:3000` (production'da gerçek URL)
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Client ID ve Client Secret'i kopyalayın

**Gerekli Scope'lar**: `read:user`, `user:email`, `repo`

#### GitLab OAuth App
1. GitLab'da Settings > Applications'a gidin
2. "Add new application" butonuna tıklayın
3. Şu bilgileri girin:
   - **Name**: DevFocus Dashboard
   - **Redirect URI**: `http://localhost:3000/api/auth/callback/gitlab`
   - **Scopes**: `read_user`, `read_api`, `read_repository`
4. Application ID ve Secret'i kopyalayın

**Gerekli Scope'lar**: `read_user`, `read_api`, `read_repository`

### 2. Environment Variables

`.env` dosyanızı güncelleyin:

```env
# GitHub OAuth
AUTH_GITHUB_ID="your-github-client-id"
AUTH_GITHUB_SECRET="your-github-client-secret"

# GitLab OAuth
AUTH_GITLAB_ID="your-gitlab-application-id"
AUTH_GITLAB_SECRET="your-gitlab-secret"

# GitLab API URL (opsiyonel, self-hosted için)
GITLAB_API_URL="https://gitlab.com/api/v4"
```

### 3. Veritabanı Migration

Yeni tabloları oluşturmak için:

```bash
npm run db:push
# veya
npm run db:migrate
```

Bu şu tabloları oluşturacak:
- `Repository`: Repository bilgileri
- `RepositoryCommit`: Commit bilgileri
- `RepositoryBranch`: Branch bilgileri

## Kullanım

### Otomatik Senkronizasyon

Kullanıcı GitHub veya GitLab ile giriş yaptığında, repoları otomatik olarak arka planda senkronize edilir. Bu işlem:
- Kullanıcının tüm repolarını çeker
- Her repo için branch'leri çeker
- Son 30 günün commit'lerini çeker

### Manuel Senkronizasyon

Kullanıcılar `/dashboard/repositories` sayfasından manuel olarak senkronizasyon yapabilir:

```typescript
// Tüm provider'ları senkronize et
const result = await trpc.repository.syncAll.mutate();

// Sadece GitHub'ı senkronize et
const result = await trpc.repository.syncGitHub.mutate();

// Sadece GitLab'ı senkronize et
const result = await trpc.repository.syncGitLab.mutate();
```

### Repository Listesi

```typescript
// Tüm repoları getir
const repos = await trpc.repository.getAll.useQuery();

// Sadece GitHub repolarını getir
const githubRepos = await trpc.repository.getAll.useQuery({
  provider: "GITHUB"
});

// Archived repoları da dahil et
const allRepos = await trpc.repository.getAll.useQuery({
  includeArchived: true
});
```

### Repository Detayları

```typescript
// Tek bir repo'nun detaylarını getir
const repo = await trpc.repository.getById.useQuery({
  id: "repo-id"
});

// Repo'nun commit'lerini getir
const commits = await trpc.repository.getCommits.useQuery({
  repositoryId: "repo-id",
  limit: 50,
  offset: 0
});
```

### İstatistikler

```typescript
// Repository istatistiklerini getir
const stats = await trpc.repository.getStats.useQuery();

// Dönen veriler:
// - totalRepos: Toplam repo sayısı
// - githubRepos: GitHub repo sayısı
// - gitlabRepos: GitLab repo sayısı
// - totalCommits: Toplam commit sayısı
// - recentCommits: Son 7 gündeki commit sayısı
// - mostActiveRepos: En aktif 5 repo
// - languageDistribution: Dil dağılımı
```

## API Endpoints

### tRPC Router: `repository`

#### Queries
- `getAll`: Tüm repoları listele
- `getById`: Tek bir repo'nun detaylarını getir
- `getCommits`: Bir repo'nun commit'lerini getir
- `getStats`: Repository istatistiklerini getir

#### Mutations
- `syncGitHub`: GitHub repolarını senkronize et
- `syncGitLab`: GitLab repolarını senkronize et
- `syncAll`: Tüm bağlı provider'ları senkronize et
- `delete`: Bir repo'yu sil

## Sayfalar

### `/dashboard/repositories`
- Tüm repoların listesi
- Provider'a göre filtreleme (GitHub/GitLab)
- Archived repoları göster/gizle
- Manuel senkronizasyon butonları
- Repository istatistikleri

### `/dashboard/repositories/[id]`
- Repository detayları
- Branch listesi
- Commit geçmişi (sayfalama ile)
- Repository istatistikleri
- External link'ler

## Veri Modeli

### Repository
```prisma
model Repository {
  id          String   @id @default(cuid())
  userId      String
  externalId  String   // GitHub/GitLab repo ID
  provider    ActivitySource // GITHUB or GITLAB
  
  name        String
  fullName    String   // owner/repo format
  description String?
  url         String
  
  stars       Int
  forks       Int
  openIssues  Int
  
  language    String?
  topics      String[]
  isPrivate   Boolean
  isArchived  Boolean
  
  commits     RepositoryCommit[]
  branches    RepositoryBranch[]
}
```

### RepositoryCommit
```prisma
model RepositoryCommit {
  id           String   @id @default(cuid())
  repositoryId String
  sha          String
  
  message      String
  author       String
  authorEmail  String?
  
  additions    Int
  deletions    Int
  changedFiles Int
  
  committedAt  DateTime
}
```

### RepositoryBranch
```prisma
model RepositoryBranch {
  id           String   @id @default(cuid())
  repositoryId String
  name         String
  isDefault    Boolean
  isProtected  Boolean
  
  lastCommitSha     String?
  lastCommitMessage String?
  lastCommitDate    DateTime?
}
```

## Güvenlik

- OAuth token'ları veritabanında güvenli şekilde saklanır
- API istekleri kullanıcının kendi token'ı ile yapılır
- Her kullanıcı sadece kendi repolarını görebilir
- tRPC protected procedure'ları kullanılır

## Performans

- İlk senkronizasyon arka planda yapılır (non-blocking)
- Commit'ler son 30 günle sınırlıdır
- Pagination ile büyük veri setleri yönetilir
- Batch işlemler ile API rate limit'leri optimize edilir

## Gelecek Geliştirmeler

- [ ] Webhook entegrasyonu (real-time güncellemeler)
- [ ] Pull request/merge request takibi
- [ ] Issue takibi
- [ ] Code review metrikleri
- [ ] Contributor istatistikleri
- [ ] Repository karşılaştırma
- [ ] Commit trend grafikleri
- [ ] Daha detaylı commit analizi (dosya bazında)
