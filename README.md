# 🎬 KINOVERSE — Professional Virtual Kino Platformasi

O‘zbek tilidagi eng zamonaviy, to‘liq ishlaydigan **virtual kino tomosha qilish web-platformasi**. 

Ushbu platforma oddiy kino sayti emas, balki do‘stlar bilan birgalikda virtual xonada, 4 kishilik divanda o‘tirib, sinxron video tomosha qilish imkoniyatini beruvchi to‘liq full-stack tizimdir.

---

## 🌟 Asosiy Imkoniyatlar

1. **Virtual Kino Xonasi (2.5D Cinema Lounge)**:
   * **Katta Televizor (OLED 4K Cinema Screen)**: Xonaning asosiy devorida joylashgan video ekran.
   * **4 Kishilik Divan (Couch)**: Televizor qarshisida 4 ta belgilangan o‘rindiqqa (1, 2, 3, 4) ega qulay divan.
   * **Avatar Yurish va O‘tirish Animatsiyasi**: Foydalanuvchi xonaga kirganda avval xona ko‘rinadi, so‘ng avatar eshik tomonidan paydo bo‘lib, silliq qadam tashlash animatsiyasi bilan divan tomon yuradi, divanga kelib o‘rindiqqa o‘tiradi va kino boshlanadi!
   * **Do‘stlarni Taklif Qilish**: Xona havolasini nusxalash yoki onlayn do‘stlarga 1-bosishda real-time taklifnoma yuborish.
   * **Maksimal 4 kishi cheklovi**: Bitta virtual xonaga qat’iy 4 tagacha foydalanuvchi sig‘adi. Agar 5-foydalanuvchi ulanmoqchi bo‘lsa:
     > *"Bu kino xonasi to‘liq. Maksimal 4 ta foydalanuvchi qatnashishi mumkin."*
   * **Sinxron Video Ijro (Real-time Video Sync via Socket.IO)**: Bir ishtirokchi *Play* bosganda barchada ijro boshlanadi; *Pause* qilinganda barchada to‘xtaydi; vaqt o‘zgartirilganda barchaning videoplayeri birdek o‘tadi.
   * **Fullscreen (To‘liq ekran)**: Televizor yoki Fullscreen tugmasi bosilganda virtual xona yashirilib, video butun ekranni egallaydi. `ESC` bosilganda virtual xonaga qaytadi.
   * **Jonli Emojilar va Xona Chati**: Popkorn (🍿), qarsaklar (👏), olov (🔥), sevgi (❤️), kulgu (😂) kabi emojilar avatar ustida jonli paydo bo‘ladi.

2. **Dizayn va Atmosfera**:
   * Klassik, premium kino atmosferasi.
   * Ranglar palitrasi: **Qora (`#09090b`) + Oq (`#f4f4f5`) + Qizil (`#e50914`) + Sariq (`#f59e0b`)**.
   * **🌙 Tungi rejim (Dark mode)** va **☀️ Kunduzgi rejim (Light mode)**, tanlov `localStorage`da saqlanadi.

3. **Autentifikatsiya (Google Login & Demo Rejimi)**:
   * Google OAuth orqali kirish.
   * Bir nechta oynada 4 kishilik divanni darhol sinab ko‘rish uchun 1-bosishda ishlaydigan **Tezkor Sinov Akkauntlari** (Super Admin, Ali, Madina, Jasur, Nodira).
   * Standart Email va Parol bilan ro‘yxatdan o‘tish va kirish.

4. **Kino Katalogi va Professional Qidiruv**:
   * O‘zbek kinolari, yangi kinolar, jahon kinolari, seriallar, multfilmlar.
   * Real-time Debounce Search (nomi, aktyor, rejissyor, janr, yil).
   * 1-5 yulduzli interaktiv baholash tizimi (Reyting o‘rtachasi avtomatik hisoblanadi).
   * Kommentariyalar va like tizimi.

5. **Foydalanuvchi Kino Yuklashi va Avtomatik O‘chirish (Auto-Expiry)**:
   * Oddiy foydalanuvchi o‘zi xohlagan kinoni yuklashi mumkin (`/upload`).
   * Yuklangan kino moderator tasdiqlamaguncha umumiy katalogda chiqmaydi.
   * Foydalanuvchi yuklagan vaqtinchalik kinolar uchun xavfsizlik maqsadida `expiresAt` (masalan, 7 kun) belgilanadi va muddati o‘tgach server fondagi tozalash jarayoni (cron) orqali avtomatik o‘chirib tashlanadi. Admin kinolari esa doimiy saqlanadi.

6. **Admin Panel (`/admin`)**:
   * Role-Based Access Control: **Super Admin**, **Admin**, **Moderator**.
   * Ko‘rsatkichlar: Jami foydalanuvchilar, kinolar, aktiv kino xonalari, tasdiqlash kutilayotgan kinolar, umumiy ko‘rishlar soni.
   * Kinolarni qo‘shish, tahrirlash, o‘chirish, Featured qilish, foydalanuvchi yuklamalarini tasdiqlash yoki rad etish.
   * Foydalanuvchilarni boshqarish: bloklash/blokdan chiqarish, rollarini o‘zgartirish (Admin, Moderator, User).

7. **Ijtimoiy Funksiyalar**:
   * Sevimlilar ro‘yxati (`/favorites`).
   * Ko‘rish tarixi (`/history`) — video qayerda to‘xtatilgan bo‘lsa, keyingi safar shu joydan davom ettirish tugmasi bilan.
   * Do‘stlar tizimi (`/friends`): foydalanuvchilarni qidirish, do‘stlik so‘rovi yuborish, qabul/rad qilish, onlayn/oflayn statusi.
   * Bildirishnomalar (xona taklifnomalari, do‘stlik so‘rovlari, kino tasdiqlanishi).

---

## 🚀 Ishga Tushirish

Loyihaning ildiz papkasida:
`C:\Users\PC_HOUSE\.gemini\antigravity\scratch\kino-platformasi`

### 1. Barcha xizmatlarni bitta portda ishga tushirish (Tavsiya etiladi)

Backend server frontend ishlab chiqarish buildini va Socket.io ni bitta manzilga birlashtirgan:

```bash
node server/src/index.js
```

So‘ngra brauzerda oching:
👉 **http://localhost:5000**

### 2. Frontend ishlab chiqish (Vite Hot-Reload) rejimida:

```bash
# 1-terminalda (Backend):
node server/src/index.js

# 2-terminalda (Frontend):
npm --prefix client run dev
```

Brauzerda oching:
👉 **http://localhost:5173**

---

## 🔑 Sinov Akkauntlari

Tizimga kirish ("Kirish" tugmasi) oynasida "Tezkor sinov akkauntlari" mavjud:

| Profil | Email | Rol | Imkoniyati |
|---|---|---|---|
| **👑 Super Admin** | `admin@kinoverse.uz` | `super_admin` | Barcha huquqlar, admin tayinlash, foydalanuvchilarni boshqarish |
| **👤 Ali Valiyev** | `ali@kinoverse.uz` | `admin` | Kino qo‘shish/tahrirlash, user yuklamalarini tasdiqlash |
| **👩 Madina Karimova** | `madina@kinoverse.uz` | `moderator` | Fikrlarni nazorat qilish, yuklamalarni ko‘rish |
| **🍿 Jasur Toshmatov** | `jasur@kinoverse.uz` | `user` | Virtual xonalar, do‘stlar, sevimlilar, yuklash |
| **✨ Nodira Umarova** | `nodira@kinoverse.uz` | `user` | Do‘stlar bilan birga kino ko‘rish |

*(Barcha test akkauntlar paroli: `kinoverse123` yoki 1-bosishda avtomatik demo kirish)*

---

## 🛠 Texnologiyalar

* **Frontend**: React.js (Vite), Tailwind CSS v4, Lucide Icons, Canvas Confetti, HTML5 Video Sync Engine.
* **Backend**: Node.js, Express.js, Socket.IO.
* **Database**: SQLite (better-sqlite3) — yuqori tezlikdagi WAL rejimi, xavfsiz tranzaksiyalar.
* **Xavfsizlik**: JWT tokenlar, bcrypt parollarni heshlash, Role-based route himoyasi, XSS/sanitizatsiya.
