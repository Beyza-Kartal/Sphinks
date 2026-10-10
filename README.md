# ⚡ Kıvılcım — Lise Matematik Adaptif Ön Değerlendirme & Akıllı Telafi Platformu

> **"Anlamak bazen tek bir kıvılcıma bakar."**  
> *"Ders başlamadan 5 dakikada eksik olduğun saniyeyi yakala, derse tam hazır gir!"*

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![SQLModel](https://img.shields.io/badge/Database-SQLModel%20%2F%20SQLite-blueviolet.svg)](https://sqlmodel.tiangolo.com/)
[![Groq AI](https://img.shields.io/badge/AI-Groq%20Llama%203.3%20%2F%20GPT--OSS-orange.svg?logo=groq&logoColor=white)](https://groq.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Canlı%20ve%20Doğrulanmış-brightgreen.svg)]()

---

## 📌 Proje Hakkında

**Kıvılcım**, lise öğrencilerinin yeni bir matematik konusuna (özellikle soyut ve kırılgan bir konu olan *10. Sınıf Fonksiyonlar*) başlamadan önce geçmiş yıllardan kalan kritik ön koşul eksikliklerini (**Kümeler & Sıralı İkililer**, **Cebirsel İfadeler**, **Koordinat Düzlemi**, **1. Derece Denklemler**) ders başlamadan saniyeler içinde tespit eden ve hedefe yönelik telafi sağlayan yapay zeka destekli adaptif bir eğitim teknolojisi platformudur.

### ❓ Karşılaşılan Problem
Geleneksel eğitim süreçlerinde ve mevcut video platformlarında:
* Öğretmen sınıfa girdiğinde 30 öğrencinin hangi ön koşul kazanımlarında takıldığını göremez.
* Öğrenci dersi anlayamadığında YouTube'u açtığında karşısına 40-50 dakikalık uzun genel tekrar videoları çıkar; videonun hangi 2 dakikasına ihtiyacı olduğunu bilmediği için sıkılır ve vazgeçer.
* Soyut matematik kavramlarında takılınan noktaların adım adım pedagojik çözümü sunulmadığı için öğrenme kalıcı hale gelmez.

### 💡 Kıvılcım'ın Çözümü (3 Adımlı Adaptif Döngü)
1. **Mikro Ön Test (Pre-Assessment):** 4 temel alt kazanımdan Kolay-Orta-Zor seviyelerde 12 soruluk şıklı mikro ön test ile öğrencinin pedagojik eksik haritası çıkarılır.
2. **Nokta Atışı Video Dilimleme & Adım Adım Soru Çözümü:**
   - YouTube Transcript API ve Groq AI NLP analitiğiyle öğrenci uzun videolara boğulmadan doğrudan **o konunun anlatıldığı tam saniyeye (`?t=saniye`)** yönlendirilir.
   - **Adım Adım Çözüm ve Pedagojik Açıklama:** Öğrencinin testte yanlış yaptığı veya takıldığı soruların adım adım detaylı çözümleri sunularak kavram yanılgıları doğrudan giderilir.
3. **Hedefe Yönelik Telafi Kavram Testi:** Öğrenciye tüm konuyu baştan çözdürmek yerine yalnızca tökezlediği alt konudan 6 soruluk mikro kavram testi uygulanır (%75 barajı ile öğrenmenin gerçekleştiği doğrulanır).
4. **Öğretmen Canlı Takip Paneli (Dashboard):** Öğretmene anlık hazır bulunuşluk oranı (%0 ➡️ %100) ve sınıfın ortak eksik dağılım grafiğini canlı olarak sunar.

---

## 👥 Ekip ve Rol Dağılımı

| Ekip Üyesi | Rol | Sorumluluk Alanları |
| :--- | :--- | :--- |
| **Beyza** | Yapay Zeka & NLP Mühendisi | Groq LLM prompt mimarisi, video anlamsal transkript eşleme, FastAPI mimarisi |
| **Sırdaş** | Ön Yüz & Öğrenci Deneyimi Geliştirici | Öğrenci mobil ve masaüstü arayüzü (ogrenci.html / ogrenci.js), test yürütme motoru, API fallback/mock katmanı, jüri sunumu |
| **Gülderen Buse** | İçerik Mimarı & Öğretmen Paneli | 480 soruluk MEB uyumlu soru havuzu (soru_havuzu.json), canlı takip paneli (hoca.html / hoca.js), demo liderliği, YouTube altyazı çekimi |

---

## 📁 Proje Dizin Yapısı

```text
Sphinks/
├── backend/
│   ├── main.py                    # FastAPI uygulama sunucusu, statik yönlendirmeler ve router entegrasyonu
│   ├── models.py                  # SQLModel veritabanı şemaları (Video, Bolum, Hoca, Sinif, Ogrenci, Deneme, Cevap)
│   ├── db.py                      # SQLite veritabanı bağlantısı, oturum yönetimi ve tablo üretici
│   ├── api_ogrenci.py             # Öğrenci uç noktaları (/api/giris, /api/test/basla, /api/test/bitir)
│   ├── api_hoca.py                # Öğretmen uç noktaları (kayıt, giriş, sınıf açma, şifre değiştirme, canlı panel)
│   ├── teshis.py                  # Eksik alt konuya göre video zaman damgalarını getiren servis (/api/teshis)
│   ├── on_test_secici.py          # 12 soruluk şıklı ön değerlendirme test üreticisi ve değerlendirme motoru
│   ├── kavram_testi_secici.py     # Eksik kazanıma özel 6 soruluk telafi test seçici (%75 başarı eşiği)
│   ├── altyazi_servisi.py         # YouTube Transcript API servis sınıfı
│   ├── video_bolumleyici.py       # Transkript anahtar kelime eşleme ve zaman damgası üretici
│   ├── llm.py                     # Groq LLM transkript bölümleme fonksiyonları
│   ├── video_isle.py              # YouTube videolarını altyazı + Groq ile işleyip veritabanına kaydeden script
│   └── groq_promptlari.md         # Groq Llama 3.3 için video dilimleme ve bilişsel prompt sistem istemleri
├── content/
│   ├── soru_havuzu.json           # 480 özgün, MEB uyumlu, çözümlü soru havuzu (2 Ünite x 4 Kazanım x 60 Soru)
│   ├── videolar.json              # Rehber Matematik & Matematiğin Güler Yüzü doğrulanmış video kataloğu
│   └── konu.json                  # Dersler ve alt kazanım ilişkileri
├── frontend/
│   ├── index.html                 # Birleşik karşılama ve giriş sayfası (Öğrenci & Öğretmen Portalı)
│   ├── ogrenci.html               # Öğrenci akış kabuğu (Test, Teşhis, Video, Telafi)
│   ├── ogrenci.js                 # Öğrenci mantığı, dinamik ekran geçişleri ve API/Mock adaptörü
│   ├── hoca.html                  # Öğretmen canlı sınıf takip paneli (Dashboard & Projeksiyon Ekranı)
│   ├── hoca.js                    # Canlı veri akışı, 5 saniye otomatik yenileme ve panel motoru
│   └── style.css                  # Modern tasarım sistemi, dark/light mod değişkenleri ve responsive düzen
├── srdas/                         # Figma Make prototipinden dönüştürülmüş React + Vite alternatif arayüzü
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
├── API.md                         # Güncel RESTful API sözleşmesi ve veri modelleri dokümantasyonu
├── requirements.txt               # Python kütüphane bağımlılıkları
├── .env.example                   # Ortam değişkenleri örnek şablonu
└── README.md                      # Proje ana dokümantasyonu
```

---

## 🚀 Öne Çıkan Özellikler

### 1. 480 Soruluk Doğrulanmış Soru Havuzu (`content/soru_havuzu.json`)
- **2 Ana Ünite:** `fonksiyonlar` (10. Sınıf Giriş) ve `fonksiyonlar_2` (Bileşke & Ters Fonksiyon).
- **8 Kritik Alt Kazanım:** Kümeler ve Sıralı İkililer, Cebirsel İfadeler, Koordinat Sistemi, 1. Derece Denklemler, Tanım ve Değer Kümesi, Özel Fonksiyon Türleri, Bileşke Fonksiyon, Ters Fonksiyon.
- **Pedagojik Zorluk Dengesi:** Her alt konuda tam 20 Kolay, 20 Orta, 20 Zor soru.
- **Detaylı Çözümler:** Her sorunun doğru cevabıyla birlikte öğrencinin kavram yanılgısını gideren adım adım açıklayıcı çözüm metni mevcuttur.

### 2. Akıllı Ön Test & Güvenli Toplu Değerlendirme
- `/api/test/basla` ile tüm test tek seferde üretilir; ancak kopya çekilmemesi adına **doğru cevaplar ve çözümler istemciye asla gönderilmez**.
- Öğrenci testi tamamladığında tüm cevaplar `/api/test/bitir` ile sunucuya iletilir; alt konu başarı yüzdeleri anlık olarak hesaplanır.

### 3. Hedef Saniyeli Video & Adım Adım Soru Çözümleri
- YouTube videosunun tamamı yerine yalnızca eksiğin anlatıldığı saniye aralığı (`?t=baslangic_sn`) açılır.
- Öğrencinin testte yanlış yaptığı soruların adım adım çözümleri ve pedagojik açıklamaları sunularak eksik kavramlar pekiştirilir.

### 4. Öğretmen Canlı Takip Paneli (`frontend/hoca.html`)
- **Otomatik Sınıf Kodu Üretimi:** Öğretmen sınıf oluşturduğunda 6 haneli benzersiz katılım kodu otomatik üretilir.
- **Canlı Metrikler:** Sınıf hazır bulunuşluk oranı (`%0` ➡️ `%100`), ortak eksik analizi ve öğrenci durum tablosu 5 saniyede bir otomatik güncellenir.

---

## 🔮 Geliştirilebilir Alanlar
- **Tahta QR Kodu:** Projeksiyondan yansıtılan dinamik QR kodu okutan öğrenciler anında teste başlar.

---

## 🛠️ Kurulum ve Çalıştırma

### Gereksinimler
- Python 3.10 veya üzeri
- Git
- (İsteğe bağlı) Node.js 18+ (yalnızca `srdas/` React ön yüzü çalıştırılmak istenirse)

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/Beyza-Kartal/Sphinks.git
cd Sphinks
```

### 2. Sanal Ortam Oluşturun ve Bağımlılıkları Yükleyin
```bash
# Sanal ortam oluşturma
python -m venv venv

# Sanal ortamı aktifleştirme (Windows)
.\venv\Scripts\activate
# (macOS/Linux için: source venv/bin/activate)

# Bağımlılıkları yükleme
pip install -r requirements.txt
```

### 3. Ortam Değişkenlerini Tanımlayın
Kök dizinde `.env` dosyası oluşturun ve Groq API anahtarınızı girin:
```env
GROQ_API_KEY=gsk_sizin_groq_api_anahtariniz
```

### 4. Backend Sunucusunu Başlatın
```bash
uvicorn backend.main:app --reload --port 8000
```
Sunucu başladığında SQLite veritabanı tabloları otomatik oluşturulur.

### 5. Canlı Arayüze Erişin
Platformun canlı arayüzüne aşağıdaki bağlantıdan erişebilirsiniz:  
👉 [https://greene-fought-someone-analytical.trycloudflare.com/index.html](https://greene-fought-someone-analytical.trycloudflare.com/index.html)

---

## 📄 Lisans
Bu proje, eğitimde fırsat eşitliğini desteklemek ve açık kaynak ekosistemine katkı sağlamak amacıyla **MIT Lisansı** altında geliştirilmiştir.
