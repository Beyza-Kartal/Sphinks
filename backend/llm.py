# Sahip: A (Beyza)
# Gorev: Groq cagrisi (ortak yardimci) - altyaziyi alt konulara gore boler.
#
# GUVENLIK/KALITE KURALI (plan bolum 10, "LLM saçma cevap veriyor" riski):
# Modele hic saniye hesaplatmiyoruz. Altyazi satirlarini numaralandirip
# modelden "hangi SATIR araligi hangi alt konu" cevabini istiyoruz, gercek
# saniyeyi biz (parcalar listesinden) hesapliyoruz. Boylece model sayida
# hata yapsa bile saniyeler hep gercek veriden gelir.
import json
import logging
import os
import time

from dotenv import load_dotenv
from groq import Groq

load_dotenv()

logger = logging.getLogger(__name__)

MODEL = "openai/gpt-oss-20b"
SATIR_BASINA_PARCA = 150  # tek istekte Groq'a gonderilecek altyazi satiri sayisi

_client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def _numarali_metin(parcalar: list[dict], basla: int, bitis: int) -> str:
    satirlar = [f"{i + 1}: {parcalar[i]['metin']}" for i in range(basla, bitis)]
    return "\n".join(satirlar)


def altyazi_bolumle(parcalar: list[dict], alt_konular: list[str]) -> list[dict]:
    """
    parcalar: altyazi_servisi.AltyaziServisi.altyazi_getir()'den gelen 'parcalar' listesi
    alt_konular: bu dersin alt konu id listesi (orn. soru_havuzu.json'daki anahtarlar)

    Donus: [{"alt_konu": str, "baslangic_sn": float, "bitis_sn": float}, ...]
    """
    bulunan = []

    for i, basla in enumerate(range(0, len(parcalar), SATIR_BASINA_PARCA)):
        if i > 0:
            # Groq'un dakikalik token limitine (TPM) art arda hizli istekle
            # takilmamak icin parcalar arasi kisa bir bekleme (bkz. GUNLUK.md -
            # "full tekrar" videolarini yeniden islerken TPM/TPD limitine
            # takilip veri kaybettigimiz olay).
            time.sleep(20)
        bitis = min(basla + SATIR_BASINA_PARCA, len(parcalar))
        metin = _numarali_metin(parcalar, basla, bitis)

        prompt = (
            "Asagida numarali video altyazi satirlari var (Turkce, matematik dersi).\n"
            f"Bu metni su alt konulara gore bolumlere ayir: {', '.join(alt_konular)}.\n"
            "Her bolum icin baslangic ve bitis SATIR NUMARASINI ver (saniye DEGIL, satir numarasi).\n"
            "Bir alt konu bu parcada hic gecmiyorsa listeye hic ekleme.\n"
            'Sadece su JSON formatinda don: '
            '{"bolumler": [{"alt_konu": "...", "baslangic_satir": 12, "bitis_satir": 40}]}\n\n'
            f"{metin}"
        )

        try:
            resp = _client.chat.completions.create(
                model=MODEL,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                max_completion_tokens=4000,
                reasoning_effort="medium",
            )
            veri = json.loads(resp.choices[0].message.content)
        except Exception:
            logger.exception("Groq altyazi bolumleme basarisiz (satir %s-%s)", basla, bitis)
            continue  # bu parca basarisiz olursa atla, digerlerine devam et

        for bolum in veri.get("bolumler", []):
            try:
                s_satir = int(bolum["baslangic_satir"])
                b_satir = int(bolum["bitis_satir"])
                alt_konu = bolum["alt_konu"]
            except (KeyError, TypeError, ValueError):
                continue

            # model satir numarasinda hata yapmis olabilir, aralik disina tasarsa kirp
            s_satir = max(1, min(s_satir, len(parcalar)))
            b_satir = max(s_satir, min(b_satir, len(parcalar)))

            if alt_konu not in alt_konular:
                continue

            bulunan.append(
                {
                    "alt_konu": alt_konu,
                    "baslangic_sn": round(parcalar[s_satir - 1]["baslangic"], 1),
                    "bitis_sn": round(parcalar[b_satir - 1]["bitis"], 1),
                }
            )

    return bulunan


def adim_adim_acikla(soru_metni: str, secenekler: dict, dogru_harf: str, cozum: str) -> str:
    """
    Ogrencinin YANLIS cevapladigi spesifik soruyu adim adim acikliyor.
    GUVENLIK/KALITE: Modele soruyu sifirdan "coz" demiyoruz (hesap hatasi
    riski) - buse'nin soru_havuzu.json'daki hazir "cozum" alanini modele
    VERIYORUZ, model sadece bunu ogrenci seviyesine uygun, sade ve adim adim
    bir dille yeniden anlatiyor. Boylece matematiksel dogruluk bizden,
    anlatim kalitesi modelden gelir.

    DUZELTME: Promptta A/B/C/D siklarini listeleyince model "sinav sorusu
    cozuyorum" diye ALGILAYIP ISTEGI REDDEDIYORDU ("I can't help with
    that"). Siklari hic vermiyoruz, sadece soru metni + dogru cevabin
    DEGERI (harf degil) + cozum notu gonderiyoruz - model artik normal
    calisiyor. Ayrica LaTeX ISTEMIYORUZ (sayfa render edemiyor), duz metin.
    """
    dogru_deger = secenekler.get(dogru_harf, dogru_harf)
    prompt = (
        f"Bir ogrenci bu matematik sorusunu yanlis cevapladi: {soru_metni}\n"
        f"Dogru sonuc: {dogru_deger}\n"
        f"Kisa cozum notu: {cozum}\n\n"
        "Bu cozum notunu TEMEL ALARAK, soruyu bir ogrenciye adim adim, "
        "sade ve samimi bir dille anlat. 3-5 kisa adim kullan, her adimi "
        "yeni satirda yaz. LaTeX ya da matematik sembolu bicimlendirmesi "
        "KULLANMA (\\[ \\] gibi), sadece duz metin ve normal sayilar/islem "
        "isaretleri kullan (orn: 2x + 3 = 11)."
    )

    try:
        resp = _client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
        )
        metin = resp.choices[0].message.content.strip()
        if not metin:
            raise ValueError("bos cevap")
        return metin
    except Exception:
        # Groq basarisiz olursa (ya da bos/reddedilmis cevap donerse),
        # en azindan hazir cozum notunu goster.
        logger.exception("Groq adim adim aciklama basarisiz")
        return f"{cozum}\n\nDoğru sonuç: {dogru_deger}"
