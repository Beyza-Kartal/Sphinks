# Sahip: A (Beyza)
# Gorev: tablolar (konu, eksik, soru, video, bolum, sinif, ogrenci, deneme, cevap)
from typing import List, Optional

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


class Konu(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    ad: str
    sira: int = 0
    durum: str = "acik"  # acik | yakinda


class Eksik(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    konu_id: int = Field(foreign_key="konu.id")
    ad: str
    aciklama: str = ""


class Soru(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    konu_id: int = Field(foreign_key="konu.id")
    eksik_id: int = Field(foreign_key="eksik.id")
    tur: str  # ontest | tekrar1 | tekrar2
    metin: str
    secenekler: List[str] = Field(sa_column=Column(JSON))
    dogru_index: int


class Video(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    konu_id: int = Field(foreign_key="konu.id")
    kanal_adi: str
    youtube_id: str
    toplam_sure: int = 0


class Bolum(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    video_id: int = Field(foreign_key="video.id")
    eksik_id: int = Field(foreign_key="eksik.id")
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
    konu_id: int = Field(foreign_key="konu.id")
    hoca_id: Optional[int] = Field(default=None, foreign_key="hoca.id")


class Ogrenci(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    sinif_id: int = Field(foreign_key="sinif.id")
    isim: str


class Deneme(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    ogrenci_id: int = Field(foreign_key="ogrenci.id")
    konu_id: int = Field(foreign_key="konu.id")
    durum: str = "basladi"
    bulunan_eksik_id: Optional[int] = Field(default=None, foreign_key="eksik.id")
    izlenen_saniye: int = 0


class Cevap(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    deneme_id: int = Field(foreign_key="deneme.id")
    soru_id: int = Field(foreign_key="soru.id")
    secilen_index: int
    dogru_mu: bool
