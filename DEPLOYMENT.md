# 📦 Panduan Deployment Verell Packing System

## Opsi 1: GitHub + Vercel (Recommended) ⭐

### Step 1: Setup GitHub Repository
```bash
cd "/Users/monolarico/Downloads/verell-packing-system (2)"
git init
git add .
git commit -m "Initial commit: Verell Packing System"
git branch -M main
git remote add origin https://github.com/USERNAME/verell-packing-system.git
git push -u origin main
```

### Step 2: Deploy ke Vercel
1. Buka https://vercel.com/login
2. Pilih "Sign up with GitHub"
3. Authorize Vercel
4. Klik "Add New" → "Project"
5. Pilih repository `verell-packing-system`
6. Klik "Deploy" ✅

**Hasilnya:** Setiap kali Anda push ke GitHub, Vercel akan auto-deploy!

---

## Opsi 2: Deploy Langsung ke Vercel CLI

```bash
# 1. Login terlebih dahulu
vercel login

# 2. Follow instruksi di browser (visit vercel.com/device)

# 3. Deploy ke production
vercel --prod
```

---

## Opsi 3: Manual Upload ke Vercel Dashboard

1. Buka https://vercel.com/dashboard
2. Login dengan akun Anda
3. Klik "Add New" → "Project"
4. Pilih "Import an existing project"
5. Paste GitHub URL atau upload file

---

## Build & Test Locally

```bash
# Development
npm run dev

# Production Build
npm run build

# Preview production build
npm run preview
```

Build output ada di folder `dist/`

---

## Environment Variables (Jika diperlukan)

Jika menggunakan Supabase atau API keys:

1. Di Vercel Dashboard, buka Settings → Environment Variables
2. Tambahkan setiap variable:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_KEY`
   - dll

---

## Status Build

Setelah deploy, Anda bisa monitor di:
- **Dashboard:** https://vercel.com/dashboard
- **Live URL:** Akan diberikan Vercel setelah deploy selesai

---

## Troubleshooting

**Build gagal?**
- Run `npm run lint` untuk check errors
- Pastikan semua dependencies terinstall: `npm install`

**Chunk size warning?**
- Ini normal untuk app dengan many dependencies
- Dapat di-optimize dengan code-splitting di future

**Environment variables tidak terbaca?**
- Pastikan prefix `VITE_` untuk client-side vars
- Redeploy setelah update environment variables
