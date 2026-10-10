# Sahip: A (Beyza)
# Gorev: hoca uclari.
#
# NOT: email+sifre giris ve sifre degistirme, orijinal plan dokumaninda YOKTU.
# Plan "hesap/sifre" ozelligini bilerek "GELECEK (yapmayin)" listesine koymustu.
# Takim ici tartisma sonrasi (bkz. GUNLUK.md), hoca'nin sinif kodunu kendi
# belirleyememesi sorunu icin login + sifre degistirme eklenmesine karar verildi.
# Gercek e-posta gonderimi YOK: "sifre degistir" ucu, e-postayi dogrulamadan
# direkt yeni sifreyi kaydeder (hackathon demosu icin yeterli, production icin degil).
import hashlib
import random
import string

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from backend import models
from backend.db import get_session

router = APIRouter()


def sifre_hashle(sifre: str) -> str:
    return hashlib.sha256(sifre.encode()).hexdigest()


def _benzersiz_sinif_kodu(session: Session) -> str:
    # hoca kod uydurmak zorunda kalmasin diye backend 6 haneli, tahmin
    # edilmesi zor bir kod uretir (buyuk harf + sayi).
    while True:
        kod = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
        mevcut = session.exec(select(models.Sinif).where(models.Sinif.kod == kod)).first()
        if not mevcut:
            return kod


class KayitIstegi(BaseModel):
    email: str
    sifre: str


class GirisIstegi(BaseModel):
    email: str
    sifre: str


class SifreDegistirIstegi(BaseModel):
    email: str
    yeni_sifre: str


class SinifEkleIstegi(BaseModel):
    hoca_id: int
    ders_id: str


@router.post("/api/hoca/kayit")
def kayit(istek: KayitIstegi, session: Session = Depends(get_session)):
    mevcut = session.exec(
        select(models.Hoca).where(models.Hoca.email == istek.email)
    ).first()
    if mevcut:
        raise HTTPException(status_code=400, detail="Bu email zaten kayitli")

    hoca = models.Hoca(email=istek.email, sifre_hash=sifre_hashle(istek.sifre))
    session.add(hoca)
    session.commit()
    session.refresh(hoca)
    return {"hoca_id": hoca.id, "email": hoca.email}


@router.post("/api/hoca/giris")
def giris(istek: GirisIstegi, session: Session = Depends(get_session)):
    hoca = session.exec(
        select(models.Hoca).where(models.Hoca.email == istek.email)
    ).first()
    if not hoca or hoca.sifre_hash != sifre_hashle(istek.sifre):
        raise HTTPException(status_code=401, detail="Email ya da sifre hatali")

    return {"hoca_id": hoca.id, "email": hoca.email}


@router.post("/api/hoca/sifre-degistir")
def sifre_degistir(istek: SifreDegistirIstegi, session: Session = Depends(get_session)):
    hoca = session.exec(
        select(models.Hoca).where(models.Hoca.email == istek.email)
    ).first()
    if not hoca:
        raise HTTPException(status_code=404, detail="Bu email ile kayitli hoca yok")

    hoca.sifre_hash = sifre_hashle(istek.yeni_sifre)
    session.add(hoca)
    session.commit()
    return {"sonuc": "sifre guncellendi"}


@router.post("/api/hoca/sinif-ekle")
def sinif_ekle(istek: SinifEkleIstegi, session: Session = Depends(get_session)):
    hoca = session.get(models.Hoca, istek.hoca_id)
    if not hoca:
        raise HTTPException(status_code=404, detail="Hoca bulunamadi")

    sinif = models.Sinif(
        kod=_benzersiz_sinif_kodu(session), ders_id=istek.ders_id, hoca_id=hoca.id
    )
    session.add(sinif)
    session.commit()
    session.refresh(sinif)
    return {"sinif_id": sinif.id, "kod": sinif.kod, "ders_id": sinif.ders_id}


@router.get("/api/hoca/sinif-listesi/{hoca_id}")
def sinif_listesi(hoca_id: int, session: Session = Depends(get_session)):
    siniflar = session.exec(
        select(models.Sinif).where(models.Sinif.hoca_id == hoca_id)
    ).all()
    return {
        "siniflar": [
            {"sinif_id": s.id, "kod": s.kod, "ders_id": s.ders_id} for s in siniflar
        ]
    }


@router.get("/api/hoca/panel/{sinif_id}")
def panel(sinif_id: int, session: Session = Depends(get_session)):
    sinif = session.get(models.Sinif, sinif_id)
    if not sinif:
        raise HTTPException(status_code=404, detail="Sinif bulunamadi")

    ogrenciler = session.exec(
        select(models.Ogrenci).where(models.Ogrenci.sinif_id == sinif_id)
    ).all()

    ogrenci_listesi = []
    hazir_sayisi = 0
    eksik_dagilimi: dict[str, int] = {}

    for ogrenci in ogrenciler:
        son_deneme = session.exec(
            select(models.Deneme)
            .where(models.Deneme.ogrenci_id == ogrenci.id)
            .order_by(models.Deneme.id.desc())
        ).first()

        if not son_deneme:
            durum = "hic_baslamadi"
        elif son_deneme.durum == "test_bitti" and not son_deneme.bulunan_alt_konu:
            durum = "hazir"
            hazir_sayisi += 1
        elif son_deneme.durum == "test_bitti":
            durum = "eksigi_var"
            eksik_dagilimi[son_deneme.bulunan_alt_konu] = (
                eksik_dagilimi.get(son_deneme.bulunan_alt_konu, 0) + 1
            )
        else:
            durum = "test_suruyor"

        ogrenci_listesi.append({"isim": ogrenci.isim, "durum": durum})

    toplam = len(ogrenciler)
    hazir_orani = round(hazir_sayisi / toplam, 2) if toplam else 0.0

    return {
        "sinif_id": sinif_id,
        "kod": sinif.kod,
        "hazir_orani": hazir_orani,
        "eksik_dagilimi": eksik_dagilimi,
        "ogrenciler": ogrenci_listesi,
    }
