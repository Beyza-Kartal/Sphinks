/**
 * Kıvılcım / Hazır mısın? - Öğrenci Mantığı (ogrenci.js)
 * Sahip: B (Frontend)
 * Bağlandığı API'ler:
 *   POST /api/test/basla   → Tüm soruları tek seferde al
 *   POST /api/test/bitir   → Tüm cevapları tek seferde gönder
 *   GET  /api/teshis/{deneme_id}
 *   POST /api/adim-adim    (eski /api/benzetme'nin yerine gecti)
 *   POST /api/tekrar/basla
 *   GET  /api/ozet/{deneme_id}
 */

// --- Durum Yönetimi (State) ---
const state = {
  ogrenciId: sessionStorage.getItem("ogrenci_id") || 1,
  ogrenciIsim: sessionStorage.getItem("ogrenci_isim") || "Öğrenci",
  sinifKodu: sessionStorage.getItem("sinif_kodu") || "",
  sinifId: sessionStorage.getItem("sinif_id") || null,
  dersId: sessionStorage.getItem("ders_id") || null,
  konu: null,
  denemeId: null,
  // Ön test: tüm sorular bir kerede gelir
  allQuestions: [],       // /api/test/basla'dan gelen sorular dizisi
  cevaplar: {},           // { soru_id: "B", ... } biriktirilen cevaplar
  questionIndex: 0,       // şu an gösterilen sorunun indexi
  selectedOptionKey: null, // seçilen şık harfi ("A", "B", "C", "D") veya null
  view: "home", // home | pretest | diagnosis | minutes | bridge | retest | summary
  diagnosis: null,
  selectedChannelIndex: 0,
  analogyText: "",
  bridgeKartlar: [],       // /api/adim-adim -> [{soru, aciklama}, ...]
  bridgeIndex: 0,
  bridgeAnim: "",          // kart gecis animasyonu icin gecici css sinifi
  retestQuestions: [],
  retestIndex: 0,
  retestSelectedKey: null, // secilen sik harfi ("A".."D")
  retestCevaplar: {},      // { soru_id: "B", ... } biriktirilen tekrar testi cevaplari
  retestSonuc: null,       // /api/tekrar/bitir sonucu
  summaryData: null,
  // Test bitir sonuçları
  testSonuc: null,
};

// Demo kontrolü
const isDemo = new URLSearchParams(window.location.search).get("demo") === "1" || sessionStorage.getItem("is_demo") === "true";

// Konu verisini yükle
try {
  const storedKonu = sessionStorage.getItem("konu");
  if (storedKonu) {
    state.konu = JSON.parse(storedKonu);
  } else if (isDemo) {
    state.konu = { id: 1, ad: "Fonksiyonlar", duration: 12 };
  } else {
    state.konu = null; // Normal modda otomatik ders gelmez!
  }
} catch (e) {
  state.konu = isDemo ? { id: 1, ad: "Fonksiyonlar", duration: 12 } : null;
}

// --- API Çağrı Yardımcısı ---
async function apiCall(url, method = "GET", body = null) {
  try {
    const opts = {
      method,
      headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
    };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(url, opts);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[API Fallback] ${url} erişilemedi, yerel sözleşme cevabı üretiliyor:`, err);
    return getLocalMock(url, method, body);
  }
}

// API sunucusu kapalıyken çalışan sözleşme uyumlu yerel yanıtlar
function getLocalMock(url, method, body) {
  // POST /api/test/basla — tüm sorular tek seferde döner
  if (url.includes("/api/test/basla")) {
    return {
      deneme_id: 1,
      sorular: [
        {
          soru_id: "mock_01",
          alt_konu: "kumeler_ve_ikililer",
          soru: "A = {a, b, c} ve B = {1, 2} kümeleri verildiğinde A × B kümesinin eleman sayısı kaçtır?",
          secenekler: { A: "5", B: "6", C: "8", D: "9" },
        },
        {
          soru_id: "mock_02",
          alt_konu: "kumeler_ve_ikililer",
          soru: "Boş kümenin alt küme sayısı kaçtır?",
          secenekler: { A: "0", B: "1", C: "2", D: "Tanımsız" },
        },
        {
          soru_id: "mock_03",
          alt_konu: "cebirsel_ifadeler",
          soru: "2x + 3 = 11 denkleminde x kaçtır?",
          secenekler: { A: "3", B: "4", C: "5", D: "8" },
        },
        {
          soru_id: "mock_04",
          alt_konu: "cebirsel_ifadeler",
          soru: "(x + 2)(x - 3) ifadesinin açılımı nedir?",
          secenekler: { A: "x² - x - 6", B: "x² + x - 6", C: "x² - 5x + 6", D: "x² - x + 6" },
        },
        {
          soru_id: "mock_05",
          alt_konu: "fonksiyon_tanimi",
          soru: "f(x) = 3x - 1 ise f(4) kaçtır?",
          secenekler: { A: "11", B: "12", C: "13", D: "7" },
        },
      ],
    };
  }

  // POST /api/test/bitir — sonuçlar
  if (url.includes("/api/test/bitir")) {
    return {
      toplam_soru: 5,
      dogru: 3,
      yanlis: 2,
      genel_puan: 60.0,
      derse_hazir_mi: false,
      eksik_alt_konular: ["kumeler_ve_ikililer", "cebirsel_ifadeler"],
      alt_konu_detaylari: {
        kumeler_ve_ikililer: { toplam: 2, dogru: 1, yanlis: 1, basari_yuzdesi: 50.0 },
        cebirsel_ifadeler: { toplam: 2, dogru: 1, yanlis: 1, basari_yuzdesi: 50.0 },
        fonksiyon_tanimi: { toplam: 1, dogru: 1, yanlis: 0, basari_yuzdesi: 100.0 },
      },
    };
  }

  // GET /api/teshis/{deneme_id}
  if (url.includes("/api/teshis")) {
    return {
      eksik: "kumeler_ve_ikililer",
      videolar: [
        { video_id: 1, kanal_adi: "Matematiğin Güler Yüzü", youtube_id: "M-Bufmo1Bz8", baslik: "Kumeler Ve Ikililer", baslangic_sn: 2224, bitis_sn: 2380, transkript: "" },
        { video_id: 2, kanal_adi: "Net Anlatım", youtube_id: "9VZsMY15xeU", baslik: "Kümeler Konu Anlatımı", baslangic_sn: 30, bitis_sn: 210, transkript: "" },
      ],
    };
  }

  // GET /api/video/{video_id}/bolumler
  if (url.includes("/bolumler")) {
    return { bolumler: [] };
  }

  // POST /api/adim-adim (eski /api/benzetme'nin yerine gecti)
  if (url.includes("/api/adim-adim")) {
    return {
      kartlar: [
        { soru: "2x + 3 = 11 denkleminde x kaçtır?", aciklama: "1. Her iki taraftan 3 çıkar: 2x = 8\n2. Her iki tarafı 2'ye böl: x = 4\n\nDoğru sonuç: 4" },
        { soru: "3x - 5 = 10 denkleminde x kaçtır?", aciklama: "1. Her iki tarafa 5 ekle: 3x = 15\n2. Her iki tarafı 3'e böl: x = 5\n\nDoğru sonuç: 5" },
      ],
      aciklama: null,
    };
  }

  if (url.includes("/api/tekrar/basla")) {
    return {
      deneme_id: 1,
      sorular: [
        { soru_id: "r1", soru: "A ∩ B kümesi neyi ifade eder?", secenekler: { A: "Birleşim", B: "Kesişim", C: "Fark", D: "Tümleyen" } },
        { soru_id: "r2", soru: "f(x) = x² + 1 ise f(3) kaçtır?", secenekler: { A: "8", B: "9", C: "10", D: "12" } },
      ],
    };
  }

  if (url.includes("/api/tekrar/bitir")) {
    return { toplam_soru: 2, dogru: 2, yanlis: 0, puan: 100.0, basari_esigi: 75, calisma_ise_yaradi_mi: true, mesaj: "Tebrikler, eksiğini kapattın!", yanlis_sorular: [] };
  }

  if (url.includes("/api/ozet")) {
    return { durum: "test_bitti", hazir_mi: true, eksik_konu: null, son_tekrar_dogru: 6, son_tekrar_toplam: 6, son_tekrar_puan: 100.0 };
  }

  return {};
}

// --- Üst Bar ve Başlatma ---
function initHeader() {
  document.getElementById("userInitial").textContent = state.ogrenciIsim ? state.ogrenciIsim[0].toUpperCase() : "Ö";
  document.getElementById("userNameText").textContent = state.ogrenciIsim;
  document.getElementById("btnLogout").addEventListener("click", () => {
    sessionStorage.clear();
    window.location.href = "./index.html";
  });

  // Tema
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
}

// --- GÖRÜNÜM RENDER FONKSİYONLARI ---

// 1. Ana Sayfa (Home View)
function renderHomeView() {
  document.getElementById("topStepText").textContent = "Bugünün Planı";
  const main = document.getElementById("mainContainer");

  const topicCardHtml = state.konu
    ? `
    <section class="topic-card">
      <div class="topic-visual">
        <div class="fraction-shape"><span>f</span><i></i><span>(x)</span></div>
        <div class="fraction-shape second"><span>→</span><i></i><span>y</span></div>
      </div>
      <div class="topic-content">
        <div class="card-kicker">Sıradaki konu</div>
        <p class="unit">Matematik · Lise</p>
        <h2>${state.konu?.ad || state.konu?.title || "Fonksiyonlar"}</h2>
        <div class="meta">
          <span>~${state.konu?.duration || 12} dakika</span>
          <span>Ön test soruları</span>
        </div>
        <button class="primary-button" id="btnStartTest">Hazır mısın?</button>
      </div>
    </section>
    <div class="encouragement">
      <span><strong>Küçük bir hatırlatma:</strong> Bilmediğin sorularda "Bilmiyorum" demen, sana daha iyi yardımcı olmamızı sağlar.</span>
    </div>
    `
    : `
    <section class="topic-card" style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 48px 24px; min-height: 320px;">
      <div style="width: 64px; height: 64px; border-radius: 20px; background: var(--mint); color: var(--green); display: grid; place-items: center; font-size: 28px; margin-bottom: 20px;">
        📚
      </div>
      <div class="card-kicker" style="justify-content: center;">Henüz Aktif Ders Yok</div>
      <h2 style="font-size: 26px; margin: 12px 0 10px; max-width: 480px;">Öğretmeninin ders başlatması bekleniyor</h2>
      <p style="color: var(--muted); max-width: 440px; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
        <strong>${state.sinifKodu || "—"}</strong> sınıfı için atanmış bir konu bulunmuyor. Öğretmenin bir konu başlattığında veya etkinlik atadığında burada görebilirsin.
      </p>
      <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap; justify-content: center;">
        <button class="secondary-button" id="btnRefreshLesson">
          🔄 Yenile
        </button>
        <button class="text-button" id="btnActivateDemo">
          Örnek Dersi Gör (Demo Modu) →
        </button>
      </div>
    </section>
    `;

  main.innerHTML = `
    <div class="home-hero">
      <div>
        <div class="eyebrow"><span class="eyebrow-dot"></span> Bugünün çalışma planı</div>
        <h1>Merhaba, ${state.ogrenciIsim}.</h1>
        <p>Bugün küçük bir adımla büyük bir fark yaratabiliriz.</p>
      </div>
      <div class="streak-card"><span>0</span><small>günlük seri</small></div>
    </div>
    ${topicCardHtml}
  `;

  if (document.getElementById("btnStartTest")) {
    document.getElementById("btnStartTest").addEventListener("click", startTest);
  }

  if (document.getElementById("btnRefreshLesson")) {
    document.getElementById("btnRefreshLesson").addEventListener("click", async () => {
      const btn = document.getElementById("btnRefreshLesson");
      btn.innerHTML = `<span class="spinner small"></span> Kontrol ediliyor...`;
      try {
        const res = await apiCall("/api/giris", "POST", { sinif_kodu: state.sinifKodu, isim: state.ogrenciIsim });
        if (res && res.ders_id) {
          state.sinifId = res.sinif_id;
          state.dersId = res.ders_id;
          sessionStorage.setItem("sinif_id", res.sinif_id);
          sessionStorage.setItem("ders_id", res.ders_id);
          // Konu bilgisini ders_id'den çıkar
          state.konu = { id: res.ders_id, ad: res.ders_id || "Fonksiyonlar" };
          sessionStorage.setItem("konu", JSON.stringify(state.konu));
          renderHomeView();
          return;
        }
      } catch (e) {
        console.warn("Ders kontrol hatası:", e);
      }
      setTimeout(() => {
        btn.innerHTML = `🔄 Yenile`;
        alert("Sınıfınız için henüz yeni bir ders atanmadı.");
      }, 400);
    });
  }

  if (document.getElementById("btnActivateDemo")) {
    document.getElementById("btnActivateDemo").addEventListener("click", () => {
      sessionStorage.setItem("is_demo", "true");
      state.konu = { id: 1, ad: "Fonksiyonlar", duration: 12 };
      renderHomeView();
    });
  }
}

// 2. Ön Test (Pretest View) — secenekler artık sözlük {A: "...", B: "...", C: "...", D: "..."}
function renderPretestView() {
  document.getElementById("topStepText").textContent = "Ön Test";
  const main = document.getElementById("mainContainer");
  const q = state.allQuestions[state.questionIndex];
  const totalQ = state.allQuestions.length;
  const currentNum = state.questionIndex + 1;
  const progressPercent = (currentNum / totalQ) * 100;

  // secenekler bir sözlüktür: { A: "...", B: "...", C: "...", D: "..." }
  const secenekKeys = Object.keys(q.secenekler); // ["A", "B", "C", "D"]

  main.innerHTML = `
    <div class="quiz-page">
      <div class="progress-wrap">
        <div class="progress-copy"><span>Ön test</span><strong>${currentNum}/${totalQ}</strong></div>
        <div class="progress-track"><span style="width: ${progressPercent}%;"></span></div>
      </div>
      <section class="question-card">
        <div class="question-number">Soru ${currentNum}</div>
        <h1>${q.soru}</h1>
        <div class="options">
          ${secenekKeys
            .map(
              (key) => `
            <button class="option ${state.selectedOptionKey === key ? "selected" : ""}" data-key="${key}">
              <span>${key}</span>${q.secenekler[key]}
            </button>
          `
            )
            .join("")}
          <button class="option unknown ${state.selectedOptionKey === "?" ? "selected" : ""}" data-key="?">
            <span>?</span>Bilmiyorum
          </button>
        </div>
        <div class="quiz-actions">
          <p>Cevabından emin olmasan da sorun değil.</p>
          <button class="primary-button" id="btnSubmitAnswer" ${state.selectedOptionKey === null ? "disabled" : ""}>
            ${currentNum === totalQ ? "Testi tamamla" : "Sonraki soru"}
          </button>
        </div>
      </section>
    </div>
  `;

  // Şık tıklama
  main.querySelectorAll("button[data-key]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.selectedOptionKey = btn.getAttribute("data-key");
      renderPretestView();
    });
  });

  // Cevabı kaydet ve ilerle
  document.getElementById("btnSubmitAnswer").addEventListener("click", submitAnswer);
}

// 3. Teşhis Ekranı (Diagnosis View) — yeni format
function renderDiagnosisView() {
  document.getElementById("topStepText").textContent = "Teşhis";
  const main = document.getElementById("mainContainer");
  const sonuc = state.testSonuc;
  const eksikler = sonuc?.eksik_alt_konular || [];
  const detaylar = sonuc?.alt_konu_detaylari || {};
  const puan = sonuc?.genel_puan || 0;
  const hazir = sonuc?.derse_hazir_mi || false;

  // Eksik konuları güzel isimlere çevir
  function formatKonuAdi(slug) {
    const map = {
      kumeler_ve_ikililer: "Kümeler ve İkililer",
      cebirsel_ifadeler: "Cebirsel İfadeler",
      fonksiyon_tanimi: "Fonksiyon Tanımı",
      denklemler: "Denklemler",
      esitsizlikler: "Eşitsizlikler",
    };
    return map[slug] || slug.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  // Detay satırlarını oluştur
  let detaySatirlari = "";
  for (const [konu, det] of Object.entries(detaylar)) {
    const isEksik = eksikler.includes(konu);
    detaySatirlari += `
      <div class="diagnosis-row">
        <span class="status-icon ${isEksik ? "focus" : "okay"}">${isEksik ? "⚡" : "✓"}</span>
        <div>
          <small>${isEksik ? "Birlikte tamamlayacağız" : "Gayet iyi"}</small>
          <strong>${formatKonuAdi(konu)} — %${det.basari_yuzdesi.toFixed(0)} (${det.dogru}/${det.toplam})</strong>
        </div>
      </div>
      <div class="diagnosis-line"></div>
    `;
  }

  main.innerHTML = `
    <div class="center-page">
      <div class="success-orbit">
        <div style="font-size: 28px;">${hazir ? "🎉" : "✨"}</div>
      </div>
      <div class="eyebrow"><span class="eyebrow-dot"></span> ${hazir ? "Harika!" : "Tam olarak bulduk"}</div>
      <h1>${hazir ? "Derse hazırsın!" : "Eksik olan küçük bir bağlantı."}</h1>
      <p class="lead">
        Genel puanın: <strong>%${puan.toFixed(1)}</strong> — ${sonuc?.dogru || 0} doğru, ${sonuc?.yanlis || 0} yanlış (${sonuc?.toplam_soru || 0} soru)
      </p>
      ${
        eksikler.length > 0
          ? `
        <p class="lead">Eksik konuların: <strong>${eksikler.map(formatKonuAdi).join(", ")}</strong></p>
      `
          : ""
      }
      <section class="diagnosis-card">
        ${detaySatirlari}
      </section>
      ${
        hazir
          ? `
        <p class="microcopy">Tüm alt konularda yeterli başarıyı gösterdin. Tebrikler!</p>
        <button class="primary-button" id="btnGoHome">Ana Sayfaya Dön</button>
      `
          : `
        <p class="microcopy">Sana özel seçtiğimiz anlatımla bu boşluğu kapatalım.</p>
        <button class="primary-button" id="btnGoToMinutes">Dakikalarımı göster</button>
      `
      }
    </div>
  `;

  if (document.getElementById("btnGoToMinutes")) {
    document.getElementById("btnGoToMinutes").addEventListener("click", async () => {
      // GET /api/teshis/{deneme_id} — en öncelikli eksik ve videoları al
      const teshisData = await apiCall(`/api/teshis/${state.denemeId || 1}`);
      state.diagnosis = teshisData;
      state.view = "minutes";
      renderMinutesView();
    });
  }

  if (document.getElementById("btnGoHome")) {
    document.getElementById("btnGoHome").addEventListener("click", () => {
      state.view = "home";
      renderHomeView();
    });
  }
}

// 4. Öğrenme Dakikaları (Minutes View)
// DUZELTME (kullanici istegi): SADECE gomulu video (iframe) kaldirildi.
// Kalan her sey (kanal paneli, video-map, transkript, duzen) AYNI kaldi.
async function renderMinutesView() {
  document.getElementById("topStepText").textContent = "Öğrenme Dakikaları";
  const main = document.getElementById("mainContainer");
  const eksikKonu = state.diagnosis?.eksik || "Eksik konu";

  // DUZELTME: bos dizi ([]) JS'te "truthy"dir, "|| varsayilan" hic
  // devreye girmiyordu; backend video bulamazsa activeVideo undefined
  // olup sayfa sessizce cokuyordu (JS hatasi, hicbir sey olmuyor gibi
  // gorunuyordu). Artik dizinin GERCEKTEN dolu olup olmadigina bakiyoruz
  // ve hic video yoksa kullaniciya acik bir mesaj gosteriyoruz.
  const gelenVideolar = state.diagnosis?.videolar || [];
  const videolar =
    gelenVideolar.length > 0
      ? gelenVideolar
      : [{ kanal_adi: "Matematiğin Güler Yüzü", youtube_id: "M-Bufmo1Bz8", baslangic_sn: 2224, bitis_sn: 2380 }];

  if (gelenVideolar.length === 0) {
    main.innerHTML = `
      <div class="center-page">
        <div class="eyebrow"><span class="eyebrow-dot"></span> Video hazırlanıyor</div>
        <h1>Bu konu için video henüz hazırlanmadı.</h1>
        <p class="lead">Öğretmenin bu konuya bir video eklediğinde burada otomatik görünecek.</p>
        <button class="primary-button" id="btnGoHomeFromMinutes">Ana Sayfaya Dön</button>
      </div>
    `;
    const btn = document.getElementById("btnGoHomeFromMinutes");
    if (btn) btn.addEventListener("click", () => { state.view = "home"; renderHomeView(); });
    return;
  }

  const activeVideo = videolar[state.selectedChannelIndex] || videolar[0];

  function formatKonuAdi(slug) {
    if (!slug) return "Konu";
    const map = {
      kumeler_ve_ikililer: "Kümeler ve İkililer",
      cebirsel_ifadeler: "Cebirsel İfadeler",
      koordinat_sistemi: "Koordinat Sistemi",
      birinci_derece_denklemler: "Birinci Derece Denklemler",
      fonksiyon_tanimi_ve_deger: "Fonksiyon Tanımı ve Değeri",
      fonksiyon_turleri: "Fonksiyon Türleri",
      dogrusal_fonksiyon_grafigi: "Doğrusal Fonksiyon Grafiği",
      bileske_ve_ters_fonksiyon: "Bileşke ve Ters Fonksiyon",
    };
    return map[slug] || slug.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  const sureSn = (activeVideo.bitis_sn || 0) - (activeVideo.baslangic_sn || 0);
  const sureDk = Math.ceil(sureSn / 60);

  main.innerHTML = `
    <div class="video-page">
      <div class="video-heading">
        <div>
          <div class="eyebrow"><span class="eyebrow-dot"></span> Sana özel ${sureDk} dakika</div>
          <h1>${formatKonuAdi(eksikKonu)} konusunu birlikte çalışalım.</h1>
        </div>
        <button class="bridge-link" id="btnGoToBridge">
          ✨ Bu soruyu adım adım anlat
        </button>
      </div>
      <div class="learning-grid">
        <section>
          <a
            href="https://www.youtube.com/watch?v=${activeVideo.youtube_id}&t=${activeVideo.baslangic_sn || 0}s"
            target="_blank" rel="noopener"
            class="secondary-button"
            style="display: inline-flex; text-decoration: none;"
          >
            ↗ İzle — YouTube'da aç (${Math.floor(activeVideo.baslangic_sn / 60)}:${String(activeVideo.baslangic_sn % 60).padStart(2, "0")}'dan başlar)
          </a>

          <section class="video-map" style="margin-top: 18px; background: var(--bg-card); border-radius: 16px; padding: 16px; border: 1px solid var(--line);">
            <p class="card-kicker" style="margin: 0 0 10px;">Bu videoda hangi dakikada ne anlatılıyor</p>
            <div id="videoMapContainer"><span class="spinner small"></span> Yükleniyor...</div>
          </section>

          <details class="transcript">
            <summary>Bu bölümün transkripti <span>${sureDk} dk</span></summary>
            <div>
              <p><strong>Kanal:</strong> ${activeVideo.kanal_adi}</p>
              <p><strong>Başlık:</strong> ${activeVideo.baslik || "Konu Anlatımı"}</p>
              <p><strong>Süre:</strong> ${Math.floor(activeVideo.baslangic_sn / 60)}:${String(activeVideo.baslangic_sn % 60).padStart(2, "0")} – ${Math.floor(activeVideo.bitis_sn / 60)}:${String(activeVideo.bitis_sn % 60).padStart(2, "0")}</p>
              ${
                activeVideo.transkript
                  ? `<p style="color: var(--muted); line-height: 1.6;">${activeVideo.transkript}</p>`
                  : `<p style="color: var(--muted);">Bu bölüm için transkript henüz hazırlanmadı.</p>`
              }
            </div>
          </details>
        </section>
        <aside class="channel-panel">
          <p class="card-kicker">Anlatıcını seç</p>
          <h2>Hangisi sana daha uygun?</h2>
          <div class="channel-list">
            ${videolar
              .map(
                (v, idx) => `
              <button class="channel ${state.selectedChannelIndex === idx ? "active" : ""}" data-vid-index="${idx}">
                <span class="channel-avatar">${idx + 1}</span>
                <span><strong>${v.kanal_adi}</strong><small>${v.baslik || "Kişiselleştirilmiş video"}</small></span>
              </button>
            `
              )
              .join("")}
          </div>
          <div class="tip">
            <span>Videoyu kendi hızında izleyebilir, anlamadığın yerde geri sarabilirsin.</span>
          </div>
          <button class="primary-button" id="btnWatchedVideo">İzledim</button>
        </aside>
      </div>
    </div>
  `;

  // Kanal seçimi
  main.querySelectorAll("button[data-vid-index]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.selectedChannelIndex = parseInt(btn.getAttribute("data-vid-index"), 10);
      renderMinutesView();
    });
  });

  document.getElementById("btnGoToBridge").addEventListener("click", () => {
    state.view = "bridge";
    renderBridgeView();
  });

  document.getElementById("btnWatchedVideo").addEventListener("click", startRetest);

  // Videonun TUM bolumlerini (hangi dakikada hangi konu) getir ve acikca
  // goster - katlanir kutuda gizli degil, direkt sayfada.
  if (activeVideo.video_id) {
    apiCall(`/api/video/${activeVideo.video_id}/bolumler`).then((data) => {
      const mapBox = document.getElementById("videoMapContainer");
      if (!mapBox) return;
      const bolumler = data.bolumler || [];
      if (bolumler.length === 0) {
        mapBox.innerHTML = `<span style="color: var(--muted); font-size: 13px;">Bu video için bölüm haritası henüz hazır değil.</span>`;
        return;
      }

      // Oncelik sirasi: en oncelikli eksik konu (eksikKonu) once, sonra
      // diger eksik konular, sonra geri kalanlar - hepsi kirmizi/⚡
      // isaretli ama en onemlisi en ustte gozuksun diye siraliyoruz.
      const eksikListesi = state.testSonuc?.eksik_alt_konular?.length
        ? state.testSonuc.eksik_alt_konular
        : eksikKonu
        ? [eksikKonu]
        : [];
      const oncelik = (konuId) => {
        if (konuId === eksikKonu) return 0;
        if (eksikListesi.includes(konuId)) return 1;
        return 2;
      };
      const siraliBolumler = [...bolumler].sort((a, b) => oncelik(a.alt_konu_id) - oncelik(b.alt_konu_id));

      mapBox.innerHTML = siraliBolumler
        .map((b) => {
          const dk = (sn) => `${Math.floor(sn / 60)}:${String(sn % 60).padStart(2, "0")}`;
          const eksikMi = eksikListesi.includes(b.alt_konu_id);
          return `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--line);">
            <span style="font-size: 13px; color: ${eksikMi ? "var(--coral)" : "inherit"};"><strong>${dk(b.baslangic_sn)} – ${dk(b.bitis_sn)}</strong> · ${formatKonuAdi(b.alt_konu_id)}${eksikMi ? " ⚡" : ""}</span>
            <a href="https://www.youtube.com/watch?v=${activeVideo.youtube_id}&t=${b.baslangic_sn}s" target="_blank" rel="noopener" style="font-size: 12px; color: var(--green); text-decoration: none;">izle →</a>
          </div>
        `;
        })
        .join("");
    });
  }
}

// 5. Bilişsel Köprü (Bridge View)
// DUZELTME (kullanici karari): "ilgi alani sec + benzetme" matematik icin
// uygun degildi (bir denklemi basketbola benzetmek anlamsiz). Yerine:
// ogrencinin GERCEKTEN yanlis yaptigi soruyu bulup adim adim acikliyoruz
// (POST /api/adim-adim, bkz. GUNLUK.md).
function renderBridgeView() {
  document.getElementById("topStepText").textContent = "Adım Adım Açıklama";
  const main = document.getElementById("mainContainer");

  main.innerHTML = `
    <div class="bridge-page">
      <div class="bridge-intro">
        <div class="eyebrow">✨ Bu soruyu başka türlü düşünelim</div>
        <h1>Yanlış yaptığın soruları adım adım çözelim.</h1>
      </div>
      <div id="bridgeCarousel">
        <div class="feedback-card" role="status">
          <span class="spinner"></span>
          <p>Hazırlanıyor...</p>
        </div>
      </div>
    </div>
  `;

  (async () => {
    // Ayni deneme icin tekrar fetch etmeye gerek yok (Groq istekleri yavas).
    if (state.bridgeKartlar.length === 0) {
      const data = await apiCall("/api/adim-adim", "POST", { deneme_id: state.denemeId || 1 });
      state.bridgeKartlar = data.kartlar && data.kartlar.length > 0 ? data.kartlar : [];
      state.bridgeIndex = 0;
      state.bridgeEmptyMessage = data.aciklama || "Şu an gösterilecek bir şey yok.";
    }
    renderBridgeCard();
  })();
}

// Carousel'in TEK bir karti - sadece ok ile ileri/geri gidilir (sayfa
// numarasi YOK, kullanici karariyla). Her kart soru + adim adim aciklamayi
// BIRLIKTE gosterir.
function renderBridgeCard() {
  const box = document.getElementById("bridgeCarousel");
  if (!box) return;

  if (state.bridgeKartlar.length === 0) {
    box.innerHTML = `
      <div class="feedback-card" role="status">
        <h2>${state.bridgeEmptyMessage || "Şu an gösterilecek bir şey yok."}</h2>
        <button class="primary-button" id="btnBackToVideo">Geri dön</button>
      </div>
    `;
    document.getElementById("btnBackToVideo").addEventListener("click", () => {
      state.view = "minutes";
      renderMinutesView();
    });
    return;
  }

  const kart = state.bridgeKartlar[state.bridgeIndex];
  const total = state.bridgeKartlar.length;

  box.innerHTML = `
    <div class="bridge-carousel">
      <button class="bridge-arrow" id="btnBridgePrev" ${state.bridgeIndex === 0 ? "disabled" : ""} aria-label="Önceki soru">‹</button>
      <section class="analogy-card bridge-card ${state.bridgeAnim}">
        <div class="analogy-label">✨ Soru ${state.bridgeIndex + 1}/${total}</div>
        <h2 style="margin: 18px 0 10px; font-size: 20px;">${kart.soru}</h2>
        <blockquote style="white-space: pre-line;">${kart.aciklama}</blockquote>
      </section>
      <button class="bridge-arrow" id="btnBridgeNext" ${state.bridgeIndex === total - 1 ? "disabled" : ""} aria-label="Sonraki soru">›</button>
    </div>
    <button class="primary-button" id="btnBackToVideo" style="margin-top: 22px;">Şimdi videoya dön</button>
  `;

  document.getElementById("btnBridgePrev").addEventListener("click", () => goBridgeCard(-1));
  document.getElementById("btnBridgeNext").addEventListener("click", () => goBridgeCard(1));
  document.getElementById("btnBackToVideo").addEventListener("click", () => {
    state.view = "minutes";
    renderMinutesView();
  });
}

function goBridgeCard(direction) {
  const total = state.bridgeKartlar.length;
  const hedef = state.bridgeIndex + direction;
  if (hedef < 0 || hedef >= total) return;
  state.bridgeIndex = hedef;
  state.bridgeAnim = direction > 0 ? "slide-in-right" : "slide-in-left";
  renderBridgeCard();
  setTimeout(() => { state.bridgeAnim = ""; }, 350);
}

// 6. Tekrar Testi (Retest View) — gercek /api/tekrar/basla sorulari,
// secenekler pretest ile ayni formatta (sozluk: {A,B,C,D})
function renderRetestView() {
  document.getElementById("topStepText").textContent = "Tekrar Testi";
  const main = document.getElementById("mainContainer");
  const total = state.retestQuestions.length;
  const current = state.retestIndex + 1;
  const q = state.retestQuestions[state.retestIndex];
  const progressPercent = (current / total) * 100;
  const secenekKeys = Object.keys(q.secenekler);

  main.innerHTML = `
    <div class="quiz-page">
      <div class="progress-wrap">
        <div class="progress-copy"><span>Tekrar testi</span><strong>${current}/${total}</strong></div>
        <div class="progress-track"><span style="width: ${progressPercent}%;"></span></div>
      </div>
      <section class="question-card">
        <div class="question-number">Soru ${current}</div>
        <h1>${q.soru}</h1>
        <div class="options">
          ${secenekKeys
            .map(
              (key) => `
            <button class="option ${state.retestSelectedKey === key ? "selected" : ""}" data-key="${key}">
              <span>${key}</span>${q.secenekler[key]}
            </button>
          `
            )
            .join("")}
        </div>
        <div class="quiz-actions">
          <p>Bu sefer ciddi — eksiğin kapandığını gösteren asıl test.</p>
          <button class="primary-button" id="btnNextRetest" ${state.retestSelectedKey === null ? "disabled" : ""}>
            ${current === total ? "Testi tamamla" : "Sonraki soru"}
          </button>
        </div>
      </section>
    </div>
  `;

  main.querySelectorAll("button[data-key]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.retestSelectedKey = btn.getAttribute("data-key");
      renderRetestView();
    });
  });

  document.getElementById("btnNextRetest").addEventListener("click", submitRetestAnswer);
}

// 7. Özet Ekranı (Summary View)
function renderSummaryView() {
  document.getElementById("topStepText").textContent = "Sonuç & Özet";
  const main = document.getElementById("mainContainer");
  const konuAd = state.konu?.ad || "Fonksiyonlar";
  const sonuc = state.retestSonuc;
  const basarili = sonuc?.calisma_ise_yaradi_mi ?? true;
  const puan = sonuc?.puan ?? 100;
  const dogru = sonuc?.dogru ?? state.retestQuestions.length;
  const toplam = sonuc?.toplam_soru ?? state.retestQuestions.length;
  const yanlisSorular = sonuc?.yanlis_sorular || [];

  const yanlisBlok =
    yanlisSorular.length > 0
      ? `
    <section class="diagnosis-card" style="text-align: left; margin-top: 24px;">
      <p class="card-kicker" style="margin: 0 0 14px;">Yanlış yaptığın sorular</p>
      ${yanlisSorular
        .map(
          (s, i) => `
        <div style="padding: 14px 0; ${i > 0 ? "border-top: 1px solid var(--line);" : ""}">
          <p style="font-weight: 700; margin: 0 0 8px;">${s.soru}</p>
          <p style="margin: 0; font-size: 13px; color: var(--coral);">Senin cevabın: ${s.senin_cevabin ? `${s.senin_cevabin}) ${s.secenekler[s.senin_cevabin] || ""}` : "Boş bırakıldı"}</p>
          <p style="margin: 4px 0 0; font-size: 13px; color: var(--green);">Doğru cevap: ${s.dogru_cevap}) ${s.secenekler[s.dogru_cevap] || ""}</p>
        </div>
      `
        )
        .join("")}
    </section>
  `
      : "";

  main.innerHTML = basarili
    ? `
    <div class="summary-page">
      <div class="confetti c1"></div><div class="confetti c2"></div><div class="confetti c3"></div><div class="confetti c4"></div>
      <div class="summary-check">✓</div>
      <div class="eyebrow"><span class="eyebrow-dot"></span> Konu tamamlandı</div>
      <h1>Hazırsın, ${state.ogrenciIsim}.</h1>
      <p>Eksik parçayı yerine koydun. Şimdi ${konuAd.toLowerCase()} çok daha net.</p>
      <div class="summary-stats">
        <div><strong>${dogru}/${toplam}</strong><span>Tekrar testi</span></div>
        <div><strong>%${puan.toFixed ? puan.toFixed(0) : puan}</strong><span>Başarı</span></div>
        <div><strong>1</strong><span>Kapatılan eksik</span></div>
      </div>
      ${yanlisBlok}
      <button class="secondary-button restart" id="btnSummaryRestart">
        ↺ Ana sayfaya dön
      </button>
    </div>
  `
    : `
    <div class="summary-page">
      <div class="eyebrow"><span class="eyebrow-dot"></span> Biraz daha çalışalım</div>
      <h1>${sonuc?.mesaj || "Henüz hazır değilsin, videoyu bir kez daha izlemeni öneririz."}</h1>
      <p>${dogru}/${toplam} doğru (%${puan.toFixed ? puan.toFixed(0) : puan}) — hedef %${sonuc?.basari_esigi || 75}.</p>
      ${yanlisBlok}
      <button class="primary-button" id="btnWatchAgain">Videoyu tekrar izle</button>
      <button class="secondary-button restart" id="btnSummaryRestart">↺ Ana sayfaya dön</button>
    </div>
  `;

  document.getElementById("btnSummaryRestart").addEventListener("click", () => {
    state.view = "home";
    renderHomeView();
  });

  if (!basarili) {
    document.getElementById("btnWatchAgain").addEventListener("click", () => {
      state.view = "minutes";
      renderMinutesView();
    });
  }
}

// --- AKIŞ AKSİYONLARI ---

// Teste Başla: POST /api/test/basla — tüm soruları tek seferde al
async function startTest() {
  const btn = document.getElementById("btnStartTest");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner small"></span> Hazırlanıyor...`;
  }

  const data = await apiCall("/api/test/basla", "POST", {
    ogrenci_id: parseInt(state.ogrenciId, 10) || 1,
    sinif_id: parseInt(state.sinifId, 10) || 1,
  });

  state.denemeId = data.deneme_id || 1;
  state.allQuestions = data.sorular || [];
  state.cevaplar = {};
  state.questionIndex = 0;
  state.selectedOptionKey = null;
  state.bridgeKartlar = [];
  state.bridgeIndex = 0;
  state.view = "pretest";

  if (state.allQuestions.length === 0) {
    alert("Henüz soru bulunamadı. Lütfen daha sonra tekrar deneyin.");
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Hazır mısın?";
    }
    return;
  }

  renderPretestView();
}

// Ön Test Cevapla — cevabı biriktir, son soruda /api/test/bitir'e gönder
async function submitAnswer() {
  const btn = document.getElementById("btnSubmitAnswer");
  if (btn) btn.disabled = true;

  const currentQ = state.allQuestions[state.questionIndex];

  // Cevabı biriktir ("?" = bilmiyorum → boş string olarak gönderilebilir)
  if (state.selectedOptionKey === "?") {
    // Bilmiyorum: boş bırak (backend'e gönderilmeyecek veya boş string olarak gönderilebilir)
    state.cevaplar[currentQ.soru_id] = "";
  } else {
    state.cevaplar[currentQ.soru_id] = state.selectedOptionKey;
  }

  state.questionIndex++;
  state.selectedOptionKey = null;

  if (state.questionIndex < state.allQuestions.length) {
    // Sonraki soruya geç
    renderPretestView();
  } else {
    // Tüm sorular cevaplandı — POST /api/test/bitir ile hepsini gönder
    if (btn) btn.innerHTML = `<span class="spinner small"></span> Sonuçlar hesaplanıyor...`;

    const sonuc = await apiCall("/api/test/bitir", "POST", {
      deneme_id: state.denemeId,
      cevaplar: state.cevaplar,
    });

    state.testSonuc = sonuc;
    state.view = "diagnosis";
    renderDiagnosisView();
  }
}

// Tekrar Testi Başlat: POST /api/tekrar/basla — SADECE bulunan eksik
// konudan 6 soru gelir (2 kolay+2orta+2zor, buse'nin kavram_testi_secici.py'si)
async function startRetest() {
  const btn = document.getElementById("btnWatchedVideo");
  if (btn) btn.disabled = true;

  const data = await apiCall("/api/tekrar/basla", "POST", {
    deneme_id: state.denemeId || 1,
  });

  // DUZELTME: bos dizi "truthy" oldugu icin "|| varsayilan" calismiyordu
  // (bkz. renderMinutesView'daki ayni hata). data.sorular boyutuna gore
  // kontrol ediyoruz. Yeni format: secenekler sozluk {A,B,C,D} (pretest ile ayni).
  state.retestQuestions =
    data.sorular && data.sorular.length > 0
      ? data.sorular
      : [
          { soru_id: "r1", soru: "A ∩ B kümesi neyi ifade eder?", secenekler: { A: "Birleşim", B: "Kesişim", C: "Fark", D: "Tümleyen" } },
        ];
  state.retestIndex = 0;
  state.retestSelectedKey = null;
  state.retestCevaplar = {};
  state.view = "retest";
  renderRetestView();
}

// Tekrar Testi Cevapla — hepsi bitince POST /api/tekrar/bitir ile
// toplu gonderilir (pretest ile ayni mantik).
async function submitRetestAnswer() {
  const q = state.retestQuestions[state.retestIndex];
  state.retestCevaplar[q.soru_id] = state.retestSelectedKey;

  if (state.retestIndex === state.retestQuestions.length - 1) {
    const sonuc = await apiCall("/api/tekrar/bitir", "POST", {
      deneme_id: state.denemeId || 1,
      cevaplar: state.retestCevaplar,
    });
    state.retestSonuc = sonuc;
    state.view = "summary";
    renderSummaryView();
  } else {
    state.retestIndex++;
    state.retestSelectedKey = null;
    renderRetestView();
  }
}

// --- Başlatıcı ---
document.addEventListener("DOMContentLoaded", () => {
  initHeader();
  renderHomeView();
});
if (document.readyState === "interactive" || document.readyState === "complete") {
  initHeader();
  renderHomeView();
}
