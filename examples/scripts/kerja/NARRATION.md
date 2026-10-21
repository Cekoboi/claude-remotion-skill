# Naskhah narasi: Kerja Makan Gaji vs Kerja Sendiri

Durasi video: 56 s, 120 BPM (1 beat = 0.5 s = 15 frame). Setiap frasa bermula tepat pada beatnya. Masa di bawah dijana daripada `src/kerja/timing.json`.

Suara dalam video ialah gTTS (Google Translate TTS, Bahasa Melayu, dipercepat 1.12x). Untuk rakam semula dengan suara manusia atau ElevenLabs, simpan setiap frasa sebagai `public/kerja/vo/<id>.wav`, ubah tempoh dalam `scripts/kerja/vo-durations.json` (atau jalankan semula `gen-vo.py` dengan enjin lain), kemudian jalankan `npm run kerja:timing`. Skrip itu akan gagal jika ada frasa yang terlalu panjang untuk slotnya.

| Babak | ID | Mula | Tamat | Beat | Teks |
|---|---|---|---|---|---|
| 1. Hook | h1 | 0:01.0 | 0:02.3 | 2 | Kerja makan gaji... |
| 1. Hook | h2 | 0:03.0 | 0:04.3 | 6 | atau kerja sendiri? |
| 1. Hook | h3 | 0:05.0 | 0:06.6 | 10 | Mana satu lebih berbaloi? |
| 2. Kerja makan gaji | g1 | 0:08.5 | 0:09.8 | 17 | Kerja makan gaji. |
| 2. Kerja makan gaji | g2 | 0:10.0 | 0:12.7 | 20 | Masuk pukul sembilan, balik pukul enam. |
| 2. Kerja makan gaji | g3 | 0:14.0 | 0:17.9 | 28 | Hujung bulan, gaji masuk. Stabil dan terjamin. |
| 2. Kerja makan gaji | g4 | 0:18.0 | 0:21.7 | 36 | Tapi sewa, kereta, dan bil, semua tolak dulu. |
| 3. Kerja sendiri | s1 | 0:22.5 | 0:25.6 | 45 | Kerja sendiri pula, kau bos untuk diri sendiri. |
| 3. Kerja sendiri | s2 | 0:26.0 | 0:28.3 | 52 | Order masuk, bungkus, hantar. |
| 3. Kerja sendiri | s3 | 0:29.0 | 0:30.6 | 58 | Rezeki ikut usaha. |
| 3. Kerja sendiri | s4 | 0:31.0 | 0:33.7 | 62 | Boleh naik mendadak, tapi tiada gaji tetap. |
| 4. Perbandingan | c1 | 0:36.5 | 0:42.2 | 73 | Makan gaji: stabil, ada KWSP dan cuti, tapi pendapatan terhad. |
| 4. Perbandingan | c2 | 0:43.0 | 0:48.7 | 86 | Kerja sendiri: masa fleksibel, potensi tanpa had, tapi risiko lebih tinggi. |
| 5. Penutup | e1 | 0:50.5 | 0:52.3 | 101 | Jadi, kau pilih yang mana? |
| 5. Penutup | e2 | 0:52.5 | 0:53.4 | 105 | Komen di bawah! |

## Naskhah penuh

**1. Hook** (0:00.0–0:08.0)

Kerja makan gaji... atau kerja sendiri? Mana satu lebih berbaloi?

**2. Kerja makan gaji** (0:08.0–0:22.0)

Kerja makan gaji. Masuk pukul sembilan, balik pukul enam. Hujung bulan, gaji masuk. Stabil dan terjamin. Tapi sewa, kereta, dan bil, semua tolak dulu.

**3. Kerja sendiri** (0:22.0–0:36.0)

Kerja sendiri pula, kau bos untuk diri sendiri. Order masuk, bungkus, hantar. Rezeki ikut usaha. Boleh naik mendadak, tapi tiada gaji tetap.

**4. Perbandingan** (0:36.0–0:50.0)

Makan gaji: stabil, ada KWSP dan cuti, tapi pendapatan terhad. Kerja sendiri: masa fleksibel, potensi tanpa had, tapi risiko lebih tinggi.

**5. Penutup** (0:50.0–0:56.0)

Jadi, kau pilih yang mana? Komen di bawah!

