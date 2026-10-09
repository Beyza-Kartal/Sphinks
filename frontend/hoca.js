/**
 * HazırMısın? - Hoca Paneli İstemci Betiği (hoca.js)
 * Sorumlu: C Kişisi
 * Açıklama: Canlı sınıf verilerini FastAPI backend'inden çeker, 
 * göstergeleri dinamik günceller ve mobil katılım için QR kod üretir.
 */

// QR Kod Nesnesi Referansı
let qrNesnesi = null;
let yenilemeZamanlayicisi = null;

// Sayfa yüklendiğinde çalışacak ana tetikleyici
document.addEventListener("DOMContentLoaded", () => {
  const sinifSecici = document.getElementById("sinifSelect");
  const qrGuncelleButon = document.getElementById("btnQrGuncelle");
  const ngrokInput = document.getElementById("ngrokUrlInput");

  // 1. QR Kodunu Başlat
  qrKoduCiz(ngrokInput.value.trim());

  // QR Güncelleme butonuna basıldığında
  qrGuncelleButon.addEventListener("click", () => {
    const url = ngrokInput.value.trim();
    if (url) {
      qrKoduCiz(url);
    }
  });

  // 2. İlk Veri Çekimi
  panelVerileriniGetir(sinifSecici.value);

  // 3. Sınıf Değiştiğinde Anında Veriyi Güncelle
  sinifSecici.addEventListener("change", (e) => {
    panelVerileriniGetir(e.target.value);
  });

  // 4. Her 5 Saniyede Bir Otomatik Yenileme (Auto-refresh)
  yenilemeZamanlayicisi = setInterval(() => {
    panelVerileriniGetir(sinifSecici.value);
  }, 5000);
});

/**
 * Backend API'sinden sınıf durum verilerini çeker
 * Endpoint: /api/hoca/panel/{sinif_id}
 */
async function panelVerileriniGetir(sinifId) {
  try {
    const yanit = await fetch(`/api/hoca/panel/${sinifId}`);
    
    if (!yanit.ok) {
      throw new Error(`Sunucu yanıtı başarısız: ${yanit.status}`);
    }

    const veri = await yanit.json();
    ekraniGuncelle(veri);

    // Son güncelleme zamanını yaz
    const simdi = new Date();
    const saatMetni = simdi.toLocaleTimeString("tr-TR");
    document.getElementById("sonGuncelleme").textContent = `Son güncelleme: ${saatMetni}`;
  } catch (hata) {
    console.warn("Panel verisi alınırken hata veya sunucu henüz hazır değil:", hata);
    // Backend henüz ayağa kalkmadıysa veya bağlantı yoksa arayüzün bozulmaması için bilgi verilir
    document.getElementById("sonGuncelleme").textContent = "Sunucuya bağlanılamadı (5sn sonra tekrar)";
  }
}

/**
 * Gelen JSON verisini arayüzdeki ilgili DOM elemanlarına yerleştirir
 */
function ekraniGuncelle(veri) {
  if (!veri) return;

  // 1. Hazır Olma Oranı ve Özet Sayılar
  const hazirOrani = veri.hazir_orani !== undefined ? Math.round(veri.hazir_orani) : 0;
  const toplamOgrenci = veri.toplam_ogrenci || (veri.ogrenciler ? veri.ogrenciler.length : 0);
  const hazirOgrenci = veri.hazir_ogrenci_sayisi !== undefined ? veri.hazir_ogrenci_sayisi : 0;
  const eksikOgrenci = Math.max(0, toplamOgrenci - hazirOgrenci);

  // Yüzde ve İlerleme Çubuğu
  document.getElementById("hazirYuzdeMetin").textContent = `%${hazirOrani}`;
  document.getElementById("hazirProgressBar").style.width = `${hazirOrani}%`;

  // Sayısal Kutucuklar
  document.getElementById("toplamOgrenciSayisi").textContent = toplamOgrenci;
  document.getElementById("hazirOgrenciSayisi").textContent = hazirOgrenci;
  document.getElementById("eksikOgrenciSayisi").textContent = eksikOgrenci;
  document.getElementById("ogrenciSayisiBadge").textContent = `${toplamOgrenci} Öğrenci`;

  // 2. Eksik Dağılımı Listesini Doldur
  const eksikKutusu = document.getElementById("eksikDagilimListesi");
  eksikKutusu.innerHTML = "";

  if (veri.eksik_dagilimi && veri.eksik_dagilimi.length > 0) {
    veri.eksik_dagilimi.forEach((madde) => {
      const eksikYuzdesi = madde.oran !== undefined ? Math.round(madde.oran) : 0;
      const baslik = madde.baslik || madde.eksik_id || "Genel Eksik";
      const ogrenciSayisi = madde.sayi !== undefined ? madde.sayi : 0;

      const satirHtml = `
        <div class="eksik-item">
          <div class="eksik-info">
            <span>${guvenliMetin(baslik)}</span>
            <span style="color: var(--danger);">${ogrenciSayisi} Öğrenci (%${eksikYuzdesi})</span>
          </div>
          <div class="eksik-bar-track">
            <div class="eksik-bar-fill" style="width: ${eksikYuzdesi}%;"></div>
          </div>
        </div>
      `;
      eksikKutusu.insertAdjacentHTML("beforeend", satirHtml);
    });
  } else {
    eksikKutusu.innerHTML = `
      <p style="color: var(--success); font-size: 14px; font-weight: 500;">
        🎉 Harika! Şu anda sınıfta tespit edilen kritik bir konu eksiği bulunmuyor.
      </p>
    `;
  }

  // 3. Öğrenci Listesi Tablosunu Doldur
  const tabloGovdesi = document.getElementById("ogrenciTabloGovdesi");
  tabloGovdesi.innerHTML = "";

  if (veri.ogrenciler && veri.ogrenciler.length > 0) {
    veri.ogrenciler.forEach((ogr) => {
      let rozetSinifi = "badge-devam";
      let durumMetni = "İnceleniyor";

      if (ogr.durum === "hazir" || ogr.durum === "basarili") {
        rozetSinifi = "badge-hazir";
        durumMetni = "Derse Hazır";
      } else if (ogr.durum === "eksik_var" || ogr.durum === "calisiyor") {
        rozetSinifi = "badge-eksik";
        durumMetni = "Eksik Gideriyor";
      }

      const eksikMetni = ogr.eksik ? guvenliMetin(ogr.eksik) : "—";
      const puanMetni = ogr.skor !== undefined ? `${ogr.skor} Puan` : "—";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${guvenliMetin(ogr.ad || "İsimsiz Öğrenci")}</strong></td>
        <td>
          <span class="badge ${rozetSinifi}">${durumMetni}</span>
        </td>
        <td style="color: ${ogr.eksik ? 'var(--danger)' : 'var(--text-muted)'}; font-weight: ${ogr.eksik ? '600' : 'normal'};">
          ${eksikMetni}
        </td>
        <td>${puanMetni}</td>
        <td style="color: var(--text-muted); font-size: 13px;">
          ${ogr.durum === "hazir" ? "✅ Ön Testi Geçti" : "📖 Telafi Videosunda"}
        </td>
      `;
      tabloGovdesi.appendChild(tr);
    });
  } else {
    tabloGovdesi.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">
          Henüz teste katılan öğrenci bulunmuyor. QR kod ile öğrencileri davet edebilirsiniz.
        </td>
      </tr>
    `;
  }
}

/**
 * QR Kod Kütüphanesini kullanarak ekrana QR Kod üretir
 */
function qrKoduCiz(metin) {
  const qrKutusu = document.getElementById("qrcode");
  if (!qrKutusu) return;

  // Alanı temizle
  qrKutusu.innerHTML = "";

  if (typeof QRCode !== "undefined") {
    qrNesnesi = new QRCode(qrKutusu, {
      text: metin || window.location.origin,
      width: 150,
      height: 150,
      colorDark: "#1e1b4b",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M
    });
  } else {
    qrKutusu.innerHTML = `<span style="font-size: 11px; color: var(--danger);">QR Kütüphanesi Yüklenemedi</span>`;
  }
}

/**
 * Basit XSS önleme fonksiyonu
 */
function guvenliMetin(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
