# Sahip: A (Beyza)
# Gorev: Groq cagrisi (ortak yardimci) - altyaziyi alt konulara gore boler.
#
# GUVENLIK/KALITE KURALI (plan bolum 10, "LLM saçma cevap veriyor" riski):
# Modele hic saniye hesaplatmiyoruz. Altyazi satirlarini numaralandirip
# modelden "hangi SATIR araligi hangi alt konu" cevabini istiyoruz, gercek
# saniyeyi biz (parcalar listesinden) hesapliyoruz. Boylece model sayida
# hata yapsa bile saniyeler hep gercek veriden gelir.
import json
import os

from dotenv import load_dotenv
from groq import Groq

load_dotenv()

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

    for basla in range(0, len(parcalar), SATIR_BASINA_PARCA):
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
            )
            veri = json.loads(resp.choices[0].message.content)
        except Exception:
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
