# GitHub Actions Cron - Pengumpulan Terjadwal

Endpoint yang dipanggil cron:

- `POST /api/cron/process-pengumpulan`

Endpoint ini akan memproses semua `PengumpulanProyek` yang:

- `status = PENDING`
- `tgl_unggah <= sekarang`

Lalu mengubah status menjadi `VALIDATED`.

## Konfigurasi dengan GitHub Actions

Karena Vercel Cron berbayar, repo ini bisa menjalankan cron menggunakan **GitHub Actions Schedule**.

Workflow akan memanggil endpoint berikut secara periodik:

- `POST /api/cron/process-pengumpulan`

## Secret & Environment Variable

Ada 2 cara, pilih salah satu:

### Opsi A (disarankan): GitHub **Environment**

Repo → **Settings → Environments** → buat/ pilih environment (mis. `production`), lalu set:

- **Environment secret**: `CRON_SECRET`
- **Environment variable**: `PROD_BASE_URL` (contoh: `https://domain-kamu.vercel.app`)

Workflow sudah diarahkan untuk memakai `environment: production`.

### Opsi B: GitHub **Repository secrets**

Repo → **Settings → Secrets and variables → Actions**

- `CRON_SECRET`
- `PROD_BASE_URL`

Nilai `CRON_SECRET` harus sama dengan env var `CRON_SECRET` yang kamu set di Vercel Project (Production).

`PROD_BASE_URL` dipakai oleh workflow untuk membentuk URL endpoint cron:

- `${PROD_BASE_URL}/api/cron/process-pengumpulan`

Dan pastikan cron request mengirim header:

- `x-cron-secret: <CRON_SECRET>`

### Catatan penting

- Workflow ini dijadwalkan **setiap 1 menit**. GitHub Actions kadang bisa delay beberapa menit, tapi akan tetap jalan.
- Env `CRON_SECRET` di **Vercel tetap perlu** (dipakai untuk validasi header `x-cron-secret`).
- Karena **Vercel Cron berbayar**, pastikan `vercel.json` tidak berisi konfigurasi `crons`.
- Kalau ingin testing manual, lakukan `POST` ke endpoint dengan header `x-cron-secret`.
