import os
import socket

import requests
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

app = FastAPI(title="Kıvılcım")
app.include_router(ogrenci_router)
app.include_router(hoca_router)
app.include_router(teshis_router)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


_PUBLIC_URL_FILE = os.path.join(BASE_DIR, "tools", "public_url.txt")


def _cloudflared_public_url() -> str | None:
    # cloudflared quick tunnel'in yerel bir API'si yok (ngrok'taki 4040 gibi),
    # URL'i sadece surec basladiginda konsola yazdiriyor. Bu yuzden tunel
    # baslatilirken bu adres tools/public_url.txt dosyasina yazilir, burada
    # okunur. ngrok'un ucretsiz plandaki zorunlu "Visit Site" ara uyari
    # sayfasi (ERR_NGROK_6024) cloudflared'da olmadigi icin tercih edilir.
    try:
        with open(_PUBLIC_URL_FILE, encoding="utf-8") as f:
            url = f.read().strip()
            return url or None
    except FileNotFoundError:
        return None


def _ngrok_public_url() -> str | None:
    # ngrok calisiyorsa, kendi yerel API'sinden (localhost:4040) su an acik
    # olan tunelin genel (https) adresini okur. Boylece ayni wifi'de olmayan
    # (farkli ag/mobil veri, kampus wifi'sindeki cihaz izolasyonu vb.)
    # cihazlar da QR/link ile erisebilir - LAN IP bunu saglayamaz.
    try:
        resp = requests.get("http://127.0.0.1:4040/api/tunnels", timeout=0.5)
        resp.raise_for_status()
        for tunnel in resp.json().get("tunnels", []):
            if tunnel.get("proto") == "https":
                return tunnel["public_url"]
    except requests.exceptions.RequestException:
        pass
    return None


@app.get("/api/sunucu-bilgisi")
def sunucu_bilgisi():
    # QR kod ile telefon katilimi icin: hoca paneli localhost uzerinden acilsa bile
    # QR linkinin erisilebilir bir adresi kodlamasi gerekiyor. Oncelik ngrok
    # (her ag/cihazdan calisir), yoksa LAN IP'ye (sadece ayni wifi) dusulur.
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        lan_ip = s.getsockname()[0]
    except OSError:
        lan_ip = "127.0.0.1"
    finally:
        s.close()
    return {"lan_ip": lan_ip, "public_url": _cloudflared_public_url() or _ngrok_public_url()}


app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
