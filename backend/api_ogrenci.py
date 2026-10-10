# Sahip: A (Beyza)
# Gorev: ogrenci uclari (/api/giris, /api/test/basla, /api/test/bitir)
#
# NOT - MIMARI DEGISIKLIGI (18:xx): Eskiden tek soru -> cevap -> sonraki soru
# seklinde ilerliyorduk. Artik buse'nin on_test_secici.py modulu butun testi
# tek seferde uretiyor (8 alt konu x 3 zorluk = 24 soru). Akis simdi:
#   1) /api/test/basla  -> deneme acilir, TUM sorular (cevapsiz) donulur
#   2) ogrenci hepsini cevaplar (arayuzde tek tek gosterilebilir, backend'e
#      tek seferde gonderilir)
#   3) /api/test/bitir   -> cevaplar topluca degerlendirilir, eksik alt
#      konular + genel puan donulur
# Detay ve neden: GUNLUK.md.
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from backend import models
from backend.db import get_session
from backend.icerik_meta import UNITELER, soru_bul
from backend.kavram_testi_secici import KavramTestiSecici
from backend.llm import adim_adim_acikla
from backend.on_test_secici import OnTestSecici

router = APIRouter()
_secici = OnTestSecici()
_kavram_secici = KavramTestiSecici()

# deneme_id -> dogru cevaplariyla BIRLIKTE orijinal test paketi.
# Sadece sunucu tarafinda tutulur, ogrenciye hic gonderilmez (guvenlik).
_aktif_testler: dict[int, dict] = {}

# deneme_id -> video sonrasi "tekrar testi" (kavram testi) paketi, ayni
# guvenlik mantigiyla (dogru cevap sunucuda kalir).
_aktif_tekrar_testleri: dict[int, dict] = {}


class GirisIstegi(BaseModel):
    sinif_kodu: str
    isim: str


class TestBaslaIstegi(BaseModel):
    ogrenci_id: int
    sinif_id: int


class TestBitirIstegi(BaseModel):
    deneme_id: int
    cevaplar: dict[str, str]  # {soru_id: secilen_harf}


class TekrarBaslaIstegi(BaseModel):
    deneme_id: int


class TekrarBitirIstegi(BaseModel):
    deneme_id: int
    cevaplar: dict[str, str]


class AdimAdimIstegi(BaseModel):
    deneme_id: int


def _ogrenciye_gonderilecek_sorular(test_paketi: dict) -> list[dict]:
    # dogru_cevap ve cozum bilerek CIKARILIYOR; ogrenci bunlari gormemeli.
    sorular = []
    for alt_konu_id, soru_listesi in test_paketi.items():
        for soru in soru_listesi:
            sorular.append(
                {
                    "soru_id": soru["soru_id"],
                    "alt_konu": alt_konu_id,
                    "soru": soru["soru"],
                    "secenekler": soru["secenekler"],
                }
            )
    return sorular


@router.post("/api/giris")
def giris(istek: GirisIstegi, session: Session = Depends(get_session)):
    sinif = session.exec(
        select(models.Sinif).where(models.Sinif.kod == istek.sinif_kodu)
    ).first()
    if not sinif:
        raise HTTPException(status_code=404, detail="Sinif kodu bulunamadi")

    ogrenci = session.exec(
        select(models.Ogrenci).where(
            models.Ogrenci.sinif_id == sinif.id, models.Ogrenci.isim == istek.isim
        )
    ).first()
    if not ogrenci:
        ogrenci = models.Ogrenci(sinif_id=sinif.id, isim=istek.isim)
        session.add(ogrenci)
        session.commit()
        session.refresh(ogrenci)

    return {
        "ogrenci_id": ogrenci.id,
        "sinif_id": sinif.id,
        "ders_id": sinif.ders_id,
        "unite_id": sinif.unite_id,
    }


@router.post("/api/test/basla")
def test_basla(istek: TestBaslaIstegi, session: Session = Depends(get_session)):
    sinif = session.get(models.Sinif, istek.sinif_id)
    if not sinif:
        raise HTTPException(status_code=404, detail="Sinif bulunamadi")

    deneme = models.Deneme(
        ogrenci_id=istek.ogrenci_id, sinif_id=sinif.id, durum="basladi"
    )
    session.add(deneme)
    session.commit()
    session.refresh(deneme)

    tum_konular = _secici.test_olustur(sinif.ders_id)
    # buse'nin test_olustur()'u dersin TUM alt konularini dondurur; biz
    # sadece bu sinifin unitesine ait konulari aliyoruz (bkz. icerik_meta.py).
    unite_konulari = UNITELER.get(sinif.unite_id, {}).get("konular", list(tum_konular.keys()))
    test_paketi = {k: v for k, v in tum_konular.items() if k in unite_konulari}
    _aktif_testler[deneme.id] = test_paketi

    return {"deneme_id": deneme.id, "sorular": _ogrenciye_gonderilecek_sorular(test_paketi)}


@router.post("/api/test/bitir")
def test_bitir(istek: TestBitirIstegi, session: Session = Depends(get_session)):
    deneme = session.get(models.Deneme, istek.deneme_id)
    test_paketi = _aktif_testler.get(istek.deneme_id)
    if not deneme or not test_paketi:
        raise HTTPException(status_code=404, detail="Deneme bulunamadi ya da test suresi doldu")

    sonuc = _secici.cevaplari_degerlendir(test_paketi, istek.cevaplar)

    for alt_konu_id, soru_listesi in test_paketi.items():
        for soru in soru_listesi:
            secilen = istek.cevaplar.get(soru["soru_id"], "").upper().strip()
            session.add(
                models.Cevap(
                    deneme_id=deneme.id,
                    soru_id=soru["soru_id"],
                    alt_konu_id=alt_konu_id,
                    secilen_harf=secilen,
                    dogru_mu=secilen == soru["dogru_cevap"],
                )
            )

    # en temel eksikten basla: soru havuzundaki alt konu sirasi, mufredat sirasidir
    eksik_sirali = [
        alt_konu for alt_konu in test_paketi if alt_konu in sonuc["eksik_alt_konular"]
    ]
    deneme.bulunan_alt_konu = eksik_sirali[0] if eksik_sirali else None
    deneme.durum = "test_bitti"
    session.add(deneme)
    session.commit()

    del _aktif_testler[istek.deneme_id]
    return sonuc


@router.post("/api/tekrar/basla")
def tekrar_basla(istek: TekrarBaslaIstegi, session: Session = Depends(get_session)):
    # Video izledikten sonra, SADECE bulunan eksik konudan buse'nin
    # kavram_testi_secici.py'si 6 soru uretir (2 kolay+2orta+2zor).
    deneme = session.get(models.Deneme, istek.deneme_id)
    if not deneme:
        raise HTTPException(status_code=404, detail="Deneme bulunamadi")
    if not deneme.bulunan_alt_konu:
        raise HTTPException(status_code=400, detail="Bu deneme icin eksik konu bulunamadi")

    sinif = session.get(models.Sinif, deneme.sinif_id)
    test_verisi = _kavram_secici.test_olustur(sinif.ders_id, deneme.bulunan_alt_konu)
    _aktif_tekrar_testleri[deneme.id] = test_verisi

    # dogru_cevap ve cozum CIKARILIYOR; ogrenci gormemeli.
    sorular = [
        {"soru_id": s["soru_id"], "alt_konu": s["alt_konu"], "soru": s["soru"], "secenekler": s["secenekler"]}
        for s in test_verisi["sorular"]
    ]
    return {"deneme_id": deneme.id, "sorular": sorular}


@router.post("/api/tekrar/bitir")
def tekrar_bitir(istek: TekrarBitirIstegi, session: Session = Depends(get_session)):
    deneme = session.get(models.Deneme, istek.deneme_id)
    test_verisi = _aktif_tekrar_testleri.get(istek.deneme_id)
    if not deneme or not test_verisi:
        raise HTTPException(status_code=404, detail="Tekrar testi bulunamadi ya da suresi doldu")

    sonuc = _kavram_secici.cevaplari_degerlendir(test_verisi, istek.cevaplar)

    # Hangi sorulari yanlis yaptigini ogrenciye gosterebilmek icin (test
    # BITTI, artik dogru cevabi gostermek guvenlik sorunu degil).
    yanlis_sorular = []
    for s in test_verisi["sorular"]:
        verilen = istek.cevaplar.get(s["soru_id"], "").upper().strip()
        if verilen != s["dogru_cevap"]:
            yanlis_sorular.append(
                {
                    "soru": s["soru"],
                    "secenekler": s["secenekler"],
                    "senin_cevabin": verilen or None,
                    "dogru_cevap": s["dogru_cevap"],
                }
            )
    sonuc["yanlis_sorular"] = yanlis_sorular

    # Sonucu Deneme'ye kaydediyoruz (/api/ozet bunu okuyor, sayfa yenilense
    # ya da hoca sonradan baksa bile gercek son tekrar sonucu kalici olsun).
    deneme.son_tekrar_dogru = sonuc["dogru"]
    deneme.son_tekrar_toplam = sonuc["toplam_soru"]
    deneme.son_tekrar_puan = sonuc["puan"]
    if sonuc["calisma_ise_yaradi_mi"]:
        # eksik kapandi, ogrenci artik bu konuda "hazir"
        deneme.bulunan_alt_konu = None
    session.add(deneme)
    session.commit()

    del _aktif_tekrar_testleri[istek.deneme_id]
    return sonuc


@router.post("/api/adim-adim")
def adim_adim(istek: AdimAdimIstegi, session: Session = Depends(get_session)):
    # "Bilissel Kopru" (benzetme) yerine geldi: ilgi alani/benzetme YOK,
    # matematik icin bu uygun degil (kullanici karariyla). Bunun yerine
    # ogrencinin GERCEKTEN yanlis yaptigi TUM sorulari bulup, buse'nin hazir
    # cozum notunu temel alarak Groq'a sade bir dilde adim adim anlatiyoruz.
    # DUZELTME (kullanici istegi): eskiden sadece en son yanlis soru
    # gosteriliyordu (.first()) - artik o denemedeki butun yanlis sorular
    # icin ayri aciklama uretip liste olarak donuyoruz (frontend kart kart gezdiriyor).
    # DUZELTME 2 (kullanici istegi, "HEPSİNİ İSTİYORUM"): alt konuya gore
    # filtrelemekten vazgecildi - ogrenci bu denemede yanlis yaptigi HER
    # soruyu gormek istiyor, sadece su an calisilan eksik konuya ait olanlari degil.
    yanlis_cevaplar = session.exec(
        select(models.Cevap)
        .where(models.Cevap.deneme_id == istek.deneme_id, models.Cevap.dogru_mu == False)  # noqa: E712
        .order_by(models.Cevap.id.asc())
    ).all()

    if not yanlis_cevaplar:
        return {"kartlar": [], "aciklama": "Tebrikler, bu denemede yanlış cevabın yok!"}

    kartlar = []
    for yanlis_cevap in yanlis_cevaplar:
        soru = soru_bul(yanlis_cevap.soru_id)
        if not soru:
            continue
        aciklama = adim_adim_acikla(soru["soru"], soru["secenekler"], soru["cevap"], soru["cozum"])
        kartlar.append({"soru": soru["soru"], "aciklama": aciklama})

    if not kartlar:
        return {"kartlar": [], "aciklama": "Bu sorular için açıklama bulunamadı."}

    return {"kartlar": kartlar, "aciklama": None}


@router.get("/api/ozet/{deneme_id}")
def ozet(deneme_id: int, session: Session = Depends(get_session)):
    # Denemenin su anki gercek durumunu doner: hazir mi, eksigi var mi,
    # en son tekrar testi sonucu neydi. (Video artik embed degil, dis link
    # oldugu icin "izlenen saniye" olcumu kaldirildi - bkz. GUNLUK.md.)
    deneme = session.get(models.Deneme, deneme_id)
    if not deneme:
        raise HTTPException(status_code=404, detail="Deneme bulunamadi")

    hazir = deneme.durum == "test_bitti" and not deneme.bulunan_alt_konu
    return {
        "durum": deneme.durum,
        "hazir_mi": hazir,
        "eksik_konu": deneme.bulunan_alt_konu,
        "son_tekrar_dogru": deneme.son_tekrar_dogru,
        "son_tekrar_toplam": deneme.son_tekrar_toplam,
        "son_tekrar_puan": deneme.son_tekrar_puan,
    }
