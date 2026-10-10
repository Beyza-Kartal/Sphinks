# HazırMısın? — Güncel API Sözleşmesi (backend: A/Beyza)

Bu dosya, şu an backend'de **gerçekten çalışan** uçları ve tam olarak hangi alan adlarını beklediğini/döndürdüğünü gösterir. Orijinal plan dosyasındaki API tablosu (bölüm 5.2) artık **güncelliğini kaybetti** — soru sistemi JSON havuzuna geçti, hoca login eklendi. Arayüz (B, C) kodunu **buradaki** isimlere göre yazmalı.

Son güncelleme: bugün, saat ~19:4x. Değişirse bu dosya tekrar güncellenecek.

---

## 🔴 ŞU AN KODUNUZDA GÖRDÜĞÜM EKSİKLER (frontend/ klasörüne bakıldı, saat ~19:4x)

Bunlar şu an `frontend/ogrenci.js`, `frontend/index.html` içinde bulunan, düzeltilmesi gereken noktalar:

1. **`ogrenci.js` hâlâ `/api/cevap`'ı çağırıyor** (satır ~78, ~297, ~608). Bu uç **artık yok**. Onun yerine:
   - Önce `/api/test/basla` çağırıp **tüm soruları** al (tek seferde gelir, tek tek değil).
   - Öğrenci arayüzde soruları istediğiniz gibi tek tek gösterebilirsiniz (ilerleme çubuğu dahil, sorun değil) — ama cevapları biriktirip **hepsini birden** `/api/test/bitir`'e gönderin (bkz. aşağıdaki örnek).
   - `/api/cevap` çağrısını tamamen kaldırın.

2. **Hoca girişi/kaydı (`index.html`) şu an backend'e hiç bağlı değil** — sadece `localStorage`'a yazıyor, `/api/hoca/giris` veya `/api/hoca/kayit`'e hiç `fetch` atmıyor. Ben "sınıf oluştur" ucunu (`/api/hoca/sinif-ekle`) bitirene kadar bekleyin, bitirince burada haber vereceğim, tam o zaman gerçek `fetch` çağrılarına geçin.

3. **`srdas`'ın eklediği `content/konu.json` kullanılmıyor, SİLİNEBİLİR.** Eski formatta ("Kesirlerde Toplama ve Çıkarma" konusu), backend bu dosyayı hiç okumuyor. Gerçek içerik `content/soru_havuzu.json` (buse'nin 480 sorusu, "fonksiyonlar" dersi). Karışıklık olmasın diye bu dosyayı silmenizi öneririm.

4. **`/api/ogretmen-giris` / `/api/ogretmen-kayit` isimleri hiçbir yerde kullanılmasın** — bunlar eski/yanlış isimlerdi (ilk React denemesinde vardı). `frontend/` klasöründeki güncel dosyalarda artık görünmüyorlar, iyi — ama tekrar eklenmesin diye not ediyorum.

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

**Arayüzde tek tek soru göstermek için örnek yaklaşım (backend'e tek seferde gelen 12 soruyu, siz istediğiniz hızda ekranda gösterirsiniz):**
```js
const { deneme_id, sorular } = await apiCall("/api/test/basla", "POST", { ogrenci_id, sinif_id });
let index = 0;
const cevaplar = {};  // { soru_id: "B", ... } - kullanıcı her soruyu cevapladığında buraya ekleyin

function soruyuGoster() {
  const soru = sorular[index];
  // soru.soru, soru.secenekler (A/B/C/D) ile ekranı doldurun
  // "ilerleme" göstergesi icin: index+1 / sorular.length
}

function sonrakiSoru(secilenHarf) {
  cevaplar[sorular[index].soru_id] = secilenHarf;
  index++;
  if (index < sorular.length) {
    soruyuGoster();
  } else {
    // hepsi cevaplandi, simdi hepsini birden gonder:
    apiCall("/api/test/bitir", "POST", { deneme_id, cevaplar }).then(sonuc => {
      // sonuc.eksik_alt_konular, sonuc.genel_puan vs. - teshis ekranina gecin
    });
  }
}
```

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

### `POST /api/hoca/sinif-ekle`
Hoca yeni bir sınıf (şube) açar. **Kodu hoca uydurmaz, backend otomatik üretir.**
**Gönder:**
```json
{ "hoca_id": 1, "ders_id": "fonksiyonlar" }
```
**Döner:**
```json
{ "sinif_id": 1, "kod": "Q8AVSY", "ders_id": "fonksiyonlar" }
```
Bu `kod`'u öğrencilere QR/link olarak verin — `/api/giris`'te `sinif_kodu` olarak kullanılır.

---

### `GET /api/hoca/sinif-listesi/{hoca_id}`
Hocanın SADECE kendi sınıflarını döner (başka hocanın sınıfları görünmez).
**Döner:**
```json
{ "siniflar": [ { "sinif_id": 1, "kod": "Q8AVSY", "ders_id": "fonksiyonlar" } ] }
```

---

### `GET /api/hoca/panel/{sinif_id}`
**Artık gerçek veri döner** (eskiden sahteydi, şimdi gerçek).
**Döner:**
```json
{
  "sinif_id": 1,
  "kod": "Q8AVSY",
  "hazir_orani": 0.5,
  "eksik_dagilimi": { "kumeler_ve_ikililer": 1 },
  "ogrenciler": [
    { "isim": "Ayşe", "durum": "hazir" },
    { "isim": "Mehmet", "durum": "eksigi_var" }
  ]
}
```
`durum` değerleri: `hic_baslamadi` | `test_suruyor` | `eksigi_var` | `hazir`.

---

## 🚧 HENÜZ SAHTE (hardcoded) — bağlanabilirsiniz ama veri gerçek değil, yakında değişecek

| Uç | Durum |
|---|---|
| `POST /api/tekrar/basla` | Sahte. Gerçek mantık `kavram_testi_secici.py`'ye bağlanacak (video sonrası tekrar testi). |
| `POST /api/benzetme` | Sahte. EK2, Groq ile yazılacak. |
| `GET /api/ozet/{deneme_id}` | Sahte. |
| `POST /api/video-ekle` | Sahte. EK2. |

---

## ❌ KALDIRILAN UÇLAR (eski planda vardı, artık YOK)

- `POST /api/cevap` — **silindi**, yerine `/api/test/basla` + `/api/test/bitir` geldi (yukarıya bakın).
- `/api/ogretmen-giris`, `/api/ogretmen-kayit` — bu isimler **yanlış**, doğrusu `/api/hoca/giris`, `/api/hoca/kayit`.
- `sinifKodu` (camelCase) — **yanlış**, doğrusu `sinif_kodu` (alt çizgili). Backend hep alt çizgili (`snake_case`) alan adı kullanır.

---

## Neden bu kadar değişti?

Hackathon sırasında takım kararıyla mimari iki kez değişti: önce basit tek-konulu sistem, sonra 480 soruluk JSON havuzu sistemine geçtik, sonra hoca login eklendi. Detaylı gerekçeler `GUNLUK.md`'de. Üzgünüz, ama şu andan sonra bu dosya **tek doğru kaynak** — kod yazarken buraya bakın.
