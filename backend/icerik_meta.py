# Sahip: A (Beyza)
# Gorev: ders/unite/konu meta bilgisi.
#
# DUZELTME (21:5x): content/soru_havuzu.json'da "fonksiyonlar_2" AYRI BIR
# UST SEVIYE ANAHTAR olarak duruyor (fonksiyonlar'in ICINDE degil, ona
# KARDES bir anahtar). Once bunu yanlis okudum ("fonksiyonlar" icinde sadece
# 4 konu var" diye raporladim) - asil hata buydu, veri hep oradaydi. ders_id
# her unite icin dogru UST SEVIYE anahtari gostermeli.
UNITELER = {
    "fonksiyonlar_1": {
        "ad": "Fonksiyonlar 1 (Ön Koşul Konular)",
        "ders_id": "fonksiyonlar",
        "konular": [
            "kumeler_ve_ikililer",
            "cebirsel_ifadeler",
            "koordinat_sistemi",
            "birinci_derece_denklemler",
        ],
    },
    "fonksiyonlar_2": {
        "ad": "Fonksiyonlar 2",
        "ders_id": "fonksiyonlar_2",
        "konular": [
            "fonksiyon_tanimi_ve_deger",
            "fonksiyon_turleri",
            "dogrusal_fonksiyon_grafigi",
            "bileske_ve_ters_fonksiyon",
        ],
    },
}

ALT_KONU_ETIKET = {
    "kumeler_ve_ikililer": "Kümeler ve Sıralı İkililer",
    "cebirsel_ifadeler": "Cebirsel İfadeler",
    "koordinat_sistemi": "Koordinat Sistemi",
    "birinci_derece_denklemler": "Birinci Derece Denklemler",
    "fonksiyon_tanimi_ve_deger": "Fonksiyon Tanımı ve Değeri",
    "fonksiyon_turleri": "Fonksiyon Türleri",
    "dogrusal_fonksiyon_grafigi": "Doğrusal Fonksiyon Grafiği",
    "bileske_ve_ters_fonksiyon": "Bileşke ve Ters Fonksiyon",
}
