# Sağlık Tesisi Kayıt Portalı

Bu proje, sağlık tesislerinden bakanlığa iletilecek belgeleri ve bilgileri dijital olarak toplamak, bu verileri tesis bazlı saklamak ve yönetici panelinden tesislerin durumlarını takip edebilmek amacıyla geliştirilmiştir.

## Özellikler

- Modern ve sade bir arayüz (TailwindCSS kullanılmıştır)
- Mobil uyumlu tasarım
- Sağlık tesisi başvuru formu
- Dosya yükleme desteği (resim ve PDF)
- Yönetici paneli
- Sağlık tesisi durumunu yönetme
- Tesis listesi filtreleme ve arama

## Teknolojiler

- **Frontend:** HTML, CSS (TailwindCSS), JavaScript (Vanilla JS)
- **Backend:** Node.js, Express.js
- **Veritabanı:** MongoDB
- **Dosya Yükleme:** Multer
- **Kimlik Doğrulama:** JWT

## Kurulum

### Gereksinimler

- Node.js
- MongoDB

### Adımlar

1. Repo'yu klonlayın:

```bash
git clone <repo-link>
cd healthcare-portal
```

2. Bağımlılıkları yükleyin:

```bash
npm install
```

3. `.env` dosyası oluşturun:

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/healthcare-portal
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
UPLOAD_PATH=src/uploads
```

4. Veritabanını başlatın:

```bash
mongod
```

5. Admin kullanıcısı oluşturun:

```bash
# API endpoint'i çağırarak admin kullanıcısı oluşturmak için:
# POST http://localhost:3000/api/admin/create-admin
# Bu işlemi tarayıcıdan veya Postman kullanarak yapabilirsiniz.
```

6. Uygulamayı başlatın:

```bash
# Geliştirme modunda
npm run dev

# veya
# Üretim modunda
npm start
```

7. Tarayıcıda görüntüleyin:

```
http://localhost:3000
```

## Kullanıcı Rolleri

1. **Tesis Kullanıcısı:** Ana sayfada tesis bilgilerini ve belgelerini yükleyebilir.
2. **Yönetici:** `/yonetim_paneli` adresinden giriş yaparak tesisleri görüntüleyebilir ve durum güncellemesi yapabilir.

## Yönetici Giriş Bilgileri

- **Kullanıcı Adı:** admin
- **Şifre:** admin123

## Proje Yapısı

```
healthcare-portal/
├── public/                   # Statik dosyalar
│   ├── css/                  # CSS dosyaları
│   ├── js/                   # JavaScript dosyaları
│   ├── images/               # Resimler
│   ├── index.html            # Ana sayfa (Tesis Başvuru Formu)
│   └── admin.html            # Yönetici paneli
├── src/                      # Kaynak dosyaları
│   ├── config/               # Yapılandırma dosyaları
│   ├── controllers/          # Controller'lar
│   ├── middlewares/          # Middleware'ler
│   ├── models/               # Veritabanı modelleri
│   ├── routes/               # API route'ları
│   ├── uploads/              # Yüklenen dosyalar
│   └── server.js             # Ana server dosyası
├── .env                      # Ortam değişkenleri
├── package.json              # Proje bağımlılıkları
└── README.md                 # Dokümantasyon
```

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır. 