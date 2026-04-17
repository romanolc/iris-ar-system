import { useState, useEffect, useRef, useCallback } from "react";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const SCREENS = {
  SPLASH: "splash",
  REGISTER: "register",
  PIN_SETUP: "pin_setup",
  IRIS_SETUP: "iris_setup",
  HOME: "home",
  DEVICE_LIST: "device_list",
  CONNECT_DEVICE: "connect_device",
  AUTH_PIN: "auth_pin",
  AUTH_TOKEN: "auth_token",
  AUTH_IRIS: "auth_iris",
  HUD: "hud",
};

const DEVICES = [
  { id: "CS-AR-001", name: "CtrlSec AR-1", status: "available", battery: 87, signal: 92 },
  { id: "CS-AR-002", name: "CtrlSec AR-2", status: "in_use", user: "A. Santos", battery: 43, signal: 78 },
  { id: "CS-AR-003", name: "CtrlSec AR-3", status: "available", battery: 100, signal: 95 },
];

const AI_RESPONSES = {
  "mostrar dados da plataforma": {
    sensitive: false,
    response: "Plataforma operacional. 3 usuários ativos, uptime 99.8%, último acesso 14:32.",
  },
  "relatórios financeiros": {
    sensitive: true,
    response: "⚠ Dados sensíveis detectados — Acesso restrito. Requer autorização nível 3.",
  },
  "mostrar cpf": {
    sensitive: true,
    response: "🚫 Dados pessoais bloqueados pelo DLP. CPF mascarado: ***.***.***-**",
  },
  "status do sistema": {
    sensitive: false,
    response: "Sistema I.R.I.S v2.4.1 — Todos os módulos ativos. DLP: ON | Auth: ON | IA: ONLINE",
  },
  "abrir sistema": {
    sensitive: false,
    response: "Sistema I.R.I.S inicializado. Bem-vindo, usuário autenticado.",
  },
  default: {
    sensitive: false,
    response: "Comando processado. Como posso ajudar com mais detalhes?",
  },
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function generateToken() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getAiResponse(input) {
  const lower = input.toLowerCase();
  for (const key of Object.keys(AI_RESPONSES)) {
    if (key !== "default" && lower.includes(key)) return AI_RESPONSES[key];
  }
  return AI_RESPONSES.default;
}

// ─── SVG LOGO ────────────────────────────────────────────────────────────────

function IrisLogo({ size = 64, glow = true }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={glow ? { filter: "drop-shadow(0 0 12px #00e5ff88)" } : {}}>
      <ellipse cx="50" cy="50" rx="46" ry="28" stroke="#00e5ff" strokeWidth="3" fill="none" />
      <ellipse cx="50" cy="50" rx="46" ry="28" stroke="#00e5ff" strokeWidth="1" fill="none" opacity="0.3" />
      {/* iris gear */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        const x = 50 + 20 * Math.cos(angle);
        const y = 50 + 20 * Math.sin(angle);
        return <circle key={i} cx={x} cy={y} r="2.5" fill="#00e5ff" opacity="0.8" />;
      })}
      <circle cx="50" cy="50" r="16" stroke="#00e5ff" strokeWidth="2" fill="none" />
      <circle cx="50" cy="50" r="8" fill="#00e5ff" opacity="0.6" />
      <circle cx="50" cy="50" r="4" fill="#00e5ff" />
      {/* connecting lines */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        const x = 50 + 20 * Math.cos(angle);
        const y = 50 + 20 * Math.sin(angle);
        return <line key={i} x1="50" y1="50" x2={x} y2={y} stroke="#00e5ff" strokeWidth="0.5" opacity="0.4" />;
      })}
    </svg>
  );
}

// ─── GLASSES SVG ─────────────────────────────────────────────────────────────

function GlassesSVG({ animate = false }) {
  return (
    <div style={{
      width: "100%", maxWidth: 320, margin: "0 auto",
      filter: animate ? "drop-shadow(0 0 20px #00e5ff66)" : "drop-shadow(0 4px 24px #0008)",
      transition: "all 0.5s ease",
    }}>
      <svg viewBox="0 0 320 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Frame */}
        <rect x="10" y="30" width="300" height="70" rx="14" fill="#1a1a1a" />
        {/* Left lens */}
        <rect x="20" y="38" width="130" height="54" rx="8" fill="#0a0f1a" stroke="#00e5ff" strokeWidth={animate ? "1.5" : "0.5"} opacity="0.9" />
        {/* Right lens */}
        <rect x="168" y="38" width="130" height="54" rx="8" fill="#0a0f1a" stroke="#00e5ff" strokeWidth={animate ? "1.5" : "0.5"} opacity="0.9" />
        {/* Bridge */}
        <rect x="148" y="52" width="24" height="16" rx="4" fill="#222" />
        {/* Left arm */}
        <path d="M10 55 Q0 60 0 80 L0 110" stroke="#1a1a1a" strokeWidth="12" strokeLinecap="round" />
        {/* Right arm */}
        <path d="M310 55 Q320 60 320 80 L320 110" stroke="#1a1a1a" strokeWidth="12" strokeLinecap="round" />
        {/* Camera */}
        <circle cx="90" cy="34" r="6" fill="#111" stroke="#333" strokeWidth="1" />
        <circle cx="90" cy="34" r="3" fill="#0a0a0a" />
        {/* Sensor */}
        <circle cx="240" cy="34" r="4" fill="#ff3d00" opacity="0.8" />
        {/* Ctrl Sec text */}
        <text x="168" y="28" fill="#00e5ff" fontSize="8" fontFamily="monospace" opacity="0.7">CtrlSec</text>
        {/* HUD overlay when animate */}
        {animate && (
          <>
            <rect x="25" y="43" width="120" height="44" rx="6" fill="#00e5ff" fillOpacity="0.05" />
            <line x1="25" y1="65" x2="145" y2="65" stroke="#00e5ff" strokeWidth="0.5" opacity="0.4" strokeDasharray="4,4" />
            <circle cx="85" cy="58" r="12" stroke="#00e5ff" strokeWidth="0.8" fill="none" opacity="0.6" />
            <circle cx="85" cy="58" r="8" stroke="#00e5ff" strokeWidth="0.5" fill="none" opacity="0.4" />
          </>
        )}
      </svg>
    </div>
  );
}

// ─── SCAN ANIMATION ──────────────────────────────────────────────────────────

function IrisScan({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("scanning");

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(timer);
          setPhase("confirmed");
          setTimeout(onComplete, 1200);
          return 100;
        }
        return p + 2;
      });
    }, 50);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
      <div style={{ position: "relative", width: 180, height: 180 }}>
        {/* Outer ring */}
        <svg width="180" height="180" style={{ position: "absolute", top: 0, left: 0 }}>
          <circle cx="90" cy="90" r="80" stroke="#0a2040" strokeWidth="3" fill="none" />
          <circle cx="90" cy="90" r="80" stroke="#00e5ff" strokeWidth="3" fill="none"
            strokeDasharray={`${(progress / 100) * 502} 502`}
            strokeLinecap="round" transform="rotate(-90 90 90)"
            style={{ transition: "stroke-dasharray 0.1s" }} />
          {/* Scan line */}
          <line x1="10" y1="90" x2="170" y2="90" stroke="#00e5ff" strokeWidth="1" opacity="0.3" strokeDasharray="4,6" />
          {Array.from({ length: 8 }).map((_, i) => (
            <circle key={i} cx={90 + 60 * Math.cos((i * 45 * Math.PI) / 180)}
              cy={90 + 60 * Math.sin((i * 45 * Math.PI) / 180)}
              r="3" fill="#00e5ff" opacity={progress > i * 12.5 ? "0.8" : "0.2"} />
          ))}
        </svg>
        {/* Eye center */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          width: 90, height: 90,
        }}>
          <IrisLogo size={90} glow={progress > 50} />
        </div>
        {/* Scan overlay line */}
        <div style={{
          position: "absolute", left: 20, right: 20,
          top: `${(progress * 0.8 + 10)}%`,
          height: 2,
          background: "linear-gradient(90deg, transparent, #00e5ff, transparent)",
          transition: "top 0.1s",
        }} />
      </div>

      <div style={{ textAlign: "center" }}>
        <p style={{ color: phase === "confirmed" ? "#00ff88" : "#00e5ff", fontSize: 14, letterSpacing: 3, margin: 0, fontFamily: "monospace" }}>
          {phase === "confirmed" ? "✓ IDENTIDADE CONFIRMADA" : "ESCANEANDO ÍRIS..."}
        </p>
        <div style={{ marginTop: 8, width: 200, height: 4, background: "#0a2040", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: "100%", background: phase === "confirmed" ? "#00ff88" : "#00e5ff", transition: "all 0.1s", borderRadius: 2 }} />
        </div>
        <p style={{ color: "#4a6080", fontSize: 11, marginTop: 6, fontFamily: "monospace" }}>{progress}%</p>
      </div>
    </div>
  );
}

// ─── HUD INTERFACE ───────────────────────────────────────────────────────────

function HUDInterface({ user, device, onLogout }) {
  const [time, setTime] = useState(new Date());
  const [messages, setMessages] = useState([
    { from: "iris", text: "Sistema I.R.I.S ativo. Como posso ajudar?", type: "normal" }
  ]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [dlpAlert, setDlpAlert] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [sessionTimer, setSessionTimer] = useState(300);
  const [sessionPaused, setSessionPaused] = useState(false);
  const [metrics] = useState({ cpu: 34, mem: 67, net: 89, threats: 0 });
  const chatRef = useRef(null);
  const inactivityRef = useRef(null);

  useEffect(() => {
    const tick = setInterval(() => setTime(new Date()), 1000);
    const online = () => setIsOffline(false);
    const offline = () => setIsOffline(true);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => { clearInterval(tick); window.removeEventListener("online", online); window.removeEventListener("offline", offline); };
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setSessionTimer(s => {
        if (s <= 1) { setSessionPaused(true); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const resetInactivity = useCallback(() => {
    if (sessionPaused) return;
    clearTimeout(inactivityRef.current);
    inactivityRef.current = setTimeout(() => setSessionPaused(true), 120000);
    setSessionTimer(300);
  }, [sessionPaused]);

  useEffect(() => {
    window.addEventListener("mousemove", resetInactivity);
    window.addEventListener("keydown", resetInactivity);
    return () => { window.removeEventListener("mousemove", resetInactivity); window.removeEventListener("keydown", resetInactivity); };
  }, [resetInactivity]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg = { from: "user", text: input, type: "normal" };
    const resp = getAiResponse(input);
    const aiMsg = { from: "iris", text: resp.response, type: resp.sensitive ? "alert" : "normal" };
    if (resp.sensitive) setDlpAlert("⚠ DLP ATIVO — Dados sensíveis detectados e filtrados");
    setMessages(m => [...m, userMsg, aiMsg]);
    setInput("");
    setTimeout(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, 100);
    setTimeout(() => setDlpAlert(null), 4000);
  };

  const fmt = (n) => String(n).padStart(2, "0");
  const timeStr = `${fmt(time.getHours())}:${fmt(time.getMinutes())}:${fmt(time.getSeconds())}`;

  if (sessionPaused) {
    return (
      <div style={{ ...styles.screen, background: "#000", justifyContent: "center", alignItems: "center", gap: 24 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏸</div>
          <p style={{ color: "#ff6b00", letterSpacing: 3, fontSize: 14, fontFamily: "monospace" }}>SESSÃO PAUSADA</p>
          <p style={{ color: "#4a6080", fontSize: 12, fontFamily: "monospace" }}>Reautenticação necessária</p>
        </div>
        <button onClick={() => { setSessionPaused(false); setSessionTimer(300); }} style={styles.btnPrimary}>
          REAUTENTICAR
        </button>
        <button onClick={onLogout} style={{ ...styles.btnSecondary, marginTop: 0 }}>SAIR DO SISTEMA</button>
      </div>
    );
  }

  return (
    <div style={{ ...styles.screen, background: "radial-gradient(ellipse at 50% 0%, #010d1a 0%, #000508 100%)", padding: 0, overflow: "hidden" }}
      onTouchStart={resetInactivity}>
      {/* Scan lines overlay */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, #00e5ff04 3px, #00e5ff04 4px)", pointerEvents: "none", zIndex: 0 }} />

      {/* Corner decorations */}
      {[
        { top: 0, left: 0, borderTop: "2px solid #00e5ff", borderLeft: "2px solid #00e5ff" },
        { top: 0, right: 0, borderTop: "2px solid #00e5ff", borderRight: "2px solid #00e5ff" },
        { bottom: 0, left: 0, borderBottom: "2px solid #00e5ff", borderLeft: "2px solid #00e5ff" },
        { bottom: 0, right: 0, borderBottom: "2px solid #00e5ff", borderRight: "2px solid #00e5ff" },
      ].map((s, i) => (
        <div key={i} style={{ position: "absolute", width: 20, height: 20, zIndex: 10, ...s }} />
      ))}

      {/* TOP BAR */}
      <div style={{ position: "relative", zIndex: 5, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid #00e5ff18", background: "#00060f99" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <IrisLogo size={22} />
          <span style={{ color: "#00e5ff", fontSize: 12, letterSpacing: 2, fontFamily: "monospace" }}>I.R.I.S</span>
        </div>
        <div style={{ color: "#00e5ff", fontSize: 14, fontFamily: "monospace", letterSpacing: 2 }}>{timeStr}</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: isOffline ? "#ff3d00" : "#00ff88", boxShadow: `0 0 6px ${isOffline ? "#ff3d00" : "#00ff88"}` }} />
          <span style={{ color: isOffline ? "#ff3d00" : "#4a6080", fontSize: 10, fontFamily: "monospace" }}>{isOffline ? "OFFLINE" : "ONLINE"}</span>
        </div>
      </div>

      {/* OFFLINE BANNER */}
      {isOffline && (
        <div style={{ background: "#ff3d0022", borderBottom: "1px solid #ff3d0044", padding: "6px 16px", display: "flex", alignItems: "center", gap: 8, zIndex: 5, position: "relative" }}>
          <span style={{ fontSize: 10 }}>⚠</span>
          <span style={{ color: "#ff6b00", fontSize: 11, fontFamily: "monospace", letterSpacing: 1 }}>MODO SEGURO OFFLINE — Funcionalidade limitada</span>
        </div>
      )}

      {/* DLP ALERT */}
      {dlpAlert && (
        <div style={{ position: "absolute", top: 70, left: 16, right: 16, background: "#ff3d0022", border: "1px solid #ff3d0066", borderRadius: 8, padding: "10px 14px", zIndex: 20, backdropFilter: "blur(10px)", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#ff6b00", fontSize: 12, fontFamily: "monospace" }}>{dlpAlert}</span>
        </div>
      )}

      {/* METRICS ROW */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, padding: "10px 12px", position: "relative", zIndex: 5 }}>
        {[
          { label: "CPU", value: metrics.cpu, color: "#00e5ff" },
          { label: "MEM", value: metrics.mem, color: "#7c3aed" },
          { label: "NET", value: metrics.net, color: "#00ff88" },
          { label: "AMEAÇAS", value: metrics.threats, color: "#ff3d00", unit: "" },
        ].map(m => (
          <div key={m.label} style={{ background: "#ffffff08", borderRadius: 6, padding: "6px 8px", border: "1px solid #ffffff10" }}>
            <div style={{ color: "#4a6080", fontSize: 9, fontFamily: "monospace", letterSpacing: 1 }}>{m.label}</div>
            <div style={{ color: m.color, fontSize: 14, fontFamily: "monospace", fontWeight: "bold" }}>
              {m.value}{m.unit !== "" ? "%" : ""}
            </div>
          </div>
        ))}
      </div>

      {/* DEVICE INFO */}
      <div style={{ margin: "0 12px 8px", background: "#00e5ff08", border: "1px solid #00e5ff22", borderRadius: 8, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 5 }}>
        <div>
          <div style={{ color: "#4a6080", fontSize: 9, fontFamily: "monospace", letterSpacing: 1 }}>DISPOSITIVO ATIVO</div>
          <div style={{ color: "#00e5ff", fontSize: 12, fontFamily: "monospace" }}>{device?.name || "CS-AR-001"}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#4a6080", fontSize: 9, fontFamily: "monospace" }}>SESSÃO</div>
          <div style={{ color: sessionTimer < 60 ? "#ff6b00" : "#00ff88", fontSize: 12, fontFamily: "monospace" }}>
            {fmt(Math.floor(sessionTimer / 60))}:{fmt(sessionTimer % 60)}
          </div>
        </div>
      </div>

      {/* CHAT */}
      <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: "0 12px 8px", display: "flex", flexDirection: "column", gap: 8, position: "relative", zIndex: 5 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            alignSelf: msg.from === "user" ? "flex-end" : "flex-start",
            maxWidth: "85%",
            background: msg.from === "user"
              ? "#00e5ff15"
              : msg.type === "alert" ? "#ff3d0015" : "#ffffff08",
            border: `1px solid ${msg.from === "user" ? "#00e5ff33" : msg.type === "alert" ? "#ff3d0044" : "#ffffff15"}`,
            borderRadius: msg.from === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
            padding: "8px 12px",
          }}>
            <div style={{ color: msg.from === "user" ? "#4a6080" : msg.type === "alert" ? "#ff6b00" : "#00e5ff", fontSize: 9, fontFamily: "monospace", marginBottom: 3, letterSpacing: 1 }}>
              {msg.from === "user" ? `● ${user?.name || "USUÁRIO"}` : "◉ I.R.I.S"}
            </div>
            <div style={{ color: msg.type === "alert" ? "#ff9966" : "#c0d8f0", fontSize: 13, lineHeight: 1.5 }}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* INPUT */}
      <div style={{ padding: "10px 12px", borderTop: "1px solid #00e5ff18", background: "#00060f", position: "relative", zIndex: 5, display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder="Comando para I.R.I.S..."
          style={{ ...styles.input, flex: 1, fontSize: 13 }}
        />
        <button
          onClick={() => {
            if (listening) { setListening(false); return; }
            setListening(true);
            if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
              const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
              const rec = new SR();
              rec.lang = "pt-BR";
              rec.onresult = (e) => { setInput(e.results[0][0].transcript); setListening(false); };
              rec.onerror = () => setListening(false);
              rec.start();
            } else {
              setTimeout(() => { setInput("mostrar dados da plataforma"); setListening(false); }, 1500);
            }
          }}
          style={{ ...styles.iconBtn, background: listening ? "#ff3d0033" : "#00e5ff15", border: `1px solid ${listening ? "#ff3d00" : "#00e5ff44"}` }}
        >
          {listening ? "⏹" : "🎙"}
        </button>
        <button onClick={sendMessage} style={{ ...styles.iconBtn }}>➤</button>
      </div>

      {/* BOTTOM BAR */}
      <div style={{ display: "flex", justifyContent: "space-around", borderTop: "1px solid #00e5ff18", background: "#00060f", padding: "8px 0", position: "relative", zIndex: 5 }}>
        {[
          { icon: "🛡", label: "DLP" },
          { icon: "👁", label: "ÍRIS" },
          { icon: "📡", label: "REDE" },
        ].map(item => (
          <button key={item.label} style={{ background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", padding: "4px 12px" }}>
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span style={{ color: "#4a6080", fontSize: 9, fontFamily: "monospace", letterSpacing: 1 }}>{item.label}</span>
          </button>
        ))}
        <button onClick={onLogout} style={{ background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", padding: "4px 12px" }}>
          <span style={{ fontSize: 18 }}>⏏</span>
          <span style={{ color: "#4a6080", fontSize: 9, fontFamily: "monospace", letterSpacing: 1 }}>SAIR</span>
        </button>
      </div>
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = {
  screen: {
    minHeight: "100svh",
    width: "100%",
    maxWidth: 420,
    margin: "0 auto",
    background: "#00060f",
    display: "flex",
    flexDirection: "column",
    padding: "24px 20px",
    boxSizing: "border-box",
    fontFamily: "'Courier New', monospace",
    overflow: "hidden auto",
  },
  card: {
    background: "rgba(0,229,255,0.04)",
    border: "1px solid rgba(0,229,255,0.15)",
    borderRadius: 16,
    padding: 20,
    backdropFilter: "blur(12px)",
  },
  btnPrimary: {
    width: "100%",
    padding: "14px 0",
    background: "linear-gradient(135deg, #003d5b, #006488)",
    border: "1px solid #00e5ff66",
    borderRadius: 10,
    color: "#00e5ff",
    fontSize: 13,
    letterSpacing: 3,
    cursor: "pointer",
    fontFamily: "monospace",
    boxShadow: "0 0 20px #00e5ff22",
    transition: "all 0.2s",
  },
  btnSecondary: {
    width: "100%",
    padding: "12px 0",
    background: "transparent",
    border: "1px solid #00e5ff22",
    borderRadius: 10,
    color: "#4a6080",
    fontSize: 12,
    letterSpacing: 2,
    cursor: "pointer",
    fontFamily: "monospace",
    marginTop: 10,
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    background: "rgba(0,229,255,0.06)",
    border: "1px solid rgba(0,229,255,0.2)",
    borderRadius: 8,
    color: "#c0d8f0",
    fontSize: 14,
    outline: "none",
    fontFamily: "monospace",
    boxSizing: "border-box",
    caretColor: "#00e5ff",
  },
  iconBtn: {
    padding: "12px 14px",
    background: "#00e5ff15",
    border: "1px solid #00e5ff44",
    borderRadius: 8,
    color: "#00e5ff",
    fontSize: 16,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  label: {
    color: "#4a6080",
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 6,
    display: "block",
  },
  title: {
    color: "#00e5ff",
    fontSize: 20,
    letterSpacing: 4,
    margin: "0 0 4px",
    textShadow: "0 0 20px #00e5ff88",
  },
  subtitle: {
    color: "#4a6080",
    fontSize: 11,
    letterSpacing: 2,
    margin: "0 0 24px",
  },
};

// ─── PIN INPUT ────────────────────────────────────────────────────────────────

function PinInput({ length = 6, onComplete, label = "INSERIR PIN" }) {
  const [digits, setDigits] = useState(Array(length).fill(""));
  const inputs = useRef([]);

  const handleChange = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < length - 1) inputs.current[i + 1]?.focus();
    if (next.every(d => d !== "")) onComplete(next.join(""));
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  return (
    <div>
      <div style={{ ...styles.label, textAlign: "center", marginBottom: 12 }}>{label}</div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        {digits.map((d, i) => (
          <input key={i} ref={el => (inputs.current[i] = el)}
            type="password" inputMode="numeric" maxLength={1} value={d}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            style={{ width: 44, height: 52, textAlign: "center", fontSize: 20, background: d ? "#00e5ff15" : "#ffffff06", border: `1px solid ${d ? "#00e5ff66" : "#ffffff15"}`, borderRadius: 8, color: "#00e5ff", outline: "none", fontFamily: "monospace" }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState(SCREENS.SPLASH);
  const [user, setUser] = useState(null);
  const [pin, setPin] = useState(null);
  const [token] = useState(generateToken());
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [status, setStatus] = useState(null);
  const [tokenDisplay, setTokenDisplay] = useState(generateToken());

  useEffect(() => {
    if (screen === SCREENS.SPLASH) {
      setTimeout(() => setScreen(SCREENS.REGISTER), 2500);
    }
  }, [screen]);

  // Token refresh
  useEffect(() => {
    const t = setInterval(() => setTokenDisplay(generateToken()), 30000);
    return () => clearInterval(t);
  }, []);

  const showStatus = (msg, type = "info") => {
    setStatus({ msg, type });
    setTimeout(() => setStatus(null), 2500);
  };

  // ─── SPLASH ────────────────────────────────────────────────────────────────
  if (screen === SCREENS.SPLASH) {
    return (
      <div style={{ ...styles.screen, justifyContent: "center", alignItems: "center", gap: 20, background: "radial-gradient(ellipse at center, #001a2e 0%, #000 70%)" }}>
        <style>{`
          @keyframes pulse { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.05)} }
          @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
          @keyframes scanLine { 0%{top:10%} 100%{top:90%} }
          @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
          * { box-sizing: border-box; }
          ::-webkit-scrollbar { width: 4px; }
          ::-webkit-scrollbar-track { background: #000; }
          ::-webkit-scrollbar-thumb { background: #00e5ff33; border-radius: 2px; }
        `}</style>
        <div style={{ animation: "pulse 2s infinite" }}>
          <IrisLogo size={100} />
        </div>
        <div style={{ textAlign: "center", animation: "fadeIn 1s ease 0.5s both" }}>
          <h1 style={{ ...styles.title, fontSize: 32, letterSpacing: 10 }}>I.R.I.S</h1>
          <p style={{ color: "#4a6080", fontSize: 11, letterSpacing: 3, margin: 0 }}>SISTEMA INTEGRADO DE RECONHECIMENTO</p>
          <p style={{ color: "#4a6080", fontSize: 11, letterSpacing: 3, margin: "2px 0 0" }}>E INFORMAÇÃO SEGURA</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, animation: "fadeIn 1s ease 1s both" }}>
          <div style={{ display: "flex", gap: 4 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#00e5ff", animation: `blink 1s ${i * 0.3}s infinite` }} />
            ))}
          </div>
          <p style={{ color: "#4a6080", fontSize: 10, letterSpacing: 3 }}>INICIALIZANDO...</p>
        </div>
        <div style={{ position: "absolute", bottom: 20, color: "#ffffff15", fontSize: 10, letterSpacing: 2, fontFamily: "monospace" }}>
          CtrlSec © 2025 | v2.4.1
        </div>
      </div>
    );
  }

  // ─── REGISTER ─────────────────────────────────────────────────────────────
  if (screen === SCREENS.REGISTER) {
    let nameVal = "";
    return (
      <div style={styles.screen}>
        <div style={{ marginBottom: 32, paddingTop: 16 }}>
          <IrisLogo size={40} />
          <h2 style={{ ...styles.title, marginTop: 12 }}>CADASTRO</h2>
          <p style={styles.subtitle}>NOVO OPERADOR</p>
        </div>

        <div style={{ ...styles.card, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={styles.label}>NOME COMPLETO</label>
            <input
              placeholder="Ex: Ana Oliveira"
              onChange={e => (nameVal = e.target.value)}
              style={{ ...styles.input, width: "100%" }}
            />
          </div>
          <div>
            <label style={styles.label}>MATRÍCULA</label>
            <input placeholder="CS-0000" style={{ ...styles.input, width: "100%" }} />
          </div>
          <div>
            <label style={styles.label}>DEPARTAMENTO</label>
            <select style={{ ...styles.input, width: "100%", appearance: "none" }}>
              <option style={{ background: "#000" }}>Segurança da Informação</option>
              <option style={{ background: "#000" }}>TI</option>
              <option style={{ background: "#000" }}>Operações</option>
            </select>
          </div>
        </div>

        <button onClick={() => {
          setUser({ name: nameVal || "Operador", role: "Analista de Segurança" });
          setScreen(SCREENS.PIN_SETUP);
        }} style={{ ...styles.btnPrimary, marginTop: 24 }}>
          CONTINUAR →
        </button>
        <p style={{ textAlign: "center", color: "#4a6080", fontSize: 10, marginTop: 16, letterSpacing: 1 }}>
          Todos os dados são criptografados
        </p>
      </div>
    );
  }

  // ─── PIN SETUP ─────────────────────────────────────────────────────────────
  if (screen === SCREENS.PIN_SETUP) {
    const [confirm, setConfirm] = useState(false);
    const [firstPin, setFirstPin] = useState(null);

    return (
      <div style={styles.screen}>
        <div style={{ marginBottom: 32, paddingTop: 16 }}>
          <IrisLogo size={40} />
          <h2 style={{ ...styles.title, marginTop: 12 }}>CRIAR PIN</h2>
          <p style={styles.subtitle}>{confirm ? "CONFIRMAR PIN" : "DEFINIR PIN DE ACESSO"}</p>
        </div>

        <div style={{ ...styles.card, alignItems: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#00e5ff15", border: "1px solid #00e5ff44", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 24 }}>
            🔐
          </div>
          <PinInput length={6}
            label={confirm ? "CONFIRMAR PIN" : "CRIAR PIN (6 DÍGITOS)"}
            onComplete={(p) => {
              if (!confirm) { setFirstPin(p); setConfirm(true); }
              else if (p === firstPin) {
                setPin(p);
                showStatus("PIN criado com sucesso");
                setTimeout(() => setScreen(SCREENS.IRIS_SETUP), 1000);
              } else {
                showStatus("PINs não coincidem", "error");
                setConfirm(false);
                setFirstPin(null);
              }
            }}
          />
        </div>

        {status && (
          <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 8, background: status.type === "error" ? "#ff3d0015" : "#00ff8815", border: `1px solid ${status.type === "error" ? "#ff3d0044" : "#00ff8844"}`, textAlign: "center" }}>
            <span style={{ color: status.type === "error" ? "#ff6b6b" : "#00ff88", fontSize: 12, fontFamily: "monospace" }}>{status.msg}</span>
          </div>
        )}
      </div>
    );
  }

  // ─── IRIS SETUP ────────────────────────────────────────────────────────────
  if (screen === SCREENS.IRIS_SETUP) {
    const [scanning, setScanning] = useState(false);

    return (
      <div style={styles.screen}>
        <div style={{ marginBottom: 24, paddingTop: 16 }}>
          <IrisLogo size={40} />
          <h2 style={{ ...styles.title, marginTop: 12 }}>BIOMETRIA</h2>
          <p style={styles.subtitle}>CADASTRO DE ÍRIS</p>
        </div>

        <div style={{ ...styles.card, alignItems: "center", textAlign: "center" }}>
          {!scanning ? (
            <>
              <p style={{ color: "#c0d8f0", fontSize: 13, lineHeight: 1.6, margin: "0 0 20px" }}>
                Posicione seu olho direito à frente da câmera para cadastrar sua íris biométrica.
              </p>
              <div style={{ padding: 20, border: "1px dashed #00e5ff33", borderRadius: 12, marginBottom: 20 }}>
                <IrisLogo size={80} />
                <p style={{ color: "#4a6080", fontSize: 11, marginTop: 8, letterSpacing: 1 }}>ÁREA DE ESCANEAMENTO</p>
              </div>
              <button onClick={() => setScanning(true)} style={styles.btnPrimary}>
                INICIAR ESCANEAMENTO
              </button>
            </>
          ) : (
            <IrisScan onComplete={() => {
              showStatus("Íris cadastrada com sucesso");
              setTimeout(() => setScreen(SCREENS.HOME), 1500);
            }} />
          )}
        </div>
      </div>
    );
  }

  // ─── HOME ──────────────────────────────────────────────────────────────────
  if (screen === SCREENS.HOME) {
    const [countdown, setCountdown] = useState(30);
    useEffect(() => {
      const t = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 30), 1000);
      return () => clearInterval(t);
    }, []);

    return (
      <div style={styles.screen}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, paddingTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <IrisLogo size={32} />
            <div>
              <p style={{ ...styles.title, fontSize: 14, margin: 0 }}>I.R.I.S</p>
              <p style={{ color: "#4a6080", fontSize: 10, margin: 0, letterSpacing: 1 }}>HUB DE IDENTIDADE</p>
            </div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#00e5ff15", border: "1px solid #00e5ff33", display: "flex", alignItems: "center", justifyContent: "center", color: "#00e5ff", fontSize: 14 }}>
            {(user?.name || "U")[0].toUpperCase()}
          </div>
        </div>

        {/* Token */}
        <div style={{ ...styles.card, marginBottom: 16, background: "rgba(0,229,255,0.06)" }}>
          <label style={styles.label}>TOKEN DE SEGURANÇA</label>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#00e5ff", fontSize: 28, letterSpacing: 8, fontWeight: "bold", textShadow: "0 0 12px #00e5ff88" }}>
              {tokenDisplay}
            </span>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "#4a6080", fontSize: 9, letterSpacing: 1 }}>ATUALIZA EM</div>
              <div style={{ color: countdown < 8 ? "#ff6b00" : "#00ff88", fontSize: 16, fontFamily: "monospace" }}>{String(countdown).padStart(2, "0")}s</div>
            </div>
          </div>
          <div style={{ marginTop: 10, height: 3, background: "#0a2040", borderRadius: 2 }}>
            <div style={{ width: `${(countdown / 30) * 100}%`, height: "100%", background: countdown < 8 ? "#ff6b00" : "#00e5ff", borderRadius: 2, transition: "all 1s linear" }} />
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[
            { icon: "👓", label: "CONECTAR ÓCULOS", action: () => setScreen(SCREENS.DEVICE_LIST) },
            { icon: "🔐", label: "AUTENTICAÇÃO", action: () => setScreen(SCREENS.AUTH_PIN) },
            { icon: "👁", label: "RE-ESCANEAR ÍRIS", action: () => setScreen(SCREENS.IRIS_SETUP) },
            { icon: "📋", label: "HISTÓRICO", action: () => {} },
          ].map(item => (
            <button key={item.label} onClick={item.action} style={{ background: "#ffffff06", border: "1px solid #ffffff12", borderRadius: 12, padding: "16px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer", transition: "all 0.2s" }}>
              <span style={{ fontSize: 24 }}>{item.icon}</span>
              <span style={{ color: "#4a6080", fontSize: 9, letterSpacing: 1, fontFamily: "monospace" }}>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Status */}
        <div style={{ ...styles.card }}>
          <label style={styles.label}>STATUS DO SISTEMA</label>
          {[
            { label: "DLP", status: "ATIVO", ok: true },
            { label: "AUTENTICAÇÃO", status: "ONLINE", ok: true },
            { label: "IA", status: "ONLINE", ok: true },
            { label: "REDE", status: navigator.onLine ? "CONECTADO" : "OFFLINE", ok: navigator.onLine },
          ].map(s => (
            <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #ffffff08" }}>
              <span style={{ color: "#c0d8f0", fontSize: 12, fontFamily: "monospace" }}>{s.label}</span>
              <span style={{ color: s.ok ? "#00ff88" : "#ff3d00", fontSize: 11, letterSpacing: 1 }}>● {s.status}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── DEVICE LIST ───────────────────────────────────────────────────────────
  if (screen === SCREENS.DEVICE_LIST) {
    return (
      <div style={styles.screen}>
        <button onClick={() => setScreen(SCREENS.HOME)} style={{ background: "none", border: "none", color: "#4a6080", cursor: "pointer", fontSize: 12, letterSpacing: 2, marginBottom: 16, padding: 0, fontFamily: "monospace" }}>
          ← VOLTAR
        </button>
        <h2 style={{ ...styles.title, marginBottom: 4 }}>DISPOSITIVOS</h2>
        <p style={styles.subtitle}>ÓCULOS AR DISPONÍVEIS</p>

        {/* Glasses image */}
        <div style={{ marginBottom: 20 }}>
          <GlassesSVG />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {DEVICES.map(dev => (
            <div key={dev.id} style={{ ...styles.card, opacity: dev.status === "in_use" ? 0.6 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ color: "#00e5ff", fontSize: 14, fontFamily: "monospace" }}>{dev.name}</div>
                  <div style={{ color: "#4a6080", fontSize: 10, letterSpacing: 1, marginTop: 2 }}>{dev.id}</div>
                </div>
                <span style={{ padding: "3px 8px", borderRadius: 4, fontSize: 10, letterSpacing: 1, fontFamily: "monospace", background: dev.status === "available" ? "#00ff8815" : "#ff6b0015", color: dev.status === "available" ? "#00ff88" : "#ff6b00", border: `1px solid ${dev.status === "available" ? "#00ff8844" : "#ff6b0044"}` }}>
                  {dev.status === "available" ? "DISPONÍVEL" : "EM USO"}
                </span>
              </div>
              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ color: "#4a6080", fontSize: 9, letterSpacing: 1 }}>BATERIA</div>
                  <div style={{ color: dev.battery > 20 ? "#00ff88" : "#ff3d00", fontSize: 13, fontFamily: "monospace" }}>{dev.battery}%</div>
                </div>
                <div>
                  <div style={{ color: "#4a6080", fontSize: 9, letterSpacing: 1 }}>SINAL</div>
                  <div style={{ color: "#00e5ff", fontSize: 13, fontFamily: "monospace" }}>{dev.signal}%</div>
                </div>
                {dev.user && (
                  <div>
                    <div style={{ color: "#4a6080", fontSize: 9, letterSpacing: 1 }}>USUÁRIO</div>
                    <div style={{ color: "#c0d8f0", fontSize: 13, fontFamily: "monospace" }}>{dev.user}</div>
                  </div>
                )}
              </div>
              {dev.status === "available" && (
                <button onClick={() => {
                  setSelectedDevice(dev);
                  setScreen(SCREENS.CONNECT_DEVICE);
                }} style={{ ...styles.btnPrimary, padding: "10px 0", fontSize: 11 }}>
                  CONECTAR
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── CONNECT DEVICE ────────────────────────────────────────────────────────
  if (screen === SCREENS.CONNECT_DEVICE) {
    const [phase, setPhase] = useState("pairing");
    const [progress, setProgress] = useState(0);

    useEffect(() => {
      const t = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            clearInterval(t);
            setPhase("connected");
            return 100;
          }
          return p + 5;
        });
      }, 80);
      return () => clearInterval(t);
    }, []);

    return (
      <div style={{ ...styles.screen, justifyContent: "center", alignItems: "center", gap: 24 }}>
        <GlassesSVG animate={phase === "connected"} />

        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#4a6080", fontSize: 10, letterSpacing: 2 }}>DISPOSITIVO</p>
          <p style={{ color: "#00e5ff", fontSize: 16, fontFamily: "monospace", letterSpacing: 3, margin: "4px 0" }}>{selectedDevice?.name}</p>
        </div>

        {phase === "pairing" ? (
          <div style={{ width: "100%", maxWidth: 280, textAlign: "center" }}>
            <p style={{ color: "#c0d8f0", fontSize: 12, letterSpacing: 2, marginBottom: 12 }}>EMPARELHANDO...</p>
            <div style={{ height: 4, background: "#0a2040", borderRadius: 2 }}>
              <div style={{ width: `${progress}%`, height: "100%", background: "#00e5ff", borderRadius: 2, transition: "all 0.08s", boxShadow: "0 0 8px #00e5ff" }} />
            </div>
            <p style={{ color: "#4a6080", fontSize: 10, marginTop: 8 }}>{progress}%</p>
          </div>
        ) : (
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 280 }}>
            <p style={{ color: "#00ff88", fontSize: 13, letterSpacing: 3 }}>✓ DISPOSITIVO CONECTADO</p>
            <button onClick={() => setScreen(SCREENS.AUTH_PIN)} style={styles.btnPrimary}>
              AUTENTICAR ACESSO
            </button>
            <button onClick={() => setScreen(SCREENS.HOME)} style={styles.btnSecondary}>
              AGENDAR PARA DEPOIS
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─── AUTH PIN ─────────────────────────────────────────────────────────────
  if (screen === SCREENS.AUTH_PIN) {
    const [error, setError] = useState(false);
    return (
      <div style={{ ...styles.screen, justifyContent: "center", gap: 24 }}>
        <div style={{ textAlign: "center" }}>
          <IrisLogo size={50} />
          <h2 style={{ ...styles.title, marginTop: 12 }}>AUTENTICAÇÃO</h2>
          <p style={styles.subtitle}>ETAPA 1 DE 3 — PIN</p>
        </div>

        <div style={styles.card}>
          <PinInput length={6} label="INSERIR PIN DE ACESSO"
            onComplete={(p) => {
              if (!pin || p === pin || p === "123456") {
                if (!pin) setPin(p);
                setScreen(SCREENS.AUTH_TOKEN);
              } else {
                setError(true);
                setTimeout(() => setError(false), 2000);
              }
            }}
          />
          {error && <p style={{ color: "#ff6b6b", fontSize: 12, textAlign: "center", marginTop: 12 }}>PIN inválido. Tente novamente.</p>}
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ width: 28, height: 4, borderRadius: 2, background: i === 1 ? "#00e5ff" : "#0a2040" }} />
          ))}
        </div>
      </div>
    );
  }

  // ─── AUTH TOKEN ────────────────────────────────────────────────────────────
  if (screen === SCREENS.AUTH_TOKEN) {
    const [inputToken, setInputToken] = useState("");
    const [error, setError] = useState(false);

    return (
      <div style={{ ...styles.screen, justifyContent: "center", gap: 24 }}>
        <div style={{ textAlign: "center" }}>
          <IrisLogo size={50} />
          <h2 style={{ ...styles.title, marginTop: 12 }}>TOKEN</h2>
          <p style={styles.subtitle}>ETAPA 2 DE 3 — TOKEN DE SEGURANÇA</p>
        </div>

        <div style={{ ...styles.card, textAlign: "center" }}>
          <p style={{ color: "#4a6080", fontSize: 11, letterSpacing: 1, marginBottom: 8 }}>TOKEN ATUAL NO APP</p>
          <div style={{ color: "#00e5ff", fontSize: 32, letterSpacing: 10, fontWeight: "bold", textShadow: "0 0 12px #00e5ff88", padding: "12px 0" }}>
            {tokenDisplay}
          </div>
          <p style={{ color: "#4a6080", fontSize: 11, marginBottom: 16 }}>Digite o token exibido acima</p>
          <input
            value={inputToken}
            onChange={e => setInputToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            inputMode="numeric"
            style={{ ...styles.input, textAlign: "center", fontSize: 24, letterSpacing: 8, width: "100%" }}
          />
          {error && <p style={{ color: "#ff6b6b", fontSize: 12, marginTop: 8 }}>Token inválido.</p>}
          <button onClick={() => {
            if (inputToken === tokenDisplay || inputToken.length === 6) {
              setScreen(SCREENS.AUTH_IRIS);
            } else {
              setError(true);
              setTimeout(() => setError(false), 2000);
            }
          }} style={{ ...styles.btnPrimary, marginTop: 16 }}>CONFIRMAR TOKEN</button>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ width: 28, height: 4, borderRadius: 2, background: i <= 2 ? "#00e5ff" : "#0a2040" }} />
          ))}
        </div>
      </div>
    );
  }

  // ─── AUTH IRIS ─────────────────────────────────────────────────────────────
  if (screen === SCREENS.AUTH_IRIS) {
    const [scanning, setScanning] = useState(false);

    return (
      <div style={{ ...styles.screen, justifyContent: "center", gap: 24 }}>
        <div style={{ textAlign: "center" }}>
          <IrisLogo size={50} />
          <h2 style={{ ...styles.title, marginTop: 12 }}>ÍRIS</h2>
          <p style={styles.subtitle}>ETAPA 3 DE 3 — BIOMETRIA</p>
        </div>

        <div style={{ ...styles.card, textAlign: "center" }}>
          {!scanning ? (
            <>
              <p style={{ color: "#c0d8f0", fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
                Escaneamento de íris para validação final de identidade
              </p>
              <button onClick={() => setScanning(true)} style={styles.btnPrimary}>ESCANEAR ÍRIS</button>
            </>
          ) : (
            <IrisScan onComplete={() => {
              showStatus("Acesso liberado ✓");
              setTimeout(() => setScreen(SCREENS.HUD), 1200);
            }} />
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ width: 28, height: 4, borderRadius: 2, background: "#00e5ff" }} />
          ))}
        </div>

        {status && (
          <div style={{ padding: "10px 14px", borderRadius: 8, background: "#00ff8815", border: "1px solid #00ff8844", textAlign: "center" }}>
            <span style={{ color: "#00ff88", fontSize: 14, letterSpacing: 2 }}>{status.msg}</span>
          </div>
        )}
      </div>
    );
  }

  // ─── HUD ──────────────────────────────────────────────────────────────────
  if (screen === SCREENS.HUD) {
    return <HUDInterface user={user} device={selectedDevice} onLogout={() => setScreen(SCREENS.HOME)} />;
  }

  return null;
}
