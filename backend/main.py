# Sahip: A (Beyza)
# Yuruyen iskelet: statik frontend + tum API uclari sahte (hardcoded) cevapla acik.
# Gercek mantik sirayla (db, api_ogrenci, teshis, video_isle, api_hoca) buraya baglanacak.
import os

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.db import create_db_and_tables
from backend import models  # noqa: F401 - tablo tanimlari metadata'ya kaydolsun diye
from backend.api_ogrenci import router as ogrenci_router
from backend.api_hoca import router as hoca_router
from backend.teshis import router as teshis_router

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
os.makedirs(FRONTEND_DIR, exist_ok=True)

app = FastAPI(title="HazirMisin?")
app.include_router(ogrenci_router)
app.include_router(hoca_router)
app.include_router(teshis_router)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
