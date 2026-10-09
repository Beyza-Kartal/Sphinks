"""
MODÜL: video_bolumleyici.py
GÖREV: YouTube transkriptini konu alt başlıklarına göre bölümler
       ve öğrencinin eksiğine göre videonun tam saniyesini açan link üretir.
"""

import re


class VideoBolumleyici:
    """Videoları alt konulara göre saniyelere bölen ve öneri üreten sınıf."""

    def __init__(self, min_sure_saniye=30):
        self.min_sure_saniye = min_sure_saniye

        # Hangi kelimelerin hangi alt konuyu anlattığını belirleyen anahtar kelimeler
        self.anahtar_kelimeler = {
            "kumeler_ve_ikililer": [
                "küme", "kümeler", "eleman", "boş küme", "alt küme",
                "sıralı ikili", "kartezyen", "kartezyen çarpım", "ikililer"
            ],
            "cebirsel_ifadeler": [
                "cebirsel", "cebirsel ifade", "katsayı", "sabit terim",
                "terim", "dağılma", "harfli ifade", "x yerine", "parantez"
            ],
            "koordinat_sistemi": [
                "koordinat", "apsis", "ordinat", "analitik düzlem",
                "orijin", "eksen", "x ekseni", "y ekseni", "bölge", "nokta"
            ],
            "birinci_derece_denklemler": [
                "denklem", "birinci derece", "bilinmeyen", "kök",
                "denklem çözme", "eşitlik", "yalnız bırak", "payda eşitle"
            ]
        }

    def metni_temizle(self, metin: str) -> str:
        """Altyazı metnindeki gereksiz boşluk ve satır sonlarını temizler."""
        metin = metin.lower().replace("\n", " ")
        return re.sub(r"\s+", " ", metin).strip()

    def cumlede_konu_bul(self, cumle: str):
        """Bir cümlenin hangi alt konudan bahsettiğini tespit eder."""
        temiz = self.metni_temizle(cumle)
        puanlar = {}

        for alt_konu, kelimeler in self.anahtar_kelimeler.items():
            eslesme = sum(1 for kelime in kelimeler if kelime in temiz)
            if eslesme > 0:
                puanlar[alt_konu] = eslesme

        if not puanlar:
            return None

        # En çok kelime eşleşmesi olan alt konuyu seçer
        return max(puanlar, key=puanlar.get)

    def videoyu_bolumle(self, altyazi_parcalari: list) -> list:
        """
        Altyazı cümlelerini baştan sona tarayarak videoyu
        başlangıç ve bitiş saniyeleriyle alt konu bölümlerine ayırır.
        """
        bolumler = []
        aktif_konu = None
        baslangic = None
        bitis = None

        for parca in altyazi_parcalari:
            metin = parca.get("metin", "")
            p_basla = parca.get("baslangic", 0.0)
            p_bitir = parca.get("bitis", p_basla)

            tespit = self.cumlede_konu_bul(metin)

            if aktif_konu is None:
                if tespit is not None:
                    aktif_konu = tespit
                    baslangic = p_basla
                    bitis = p_bitir
                continue

            # Aynı konu devam ediyorsa veya o cümlede özel bir kelime yoksa devam et
            if tespit == aktif_konu or tespit is None:
                bitis = p_bitir
                continue

            # Farklı bir alt konuya geçildi!
            sure = bitis - baslangic
            if sure >= self.min_sure_saniye:
                bolumler.append({
                    "alt_konu": aktif_konu,
                    "baslangic": round(baslangic, 1),
                    "bitis": round(bitis, 1),
                    "sure": round(sure, 1)
                })

            aktif_konu = tespit
            baslangic = p_basla
            bitis = p_bitir

        # Son bölümü ekle
        if aktif_konu is not None and baslangic is not None:
            sure = bitis - baslangic
            if sure >= self.min_sure_saniye:
                bolumler.append({
                    "alt_konu": aktif_konu,
                    "baslangic": round(baslangic, 1),
                    "bitis": round(bitis, 1),
                    "sure": round(sure, 1)
                })

        return bolumler

    def ogrenciye_oneri_uret(self, video_id: str, bolumler: list, eksik_alt_konu: str):
        """
        Öğrencinin eksiğine göre videonun tam o dakikasını açan link üretir.
        """
        for bolum in bolumler:
            if bolum["alt_konu"] == eksik_alt_konu:
                baslangic_sn = int(bolum["baslangic"])
                dakika = baslangic_sn // 60
                saniye = baslangic_sn % 60

                # YouTube'da tam o saniyeden başlatan link formatı: ?t=...
                izleme_linki = f"https://youtu.be/{video_id}?t={baslangic_sn}"

                return {
                    "bulundu": True,
                    "alt_konu": eksik_alt_konu,
                    "dakika_metni": f"{dakika:02d}:{saniye:02d}",
                    "baslangic_saniye": baslangic_sn,
                    "izleme_linki": izleme_linki,
                    "mesaj": f"Eksik konun videoda {dakika:02d}:{saniye:02d} dakikasında anlatılıyor. Buradan izleyebilirsin!"
                }

        # Eğer videoda bu konu özel olarak geçmediyse videonun başını önerir
        return {
            "bulundu": False,
            "alt_konu": eksik_alt_konu,
            "dakika_metni": "00:00",
            "izleme_linki": f"https://youtu.be/{video_id}",
            "mesaj": "Bu video genel bir anlatımdır, baştan izlemen önerilir."
        }


# ========================================================
# DİKKAT: SINIFIN TAMAMEN DIŞINDA VE EN SOLDA:
# ========================================================
if __name__ == "__main__":
    from altyazi_servisi import AltyaziServisi

    print("1. Video altyazısı çekiliyor...")
    servis = AltyaziServisi()
    test_linki = "https://youtu.be/M-Bufmo1Bz8"
    veri = servis.altyazi_getir(test_linki)

    print("2. Video alt konulara bölümleniyor...")
    bolumleyici = VideoBolumleyici(min_sure_saniye=30)
    bolumler = bolumleyici.videoyu_bolumle(veri["parcalar"])

    print(f"\n✅ Toplam {len(bolumler)} farklı konu bölümü tespit edildi:")
    for b in bolumler:
        dakika = int(b['baslangic']) // 60
        saniye = int(b['baslangic']) % 60
        print(f" - [{b['alt_konu'].upper()}] Başlangıç: {dakika:02d}:{saniye:02d} (Süre: {int(b['sure'])} sn)")

    print("\n" + "=" * 60)
    print("🎯 ÖĞRENCİ SİMÜLASYONU:")
    print("Öğrencinin eksiği: 'kumeler_ve_ikililer' çıktı varsayalım:")
    print("=" * 60)

    oneri = bolumleyici.ogrenciye_oneri_uret(veri["video_id"], bolumler, "kumeler_ve_ikililer")
    print(oneri["mesaj"])
    print(f"🔗 Tıklanabilir YouTube Linki: {oneri['izleme_linki']}")