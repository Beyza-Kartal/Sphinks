"""
MODÜL: on_test_secici.py
GÖREV: Şıklı Ön Koşul Hazırlık Testi üretir ve öğrencinin cevaplarını
       kontrol ederek eksik alt konuyu otomatik tespit eder.
"""

import json
import os
import random


class OnTestSecici:
    """Ön koşul sınavı üreten ve cevapları kontrol eden servis sınıfı."""

    def __init__(self, havuz_dosya_yolu="content/soru_havuzu.json"):
        if not os.path.exists(havuz_dosya_yolu):
            havuz_dosya_yolu = os.path.join("..", havuz_dosya_yolu)

        if not os.path.exists(havuz_dosya_yolu):
            raise FileNotFoundError(f"Soru havuzu dosyası bulunamadı: {havuz_dosya_yolu}")

        with open(havuz_dosya_yolu, "r", encoding="utf-8") as dosya:
            self.havuz = json.load(dosya)

    def test_olustur(self, ders_id="fonksiyonlar"):
        """Öğrenciye gösterilecek şıklı ön testi üretir."""
        on_test_paketi = {}
        ders_havuzu = self.havuz.get(ders_id, {})

        for alt_konu_id, seviyeler in ders_havuzu.items():
            on_test_paketi[alt_konu_id] = []
            for seviye in ["kolay", "orta", "zor"]:
                sorular = seviyeler.get(seviye, [])
                if sorular:
                    secilen = random.choice(sorular)
                    on_test_paketi[alt_konu_id].append({
                        "soru_id": secilen["id"],
                        "alt_konu": alt_konu_id,
                        "zorluk": seviye,  # Arka planda analiz için saklanır
                        "soru": secilen["soru"],
                        "secenekler": secilen["secenekler"],
                        "dogru_cevap": secilen["cevap"],
                        "cozum": secilen["cozum"]
                    })

        return on_test_paketi

    def cevaplari_degerlendir(self, test_paketi: dict, ogrenci_cevaplari: dict):
        """
        Öğrencinin işaretlediği şıkları kontrol eder.
        Hangi alt konularda eksik olduğunu hesaplar.
        """
        toplam_soru = 0
        dogru_sayisi = 0
        yanlis_sayisi = 0
        alt_konu_analizi = {}
        eksik_alt_konular = []

        for alt_konu_id, soru_listesi in test_paketi.items():
            k_dogru = 0
            k_toplam = len(soru_listesi)

            for s in soru_listesi:
                toplam_soru += 1
                s_id = s["soru_id"]
                verilen_cevap = ogrenci_cevaplari.get(s_id, "").upper().strip()

                if verilen_cevap == s["dogru_cevap"]:
                    dogru_sayisi += 1
                    k_dogru += 1
                else:
                    yanlis_sayisi += 1

            basari_yuzdesi = round((k_dogru / k_toplam) * 100, 1)
            alt_konu_analizi[alt_konu_id] = {
                "toplam": k_toplam,
                "dogru": k_dogru,
                "yanlis": k_toplam - k_dogru,
                "basari_yuzdesi": basari_yuzdesi
            }

            # Eğer alt konuda başarı %50'nin altındaysa eksik kabul edilir
            if basari_yuzdesi < 60:
                eksik_alt_konular.append(alt_konu_id)

        genel_puan = round((dogru_sayisi / toplam_soru) * 100, 1)

        return {
            "toplam_soru": toplam_soru,
            "dogru": dogru_sayisi,
            "yanlis": yanlis_sayisi,
            "genel_puan": genel_puan,
            "derse_hazir_mi": len(eksik_alt_konular) == 0,
            "eksik_alt_konular": eksik_alt_konular,
            "alt_konu_detaylari": alt_konu_analizi
        }
# Dosyayı doğrudan terminalden çalıştırdığında soruları ekrana basan kısım:
if __name__ == "__main__":
    secici = OnTestSecici()
    test = secici.test_olustur("fonksiyonlar")

    print("\n" + "=" * 50)
    print("📋 ÖN KOŞUL HAZIRLIK SINAVI")
    print("=" * 50)

    soru_sayaci = 1
    for alt_konu, sorular in test.items():
        print(f"\n📂 KATEGORİ: {alt_konu.upper()}")
        print("-" * 30)
        for s in sorular:
            print(f"{soru_sayaci}) {s['soru']}")
            for sik, metin in s["secenekler"].items():
                print(f"   {sik}) {metin}")
            print()  # Sorular arasına bir boşluk bırakır
            soru_sayaci += 1    