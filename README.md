# 🎓 HazırMısın? — Lise Matematik Adaptif Ön Değerlendirme & Akıllı Telafi Platformu

> **"Ders başlamadan 5 dakikada eksik olduğun saniyeyi yakala, derse tam hazır gir!"**

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-green.svg)](https://fastapi.tiangolo.com/)
[![Groq](https://img.shields.io/badge/AI-Groq%20Llama%203.3-orange.svg)](https://groq.com/)
[![License](https://img.shields.io/badge/License-MIT-lightgrey.svg)](LICENSE)

---

## 📌 Proje Hakkında

**HazırMısın?**, lise öğrencilerinin yeni bir matematik konusuna (örn. *10. Sınıf Fonksiyonlar*) başlamadan önce geçmiş yıllardan kalan kritik ön koşul eksikliklerini (**Kümeler**, **Cebirsel İfadeler**, **Koordinat Sistemi**, **1. Derece Denklemler**) ders başlamadan tespit eden ve saniyeler içinde telafi etmelerini sağlayan adaptif bir eğitim teknolojisi platformudur.

Geleneksel platformlar öğrenciye 45 dakikalık uzun videoları baştan izletirken, **HazırMısın?**:
1. 12 soruluk şıklı mikro ön test ile eksik alt kazanımı teşhis eder.
2. YouTube eğitim videolarını altyazı analiziyle dilimleyerek öğrenciyi **tam o konunun anlatıldığı saniyeye (`?t=saniye`)** yönlendirir.
3. **Groq Llama 3.3 70B** modeliyle öğrencinin ilgi alanına (futbol, müzik, oyun) göre soyut matematiği somutlaştıran bir **Bilişsel Köprü** kurar.
4. Sadece tespit edilen eksik konudan 6 soruluk mikro kavram testi uygular (%75 başarı eşiği ile).
5. Öğretmene tahtada **Canlı Takip Paneli** sunarak sınıfın hazır bulunuşluk oranını ve toplu eksik haritasını anlık olarak gösterir.

---

## 👥 Ekip ve Rol Dağılımı

| Ekip Üyesi | Rol | Sorumluluk Alanları |
| :--- | :--- | :--- |
| **Kişi A** | Yapay Zeka & NLP Mühendisi | Groq LLM prompt mimarisi, YouTube altyazı çekimi ve anlamsal transkript eşleme |
| **Kişi B** | Ön Yüz & Backend Geliştirici | Öğrenci mobil arayüzü, FastAPI uç noktaları ve test yürütme motoru |
| **Kişi C (Buse)** | İçerik Mimarı & Öğretmen Paneli & Pitch Lideri | 480 soruluk MEB uyumlu soru havuzu, `konu.json` ön koşul ağı, `hoca.html`/`hoca.js` canlı takip paneli, jüri sunumu ve demo planlaması |

---

## 📁 Proje Dizin Yapısı

```text
Sphinks/
├── backend/
│   ├── altyazi_servisi.py         # YouTube Transcript API servis sınıfı
│   ├── video_bolumleyici.py       # Transkript anahtar kelime eşleme ve zaman damgası üretici
│   ├── on_test_secici.py          # 12 soruluk şıklı ön değerlendirme test üreticisi
│   ├── kavram_testi_secici.py     # Eksik kazanıma özel 6 soruluk telafi test seçici (%75 eşik)
│   └── groq_promptlari.md         # Groq Llama 3.3 için video dilimleme ve bilişsel köprü promptları
├── content/
│   ├── konu.json                  # Dersler, alt kazanımlar ve ön koşul hiyerarşi matrisi
│   ├── soru_havuzu.json           # 480 özgün, şıklı, çözümlü soru havuzu (2 Ders x 4 Kazanım x 60 Soru)
│   └── videolar.json              # Rehber Matematik & Matematiğin Güler Yüzü doğrulanmış video katalogları
├── frontend/
│   ├── hoca.html                  # Öğretmen canlı sınıf takip paneli (Responsive, Dashboard)
│   └── hoca.js                    # Canlı veri akışı, 5sn otomatik yenileme ve dinamik QR kod motoru
└── README.md                      # Proje ana dokümantasyonu
```

---

## 🚀 Öne Çıkan Özellikler

### 1. 480 Soruluk Doğrulanmış Soru Havuzu (`content/soru_havuzu.json`)
- **2 Ana Ünite:** `fonksiyonlar` (10. Sınıf) ve `fonksiyonlar_2` (Bileşke & Ters Fonksiyon).
- **8 Kritik Alt Kazanım:** Kümeler, Cebirsel İfadeler, Koordinat Düzlemi, 1. Derece Denklemler, Tanım/Değer Kümesi, Özel Fonksiyonlar vb.
- **Dengeli Zorluk:** Her alt konuda 20 Kolay, 20 Orta, 20 Zor soru.
- **Pedagojik Gerekçe:** Her soru için doğru cevap ve detaylı adım adım çözüm açıklaması.

### 2. Akıllı Ön Test & Hedefe Yönelik Telafi Testi
- **Ön Test:** 4 alt kazanımdan 1'er Kolay, Orta, Zor soru (12 soru). Zorluk etiketleri gizlidir.
- **Telafi Testi:** Öğrenci yalnızca tökezlediği alt konudan 6 soru çözer. %75 barajını (en az 5 doğru) geçene kadar yönlendirme devam eder.

### 3. Groq LLM Destekli Bilişsel Köprü
- Öğrencinin ilgi alanına (örn. futbol) göre soyut matematik kavramını ilişkilendirir.
- *"x ve y değişkenlerini, serbest atış ve smaç sayıları gibi düşün..."* metaforuyla öğrencinin kavram yanılgısını giderir.

### 4. Öğretmen Canlı Takip Paneli (`frontend/hoca.html`)
- Sınıfın anlık hazır bulunuşluk yüzdesi (`%0` ➡️ `%100`).
- Sınıf genelinde en çok takılınan alt konuların dağılım grafiği.
- Öğrenci bazlı anlık durum takibi ("Derse Hazır" / "Eksik Gideriyor").
- Projeksiyondan öğrencilerin telefonla katılması için dinamik **Sınıf QR Kodu**.

---

## 🛠️ Kurulum ve Çalıştırma

### Gereksinimler
- Python 3.10 veya üzeri
- Modern bir web tarayıcısı (Chrome, Edge, Firefox)

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/Beyza-Kartal/Sphinks.git
cd Sphinks
```

### 2. Gerekli Python Kütüphanelerini Yükleyin
```bash
pip install fastapi uvicorn youtube-transcript-api groq
```

### 3. Backend ve Öğretmen Panelini Başlatın
- Öğretmen panelini doğrudan tarayıcıda açmak için:
  `frontend/hoca.html` dosyasını çift tıklayarak tarayıcınızda açabilirsiniz.
- Soru seçici ve telafi motorlarını test etmek için:
```bash
python backend/on_test_secici.py
python backend/kavram_testi_secici.py
```

---



## 📄 Lisans
Bu proje açık kaynak topluluğu ve eğitimde fırsat eşitliği için MIT lisansı altında geliştirilmiştir.

