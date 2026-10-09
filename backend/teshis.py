# Sahip: A (Beyza)
# Gorev: /api/teshis/{deneme_id} - bulunan eksige karsilik gelen video
# dakikalarini (bolum kayitlari) dondurur.
#
# NOT: "Eksigi bulma" mantigi artik burada degil, on_test_secici.py'nin
# cevaplari_degerlendir() fonksiyonunda (bkz. api_ogrenci.py / test_bitir).
# Bu dosya sadece bulunan eksik icin ESLESEN VIDEO DAKIKALARINI getiriyor.
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from backend import models
from backend.db import get_session

router = APIRouter()


@router.get("/api/teshis/{deneme_id}")
def teshis(deneme_id: int, session: Session = Depends(get_session)):
    deneme = session.get(models.Deneme, deneme_id)
    if not deneme:
        raise HTTPException(status_code=404, detail="Deneme bulunamadi")
    if not deneme.bulunan_alt_konu:
        return {"eksik": None, "videolar": [], "mesaj": "Eksik bulunamadi, ogrenci hazir"}

    bolumler = session.exec(
        select(models.Bolum, models.Video)
        .join(models.Video, models.Bolum.video_id == models.Video.id)
        .where(models.Bolum.alt_konu_id == deneme.bulunan_alt_konu)
    ).all()

    videolar = [
        {
            "kanal_adi": video.kanal_adi,
            "youtube_id": video.youtube_id,
            "baslik": bolum.baslik,
            "baslangic_sn": bolum.baslangic_sn,
            "bitis_sn": bolum.bitis_sn,
            "transkript": bolum.transkript,
        }
        for bolum, video in bolumler
    ]

    return {"eksik": deneme.bulunan_alt_konu, "videolar": videolar}
