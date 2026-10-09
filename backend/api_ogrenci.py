# Sahip: A (Beyza)
# Gorev: ogrenci uclari (/api/giris, /api/test/basla, /api/test/bitir)
#
# NOT - MIMARI DEGISIKLIGI (18:xx): Eskiden tek soru -> cevap -> sonraki soru
# seklinde ilerliyorduk. Artik buse'nin on_test_secici.py modulu butun testi
# tek seferde uretiyor (8 alt konu x 3 zorluk = 24 soru). Akis simdi:
#   1) /api/test/basla  -> deneme acilir, TUM sorular (cevapsiz) donulur
#   2) ogrenci hepsini cevaplar (arayuzde tek tek gosterilebilir, backend'e
#      tek seferde gonderilir)
#   3) /api/test/bitir   -> cevaplar topluca degerlendirilir, eksik alt
#      konular + genel puan donulur
# Detay ve neden: GUNLUK.md.
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from backend import models
from backend.db import get_session
from backend.on_test_secici import OnTestSecici

router = APIRouter()
_secici = OnTestSecici()

# deneme_id -> dogru cevaplariyla BIRLIKTE orijinal test paketi.
# Sadece sunucu tarafinda tutulur, ogrenciye hic gonderilmez (guvenlik).
_aktif_testler: dict[int, dict] = {}


class GirisIstegi(BaseModel):
    sinif_kodu: str
    isim: str


class TestBaslaIstegi(BaseModel):
    ogrenci_id: int
    sinif_id: int


class TestBitirIstegi(BaseModel):
    deneme_id: int
    cevaplar: dict[str, str]  # {soru_id: secilen_harf}


def _ogrenciye_gonderilecek_sorular(test_paketi: dict) -> list[dict]:
    # dogru_cevap ve cozum bilerek CIKARILIYOR; ogrenci bunlari gormemeli.
    sorular = []
    for alt_konu_id, soru_listesi in test_paketi.items():
        for soru in soru_listesi:
            sorular.append(
                {
                    "soru_id": soru["soru_id"],
                    "alt_konu": alt_konu_id,
                    "soru": soru["soru"],
                    "secenekler": soru["secenekler"],
                }
            )
    return sorular


@router.post("/api/giris")
def giris(istek: GirisIstegi, session: Session = Depends(get_session)):
    sinif = session.exec(
        select(models.Sinif).where(models.Sinif.kod == istek.sinif_kodu)
    ).first()
    if not sinif:
        raise HTTPException(status_code=404, detail="Sinif kodu bulunamadi")

    ogrenci = session.exec(
        select(models.Ogrenci).where(
            models.Ogrenci.sinif_id == sinif.id, models.Ogrenci.isim == istek.isim
        )
    ).first()
    if not ogrenci:
        ogrenci = models.Ogrenci(sinif_id=sinif.id, isim=istek.isim)
        session.add(ogrenci)
        session.commit()
        session.refresh(ogrenci)

    return {"ogrenci_id": ogrenci.id, "sinif_id": sinif.id, "ders_id": sinif.ders_id}


@router.post("/api/test/basla")
def test_basla(istek: TestBaslaIstegi, session: Session = Depends(get_session)):
    sinif = session.get(models.Sinif, istek.sinif_id)
    if not sinif:
        raise HTTPException(status_code=404, detail="Sinif bulunamadi")

    deneme = models.Deneme(
        ogrenci_id=istek.ogrenci_id, sinif_id=sinif.id, durum="basladi"
    )
    session.add(deneme)
    session.commit()
    session.refresh(deneme)

    test_paketi = _secici.test_olustur(sinif.ders_id)
    _aktif_testler[deneme.id] = test_paketi

    return {"deneme_id": deneme.id, "sorular": _ogrenciye_gonderilecek_sorular(test_paketi)}


@router.post("/api/test/bitir")
def test_bitir(istek: TestBitirIstegi, session: Session = Depends(get_session)):
    deneme = session.get(models.Deneme, istek.deneme_id)
    test_paketi = _aktif_testler.get(istek.deneme_id)
    if not deneme or not test_paketi:
        raise HTTPException(status_code=404, detail="Deneme bulunamadi ya da test suresi doldu")

    sonuc = _secici.cevaplari_degerlendir(test_paketi, istek.cevaplar)

    for alt_konu_id, soru_listesi in test_paketi.items():
        for soru in soru_listesi:
            secilen = istek.cevaplar.get(soru["soru_id"], "").upper().strip()
            session.add(
                models.Cevap(
                    deneme_id=deneme.id,
                    soru_id=soru["soru_id"],
                    alt_konu_id=alt_konu_id,
                    secilen_harf=secilen,
                    dogru_mu=secilen == soru["dogru_cevap"],
                )
            )

    # en temel eksikten basla: soru havuzundaki alt konu sirasi, mufredat sirasidir
    eksik_sirali = [
        alt_konu for alt_konu in test_paketi if alt_konu in sonuc["eksik_alt_konular"]
    ]
    deneme.bulunan_alt_konu = eksik_sirali[0] if eksik_sirali else None
    deneme.durum = "test_bitti"
    session.add(deneme)
    session.commit()

    del _aktif_testler[istek.deneme_id]
    return sonuc
