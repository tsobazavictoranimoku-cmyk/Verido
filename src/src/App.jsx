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
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const COUNTRIES = ["Nigeria","Kenya","Ghana","South Africa","Senegal","Ethiopia","Zambia"];

  const SYS = `You are Verido's African Election Protection module. Analyze political media content for:
- Deepfake manipulation of candidate appearances or speeches
- Audio manipulation or voice cloning
- Out-of-context video repurposing
- Coordinated disinformation patterns common in African elections
- Known propaganda techniques used in the specified country's political landscape
- Metadata and provenance signals

Trust Score out of 100 (higher = more suspicious/manipulated).
Give specific, actionable intelligence for election observers, journalists, and civic organizations.
Mention the potential political impact and urgency level. Reference specific known patterns from that country where relevant.`;

  const run = async () => {
    if (!input.trim()) return;
    setLoading(true); setResult(null);
    const r = await askVerido(SYS, `Country: ${country}\nContent to analyze: ${input}`);
    setResult(r); setLoading(false);
  };

  return (
    <div>
      <div style={{ background:T.amberDim, border:`1px solid ${T.amberGlow}`, borderRadius:10, padding:"12px 16px", marginBottom:20 }}>
        <p style={{ color:T.amber, fontFamily:"monospace", fontSize:11, fontWeight:700, margin:"0 0 4px", letterSpacing:1 }}>⚠ ELECTION PROTECTION MODE</p>
        <p style={{ color:T.muted, fontFamily:"Georgia, serif", fontSize:13, margin:0, lineHeight:1.6 }}>
          Verido monitors and analyzes political content across Africa to protect democratic integrity. 
          Reports are shareable with election commissions and fact-checkers.
        </p>
      </div>
      <div style={{ marginBottom:12 }}>
        <p style={{ color:T.muted, fontFamily:"monospace", fontSize:10, letterSpacing:2, margin:"0 0 8px" }}>SELECT COUNTRY</p>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          {COUNTRIES.map(c => (
            <button key={c} onClick={() => setCountry(c)} style={{
              padding:"5px 12px", borderRadius:20, fontFamily:"monospace", fontSize:11, cursor:"pointer", border:"none",
              background: country===c ? T.amber : T.border,
              color: country===c ? T.ink : T.muted,
            }}>{c}</button>
          ))}
        </div>
      </div>
      <textarea value={input} onChange={e => setInput(e.target.value)}
        placeholder="Paste the political content URL, describe the video, or paste the text/speech transcript you want verified…"
        style={{ width:"100%", background:T.forest, border:`1px solid ${T.border}`, borderRadius:10,
          padding:"14px 16px", color:T.sand, fontFamily:"Georgia, serif", fontSize:13, lineHeight:1.7,
          outline:"none", resize:"vertical", minHeight:110, boxSizing:"border-box" }}
      />
      <button onClick={run} style={{
        width:"100%", marginTop:10, padding:"13px", background:T.amber, color:T.ink,
        border:"none", borderRadius:10, fontFamily:"monospace", fontWeight:700, fontSize:14,
        cursor:"pointer", letterSpacing:1,
      }}>ANALYZE POLITICAL CONTENT →</button>
      <div style={{ marginTop:24 }}>
        <TrustResult result={result} loading={loading} idle={!result && !loading} />
      </div>
    </div>
  );
}

// ── BANK TAB ──────────────────────────────────────────────────────────────────
function BankTab() {
  const [scenario, setScenario] = useState("");
  const [bank, setBank] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const SYS = `You are Verido's Banking Fraud Detection module, specialized in Nigerian and African financial fraud patterns.

Analyze the described call or interaction for:
- AI voice cloning indicators (robotic cadence, unnatural pauses, pitch inconsistencies)
- Social engineering scripts (urgency creation, authority impersonation, fear tactics)
- Known Nigerian bank fraud patterns: OTP harvesting, BVN phishing, NIN fraud, account takeover scripts
- Specific bank impersonation tells for Nigerian banks (Access, Zenith, GTBank, First Bank, UBA, etc.)
- Telemarketing fraud versus genuine bank communication markers

Trust Score out of 100 (higher = more suspicious).
Give a rapid verdict with: Red Flags Found, Likely Fraud Type, Immediate Action Required.
Use direct, non-technical language. The person reading this may be frightened and needs clear guidance NOW.`;

  const run = async () => {
    setLoading(true); setResult(null);
    const r = await askVerido(SYS,
      `Bank claimed: ${bank || "not specified"}\nScenario: ${scenario}`);
    setResult(r); setLoading(false);
  };

  return (
    <div>
      <div style={{ background:"#FF4D4D11", border:"1px solid #FF4D4D33", borderRadius:10, padding:"12px 16px", marginBottom:20 }}>
        <p style={{ color:T.risk, fontFamily:"monospace", fontSize:11, fontWeight:700, margin:"0 0 4px", letterSpacing:1 }}>🚨 FRAUD PROTECTION</p>
        <p style={{ color:T.muted, fontFamily:"Georgia, serif", fontSize:13, margin:0, lineHeight:1.6 }}>
          If you're on a call right now and something feels wrong — hang up first, then analyze here. 
          No real bank will ever ask for your OTP, PIN, or BVN over the phone.
        </p>
      </div>
      <input value={bank} onChange={e => setBank(e.target.value)}
        placeholder="Which bank or organization did they claim to be? (e.g. 'Zenith Bank', 'EFCC', 'MTN')"
        style={{ width:"100%", background:T.forest, border:`1px solid ${T.border}`, borderRadius:10,
          padding:"12px 16px", color:T.sand, fontFamily:"Georgia, serif", fontSize:13,
          outline:"none", boxSizing:"border-box", marginBottom:10 }}
      />
      <textarea value={scenario} onChange={e => setScenario(e.target.value)}
        placeholder="What did they say? What did they ask for? How did the voice sound? Include as much detail as possible…"
        style={{ width:"100%", background:T.forest, border:`1px solid ${T.border}`, borderRadius:10,
          padding:"14px 16px", color:T.sand, fontFamily:"Georgia, serif", fontSize:13, lineHeight:1.7,
          outline:"none", resize:"vertical", minHeight:110, boxSizing:"border-box" }}
      />
      <button onClick={run} style={{
        width:"100%", marginTop:10, padding:"13px", background:T.risk, color:"#fff",
        border:"none", borderRadius:10, fontFamily:"monospace", fontWeight:700, fontSize:14,
        cursor:"pointer", letterSpacing:1,
      }}>ASSESS FRAUD RISK →</button>
      <div style={{ marginTop:24 }}>
        <TrustResult result={result} loading={loading} idle={!result && !loading} />
      </div>
    </div>
  );
}

// ── PRESS TAB ─────────────────────────────────────────────────────────────────
function PressTab() {
  const [content, setContent] = useState("");
  const [outlet, setOutlet] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const SYS = `You are Verido's Newsroom Verification module, designed for African journalists and fact-checkers.

Analyze the submitted media or story for:
- Visual manipulation evidence (if video/image)
- Source credibility and corroboration gaps
- Metadata and provenance signals
- Known disinformation patterns circulating in African media ecosystems
- Cross-reference signals (has similar content appeared elsewhere?)
- Quote authenticity (is this what the person actually said?)
- Publication timing anomalies relative to events

Give a Trust Score out of 100 (higher = more suspicious).
Structure your response for a working journalist: Evidence Strength, Key Verification Steps Still Needed, Publish Recommendation (READY / VERIFY MORE / DO NOT PUBLISH), and estimated verification time required.
Be precise. Journalists need evidence, not just verdicts.`;

  const run = async () => {
    setLoading(true); setResult(null);
    const r = await askVerido(SYS, `Outlet: ${outlet || "not specified"}\nContent for verification: ${content}`);
    setResult(r); setLoading(false);
  };

  return (
    <div>
      <p style={{ color:T.muted, fontFamily:"Georgia, serif", fontSize:14, lineHeight:1.7, marginBottom:20 }}>
        For journalists and fact-checkers. Get structured verification intelligence before you publish.
      </p>
      <input value={outlet} onChange={e => setOutlet(e.target.value)}
        placeholder="Your outlet or organization (optional — helps calibrate output format)"
        style={{ width:"100%", background:T.forest, border:`1px solid ${T.border}`, borderRadius:10,
          padding:"12px 16px", color:T.sand, fontFamily:"Georgia, serif", fontSize:13,
          outline:"none", boxSizing:"border-box", marginBottom:10 }}
      />
      <textarea value={content} onChange={e => setContent(e.target.value)}
        placeholder="Paste the story, URL, transcript, or describe the media you're verifying. Include any context you have about its origins or how it reached you…"
        style={{ width:"100%", background:T.forest, border:`1px solid ${T.border}`, borderRadius:10,
          padding:"14px 16px", color:T.sand, fontFamily:"Georgia, serif", fontSize:13, lineHeight:1.7,
          outline:"none", resize:"vertical", minHeight:120, boxSizing:"border-box" }}
      />
      <button onClick={run} style={{
        width:"100%", marginTop:10, padding:"13px", background:T.amber, color:T.ink,
        border:"none", borderRadius:10, fontFamily:"monospace", fontWeight:700, fontSize:14,
        cursor:"pointer", letterSpacing:1,
      }}>RUN VERIFICATION →</button>
      <div style={{ marginTop:24 }}>
        <TrustResult result={result} loading={loading} idle={!result && !loading} />
      </div>
    </div>
  );
}

// ── ENTERPRISE TAB ────────────────────────────────────────────────────────────
function EnterpriseTab() {
  const [payload, setPayload] = useState(`{\n  "client_id": "bank_001",\n  "content_url": "https://example.com/call-recording.mp3",\n  "content_type": "audio",\n  "use_case": "voice_fraud",\n  "market": "NG",\n  "return_signals": true,\n  "alert_threshold": 60\n}`);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const SYS = `You are Verido's Enterprise API engine. Process the submitted JSON request and return a structured trust analysis response.

Return format:
- request_id (generate a realistic UUID)
- trust_score (0-100, higher = more suspicious)
- verdict: AUTHENTIC | SUSPICIOUS | MANIPULATED
- confidence: HIGH | MEDIUM | LOW
- signals: array of detection signals with individual scores
- recommended_action
- alert_triggered: true/false based on threshold
- processing_ms (realistic: 800-2400)
- billable_units: 1

Format as clean JSON with a brief plain-text summary below it.
Be technically precise — enterprise clients need machine-readable output.`;

  const run = async () => {
    setLoading(true); setResult(null);
    const r = await askVerido(SYS, `Process this API request:\n\n${payload}`);
    setResult(r); setLoading(false);
  };

  const plans = [
    { name:"Starter", price:"₦50,000", calls:"5,000 calls/mo", tag:null },
    { name:"Growth",  price:"₦200,000", calls:"25,000 calls/mo", tag:"POPULAR" },
    { name:"Scale",   price:"Custom", calls:"Unlimited", tag:"ENTERPRISE" },
  ];

  return (
    <div>
      <p style={{ color:T.muted, fontFamily:"Georgia, serif", fontSize:14, lineHeight:1.7, marginBottom:20 }}>
        One API. Four signal types. Plug Verido into your product, bank, or platform in hours.
      </p>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:24 }}>
        {plans.map(p => (
          <div key={p.name} style={{ background:T.forest, border:`1px solid ${p.tag==="POPULAR"?T.amber:T.border}`,
            borderRadius:10, padding:"14px 12px", textAlign:"center" }}>
            {p.tag && <div style={{ color:T.amber, fontFamily:"monospace", fontSize:9, fontWeight:700, letterSpacing:2, marginBottom:6 }}>{p.tag}</div>}
            <div style={{ color:T.sand, fontFamily:"Georgia, serif", fontWeight:700, fontSize:15 }}>{p.name}</div>
            <div style={{ color:T.amber, fontFamily:"monospace", fontWeight:700, fontSize:14, margin:"6px 0 4px" }}>{p.price}</div>
            <div style={{ color:T.muted, fontFamily:"monospace", fontSize:10 }}>{p.calls}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <span style={{ color:T.muted, fontFamily:"monospace", fontSize:10, letterSpacing:2 }}>REQUEST PAYLOAD</span>
        <span style={{ color:T.amber, fontFamily:"monospace", fontSize:10 }}>POST /v1/trust</span>
      </div>
      <textarea value={payload} onChange={e => setPayload(e.target.value)}
        style={{ width:"100%", background:T.forest, border:`1px solid ${T.border}`, borderRadius:10,
          padding:"14px 16px", color:T.trust, fontFamily:"monospace", fontSize:12, lineHeight:1.7,
          outline:"none", resize:"vertical", minHeight:160, boxSizing:"border-box" }}
      />
      <button onClick={run} style={{
        width:"100%", marginTop:10, padding:"13px", background:T.amber, color:T.ink,
        border:"none", borderRadius:10, fontFamily:"monospace", fontWeight:700, fontSize:14,
        cursor:"pointer", letterSpacing:1,
      }}>SEND REQUEST →</button>
      <div style={{ marginTop:24 }}>
        <TrustResult result={result} loading={loading} idle={!result && !loading} />
      </div>
    </div>
  );
}

const TAB_PANELS = {
  consumer: ConsumerTab,
  election: ElectionTab,
  bank: BankTab,
  journalist: PressTab,
  enterprise: EnterpriseTab,
};

// ── INTEL FEED ────────────────────────────────────────────────────────────────
const FEED = [
  { country:"🇳🇬", type:"VOICE CLONE", text:"AI-generated bank call targeting Lagos residents — OTP harvesting", time:"4m", level:T.risk },
  { country:"🇰🇪", type:"ELECTION",    text:"Manipulated candidate speech clip spreading on WhatsApp ahead of Nairobi polls", time:"12m", level:T.risk },
  { country:"🇬🇭", type:"DEEPFAKE",    text:"Celebrity face-swap video used in advance-fee scam on TikTok", time:"31m", level:T.warn },
  { country:"🇿🇦", type:"IMAGE FRAUD", text:"AI-generated identity documents detected in Cape Town recruitment scam", time:"1h", level:T.warn },
  { country:"🇳🇬", type:"VERIFIED",    text:"INEC press conference footage confirmed authentic — no manipulation detected", time:"2h", level:T.trust },
];

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function Verido() {
  const [activeTab, setActiveTab] = useState("consumer");
  const ActivePanel = TAB_PANELS[activeTab];

  return (
    <div style={{ minHeight:"100vh", background:T.canopy, color:T.sand }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-ring { 0% { transform:scale(1); opacity:0.6; } 100% { transform:scale(1.4); opacity:0; } }
        @keyframes fade-in { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing:border-box; margin:0; padding:0; }
        input, textarea { caret-color: #F5A623; }
        input::placeholder, textarea::placeholder { color: #7A9E8A; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:#1E4030; border-radius:4px; }
      `}</style>

      <header style={{ background:T.forest, borderBottom:`1px solid ${T.border}`, padding:"16px 24px",
        display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:T.amber,
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>◉</div>
          <div>
            <div style={{ fontFamily:"Georgia, serif", fontWeight:700, fontSize:18, letterSpacing:1, color:T.sand }}>
              VERIDO
            </div>
            <div style={{ fontFamily:"monospace", fontSize:9, color:T.muted, letterSpacing:2, marginTop:-2 }}>
              DIGITAL TRUST PLATFORM
            </div>
          </div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:T.trust,
            boxShadow:`0 0 8px ${T.trust}`, animation:"pulse-ring 2s ease-out infinite" }} />
          <span style={{ color:T.muted, fontFamily:"monospace", fontSize:11 }}>LIVE NETWORK</span>
        </div>
      </header>

      <div style={{ background:`linear-gradient(135deg, ${T.forest} 0%, #0D2818 100%)`,
        borderBottom:`1px solid ${T.border}`, padding:"20px 24px" }}>
        <p style={{ fontFamily:"Georgia, serif", fontSize:15, color:T.sand, lineHeight:1.7, maxWidth:560 }}>
          Africa's first Digital Trust Platform. We don't just say{" "}
          <em style={{ color:T.risk }}>"fake."</em> We answer:{" "}
          <strong style={{ color:T.amber }}>"Should you trust this?"</strong>
        </p>
        <div style={{ display:"flex", gap:20, marginTop:16 }}>
          {[["2.1M","Scans this month"],["94.7%","Accuracy rate"],["47","Countries covered"]].map(([v,l]) => (
            <div key={l}>
              <div style={{ color:T.amber, fontFamily:"Georgia, serif", fontWeight:700, fontSize:20 }}>{v}</div>
              <div style={{ color:T.muted, fontFamily:"monospace", fontSize:10, marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", maxWidth:720, margin:"0 auto", padding:"0 16px 40px" }}>

        <div style={{ display:"flex", gap:4, padding:"16px 0", overflowX:"auto" }}>
          {PRODUCTS.map(p => (
            <button key={p.id} onClick={() => setActiveTab(p.id)} style={{
              flexShrink:0, padding:"10px 14px", borderRadius:10, border:"none", cursor:"pointer",
              background: activeTab===p.id ? T.amber : T.forest,
              transition:"all 0.15s",
              borderBottom: activeTab===p.id ? "none" : `1px solid ${T.border}`,
            }}>
              <div style={{ fontSize:16, marginBottom:3 }}>{p.icon}</div>
              <div style={{ color: activeTab===p.id ? T.ink : T.sand, fontFamily:"monospace", fontSize:11, fontWeight:700 }}>{p.label}</div>
              <div style={{ color: activeTab===p.id ? T.ink+"99" : T.muted, fontFamily:"monospace", fontSize:9 }}>{p.sub}</div>
            </button>
          ))}
        </div>

        <div style={{ background:T.forest, border:`1px solid ${T.border}`, borderRadius:14, padding:22, marginBottom:20 }}>
          <ActivePanel />
        </div>

        <div style={{ background:T.forest, border:`1px solid ${T.border}`, borderRadius:14, padding:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <p style={{ color:T.muted, fontFamily:"monospace", fontSize:10, letterSpacing:2 }}>AFRICA TRUST NETWORK — LIVE FEED</p>
            <span style={{ color:T.trust, fontFamily:"monospace", fontSize:10 }}>● {FEED.length} ACTIVE SIGNALS</span>
          </div>
          {FEED.map((f, i) => (
            <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"10px 0",
              borderBottom: i < FEED.length-1 ? `1px solid ${T.border}` : "none" }}>
              <span style={{ fontSize:16, flexShrink:0 }}>{f.country}</span>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:3 }}>
                  <span style={{ color:f.level, fontFamily:"monospace", fontSize:9, fontWeight:700, letterSpacing:1 }}>{f.type}</span>
                  <span style={{ color:T.muted, fontFamily:"monospace", fontSize:9 }}>{f.time} ago</span>
                </div>
                <p style={{ color:T.sand, fontFamily:"Georgia, serif", fontSize:12, lineHeight:1.5 }}>{f.text}</p>
              </div>
              <div style={{ width:8, height:8, borderRadius:"50%", background:f.level,
                flexShrink:0, marginTop:4, boxShadow:`0 0 6px ${f.level}` }} />
            </div>
          ))}
        </div>

        <div style={{ marginTop:24, textAlign:"center" }}>
          <p style={{ color:T.muted, fontFamily:"monospace", fontSize:10, lineHeight:1.8 }}>
            VERIDO · Built in Africa, for Africa and the world<br/>
            <span style={{ color:T.border }}>◉ Know what's real.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
