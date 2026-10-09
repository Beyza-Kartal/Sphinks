"""
MODÜL: kavram_testi_secici.py
GÖREV: Öğrencinin video izleme çalışmasının işe yarayıp yaramadığını ölçer.
       SADECE eksik çıkan alt konudan 2 Kolay, 2 Orta, 2 Zor (toplam 6 soru)
       şıkkı soru üretir ve %75 eşiğiyle değerlendirir.
"""

import json
import os
import random


class KavramTestiSecici:
    """Eksik konunun telafi edilip edilmediğini ölçen servis sınıfı."""

    def __init__(self, havuz_dosya_yolu="content/soru_havuzu.json", basari_esigi=75):
        self.basari_esigi = basari_esigi  # En az %75 başarı aranır (6'da 5 doğru!)

        if not os.path.exists(havuz_dosya_yolu):
            havuz_dosya_yolu = os.path.join("..", havuz_dosya_yolu)

        if not os.path.exists(havuz_dosya_yolu):
            raise FileNotFoundError(f"Soru havuzu dosyası bulunamadı: {havuz_dosya_yolu}")

        with open(havuz_dosya_yolu, "r", encoding="utf-8") as dosya:
            self.havuz = json.load(dosya)

    def test_olustur(self, ders_id="fonksiyonlar", eksik_alt_konu="cebirsel_ifadeler"):
        """
        SADECE öğrencinin eksik çıkan alt konusundan
        2 Kolay, 2 Orta, 2 Zor (toplam 6 soru) seçer.
        (Zorluk derecesi arka planda saklanır, öğrenciye görünmez).
        """
        alt_konu_havuzu = self.havuz.get(ders_id, {}).get(eksik_alt_konu, {})

        if not alt_konu_havuzu:
            raise ValueError(f"'{ders_id}' dersinde '{eksik_alt_konu}' adında bir alt konu bulunamadı!")

        secilen_sorular = []
        for seviye in ["kolay", "orta", "zor"]:
            sorular = alt_konu_havuzu.get(seviye, [])
            adet = min(2, len(sorular))
            secilenler = random.sample(sorular, adet)
            for s in secilenler:
                secilen_sorular.append({
                    "soru_id": s["id"],
                    "alt_konu": eksik_alt_konu,
                    "zorluk": seviye,
                    "soru": s["soru"],
                    "secenekler": s["secenekler"],
                    "dogru_cevap": s["cevap"],
                    "cozum": s["cozum"]
                })

        return {
            "ders_id": ders_id,
            "eksik_alt_konu": eksik_alt_konu,
            "toplam_soru": len(secilen_sorular),
            "sorular": secilen_sorular
        }

    def cevaplari_degerlendir(self, test_verisi: dict, ogrenci_cevaplari: dict):
        """
        Video çalışmasının işe yarayıp yaramadığını puanlar (%75 eşiği).
        """
        sorular = test_verisi["sorular"]
        dogru_sayisi = 0
        eksik_konu = test_verisi["eksik_alt_konu"]

        for s in sorular:
            s_id = s["soru_id"]
            verilen = ogrenci_cevaplari.get(s_id, "").upper().strip()
            if verilen == s["dogru_cevap"]:
                dogru_sayisi += 1

        toplam = len(sorular)
        yanlis = toplam - dogru_sayisi
        basari_puani = round((dogru_sayisi / toplam) * 100, 1)

        # %75 ve üzeri başarı (6 soruda en az 5 doğru)
        calisma_ise_yaradi_mi = basari_puani >= self.basari_esigi

        return {
            "alt_konu": eksik_konu,
            "toplam_soru": toplam,
            "dogru": dogru_sayisi,
            "yanlis": yanlis,
            "puan": basari_puani,
            "basari_esigi": self.basari_esigi,
            "calisma_ise_yaradi_mi": calisma_ise_yaradi_mi,
            "mesaj": f"🎉 TEBRİKLER! Video çalışması işe yaradı, '{eksik_konu.upper()}' eksiğini kapattın! Artık derse hazırsın." if calisma_ise_yaradi_mi else f"⚠️ ÇALIŞMA YETERSİZ KALDI! %{basari_puani} aldın (Hedef: %{self.basari_esigi}). Lütfen videonun o bölümünü bir kez daha dikkatle izle."
        }


# ========================================================
# DİKKAT: SINIFIN TAMAMEN DIŞINDA VE EN SOLDA:
# ========================================================
if __name__ == "__main__":
    secici = KavramTestiSecici(basari_esigi=75)

    # Simülasyon: Öğrencinin ön testte 'cebirsel_ifadeler' eksiği çıktı ve video izledi
    test = secici.test_olustur("fonksiyonlar", "cebirsel_ifadeler")

    print("\n" + "=" * 65)
    print(f"🎯 VİDEO SONRASI KAVRAM TESTİ: {test['eksik_alt_konu'].upper()}")
    print("Soru Sayısı: 6 Soru (2 Kolay + 2 Orta + 2 Zor)")
    print("=" * 65)

    ornek_cevaplar = {}
    for idx, s in enumerate(test["sorular"], start=1):
        print(f"\n{idx}) {s['soru']}")
        for sik, metin in s["secenekler"].items():
            print(f"   {sik}) {metin}")

        # Simülasyon: 6 sorudan 5'ini doğru bilsin (%83.3 alacak)
        if idx <= 5:
            ornek_cevaplar[s["soru_id"]] = s["dogru_cevap"]
        else:
            ornek_cevaplar[s["soru_id"]] = "A"

    print("\n" + "=" * 65)
    print("📊 ÇALIŞMA İŞE YARADI MI? KONTROL EDİLİYOR...")
    print("=" * 65)

    karne = secici.cevaplari_degerlendir(test, ornek_cevaplar)
    print(f"Doğru Sayısı: {karne['dogru']}/{karne['toplam_soru']} (Puan: %{karne['puan']})")
    print(f"Hedef Eşik: %{karne['basari_esigi']}")
    print(f"Sonuç: {'✅ ÇALIŞMA BAŞARILI, EKSİK KAPANDI' if karne['calisma_ise_yaradi_mi'] else '❌ TEKRAR İZLE'}")
    print(f"\n{karne['mesaj']}")