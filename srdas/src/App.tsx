import { FormEvent, ReactNode, useEffect, useState } from "react";
import QRCode from "qrcode";

type Screen =
  | "login"
  | "home"
  | "pretest"
  | "pretest-result"
  | "diagnosis"
  | "minutes"
  | "bridge"
  | "retest"
  | "summary"
  | "teacher-qr"
  | "teacher-dashboard"
  | "teacher-add-topic";

type Status = "idle" | "loading" | "error";

type Topic = {
  title: string;
  unit: string;
  duration: number;
};

type Question = {
  id: string;
  prompt: string;
  options: string[];
  correctAnswer?: string;
};

type QuestionPayload = Partial<Question> & {
  soruId?: string;
  soru?: string;
  siklar?: string[];
};

const DEMO_TOPIC: Topic = {
  title: "Kesirlerde toplama ve çıkarma",
  unit: "Matematik · 6. sınıf",
  duration: 12,
};

const PRETEST_QUESTIONS: Question[] = [
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

const RETEST_QUESTIONS: Question[] = [
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

function Icon({
  name,
  size = 20,
}: {
  name: "arrow" | "check" | "clock" | "play" | "spark" | "book" | "retry" | "user" | "edit";
  size?: number;
}) {
  const paths = {
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    check: <path d="m5 12 4 4L19 6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    play: <path d="m9 7 8 5-8 5V7Z" />,
    spark: <path d="m12 3 1.4 4.6L18 9l-4.6 1.4L12 15l-1.4-4.6L6 9l4.6-1.4L12 3Zm6 11 .7 2.3L21 17l-2.3.7L18 20l-.7-2.3L15 17l2.3-.7L18 14Z" />,
    book: (
      <>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" />
        <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" />
      </>
    ),
    retry: (
      <>
        <path d="M20 8V4l-2 2a8 8 0 1 0 1.1 10" />
        <path d="M20 4h-4" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="3" />
        <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
      </>
    ),
    edit: <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />,
  };
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      {paths[name]}
    </svg>
  );
}

function Brand() {
  return (
    <div className="brand">
      <div className="brand-mark"><span /><span /><span /></div>
      <span>kıvılcım</span>
    </div>
  );
}

function Shell({
  children,
  name,
  step,
  onLogout,
}: {
  children: ReactNode;
  name?: string;
  step?: string;
  onLogout?: () => void;
}) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Brand />
        {step && <span className="top-step">{step}</span>}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {name && (
            <div className="profile-pill">
              <span>{name.slice(0, 1).toLocaleUpperCase("tr-TR")}</span>
              {name}
            </div>
          )}
          {onLogout && (
            <button
              className="text-button"
              onClick={onLogout}
              style={{ fontSize: "13px", padding: "6px 10px", color: "var(--muted)" }}
              title="Çıkış yap"
              type="button"
            >
              Çıkış
            </button>
          )}
        </div>
      </header>
      <main className="page">{children}</main>
    </div>
  );
}

function PrimaryButton({
  children,
  disabled,
  onClick,
  type = "button",
  className = "",
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      className={`primary-button ${className}`}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {children}
      <Icon name="arrow" />
    </button>
  );
}

function FeedbackState({
  kind,
  title,
  detail,
  onRetry,
  onDemo,
}: {
  kind: "loading" | "error" | "empty";
  title: string;
  detail: string;
  onRetry?: () => void;
  onDemo?: () => void;
}) {
  return (
    <div className="feedback-card" role={kind === "error" ? "alert" : "status"}>
      <div className={`feedback-icon ${kind}`}>
        {kind === "loading" ? <span className="spinner" /> : <Icon name={kind === "error" ? "retry" : "book"} />}
      </div>
      <h2>{title}</h2>
      <p>{detail}</p>
      <div className="feedback-actions">
        {onRetry && <button className="secondary-button" onClick={onRetry}>Tekrar dene</button>}
        {onDemo && <button className="text-button" onClick={onDemo}>Demo verileriyle devam et</button>}
      </div>
    </div>
  );
}

function Login({
  onSubmit,
  onTeacherSubmit,
  status,
  error,
  onDemo,
  onTeacherDemo,
}: {
  onSubmit: (code: string, name: string) => void;
  onTeacherSubmit: (email: string, password: string) => void;
  status: Status;
  error: string;
  onDemo: () => void;
  onTeacherDemo: () => void;
}) {
  const [code, setCode] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("sinif")?.toUpperCase() ?? "";
  });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (role === "teacher") onTeacherSubmit(email.trim(), password);
    else onSubmit(code.trim(), name.trim());
  }

  return (
    <div className="login-layout">
      <section className="login-art">
        <Brand />
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
        <div className="art-copy">
          <div className="eyebrow light"><Icon name="spark" size={17} /> Sana özel öğrenme yolu</div>
          <h1>Anlamak bazen<br />tek bir <em>kıvılcıma</em> bakar.</h1>
          <p>Nerede takıldığını bulalım, sana en uygun anlatımla birlikte çözelim.</p>
        </div>
        <div className="floating-note note-one">12 dakikada konu tamam</div>
        <div className="floating-note note-two"><Icon name="check" size={15} /> Kişisel öğrenme planın</div>
      </section>
      <section className="login-panel">
        <div className="mobile-brand"><Brand /></div>
        <form className="login-card" onSubmit={submit}>
          <div className="role-switch" aria-label="Giriş türü">
            <button className={role === "student" ? "active" : ""} onClick={() => setRole("student")} type="button">Öğrenci</button>
            <button className={role === "teacher" ? "active" : ""} onClick={() => setRole("teacher")} type="button">Öğretmen</button>
          </div>
          <div className="eyebrow"><span className="eyebrow-dot" /> {role === "teacher" ? "Sınıfını başlat" : "Hemen başlayalım"}</div>
          <h2>Tekrar hoş geldin</h2>
          <p>{role === "teacher" ? "Bilgilerinle giriş yap, sınıfının QR kodunu oluştur." : "Sınıf kodunu ve adını gir, kaldığın yerden devam et."}</p>
          {status === "error" && (
            <div className="inline-error" role="alert">
              <strong>Bağlantı kurulamadı.</strong>
              <span>{error}</span>
            </div>
          )}
          {role === "student" ? (
            <>
              <label>
                Sınıf kodu
                <input
                  autoCapitalize="characters"
                  disabled={status === "loading"}
                  maxLength={8}
                  onChange={(event) => setCode(event.target.value.toUpperCase())}
                  placeholder="Örn. MAT6A"
                  required
                  value={code}
                />
              </label>
              <label>
                Adın
                <div className="input-with-icon">
                  <Icon name="user" />
                  <input
                    disabled={status === "loading"}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Adını yaz"
                    required
                    value={name}
                  />
                </div>
              </label>
            </>
          ) : (
            <>
              <label>
                E-posta adresi
                <input
                  autoComplete="email"
                  disabled={status === "loading"}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="ogretmen@okul.edu.tr"
                  required
                  type="email"
                  value={email}
                />
              </label>
              <label>
                Şifre
                <input
                  autoComplete="current-password"
                  disabled={status === "loading"}
                  minLength={4}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  required
                  type="password"
                  value={password}
                />
              </label>
            </>
          )}
          <PrimaryButton disabled={status === "loading"} type="submit">
            {status === "loading" ? <><span className="spinner small" /> Hazırlanıyor</> : role === "teacher" ? "QR kodu oluştur" : "Derse gir"}
          </PrimaryButton>
          <button
            className="text-button centered"
            onClick={role === "teacher" ? onTeacherDemo : onDemo}
            type="button"
            style={{ marginTop: "8px" }}
          >
            Demo verileriyle devam et
          </button>
          <small>{role === "teacher" ? "QR kodu yalnızca bu ders oturumu için oluşturulur." : "Giriş yaparak sınıfındaki öğrenme planına katılırsın."}</small>
        </form>
      </section>
    </div>
  );
}

function TeacherQr({
  name,
  classCode,
  onContinue,
}: {
  name: string;
  classCode: string;
  onContinue: () => void;
}) {
  const [qrUrl, setQrUrl] = useState("");
  const [qrError, setQrError] = useState(false);

  useEffect(() => {
    const joinUrl = `${window.location.origin}/?sinif=${encodeURIComponent(classCode)}`;
    QRCode.toDataURL(joinUrl, {
      width: 320,
      margin: 2,
      color: { dark: "#17352f", light: "#ffffff" },
      errorCorrectionLevel: "H",
    }).then(setQrUrl).catch(() => setQrError(true));
  }, [classCode]);

  return (
    <Shell name={name} step="Sınıf oturumu">
      <div className="teacher-qr-page">
        <section className="qr-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> Sınıfın hazır</div>
          <h1>Öğrencilerini<br />derse davet et.</h1>
          <p>QR kodu tahtaya yansıt. Öğrenciler kodu taradığında doğrudan bu sınıf oturumuna katılır.</p>
          <div className="qr-steps">
            <div><span>01</span><p><strong>QR kodu göster</strong><small>Öğrenciler telefonlarıyla tarasın.</small></p></div>
            <div><span>02</span><p><strong>Katılımları izle</strong><small>Panele geçen öğrencileri anlık gör.</small></p></div>
          </div>
        </section>
        <section className="qr-card">
          <div className="live-label"><i /> Oturum açık</div>
          <div className="qr-frame">
            {!qrUrl && !qrError && <span className="spinner" />}
            {qrError && <FeedbackState detail="QR kod şu anda üretilemedi. Sayfayı yenileyip tekrar deneyebilirsin." kind="error" title="QR kod hazırlanamadı" />}
            {qrUrl && <img alt={`${classCode} sınıfına katılım QR kodu`} src={qrUrl} />}
          </div>
          <p>Sınıf kodu</p>
          <strong className="class-code">{classCode}</strong>
          <small>QR çalışmazsa öğrenciler bu kodla da katılabilir.</small>
          <PrimaryButton disabled={!qrUrl} onClick={onContinue}>Öğretmen paneline geç</PrimaryButton>
        </section>
      </div>
    </Shell>
  );
}

function TeacherDashboard({
  name,
  classCode,
  classes,
  topic,
  onChangeClass,
  onRenameClass,
  onLogout,
  onAddTopic,
  onRemoveTopic,
  onShowQr,
}: {
  name: string;
  classCode: string;
  classes: string[];
  topic: Topic | null;
  onChangeClass: (newClassCode: string) => void;
  onRenameClass: (oldName: string, newName: string) => void;
  onLogout: () => void;
  onAddTopic: () => void;
  onRemoveTopic: () => void;
  onShowQr: () => void;
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [editName, setEditName] = useState("");
  const [insightOpen, setInsightOpen] = useState(false);
  
  const students = [
    { name: "Deniz A.", state: "Ön test", progress: 40 },
    { name: "Ece K.", state: "Öğreniyor", progress: 68 },
    { name: "Mert D.", state: "Tamamladı", progress: 100 },
    { name: "Selin Y.", state: "Teşhis", progress: 52 },
  ];
  return (
    <Shell name={name} step={`Sınıf ${classCode}`}>
      <div className="teacher-page">
        <div className="teacher-heading">
          <div>
            <div className="eyebrow"><span className="eyebrow-dot" /> Canlı sınıf görünümü</div>
            <h1>Günaydın, {name}.</h1>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "12px" }}>
              {isRenaming ? (
                <form 
                  onSubmit={(e) => { 
                    e.preventDefault(); 
                    onRenameClass(classCode, editName.trim()); 
                    setIsRenaming(false); 
                  }} 
                  style={{ display: "flex", gap: "8px", alignItems: "center" }}
                >
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--green)",
                      fontFamily: "inherit",
                      fontSize: "15px",
                      fontWeight: 700,
                      width: "160px",
                    }}
                    autoFocus
                  />
                  <button type="submit" className="text-button" style={{ padding: "4px 8px" }}>Kaydet</button>
                  <button type="button" className="text-button" onClick={() => setIsRenaming(false)} style={{ padding: "4px 8px", color: "var(--muted)" }}>İptal</button>
                </form>
              ) : (
                <>
                  <select 
                    value={classCode} 
                    onChange={(e) => onChangeClass(e.target.value)}
                    style={{
                      padding: "8px 32px 8px 16px",
                      borderRadius: "12px",
                      border: "1px solid var(--line)",
                      background: "#fff",
                      fontFamily: "inherit",
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "var(--ink)",
                      cursor: "pointer",
                      appearance: "none",
                      backgroundImage: "url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2212%22%20height%3D%228%22%20viewBox%3D%220%22%200%22%2012%22%208%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M1%201.5L6%206.5L11%201.5%22%20stroke%3D%22%2317352f%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 12px center",
                    }}
                  >
                    {!classes.includes(classCode) && <option value={classCode}>{classCode} Sınıfı</option>}
                    {classes.map(c => <option key={c} value={c}>{c} Sınıfı</option>)}
                  </select>
                  <button 
                    className="text-button" 
                    onClick={() => { setEditName(classCode); setIsRenaming(true); }} 
                    title="Sınıf Adını Değiştir" 
                    style={{ padding: "4px", display: "flex", alignItems: "center", gap: "6px" }}
                  >
                     <Icon name="edit" size={16} /> Düzenle
                  </button>
                  <p style={{ margin: 0, color: "var(--muted)" }}>öğrenme yolculuğunu buradan takip edebilirsin.</p>
                </>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <PrimaryButton onClick={onAddTopic}>Konu Ekle</PrimaryButton>
            <button className="secondary-button" onClick={onShowQr}>QR Kod</button>
            <button className="secondary-button" onClick={onLogout}>Çıkış</button>
          </div>
        </div>
        {topic ? (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            background: "var(--bg-card)",
            border: "1px solid var(--line)",
            borderRadius: "16px",
            marginBottom: "20px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <span style={{
                padding: "4px 10px",
                borderRadius: "8px",
                background: "var(--mint)",
                color: "var(--green)",
                fontSize: "12px",
                fontWeight: 700
              }}>Aktif Konu</span>
              <strong style={{ fontSize: "15px" }}>{topic.title}</strong>
              <span style={{ color: "var(--muted)", fontSize: "13px" }}>({topic.unit} · ~{topic.duration} dk)</span>
            </div>
            <button
              className="text-button"
              onClick={onRemoveTopic}
              style={{ color: "var(--coral)", padding: "4px 8px", fontSize: "13px" }}
              type="button"
            >
              Konuyu Kaldır
            </button>
          </div>
        ) : (
          <div style={{
            padding: "16px 20px",
            background: "var(--bg-card)",
            border: "1px dashed var(--line)",
            borderRadius: "16px",
            marginBottom: "20px",
            color: "var(--muted)",
            fontSize: "13px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <span>Bu sınıf için henüz atanmış bir ders konusu yok.</span>
            <button className="text-button" onClick={onAddTopic} style={{ padding: "4px 8px" }} type="button">
              + Yeni Konu Ata
            </button>
          </div>
        )}
        <div className="teacher-stats">
          <article><span>Katılan öğrenci</span><strong>24</strong><small>28 öğrenciden</small></article>
          <article><span>Konuyu tamamlayan</span><strong>17</strong><small className="positive">Son 10 dk. +6</small></article>
          <article><span>Ortak öğrenme eksiği</span><strong>%42</strong><small>Paydaları eşitleme</small></article>
        </div>
        <div className="dashboard-grid">
          <section className="student-table">
            <div className="section-heading"><div><p className="card-kicker">Canlı takip</p><h2>Öğrenci ilerlemesi</h2></div><span><i /> 24 çevrimiçi</span></div>
            <div className="table-head"><span>Öğrenci</span><span>Bulunduğu adım</span><span>İlerleme</span></div>
            {students.map((student) => (
              <div className="student-row" key={student.name}>
                <span className="student-name"><i>{student.name[0]}</i>{student.name}</span>
                <span><b className={`state-tag state-${student.progress}`}>{student.state}</b></span>
                <span className="mini-progress"><i><b style={{ width: `${student.progress}%` }} /></i><em>{student.progress}%</em></span>
              </div>
            ))}
          </section>
          <aside className="insight-panel">
            <div className="insight-icon"><Icon name="spark" /></div>
            <p className="card-kicker">Sınıf içgörüsü</p>
            <h2>12 öğrenci aynı adımda zorlanıyor.</h2>
            <p>Paydaları eşitleme konusunda sınıfa kısa bir hatırlatma yapabilirsin.</p>
            <button className="secondary-button" onClick={() => setInsightOpen(true)}>Detayı görüntüle <Icon name="arrow" size={17} /></button>
          </aside>
        </div>
      </div>

      {insightOpen && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", color: "var(--ink)" }} onClick={() => setInsightOpen(false)}>
          <div style={{ background: "var(--bg-card, #fff)", borderRadius: "24px", padding: "32px", width: "100%", maxWidth: "500px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "22px", margin: 0 }}>Zorlanılan Adım: Payda Eşitleme</h2>
              <button className="text-button" onClick={() => setInsightOpen(false)} style={{ padding: "8px" }}><Icon name="arrow" /></button>
            </div>
            <p style={{ color: "var(--muted)", marginBottom: "20px", fontSize: "14px", lineHeight: 1.6 }}>
              Aşağıdaki 12 öğrenci, farklı paydalı kesirleri toplarken paydaları eşitlemek yerine doğrudan toplamayı denedi.
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px", maxHeight: "300px", overflowY: "auto" }}>
              {["Deniz A.", "Ali K.", "Ayşe Y.", "Mehmet D.", "Zeynep T.", "Ahmet M.", "Elif E.", "Cem B.", "Burak G.", "Selin S.", "Mert Y.", "Doğa L."].map((name, i) => (
                <li key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", borderRadius: "12px", background: "var(--bg-input, #fafbf9)", fontSize: "14px", fontWeight: 600 }}>
                  <span>{name}</span>
                  <span style={{ color: "var(--coral)" }}>Soru {Math.floor(Math.random() * 3) + 3}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Shell>
  );
}

function Home({
  name,
  topic,
  streak = 0,
  onStart,
  onDemo,
  onLogout,
}: {
  name: string;
  topic: Topic | null;
  streak?: number;
  onStart: () => void;
  onDemo?: () => void;
  onLogout?: () => void;
}) {
  return (
    <Shell name={name} onLogout={onLogout}>
      <div className="home-hero">
        <div>
          <div className="eyebrow"><span className="eyebrow-dot" /> Bugünün çalışma planı</div>
          <h1>Merhaba, {name}.</h1>
          <p>Bugün küçük bir adımla büyük bir fark yaratabiliriz.</p>
        </div>
        <div className="streak-card"><span>{streak}</span><small>günlük seri</small></div>
      </div>
      {!topic ? (
        <FeedbackState
          detail="Öğretmenin henüz yeni bir konu atamadı. Daha sonra tekrar kontrol et."
          kind="empty"
          title="Sıradaki konu henüz hazır değil"
          onDemo={onDemo}
        />
      ) : (
        <section className="topic-card">
          <div className="topic-visual">
            <div className="fraction-shape"><span>1</span><i /><span>2</span></div>
            <div className="fraction-shape second"><span>1</span><i /><span>3</span></div>
          </div>
          <div className="topic-content">
            <div className="card-kicker"><Icon name="book" size={18} /> Sıradaki konu</div>
            <p className="unit">{topic.unit}</p>
            <h2>{topic.title}</h2>
            <div className="meta"><span><Icon name="clock" size={17} /> Yaklaşık {topic.duration} dakika</span><span>5 kısa soru</span></div>
            <PrimaryButton onClick={onStart}>Hazır mısın?</PrimaryButton>
          </div>
        </section>
      )}
      <div className="encouragement"><Icon name="spark" /><span><strong>Küçük bir hatırlatma:</strong> Bilmediğin sorularda “Bilmiyorum” demen, sana daha iyi yardımcı olmamızı sağlar.</span></div>
    </Shell>
  );
}

function Progress({ current, total, label }: { current: number; total: number; label: string }) {
  return (
    <div className="progress-wrap">
      <div className="progress-copy"><span>{label}</span><strong>{current}/{total}</strong></div>
      <div className="progress-track"><span style={{ width: `${(current / total) * 100}%` }} /></div>
    </div>
  );
}

function Quiz({
  mode,
  name,
  questions,
  index,
  selected,
  status,
  onSelect,
  onNext,
  onRetry,
  onDemo,
}: {
  mode: "Ön test" | "Tekrar testi";
  name: string;
  questions: Question[];
  index: number;
  selected: string;
  status: Status;
  onSelect: (value: string) => void;
  onNext: () => void;
  onRetry: () => void;
  onDemo?: () => void;
}) {
  const question = questions[index];
  return (
    <Shell name={name} step={mode}>
      <div className="quiz-page">
        <Progress current={index + 1} label={mode} total={questions.length} />
        {status === "error" ? (
          <FeedbackState
            detail="Cevabın kaydedilemedi. İnternet bağlantını kontrol edip yeniden deneyebilirsin."
            kind="error"
            onDemo={onDemo}
            onRetry={onRetry}
            title="Bir şeyler ters gitti"
          />
        ) : !question ? (
          <FeedbackState detail="Bu test için henüz bir soru bulunmuyor." kind="empty" title="Sorular hazırlanıyor" />
        ) : (
          <section className="question-card">
            <div className="question-number">Soru {index + 1}</div>
            <h1>{question.prompt}</h1>
            <div className="options">
              {question.options.map((option, optionIndex) => (
                <button
                  className={selected === option ? "option selected" : "option"}
                  disabled={status === "loading"}
                  key={option}
                  onClick={() => onSelect(option)}
                >
                  <span>{String.fromCharCode(65 + optionIndex)}</span>{option}
                  {selected === option && <Icon name="check" />}
                </button>
              ))}
              {mode === "Ön test" && (
                <button
                  className={selected === "Bilmiyorum" ? "option unknown selected" : "option unknown"}
                  disabled={status === "loading"}
                  onClick={() => onSelect("Bilmiyorum")}
                >
                  <span>?</span>Bilmiyorum
                  {selected === "Bilmiyorum" && <Icon name="check" />}
                </button>
              )}
            </div>
            <div className="quiz-actions">
              <p>Cevabından emin olmasan da sorun değil.</p>
              <PrimaryButton disabled={!selected || status === "loading"} onClick={onNext}>
                {status === "loading" ? <><span className="spinner small" /> Gönderiliyor</> : index + 1 === questions.length ? "Testi tamamla" : "Sonraki soru"}
              </PrimaryButton>
            </div>
          </section>
        )}
      </div>
    </Shell>
  );
}

function PretestResult({
  name,
  questions,
  answers,
  onContinue,
}: {
  name: string;
  questions: Question[];
  answers: Record<string, string>;
  onContinue: () => void;
}) {
  const correctCount = questions.filter(
    (question) => question.correctAnswer && answers[question.id] === question.correctAnswer,
  ).length;
  return (
    <Shell name={name} step="Ön test sonucu">
      <div className="result-page">
        <section className="result-hero">
          <div
            className="result-ring"
            style={{ background: `conic-gradient(var(--green) 0 ${(correctCount / 5) * 100}%, #dfe9e3 ${(correctCount / 5) * 100}% 100%)` }}
          >
            <strong>{correctCount}<small>/5</small></strong>
            <span>doğru cevap</span>
          </div>
          <div>
            <div className="eyebrow"><span className="eyebrow-dot" /> Ön test tamamlandı</div>
            <h1>Nasıl yardımcı olacağımızı bulduk.</h1>
            <p>Bu bir not değil; sana en kısa öğrenme yolunu hazırlamak için kullandığımız küçük bir yol haritası.</p>
          </div>
        </section>
        <section className="answer-review">
          <div className="section-heading">
            <div><p className="card-kicker">5 sorunun özeti</p><h2>Cevapların</h2></div>
            <span className="result-note">Sonuç kaydedildi</span>
          </div>
          <div className="review-list">
            {questions.map((question, index) => {
              const answer = answers[question.id] || "Bilmiyorum";
              const isCorrect = answer === question.correctAnswer;
              return (
                <div className="review-row" key={question.id}>
                  <span className={`review-status ${isCorrect ? "correct" : "needs-work"}`}>
                    {isCorrect ? <Icon name="check" /> : index + 1}
                  </span>
                  <div>
                    <small>Soru {index + 1}</small>
                    <strong>{question.prompt}</strong>
                  </div>
                  <span className={isCorrect ? "answer-correct" : "answer-missed"}>
                    {answer}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
        <div className="result-action">
          <p><Icon name="spark" /> Bir sonraki adımda yalnızca eksik kalan noktaya odaklanacağız.</p>
          <PrimaryButton onClick={onContinue}>Eksik alanımı göster</PrimaryButton>
        </div>
      </div>
    </Shell>
  );
}

function Diagnosis({ name, onContinue }: { name: string; onContinue: () => void }) {
  return (
    <Shell name={name} step="Teşhis">
      <div className="center-page">
        <div className="success-orbit"><div><Icon name="spark" size={34} /></div></div>
        <div className="eyebrow"><span className="eyebrow-dot" /> Tam olarak bulduk</div>
        <h1>Eksik olan küçük bir bağlantı.</h1>
        <p className="lead">Kesirleri toplarken <strong>paydaları eşitleme</strong> adımında desteğe ihtiyacın var.</p>
        <section className="diagnosis-card">
          <div className="diagnosis-row">
            <span className="status-icon okay"><Icon name="check" /></span>
            <div><small>Gayet iyi</small><strong>Kesrin pay ve paydasını tanıyorsun</strong></div>
          </div>
          <div className="diagnosis-line" />
          <div className="diagnosis-row">
            <span className="status-icon focus"><Icon name="spark" /></span>
            <div><small>Birlikte tamamlayacağız</small><strong>Farklı paydaları eşitleme</strong></div>
          </div>
        </section>
        <p className="microcopy">Sana özel seçtiğimiz 4 dakikalık anlatımla bu boşluğu kapatalım.</p>
        <PrimaryButton onClick={onContinue}>Dakikalarımı göster</PrimaryButton>
      </div>
    </Shell>
  );
}

function Minutes({
  name,
  onWatched,
  onBridge,
}: {
  name: string;
  onWatched: () => void;
  onBridge: () => void;
}) {
  const [channelId, setChannelId] = useState(CHANNELS[0].id);
  const channel = CHANNELS.find((item) => item.id === channelId) ?? CHANNELS[0];
  return (
    <Shell name={name} step="Öğrenme dakikaları">
      <div className="video-page">
        <div className="video-heading">
          <div><div className="eyebrow"><span className="eyebrow-dot" /> Sana özel 4 dakika</div><h1>Paydaları birlikte eşitleyelim.</h1></div>
          <button className="bridge-link" onClick={onBridge}><Icon name="spark" /> Bir benzetmeyle anlat</button>
        </div>
        <div className="learning-grid">
          <section>
            <div className="video-frame">
              <iframe
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                src={`https://www.youtube.com/embed/${channel.videoId}?start=52&end=292&rel=0`}
                title={`${channel.name} — Paydaları eşitleme`}
              />
            </div>
            <details className="transcript">
              <summary>Video transkriptini aç <span>4:00</span></summary>
              <div>
                <p><time>00:52</time> Farklı paydalı kesirleri toplamak için önce parçaların aynı büyüklükte olmasını sağlamalıyız.</p>
                <p><time>01:34</time> Bunun için paydaların ortak katını buluyor ve kesirleri genişletiyoruz.</p>
                <p><time>02:48</time> Paydalar eşitlendiğinde artık yalnızca payları toplayabiliriz.</p>
              </div>
            </details>
          </section>
          <aside className="channel-panel">
            <p className="card-kicker">Anlatıcını seç</p>
            <h2>Hangisi sana daha uygun?</h2>
            <div className="channel-list">
              {CHANNELS.map((item, index) => (
                <button className={channelId === item.id ? "channel active" : "channel"} key={item.id} onClick={() => setChannelId(item.id)}>
                  <span className="channel-avatar">{index + 1}</span>
                  <span><strong>{item.name}</strong><small>{item.detail}</small></span>
                  <i>{channelId === item.id && <span />}</i>
                </button>
              ))}
            </div>
            <div className="tip"><Icon name="play" /><span>Videoyu kendi hızında izleyebilir, anlamadığın yerde geri sarabilirsin.</span></div>
            <PrimaryButton onClick={onWatched}>İzledim</PrimaryButton>
          </aside>
        </div>
      </div>
    </Shell>
  );
}

function Bridge({ name, onBack }: { name: string; onBack: () => void }) {
  const [interest, setInterest] = useState("");
  const analogies: Record<string, string> = {
    Basketbol: "Bir yarım saha ile iki çeyrek saha aynı alanı anlatır. Kesirlerde de toplama yapmadan önce saha çizgilerini, yani paydaları, aynı ölçüye getiririz.",
    Müzik: "Bir yarım nota, iki çeyrek nota kadar sürer. Ritimleri toplarken vuruş birimlerini eşitlemek, kesirlerin paydalarını eşitlemeye benzer.",
    Oyunlar: "Farklı büyüklükteki enerji barlarını toplamak için önce ikisini de aynı dilimlere bölersin. İşte bu, ortak payda bulmaktır.",
    Mutfak: "Yarım bardak ile çeyrek bardağı toplarken ikisini de çeyrek ölçüyle düşünürüz: iki çeyrek artı bir çeyrek.",
  };
  return (
    <Shell name={name} step="Bilişsel köprü">
      <div className="bridge-page">
        <div className="bridge-intro">
          <div className="eyebrow"><Icon name="spark" size={17} /> Başka bir yoldan bakalım</div>
          <h1>Bir ilgi alanı seç.</h1>
          <p>Konuyu zaten bildiğin bir dünyaya bağlayalım.</p>
        </div>
        <div className="interest-list">
          {INTERESTS.map((item, index) => (
            <button className={interest === item ? "interest active" : "interest"} key={item} onClick={() => setInterest(item)}>
              <span>0{index + 1}</span>{item}<Icon name="arrow" />
            </button>
          ))}
        </div>
        {!interest ? (
          <FeedbackState detail="Benzetmeni oluşturmak için yukarıdan sana yakın gelen bir alan seç." kind="empty" title="Seçimini bekliyoruz" />
        ) : (
          <section className="analogy-card">
            <div className="analogy-label"><Icon name="spark" /> {interest} ile düşünelim</div>
            <blockquote>“{analogies[interest]}”</blockquote>
            <div className="analogy-equation"><span>1/2</span><b>=</b><span>2/4</span><b>+</b><span>1/4</span><b>=</b><strong>3/4</strong></div>
            <PrimaryButton onClick={onBack}>Şimdi videoya dön</PrimaryButton>
          </section>
        )}
      </div>
    </Shell>
  );
}

function TeacherAddTopic({
  name,
  onCancel,
  onSave,
}: {
  name: string;
  onCancel: () => void;
  onSave: (topic: Topic) => void;
}) {
  const [title, setTitle] = useState("");
  const [unit, setUnit] = useState("");
  const [duration, setDuration] = useState(12);
  const [status, setStatus] = useState<Status>("idle");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setTimeout(() => {
      setStatus("idle");
      onSave({ title, unit, duration });
    }, 600);
  }

  return (
    <Shell name={name} step="Yeni Konu Ekle">
      <div className="teacher-page">
        <div className="teacher-heading">
          <div>
            <div className="eyebrow"><span className="eyebrow-dot" /> Ders İçeriği</div>
            <h1>Yeni Konu Ekle</h1>
            <p>Sınıfın için yeni bir öğrenme konusu belirle.</p>
          </div>
        </div>
        <div className="dashboard-grid" style={{ gridTemplateColumns: "1fr" }}>
          <section className="login-card" style={{ maxWidth: "540px", width: "100%", margin: "0 auto", padding: "40px", backgroundColor: "var(--bg-card)", borderRadius: "24px", border: "1px solid var(--line)", boxShadow: "0 14px 45px rgba(34,64,56,.05)" }}>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>
              <label>
                Ders / Ünite
                <input
                  disabled={status === "loading"}
                  onChange={(event) => setUnit(event.target.value)}
                  placeholder="Örn. Matematik · 6. sınıf"
                  required
                  value={unit}
                />
              </label>
              <label>
                Konu Başlığı
                <input
                  disabled={status === "loading"}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Örn. Kesirlerde toplama ve çıkarma"
                  required
                  value={title}
                />
              </label>
              <label>
                Tahmini Süre (dakika)
                <input
                  disabled={status === "loading"}
                  max={120}
                  min={1}
                  onChange={(event) => setDuration(parseInt(event.target.value, 10) || 10)}
                  required
                  type="number"
                  value={duration}
                />
              </label>
              <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                <PrimaryButton disabled={status === "loading"} type="submit">
                  {status === "loading" ? <><span className="spinner small" /> Kaydediliyor</> : "Konuyu Kaydet"}
                </PrimaryButton>
                <button className="text-button centered" disabled={status === "loading"} onClick={onCancel} type="button">
                  İptal
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </Shell>
  );
}

function Summary({ name, onRestart }: { name: string; onRestart: () => void }) {
  return (
    <Shell name={name}>
      <div className="summary-page">
        <div className="confetti c1" /><div className="confetti c2" /><div className="confetti c3" /><div className="confetti c4" />
        <div className="summary-check"><Icon name="check" size={42} /></div>
        <div className="eyebrow"><span className="eyebrow-dot" /> Konu tamamlandı</div>
        <h1>Hazırsın, {name}.</h1>
        <p>Eksik parçayı yerine koydun. Şimdi kesirlerde toplama ve çıkarma çok daha net.</p>
        <section className="time-earned">
          <div><Icon name="clock" size={28} /></div>
          <span><small>Kazandığın süre</small><strong>8 dakika</strong></span>
          <i>Bugünkü hedefin tamamlandı</i>
        </section>
        <div className="summary-stats">
          <div><strong>2/2</strong><span>Tekrar testi</span></div>
          <div><strong>1</strong><span>Kapatılan eksik</span></div>
          <div><strong>4 dk</strong><span>Öğrenme süresi</span></div>
        </div>
        <button className="secondary-button restart" onClick={onRestart}><Icon name="retry" /> Ana sayfaya dön</button>
      </div>
    </Shell>
  );
}

function mockApi<T>(url: string, body: unknown): T {
  if (url === "/api/giris") {
    const payload = body as { sinifKodu?: string; isim?: string };
    if (!payload.sinifKodu || !payload.isim) throw new Error("Sınıf kodu ve isim gerekli.");
    let activeTopic: Topic | null = null;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`kivilcim_topic_${payload.sinifKodu}`) || localStorage.getItem("kivilcim_custom_topic");
      if (stored) {
        try {
          activeTopic = JSON.parse(stored);
        } catch {
          activeTopic = null;
        }
      }
    }
    return { konu: activeTopic } as T;
  }

  if (url === "/api/ogretmen-giris") {
    const payload = body as { email?: string; sifre?: string };
    if (!payload.email || !payload.sifre) throw new Error("E-posta ve şifre gerekli.");
    return {
      isim: payload.email.split("@")[0] || "Öğretmen",
      sinifKodu: "KIV6A2",
    } as T;
  }

  if (url === "/api/cevap") {
    return { tamamlandi: false } as T;
  }

  throw new Error("Bu işlem için yerel demo bulunmuyor.");
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`Sunucu ${response.status} yanıtını verdi.`);
    return response.json() as Promise<T>;
  } catch (error) {
    // Figma çıktısı backend olmadan da çalışabilsin. Gerçek API bağlandığında
    // başarılı fetch yanıtı otomatik olarak bu yerel fallback'in önüne geçer.
    if (import.meta.env.DEV || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      await new Promise((resolve) => window.setTimeout(resolve, 250));
      return mockApi<T>(url, body);
    }
    throw error;
  }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [name, setName] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [topic, setTopic] = useState<Topic | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [lastAnswer, setLastAnswer] = useState("");
  const [retestIndex, setRetestIndex] = useState(0);
  const [pretestQuestions, setPretestQuestions] = useState(PRETEST_QUESTIONS);
  const [classCode, setClassCode] = useState("KIV6A2");
  const [classes, setClasses] = useState(["KIV6A2", "KIV6B1", "KIV7A1", "MAT8C"]);
  const [pretestAnswers, setPretestAnswers] = useState<Record<string, string>>({});

  function handleRenameClass(oldName: string, newName: string) {
    if (!newName || newName === oldName) return;
    setClasses(prev => prev.map(c => c === oldName ? newName : c));
    if (classCode === oldName) setClassCode(newName);
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [screen]);

  useEffect(() => {
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [theme]);

  async function login(code: string, studentName: string) {
    setStatus("loading");
    setError("");
    try {
      const result = await postJson<{ konu?: Topic | null; topic?: Topic | null }>("/api/giris", {
        sinifKodu: code,
        isim: studentName,
      });
      const received = result.konu ?? result.topic ?? null;
      setName(studentName);
      setTopic(received);
      setScreen("home");
      setStatus("idle");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Bilinmeyen bir bağlantı hatası oluştu.");
      setStatus("error");
    }
  }

  function useDemo() {
    setName(name || "Deniz");
    setTopic(DEMO_TOPIC);
    setStatus("idle");
    setScreen("home");
  }

  async function teacherLogin(email: string, password: string) {
    setStatus("loading");
    setError("");
    try {
      const result = await postJson<{
        isim?: string;
        name?: string;
        sinifKodu?: string;
        classCode?: string;
      }>("/api/ogretmen-giris", { email, sifre: password });
      setName(result.isim ?? result.name ?? email.split("@")[0]);
      setClassCode(result.sinifKodu ?? result.classCode ?? "KIV6A2");
      setStatus("idle");
      setScreen("teacher-qr");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Bilinmeyen bir bağlantı hatası oluştu.");
      setStatus("error");
    }
  }

  function useTeacherDemo() {
    setName("Ayşe Öğretmen");
    setClassCode("KIV6A2");
    setStatus("idle");
    setScreen("teacher-qr");
  }

  async function answerPretest() {
    setStatus("loading");
    setLastAnswer(selected);
    setPretestAnswers((answers) => ({
      ...answers,
      [pretestQuestions[questionIndex].id]: selected,
    }));
    try {
      const result = await postJson<{
        sonrakiSoru?: QuestionPayload;
        nextQuestion?: QuestionPayload;
        tamamlandi?: boolean;
        completed?: boolean;
      }>("/api/cevap", {
        soruId: pretestQuestions[questionIndex].id,
        cevap: selected === "Bilmiyorum" ? null : selected,
        bilmiyorum: selected === "Bilmiyorum",
      });
      const next = result.sonrakiSoru ?? result.nextQuestion;
      if (result.tamamlandi || result.completed) {
        setStatus("idle");
        setSelected("");
        setScreen("pretest-result");
        return;
      }
      if (next) {
        const normalized: Question = {
          id: next.id ?? next.soruId ?? `q${questionIndex + 2}`,
          prompt: next.prompt ?? next.soru ?? "",
          options: next.options ?? next.siklar ?? [],
        };
        setPretestQuestions((questions) =>
          questions.map((question, index) => index === questionIndex + 1 ? normalized : question),
        );
      }
      advancePretest();
    } catch {
      setStatus("error");
    }
  }

  function advancePretest() {
    setStatus("idle");
    setSelected("");
    if (questionIndex === pretestQuestions.length - 1) setScreen("pretest-result");
    else setQuestionIndex((value) => value + 1);
  }

  function answerRetest() {
    if (retestIndex === RETEST_QUESTIONS.length - 1) {
      setScreen("summary");
    } else {
      setRetestIndex((value) => value + 1);
      setSelected("");
    }
  }

  return (
    <>
      <button
        onClick={() => setTheme(t => t === "light" ? "dark" : "light")}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          background: "var(--green)",
          color: "#fff",
          border: "none",
          boxShadow: "0 8px 16px rgba(23,108,88,0.3)",
          fontSize: "20px",
          cursor: "pointer",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "0.2s"
        }}
        title="Temayı Değiştir"
      >
        {theme === "light" ? "🌙" : "☀️"}
      </button>

      {screen === "login" && <Login error={error} onDemo={useDemo} onSubmit={login} onTeacherDemo={useTeacherDemo} onTeacherSubmit={teacherLogin} status={status} />}
      {screen === "teacher-qr" && <TeacherQr classCode={classCode} name={name} onContinue={() => setScreen("teacher-dashboard")} />}
      {screen === "teacher-dashboard" && (
        <TeacherDashboard
          classCode={classCode}
          classes={classes}
          name={name}
          topic={topic}
          onChangeClass={(newCode) => {
            setClassCode(newCode);
            if (typeof window !== "undefined") {
              const saved = localStorage.getItem(`kivilcim_topic_${newCode}`);
              setTopic(saved ? JSON.parse(saved) : null);
            }
          }}
          onRenameClass={handleRenameClass}
          onAddTopic={() => setScreen("teacher-add-topic")}
          onRemoveTopic={() => {
            setTopic(null);
            if (typeof window !== "undefined") {
              localStorage.removeItem(`kivilcim_topic_${classCode}`);
              localStorage.removeItem("kivilcim_custom_topic");
            }
          }}
          onShowQr={() => setScreen("teacher-qr")}
          onLogout={() => { setStatus("idle"); setScreen("login"); }}
        />
      )}
      {screen === "teacher-add-topic" && (
        <TeacherAddTopic
          name={name}
          onCancel={() => setScreen("teacher-dashboard")}
          onSave={(newTopic) => {
            setTopic(newTopic);
            if (typeof window !== "undefined") {
              localStorage.setItem(`kivilcim_topic_${classCode}`, JSON.stringify(newTopic));
              localStorage.setItem("kivilcim_custom_topic", JSON.stringify(newTopic));
            }
            setScreen("teacher-dashboard");
          }}
        />
      )}
      {screen === "home" && (
        <Home
          name={name}
          onStart={() => { setQuestionIndex(0); setPretestAnswers({}); setSelected(""); setScreen("pretest"); }}
          topic={topic}
          onDemo={useDemo}
          onLogout={() => { setStatus("idle"); setScreen("login"); }}
        />
      )}
      {screen === "pretest" && <Quiz index={questionIndex} mode="Ön test" name={name} onDemo={advancePretest} onNext={answerPretest} onRetry={() => { setStatus("idle"); setSelected(lastAnswer); }} onSelect={setSelected} questions={pretestQuestions} selected={selected} status={status} />}
      {screen === "pretest-result" && <PretestResult answers={pretestAnswers} name={name} onContinue={() => setScreen("diagnosis")} questions={pretestQuestions} />}
      {screen === "diagnosis" && <Diagnosis name={name} onContinue={() => setScreen("minutes")} />}
      {screen === "minutes" && <Minutes name={name} onBridge={() => setScreen("bridge")} onWatched={() => { setRetestIndex(0); setSelected(""); setScreen("retest"); }} />}
      {screen === "bridge" && <Bridge name={name} onBack={() => setScreen("minutes")} />}
      {screen === "retest" && <Quiz index={retestIndex} mode="Tekrar testi" name={name} onNext={answerRetest} onRetry={() => setStatus("idle")} onSelect={setSelected} questions={RETEST_QUESTIONS} selected={selected} status="idle" />}
      {screen === "summary" && <Summary name={name} onRestart={() => setScreen("home")} />}
    </>
  );
}
