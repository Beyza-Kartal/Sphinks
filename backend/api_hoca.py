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

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from backend import models
from backend.db import get_session

router = APIRouter()


def sifre_hashle(sifre: str) -> str:
    return hashlib.sha256(sifre.encode()).hexdigest()


class KayitIstegi(BaseModel):
    email: str
    sifre: str


class GirisIstegi(BaseModel):
    email: str
    sifre: str


class SifreDegistirIstegi(BaseModel):
    email: str
    yeni_sifre: str


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
