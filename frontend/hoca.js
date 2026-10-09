/**
 * Kıvılcım / Hazır mısın? - Hoca Mantığı (hoca.js)
 * Sahip: C (İçerik + Hoca + Sunum)
 * Bağlandığı API'ler:
 *   GET  /api/hoca/panel/{sinif_id}
 *   POST /api/video-ekle
 */

const state = {
  hocaIsim: sessionStorage.getItem("hoca_isim") || "Ayşe Öğretmen",
  sinifId: sessionStorage.getItem("sinif_id") || "KIV6A2",
  isDemo: new URLSearchParams(window.location.search).get("demo") === "1" || sessionStorage.getItem("is_demo") === "true",
  panelData: null,
};

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
function getHocaMock(url, method, body) {
  if (url.includes("/api/hoca/panel")) {
    if (state.isDemo) {
      return {
        hazir_orani: 0.68,
        eksik_dagilimi: { "payda_esitleme": 12, "tam_sayili_kesir": 4 },
        ogrenciler: [
          { isim: "Deniz A.", durum: "Ön test", progress: 40 },
          { isim: "Ece K.", durum: "Öğreniyor", progress: 68 },
          { isim: "Mert D.", durum: "Tamamladı", progress: 100 },
          { isim: "Selin Y.", durum: "Teşhis", progress: 52 },
        ],
      };
    } else {
      return {
        hazir_orani: 0,
        eksik_dagilimi: {},
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

// --- Sayfa Başlatıcı ---
async function initHocaPanel() {
  document.getElementById("teacherInitial").textContent = state.hocaIsim ? state.hocaIsim[0].toUpperCase() : "Ö";
  document.getElementById("teacherNameText").textContent = state.hocaIsim;
  document.getElementById("welcomeText").textContent = `Günaydın, ${state.hocaIsim}.`;
  document.getElementById("modalClassCode").textContent = state.sinifId;

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

  // Sınıf Seçiciyi doldur
  const selectClass = document.getElementById("selectClass");
  const badgeClassCode = document.getElementById("badgeClassCode");

  try {
    const savedClasses = JSON.parse(localStorage.getItem("kivilcim_classes") || "[]");
    savedClasses.forEach((c) => {
      if (!Array.from(selectClass.options).some((opt) => opt.value === c.code)) {
        const opt = document.createElement("option");
        opt.value = c.code;
        opt.textContent = c.name || `${c.code} Sınıfı`;
        selectClass.appendChild(opt);
      }
    });
  } catch (e) {
    console.warn("Kayıtlı sınıflar okunamadı:", e);
  }

  if (state.sinifId) {
    if (!Array.from(selectClass.options).some((opt) => opt.value === state.sinifId)) {
      const opt = document.createElement("option");
      opt.value = state.sinifId;
      opt.textContent = sessionStorage.getItem("sinif_adi") || `${state.sinifId} Sınıfı`;
      selectClass.appendChild(opt);
    }
    selectClass.value = state.sinifId;
    if (badgeClassCode) badgeClassCode.textContent = state.sinifId;
  }

  selectClass.addEventListener("change", (e) => {
    state.sinifId = e.target.value;
    if (badgeClassCode) badgeClassCode.textContent = state.sinifId;
    document.getElementById("modalClassCode").textContent = state.sinifId;
    loadPanelData();
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
    await apiCall("/api/video-ekle", "POST", { konu_id: 1, youtube_url: url });

    btn.disabled = false;
    btn.textContent = "Bölümle ve Ekle";
    document.getElementById("modalAddVideo").style.display = "none";
    alert("Video başarıyla eklendi ve AI tarafından eksik konulara göre bölümlendi!");
  });

  // Verileri Yükle
  await loadPanelData();
}

// --- Panel Verilerini Getir (GET /api/hoca/panel/{sinif_id}) ---
async function loadPanelData() {
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

  // Ortak Eksik
  const eksikler = data.eksik_dagilimi || {};
  const enCokEksikKey = Object.keys(eksikler).reduce((a, b) => (eksikler[a] > eksikler[b] ? a : b), null);
  if (enCokEksikKey) {
    document.getElementById("statOrtakEksik").textContent = `%${Math.round((eksikler[enCokEksikKey] / (ogrenciler.length || 1)) * 100)}`;
    document.getElementById("statEksikDetail").textContent = enCokEksikKey === "payda_esitleme" ? "Paydaları eşitleme" : enCokEksikKey;
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
          const prog = s.progress || (s.durum === "Tamamladı" ? 100 : 50);
          return `
          <div class="student-row">
            <span class="student-name"><i>${s.isim ? s.isim[0] : "Ö"}</i>${s.isim}</span>
            <span><b class="state-tag ${prog === 100 ? "state-100" : ""}">${s.durum || "Öğreniyor"}</b></span>
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
        <span>Öğrencileriniz tahtadaki QR kodu okutarak veya <strong>${state.sinifId}</strong> kodunu girerek bağlandığında burada canlı olarak listelenecektir.</span>
      </div>
    `;
  }

  // 4. Sınıf İçgörüsü
  const insightTitle = document.getElementById("insightTitle");
  const insightDesc = document.getElementById("insightDesc");
  const btnDetail = document.getElementById("btnInsightDetail");

  if (state.isDemo && enCokEksikKey) {
    insightTitle.textContent = "12 öğrenci aynı adımda zorlanıyor.";
    insightDesc.textContent = "Paydaları eşitleme konusunda sınıfa kısa bir hatırlatma yapabilir veya yeni video atayabilirsin.";
    btnDetail.disabled = false;
    btnDetail.style.opacity = "1";
    btnDetail.style.cursor = "pointer";
    btnDetail.textContent = "Detayı görüntüle →";
    btnDetail.onclick = () => {
      alert("Ortak Eksik: Payda Eşitleme\n12 öğrenci farklı paydaları eşitlemeden toplamayı denedi.");
    };
  } else {
    insightTitle.textContent = "Yeterli Veri Toplanmadı";
    insightDesc.textContent = "Öğrenciler ön test ve ders etkinliklerini tamamladıkça sınıfın ortak eksikleri burada analiz edilecektir.";
    btnDetail.disabled = true;
    btnDetail.style.opacity = "0.6";
    btnDetail.style.cursor = "not-allowed";
    btnDetail.textContent = "Analiz Bekleniyor";
  }
}

// --- QR Kod Modalı Açma ---
async function openQrModal() {
  const modal = document.getElementById("modalQr");
  const box = document.getElementById("qrFrameBox");
  modal.style.display = "flex";
  box.innerHTML = `<span class="spinner"></span>`;

  const joinUrl = `${window.location.origin}/index.html?sinif=${encodeURIComponent(state.sinifId)}`;
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
