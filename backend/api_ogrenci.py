# Sahip: A (Beyza)
# Gorev: ogrenci uclari (/api/giris, /api/test/basla, /api/cevap)
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from backend import models
from backend.db import get_session

router = APIRouter()


# --- istek govdeleri (ne gonderilecek) ---
class GirisIstegi(BaseModel):
    sinif_kodu: str
    isim: str


class TestBaslaIstegi(BaseModel):
    ogrenci_id: int
    konu_id: int


class CevapIstegi(BaseModel):
    deneme_id: int
    soru_id: int
    secilen_index: int


def soru_disari(soru: models.Soru) -> dict:
    # dogru_index'i ogrenciye gondermiyoruz, kopya cekmesin
    return {"id": soru.id, "metin": soru.metin, "secenekler": soru.secenekler}


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

    konu = session.get(models.Konu, sinif.konu_id)
    return {"ogrenci_id": ogrenci.id, "konu": {"id": konu.id, "ad": konu.ad}}


@router.post("/api/test/basla")
def test_basla(istek: TestBaslaIstegi, session: Session = Depends(get_session)):
    deneme = models.Deneme(
        ogrenci_id=istek.ogrenci_id, konu_id=istek.konu_id, durum="basladi"
    )
    session.add(deneme)
    session.commit()
    session.refresh(deneme)

    ilk_soru = session.exec(
        select(models.Soru)
        .where(models.Soru.konu_id == istek.konu_id, models.Soru.tur == "ontest")
        .order_by(models.Soru.id)
    ).first()
    if not ilk_soru:
        raise HTTPException(status_code=404, detail="Bu konu icin soru bulunamadi")

    return {"deneme_id": deneme.id, "soru": soru_disari(ilk_soru)}


@router.post("/api/cevap")
def cevap(istek: CevapIstegi, session: Session = Depends(get_session)):
    deneme = session.get(models.Deneme, istek.deneme_id)
    soru = session.get(models.Soru, istek.soru_id)
    if not deneme or not soru:
        raise HTTPException(status_code=404, detail="Deneme ya da soru bulunamadi")

    dogru_mu = istek.secilen_index == soru.dogru_index
    session.add(
        models.Cevap(
            deneme_id=deneme.id,
            soru_id=soru.id,
            secilen_index=istek.secilen_index,
            dogru_mu=dogru_mu,
        )
    )
    session.commit()

    cevaplanan_soru_idleri = session.exec(
        select(models.Cevap.soru_id).where(models.Cevap.deneme_id == deneme.id)
    ).all()

    sonraki_soru = session.exec(
        select(models.Soru)
        .where(
            models.Soru.konu_id == deneme.konu_id,
            models.Soru.tur == "ontest",
            models.Soru.id.not_in(cevaplanan_soru_idleri),
        )
        .order_by(models.Soru.id)
    ).first()

    if sonraki_soru:
        return {"dogru_mu": dogru_mu, "bitti": False, "soru": soru_disari(sonraki_soru)}

    deneme.durum = "test_bitti"
    session.add(deneme)
    session.commit()
    return {"dogru_mu": dogru_mu, "bitti": True, "soru": None}
