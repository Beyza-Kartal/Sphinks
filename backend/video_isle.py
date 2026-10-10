# Sahip: A (Beyza)
# Gorev: content/videolar.json'daki her video icin altyaziyi cek (altyazi_servisi.py),
# Groq ile alt konulara bolumlet (llm.py), Video+Bolum tablosuna yaz.
# Bu bir ON-ISLEME scriptidir, canli istekte CALISMAZ - bir kez calistirilir.
# Calistirma: python -m backend.video_isle
import json
import os

from sqlmodel import Session, select

from backend import models
from backend.altyazi_servisi import AltyaziServisi
from backend.db import create_db_and_tables, engine
from backend.llm import altyazi_bolumle

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VIDEOLAR_JSON = os.path.join(BASE_DIR, "content", "videolar.json")
SORU_HAVUZU_JSON = os.path.join(BASE_DIR, "content", "soru_havuzu.json")


def _alt_konular(ders_id: str) -> list[str]:
    # DUZELTME: soru_havuzu.json'da "fonksiyonlar" ve "fonksiyonlar_2" AYRI
    # ust seviye anahtarlar (bkz. icerik_meta.py ustundeki ayni hatanin
    # gecmisi) ama ikisi de ayni gercek konunun ("Fonksiyonlar") parcasi.
    # "Full tekrar" gibi videolar HER iki parcayi da anlatiyor olabilir -
    # sadece ders_id'nin ait oldugu 4 konuyu Groq'a sorarsak, videoda
    # gecen diger 4 konu hic bulunamiyor. Bu yuzden TUM derslerin alt
    # konularinin BIRLESIMINI ariyoruz (alt_konu id'leri zaten birbiriyle
    # cakismiyor, global olarak benzersiz).
    with open(SORU_HAVUZU_JSON, encoding="utf-8") as f:
        havuz = json.load(f)
    tum_konular: list[str] = []
    for ders_konulari in havuz.values():
        tum_konular.extend(ders_konulari.keys())
    return tum_konular


def _transkript_metni(parcalar: list[dict], baslangic_sn: float, bitis_sn: float) -> str:
    # Bolumun saniye araligina denk gelen altyazi parcalarini birlestirip
    # okunabilir bir transkript metni uretir (EK2: "transkript goruntuleme").
    cumleler = [
        p["metin"] for p in parcalar if p["baslangic"] >= baslangic_sn and p["baslangic"] < bitis_sn
    ]
    return " ".join(cumleler)


def _en_uzun_bolumler(bolumler: list[dict]) -> list[dict]:
    # Groq ayni alt konuyu birden cok parcada bulabilir; her alt konu icin
    # en uzun sureli (en bilgilendirici) bolumu seciyoruz.
    en_iyi: dict[str, dict] = {}
    for b in bolumler:
        sure = b["bitis_sn"] - b["baslangic_sn"]
        mevcut = en_iyi.get(b["alt_konu"])
        if mevcut is None or sure > (mevcut["bitis_sn"] - mevcut["baslangic_sn"]):
            en_iyi[b["alt_konu"]] = b
    return list(en_iyi.values())


def isle_tek_video(session: Session, youtube_url: str, ders_id: str, kanal_adi: str) -> models.Video:
    # Tek bir videoyu uctan uca isler (altyazi -> Groq bolumleme -> Video+Bolum
    # kaydi) ve olusan Video satirini doner. Hem toplu on-isleme scripti
    # (isle()) hem de hoca'nin canli "/api/video-ekle" ucu bunu kullanir.
    servis = AltyaziServisi()
    altyazi = servis.altyazi_getir(youtube_url)
    video_id_str = altyazi["video_id"]

    mevcut = session.exec(
        select(models.Video).where(models.Video.youtube_id == video_id_str)
    ).first()
    if mevcut:
        raise ValueError("Bu video zaten eklenmis.")

    alt_konular = _alt_konular(ders_id)
    bolumler = altyazi_bolumle(altyazi["parcalar"], alt_konular)
    en_iyi_bolumler = _en_uzun_bolumler(bolumler)
    if not en_iyi_bolumler:
        raise ValueError("Videoda bu derse ait hicbir alt konu tespit edilemedi.")

    video = models.Video(
        ders_id=ders_id,
        kanal_adi=kanal_adi,
        youtube_id=video_id_str,
        toplam_sure=int(altyazi["parcalar"][-1]["bitis"]) if altyazi["parcalar"] else 0,
    )
    session.add(video)
    session.commit()
    session.refresh(video)

    for b in en_iyi_bolumler:
        session.add(
            models.Bolum(
                video_id=video.id,
                alt_konu_id=b["alt_konu"],
                baslik=b["alt_konu"].replace("_", " ").title(),
                baslangic_sn=int(b["baslangic_sn"]),
                bitis_sn=int(b["bitis_sn"]),
                transkript=_transkript_metni(altyazi["parcalar"], b["baslangic_sn"], b["bitis_sn"]),
            )
        )
    session.commit()
    return video


def isle():
    create_db_and_tables()

    with open(VIDEOLAR_JSON, encoding="utf-8") as f:
        videolar = json.load(f)

    with Session(engine) as session:
        for v in videolar:
            mevcut = session.exec(
                select(models.Video).where(models.Video.youtube_id == v["youtube_id"])
            ).first()
            if mevcut:
                print(f"{v['youtube_id']} zaten islenmis, atlaniyor.")
                continue

            print(f"Isleniyor: {v['kanal_adi']} - {v['youtube_id']}")
            try:
                video = isle_tek_video(session, v["youtube_url"], v["konu_id"], v["kanal_adi"])
            except ValueError as e:
                print(f"  -> atlandi: {e}")
                continue

            bolum_sayisi = len(
                session.exec(select(models.Bolum).where(models.Bolum.video_id == video.id)).all()
            )
            print(f"  -> {bolum_sayisi} bolum kaydedildi.")


if __name__ == "__main__":
    isle()
