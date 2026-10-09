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
import json
import os
import random
import string

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from backend import models
from backend.db import get_session
from backend.icerik_meta import UNITELER
from backend.video_isle import isle_tek_video

router = APIRouter()

_BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_HAVUZ_YOLU = os.path.join(_BASE_DIR, "content", "soru_havuzu.json")


def _unite_soru_sayisi(unite: dict) -> int:
    # Bir unitenin konularinin soru_havuzu.json'da gercekte kac sorusu
    # oldugunu sayar. 0 ise o unite henuz icerik eklenmemis demektir
    # (bkz. GUNLUK.md - buse konu basliklarini yazdi ama sorulari henuz
    # eklemedi), hoca'nin bos test olusturmasini onlemek icin kullanilir.
    try:
        with open(_HAVUZ_YOLU, encoding="utf-8") as f:
            havuz = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return 0

    ders_havuzu = havuz.get(unite["ders_id"], {})
    toplam = 0
    for konu_id in unite["konular"]:
        seviyeler = ders_havuzu.get(konu_id, {})
        toplam += sum(len(sorular) for sorular in seviyeler.values())
    return toplam


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
    unite_id: str


class VideoEkleIstegi(BaseModel):
    ders_id: str
    youtube_url: str
    kanal_adi: str = "Hoca Eklentisi"


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


@router.get("/api/hoca/uniteler")
def uniteler():
    # Ders secimi su an icin tek secenek ("Matematik"), havuzda baska ders
    # yok. Unite secimi gercek: her unitenin kendi konu alt kumesi var.
    return {
        "ders": {"ders_id": "fonksiyonlar", "ad": "Matematik"},
        "uniteler": [
            {
                "unite_id": uid,
                "ad": u["ad"],
                "konular": u["konular"],
                "soru_sayisi": _unite_soru_sayisi(u),
            }
            for uid, u in UNITELER.items()
        ],
    }


@router.post("/api/hoca/sinif-ekle")
def sinif_ekle(istek: SinifEkleIstegi, session: Session = Depends(get_session)):
    hoca = session.get(models.Hoca, istek.hoca_id)
    if not hoca:
        raise HTTPException(status_code=404, detail="Hoca bulunamadi")

    unite = UNITELER.get(istek.unite_id)
    if not unite:
        raise HTTPException(status_code=400, detail="Gecersiz unite_id")
    if _unite_soru_sayisi(unite) == 0:
        raise HTTPException(
            status_code=400,
            detail="Bu unite icin henuz soru eklenmedi, su an sinif acilamaz",
        )

    sinif = models.Sinif(
        kod=_benzersiz_sinif_kodu(session),
        ders_id=unite["ders_id"],
        unite_id=istek.unite_id,
        hoca_id=hoca.id,
    )
    session.add(sinif)
    session.commit()
    session.refresh(sinif)
    return {
        "sinif_id": sinif.id,
        "kod": sinif.kod,
        "ders_id": sinif.ders_id,
        "unite_id": sinif.unite_id,
    }


@router.get("/api/hoca/sinif-listesi/{hoca_id}")
def sinif_listesi(hoca_id: int, session: Session = Depends(get_session)):
    siniflar = session.exec(
        select(models.Sinif).where(models.Sinif.hoca_id == hoca_id)
    ).all()
    return {
        "siniflar": [
            {
                "sinif_id": s.id,
                "kod": s.kod,
                "ders_id": s.ders_id,
                "unite_id": s.unite_id,
                "unite_adi": UNITELER.get(s.unite_id, {}).get("ad", s.unite_id),
            }
            for s in siniflar
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


@router.post("/api/video-ekle")
def video_ekle(istek: VideoEkleIstegi, session: Session = Depends(get_session)):
    # EK2: hoca kendi videosunu ekler, canli istek sirasinda altyazi cekilip
    # Groq ile bolumlenir (bkz. video_isle.isle_tek_video - toplu scriptle
    # aynı mantik, tek fark burada DB'ye kaydedilecek Video tek basina).
    try:
        video = isle_tek_video(session, istek.youtube_url, istek.ders_id, istek.kanal_adi)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    bolumler = session.exec(
        select(models.Bolum).where(models.Bolum.video_id == video.id)
    ).all()

    return {
        "video_id": video.id,
        "youtube_id": video.youtube_id,
        "kanal_adi": video.kanal_adi,
        "bolumler": [
            {
                "alt_konu_id": b.alt_konu_id,
                "baslik": b.baslik,
                "baslangic_sn": b.baslangic_sn,
                "bitis_sn": b.bitis_sn,
            }
            for b in bolumler
        ],
    }
