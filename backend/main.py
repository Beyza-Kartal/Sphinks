# Sahip: A (Beyza)
# Yuruyen iskelet: statik frontend + tum API uclari sahte (hardcoded) cevapla acik.
# Gercek mantik sirayla (db, api_ogrenci, teshis, video_isle, api_hoca) buraya baglanacak.
import os

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
os.makedirs(FRONTEND_DIR, exist_ok=True)

app = FastAPI(title="HazirMisin?")


@app.post("/api/giris")
def giris():
    return {"ogrenci_id": 1, "konu": {"id": 1, "ad": "Ikinci Dereceden Denklemler"}}


@app.post("/api/test/basla")
def test_basla():
    return {
        "deneme_id": 1,
        "soru": {
            "id": 1,
            "metin": "6x + 9 ifadesinde ortak carpan nedir?",
            "secenekler": ["2", "3", "x", "6"],
        },
    }


@app.post("/api/cevap")
def cevap():
    return {
        "dogru_mu": False,
        "bitti": False,
        "soru": {
            "id": 2,
            "metin": "Ornek soru 2",
            "secenekler": ["A", "B", "C", "D"],
        },
    }


@app.get("/api/teshis/{deneme_id}")
def teshis(deneme_id: int):
    return {
        "eksik": {"id": 1, "ad": "ortak_carpan", "aciklama": "Ortak carpan parantezine alma"},
        "videolar": [
            {"kanal_adi": "Kanal A", "youtube_id": "dQw4w9WgXcQ", "baslangic_sn": 30, "bitis_sn": 90},
        ],
    }


@app.post("/api/tekrar/basla")
def tekrar_basla():
    return {
        "deneme_id": 1,
        "sorular": [
            {"id": 10, "metin": "Tekrar sorusu 1", "secenekler": ["A", "B", "C", "D"]},
        ],
    }


@app.post("/api/benzetme")
def benzetme():
    return {"metin": "Ortak carpan, bir pastayi esit dilimlere bolmek gibidir."}


@app.get("/api/ozet/{deneme_id}")
def ozet(deneme_id: int):
    return {"sonuc": "basarili", "izlenen_saniye": 60, "toplam_saniye": 90}


@app.post("/api/video-ekle")
def video_ekle():
    return {"video_id": 2, "yeni_secenek": {"kanal_adi": "Kanal B", "youtube_id": "dQw4w9WgXcQ"}}


@app.get("/api/hoca/panel/{sinif_id}")
def hoca_panel(sinif_id: int):
    return {
        "hazir_orani": 0.4,
        "eksik_dagilimi": {"ortak_carpan": 3, "carpanlara_ayirma": 1},
        "ogrenciler": [{"isim": "Ornek Ogrenci", "durum": "teshis"}],
    }


app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
