/**
 * Kıvılcım – Akıllı Öğrenme Platformu
 * Düz HTML + CSS + JavaScript (fetch API) Mimarisi
 */

// --- Sabitler & Veri Setleri ---
const DEMO_TOPIC = {
  title: "Kesirlerde toplama ve çıkarma",
  unit: "Matematik · 6. sınıf",
  duration: 12,
};

const PRETEST_QUESTIONS = [
  {
    id: "q1",
    prompt: "1/3 + 1/6 işleminin sonucu kaçtır?",
    options: ["2/9", "1/2", "2/6", "1/9"],
    correctAnswer: "1/2",
  },
  {
    id: "q2",
    prompt: "3/4 − 1/2 işleminin sonucu kaçtır?",
    options: ["2/2", "1/4", "2/4", "1/2"],
    correctAnswer: "1/4",
  },
  {
    id: "q3",
    prompt: "2/5 + 1/10 işlemini yapmak için ortak payda kaç olabilir?",
    options: ["5", "7", "10", "15"],
    correctAnswer: "10",
  },
  {
    id: "q4",
    prompt: "Paydaları eşit iki kesir toplanırken ne yapılır?",
    options: [
      "Paylar toplanır",
      "Paydalar toplanır",
      "İkisi de çarpılır",
      "Kesirler ters çevrilir",
    ],
    correctAnswer: "Paylar toplanır",
  },
  {
    id: "q5",
    prompt: "5/8 − 2/8 işleminin sonucu kaçtır?",
    options: ["3/8", "3/0", "7/8", "3/16"],
    correctAnswer: "3/8",
  },
];

const RETEST_QUESTIONS = [
  {
    id: "r1",
    prompt: "2/3 + 1/6 işleminin sonucu kaçtır?",
    options: ["3/9", "3/6", "5/6", "2/9"],
  },
  {
    id: "r2",
    prompt: "7/10 − 2/5 işleminin sonucu kaçtır?",
    options: ["5/5", "3/10", "5/10", "1/2"],
  },
];

const CHANNELS = [
  { id: "net", name: "Net Anlatım", detail: "Sade ve adım adım", videoId: "9VZsMY15xeU" },
  { id: "visual", name: "Görsel Matematik", detail: "Şemalarla öğren", videoId: "9VZsMY15xeU" },
  { id: "fast", name: "Hızlı Tekrar", detail: "Kısa ve öz", videoId: "9VZsMY15xeU" },
];

const INTERESTS = ["Basketbol", "Müzik", "Oyunlar", "Mutfak"];

const ANALOGIES = {
  Basketbol: "Bir yarım saha ile iki çeyrek saha aynı alanı anlatır. Kesirlerde de toplama yapmadan önce saha çizgilerini, yani paydaları, aynı ölçüye getiririz.",
  Müzik: "Bir yarım nota, iki çeyrek nota kadar sürer. Ritimleri toplarken vuruş birimlerini eşitlemek, kesirlerin paydalarını eşitlemeye benzer.",
  Oyunlar: "Farklı büyüklükteki enerji barlarını toplamak için önce ikisini de aynı dilimlere bölersin. İşte bu, ortak payda bulmaktır.",
  Mutfak: "Yarım bardak ile çeyrek bardağı toplarken ikisini de çeyrek ölçüyle düşünürüz: iki çeyrek artı bir çeyrek.",
};

// --- SVG İkon Üreticisi ---
function getIcon(name, size = 20) {
  const icons = {
    arrow: `<path d="M5 12h14m-5-5 5 5-5 5" />`,
    check: `<path d="m5 12 4 4L19 6" />`,
    clock: `<circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />`,
    play: `<path d="m9 7 8 5-8 5V7Z" />`,
    spark: `<path d="m12 3 1.4 4.6L18 9l-4.6 1.4L12 15l-1.4-4.6L6 9l4.6-1.4L12 3Zm6 11 .7 2.3L21 17l-2.3.7L18 20l-.7-2.3L15 17l2.3-.7L18 14Z" />`,
    book: `<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" /><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" />`,
    retry: `<path d="M20 8V4l-2 2a8 8 0 1 0 1.1 10" /><path d="M20 4h-4" />`,
    user: `<circle cx="12" cy="8" r="3" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" />`,
    edit: `<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />`,
  };
  return `<svg aria-hidden="true" fill="none" height="${size}" viewBox="0 0 24 24" width="${size}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icons[name] || ""}</svg>`;
}

// --- Uygulama Durumu (State) ---
const state = {
  screen: "login", // 'login' | 'teacher-register' | 'teacher-qr' | 'teacher-dashboard' | 'teacher-add-topic' | 'home' | 'pretest' | 'pretest-result' | 'diagnosis' | 'minutes' | 'bridge' | 'retest' | 'summary'
  name: "",
  role: "student",
  theme: "light",
  isDemo: false,
  topic: null,
  status: "idle", // 'idle' | 'loading' | 'error'
  error: "",
  questionIndex: 0,
  selected: "",
  lastAnswer: "",
  retestIndex: 0,
  pretestQuestions: [...PRETEST_QUESTIONS],
  pretestAnswers: {},
  classCode: "KIV6A2",
  className: "6-A Sınıfı",
  classes: [
    { code: "KIV6A2", name: "6-A Sınıfı" },
    { code: "KIV6B1", name: "6-B Sınıfı" },
  ],
  channelId: "net",
  interest: "",
  streak: 0,
  isRenaming: false,
  editName: "",
  insightOpen: false,
  qrUrl: "",
  qrError: false,
};

// URL parametre kontrolü (?sinif=MAT6A gibi)
if (typeof window !== "undefined") {
  const urlParamCode = new URLSearchParams(window.location.search).get("sinif");
  if (urlParamCode) {
    state.classCode = urlParamCode.toUpperCase();
  }
}

// --- API Katmanı (Fetch & Mock Fallback) ---
function mockApi(url, body) {
  if (url === "/api/giris") {
    if (!body.sinifKodu || !body.isim) throw new Error("Sınıf kodu ve isim gerekli.");
    let activeTopic = null;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`kivilcim_topic_${body.sinifKodu}`);
      if (stored) {
        try {
          activeTopic = JSON.parse(stored);
        } catch {
          activeTopic = null;
        }
      }
    }
    return { konu: activeTopic };
  }

  if (url === "/api/ogretmen-giris") {
    if (!body.email || !body.sifre) throw new Error("E-posta ve şifre gerekli.");
    return {
      isim: body.email.split("@")[0] || "Öğretmen",
      sinifKodu: "KIV6A2",
    };
  }

  if (url === "/api/ogretmen-kayit") {
    if (!body.isim || !body.email || !body.sifre) throw new Error("Tüm alanlar zorunludur.");
    return {
      isim: body.isim,
      sinifKodu: `KIV${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
    };
  }

  if (url === "/api/cevap") {
    return { tamamlandi: false };
  }

  throw new Error("Bu işlem için yerel demo bulunmuyor.");
}

async function postJson(url, body) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      // Backend bulunamadı veya hata döndürdüyse mock veriye düş
      return mockApi(url, body);
    }
    return await response.json();
  } catch (error) {
    // Ağ bağlantısı yoksa, port farklıysa veya Vite dev ortamındaysa mockApi ile devam et
    try {
      await new Promise((resolve) => setTimeout(resolve, 150));
      return mockApi(url, body);
    } catch (mockErr) {
      throw mockErr;
    }
  }
}

// --- QR Kod Üretimi ---
async function generateQr(text) {
  if (window.QRCode && typeof window.QRCode.toDataURL === "function") {
    try {
      return await window.QRCode.toDataURL(text, {
        width: 320,
        margin: 2,
        color: { dark: "#17352f", light: "#ffffff" },
        errorCorrectionLevel: "H",
      });
    } catch (e) {
      console.warn("QRCode kütüphane hatası:", e);
    }
  }
  // Kütüphane yüklenememişse veya offline ise yedek online API
  return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(text)}&color=17-53-47`;
}

// --- Marka / Logo Bileşeni ---
function renderBrand() {
  return `
    <div class="brand">
      <div class="brand-mark">
        <span></span><span></span><span></span>
      </div>
      Kıvılcım
    </div>
  `;
}

// --- Shell (Üst Bar & Çerçeve) ---
function renderShell(step = "", contentHtml = "", showLogout = true) {
  const initial = state.name ? state.name[0].toUpperCase() : "Ö";
  return `
    <div class="app-shell">
      <header class="topbar">
        ${renderBrand()}
        ${step ? `<div class="top-step">${step}</div>` : ""}
        <div style="display: flex; align-items: center; gap: 16px;">
          ${
            state.name
              ? `
            <div class="profile-pill">
              <span>${initial}</span>
              ${state.name}
            </div>
          `
              : ""
          }
          ${
            showLogout && state.name
              ? `
            <button class="text-button" id="btn-shell-logout" style="font-size: 13px; padding: 6px 12px; color: var(--coral);">
              Çıkış
            </button>
          `
              : ""
          }
        </div>
      </header>
      <main class="page">${contentHtml}</main>
    </div>
  `;
}

// --- EKRAN ŞABLONLARI ---

// 1. Giriş Ekranı (Login)
function renderLoginScreen() {
  const isStudent = state.role === "student";
  return `
    <div class="login-layout">
      <section class="login-art">
        ${renderBrand()}
        <div class="orbit orbit-one"></div>
        <div class="orbit orbit-two"></div>
        <div class="art-copy">
          <div class="eyebrow light">${getIcon("spark", 17)} Sana özel öğrenme yolu</div>
          <h1>Anlamak bazen<br />tek bir <em>kıvılcıma</em> bakar.</h1>
          <p>Nerede takıldığını bulalım, sana en uygun anlatımla birlikte çözelim.</p>
        </div>
        <div class="floating-note note-one">12 dakikada konu tamam</div>
        <div class="floating-note note-two">${getIcon("check", 15)} Kişisel öğrenme planın</div>
      </section>
      <section class="login-panel">
        <div class="mobile-brand">${renderBrand()}</div>
        <form class="login-card" id="form-login">
          <div class="role-switch" aria-label="Giriş türü">
            <button class="${isStudent ? "active" : ""}" type="button" id="btn-role-student">Öğrenci</button>
            <button class="${!isStudent ? "active" : ""}" type="button" id="btn-role-teacher">Öğretmen</button>
          </div>
          <div class="eyebrow"><span class="eyebrow-dot"></span> ${!isStudent ? "Sınıfını başlat" : "Hemen başlayalım"}</div>
          <h2>Tekrar hoş geldin</h2>
          <p>${!isStudent ? "Bilgilerinle giriş yap, sınıfının QR kodunu oluştur." : "Sınıf kodunu ve adını gir, kaldığın yerden devam et."}</p>
          
          ${
            state.status === "error"
              ? `
            <div class="inline-error" role="alert" style="margin-bottom: 20px; padding: 12px 16px; border-radius: 12px; background: rgba(240, 125, 98, .12); color: var(--coral); font-size: 14px;">
              <strong>Bağlantı kurulamadı.</strong>
              <span>${state.error}</span>
            </div>
          `
              : ""
          }

          ${
            isStudent
              ? `
            <label>
              Sınıf kodu
              <input
                id="input-class-code"
                autoCapitalize="characters"
                ${state.status === "loading" ? "disabled" : ""}
                maxlength="8"
                placeholder="Örn. MAT6A"
                required
                value="${state.classCode}"
              />
            </label>
            <label>
              Adın
              <div class="input-with-icon" style="position: relative;">
                <input
                  id="input-student-name"
                  ${state.status === "loading" ? "disabled" : ""}
                  placeholder="Adını yaz"
                  required
                  value="${state.name}"
                />
              </div>
            </label>
          `
              : `
            <label>
              E-posta adresi
              <input
                id="input-teacher-email"
                autocomplete="email"
                ${state.status === "loading" ? "disabled" : ""}
                placeholder="ogretmen@okul.edu.tr"
                required
                type="email"
              />
            </label>
            <label>
              Şifre
              <input
                id="input-teacher-password"
                autocomplete="current-password"
                ${state.status === "loading" ? "disabled" : ""}
                minlength="4"
                placeholder="••••••••"
                required
                type="password"
              />
            </label>
          `
          }

          <button class="primary-button" type="submit" ${state.status === "loading" ? "disabled" : ""}>
            ${
              state.status === "loading"
                ? `<span class="spinner small"></span> Hazırlanıyor`
                : !isStudent
                ? "QR kodu oluştur"
                : "Derse gir"
            }
          </button>
          
          <button
            class="text-button centered"
            id="btn-login-demo"
            type="button"
            style="margin-top: 8px;"
          >
            Demo verileriyle devam et
          </button>

          <small style="color: var(--muted); font-size: 13px; text-align: center; margin-top: 8px;">
            ${!isStudent ? "QR kodu yalnızca bu ders oturumu için oluşturulur." : "Giriş yaparak sınıfındaki öğrenme planına katılırsın."}
          </small>

          ${
            !isStudent
              ? `
            <p style="text-align: center; margin-top: 16px; font-size: 13px; color: var(--muted);">
              Hesabın yok mu?
              <button
                class="text-button"
                id="btn-goto-register"
                type="button"
                style="padding: 0; font-size: 13px; display: inline;"
              >
                Kayıt ol
              </button>
            </p>
          `
              : ""
          }
        </form>
      </section>
    </div>
  `;
}

// 2. Öğretmen Kayıt Ekranı (Teacher Register)
function renderTeacherRegisterScreen() {
  return `
    <div class="login-layout">
      <section class="login-art">
        ${renderBrand()}
        <div class="orbit orbit-one"></div>
        <div class="orbit orbit-two"></div>
        <div class="art-copy">
          <div class="eyebrow light">${getIcon("spark", 17)} Öğretmen topluluğuna katıl</div>
          <h1>Sınıfını geleceğe<br /><em>kıvılcım</em> ile taşı.</h1>
          <p>Her öğrencinin nerede takıldığını anında tespit et, derslerini kişiselleştirilmiş hızla yönet.</p>
        </div>
        <div class="floating-note note-one">Canlı sınıf içgörüleri</div>
        <div class="floating-note note-two">${getIcon("check", 15)} Kolay QR katılımı</div>
      </section>
      <section class="login-panel">
        <div class="mobile-brand">${renderBrand()}</div>
        <form class="login-card" id="form-register">
          <div class="eyebrow"><span class="eyebrow-dot"></span> Yeni öğretmen hesabı</div>
          <h2>Kayıt Ol</h2>
          <p>Öğretmen hesabını oluşturarak hemen sınıf oturumu başlatabilirsin.</p>
          
          ${
            state.error
              ? `
            <div class="inline-error" role="alert" style="margin-bottom: 20px; padding: 12px 16px; border-radius: 12px; background: rgba(240, 125, 98, .12); color: var(--coral); font-size: 14px;">
              <strong>Kayıt yapılamadı:</strong>
              <span>${state.error}</span>
            </div>
          `
              : ""
          }

          <label>
            Ad Soyad
            <input
              id="reg-name"
              ${state.status === "loading" ? "disabled" : ""}
              placeholder="Örn. Ayşe Yılmaz"
              required
            />
          </label>
          <label>
            Sınıf Adı
            <input
              id="reg-class-name"
              ${state.status === "loading" ? "disabled" : ""}
              placeholder="Örn. 6-A Matematik"
              required
            />
          </label>
          <label>
            Sınıf Katılım Kodu
            <input
              id="reg-class-code"
              autoCapitalize="characters"
              maxlength="8"
              ${state.status === "loading" ? "disabled" : ""}
              placeholder="Örn. KIV6A2"
              value="KIV6A2"
              required
            />
          </label>
          <small style="color: var(--muted); font-size: 11px; margin-top: -6px; margin-bottom: 14px; display: block;">
            Öğrenciler derse girerken bu kodu kullanır. Sınıf ismi ve kodu tamamen bağımsızdır.
          </small>
          <label>
            Okul Adı
            <input
              id="reg-school"
              ${state.status === "loading" ? "disabled" : ""}
              placeholder="Örn. Atatürk Ortaokulu"
              required
            />
          </label>
          <label>
            E-posta adresi
            <input
              id="reg-email"
              type="email"
              autocomplete="email"
              ${state.status === "loading" ? "disabled" : ""}
              placeholder="ogretmen@okul.edu.tr"
              required
            />
          </label>
          <label>
            Şifre
            <input
              id="reg-password"
              type="password"
              minlength="6"
              ${state.status === "loading" ? "disabled" : ""}
              placeholder="En az 6 karakter"
              required
            />
          </label>
          <label>
            Şifre Tekrarı
            <input
              id="reg-confirm-password"
              type="password"
              minlength="6"
              ${state.status === "loading" ? "disabled" : ""}
              placeholder="Şifrenizi tekrar girin"
              required
            />
          </label>
          <button class="primary-button" type="submit" ${state.status === "loading" ? "disabled" : ""}>
            ${state.status === "loading" ? `<span class="spinner small"></span> Oluşturuluyor` : "Hesap Oluştur"}
          </button>
          <p style="text-align: center; margin-top: 16px; font-size: 13px; color: var(--muted);">
            Zaten hesabın var mı?
            <button
              class="text-button"
              id="btn-reg-back-login"
              type="button"
              style="padding: 0; font-size: 13px; display: inline;"
            >
              Giriş yap
            </button>
          </p>
          <small style="color: var(--muted); font-size: 12px; text-align: center; margin-top: 8px;">Kayıt olarak kullanım koşullarını kabul etmiş olursun.</small>
        </form>
      </section>
    </div>
  `;
}

// 3. Öğretmen QR Ekranı (Teacher QR)
function renderTeacherQrScreen() {
  const content = `
    <div class="teacher-qr-page">
      <section class="qr-copy">
        <div class="eyebrow"><span class="eyebrow-dot"></span> Sınıfın hazır</div>
        <h1>Öğrencilerini<br />derse davet et.</h1>
        <p>QR kodu tahtaya yansıt. Öğrenciler kodu taradığında doğrudan bu sınıf oturumuna katılır.</p>
        <div class="qr-steps">
          <div><span>01</span><p><strong>QR kodu göster</strong><small>Öğrenciler telefonlarıyla tarasın.</small></p></div>
          <div><span>02</span><p><strong>Katılımları izle</strong><small>Panele geçen öğrencileri anlık gör.</small></p></div>
        </div>
      </section>
      <section class="qr-card">
        <div class="live-label"><i style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--green); margin-right:6px;"></i> Oturum açık</div>
        <div class="qr-frame" style="display: grid; place-items: center; min-height: 240px;">
          ${
            state.qrUrl
              ? `<img alt="${state.classCode} sınıfına katılım QR kodu" src="${state.qrUrl}" style="max-width: 100%; border-radius: 12px;" />`
              : `<span class="spinner"></span>`
          }
        </div>
        <p style="margin: 12px 0 4px; color: var(--muted);">Sınıf kodu</p>
        <strong class="class-code" style="font-size: 28px; letter-spacing: 2px; color: var(--green); display: block; margin-bottom: 8px;">${state.classCode}</strong>
        <small style="color: var(--muted); margin-bottom: 20px; display: block;">QR çalışmazsa öğrenciler bu kodla da katılabilir.</small>
        <button class="primary-button" id="btn-qr-to-dashboard">
          Öğretmen paneline geç
        </button>
      </section>
    </div>
  `;
  return renderShell("Sınıf oturumu", content);
}

// 4. Öğretmen Paneli (Teacher Dashboard)
function renderTeacherDashboardScreen() {
  const demoStudents = [
    { name: "Deniz A.", state: "Ön test", progress: 40 },
    { name: "Ece K.", state: "Öğreniyor", progress: 68 },
    { name: "Mert D.", state: "Tamamladı", progress: 100 },
    { name: "Selin Y.", state: "Teşhis", progress: 52 },
  ];
  const students = state.isDemo ? demoStudents : [];

  const content = `
    <div class="teacher-page">
      <div class="teacher-heading">
        <div>
          <div class="eyebrow"><span class="eyebrow-dot"></span> Canlı sınıf görünümü</div>
          <h1>Günaydın, ${state.name}.</h1>
          <div style="display: flex; align-items: center; gap: 12px; margin-top: 12px; flex-wrap: wrap;">
            ${
              state.isRenaming
                ? `
              <form id="form-rename-class" style="display: flex; gap: 8px; align-items: center;">
                <input
                  id="input-rename-class"
                  value="${state.editName}"
                  placeholder="Sınıf Adı"
                  style="padding: 8px 12px; border-radius: 8px; border: 1px solid var(--green); font-family: inherit; font-size: 15px; font-weight: 700; width: 170px;"
                  autofocus
                />
                <button type="submit" class="text-button" style="padding: 4px 8px;">Kaydet</button>
                <button type="button" class="text-button" id="btn-cancel-rename" style="padding: 4px 8px; color: var(--muted);">İptal</button>
              </form>
            `
                : `
              <select
                id="select-class"
                style="padding: 8px 32px 8px 16px; border-radius: 12px; border: 1px solid var(--line); background: #fff; font-family: inherit; font-size: 15px; font-weight: 700; color: var(--ink); cursor: pointer;"
              >
                ${state.classes
                  .map((c) => {
                    const code = typeof c === "object" ? c.code : c;
                    const name = typeof c === "object" ? c.name : `${c} Sınıfı`;
                    return `<option value="${code}" ${code === state.classCode ? "selected" : ""}>${name}</option>`;
                  })
                  .join("")}
              </select>
              <span style="font-size: 12px; font-weight: 700; background: var(--mint); color: var(--green); padding: 5px 10px; border-radius: 8px;">
                Katılım Kodu: <strong style="letter-spacing: 1px;">${state.classCode}</strong>
              </span>
              <button
                class="text-button"
                id="btn-start-rename"
                title="Sınıf Adını Değiştir"
                style="padding: 4px; display: flex; align-items: center; gap: 6px; font-size: 13px;"
              >
                ${getIcon("edit", 15)} Adı Düzenle
              </button>
              <p style="margin: 0; color: var(--muted); font-size: 14px;">öğrenme yolculuğunu buradan takip edebilirsin.</p>
            `
            }
          </div>
        </div>
        <div style="display: flex; gap: 12px; align-items: center;">
          <button class="primary-button" id="btn-dash-add-topic">Konu Ekle</button>
          <button class="secondary-button" id="btn-dash-show-qr">QR Kod</button>
          <button class="secondary-button" id="btn-dash-logout">Çıkış</button>
        </div>
      </div>

      ${
        state.topic
          ? `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; background: var(--bg-card); border: 1px solid var(--line); border-radius: 16px; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
            <span style="padding: 4px 10px; border-radius: 8px; background: var(--mint); color: var(--green); fontSize: 12px; font-weight: 700;">Aktif Konu</span>
            <strong style="font-size: 15px;">${state.topic.title}</strong>
            <span style="color: var(--muted); font-size: 13px;">(${state.topic.unit} · ~${state.topic.duration} dk)</span>
          </div>
          <button
            class="text-button"
            id="btn-remove-topic"
            style="color: var(--coral); padding: 4px 8px; font-size: 13px;"
            type="button"
          >
            Konuyu Kaldır
          </button>
        </div>
      `
          : `
        <div style="padding: 16px 20px; background: var(--bg-card); border: 1px dashed var(--line); border-radius: 16px; margin-bottom: 20px; color: var(--muted); font-size: 13px; display: flex; justify-content: space-between; align-items: center;">
          <span>Bu sınıf için henüz atanmış bir ders konusu yok.</span>
          <button class="text-button" id="btn-dash-add-topic-alt" style="padding: 4px 8px;" type="button">
            + Yeni Konu Ata
          </button>
        </div>
      `
      }

      <div class="teacher-stats">
        <article>
          <span>Katılan öğrenci</span>
          <strong>${state.isDemo ? "24" : "0"}</strong>
          <small>${state.isDemo ? "28 öğrenciden" : "0 öğrenciden"}</small>
        </article>
        <article>
          <span>Konuyu tamamlayan</span>
          <strong>${state.isDemo ? "17" : "0"}</strong>
          <small class="${state.isDemo ? "positive" : ""}">${state.isDemo ? "Son 10 dk. +6" : "Henüz tamamlayan yok"}</small>
        </article>
        <article>
          <span>Ortak öğrenme eksiği</span>
          <strong>${state.isDemo ? "%42" : "—"}</strong>
          <small>${state.isDemo ? "Paydaları eşitleme" : "Veri toplanıyor"}</small>
        </article>
      </div>

      <div class="dashboard-grid">
        <section class="student-table">
          <div class="section-heading">
            <div>
              <p class="card-kicker">Canlı takip</p>
              <h2>Öğrenci ilerlemesi</h2>
            </div>
            <span><i style="${!state.isDemo ? "background: var(--muted);" : ""}"></i> ${state.isDemo ? "24" : "0"} çevrimiçi</span>
          </div>
          ${
            students.length > 0
              ? `
            <div class="table-head"><span>Öğrenci</span><span>Bulunduğu adım</span><span>İlerleme</span></div>
            ${students
              .map(
                (student) => `
              <div class="student-row">
                <span class="student-name"><i>${student.name[0]}</i>${student.name}</span>
                <span><b class="state-tag state-${student.progress}">${student.state}</b></span>
                <span class="mini-progress"><i><b style="width: ${student.progress}%"></b></i><em>${student.progress}%</em></span>
              </div>
            `
              )
              .join("")}
          `
              : `
            <div style="padding: 36px 20px; text-align: center; color: var(--muted); font-size: 14px; border-radius: 16px; border: 1px dashed var(--line); margin-top: 16px;">
              <div style="margin-bottom: 8px; font-size: 28px;">👥</div>
              <strong style="display: block; color: var(--ink); margin-bottom: 4px; font-size: 15px;">
                Henüz derse katılan öğrenci yok
              </strong>
              <span>Öğrencileriniz QR kodu okutarak veya <strong>${state.classCode}</strong> kodunu girerek derse katıldığında burada canlı olarak listelenecektir.</span>
            </div>
          `
          }
        </section>

        <aside class="insight-panel">
          <div class="insight-icon">${getIcon("spark")}</div>
          <p class="card-kicker">Sınıf içgörüsü</p>
          ${
            state.isDemo
              ? `
            <h2>12 öğrenci aynı adımda zorlanıyor.</h2>
            <p>Paydaları eşitleme konusunda sınıfa kısa bir hatırlatma yapabilirsin.</p>
            <button class="secondary-button" id="btn-open-insight">Detayı görüntüle ${getIcon("arrow", 17)}</button>
          `
              : `
            <h2>Yeterli veri toplanmadı</h2>
            <p>Öğrenciler ön test ve ders etkinliklerini tamamladıkça sınıfın ortak eksikleri burada analiz edilecektir.</p>
            <button class="secondary-button" disabled style="opacity: 0.6; cursor: not-allowed;">
              Analiz bekleniyor
            </button>
          `
          }
        </aside>
      </div>
    </div>

    ${
      state.insightOpen
        ? `
      <div id="modal-insight" style="position: fixed; inset: 0; background-color: rgba(0,0,0,0.5); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px; color: var(--ink);">
        <div style="background: var(--bg-card, #fff); border-radius: 24px; padding: 32px; width: 100%; max-width: 500px; box-shadow: 0 20px 40px rgba(0,0,0,0.2);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="font-size: 22px; margin: 0;">Zorlanılan Adım: Payda Eşitleme</h2>
            <button class="text-button" id="btn-close-insight" style="padding: 8px;">${getIcon("arrow")}</button>
          </div>
          <p style="color: var(--muted); margin-bottom: 20px; font-size: 14px; line-height: 1.6;">
            Aşağıdaki 12 öğrenci, farklı paydalı kesirleri toplarken paydaları eşitlemek yerine doğrudan toplamayı denedi.
          </p>
          <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; max-height: 300px; overflow-y: auto;">
            ${[
              "Deniz A.",
              "Ali K.",
              "Ayşe Y.",
              "Mehmet D.",
              "Zeynep T.",
              "Ahmet M.",
              "Elif E.",
              "Cem B.",
              "Burak G.",
              "Selin S.",
              "Mert Y.",
              "Doğa L.",
            ]
              .map(
                (name, i) => `
              <li style="display: flex; justify-content: space-between; padding: 12px 16px; border-radius: 12px; background: var(--bg-input, #fafbf9); font-size: 14px; font-weight: 600;">
                <span>${name}</span>
                <span style="color: var(--coral);">Soru ${(i % 3) + 3}</span>
              </li>
            `
              )
              .join("")}
          </ul>
        </div>
      </div>
    `
        : ""
    }
  `;
  return renderShell(`Sınıf ${state.classCode}`, content, false);
}

// 5. Yeni Konu Ekle (Teacher Add Topic)
function renderTeacherAddTopicScreen() {
  const content = `
    <div class="teacher-page">
      <div class="teacher-heading">
        <div>
          <div class="eyebrow"><span class="eyebrow-dot"></span> Ders İçeriği</div>
          <h1>Yeni Konu Ekle</h1>
          <p>Sınıfın için yeni bir öğrenme konusu belirle.</p>
        </div>
      </div>
      <div class="dashboard-grid" style="grid-template-columns: 1fr;">
        <section class="login-card" style="max-width: 540px; width: 100%; margin: 0 auto; padding: 40px; background-color: var(--bg-card); border-radius: 24px; border: 1px solid var(--line); box-shadow: 0 14px 45px rgba(34,64,56,.05);">
          <form id="form-add-topic" style="display: flex; flex-direction: column;">
            <label>
              Ders / Ünite
              <input
                id="topic-unit"
                placeholder="Örn. Matematik · 6. sınıf"
                required
              />
            </label>
            <label>
              Konu Başlığı
              <input
                id="topic-title"
                placeholder="Örn. Kesirlerde toplama ve çıkarma"
                required
              />
            </label>
            <label>
              Tahmini Süre (dakika)
              <input
                id="topic-duration"
                max="120"
                min="1"
                required
                type="number"
                value="12"
              />
            </label>
            <div style="display: flex; gap: 12px; margin-top: 16px;">
              <button class="primary-button" type="submit" id="btn-save-topic">
                Konuyu Kaydet
              </button>
              <button class="text-button centered" id="btn-cancel-topic" type="button">
                İptal
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  `;
  return renderShell("Yeni Konu Ekle", content);
}

// 6. Öğrenci Ana Sayfa (Home)
function renderHomeScreen() {
  const content = `
    <div class="home-hero">
      <div>
        <div class="eyebrow"><span class="eyebrow-dot"></span> Bugünün çalışma planı</div>
        <h1>Merhaba, ${state.name}.</h1>
        <p>Bugün küçük bir adımla büyük bir fark yaratabiliriz.</p>
      </div>
      <div class="streak-card"><span>${state.streak}</span><small>günlük seri</small></div>
    </div>
    ${
      !state.topic
        ? `
      <div class="feedback-card" role="status">
        <div class="feedback-icon empty">${getIcon("book")}</div>
        <h2>Sıradaki konu henüz hazır değil</h2>
        <p>Öğretmenin henüz bu sınıf (${state.classCode}) için yeni bir konu atamadı.</p>
        <div class="feedback-actions" style="margin-top: 16px; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
          <button class="primary-button" id="btn-start-demo-topic">Örnek Konuyu Başlat</button>
        </div>
      </div>
    `
        : `
      <section class="topic-card">
        <div class="topic-visual">
          <div class="fraction-shape"><span>1</span><i></i><span>2</span></div>
          <div class="fraction-shape second"><span>1</span><i></i><span>3</span></div>
        </div>
        <div class="topic-content">
          <div class="card-kicker">${getIcon("book", 18)} Sıradaki konu</div>
          <p class="unit">${state.topic.unit}</p>
          <h2>${state.topic.title}</h2>
          <div class="meta">
            <span>${getIcon("clock", 17)} Yaklaşık ${state.topic.duration} dakika</span>
            <span>5 kısa soru</span>
          </div>
          <button class="primary-button" id="btn-start-pretest">Hazır mısın?</button>
        </div>
      </section>
    `
    }
    <div class="encouragement">
      ${getIcon("spark")}
      <span><strong>Küçük bir hatırlatma:</strong> Bilmediğin sorularda “Bilmiyorum” demen, sana daha iyi yardımcı olmamızı sağlar.</span>
    </div>
  `;
  return renderShell("", content);
}

// 7. Ön Test Ekranı (Pretest)
function renderPretestScreen() {
  const total = state.pretestQuestions.length;
  const current = state.questionIndex + 1;
  const q = state.pretestQuestions[state.questionIndex];
  const progressPercent = (current / total) * 100;

  const content = `
    <div class="quiz-page">
      <div class="progress-wrap">
        <div class="progress-copy"><span>Ön test</span><strong>${current}/${total}</strong></div>
        <div class="progress-track"><span style="width: ${progressPercent}%;"></span></div>
      </div>
      
      <section class="question-card">
        <div class="question-number">Soru ${current}</div>
        <h1>${q.prompt}</h1>
        <div class="options">
          ${q.options
            .map(
              (opt, idx) => `
            <button
              class="option ${state.selected === opt ? "selected" : ""}"
              data-opt="${opt}"
              type="button"
            >
              <span>${String.fromCharCode(65 + idx)}</span>${opt}
              ${state.selected === opt ? getIcon("check") : ""}
            </button>
          `
            )
            .join("")}
          <button
            class="option unknown ${state.selected === "Bilmiyorum" ? "selected" : ""}"
            data-opt="Bilmiyorum"
            type="button"
          >
            <span>?</span>Bilmiyorum
            ${state.selected === "Bilmiyorum" ? getIcon("check") : ""}
          </button>
        </div>
        <div class="quiz-actions">
          <p>Cevabından emin olmasan da sorun değil.</p>
          <button
            class="primary-button"
            id="btn-next-pretest"
            ${!state.selected ? "disabled" : ""}
          >
            ${current === total ? "Testi tamamla" : "Sonraki soru"}
          </button>
        </div>
      </section>
    </div>
  `;
  return renderShell("Ön test", content);
}

// 8. Ön Test Sonucu (Pretest Result)
function renderPretestResultScreen() {
  const correctCount = state.pretestQuestions.filter(
    (q) => q.correctAnswer && state.pretestAnswers[q.id] === q.correctAnswer
  ).length;
  const ringPercent = (correctCount / 5) * 100;

  const content = `
    <div class="result-page">
      <section class="result-hero">
        <div
          class="result-ring"
          style="background: conic-gradient(var(--green) 0 ${ringPercent}%, #dfe9e3 ${ringPercent}% 100%);"
        >
          <strong>${correctCount}<small>/5</small></strong>
          <span>doğru cevap</span>
        </div>
        <div>
          <div class="eyebrow"><span class="eyebrow-dot"></span> Ön test tamamlandı</div>
          <h1>Nasıl yardımcı olacağımızı bulduk.</h1>
          <p>Bu bir not değil; sana en kısa öğrenme yolunu hazırlamak için kullandığımız küçük bir yol haritası.</p>
        </div>
      </section>
      <section class="answer-review">
        <div class="section-heading">
          <div><p class="card-kicker">5 sorunun özeti</p><h2>Cevapların</h2></div>
          <span class="result-note">Sonuç kaydedildi</span>
        </div>
        <div class="review-list">
          ${state.pretestQuestions
            .map((q, idx) => {
              const ans = state.pretestAnswers[q.id] || "Bilmiyorum";
              const isCorrect = ans === q.correctAnswer;
              return `
              <div class="review-row">
                <span class="review-status ${isCorrect ? "correct" : "needs-work"}">
                  ${isCorrect ? getIcon("check") : idx + 1}
                </span>
                <div>
                  <small>Soru ${idx + 1}</small>
                  <strong>${q.prompt}</strong>
                </div>
                <span class="${isCorrect ? "answer-correct" : "answer-missed"}">
                  ${ans}
                </span>
              </div>
            `;
            })
            .join("")}
        </div>
      </section>
      <div class="result-action">
        <p>${getIcon("spark")} Bir sonraki adımda yalnızca eksik kalan noktaya odaklanacağız.</p>
        <button class="primary-button" id="btn-to-diagnosis">Eksik alanımı göster</button>
      </div>
    </div>
  `;
  return renderShell("Ön test sonucu", content);
}

// 9. Teşhis Ekranı (Diagnosis)
function renderDiagnosisScreen() {
  const content = `
    <div class="center-page">
      <div class="success-orbit"><div>${getIcon("spark", 34)}</div></div>
      <div class="eyebrow"><span class="eyebrow-dot"></span> Tam olarak bulduk</div>
      <h1>Eksik olan küçük bir bağlantı.</h1>
      <p class="lead">Kesirleri toplarken <strong>paydaları eşitleme</strong> adımında desteğe ihtiyacın var.</p>
      <section class="diagnosis-card">
        <div class="diagnosis-row">
          <span class="status-icon okay">${getIcon("check")}</span>
          <div><small>Gayet iyi</small><strong>Kesrin pay ve paydasını tanıyorsun</strong></div>
        </div>
        <div class="diagnosis-line"></div>
        <div class="diagnosis-row">
          <span class="status-icon focus">${getIcon("spark")}</span>
          <div><small>Birlikte tamamlayacağız</small><strong>Farklı paydaları eşitleme</strong></div>
        </div>
      </section>
      <p class="microcopy">Sana özel seçtiğimiz 4 dakikalık anlatımla bu boşluğu kapatalım.</p>
      <button class="primary-button" id="btn-to-minutes">Dakikalarımı göster</button>
    </div>
  `;
  return renderShell("Teşhis", content);
}

// 10. Öğrenme Dakikaları (Minutes)
function renderMinutesScreen() {
  const channel = CHANNELS.find((item) => item.id === state.channelId) || CHANNELS[0];
  const content = `
    <div class="video-page">
      <div class="video-heading">
        <div>
          <div class="eyebrow"><span class="eyebrow-dot"></span> Sana özel 4 dakika</div>
          <h1>Paydaları birlikte eşitleyelim.</h1>
        </div>
        <button class="bridge-link" id="btn-to-bridge">
          ${getIcon("spark")} Bir benzetmeyle anlat
        </button>
      </div>
      <div class="learning-grid">
        <section>
          <div class="video-frame">
            <iframe
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
              referrerpolicy="strict-origin-when-cross-origin"
              src="https://www.youtube.com/embed/${channel.videoId}?start=52&end=292&rel=0"
              title="${channel.name} — Paydaları eşitleme"
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
            ${CHANNELS.map(
              (item, idx) => `
              <button
                class="channel ${state.channelId === item.id ? "active" : ""}"
                data-channel="${item.id}"
                type="button"
              >
                <span class="channel-avatar">${idx + 1}</span>
                <span><strong>${item.name}</strong><small>${item.detail}</small></span>
                <i>${state.channelId === item.id ? "<span></span>" : ""}</i>
              </button>
            `
            ).join("")}
          </div>
          <div class="tip">${getIcon("play")}<span>Videoyu kendi hızında izleyebilir, anlamadığın yerde geri sarabilirsin.</span></div>
          <button class="primary-button" id="btn-video-watched">İzledim</button>
        </aside>
      </div>
    </div>
  `;
  return renderShell("Öğrenme dakikaları", content);
}

// 11. Bilişsel Köprü (Bridge)
function renderBridgeScreen() {
  const content = `
    <div class="bridge-page">
      <div class="bridge-intro">
        <div class="eyebrow">${getIcon("spark", 17)} Başka bir yoldan bakalım</div>
        <h1>Bir ilgi alanı seç.</h1>
        <p>Konuyu zaten bildiğin bir dünyaya bağlayalım.</p>
      </div>
      <div class="interest-list">
        ${INTERESTS.map(
          (item, idx) => `
          <button
            class="interest ${state.interest === item ? "active" : ""}"
            data-interest="${item}"
            type="button"
          >
            <span>0${idx + 1}</span>${item}${getIcon("arrow")}
          </button>
        `
        ).join("")}
      </div>
      ${
        !state.interest
          ? `
        <div class="feedback-card" role="status">
          <div class="feedback-icon empty">${getIcon("book")}</div>
          <h2>Seçimini bekliyoruz</h2>
          <p>Benzetmeni oluşturmak için yukarıdan sana yakın gelen bir alan seç.</p>
        </div>
      `
          : `
        <section class="analogy-card">
          <div class="analogy-label">${getIcon("spark")} ${state.interest} ile düşünelim</div>
          <blockquote>“${ANALOGIES[state.interest]}”</blockquote>
          <div class="analogy-equation">
            <span>1/2</span><b>=</b><span>2/4</span><b>+</b><span>1/4</span><b>=</b><strong>3/4</strong>
          </div>
          <button class="primary-button" id="btn-back-to-video">Şimdi videoya dön</button>
        </section>
      `
      }
    </div>
  `;
  return renderShell("Bilişsel köprü", content);
}

// 12. Tekrar Testi (Retest)
function renderRetestScreen() {
  const total = RETEST_QUESTIONS.length;
  const current = state.retestIndex + 1;
  const q = RETEST_QUESTIONS[state.retestIndex];
  const progressPercent = (current / total) * 100;

  const content = `
    <div class="quiz-page">
      <div class="progress-wrap">
        <div class="progress-copy"><span>Tekrar testi</span><strong>${current}/${total}</strong></div>
        <div class="progress-track"><span style="width: ${progressPercent}%;"></span></div>
      </div>
      
      <section class="question-card">
        <div class="question-number">Soru ${current}</div>
        <h1>${q.prompt}</h1>
        <div class="options">
          ${q.options
            .map(
              (opt, idx) => `
            <button
              class="option ${state.selected === opt ? "selected" : ""}"
              data-opt="${opt}"
              type="button"
            >
              <span>${String.fromCharCode(65 + idx)}</span>${opt}
              ${state.selected === opt ? getIcon("check") : ""}
            </button>
          `
            )
            .join("")}
        </div>
        <div class="quiz-actions">
          <p>Cevabından emin olmasan da sorun değil.</p>
          <button
            class="primary-button"
            id="btn-next-retest"
            ${!state.selected ? "disabled" : ""}
          >
            ${current === total ? "Testi tamamla" : "Sonraki soru"}
          </button>
        </div>
      </section>
    </div>
  `;
  return renderShell("Tekrar testi", content);
}

// 13. Özet / Tebrik Ekranı (Summary)
function renderSummaryScreen() {
  const topicTitle = state.topic ? state.topic.title.toLowerCase() : "kesirlerde toplama ve çıkarma";
  const content = `
    <div class="summary-page">
      <div class="confetti c1"></div><div class="confetti c2"></div><div class="confetti c3"></div><div class="confetti c4"></div>
      <div class="summary-check">${getIcon("check", 42)}</div>
      <div class="eyebrow"><span class="eyebrow-dot"></span> Konu tamamlandı</div>
      <h1>Hazırsın, ${state.name}.</h1>
      <p>Eksik parçayı yerine koydun. Şimdi ${topicTitle} çok daha net.</p>
      <section class="time-earned">
        <div>${getIcon("clock", 28)}</div>
        <span><small>Kazandığın süre</small><strong>8 dakika</strong></span>
        <i>Bugünkü hedefin tamamlandı</i>
      </section>
      <div class="summary-stats">
        <div><strong>2/2</strong><span>Tekrar testi</span></div>
        <div><strong>1</strong><span>Kapatılan eksik</span></div>
        <div><strong>4 dk</strong><span>Öğrenme süresi</span></div>
      </div>
      <button class="secondary-button restart" id="btn-summary-restart">
        ${getIcon("retry")} Ana sayfaya dön
      </button>
    </div>
  `;
  return renderShell("", content);
}

// --- Ana Render Fonksiyonu ---
function render() {
  const app = document.getElementById("app");
  if (!app) return;

  // Tema class'ını güncelle
  if (state.theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }

  // Sayfayı render et
  let html = "";
  switch (state.screen) {
    case "login":
      html = renderLoginScreen();
      break;
    case "teacher-register":
      html = renderTeacherRegisterScreen();
      break;
    case "teacher-qr":
      html = renderTeacherQrScreen();
      break;
    case "teacher-dashboard":
      html = renderTeacherDashboardScreen();
      break;
    case "teacher-add-topic":
      html = renderTeacherAddTopicScreen();
      break;
    case "home":
      html = renderHomeScreen();
      break;
    case "pretest":
      html = renderPretestScreen();
      break;
    case "pretest-result":
      html = renderPretestResultScreen();
      break;
    case "diagnosis":
      html = renderDiagnosisScreen();
      break;
    case "minutes":
      html = renderMinutesScreen();
      break;
    case "bridge":
      html = renderBridgeScreen();
      break;
    case "retest":
      html = renderRetestScreen();
      break;
    case "summary":
      html = renderSummaryScreen();
      break;
    default:
      html = renderLoginScreen();
  }

  // Tema Değiştirme Butonu
  const themeButtonHtml = `
    <button
      id="btn-toggle-theme"
      style="
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: var(--green);
        color: #fff;
        border: none;
        box-shadow: 0 8px 16px rgba(23,108,88,0.3);
        font-size: 20px;
        cursor: pointer;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: 0.2s;
      "
      title="Temayı Değiştir"
    >
      ${state.theme === "light" ? "🌙" : "☀️"}
    </button>
  `;

  app.innerHTML = html + themeButtonHtml;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// --- Global Event Listener & Aksiyon Bağlantıları ---
let listenersInitialized = false;
function initEventListeners() {
  if (listenersInitialized) return;
  const app = document.getElementById("app");
  if (!app) return;
  listenersInitialized = true;

  // Tıklama Olayları (Event Delegation)
  app.addEventListener("click", async (e) => {
    const target = e.target;

    // Tema Değiştir
    if (target.closest("#btn-toggle-theme")) {
      state.theme = state.theme === "light" ? "dark" : "light";
      render();
      return;
    }

    // Çıkış Butonları
    if (target.closest("#btn-shell-logout") || target.closest("#btn-dash-logout")) {
      state.isDemo = false;
      state.name = "";
      state.topic = null;
      state.status = "idle";
      state.screen = "login";
      render();
      return;
    }

    // Rol Değiştirme (Öğrenci / Öğretmen Sekmesi)
    if (target.closest("#btn-role-student")) {
      state.role = "student";
      render();
      return;
    }
    if (target.closest("#btn-role-teacher")) {
      state.role = "teacher";
      render();
      return;
    }

    // Demo Butonları
    if (target.closest("#btn-login-demo")) {
      if (state.role === "teacher") {
        state.isDemo = true;
        state.name = "Ayşe Öğretmen";
        state.classCode = "KIV6A2";
        state.className = "6-A Matematik";
        state.classes = [
          { code: "KIV6A2", name: "6-A Matematik" },
          { code: "KIV6B1", name: "6-B Matematik" },
          { code: "KIV7A1", name: "7-A Fen Bilgisi" },
        ];
        state.topic = DEMO_TOPIC;
        state.status = "idle";
        state.screen = "teacher-dashboard";
      } else {
        state.isDemo = true;
        state.name = state.name || "Deniz";
        state.topic = DEMO_TOPIC;
        state.status = "idle";
        state.screen = "home";
      }
      render();
      return;
    }

    if (target.closest("#btn-home-demo")) {
      state.topic = DEMO_TOPIC;
      render();
      return;
    }

    // Kayıt Sayfasına Geç
    if (target.closest("#btn-goto-register")) {
      state.error = "";
      state.status = "idle";
      state.screen = "teacher-register";
      render();
      return;
    }

    // Kayıttan Girişe Dön
    if (target.closest("#btn-reg-back-login")) {
      state.error = "";
      state.status = "idle";
      state.screen = "login";
      render();
      return;
    }

    // Öğretmen QR -> Panoya Geç
    if (target.closest("#btn-qr-to-dashboard")) {
      state.screen = "teacher-dashboard";
      render();
      return;
    }

    // Öğretmen Paneli Butonları
    if (target.closest("#btn-dash-add-topic") || target.closest("#btn-dash-add-topic-alt")) {
      state.screen = "teacher-add-topic";
      render();
      return;
    }

    if (target.closest("#btn-dash-show-qr")) {
      state.screen = "teacher-qr";
      loadQrCode();
      render();
      return;
    }

    if (target.closest("#btn-remove-topic")) {
      state.topic = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem(`kivilcim_topic_${state.classCode}`);
      }
      render();
      return;
    }

    if (target.closest("#btn-start-rename")) {
      state.isRenaming = true;
      state.editName = state.className;
      render();
      return;
    }

    if (target.closest("#btn-cancel-rename")) {
      state.isRenaming = false;
      render();
      return;
    }

    if (target.closest("#btn-open-insight")) {
      state.insightOpen = true;
      render();
      return;
    }

    if (target.closest("#btn-close-insight") || target.id === "modal-insight") {
      state.insightOpen = false;
      render();
      return;
    }

    if (target.closest("#btn-cancel-topic")) {
      state.screen = "teacher-dashboard";
      render();
      return;
    }

    // Öğrenci Akışı Butonları
    if (target.closest("#btn-start-demo-topic")) {
      state.topic = DEMO_TOPIC;
      render();
      return;
    }

    if (target.closest("#btn-start-pretest")) {
      state.questionIndex = 0;
      state.selected = "";
      state.pretestAnswers = {};
      state.screen = "pretest";
      render();
      return;
    }

    // Şık Seçimi (Ön Test)
    const optBtn = target.closest("button[data-opt]");
    if (optBtn) {
      state.selected = optBtn.getAttribute("data-opt");
      render();
      return;
    }

    // Ön Test Cevapla / İlerle
    if (target.closest("#btn-next-pretest")) {
      state.lastAnswer = state.selected;
      state.pretestAnswers[state.pretestQuestions[state.questionIndex].id] = state.selected;

      // Backend'e cevap gönderimi
      postJson("/api/cevap", {
        soruId: state.pretestQuestions[state.questionIndex].id,
        cevap: state.selected === "Bilmiyorum" ? null : state.selected,
      }).catch((e) => console.warn(e));

      if (state.questionIndex === state.pretestQuestions.length - 1) {
        state.selected = "";
        state.screen = "pretest-result";
      } else {
        state.questionIndex++;
        state.selected = "";
      }
      render();
      return;
    }

    if (target.closest("#btn-to-diagnosis")) {
      state.screen = "diagnosis";
      render();
      return;
    }

    if (target.closest("#btn-to-minutes") || target.closest("#btn-back-to-video")) {
      state.screen = "minutes";
      render();
      return;
    }

    if (target.closest("#btn-to-bridge")) {
      state.screen = "bridge";
      render();
      return;
    }

    // Kanal Değiştir
    const chanBtn = target.closest("button[data-channel]");
    if (chanBtn) {
      state.channelId = chanBtn.getAttribute("data-channel");
      render();
      return;
    }

    // İlgi Alanı Seç
    const intBtn = target.closest("button[data-interest]");
    if (intBtn) {
      state.interest = intBtn.getAttribute("data-interest");
      render();
      return;
    }

    // Video İzlendi -> Tekrar Testine Geç
    if (target.closest("#btn-video-watched")) {
      state.retestIndex = 0;
      state.selected = "";
      state.screen = "retest";
      render();
      return;
    }

    // Tekrar Testi Cevapla / İlerle
    if (target.closest("#btn-next-retest")) {
      if (state.retestIndex === RETEST_QUESTIONS.length - 1) {
        state.screen = "summary";
      } else {
        state.retestIndex++;
        state.selected = "";
      }
      render();
      return;
    }

    // Özetten Ana Sayfaya Dön
    if (target.closest("#btn-summary-restart")) {
      state.screen = "home";
      render();
      return;
    }
  });

  // Seçim Kutusu Değişikliği (Sınıf Seçimi)
  app.addEventListener("change", (e) => {
    if (e.target.id === "select-class") {
      const selectedCode = e.target.value;
      state.classCode = selectedCode;
      const found = state.classes.find((c) => (typeof c === "object" ? c.code : c) === selectedCode);
      state.className = found ? (typeof found === "object" ? found.name : `${found} Sınıfı`) : `${selectedCode} Sınıfı`;
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem(`kivilcim_topic_${state.classCode}`);
        state.topic = saved ? JSON.parse(saved) : null;
      }
      render();
    }
  });

  // Form Gönderimleri (Submit)
  app.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 1. Giriş Formu
    if (e.target.id === "form-login") {
      if (state.role === "student") {
        const codeInput = document.getElementById("input-class-code");
        const nameInput = document.getElementById("input-student-name");
        const code = codeInput ? codeInput.value.trim().toUpperCase() : "";
        const studentName = nameInput ? nameInput.value.trim() : "";

        if (!code || !studentName) {
          state.status = "error";
          state.error = "Lütfen sınıf kodunu ve adınızı girin.";
          render();
          return;
        }

        state.status = "loading";
        state.error = "";
        render();

        try {
          const res = await postJson("/api/giris", { sinifKodu: code, isim: studentName });
          state.isDemo = false;
          state.name = studentName;
          state.classCode = code;
          state.topic = res.konu || null;
          state.status = "idle";
          state.screen = "home";
        } catch (err) {
          state.status = "error";
          state.error = err instanceof Error ? err.message : "Giriş başarısız.";
        }
      } else {
        const emailInput = document.getElementById("input-teacher-email");
        const pwdInput = document.getElementById("input-teacher-password");
        const email = emailInput ? emailInput.value.trim() : "";
        const pwd = pwdInput ? pwdInput.value : "";

        if (!email || !pwd) {
          state.status = "error";
          state.error = "Lütfen e-posta ve şifrenizi girin.";
          render();
          return;
        }

        state.status = "loading";
        state.error = "";
        render();

        try {
          const res = await postJson("/api/ogretmen-giris", { email, sifre: pwd });
          state.isDemo = false;
          state.name = res.isim || email.split("@")[0];
          state.classCode = res.sinifKodu || "KIV6A2";
          state.className = res.sinifAdi || "6-A Sınıfı";
          state.classes = [{ code: state.classCode, name: state.className }];
          if (typeof window !== "undefined") {
            const saved = localStorage.getItem(`kivilcim_topic_${state.classCode}`);
            state.topic = saved ? JSON.parse(saved) : null;
          }
          state.status = "idle";
          state.screen = "teacher-dashboard";
          loadQrCode();
        } catch (err) {
          state.status = "error";
          state.error = err instanceof Error ? err.message : "Giriş başarısız.";
        }
      }
      render();
      return;
    }

    // 2. Kayıt Formu
    if (e.target.id === "form-register") {
      const nameInput = document.getElementById("reg-name");
      const classNameInput = document.getElementById("reg-class-name");
      const classCodeInput = document.getElementById("reg-class-code");
      const schoolInput = document.getElementById("reg-school");
      const emailInput = document.getElementById("reg-email");
      const pwdInput = document.getElementById("reg-password");
      const confirmPwdInput = document.getElementById("reg-confirm-password");

      const name = nameInput ? nameInput.value.trim() : "";
      const customClassName = classNameInput ? classNameInput.value.trim() : "";
      const customClassCode = classCodeInput ? classCodeInput.value.trim().toUpperCase() : "";
      const school = schoolInput ? schoolInput.value.trim() : "";
      const email = emailInput ? emailInput.value.trim() : "";
      const pwd = pwdInput ? pwdInput.value : "";
      const confirmPwd = confirmPwdInput ? confirmPwdInput.value : "";

      if (!name || !email || !pwd) {
        state.error = "Lütfen tüm zorunlu alanları doldurun.";
        render();
        return;
      }
      if (pwd !== confirmPwd) {
        state.error = "Şifreler eşleşmiyor.";
        render();
        return;
      }
      if (pwd.length < 6) {
        state.error = "Şifre en az 6 karakter olmalıdır.";
        render();
        return;
      }

      state.status = "loading";
      state.error = "";
      render();

      try {
        const res = await postJson("/api/ogretmen-kayit", { isim: name, email, sifre: pwd, okul: school });
        state.isDemo = false;
        state.name = res.isim || name;
        state.classCode = customClassCode || res.sinifKodu || "KIV6A2";
        state.className = customClassName || (school ? `${school} Sınıfı` : "Yeni Sınıf");
        state.classes = [{ code: state.classCode, name: state.className }];
        state.topic = null;
        state.status = "idle";
        state.screen = "teacher-dashboard";
        loadQrCode();
      } catch (err) {
        state.status = "error";
        state.error = err instanceof Error ? err.message : "Kayıt sırasında hata oluştu.";
      }
      render();
      return;
    }

    // 3. Sınıf Adı Değiştirme
    if (e.target.id === "form-rename-class") {
      const input = document.getElementById("input-rename-class");
      const newName = input ? input.value.trim() : "";
      if (newName) {
        state.className = newName;
        state.classes = state.classes.map((c) => {
          const code = typeof c === "object" ? c.code : c;
          return code === state.classCode ? { code: code, name: newName } : (typeof c === "object" ? c : { code: c, name: `${c} Sınıfı` });
        });
        // Sınıf kodu ve sınıf ismi tamamen bağımsızdır; kod ASLA değişmez.
      }
      state.isRenaming = false;
      render();
      return;
    }

    // 4. Konu Kaydetme
    if (e.target.id === "form-add-topic") {
      const unit = document.getElementById("topic-unit").value.trim();
      const title = document.getElementById("topic-title").value.trim();
      const duration = parseInt(document.getElementById("topic-duration").value, 10) || 12;

      const newTopic = { unit, title, duration };
      state.topic = newTopic;
      if (typeof window !== "undefined") {
        localStorage.setItem(`kivilcim_topic_${state.classCode}`, JSON.stringify(newTopic));
      }
      state.screen = "teacher-dashboard";
      render();
      return;
    }
  });
}

// QR Kodunu Asenkron Yükle
async function loadQrCode() {
  state.qrUrl = "";
  state.qrError = false;
  const joinUrl = `${window.location.origin}/?sinif=${encodeURIComponent(state.classCode)}`;
  try {
    const url = await generateQr(joinUrl);
    state.qrUrl = url;
  } catch {
    state.qrError = true;
  }
  render();
}

// --- Uygulama Başlatma ---
document.addEventListener("DOMContentLoaded", () => {
  initEventListeners();
  render();
});

// Eğer DOMContentLoaded çoktan geçtiyse hemen render et
if (document.readyState === "interactive" || document.readyState === "complete") {
  initEventListeners();
  render();
}
