# 🏆 HazırMısın? — 7 Dakikalık Jüri Sunumu ve 3 Dakikalık Canlı Demo Rehberi

> **Proje Adı:** HazırMısın? (Lise Matematik Adaptif Ön Değerlendirme & Akıllı Telafi Platformu)  
> **Toplam Süre:** 10 Dakika (7 Dakika Slayt Sunumu + 3 Dakika Canlı Demo)  
> **Ekip Rolleri:**  
> - **Kişi A:** Yapay Zeka Mimarisi & Groq LLM Entegrasyonu & Altyazı Eşleme  
> - **Kişi B:** Öğrenci Ön Yüzü, Mobil Deneyim & Backend API  
> - **Kişi C (Buse):** İçerik Mimarisi (480 Soru), Öğretmen Canlı Takip Paneli & Pitch/Demo Lideri  

---

## ⏱️ Zaman Yönetimi Özeti (10 Dakika Zaman Çizelgesi)

| Zaman Aralığı | Bölüm | İçerik | Sorumlu |
| :--- | :--- | :--- | :--- |
| **00:00 - 01:00** | Slayt 1 | Giriş & Büyük Problem (Kayıp 40 Dakika) | Kişi C (Buse) |
| **01:00 - 02:00** | Slayt 2 | Çözümümüz: 3 Adımlı Adaptif Döngü | Kişi B |
| **02:00 - 03:00** | Slayt 3 | Pedagojik Mimari & 480 Soruluk Havuz | Kişi C (Buse) |
| **03:00 - 04:00** | Slayt 4 | Teknik Mimari & Groq Bilişsel Köprü | Kişi A |
| **04:00 - 05:00** | Slayt 5 | Öğretmen Canlı Takip Paneli | Kişi C (Buse) |
| **05:00 - 06:00** | Slayt 6 | Rakiplerden Farkımız (Khan/EBA Kıyası) | Kişi B |
| **06:00 - 07:00** | Slayt 7 | Gelecek Vizyonu & Demo Geçişi | Kişi C (Buse) |
| **07:00 - 10:00** | **Canlı Demo** | 3 Dakikalık Rol Dağılımlı Canlı Senaryo | Tüm Ekip |

---

## 📊 BÖLÜM 1: 7 Dakikalık Slayt Sunum Taslağı

### 🎬 Slayt 1: Problem Tanımı (00:00 - 01:00)
**Başlık:** Ders Başlamadan Kaybedilen 40 Dakika: Ön Koşul Eksiği Çıkmazı  
**Konuşmacı:** Kişi C (Buse)

- **Vurucu İstatistik / Gerçek:**  
  *Lise matematik müfredatında her konu, geçmiş yılların kazanımları üzerine inşa edilir.* Örneğin 10. sınıf öğrencisi "Fonksiyonlar" konusunu anlamak istiyorsa; 8. ve 9. sınıftan gelen **Kümeler**, **Cebirsel İfadeler**, **Koordinat Sistemi** ve **1. Derece Denklemler** konularına tam hakim olmak zorundadır.
- **Sınıftaki Kriz:**  
  Öğretmen sınıfa girdiğinde 30 öğrencinin hangisinin nerede eksik olduğunu bilemez. Konuyu anlatmaya başlar; sınıftaki öğrencilerin yarısı temel cebirsel işlem yapamadığı için ilk 10 dakikada dersten kopar.
- **Mevcut Çözümlerin Başarısızlığı:**  
  Öğrenci eksik hissettiğinde YouTube'u açar; karşısına 1 saatlik genel tekrar videoları çıkar. 1 saatlik videonun hangi 3 dakikasına ihtiyacı olduğunu bilemez, sıkılır ve vazgeçer.
- **Bizim Sloganımız:**  
  **"HazırMısın? — Derse girmeden 5 dakikada eksik olduğun saniyeyi yakala, derse hazır gir!"**

---

### 💡 Slayt 2: Çözümümüz (01:00 - 02:00)
**Başlık:** 3 Aşamalı Adaptif Öğrenme Döngüsü  
**Konuşmacı:** Kişi B

- **1. Aşama — Şıklı Ön Koşul Taraması (Pre-Assessment):**  
  Öğrenciye ders öncesinde 12 soruluk (her alt kazanımdan Kolay-Orta-Zor) şıklı bir ön test sunulur. Zorluk etiketleri gizlidir; öğrencinin ön yargısı kırılır.
- **2. Aşama — Nokta Atışı Teşhis & Bilişsel Köprü:**  
  Sistem öğrencinin hangi alt konuda tıkandığını tespit eder. YouTube videosunun tamamını değil, altyazı analiziyle **tam o konunun anlatıldığı saniyeyi (örn: 08:02)** açar. Groq LLM ise öğrencinin ilgi alanına (futbol, oyun, müzik) göre soyut matematik kavramını somutlaştıran bir köprü benzetmesi kurar.
- **3. Aşama — Hedefe Yönelik Telafi Testi (Remediation Quiz):**  
  Tüm dersi baştan sınamak yerine, **sadece öğrencinin eksik çıktığı alt kazanımdan** 6 soruluk (2K + 2O + 2Z) telafi testi uygulanır. %75 barajını geçen öğrenci "Derse Hazır" rozetini alır.

---

### 📐 Slayt 3: Pedagojik Mimari ve İçerik Mimarisi (02:00 - 03:00)
**Başlık:** MEB Uyumlu 480 Soruluk Havuz & Ön Koşul Grafı  
**Konuşmacı:** Kişi C (Buse)

- **Doğrulanmış ve Gerekçeli Soru Havuzu:**  
  - 2 Ana Ünite (`fonksiyonlar`, `fonksiyonlar_2`).
  - Her ünitede 4'er kritik alt kazanım.
  - Her alt kazanımda 20 Kolay, 20 Orta, 20 Zor olmak üzere **toplam 480 özgün soru**.
  - Tüm sorular A-B-C-D şıklı, doğru cevaplı ve detaylı pedagojik çözüm açıklamalı.
- **Ön Koşul Bilgi Ağı (`konu.json`):**  
  Matematik kazanımları rastgele seçilmemiştir. Fonksiyonlar konusu için 8/9. sınıf temel taşları (Kümeler, Cebirsel İfadeler, Koordinat Düzlemi, Denklemler) pedagojik bağıntı grafı ile kodlanmıştır.
- **Genişletilebilirlik:**  
  Modüler JSON mimarisi sayesinde yarın Fizik, Kimya veya Biyoloji dersleri sisteme 5 dakikada entegre edilebilir.

---

### 🧠 Slayt 4: Teknik Mimari & Yapay Zeka Derinliği (03:00 - 04:00)
**Başlık:** Groq LLM (Llama 3.3 70B) & Akıllı Video Dilimleyici  
**Konuşmacı:** Kişi A

- **YouTube Transcript API & Zaman Damgalı Yönlendirme:**  
  Popüler eğitim kanallarının (*Rehber Matematik*, *Matematiğin Güler Yüzü*) videolarının transkriptleri çekilir; anahtar kelime ve konu eşleme motoru videoyu alt kazanımlara göre dilimler (`?t=saniye`).
- **Groq Llama 3.3 Bilişsel Köprü:**  
  Öğrenci cebirsel ifadede zorlanıyorsa ve basketbolu seviyorsa, model değişkenleri (x, y) serbest atış ve smaç puanlarıyla metaforlaştırır. Soyut kavram 30 saniyede somuta dönüşür.
- **Hafif ve Hızlı:**  
  Groq'un LPU mimarisi sayesinde yapay zeka yanıtları 0.4 saniye gibi rekor bir sürede üretilir.

---

### 🖥️ Slayt 5: Öğretmen Canlı Takip Paneli (04:00 - 05:00)
**Başlık:** Sınıfın Röntgenini Çeken Canlı Öğretmen Arayüzü  
**Konuşmacı:** Kişi C (Buse)

- **Anlık Hazır Bulunuşluk Göstergesi:**  
  Öğretmen sınıfına girip tahtaya paneli yansıttığında sınıftaki hazır olma oranını canlı ilerleme çubuğunda görür (%0 -> %80).
- **Kritik Eksik Dağılım Grafiği:**  
  Öğretmen ekrana bakar: *"Sınıfın %60'ı Cebirsel İfadeler'de hata yapmış."* Hoca 40 dakikalık dersin ilk 5 dakikasında doğrudan cebirsel ifadelere 2 örnek çözerek tüm sınıfı aynı hizaya getirir.
- **Dinamik Sınıf QR Kodu:**  
  Tahtadaki QR kodu telefonuna okutan öğrenci doğrudan o sınıfın oturumuna ve testine dahil olur. Kurulum gerektirmez.

---

### 🥊 Slayt 6: Rakiplerden Farkımız (05:00 - 06:00)
**Başlık:** Neden EBA veya Khan Academy Değil?  
**Konuşmacı:** Kişi B

| Özellik | Geleneksel Platformlar (EBA / Khan) | HazırMısın? Platformu |
| :--- | :--- | :--- |
| **Yaklaşım** | Genel konu anlatımı ve uzun testler | **Mikro-ön koşul taraması (5 dk)** |
| **Video Desteği** | 45 dakikalık videoyu baştan izletir | **Eksik kazanımın olduğu tam saniyeye götürür** |
| **Anlatım Tarzı** | Herkese aynı standart tanım | **Öğrencinin hobisine göre Bilişsel Köprü** |
| **Telafi Ölçümü** | Tüm üniteyi baştan çözdürür | **Sadece eksik konudan 6 soru (%75 eşik)** |
| **Öğretmen Etkisi** | Sadece ödev teslimi görür | **Ders başlamadan sınıfın eksik haritasını görür** |

---

### 🚀 Slayt 7: Gelecek Vizyonu & Demo Geçişi (06:00 - 07:00)
**Başlık:** Gelecek Adımlarımız & Canlı Demo  
**Konuşmacı:** Kişi C (Buse)

- **Yol Haritası:**  
  1. MEB EBA kazanım veritabanıyla çift yönlü entegrasyon.  
  2. Biyoloji, Kimya, Fizik ve Geometri modüllerinin eklenmesi.  
  3. Sesli yapay zeka soru çözüm asistanı.  
- **Geçiş Cümlesi:**  
  *"Değerli jüri üyelerimiz; teoriyi geride bırakalım ve sistemimizin bir öğrencinin kaderini 3 dakikada nasıl değiştirdiğini canlı olarak izleyelim!"*

---

## ⚡ BÖLÜM 2: 3 Dakikalık Canlı Demo Akış Senaryosu

### 🎭 Karakterler ve Hazırlık
- **Hoca Rolü (Kişi C - Buse):** Bilgisayarda `frontend/hoca.html` ekranını projeksiyona veya paylaşılan ekrana açar.
- **Öğrenci Rolü (Kişi B):** Telefonda veya ayrı bir tarayıcı sekmesinde öğrenci test arayüzünü açar.
- **Yapay Zeka & Teknik Anlatıcı (Kişi A):** Arka planda API çağrılarını ve Groq yanıtını jüriye seslendirir.

---

### ⏱️ Dakika Dakika Canlı Demo Adımları

#### 1. Dakika (07:00 - 07:45): Öğretmen Ekranı & Ön Teste Giriş
1. **Buse (Hoca):**  
   *"Şu an 10-A sınıfı matematik dersindeyiz. Konumuz Fonksiyonlar. Tahtada Hoca Paneli açık. Sınıfımızın hazır olma oranı şu an %0 görünüyor. Tahtadaki QR kodu öğrencimize gösteriyorum."*
2. **Kişi B (Öğrenci):**  
   *"Ben 10-A sınıfından öğrenci Ahmet. Telefonumla tahtadaki QR kodu okutuyorum. Karşıma Fonksiyonlar Ön Testi geldi. 12 soru var."*
3. **Kişi B (Öğrenci):**  
   Hızlıca soruları işaretler; Kümeler ve Denklemler sorularını doğru yapar, fakat **Cebirsel İfadeler** alt konusundaki sorularda bilerek yanlış seçenekleri işaretler ve testi tamamlar.

#### 2. Dakika (07:45 - 08:45): Nokta Atışı Teşhis, Groq Köprüsü ve YouTube Saniyesi
1. **Kişi A (Teknik):**  
   *"Arka planda `on_test_secici` motorumuz Ahmet'in cevaplarını kontrol etti. Kümeler: Tam, Koordinat: Tam, ancak Cebirsel İfadeler: 3 sorudan 0 doğru! Sistem anında eksik etiketini 'cebirsel_ifadeler' olarak belirledi."*
2. **Kişi B (Öğrenci - Ekranı Gösterir):**  
   *"Ekranımda şu uyarı belirdi: 'Ahmet, Fonksiyonlar dersine başlamadan önce Cebirsel İfadeler konusunu hatırlaman gerekiyor!'"*
3. **Kişi A (Teknik):**  
   *"Groq Llama 3.3 modeli devreye girdi. Ahmet'in profilindeki basketbol ilgisine göre bir Bilişsel Köprü kurdu: '2x + 3 ifadesini, 2 adet 3'lük basket ve 1 serbest atış toplamı gibi düşün!' Aynı anda YouTube videosu tam 08:02 saniyesinden başladı!"*

#### 3. Dakika (08:45 - 10:00): Hedefe Yönelik Telafi Testi & Hoca Panelinin Canlanması
1. **Kişi B (Öğrenci):**  
   *"Videodaki 2 dakikalık kısmı izledim ve zihnim tazelendi. Şimdi sistem bana tüm fonksiyonları değil, SADECE Cebirsel İfadeler'den oluşan 6 soruluk Kavram Testi'ni getirdi."*
2. **Kişi B (Öğrenci):**  
   6 sorudan 5 tanesini doğru işaretler (Skor: 5/6 = %83.3).
3. **Kişi B (Öğrenci):**  
   Ekranda yeşil konfeti patlar: **"Tebrikler Ahmet! %83 Başarı ile Cebirsel İfadeler eksiğini kapattın. Artık Fonksiyonlar dersine hazırsın!"**
4. **Buse (Hoca - Tahtaya İşaret Eder):**  
   *"Ve hocanın ekranına bakın! Hiç sayfayı yenilemedik; 5 saniyelik otomatik polling sayesinde tahtadaki Hazır Olma Oranı anında yeşile dönerek %100'e çıktı! Ahmet listede 'Derse Hazır' olarak yeşil rozet aldı. Sınıf artık derse gerçekten hazır!"*
5. **Ekip Hep Birlikte:**  
   *"HazırMısın? ile hiçbir öğrenci derste arkada kalmaz. Teşekkür ederiz!"*

---

## 🛡️ BÖLÜM 3: Jüri Soru-Cevap (Q&A) Savunma Kartları

### S1: "YouTube videosunun altyazısı yoksa veya video silinirse sistem çöker mi?"
> **Cevap (Kişi A):**  
> *"Harika bir soru. Sistemimiz 3 katmanlı yedeklilik mimarisine sahiptir:  
> 1. Birincil katmanda YouTube Transcript API üzerinden resmi altyazılar çekilir.  
> 2. Altyazı bulunamazsa yerleşik Whisper ses tanıma modelimiz videodan otomatik altyazı çıkarır.  
> 3. Video silinirse `videolar.json` havuzumuzda her kazanım için tanımlı 2 alternatif kanal (*Rehber Matematik* ve *Matematiğin Güler Yüzü*) bulunur; sistem otomatik olarak yedek videoya geçer."*

### S2: "Neden telafi testinde barajı %75 yaptınız? 50 veya 60 yetmez miydi?"
> **Cevap (Kişi C - Buse):**  
> *"Pedagojik araştırmalar, ön koşul kazanımlarında %50'lik bilginin yeni konuyu kavramaya yetmediğini, kavram yanılgılarına yol açtığını gösteriyor. 6 soruluk mikro testte 4 doğru %66 kalırken, en az 5 doğru (%83) yapan öğrencinin bilişsel olarak hazır olduğu kesinleşir. Bu yüzden katı ve güvenli bir baraj olan %75 eşiğini benimsedik."*

### S3: "480 soruluk havuzu nasıl oluşturdunuz ve doğruladınız?"
> **Cevap (Kişi C - Buse):**  
> *"Soru havuzumuz MEB Lise Matematik Öğretim Programı kazanımlarına birebir uyumlu olarak üretildi. 2 ana konu altında 4'er alt kazanım, her birinde 20 Kolay, 20 Orta ve 20 Zor soru olmak üzere tam 480 soru hazırlandı. Her sorunun 4 şıkkı, tek bir doğru cevabı ve öğrencinin neden yanıldığını açıklayan pedagojik çözüm gerekçesi JSON formatında doğrulanmıştır."*

### S4: "Öğrenci testi sallayarak rastgele şık işaretlerse sistem kandırılabilir mi?"
> **Cevap (Kişi B):**  
> *"Ön testte şans eseri doğru yapma ihtimalini düşürmek için 4 alt kazanımdan hem Kolay hem Orta hem de Zor seviye soru sorulur. 12 soruluk testte sallayarak tüm eksikleri gizlemek istatistiksel olarak imkansıza yakındır. Ayrıca telafi testinde %75 barajı olduğu için rastgele işaretleyen bir öğrencinin telafiyi geçip 'Hazır' rozeti alması mümkün değildir."*
