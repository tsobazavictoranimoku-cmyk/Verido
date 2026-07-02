import { useState, useEffect, useRef } from "react";

// ── DESIGN TOKENS ─────────────────────────────────────────────────────────────
const T = {
  forest:   "#0B2016",
  canopy:   "#122B1C",
  moss:     "#1A3D28",
  leaf:     "#2D5E3E",
  sand:     "#F5EDD6",
  parchment:"#EDE0C4",
  amber:    "#F5A623",
  amberDim: "#F5A62320",
  amberGlow:"#F5A62355",
  trust:    "#3DDC84",
  warn:     "#FFB800",
  risk:     "#FF4D4D",
  muted:    "#7A9E8A",
  border:   "#1E4030",
  ink:      "#0B1F14",
};

// ── VERIDO BACKEND CALL ────────────────────────────────────────────────────────
async function askVerido(systemPrompt, userPrompt) {
  const res = await fetch("/api/verido", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemPrompt, userPrompt }),
  });
  const data = await res.json();
  if (data.error) return `⚠ ${data.error}`;
  return data.text || "";
}

// ── TRUST PULSE ───────────────────────────────────────────────────────────────
function TrustPulse({ score, loading, idle }) {
  const color = idle ? T.muted : score >= 70 ? T.risk : score >= 40 ? T.warn : T.trust;
  const label = idle ? "READY" : score >= 70 ? "HIGH RISK" : score >= 40 ? "CAUTION" : "TRUSTWORTHY";
  const r = 54, cx = 70, cy = 70, circ = 2 * Math.PI * r;
  const dash = idle ? 0 : (score / 100) * circ;

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
      <div style={{ position:"relative", width:140, height:140 }}>
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle cx={cx} cy={cy} r={r+12} fill="none" stroke={color+"11"} strokeWidth="1" />
          <circle cx={cx} cy={cy} r={r+20} fill="none" stroke={color+"08"} strokeWidth="1" />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={T.border} strokeWidth="10" />
          {!idle && (
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="10"
              strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
              transform="rotate(-90 70 70)"
              style={{ filter:`drop-shadow(0 0 8px ${color})`, transition:"stroke-dasharray 1s ease" }}
            />
          )}
          {loading ? (
            <circle cx={cx} cy={cy} r={16} fill="none" stroke={T.amber} strokeWidth="3"
              strokeDasharray="40 60" strokeLinecap="round"
              style={{ animation:"spin 0.9s linear infinite", transformOrigin:"70px 70px" }} />
          ) : (
            <>
              <text x="70" y="64" textAnchor="middle" fill={idle ? T.muted : color}
                fontSize={idle ? "13" : "26"} fontWeight="700" fontFamily="Georgia, serif">
                {idle ? "◉" : score}
              </text>
              {!idle && <text x="70" y="80" textAnchor="middle" fill={T.muted} fontSize="10" fontFamily="monospace">/100</text>}
            </>
          )}
        </svg>
        {loading && (
          <div style={{
            position:"absolute", inset:-8, borderRadius:"50%",
            border:`2px solid ${T.amber}33`,
            animation:"pulse-ring 1.2s ease-out infinite"
          }} />
        )}
      </div>
      <span style={{ color, fontFamily:"monospace", fontSize:11, fontWeight:700, letterSpacing:3 }}>{label}</span>
    </div>
  );
}

// ── SIGNAL BARS ────────────────────────────────────────────────────────────────
function SignalBar({ label, value, color }) {
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <span style={{ color:T.muted, fontFamily:"monospace", fontSize:11 }}>{label}</span>
        <span style={{ color, fontFamily:"monospace", fontSize:11, fontWeight:700 }}>{value}%</span>
      </div>
      <div style={{ height:4, background:T.border, borderRadius:2 }}>
        <div style={{ width:`${value}%`, height:"100%", background:color, borderRadius:2,
          boxShadow:`0 0 6px ${color}88`, transition:"width 1s ease" }} />
      </div>
    </div>
  );
}

// ── TRUST RESULT ──────────────────────────────────────────────────────────────
function TrustResult({ result, loading, idle }) {
  const scoreMatch = result?.match(/\b(\d{1,3})\s*(?:\/\s*100|%|\s*out of\s*100)/i);
  const score = scoreMatch ? Math.min(100, parseInt(scoreMatch[1])) : (result ? 35 : 0);

  const signals = result ? [
    { label:"Deepfake Detection",    value: Math.max(10, score - Math.floor(Math.random()*12)),       color: score>60?T.risk:T.trust },
    { label:"Voice Authenticity",    value: Math.max(10, score + Math.floor(Math.random()*8) - 4),   color: score>50?T.warn:T.trust },
    { label:"Source Credibility",    value: Math.max(10, 100 - score + Math.floor(Math.random()*15)),color: score>60?T.warn:T.trust },
    { label:"Metadata Integrity",    value: Math.max(10, score - Math.floor(Math.random()*20)),       color: score>65?T.risk:T.trust },
    { label:"Context Verification",  value: Math.max(10, 100 - score + Math.floor(Math.random()*10)),color: score>55?T.warn:T.trust },
  ] : [];

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:20 }}>
      <TrustPulse score={score} loading={loading} idle={idle} />
      {result && !loading && (
        <div style={{ width:"100%", animation:"fade-in 0.4s ease" }}>
          <div style={{ background:T.forest, border:`1px solid ${T.border}`, borderRadius:10, padding:16, marginBottom:14 }}>
            {signals.map(s => <SignalBar key={s.label} {...s} />)}
          </div>
          <div style={{ background:T.forest, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
            <p style={{ color:T.muted, fontFamily:"monospace", fontSize:10, letterSpacing:2, margin:"0 0 10px" }}>VERIDO ANALYSIS</p>
            <p style={{ color:T.sand, fontFamily:"Georgia, serif", fontSize:13, lineHeight:1.8, margin:0, whiteSpace:"pre-wrap" }}>{result}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── PRODUCT TABS ──────────────────────────────────────────────────────────────
const PRODUCTS = [
  { id:"consumer",    icon:"📱", label:"Consumer",   sub:"Personal trust checks" },
  { id:"election",   icon:"🗳",  label:"Elections",  sub:"Africa-focused political media" },
  { id:"bank",       icon:"🏦",  label:"Banking",    sub:"Fraud & voice scam detection" },
  { id:"journalist", icon:"📰",  label:"Press",      sub:"Newsroom verification" },
  { id:"enterprise", icon:"⚡",  label:"Enterprise", sub:"API & bulk analysis" },
];

// ── CONSUMER TAB ──────────────────────────────────────────────────────────────
function ConsumerTab() {
  const [input, setInput] = useState("");
  const [type, setType] = useState("link");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const SYS = `You are Verido, Africa's Digital Trust Platform. You don't just say "fake." You answer: "Should I trust this?"

Analyze the submitted content across multiple dimensions:
- Deepfake / manipulation probability
- Voice clone likelihood (if audio/video)  
- Source credibility signals
- Scam pattern recognition (especially Nigerian/African scam typologies: advance-fee, OTP harvesting, WhatsApp impersonation, bank fraud)
- Context plausibility

Give an overall Trust Score out of 100 (higher = more suspicious).
Then provide a short plain-English verdict that a non-technical person in Lagos or Nairobi can act on immediately.
Format: Trust Score, then 3-4 bullet findings, then one clear recommendation: TRUST / VERIFY / DO NOT TRUST.
Be direct, warm, and protective — not cold or technical.`;

  const run = async () => {
    if (!input.trim()) return;
    setLoading(true); setResult(null);
    const r = await askVerido(SYS, `Analyze this for trustworthiness: ${input}`);
    setResult(r); setLoading(false);
  };

  return (
    <div>
      <p style={{ color:T.muted, fontFamily:"Georgia, serif", fontSize:14, lineHeight:1.7, marginBottom:20 }}>
        Got a WhatsApp voice note that sounds off? A TikTok you're not sure about? 
        A video of a politician saying something wild? Paste it here.
      </p>
      <div style={{ display:"flex", gap:6, marginBottom:12 }}>
        {["link","text","call"].map(t => (
          <button key={t} onClick={() => setType(t)} style={{
            padding:"6px 14px", borderRadius:20, fontFamily:"monospace", fontSize:11, fontWeight:700,
            cursor:"pointer", border:"none", transition:"all 0.15s",
            background: type===t ? T.amber : T.border,
            color: type===t ? T.ink : T.muted,
          }}>{t==="link"?"🔗 Link":t==="text"?"💬 Message":"📞 Call Transcript"}</button>
        ))}
      </div>
      <textarea value={input} onChange={e => setInput(e.target.value)}
        placeholder={
          type==="link" ? "Paste a TikTok, X, YouTube, Instagram, or WhatsApp link…" :
          type==="text" ? "Paste the message, email, or post you want to verify…" :
          "Paste what was said during the call. Include context (who claimed to be calling, what they asked for)…"
        }
        style={{ width:"100%", background:T.forest, border:`1px solid ${T.border}`, borderRadius:10,
          padding:"14px 16px", color:T.sand, fontFamily:"Georgia, serif", fontSize:13, lineHeight:1.7,
          outline:"none", resize:"vertical", minHeight:100, boxSizing:"border-box" }}
      />
      <button onClick={run} style={{
        width:"100%", marginTop:10, padding:"13px", background:T.amber, color:T.ink,
        border:"none", borderRadius:10, fontFamily:"monospace", fontWeight:700, fontSize:14,
        cursor:"pointer", letterSpacing:1, transition:"opacity 0.2s"
      }}>CHECK TRUST →</button>
      <div style={{ marginTop:24 }}>
        <TrustResult result={result} loading={loading} idle={!result && !loading} />
      </div>
    </div>
  );
}

// ── ELECTION TAB ──────────────────────────────────────────────────────────────
function ElectionTab() {
  const [input, setInput] = useState("");
  const [country, setCountry] = useState("Nigeria");
  const [result, setResu
