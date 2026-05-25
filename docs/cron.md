# Vercel Cron - Pengumpulan Terjadwal

Endpoint yang dipanggil cron:

- `POST /api/cron/process-pengumpulan`

Endpoint ini akan memproses semua `PengumpulanProyek` yang:

- `status = PENDING`
- `tgl_unggah <= sekarang`

Lalu mengubah status menjadi `VALIDATED`.

## Konfigurasi di Vercel

Repo ini menggunakan `vercel.json` untuk mengaktifkan Vercel Cron (setiap 1 menit):

- File: `vercel.json`

## Environment Variable

Tambahkan env var berikut di Vercel (Project Settings → Environment Variables):

- `CRON_SECRET`

Dan pastikan cron request mengirim header:

- `x-cron-secret: <CRON_SECRET>`

### Catatan penting

- Vercel Cron akan memanggil endpoint sesuai schedule pada environment Production.
- Kalau ingin testing manual, lakukan `POST` ke endpoint dengan header `x-cron-secret`.
