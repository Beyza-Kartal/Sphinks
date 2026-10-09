"""
MODÜL: altyazi_servisi.py
GÖREV: Verilen YouTube bağlantısından video kimliğini (ID) çıkarır 
       ve zaman damgalı altyazı metinlerini çeker.
"""

import re
from youtube_transcript_api import YouTubeTranscriptApi


class AltyaziServisi:
    """YouTube videolarından altyazı ve zaman damgası çeken servis sınıfı."""

    def __init__(self, diller=None):
        # Varsayılan olarak önce Türkçe, yoksa İngilizce dener
        if diller is None:
            self.diller = ["tr", "en"]
        else:
            self.diller = diller

    def video_id_cikar(self, youtube_url: str) -> str:
        """
        Her türlü YouTube linkinden (kısa link, normal link, shorts)
        11 haneli video kimliğini (ID) güvenle ayıklar.
        """
        if not youtube_url:
            return None

        kaliplar = [
            r"(?:v=)([a-zA-Z0-9_-]{11})",
            r"(?:youtu\.be/)([a-zA-Z0-9_-]{11})",
            r"(?:youtube\.com/shorts/)([a-zA-Z0-9_-]{11})"
        ]

        for kalip in kaliplar:
            eslesme = re.search(kalip, youtube_url)
            if eslesme:
                return eslesme.group(1)

        return None

    def altyazi_getir(self, youtube_url: str):
        """
        Verilen linkin altyazısını çeker ve her cümlenin
        başlangıç, süre ve bitiş saniyesini düzenli bir liste olarak döner.
        """
        video_id = self.video_id_cikar(youtube_url)

        if not video_id:
            raise ValueError("Geçerli bir YouTube video kimliği bulunamadı!")

        # YouTubeTranscriptApi ile transkripti çekiyoruz
        ham_transkript = YouTubeTranscriptApi().fetch(
            video_id,
            languages=self.diller
        )

        duzenli_altyazi = []
        for parca in ham_transkript:
            duzenli_altyazi.append({
                "metin": parca.text,
                "baslangic": round(parca.start, 2),
                "sure": round(parca.duration, 2),
                "bitis": round(parca.start + parca.duration, 2)
            })

        return {
            "video_id": video_id,
            "parcalar": duzenli_altyazi
        }
if __name__ == "__main__":
    servis = AltyaziServisi()
    test_linki = "https://youtu.be/M-Bufmo1Bz8"
    
    sonuc = servis.altyazi_getir(test_linki)
    
    toplam_cumle = len(sonuc["parcalar"])
    son_parca = sonuc["parcalar"][-1]
    toplam_dakika = round(son_parca["bitis"] / 60, 1)

    print("=" * 40)
    print(f"✅ Video Kimliği: {sonuc['video_id']}")
    print(f"📝 Toplam Konuşulan Cümle Sayısı: {toplam_cumle}")
    print(f"⏱️ Videonun Bitiş Süresi: {son_parca['bitis']} saniye (Yaklaşık {toplam_dakika} Dakika!)")
    print("=" * 40)

