# Sahip: A (Beyza)
# Gorev: tablolar.
#
# NOT - MIMARI DEGISIKLIGI (18:xx): konu/eksik/soru tablolari KALDIRILDI.
# Sebep: buse (C) soru icerigini content/soru_havuzu.json dosyasinda
# (ders_id -> alt_konu_id -> zorluk -> soru listesi) hazirladi; sorular artik
# veritabaninda degil, dogrudan bu JSON dosyasindan okunuyor (bkz. on_test_secici.py).
# Bu yuzden "sinif" artik bir Konu satirina degil, dogrudan ders_id (string,
# orn. "fonksiyonlar") degerine bagli. Detay: GUNLUK.md.
from typing import List, Optional

from sqlmodel import Field, SQLModel


class Video(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    ders_id: str
    kanal_adi: str
    youtube_id: str
    toplam_sure: int = 0


class Bolum(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    video_id: int = Field(foreign_key="video.id")
    alt_konu_id: str
    baslik: str
    baslangic_sn: int
    bitis_sn: int
    transkript: str = ""


# NOT: Bu tablo plandaki orijinal "mimari ve yapim plani" dokumaninda yok.
# Hoca login + sifre degistirme ekrani takimca sonradan eklenmesi istendi (bkz. GUNLUK.md).
class Hoca(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str
    sifre_hash: str


class Sinif(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    kod: str
    ders_id: str  # orn. "fonksiyonlar" - content/soru_havuzu.json'daki ust seviye anahtar
    unite_id: str = "fonksiyonlar_1"  # bkz. icerik_meta.UNITELER - ders_id'nin alt kumesi
    hoca_id: Optional[int] = Field(default=None, foreign_key="hoca.id")


class Ogrenci(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    sinif_id: int = Field(foreign_key="sinif.id")
    isim: str


class Deneme(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    ogrenci_id: int = Field(foreign_key="ogrenci.id")
    sinif_id: int = Field(foreign_key="sinif.id")
    durum: str = "basladi"  # basladi | test_bitti
    bulunan_alt_konu: Optional[str] = None
    son_tekrar_dogru: Optional[int] = None
    son_tekrar_toplam: Optional[int] = None
    son_tekrar_puan: Optional[float] = None


class Cevap(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    deneme_id: int = Field(foreign_key="deneme.id")
    soru_id: str
    alt_konu_id: str
    secilen_harf: str
    dogru_mu: bool
