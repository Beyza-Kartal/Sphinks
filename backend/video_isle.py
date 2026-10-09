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
    with open(SORU_HAVUZU_JSON, encoding="utf-8") as f:
        havuz = json.load(f)
    return list(havuz.get(ders_id, {}).keys())


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


def isle():
    create_db_and_tables()

    with open(VIDEOLAR_JSON, encoding="utf-8") as f:
        videolar = json.load(f)

    servis = AltyaziServisi()

    with Session(engine) as session:
        for v in videolar:
            mevcut = session.exec(
                select(models.Video).where(models.Video.youtube_id == v["youtube_id"])
            ).first()
            if mevcut:
                print(f"{v['youtube_id']} zaten islenmis, atlaniyor.")
                continue

            print(f"Isleniyor: {v['kanal_adi']} - {v['youtube_id']}")
            altyazi = servis.altyazi_getir(v["youtube_url"])

            ders_id = v["konu_id"]
            alt_konular = _alt_konular(ders_id)
            bolumler = altyazi_bolumle(altyazi["parcalar"], alt_konular)
            en_iyi_bolumler = _en_uzun_bolumler(bolumler)

            video = models.Video(
                ders_id=ders_id,
                kanal_adi=v["kanal_adi"],
                youtube_id=v["youtube_id"],
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
                    )
                )
            session.commit()
            print(f"  -> {len(en_iyi_bolumler)} bolum kaydedildi.")


if __name__ == "__main__":
    isle()
