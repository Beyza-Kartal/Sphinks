# HazırMısın? — Güncel API Sözleşmesi (backend: A/Beyza)

Bu dosya, backend'de **gerçekten çalışan** uçları ve tam olarak hangi alan adlarını beklediğini/döndürdüğünü gösterir. Artık **tüm uçlar gerçek** — sahte/hardcoded uç kalmadı. Arayüz (B, C) kodunu **buradaki** isimlere göre yazmalı.

Son güncelleme: 2026-10-10.

---

## ✅ ÇALIŞAN UÇLAR (hepsi gerçek veritabanı/iş mantığıyla)

### `GET /api/hoca/uniteler`
Ders ve ünite listesini döner (hoca "sınıf ekle" ekranında kullanılır). `soru_sayisi: 0` olan bir ünite için sınıf açılamaz (henüz içerik eklenmemiş demektir).

**Döner:**
```json
{
  "ders": { "ders_id": "fonksiyonlar", "ad": "Matematik" },
  "uniteler": [
    { "unite_id": "fonksiyonlar_1", "ad": "Fonksiyonlar 1", "konular": ["kumeler_ve_ikililer", "..."], "soru_sayisi": 240 }
  ]
}
```

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
Email kayıtlı değilse `404`.

---

### `POST /api/hoca/sinif-ekle`
Hoca yeni bir sınıf (şube) açar. **Kodu hoca uydurmaz, backend otomatik üretir.**
**Gönder:**
```json
{ "hoca_id": 1, "unite_id": "fonksiyonlar_1" }
```
**Döner:**
```json
{ "sinif_id": 1, "kod": "Q8AVSY", "ders_id": "fonksiyonlar", "unite_id": "fonksiyonlar_1" }
```
Bu `kod`'u öğrencilere QR/link olarak verin — `/api/giris`'te `sinif_kodu` olarak kullanılır. Geçersiz `unite_id` veya o ünitede henüz soru yoksa `400`.

⚠️ Eski sözleşmede `ders_id` gönderiliyordu, artık **`unite_id`** gönderilir (`ders_id` backend tarafından ünite üzerinden otomatik belirlenir).

---

### `POST /api/hoca/sinif-ders-ekle`
Mevcut bir sınıfa (kod aynı kalır, öğrenciler tekrar kod girmez) yeni bir ünite/test atar. Eski deneme/cevap kayıtları silinmez.
**Gönder:**
```json
{ "hoca_id": 1, "sinif_id": 1, "unite_id": "fonksiyonlar_2" }
```
**Döner:** `sinif-ekle` ile aynı şekil: `{ "sinif_id", "kod", "ders_id", "unite_id" }`.
Sınıf bulunamazsa ya da bu hocaya ait değilse `404`; geçersiz/boş ünite `400`.

---

### `DELETE /api/hoca/sinif/{sinif_id}?hoca_id=1`
Sınıfı ve ona ait TÜM veriyi (öğrenciler, denemeler, cevaplar) kalıcı olarak siler. `hoca_id` query parametresi olarak gönderilir, sınıf bu hocaya ait değilse `404`.
**Döner:** `{ "sonuc": "silindi" }`

---

### `GET /api/hoca/sinif-listesi/{hoca_id}`
Hocanın SADECE kendi sınıflarını döner.
**Döner:**
```json
{ "siniflar": [ { "sinif_id": 1, "kod": "Q8AVSY", "ders_id": "fonksiyonlar", "unite_id": "fonksiyonlar_1", "unite_adi": "Fonksiyonlar 1" } ] }
```

---

### `GET /api/hoca/panel/{sinif_id}`
**Döner:**
```json
{
  "sinif_id": 1,
  "kod": "Q8AVSY",
  "hazir_orani": 0.5,
  "tamamlayan_sayisi": 2,
  "eksik_dagilimi": { "kumeler_ve_ikililer": 1 },
  "eksik_yuzdeleri": [
    { "alt_konu_id": "kumeler_ve_ikililer", "ogrenci_sayisi": 1, "yuzde": 50.0 }
  ],
  "ogrenciler": [
    { "isim": "Ayşe", "durum": "hazir" },
    { "isim": "Mehmet", "durum": "eksigi_var" }
  ]
}
```
`durum` değerleri: `hic_baslamadi` | `test_suruyor` | `eksigi_var` | `hazir`.
`hazir_orani` ve `eksik_yuzdeleri`'ndeki yüzdeler, testi **henüz bitirmemiş** (`hic_baslamadi`/`test_suruyor`) öğrencileri paydaya katmaz — sadece `test_bitti` olanlar üzerinden hesaplanır.

---

### `POST /api/video-ekle`
Hoca kendi YouTube videosunu ekler; canlı istek sırasında altyazı çekilip Groq ile bölümlenir.
**Gönder:**
```json
{ "ders_id": "fonksiyonlar", "youtube_url": "https://youtube.com/watch?v=...", "kanal_adi": "Hoca Eklentisi" }
```
**Döner:**
```json
{
  "video_id": 3,
  "youtube_id": "...",
  "kanal_adi": "Hoca Eklentisi",
  "bolumler": [ { "alt_konu_id": "kumeler_ve_ikililer", "baslik": "...", "baslangic_sn": 10, "bitis_sn": 120 } ]
}
```
Altyazı/işleme başarısızsa `400`.

---

### `POST /api/giris`
Öğrenci sınıfa girer (kayıtlı değilse otomatik oluşturulur, aynı isimle tekrar girerse aynı kayıt kullanılır).
**Gönder:**
```json
{ "sinif_kodu": "FNK101", "isim": "Ayşe" }
```
**Döner:**
```json
{ "ogrenci_id": 1, "sinif_id": 1, "ders_id": "fonksiyonlar", "unite_id": "fonksiyonlar_1" }
```
Hata: sınıf kodu yoksa `404`.

---

### `POST /api/test/basla`
Ön testi başlatır. **Tüm sorular bir kerede** döner (sınıfın `unite_id`'sine ait alt konulardan).

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
⚠️ `secenekler` bir **sözlük** (A/B/C/D anahtarlı), liste değil. ⚠️ Doğru cevap burada **hiç gönderilmiyor** (güvenlik, sunucu tarafında `deneme_id` ile eşleşen pakette tutuluyor).

**Arayüzde tek tek soru göstermek için örnek yaklaşım:**
```js
const { deneme_id, sorular } = await apiCall("/api/test/basla", "POST", { ogrenci_id, sinif_id });
let index = 0;
const cevaplar = {};  // { soru_id: "B", ... }

function soruyuGoster() {
  const soru = sorular[index];
  // soru.soru, soru.secenekler (A/B/C/D) ile ekranı doldurun
}

function sonrakiSoru(secilenHarf) {
  cevaplar[sorular[index].soru_id] = secilenHarf;
  index++;
  if (index < sorular.length) {
    soruyuGoster();
  } else {
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
Deneme bulunamazsa ya da test süresi dolmuşsa (sunucu yeniden başladıysa aktif test paketi hafızadan gider) `404`.

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

### `GET /api/video/{video_id}/bolumler`
Bir videonun tüm bölümlerini döner (alt_konu_id, baslik, baslangic_sn, bitis_sn).

---

### `POST /api/tekrar/basla`
Video izledikten sonra, **sadece** `/api/test/bitir`'in bulduğu eksik alt konudan 6 soru (2 kolay+2orta+2zor) üretir.
**Gönder:** `{ "deneme_id": 1 }`
**Döner:** `{ "deneme_id": 1, "sorular": [ { "soru_id", "alt_konu", "soru", "secenekler" } ] }`
Deneme yoksa ya da bu deneme için bulunmuş bir eksik konu yoksa `404`/`400`.

### `POST /api/tekrar/bitir`
**Gönder:** `{ "deneme_id": 1, "cevaplar": { "soru_id": "harf" } }`
**Döner:**
```json
{
  "toplam_soru": 6,
  "dogru": 5,
  "puan": 83.3,
  "calisma_ise_yaradi_mi": true,
  "yanlis_sorular": [
    { "soru": "...", "secenekler": {...}, "senin_cevabin": "A", "dogru_cevap": "B" }
  ]
}
```
`calisma_ise_yaradi_mi: true` ise `deneme.bulunan_alt_konu` temizlenir (öğrenci "hazır" sayılır). Deneme ya da aktif tekrar testi bulunamazsa `404`.

### `POST /api/adim-adim`
Öğrencinin o denemede yanlış yaptığı **tüm** sorular için (sadece en son yanlış değil, tamamı) Groq ile sade bir adım adım açıklama üretir.
**Gönder:** `{ "deneme_id": 1 }`
**Döner:** `{ "kartlar": [ { "soru": "...", "aciklama": "..." } ], "aciklama": null }`
Yanlış cevap yoksa: `{ "kartlar": [], "aciklama": "Tebrikler, bu denemede yanlış cevabın yok!" }`

### `GET /api/ozet/{deneme_id}`
Denemenin güncel durumunu döner: hazır mı, eksik var mı, en son tekrar testi sonucu neydi.
**Döner:**
```json
{
  "durum": "test_bitti",
  "hazir_mi": false,
  "eksik_konu": "kumeler_ve_ikililer",
  "son_tekrar_dogru": 5,
  "son_tekrar_toplam": 6,
  "son_tekrar_puan": 83.3
}
```

---

### `GET /api/sunucu-bilgisi`
Hoca paneli QR kodu için: sunucunun yerel ağ (LAN) IP'sini döner. Hoca paneli `localhost`/`127.0.0.1` üzerinden açılsa bile, QR kod telefonla okutulabilsin diye bu IP kullanılır (aynı wifi'deki telefonlar erişebilir; farklı ağdaki cihazlar için yeterli değildir, o durumda ngrok gibi bir tünelleme gerekir).
**Döner:** `{ "lan_ip": "192.168.1.23" }`

---

## ❌ KALDIRILAN / KULLANILMAYAN

- `POST /api/cevap` — **silindi**, yerine `/api/test/basla` + `/api/test/bitir` geldi.
- `POST /api/benzetme` — **hiç uygulanmadı, yerine `/api/adim-adim` geldi** (ilgi alanına göre "benzetme" matematik için uygun bulunmadı, bkz. GUNLUK.md).
- `/api/ogretmen-giris`, `/api/ogretmen-kayit` — bu isimler **yanlış**, doğrusu `/api/hoca/giris`, `/api/hoca/kayit`.
- `sinifKodu` (camelCase) — **yanlış**, doğrusu `sinif_kodu` (alt çizgili). Backend hep alt çizgili (`snake_case`) alan adı kullanır.
- `content/konu.json` — eski formatta, backend bu dosyayı hiç okumuyor. Gerçek içerik `content/soru_havuzu.json`. Silinmesi önerilir (hâlâ repoda duruyor).

---

## Neden bu kadar değişti?

Hackathon sırasında takım kararıyla mimari birkaç kez değişti: önce basit tek-konulu sistem, sonra 480 soruluk JSON havuzu sistemine geçtik, sonra hoca login + ünite bazlı sınıf sistemi eklendi. Detaylı gerekçeler `GUNLUK.md`'de. Bu dosya **tek doğru kaynak** — kod yazarken buraya bakın.
