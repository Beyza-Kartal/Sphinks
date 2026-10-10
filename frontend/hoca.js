/**
 * Kıvılcım / Hazır mısın? - Hoca Mantığı (hoca.js)
 * Sahip: C (İçerik + Hoca + Sunum)
 * Bağlandığı API'ler:
 *   GET  /api/hoca/sinif-listesi/{hoca_id}
 *   POST /api/hoca/sinif-ekle
 *   GET  /api/hoca/panel/{sinif_id}
 *   POST /api/video-ekle
 *
 * DUZELTME (21:xx): sinifId artik backend'in gercek INT id'si (eskiden
 * "KIV6A2" gibi sabit bir kod kullaniliyordu, bu /api/hoca/panel icin
 * gecersizdi ve sessizce eski/sahte demo verisine dusuyordu). Sinif listesi
 * artik /api/hoca/sinif-listesi'nden gercek olarak cekiliyor, "+ Yeni Sinif"
 * butonu /api/hoca/sinif-ekle'yi cagiriyor.
 */

const state = {
  hocaId: sessionStorage.getItem("hoca_id") || null,
  hocaIsim: sessionStorage.getItem("hoca_isim") || "Öğretmen",
  sinifId: null, // gercek int id, sinif listesi yuklenince doldurulur
  sinifKodu: null,
  sinifDersId: null, // "/api/video-ekle" icin hangi derse ekleniyor bilgisi
  isDemo: new URLSearchParams(window.location.search).get("demo") === "1" || sessionStorage.getItem("is_demo") === "true",
  panelData: null,
  dersEkleModu: false, // true: modalYeniSinif "+ Ders Ekle" ile acildi, mevcut sinifa yeni unite atanacak
};

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
}

// --- API Çağrı Yardımcısı ---
async function apiCall(url, method = "GET", body = null) {
  try {
    const opts = { method, headers: { "Content-Type": "application/json" } };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(url, opts);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[API Fallback] ${url} erişilemedi, sözleşme verisi üretiliyor:`, err);
    return getHocaMock(url, method, body);
  }
}

// Sunucu yoksa veya demo modundaysa sözleşme 5.2 formatında mock
// DUZELTME: tema artik gercek icerikle ayni ("fonksiyonlar" dersi, eski
// "payda_esitleme/kesirler" temasi kaldirildi, karisikliga yol aciyordu.
function getHocaMock(url, method, body) {
  if (url.includes("/api/hoca/sinif-listesi")) {
    return { siniflar: state.isDemo ? [{ sinif_id: 1, kod: "DEMO01", ders_id: "fonksiyonlar" }] : [] };
  }

  if (url.includes("/api/hoca/sinif-ders-ekle")) {
    return { sinif_id: state.sinifId || 1, kod: state.sinifKodu || "DEMO01", ders_id: "fonksiyonlar", unite_id: body ? body.unite_id : null };
  }

  if (url.includes("/api/hoca/sinif-ekle")) {
    return { sinif_id: 1, kod: "DEMO01", ders_id: "fonksiyonlar" };
  }

  if (method === "DELETE" && url.includes("/api/hoca/sinif/")) {
    return { sonuc: "silindi" };
  }

  if (url.includes("/api/hoca/panel")) {
    if (state.isDemo) {
      return {
        hazir_orani: 0.68,
        tamamlayan_sayisi: 16,
        eksik_dagilimi: { "kumeler_ve_ikililer": 12, "cebirsel_ifadeler": 4 },
        eksik_yuzdeleri: [
          { alt_konu_id: "kumeler_ve_ikililer", ogrenci_sayisi: 12, yuzde: 75.0 },
          { alt_konu_id: "cebirsel_ifadeler", ogrenci_sayisi: 4, yuzde: 25.0 },
        ],
        ogrenciler: [
          { isim: "Deniz A.", durum: "test_suruyor", progress: 40 },
          { isim: "Ece K.", durum: "eksigi_var", progress: 68 },
          { isim: "Mert D.", durum: "hazir", progress: 100 },
          { isim: "Selin Y.", durum: "eksigi_var", progress: 52 },
        ],
      };
    } else {
      return {
        hazir_orani: 0,
        tamamlayan_sayisi: 0,
        eksik_dagilimi: {},
        eksik_yuzdeleri: [],
        ogrenciler: [],
      };
    }
  }

  if (url.includes("/api/video-ekle")) {
    return {
      video_id: 4,
      yeni_secenek: {
        kanal_adi: "Yeni Eklenen Kanal",
        youtube_id: "9VZsMY15xeU",
        baslangic_sn: 0,
        bitis_sn: 180,
      },
    };
  }

  return {};
}

// Backend'in durum degerlerini (hic_baslamadi/test_suruyor/eksigi_var/hazir)
// okunabilir Turkce etikete ve ilerleme yuzdesine cevirir.
function durumEtiketle(durum) {
  const harita = {
    hic_baslamadi: { metin: "Henüz başlamadı", progress: 0 },
    test_suruyor: { metin: "Test sürüyor", progress: 40 },
    eksigi_var: { metin: "Eksiği var", progress: 65 },
    hazir: { metin: "Hazır", progress: 100 },
  };
  return harita[durum] || { metin: durum || "Öğreniyor", progress: 50 };
}

// Secilen derse ait uniteleri (GET /api/hoca/uniteler) getirip "Yeni Sinif"
// modalindaki secim kutusunu doldurur. Soru sayisi 0 olan unite (buse henuz
// soru eklemediyse) secilemez, "(yakinda)" diye isaretlenir.
let _uniteCache = null;
async function doldurUniteSecici() {
  const selectUnite = document.getElementById("selectUniteYeni");
  selectUnite.innerHTML = `<option value="">Yükleniyor...</option>`;

  const data = state.isDemo
    ? { uniteler: [{ unite_id: "fonksiyonlar_1", ad: "Fonksiyonlar 1 (Demo)", konular: ["kumeler_ve_ikililer"], soru_sayisi: 10 }] }
    : await apiCall("/api/hoca/uniteler");
  _uniteCache = data.uniteler || [];

  selectUnite.innerHTML = "";
  _uniteCache.forEach((u) => {
    const opt = document.createElement("option");
    opt.value = u.unite_id;
    const hazirMi = u.soru_sayisi > 0;
    opt.textContent = hazirMi ? u.ad : `${u.ad} (yakında)`;
    opt.disabled = !hazirMi;
    selectUnite.appendChild(opt);
  });

  // Ilk hazir uniteyi otomatik sec
  const ilkHazir = _uniteCache.find((u) => u.soru_sayisi > 0);
  if (ilkHazir) selectUnite.value = ilkHazir.unite_id;
  gosterUniteKonulari();
}

// Secilen unitenin konularini etiket (chip) olarak gosterir
function gosterUniteKonulari() {
  const uniteId = document.getElementById("selectUniteYeni").value;
  const konuDiv = document.getElementById("uniteKonuListesi");
  const unite = (_uniteCache || []).find((u) => u.unite_id === uniteId);

  if (!unite) {
    konuDiv.innerHTML = `<span style="color: var(--muted); font-size: 13px;">Ünite seçilmedi</span>`;
    return;
  }

  konuDiv.innerHTML = unite.konular
    .map((k) => `<span style="font-size: 12px; font-weight: 600; background: var(--mint); color: var(--green); padding: 5px 10px; border-radius: 8px;">${ALT_KONU_ETIKET[k] || k}</span>`)
    .join("");
}

// --- Sinif Listesini Backend'den Getir ve Secim Kutusunu Doldur ---
async function loadSiniflar(oncekiSinifId) {
  const selectClass = document.getElementById("selectClass");
  const badgeWrap = document.getElementById("badgeClassCodeWrap");
  const badgeClassCode = document.getElementById("badgeClassCode");

  let siniflar = [];
  if (state.isDemo) {
    siniflar = getHocaMock("/api/hoca/sinif-listesi").siniflar;
  } else if (state.hocaId) {
    const data = await apiCall(`/api/hoca/sinif-listesi/${state.hocaId}`);
    siniflar = data.siniflar || [];
  }

  selectClass.innerHTML = "";

  if (siniflar.length === 0) {
    selectClass.innerHTML = `<option value="">Henüz sınıfın yok</option>`;
    state.sinifId = null;
    state.sinifKodu = null;
    badgeWrap.style.display = "none";
    return;
  }

  siniflar.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.sinif_id;
    opt.textContent = `${s.kod} (${ALT_KONU_ETIKET[s.ders_id] || s.ders_id})`;
    opt.dataset.kod = s.kod;
    opt.dataset.ders = s.ders_id;
    selectClass.appendChild(opt);
  });

  const secilecek = siniflar.find((s) => String(s.sinif_id) === String(oncekiSinifId)) || siniflar[0];
  selectClass.value = secilecek.sinif_id;
  state.sinifId = secilecek.sinif_id;
  state.sinifKodu = secilecek.kod;
  state.sinifDersId = secilecek.ders_id;
  badgeWrap.style.display = "inline-flex";
  badgeClassCode.textContent = secilecek.kod;
  document.getElementById("modalClassCode").textContent = secilecek.kod;
}

// --- Sayfa Başlatıcı ---
async function initHocaPanel() {
  document.getElementById("teacherInitial").textContent = state.hocaIsim ? state.hocaIsim[0].toUpperCase() : "Ö";
  document.getElementById("teacherNameText").textContent = state.hocaIsim;
  document.getElementById("welcomeText").textContent = `Günaydın, ${state.hocaIsim}.`;

  if (state.isDemo) {
    // Gercek veriyle karistirilmasin diye acikca etiketliyoruz.
    const topStep = document.getElementById("topStepText");
    if (topStep) topStep.textContent = "⚠️ DEMO MODU — veriler gerçek değil";
  }

  // Çıkış Butonu
  document.getElementById("btnLogout").addEventListener("click", () => {
    sessionStorage.clear();
    window.location.href = "./index.html";
  });

  // Tema Yönetimi
  const savedTheme = localStorage.getItem("kivilcim_theme") || "light";
  if (savedTheme === "dark") {
    document.documentElement.classList.add("dark");
    document.getElementById("btnThemeToggle").textContent = "☀️";
  }
  document.getElementById("btnThemeToggle").addEventListener("click", () => {
    const isDark = document.documentElement.classList.toggle("dark");
    document.getElementById("btnThemeToggle").textContent = isDark ? "☀️" : "🌙";
    localStorage.setItem("kivilcim_theme", isDark ? "dark" : "light");
  });

  // Sınıf Seçici — artık gerçek backend'den dolduruluyor
  const selectClass = document.getElementById("selectClass");
  await loadSiniflar();
  await loadPanelData();

  selectClass.addEventListener("change", (e) => {
    const secilen = e.target.selectedOptions[0];
    state.sinifId = e.target.value;
    state.sinifKodu = secilen ? secilen.dataset.kod : null;
    state.sinifDersId = secilen ? secilen.dataset.ders : null;
    document.getElementById("badgeClassCode").textContent = state.sinifKodu || "—";
    document.getElementById("modalClassCode").textContent = state.sinifKodu || "—";
    loadPanelData();
  });

  // Öğrenciler katıldıkça/test bitirdikçe hoca'nın elle yenile demesine
  // gerek kalmasın diye panel düzenli aralıklarla kendiliğinden güncellenir.
  setInterval(() => {
    if (state.sinifId && document.visibilityState === "visible") {
      loadPanelData();
    }
  }, 6000);

  // Yeni Sınıf Modalını Aç (ders/ünite/konu seçimi)
  document.getElementById("btnYeniSinif").addEventListener("click", async () => {
    state.dersEkleModu = false;
    document.getElementById("modalYeniSinifEyebrow").textContent = "Yeni Sınıf";
    document.getElementById("modalYeniSinifBaslik").textContent = "Ders ve Ünite Seç";
    document.getElementById("btnOlusturSinif").textContent = "Oluştur";
    document.getElementById("modalYeniSinif").style.display = "flex";
    await doldurUniteSecici();
  });

  // Ders Ekle Modalını Ac - AYNI modal, ama MEVCUT secili sinifa yeni unite
  // atamak icin (kod/ogrenciler/eski denemeler AYNEN kalir, bkz. sinif-ders-ekle).
  document.getElementById("btnDersEkle").addEventListener("click", async () => {
    if (!state.sinifId) {
      alert("Önce bir sınıf seç ya da oluştur.");
      return;
    }
    state.dersEkleModu = true;
    document.getElementById("modalYeniSinifEyebrow").textContent = "Ders Ekle";
    document.getElementById("modalYeniSinifBaslik").textContent = `${state.sinifKodu || ""} Sınıfına Yeni Test Ata`;
    document.getElementById("btnOlusturSinif").textContent = "Ata";
    document.getElementById("modalYeniSinif").style.display = "flex";
    await doldurUniteSecici();
  });

  document.getElementById("btnCloseYeniSinif").addEventListener("click", () => {
    document.getElementById("modalYeniSinif").style.display = "none";
  });
  document.getElementById("selectUniteYeni").addEventListener("change", gosterUniteKonulari);

  // Yeni Sınıf Oluştur (POST /api/hoca/sinif-ekle) veya Mevcut Sinifa Ders
  // Ekle (POST /api/hoca/sinif-ders-ekle) — hangisi state.dersEkleModu'na gore
  document.getElementById("btnOlusturSinif").addEventListener("click", async () => {
    const uniteId = document.getElementById("selectUniteYeni").value;
    if (!uniteId) {
      alert("Lütfen bir ünite seç.");
      return;
    }
    const btn = document.getElementById("btnOlusturSinif");
    btn.disabled = true;
    btn.textContent = state.dersEkleModu ? "Atanıyor..." : "Oluşturuluyor...";
    try {
      if (state.dersEkleModu) {
        const sonuc = await apiCall("/api/hoca/sinif-ders-ekle", "POST", {
          hoca_id: state.hocaId ? parseInt(state.hocaId, 10) : 1,
          sinif_id: state.sinifId,
          unite_id: uniteId,
        });
        document.getElementById("modalYeniSinif").style.display = "none";
        await loadSiniflar(sonuc.sinif_id);
        await loadPanelData();
        alert(`Yeni test atandı!\nKatılım kodu değişmedi: ${sonuc.kod}\n\nÖğrenciler aynı kodla bağlanıp yeni testi görecek.`);
      } else {
        const yeni = await apiCall("/api/hoca/sinif-ekle", "POST", {
          hoca_id: state.hocaId ? parseInt(state.hocaId, 10) : 1,
          unite_id: uniteId,
        });
        document.getElementById("modalYeniSinif").style.display = "none";
        await loadSiniflar(yeni.sinif_id);
        await loadPanelData();
        alert(`Yeni sınıf oluşturuldu!\nKatılım kodu: ${yeni.kod}\n\nBu kodu öğrencilerinle paylaş.`);
      }
    } catch (err) {
      alert(
        state.dersEkleModu
          ? "Test atanamadı — seçtiğin ünitede henüz soru olmayabilir."
          : "Sınıf oluşturulamadı — seçtiğin ünitede henüz soru olmayabilir."
      );
      console.error(err);
    } finally {
      btn.disabled = false;
      btn.textContent = state.dersEkleModu ? "Ata" : "Oluştur";
    }
  });

  // Sınıfı Sil (DELETE /api/hoca/sinif/{id}) — yil sonu temizligi, geri alinamaz.
  document.getElementById("btnSinifSil").addEventListener("click", async () => {
    if (!state.sinifId) {
      alert("Silinecek bir sınıf seçili değil.");
      return;
    }
    const onay = confirm(
      `"${state.sinifKodu}" sınıfını silmek istediğine emin misin?\n\nBu sınıfa ait TÜM öğrenci, test ve cevap verileri kalıcı olarak silinecek. Bu işlem GERİ ALINAMAZ.`
    );
    if (!onay) return;

    try {
      const hocaId = state.hocaId ? parseInt(state.hocaId, 10) : 1;
      const res = await fetch(`/api/hoca/sinif/${state.sinifId}?hoca_id=${hocaId}`, { method: "DELETE" });
      if (!res.ok) {
        const hata = await res.json().catch(() => ({}));
        throw new Error(hata.detail || `HTTP ${res.status}`);
      }
      await loadSiniflar();
      await loadPanelData();
      alert("Sınıf ve tüm verileri silindi.");
    } catch (err) {
      alert(`Sınıf silinemedi: ${err.message || "bilinmeyen hata"}`);
      console.error(err);
    }
  });

  // Ortak Eksik Detay Modalı Kapat
  document.getElementById("btnCloseEksikDetay").addEventListener("click", () => {
    document.getElementById("modalEksikDetay").style.display = "none";
  });

  // QR Modal Butonları
  document.getElementById("btnShowQr").addEventListener("click", openQrModal);
  document.getElementById("btnCloseQr").addEventListener("click", () => {
    document.getElementById("modalQr").style.display = "none";
  });

  // Video Ekleme Modal Butonları
  document.getElementById("btnAddVideo").addEventListener("click", () => {
    document.getElementById("modalAddVideo").style.display = "flex";
  });
  document.getElementById("btnCloseAddVideo").addEventListener("click", () => {
    document.getElementById("modalAddVideo").style.display = "none";
  });

  // Video Ekleme Form Gönderimi (POST /api/video-ekle)
  document.getElementById("formAddVideo").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("btnSubmitVideo");
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner small"></span> Bölümleniyor...`;

    const url = document.getElementById("inputYoutubeUrl").value.trim();
    // apiCall() HTTP hatalarini da mock veriyle yutuyor (demo modu icin
    // kasitli), gercek hata mesajini gormek icin burada direkt fetch kullan.
    try {
      const res = await fetch("/api/video-ekle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ders_id: state.sinifDersId || "fonksiyonlar", youtube_url: url }),
      });
      const sonuc = await res.json();
      if (!res.ok) throw new Error(sonuc.detail || `HTTP ${res.status}`);
      const bolumSayisi = sonuc.bolumler ? sonuc.bolumler.length : 0;
      document.getElementById("modalAddVideo").style.display = "none";
      alert(`Video eklendi! AI, videoyu ${bolumSayisi} alt konuya böldü.`);
    } catch (err) {
      alert(`Video eklenemedi: ${err.message || "linki ve altyazısı olup olmadığını kontrol et."}`);
      console.error(err);
    } finally {
      btn.disabled = false;
      btn.textContent = "Bölümle ve Ekle";
    }
  });
}

// "fonksiyonlar" dersindeki 8 alt konunun okunabilir Turkce karsiliklari
const ALT_KONU_ETIKET = {
  kumeler_ve_ikililer: "Kümeler ve Sıralı İkililer",
  cebirsel_ifadeler: "Cebirsel İfadeler",
  koordinat_sistemi: "Koordinat Sistemi",
  birinci_derece_denklemler: "Birinci Derece Denklemler",
  fonksiyon_tanimi_ve_deger: "Fonksiyon Tanımı ve Değeri",
  fonksiyon_turleri: "Fonksiyon Türleri",
  dogrusal_fonksiyon_grafigi: "Doğrusal Fonksiyon Grafiği",
  bileske_ve_ters_fonksiyon: "Bileşke ve Ters Fonksiyon",
};

// --- Panel Verilerini Getir (GET /api/hoca/panel/{sinif_id}) ---
async function loadPanelData() {
  if (!state.sinifId) {
    renderDashboard({ hazir_orani: 0, eksik_dagilimi: {}, ogrenciler: [] });
    return;
  }
  const data = await apiCall(`/api/hoca/panel/${state.sinifId}`);
  state.panelData = data;
  renderDashboard(data);
}

// --- Paneli Ekrana Çiz ---
function renderDashboard(data) {
  const hazirOrani = Math.round((data.hazir_orani || 0) * 100);
  const ogrenciler = data.ogrenciler || [];

  // 1. İstatistikler
  document.getElementById("statHazirOrani").textContent = `%${hazirOrani}`;
  document.getElementById("statHazirDetail").textContent = hazirOrani > 50 ? "Hedefin üzerinde" : "Öğrenme sürüyor";

  document.getElementById("statKatilanSayisi").textContent = ogrenciler.length;
  document.getElementById("statKatilanDetail").textContent = ogrenciler.length > 0 ? "Canlı takip ediliyor" : "Henüz katılım yok";

  // Ortak Eksik — yuzdeler artik backend'den geliyor (eksik_yuzdeleri), payda
  // SADECE testi bitirmis ogrenciler (tamamlayan_sayisi), tum kayitli sinif
  // degil - oyle olunca hic baslamayanlar orani yapay dusuruyordu.
  const eksikYuzdeleri = data.eksik_yuzdeleri || [];
  const enCokEksik = eksikYuzdeleri[0] || null;
  if (enCokEksik) {
    document.getElementById("statOrtakEksik").textContent = `%${Math.round(enCokEksik.yuzde)}`;
    document.getElementById("statEksikDetail").textContent = ALT_KONU_ETIKET[enCokEksik.alt_konu_id] || enCokEksik.alt_konu_id;
  } else {
    document.getElementById("statOrtakEksik").textContent = "—";
    document.getElementById("statEksikDetail").textContent = "Veri toplanıyor";
  }

  // 2. Çevrimiçi Durumu
  document.getElementById("onlineCountText").textContent = `${ogrenciler.length} çevrimiçi`;
  if (ogrenciler.length === 0) {
    document.getElementById("onlineDot").style.background = "var(--muted)";
  } else {
    document.getElementById("onlineDot").style.background = "#35ad7b";
  }

  // 3. Öğrenci Tablosu
  const listContainer = document.getElementById("studentListContainer");
  if (ogrenciler.length > 0) {
    listContainer.innerHTML = `
      <div class="table-head">
        <span>Öğrenci</span>
        <span>Bulunduğu Adım</span>
        <span>İlerleme</span>
      </div>
      ${ogrenciler
        .map((s) => {
          const { metin, progress: prog } = durumEtiketle(s.durum);
          return `
          <div class="student-row">
            <span class="student-name"><i>${escapeHtml(s.isim ? s.isim[0] : "Ö")}</i>${escapeHtml(s.isim)}</span>
            <span><b class="state-tag ${prog === 100 ? "state-100" : ""}">${metin}</b></span>
            <span class="mini-progress">
              <i><b style="width: ${prog}%;"></b></i>
              <em>%${prog}</em>
            </span>
          </div>
        `;
        })
        .join("")}
    `;
  } else {
    listContainer.innerHTML = `
      <div style="padding: 36px 20px; text-align: center; color: var(--muted); font-size: 14px; border-radius: 16px; border: 1px dashed var(--line); margin-top: 16px;">
        <div style="margin-bottom: 8px; font-size: 28px;">👥</div>
        <strong style="display: block; color: var(--ink); margin-bottom: 4px; font-size: 15px;">
          Henüz derse katılan öğrenci yok
        </strong>
        <span>Öğrencileriniz tahtadaki QR kodu okutarak veya <strong>${state.sinifKodu || "—"}</strong> kodunu girerek bağlandığında burada canlı olarak listelenecektir.</span>
      </div>
    `;
  }

  // 4. Sınıf İçgörüsü
  const insightTitle = document.getElementById("insightTitle");
  const insightDesc = document.getElementById("insightDesc");
  const btnDetail = document.getElementById("btnInsightDetail");

  if (enCokEksik) {
    insightTitle.textContent = state.isDemo
      ? "12 öğrenci aynı adımda zorlanıyor."
      : `${enCokEksik.ogrenci_sayisi} öğrenci aynı konuda zorlanıyor.`;
    insightDesc.textContent = `${ALT_KONU_ETIKET[enCokEksik.alt_konu_id] || enCokEksik.alt_konu_id} konusunda sınıfa kısa bir hatırlatma yapabilir veya yeni video atayabilirsin.`;
    btnDetail.disabled = false;
    btnDetail.style.opacity = "1";
    btnDetail.style.cursor = "pointer";
    btnDetail.textContent = "Detayı görüntüle →";
    btnDetail.onclick = () => gosterEksikDetayModal(eksikYuzdeleri);
  } else {
    insightTitle.textContent = "Yeterli Veri Toplanmadı";
    insightDesc.textContent = "Öğrenciler ön test ve ders etkinliklerini tamamladıkça sınıfın ortak eksikleri burada analiz edilecektir.";
    btnDetail.disabled = true;
    btnDetail.style.opacity = "0.6";
    btnDetail.style.cursor = "not-allowed";
    btnDetail.textContent = "Analiz Bekleniyor";
  }
}

// Ortak Eksik karti tiklaninca TUM konulardaki yuzdeyi gosteren modal
// (eski davranis sadece en cok eksik olan TEK konuyu alert ile gosteriyordu).
function gosterEksikDetayModal(eksikYuzdeleri) {
  const liste = document.getElementById("eksikDetayListesi");
  if (!eksikYuzdeleri || eksikYuzdeleri.length === 0) {
    liste.innerHTML = `<span style="color: var(--muted); font-size: 14px;">Henüz veri yok.</span>`;
  } else {
    liste.innerHTML = eksikYuzdeleri
      .map(
        (e) => `
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; margin-bottom: 4px;">
            <span>${ALT_KONU_ETIKET[e.alt_konu_id] || e.alt_konu_id}</span>
            <span>%${e.yuzde} (${e.ogrenci_sayisi} öğrenci)</span>
          </div>
          <div style="height: 8px; border-radius: 6px; background: var(--line); overflow: hidden;">
            <div style="height: 100%; width: ${e.yuzde}%; background: var(--green);"></div>
          </div>
        </div>
      `
      )
      .join("");
  }
  document.getElementById("modalEksikDetay").style.display = "flex";
}

// --- QR Kod Modalı Açma ---
async function openQrModal() {
  const modal = document.getElementById("modalQr");
  const box = document.getElementById("qrFrameBox");
  modal.style.display = "flex";
  box.innerHTML = `<span class="spinner"></span>`;

  let origin = window.location.origin;
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    try {
      const res = await fetch("/api/sunucu-bilgisi");
      const data = await res.json();
      if (data.public_url) {
        // ngrok calisiyor: farkli ag/cihazdan da erisilebilen genel adres,
        // ayni wifi'deki cihaz izolasyonu (orn. kampus wifi) dahi sorun olmaz.
        origin = data.public_url;
      } else if (data.lan_ip) {
        // ngrok yok: sadece ayni wifi'deki cihazlar icin yedek cozum.
        const port = window.location.port ? `:${window.location.port}` : "";
        origin = `${window.location.protocol}//${data.lan_ip}${port}`;
      }
    } catch (err) {
      // Hicbiri alinamazsa mevcut origin (localhost) ile devam edilir
    }
  }
  const joinUrl = `${origin}/index.html?sinif=${encodeURIComponent(state.sinifKodu || "")}`;
  try {
    if (window.QRCode && typeof window.QRCode.toDataURL === "function") {
      const dataUrl = await window.QRCode.toDataURL(joinUrl, {
        width: 280,
        margin: 2,
        color: { dark: "#17352f", light: "#ffffff" },
      });
      box.innerHTML = `<img src="${dataUrl}" alt="Sınıf QR" style="width: 100%; border-radius: 12px;" />`;
    } else {
      const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(joinUrl)}&color=17-53-47`;
      box.innerHTML = `<img src="${fallbackUrl}" alt="Sınıf QR" style="width: 100%; border-radius: 12px;" />`;
    }
  } catch (err) {
    box.innerHTML = `<p style="color: var(--coral); font-size: 13px;">QR üretilemedi</p>`;
  }
}

// --- Başlatıcı ---
document.addEventListener("DOMContentLoaded", initHocaPanel);
if (document.readyState === "interactive" || document.readyState === "complete") {
  initHocaPanel();
}
