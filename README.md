# 🌟 Dunia Baca — DCdhina collection

Game belajar membaca untuk anak. Materi dari 26 huruf A–Z, suku kata, kata, sampai membaca kalimat.

---

## 🚀 Cara Hosting di GitHub Pages

### Langkah 1: Upload semua file ke repository

Push semua file ke branch `main`. **Jangan upload folder `node_modules`.**

### Langkah 2: Jalankan GitHub Actions

1. Buka tab **Actions** di repository
2. Jika ada peringatan, klik **"I understand my workflows, go ahead and enable them"**
3. Klik workflow **"Deploy Dunia Baca to GitHub Pages"** di sidebar kiri
4. Klik tombol **"Run workflow"** → **"Run workflow"**
5. Tunggu sampai muncul ✅ hijau (sekitar 1-2 menit)

Setelah selesai, akan muncul branch baru bernama `gh-pages` yang berisi hasil build.

### Langkah 3: Setting GitHub Pages

1. Buka **Settings** → **Pages**
2. Di bagian **Build and deployment**:
   - **Source:** pilih `Deploy from a branch`
   - **Branch:** pilih `gh-pages` → `/ (root)`
3. Klik **Save**

### Langkah 4: Buka game

Tunggu 1-2 menit, lalu buka:

```
https://dinacollection.github.io/BELAJARMEMBACA/
```

---

## ⚠️ PENTING — Jangan pilih branch `main` di Pages!

Branch `main` berisi source code (TypeScript/React). Browser tidak bisa menjalankan source code langsung. Yang harus dipilih adalah branch **`gh-pages`** yang berisi hasil build.

---

## 💻 Menjalankan di komputer lokal

```bash
npm install
npm run dev
```

Build untuk hosting:

```bash
npm run build
```

Hasil ada di folder `dist/`.

---

## ❓ Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Layar putih / "File belum dibangun" | Pages masih mengarah ke branch `main`. Ubah ke `gh-pages` |
| Branch `gh-pages` belum ada | Jalankan GitHub Actions dulu (lihat Langkah 2) |
| Actions tidak muncul | Klik tab Actions dan enable workflows |
| Setelah update kode, game tidak berubah | Push ke `main`, Actions otomatis rebuild. Hard refresh (Ctrl+Shift+R) |

---

Belajar sambil bermain bersama DCdhina collection 🎉
