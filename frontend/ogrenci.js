/**
 * Kıvılcım / Hazır mısın? - Öğrenci Mantığı (ogrenci.js)
 * Sahip: B (Frontend)
 * Bağlandığı API'ler:
 *   POST /api/test/basla
 *   POST /api/cevap
 *   GET  /api/teshis/{deneme_id}
 *   POST /api/benzetme
 *   POST /api/tekrar/basla
 *   GET  /api/ozet/{deneme_id}
 */

// --- Durum Yönetimi (State) ---
const state = {
  ogrenciId: sessionStorage.getItem("ogrenci_id") || 1,
  ogrenciIsim: sessionStorage.getItem("ogrenci_isim") || "Öğrenci",
  sinifKodu: sessionStorage.getItem("sinif_kodu") || "KIV6A2",
  konu: null,
  denemeId: null,
  view: "home", // home | pretest | diagnosis | minutes | bridge | retest | summary
  currentQuestion: null,
  questionNumber: 1,
  selectedOptionIndex: null,
  answersCount: 0,
  diagnosis: null,
  selectedChannelIndex: 0,
  analogyText: "",
  retestQuestions: [],
  retestIndex: 0,
  summaryData: null,
};

// Demo kontrolü
const isDemo = new URLSearchParams(window.location.search).get("demo") === "1" || sessionStorage.getItem("is_demo") === "true";

// Konu verisini yükle
try {
  const storedKonu = sessionStorage.getItem("konu");
  if (storedKonu) {
    state.konu = JSON.parse(storedKonu);
  } else if (isDemo) {
    state.konu = { id: 1, ad: "Kesirlerde Toplama ve Çıkarma", duration: 12 };
  } else {
    state.konu = null; // Normal modda otomatik ders gelmez!
  }
} catch (e) {
  state.konu = isDemo ? { id: 1, ad: "Kesirlerde Toplama ve Çıkarma", duration: 12 } : null;
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
    console.warn(`[API Fallback] ${url} erişilemedi, yerel sözleşme cevabı üretiliyor:`, err);
    return getLocalMock(url, method, body);
  }
}

// API sunucusu kapalıyken çalışan sözleşme uyumlu yerel yanıtlar
function getLocalMock(url, method, body) {
  if (url.includes("/api/test/basla")) {
    return {
      deneme_id: 1,
      soru: {
        id: 1,
        metin: "1/3 + 1/6 işleminin sonucu kaçtır?",
        secenekler: ["2/9", "1/2", "2/6", "1/9"],
      },
    };
  }

  if (url.includes("/api/cevap")) {
    const questions = [
      { id: 2, metin: "3/4 − 1/2 işleminin sonucu kaçtır?", secenekler: ["2/2", "1/4", "2/4", "1/2"] },
      { id: 3, metin: "2/5 + 1/10 işlemini yapmak için en uygun ortak payda kaçtır?", secenekler: ["5", "7", "10", "15"] },
      { id: 4, metin: "Paydaları eşit iki kesir toplanırken ne yapılır?", secenekler: ["Paylar toplanır, payda aynen kalır", "Paydalar toplanır", "İkisi çarpılır", "Kesirler ters çevrilir"] },
      { id: 5, metin: "5/8 − 2/8 işleminin sonucu kaçtır?", secenekler: ["3/8", "3/0", "7/8", "3/16"] },
    ];
    const nextQ = questions[state.questionNumber - 1];
    if (nextQ) {
      return { dogru_mu: false, bitti: false, soru: nextQ };
    }
    return { dogru_mu: true, bitti: true };
  }

  if (url.includes("/api/teshis")) {
    return {
      eksik: { id: 1, ad: "payda_esitleme", aciklama: "Farklı paydalı kesirlerde ortak payda bulma ve genişletme" },
      videolar: [
        { kanal_adi: "Net Anlatım", youtube_id: "9VZsMY15xeU", baslangic_sn: 52, bitis_sn: 292 },
        { kanal_adi: "Görsel Matematik", youtube_id: "9VZsMY15xeU", baslangic_sn: 30, bitis_sn: 210 },
        { kanal_adi: "Hızlı Tekrar", youtube_id: "9VZsMY15xeU", baslangic_sn: 15, bitis_sn: 135 },
      ],
    };
  }

  if (url.includes("/api/benzetme")) {
    const analogies = {
      Basketbol: "Bir yarım saha ile iki çeyrek saha aynı alanı anlatır. Kesirlerde de toplama yapmadan önce saha çizgilerini, yani paydaları, aynı ölçüye getiririz.",
      Müzik: "Bir yarım nota, iki çeyrek nota kadar sürer. Ritimleri toplarken vuruş birimlerini eşitlemek, kesirlerin paydalarını eşitlemeye benzer.",
      Oyunlar: "Farklı büyüklükteki enerji barlarını toplamak için önce ikisini de aynı dilimlere bölersin. İşte bu, ortak payda bulmaktır.",
      Mutfak: "Yarım bardak ile çeyrek bardağı toplarken ikisini de çeyrek ölçüyle düşünürüz: iki çeyrek artı bir çeyrek.",
    };
    return { metin: analogies[body?.ilgi_alani] || "Ortak kat bulmak, parçaları aynı boyuta getirmektir." };
  }

  if (url.includes("/api/tekrar/basla")) {
    return {
      deneme_id: 1,
      sorular: [
        { id: 6, metin: "2/3 + 1/6 işleminin sonucu kaçtır?", secenekler: ["3/9", "3/6", "5/6", "2/9"] },
        { id: 7, metin: "7/10 − 2/5 işleminin sonucu kaçtır?", secenekler: ["5/5", "3/10", "5/10", "1/2"] },
      ],
    };
  }

  if (url.includes("/api/ozet")) {
    return { sonuc: "basarili", izlenen_saniye: 240, toplam_saniye: 240 };
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
        <div class="fraction-shape"><span>1</span><i></i><span>2</span></div>
        <div class="fraction-shape second"><span>1</span><i></i><span>3</span></div>
      </div>
      <div class="topic-content">
        <div class="card-kicker">Sıradaki konu</div>
        <p class="unit">Matematik · 6. sınıf</p>
        <h2>${state.konu?.ad || state.konu?.title || "Kesirlerde Toplama ve Çıkarma"}</h2>
        <div class="meta">
          <span>~${state.konu?.duration || 12} dakika</span>
          <span>5 kısa soru</span>
        </div>
        <button class="primary-button" id="btnStartTest">Hazır mısın?</button>
      </div>
    </section>
    <div class="encouragement">
      <span><strong>Küçük bir hatırlatma:</strong> Bilmediğin sorularda “Bilmiyorum” demen, sana daha iyi yardımcı olmamızı sağlar.</span>
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
        <strong>${state.sinifKodu}</strong> sınıfı için atanmış bir konu bulunmuyor. Öğretmenin bir konu başlattığında veya etkinlik atadığında burada görebilirsin.
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
        if (res && res.konu) {
          state.konu = res.konu;
          sessionStorage.setItem("konu", JSON.stringify(res.konu));
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
      state.konu = { id: 1, ad: "Kesirlerde Toplama ve Çıkarma", duration: 12 };
      renderHomeView();
    });
  }
}

// 2. Ön Test (Pretest View)
function renderPretestView() {
  document.getElementById("topStepText").textContent = "Ön Test";
  const main = document.getElementById("mainContainer");
  const q = state.currentQuestion;
  const progressPercent = (state.questionNumber / 5) * 100;

  main.innerHTML = `
    <div class="quiz-page">
      <div class="progress-wrap">
        <div class="progress-copy"><span>Ön test</span><strong>${state.questionNumber}/5</strong></div>
        <div class="progress-track"><span style="width: ${progressPercent}%;"></span></div>
      </div>
      <section class="question-card">
        <div class="question-number">Soru ${state.questionNumber}</div>
        <h1>${q.metin}</h1>
        <div class="options">
          ${q.secenekler
            .map(
              (opt, idx) => `
            <button class="option ${state.selectedOptionIndex === idx ? "selected" : ""}" data-index="${idx}">
              <span>${String.fromCharCode(65 + idx)}</span>${opt}
            </button>
          `
            )
            .join("")}
          <button class="option unknown ${state.selectedOptionIndex === -1 ? "selected" : ""}" data-index="-1">
            <span>?</span>Bilmiyorum
          </button>
        </div>
        <div class="quiz-actions">
          <p>Cevabından emin olmasan da sorun değil.</p>
          <button class="primary-button" id="btnSubmitAnswer" ${state.selectedOptionIndex === null ? "disabled" : ""}>
            ${state.questionNumber === 5 ? "Testi tamamla" : "Sonraki soru"}
          </button>
        </div>
      </section>
    </div>
  `;

  // Şık tıklama
  main.querySelectorAll("button[data-index]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.selectedOptionIndex = parseInt(btn.getAttribute("data-index"), 10);
      renderPretestView();
    });
  });

  // Cevabı gönder (POST /api/cevap)
  document.getElementById("btnSubmitAnswer").addEventListener("click", submitAnswer);
}

// 3. Teşhis Ekranı (Diagnosis View)
function renderDiagnosisView() {
  document.getElementById("topStepText").textContent = "Teşhis";
  const main = document.getElementById("mainContainer");
  const eksik = state.diagnosis?.eksik || { ad: "payda_esitleme", aciklama: "Farklı paydalı kesirlerde ortak payda bulma" };

  main.innerHTML = `
    <div class="center-page">
      <div class="success-orbit">
        <div style="font-size: 28px;">✨</div>
      </div>
      <div class="eyebrow"><span class="eyebrow-dot"></span> Tam olarak bulduk</div>
      <h1>Eksik olan küçük bir bağlantı.</h1>
      <p class="lead">Kesirleri toplarken <strong>${eksik.aciklama}</strong> adımında desteğe ihtiyacın var.</p>
      <section class="diagnosis-card">
        <div class="diagnosis-row">
          <span class="status-icon okay">✓</span>
          <div><small>Gayet iyi</small><strong>Kesrin pay ve paydasını tanıyorsun</strong></div>
        </div>
        <div class="diagnosis-line"></div>
        <div class="diagnosis-row">
          <span class="status-icon focus">⚡</span>
          <div><small>Birlikte tamamlayacağız</small><strong>${eksik.aciklama}</strong></div>
        </div>
      </section>
      <p class="microcopy">Sana özel seçtiğimiz anlatımla bu boşluğu kapatalım.</p>
      <button class="primary-button" id="btnGoToMinutes">Dakikalarımı göster</button>
    </div>
  `;

  document.getElementById("btnGoToMinutes").addEventListener("click", () => {
    state.view = "minutes";
    renderMinutesView();
  });
}

// 4. Öğrenme Dakikaları (Minutes View)
function renderMinutesView() {
  document.getElementById("topStepText").textContent = "Öğrenme Dakikaları";
  const main = document.getElementById("mainContainer");
  const videolar = state.diagnosis?.videolar || [
    { kanal_adi: "Net Anlatım", youtube_id: "9VZsMY15xeU", baslangic_sn: 52, bitis_sn: 292 },
  ];
  const activeVideo = videolar[state.selectedChannelIndex] || videolar[0];

  main.innerHTML = `
    <div class="video-page">
      <div class="video-heading">
        <div>
          <div class="eyebrow"><span class="eyebrow-dot"></span> Sana özel 4 dakika</div>
          <h1>Paydaları birlikte eşitleyelim.</h1>
        </div>
        <button class="bridge-link" id="btnGoToBridge">
          ✨ Bir benzetmeyle anlat
        </button>
      </div>
      <div class="learning-grid">
        <section>
          <div class="video-frame">
            <iframe
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
              src="https://www.youtube.com/embed/${activeVideo.youtube_id}?start=${activeVideo.baslangic_sn || 0}&end=${activeVideo.bitis_sn || 292}&rel=0"
              title="${activeVideo.kanal_adi}"
            ></iframe>
          </div>
          <details class="transcript">
            <summary>Video transkriptini aç <span>4:00</span></summary>
            <div>
              <p><time>00:52</time> Farklı paydalı kesirleri toplamak için önce parçaların aynı büyüklükte olmasını sağlamalıyız.</p>
              <p><time>01:34</time> Bunun için paydaların ortak katını buluyor ve kesirleri genişletiyoruz.</p>
              <p><time>02:48</time> Paydalar eşitlendiğinde artık yalnızca payları toplayabiliriz.</p>
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
                <span><strong>${v.kanal_adi}</strong><small>Kişiselleştirilmiş video</small></span>
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
}

// 5. Bilişsel Köprü (Bridge View)
function renderBridgeView() {
  document.getElementById("topStepText").textContent = "Bilişsel Köprü";
  const main = document.getElementById("mainContainer");
  const interests = ["Basketbol", "Müzik", "Oyunlar", "Mutfak"];

  main.innerHTML = `
    <div class="bridge-page">
      <div class="bridge-intro">
        <div class="eyebrow">✨ Başka bir yoldan bakalım</div>
        <h1>Bir ilgi alanı seç.</h1>
        <p>Konuyu zaten bildiğin bir dünyaya bağlayalım.</p>
      </div>
      <div class="interest-list">
        ${interests
          .map(
            (intName, idx) => `
          <button class="interest" data-interest="${intName}">
            <span>0${idx + 1}</span>${intName} →
          </button>
        `
          )
          .join("")}
      </div>
      <div id="analogyContainer">
        <div class="feedback-card" role="status">
          <div class="feedback-icon empty">📖</div>
          <h2>Seçimini bekliyoruz</h2>
          <p>Benzetmeni oluşturmak için yukarıdan sana yakın gelen bir alan seç.</p>
        </div>
      </div>
    </div>
  `;

  main.querySelectorAll("button[data-interest]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const intName = btn.getAttribute("data-interest");
      main.querySelectorAll("button[data-interest]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // POST /api/benzetme
      const analogyBox = document.getElementById("analogyContainer");
      analogyBox.innerHTML = `<div class="feedback-card"><span class="spinner"></span><p>Benzetme üretiliyor...</p></div>`;

      const data = await apiCall("/api/benzetme", "POST", {
        deneme_id: state.denemeId || 1,
        ilgi_alani: intName,
      });

      state.analogyText = data.metin || "Paydaları eşitlemek parçaları birbiriyle uyumlu hale getirmektir.";

      analogyBox.innerHTML = `
        <section class="analogy-card">
          <div class="analogy-label">✨ ${intName} ile düşünelim</div>
          <blockquote>“${state.analogyText}”</blockquote>
          <div class="analogy-equation">
            <span>1/2</span><b>=</b><span>2/4</span><b>+</b><span>1/4</span><b>=</b><strong>3/4</strong>
          </div>
          <button class="primary-button" id="btnBackToVideo">Şimdi videoya dön</button>
        </section>
      `;

      document.getElementById("btnBackToVideo").addEventListener("click", () => {
        state.view = "minutes";
        renderMinutesView();
      });
    });
  });
}

// 6. Tekrar Testi (Retest View)
function renderRetestView() {
  document.getElementById("topStepText").textContent = "Tekrar Testi";
  const main = document.getElementById("mainContainer");
  const total = state.retestQuestions.length || 2;
  const current = state.retestIndex + 1;
  const q = state.retestQuestions[state.retestIndex] || {
    metin: "2/3 + 1/6 işleminin sonucu kaçtır?",
    secenekler: ["3/9", "3/6", "5/6", "2/9"],
  };
  const progressPercent = (current / total) * 100;

  main.innerHTML = `
    <div class="quiz-page">
      <div class="progress-wrap">
        <div class="progress-copy"><span>Tekrar testi</span><strong>${current}/${total}</strong></div>
        <div class="progress-track"><span style="width: ${progressPercent}%;"></span></div>
      </div>
      <section class="question-card">
        <div class="question-number">Soru ${current}</div>
        <h1>${q.metin}</h1>
        <div class="options">
          ${q.secenekler
            .map(
              (opt, idx) => `
            <button class="option ${state.selectedOptionIndex === idx ? "selected" : ""}" data-index="${idx}">
              <span>${String.fromCharCode(65 + idx)}</span>${opt}
            </button>
          `
            )
            .join("")}
        </div>
        <div class="quiz-actions">
          <p>Cevabından emin olmasan da sorun değil.</p>
          <button class="primary-button" id="btnNextRetest" ${state.selectedOptionIndex === null ? "disabled" : ""}>
            ${current === total ? "Testi tamamla" : "Sonraki soru"}
          </button>
        </div>
      </section>
    </div>
  `;

  main.querySelectorAll("button[data-index]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.selectedOptionIndex = parseInt(btn.getAttribute("data-index"), 10);
      renderRetestView();
    });
  });

  document.getElementById("btnNextRetest").addEventListener("click", submitRetestAnswer);
}

// 7. Özet Ekranı (Summary View)
function renderSummaryView() {
  document.getElementById("topStepText").textContent = "Sonuç & Özet";
  const main = document.getElementById("mainContainer");
  const konuAd = state.konu?.ad || "Kesirlerde Toplama ve Çıkarma";

  main.innerHTML = `
    <div class="summary-page">
      <div class="confetti c1"></div><div class="confetti c2"></div><div class="confetti c3"></div><div class="confetti c4"></div>
      <div class="summary-check">✓</div>
      <div class="eyebrow"><span class="eyebrow-dot"></span> Konu tamamlandı</div>
      <h1>Hazırsın, ${state.ogrenciIsim}.</h1>
      <p>Eksik parçayı yerine koydun. Şimdi ${konuAd.toLowerCase()} çok daha net.</p>
      <section class="time-earned">
        <div style="font-size: 24px;">⏱️</div>
        <span>
          <small>Kazandığın süre</small>
          <strong>8 dakika</strong>
        </span>
        <i>Bugünkü hedefin tamamlandı</i>
      </section>
      <div class="summary-stats">
        <div><strong>2/2</strong><span>Tekrar testi</span></div>
        <div><strong>1</strong><span>Kapatılan eksik</span></div>
        <div><strong>4 dk</strong><span>Öğrenme süresi</span></div>
      </div>
      <button class="secondary-button restart" id="btnSummaryRestart">
        ↺ Ana sayfaya dön
      </button>
    </div>
  `;

  document.getElementById("btnSummaryRestart").addEventListener("click", () => {
    state.view = "home";
    renderHomeView();
  });
}

// --- AKIŞ AKSİYONLARI ---

// Teste Başla: POST /api/test/basla
async function startTest() {
  const btn = document.getElementById("btnStartTest");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner small"></span> Hazırlanıyor...`;
  }

  const data = await apiCall("/api/test/basla", "POST", {
    ogrenci_id: state.ogrenciId,
    konu_id: state.konu?.id || 1,
  });

  state.denemeId = data.deneme_id || 1;
  state.currentQuestion = data.soru || {
    id: 1,
    metin: "1/3 + 1/6 işleminin sonucu kaçtır?",
    secenekler: ["2/9", "1/2", "2/6", "1/9"],
  };
  state.questionNumber = 1;
  state.selectedOptionIndex = null;
  state.view = "pretest";
  renderPretestView();
}

// Ön Test Cevapla: POST /api/cevap
async function submitAnswer() {
  const btn = document.getElementById("btnSubmitAnswer");
  if (btn) btn.disabled = true;

  const data = await apiCall("/api/cevap", "POST", {
    deneme_id: state.denemeId || 1,
    soru_id: state.currentQuestion.id,
    secilen_index: state.selectedOptionIndex,
  });

  if (data.bitti || state.questionNumber >= 5) {
    // Teşhis çek: GET /api/teshis/{deneme_id}
    const teshisData = await apiCall(`/api/teshis/${state.denemeId || 1}`);
    state.diagnosis = teshisData;
    state.view = "diagnosis";
    renderDiagnosisView();
  } else {
    state.currentQuestion = data.soru;
    state.questionNumber++;
    state.selectedOptionIndex = null;
    renderPretestView();
  }
}

// Tekrar Testi Başlat: POST /api/tekrar/basla
async function startRetest() {
  const btn = document.getElementById("btnWatchedVideo");
  if (btn) btn.disabled = true;

  const data = await apiCall("/api/tekrar/basla", "POST", {
    deneme_id: state.denemeId || 1,
  });

  state.retestQuestions = data.sorular || [
    { id: 6, metin: "2/3 + 1/6 işleminin sonucu kaçtır?", secenekler: ["3/9", "3/6", "5/6", "2/9"] },
    { id: 7, metin: "7/10 − 2/5 işleminin sonucu kaçtır?", secenekler: ["5/5", "3/10", "5/10", "1/2"] },
  ];
  state.retestIndex = 0;
  state.selectedOptionIndex = null;
  state.view = "retest";
  renderRetestView();
}

// Tekrar Testi Cevapla
async function submitRetestAnswer() {
  if (state.retestIndex === state.retestQuestions.length - 1) {
    // Özet çek: GET /api/ozet/{deneme_id}
    const ozetData = await apiCall(`/api/ozet/${state.denemeId || 1}`);
    state.summaryData = ozetData;
    state.view = "summary";
    renderSummaryView();
  } else {
    state.retestIndex++;
    state.selectedOptionIndex = null;
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
