# Sahip: A (Beyza)
# Gorev: content/konu.json dosyasini okuyup veritabanina yukler.
# Calistirma: python -m backend.seed
import json
import os

from sqlmodel import Session, select

from backend import models
from backend.db import create_db_and_tables, engine

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KONU_JSON = os.path.join(BASE_DIR, "content", "konu.json")


def seed():
    create_db_and_tables()

    with open(KONU_JSON, encoding="utf-8") as f:
        data = json.load(f)

    with Session(engine) as session:
        # ayni konu adiyla zaten yuklenmisse tekrar ekleme
        mevcut = session.exec(
            select(models.Konu).where(models.Konu.ad == data["konu"])
        ).first()
        if mevcut:
            print(f"'{data['konu']}' zaten yuklu, atlaniyor.")
            return

        konu = models.Konu(ad=data["konu"], sira=1, durum="acik")
        session.add(konu)
        session.commit()
        session.refresh(konu)

        eksik_id_by_ad = {}
        for eksik_data in data.get("eksikler", []):
            eksik = models.Eksik(
                konu_id=konu.id,
                ad=eksik_data["ad"],
                aciklama=eksik_data.get("aciklama", ""),
            )
            session.add(eksik)
            session.commit()
            session.refresh(eksik)
            eksik_id_by_ad[eksik.ad] = eksik.id

        for soru_data in data.get("sorular", []):
            soru = models.Soru(
                konu_id=konu.id,
                eksik_id=eksik_id_by_ad[soru_data["eksik"]],
                tur=soru_data["tur"],
                metin=soru_data["metin"],
                secenekler=soru_data["secenekler"],
                dogru_index=soru_data["dogru_index"],
            )
            session.add(soru)
        session.commit()

        print(f"'{konu.ad}' yuklendi: {len(eksik_id_by_ad)} eksik, {len(data.get('sorular', []))} soru.")


if __name__ == "__main__":
    seed()
