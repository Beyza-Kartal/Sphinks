# HazırMısın? — Güncel API Sözleşmesi (backend: A/Beyza)

Bu dosya, şu an backend'de **gerçekten çalışan** uçları ve tam olarak hangi alan adlarını beklediğini/döndürdüğünü gösterir. Orijinal plan dosyasındaki API tablosu (bölüm 5.2) artık **güncelliğini kaybetti** — soru sistemi JSON havuzuna geçti, hoca login eklendi. Arayüz (B, C) kodunu **buradaki** isimlere göre yazmalı.

Son güncelleme: bugün, saat ~19:15. Değişirse bu dosya tekrar güncellenecek.

---

## ✅ ÇALIŞAN UÇLAR (gerçek veritabanı mantığıyla, güvenle kodlayabilirsiniz)

### `POST /api/giris`
Öğrenci sınıfa giriş yapar (yoksa otomatik oluşturulur).

**Gönder:**
```json
{ "sinif_kodu": "FNK101", "isim": "Ayşe" }
```
**Döner:**
```json
{ "ogrenci_id": 1, "sinif_id": 1, "ders_id": "fonksiyonlar" }
```
Hata: sınıf kodu yoksa `404`.

---

### `POST /api/test/basla`
Ön testi başlatır. **Tüm sorular bir kerede** döner (eski "tek tek soru" akışı YOK artık).

**Gönder:**
```json
{ "ogrenci_id": 1, "sinif_id": 1 }
```
**Döner:**
```json
{
  "deneme_id": 1,
  "sorular": [
    {
      "soru_id": "kum_k_04",
      "alt_konu": "kumeler_ve_ikililer",
      "soru": "A = {a, b, c} ve B = {1, 2} kümeleri...",
      "secenekler": { "A": "5", "B": "6", "C": "8", "D": "9" }
    }
  ]
}
```
⚠️ `secenekler` bir **sözlük** (A/B/C/D anahtarlı), liste değil. ⚠️ Doğru cevap burada **hiç gönderilmiyor** (güvenlik).

---

### `POST /api/test/bitir`
Öğrenci tüm soruları cevapladıktan sonra **tek seferde** gönderilir.

**Gönder:**
```json
{
  "deneme_id": 1,
  "cevaplar": { "kum_k_04": "B", "kum_o_07": "A" }
}
```
(`cevaplar`: `{soru_id: seçilen_harf}` — harf büyük/küçük fark etmez.)

**Döner:**
```json
{
  "toplam_soru": 12,
  "dogru": 8,
  "yanlis": 4,
  "genel_puan": 66.7,
  "derse_hazir_mi": false,
  "eksik_alt_konular": ["kumeler_ve_ikililer", "cebirsel_ifadeler"],
  "alt_konu_detaylari": {
    "kumeler_ve_ikililer": { "toplam": 3, "dogru": 1, "yanlis": 2, "basari_yuzdesi": 33.3 }
  }
}
```

---

### `GET /api/teshis/{deneme_id}`
En öncelikli eksiği ve o eksikle eşleşen video dakikalarını döner.

**Döner:**
```json
{
  "eksik": "kumeler_ve_ikililer",
  "videolar": [
    {
      "kanal_adi": "Matematiğin Güler Yüzü",
      "youtube_id": "M-Bufmo1Bz8",
      "baslik": "Kumeler Ve Ikililer",
      "baslangic_sn": 2224,
      "bitis_sn": 2380
    }
  ]
}
```
Eksik yoksa: `{ "eksik": null, "videolar": [], "mesaj": "..." }`

---

### `POST /api/hoca/kayit`
Hoca hesabı oluşturur.
**Gönder:** `{ "email": "...", "sifre": "..." }` → **Döner:** `{ "hoca_id": 1, "email": "..." }`
Email zaten kayıtlıysa `400`.

### `POST /api/hoca/giris`
**Gönder:** `{ "email": "...", "sifre": "..." }` → **Döner:** `{ "hoca_id": 1, "email": "..." }`
Yanlış email/şifre: `401`.

### `POST /api/hoca/sifre-degistir`
Gerçek e-posta gönderimi YOK — direkt yeni şifre kaydedilir.
**Gönder:** `{ "email": "...", "yeni_sifre": "..." }` → **Döner:** `{ "sonuc": "sifre guncellendi" }`

---

## 🚧 HENÜZ SAHTE (hardcoded) — bağlanabilirsiniz ama veri gerçek değil, yakında değişecek

| Uç | Durum |
|---|---|
| `POST /api/tekrar/basla` | Sahte. Gerçek mantık `kavram_testi_secici.py`'ye bağlanacak (video sonrası tekrar testi). |
| `POST /api/benzetme` | Sahte. EK2, Groq ile yazılacak. |
| `GET /api/ozet/{deneme_id}` | Sahte. |
| `POST /api/video-ekle` | Sahte. EK2. |
| `GET /api/hoca/panel/{sinif_id}` | Sahte. Gerçek hoca paneli (hazır oranı, öğrenci listesi) sıradaki işim. |

---

## ❌ KALDIRILAN UÇLAR (eski planda vardı, artık YOK)

- `POST /api/cevap` — **silindi**, yerine `/api/test/basla` + `/api/test/bitir` geldi (yukarıya bakın).
- `/api/ogretmen-giris`, `/api/ogretmen-kayit` — bu isimler **yanlış**, doğrusu `/api/hoca/giris`, `/api/hoca/kayit`.
- `sinifKodu` (camelCase) — **yanlış**, doğrusu `sinif_kodu` (alt çizgili). Backend hep alt çizgili (`snake_case`) alan adı kullanır.

---

## Neden bu kadar değişti?

Hackathon sırasında takım kararıyla mimari iki kez değişti: önce basit tek-konulu sistem, sonra 480 soruluk JSON havuzu sistemine geçtik, sonra hoca login eklendi. Detaylı gerekçeler `GUNLUK.md`'de. Üzgünüz, ama şu andan sonra bu dosya **tek doğru kaynak** — kod yazarken buraya bakın.
