import { useState, useReducer } from "react";

/* ─── PAID TRAINING SUBTYPES from playbook ─── */
const PAID_TRAINING_SUBTYPES = [
  "Full System Onboarding",
  "CACFP Compliance Deep Dive",
  "Claiming & Error Resolution",
  "Menu & Food Production",
  "Attendance & Meal Count Alignment",
  "Advanced Reporting",
  "Sponsor-Level Management",
  "State-Specific Training",
  "Workflow Optimization",
  "Parachute (Accounting & Receipts)",
  "Custom Training Request",
];

const DELIVERY_FORMATS = [
  "1:1 Session",
  "Group Training",
  "Recorded Session",
  "Hands-On Walkthrough",
];

const TYPES = ["Paid Training", "One Pager", "Video", "Webinar"];
const STATUSES = ["Not Started", "In Progress", "In Review", "Complete"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

const TYPE_CONFIG = {
  "Paid Training": { icon: "🎓", gradient: "linear-gradient(135deg, #FF6B6B, #EE5A24)", color: "#EE5A24" },
  "One Pager": { icon: "📄", gradient: "linear-gradient(135deg, #0ABDE3, #0984E3)", color: "#0984E3" },
  Video: { icon: "🎬", gradient: "linear-gradient(135deg, #F368E0, #BE2EDD)", color: "#BE2EDD" },
  Webinar: { icon: "📡", gradient: "linear-gradient(135deg, #FF9F43, #EE5A24)", color: "#EE5A24" },
};

const STATUS_STYLE = {
  "Not Started": { bg: "#FFF3E0", text: "#E65100", glow: "#FF9800" },
  "In Progress": { bg: "#E3F2FD", text: "#1565C0", glow: "#42A5F5" },
  "In Review": { bg: "#F3E5F5", text: "#7B1FA2", glow: "#AB47BC" },
  Complete: { bg: "#E8F5E9", text: "#2E7D32", glow: "#66BB6A" },
};

const PRIORITY_COLORS = { Low: "#78909C", Medium: "#FFB300", High: "#FF5252", Urgent: "#D50000" };

const INITIAL_REQUESTS = [
  {
    id: 1, type: "Paid Training", subtype: "Full System Onboarding", title: "New Center Onboarding – Little Stars Academy",
    requester: "Jamie R.", requesterEmail: "jamie.r@kidkare.com", date: "2026-04-10", deadline: "2026-05-01",
    status: "In Progress", priority: "High", deliveryFormat: "1:1 Session",
    description: "Full system onboarding for a new independent center. Cover account setup, child enrollment (they have 45 kids to import via CSV), menu planning, attendance tracking, and first claim submission. They've never used CACFP software before.",
    audience: "Center director + 2 staff members", notes: "Contact prefers morning sessions. Has CSV ready for import.", hubspotDealId: "", hubspotContactId: ""
  },
  {
    id: 2, type: "One Pager", subtype: "", title: "60-Day Receipt Rule Quick Guide",
    requester: "Morgan T.", requesterEmail: "morgan.t@kidkare.com", date: "2026-04-08", deadline: "2026-04-18",
    status: "Not Started", priority: "Medium", deliveryFormat: "",
    description: "A one-page visual guide explaining the 60-day receipt rule for providers. Should include examples of compliant vs non-compliant scenarios and a timeline graphic.",
    audience: "CACFP Providers", notes: "Morgan wants Canva-designed, brand colors", hubspotDealId: "", hubspotContactId: ""
  },
  {
    id: 3, type: "Video", subtype: "", title: "How to Submit Your First Claim",
    requester: "Alex P.", requesterEmail: "alex.p@kidkare.com", date: "2026-04-05", deadline: "2026-04-25",
    status: "In Progress", priority: "High", deliveryFormat: "Recorded Session",
    description: "Step-by-step screen recording walking providers through their first claim submission in KidKare. Cover meal entry, attendance verification, error checking, and final submission.",
    audience: "New independent center users", notes: "Script drafted, recording scheduled for 4/16", hubspotDealId: "", hubspotContactId: ""
  },
  {
    id: 4, type: "Webinar", subtype: "", title: "Menu Monday Deep Dive: Spring Menus",
    requester: "Self", requesterEmail: "", date: "2026-04-01", deadline: "2026-04-14",
    status: "Complete", priority: "Low", deliveryFormat: "Group Training",
    description: "Live webinar covering seasonal spring menu planning that meets CACFP meal pattern requirements. Include vegetable/fruit variety tips and creditable food combos.",
    audience: "Facebook community + registered attendees", notes: "Certificate form sent, 47 attendees", hubspotDealId: "", hubspotContactId: ""
  },
  {
    id: 5, type: "Paid Training", subtype: "Claiming & Error Resolution", title: "Error Resolution Workshop – Sunshine Sponsors",
    requester: "Dana K.", requesterEmail: "dana.k@kidkare.com", date: "2026-03-28", deadline: "2026-04-20",
    status: "In Progress", priority: "High", deliveryFormat: "Group Training",
    description: "Group training for sponsor staff who keep hitting Error 60 and Error 91 during claim submission. Cover how KidKare calculates claims, fixing errors, recalculating, and which reports to run for validation.",
    audience: "Sponsor claims staff (6 people)", notes: "They had 3 months of disallowances", hubspotDealId: "", hubspotContactId: ""
  },
  {
    id: 6, type: "Paid Training", subtype: "Parachute (Accounting & Receipts)", title: "Parachute Setup & Receipt Training",
    requester: "Chris L.", requesterEmail: "chris.l@kidkare.com", date: "2026-04-12", deadline: "2026-04-28",
    status: "Not Started", priority: "Medium", deliveryFormat: "Hands-On Walkthrough",
    description: "Hands-on walkthrough of Parachute for a center that just started using receipt capture. Cover daily vs weekly receipt strategies, the 60-day rule, and audit prep basics.",
    audience: "Center bookkeeper + director", notes: "", hubspotDealId: "", hubspotContactId: ""
  },
  {
    id: 7, type: "Paid Training", subtype: "Sponsor-Level Management", title: "Multi-Site Oversight Training",
    requester: "Sam W.", requesterEmail: "sam.w@kidkare.com", date: "2026-04-11", deadline: "2026-05-05",
    status: "Not Started", priority: "Medium", deliveryFormat: "1:1 Session",
    description: "Sponsor managing 14 centers needs training on bulk actions, oversight tools, backdating policies, permissions management, and monitoring compliance across all sites.",
    audience: "Sponsor administrator", notes: "Prefers afternoon sessions, has used KidKare for 2 years but never used bulk tools", hubspotDealId: "", hubspotContactId: ""
  },
];

function reducer(state, action) {
  switch (action.type) {
    case "SET_TAB": return { ...state, activeTab: action.payload };
    case "SET_FILTER_TYPE": return { ...state, filterType: action.payload };
    case "SET_FILTER_STATUS": return { ...state, filterStatus: action.payload };
    case "SET_SORT": return { ...state, sortBy: action.payload };
    case "ADD_REQUEST": return { ...state, requests: [action.payload, ...state.requests], activeTab: "dashboard" };
    case "UPDATE_STATUS": return { ...state, requests: state.requests.map(r => r.id === action.payload.id ? { ...r, status: action.payload.status } : r) };
    case "DELETE_REQUEST": return { ...state, requests: state.requests.filter(r => r.id !== action.payload) };
    default: return state;
  }
}

/* ─── COMPONENTS ─── */

function GlowCard({ children, style, hoverScale = true }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff", borderRadius: 18, transition: "all 0.25s cubic-bezier(.4,0,.2,1)",
        transform: hovered && hoverScale ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered ? "0 8px 30px rgba(0,0,0,0.10)" : "0 2px 8px rgba(0,0,0,0.04)",
        ...style,
      }}
    >{children}</div>
  );
}

function StatCard({ label, value, icon, gradient }) {
  return (
    <GlowCard style={{ overflow: "hidden", position: "relative" }}>
      <div style={{ padding: "20px 22px", display: "flex", alignItems: "center", gap: 14, position: "relative", zIndex: 1 }}>
        <div style={{
          width: 50, height: 50, borderRadius: 14, background: gradient,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, boxShadow: "0 4px 14px rgba(0,0,0,0.12)"
        }}>{icon}</div>
        <div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#1a1a2e", fontFamily: "var(--font-display)", lineHeight: 1 }}>{value}</div>
          <div style={{ fontSize: 12, color: "#8E8EA0", fontFamily: "var(--font-body)", marginTop: 3, fontWeight: 500 }}>{label}</div>
        </div>
      </div>
      <div style={{
        position: "absolute", top: -20, right: -20, width: 80, height: 80,
        borderRadius: "50%", background: gradient, opacity: 0.06,
      }} />
    </GlowCard>
  );
}

function TypePill({ type, count, active, onClick }) {
  const cfg = TYPE_CONFIG[type];
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 8, padding: "8px 16px",
      borderRadius: 30, border: "none", cursor: "pointer",
      background: active ? cfg.gradient : "#F4F4F8",
      color: active ? "#fff" : "#666",
      fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600,
      transition: "all 0.2s", boxShadow: active ? `0 4px 14px ${cfg.color}44` : "none",
    }}>
      <span style={{ fontSize: 16 }}>{cfg.icon}</span>
      <span>{type}</span>
      <span style={{
        background: active ? "rgba(255,255,255,0.3)" : "#E0E0E8",
        borderRadius: 10, padding: "1px 8px", fontSize: 11, fontWeight: 700,
      }}>{count}</span>
    </button>
  );
}

function Badge({ status }) {
  const s = STATUS_STYLE[status];
  return (
    <span style={{
      padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: s.bg, color: s.text, fontFamily: "var(--font-body)",
      boxShadow: `0 0 0 1px ${s.glow}33`,
    }}>{status}</span>
  );
}

function PriorityDot({ priority }) {
  return (
    <span title={priority} style={{
      width: 10, height: 10, borderRadius: "50%",
      background: PRIORITY_COLORS[priority],
      display: "inline-block", boxShadow: `0 0 6px ${PRIORITY_COLORS[priority]}66`,
    }} />
  );
}

function RequestCard({ request, onStatusChange, onDelete, expanded, onExpand }) {
  const daysLeft = Math.ceil((new Date(request.deadline) - new Date()) / 86400000);
  const overdue = daysLeft < 0 && request.status !== "Complete";
  const cfg = TYPE_CONFIG[request.type];

  return (
    <GlowCard style={{
      overflow: "hidden",
      border: overdue ? "2px solid #FF525244" : "1px solid #F0F0F5",
    }} hoverScale={!expanded}>
      <div onClick={onExpand} style={{
        padding: "18px 22px", cursor: "pointer",
        display: "flex", alignItems: "flex-start", gap: 14,
        borderLeft: `4px solid ${cfg.color}`,
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12, background: cfg.gradient,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, flexShrink: 0, boxShadow: `0 3px 10px ${cfg.color}33`,
        }}>{cfg.icon}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, color: "#1a1a2e" }}>
              {request.title}
            </span>
            <Badge status={request.status} />
            <PriorityDot priority={request.priority} />
          </div>
          <div style={{ display: "flex", gap: 14, fontSize: 12, color: "#8E8EA0", fontFamily: "var(--font-body)", flexWrap: "wrap" }}>
            <span>👤 <strong style={{ color: "#555" }}>{request.requester}</strong></span>
            <span style={{
              background: cfg.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              fontWeight: 700, fontSize: 11,
            }}>{request.type}{request.subtype ? ` → ${request.subtype}` : ""}</span>
            {request.deliveryFormat && <span>📦 {request.deliveryFormat}</span>}
            <span style={{ color: overdue ? "#D50000" : request.status === "Complete" ? "#2E7D32" : "#8E8EA0", fontWeight: overdue ? 700 : 400 }}>
              {request.status === "Complete" ? "✓ Done" : overdue ? `⚠ ${Math.abs(daysLeft)}d overdue` : `📅 ${daysLeft}d left`}
            </span>
          </div>
        </div>
        <div style={{
          fontSize: 16, color: "#C0C0CC", transition: "transform 0.25s",
          transform: expanded ? "rotate(180deg)" : "rotate(0deg)", marginTop: 4,
        }}>▾</div>
      </div>

      {expanded && (
        <div style={{
          padding: "0 22px 20px 22px", borderTop: "1px solid #F0F0F5", paddingTop: 18,
          background: "linear-gradient(180deg, #FAFAFE 0%, #fff 100%)",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <DetailBlock label="Description" value={request.description} full />
            <DetailBlock label="Audience" value={request.audience} />
            {request.notes && <DetailBlock label="Notes" value={request.notes} />}
            {request.subtype && <DetailBlock label="Training Subtype" value={request.subtype} />}
            {request.deliveryFormat && <DetailBlock label="Delivery Format" value={request.deliveryFormat} />}
            {request.requesterEmail && <DetailBlock label="Requester Email" value={request.requesterEmail} />}
          </div>

          {/* HubSpot IDs */}
          <div style={{
            background: "#FFF8E1", borderRadius: 10, padding: "10px 14px", marginBottom: 16,
            display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "#F57F17",
            fontFamily: "var(--font-body)", border: "1px dashed #FFD54F",
          }}>
            <span>🔗</span>
            <span>HubSpot Deal: {request.hubspotDealId || "Not linked"} · Contact: {request.hubspotContactId || "Not linked"}</span>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "#8E8EA0", fontFamily: "var(--font-body)" }}>Move to:</span>
            {STATUSES.map(s => {
              const active = request.status === s;
              return (
                <button key={s} onClick={() => onStatusChange(request.id, s)} style={{
                  padding: "6px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                  border: active ? `2px solid ${STATUS_STYLE[s].glow}` : "1px solid #E8E8F0",
                  background: active ? STATUS_STYLE[s].bg : "#fff",
                  color: active ? STATUS_STYLE[s].text : "#999",
                  cursor: active ? "default" : "pointer",
                  fontFamily: "var(--font-body)", transition: "all 0.15s",
                }}>{s}</button>
              );
            })}
            <div style={{ flex: 1 }} />
            <button onClick={() => onDelete(request.id)} style={{
              padding: "6px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600,
              border: "1px solid #FFCDD2", background: "#FFF5F5", color: "#D50000",
              cursor: "pointer", fontFamily: "var(--font-body)",
            }}>Remove</button>
          </div>
        </div>
      )}
    </GlowCard>
  );
}

function DetailBlock({ label, value, full }) {
  return (
    <div style={{ gridColumn: full ? "1 / -1" : "auto" }}>
      <div style={{
        fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em",
        color: "#AEAEB8", marginBottom: 4, fontFamily: "var(--font-body)", fontWeight: 700,
      }}>{label}</div>
      <div style={{ fontSize: 13, color: "#333", lineHeight: 1.6, fontFamily: "var(--font-body)" }}>{value}</div>
    </div>
  );
}

/* ─── REQUEST FORM ─── */
function RequestForm({ onSubmit }) {
  const [form, setForm] = useState({
    type: "", subtype: "", title: "", requester: "", requesterEmail: "",
    deadline: "", priority: "", deliveryFormat: "", description: "", audience: "", notes: "",
    hubspotDealId: "", hubspotContactId: "",
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.type) e.type = "Required";
    if (!form.title.trim() || form.title.trim().length < 5) e.title = "Title needs at least 5 characters";
    if (!form.requester.trim()) e.requester = "Required";
    if (!form.requesterEmail.trim() || !form.requesterEmail.includes("@")) e.requesterEmail = "Valid email required";
    if (!form.deadline) e.deadline = "Required";
    if (!form.priority) e.priority = "Required";
    if (!form.description.trim() || form.description.trim().length < 30) e.description = "Be more detailed — at least 30 characters";
    if (!form.audience.trim()) e.audience = "Required";
    if (form.type === "Paid Training" && !form.subtype) e.subtype = "Select training type";
    if (form.type === "Paid Training" && !form.deliveryFormat) e.deliveryFormat = "Select delivery format";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({ ...form, id: Date.now(), date: new Date().toISOString().slice(0, 10), status: "Not Started" });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setForm({ type: "", subtype: "", title: "", requester: "", requesterEmail: "", deadline: "", priority: "", deliveryFormat: "", description: "", audience: "", notes: "", hubspotDealId: "", hubspotContactId: "" });
    }, 2000);
  };

  const inputStyle = (name) => ({
    width: "100%", padding: "11px 14px", borderRadius: 12, fontSize: 14,
    border: errors[name] ? "2px solid #FF5252" : "1.5px solid #E8E8F0",
    fontFamily: "var(--font-body)", background: "#FAFAFF", color: "#1a1a2e",
    outline: "none", boxSizing: "border-box", transition: "border 0.2s, box-shadow 0.2s",
  });

  const labelStyle = {
    display: "block", fontSize: 11, fontWeight: 700, color: "#AEAEB8",
    marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-body)",
  };

  if (submitted) {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center", padding: "80px 24px" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800, color: "#1a1a2e", marginBottom: 8 }}>
          Request Submitted!
        </h2>
        <p style={{ color: "#8E8EA0", fontFamily: "var(--font-body)" }}>Redirecting to dashboard…</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 660, margin: "0 auto" }}>
      <GlowCard style={{ padding: "36px 32px", border: "1px solid #E8E8F0" }} hoverScale={false}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "linear-gradient(135deg, #FF6B6B, #F368E0)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
          }}>✨</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800, color: "#1a1a2e", margin: 0 }}>
            Submit a Request
          </h2>
        </div>
        <p style={{ fontSize: 13, color: "#8E8EA0", marginBottom: 28, fontFamily: "var(--font-body)", lineHeight: 1.6 }}>
          Need a training, one pager, video, or webinar? Fill out every detail below so I can deliver exactly what you need.
        </p>

        {/* Type selection as cards */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>What do you need? *</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {TYPES.map(t => {
              const cfg = TYPE_CONFIG[t];
              const active = form.type === t;
              return (
                <button key={t} onClick={() => set("type", t)} style={{
                  padding: "16px 10px", borderRadius: 14, border: "none", cursor: "pointer",
                  background: active ? cfg.gradient : "#F4F4F8",
                  color: active ? "#fff" : "#666",
                  fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  transition: "all 0.2s",
                  boxShadow: active ? `0 6px 20px ${cfg.color}44` : "0 1px 3px rgba(0,0,0,0.04)",
                  transform: active ? "scale(1.03)" : "scale(1)",
                }}>
                  <span style={{ fontSize: 24 }}>{cfg.icon}</span>
                  <span>{t}</span>
                </button>
              );
            })}
          </div>
          {errors.type && <div style={{ color: "#FF5252", fontSize: 12, marginTop: 6 }}>{errors.type}</div>}
        </div>

        {/* Paid Training specific fields */}
        {form.type === "Paid Training" && (
          <div style={{
            background: "linear-gradient(135deg, #FFF5F5 0%, #FFF0F6 100%)",
            borderRadius: 14, padding: "18px 18px", marginBottom: 20,
            border: "1px dashed #FFB3B3",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#EE5A24", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              🎓 Paid Training Details
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={labelStyle}>Training Type *</label>
                <select value={form.subtype} onChange={e => set("subtype", e.target.value)} style={{ ...inputStyle("subtype"), cursor: "pointer" }}>
                  <option value="">Select type…</option>
                  {PAID_TRAINING_SUBTYPES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.subtype && <div style={{ color: "#FF5252", fontSize: 12, marginTop: 4 }}>{errors.subtype}</div>}
              </div>
              <div>
                <label style={labelStyle}>Delivery Format *</label>
                <select value={form.deliveryFormat} onChange={e => set("deliveryFormat", e.target.value)} style={{ ...inputStyle("deliveryFormat"), cursor: "pointer" }}>
                  <option value="">Select format…</option>
                  {DELIVERY_FORMATS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {errors.deliveryFormat && <div style={{ color: "#FF5252", fontSize: 12, marginTop: 4 }}>{errors.deliveryFormat}</div>}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
          <div>
            <label style={labelStyle}>Priority *</label>
            <select value={form.priority} onChange={e => set("priority", e.target.value)} style={{ ...inputStyle("priority"), cursor: "pointer" }}>
              <option value="">Choose…</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            {errors.priority && <div style={{ color: "#FF5252", fontSize: 12, marginTop: 4 }}>{errors.priority}</div>}
          </div>
          <div>
            <label style={labelStyle}>Needed By *</label>
            <input type="date" value={form.deadline} onChange={e => set("deadline", e.target.value)} style={inputStyle("deadline")} />
            {errors.deadline && <div style={{ color: "#FF5252", fontSize: 12, marginTop: 4 }}>{errors.deadline}</div>}
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Title *</label>
          <input value={form.title} onChange={e => set("title", e.target.value)}
            placeholder="e.g. CACFP Claim Walkthrough for New Sponsor Staff"
            style={inputStyle("title")} />
          {errors.title && <div style={{ color: "#FF5252", fontSize: 12, marginTop: 4 }}>{errors.title}</div>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
          <div>
            <label style={labelStyle}>Your Name *</label>
            <input value={form.requester} onChange={e => set("requester", e.target.value)}
              placeholder="e.g. Jamie R." style={inputStyle("requester")} />
            {errors.requester && <div style={{ color: "#FF5252", fontSize: 12, marginTop: 4 }}>{errors.requester}</div>}
          </div>
          <div>
            <label style={labelStyle}>Your Email *</label>
            <input type="email" value={form.requesterEmail} onChange={e => set("requesterEmail", e.target.value)}
              placeholder="e.g. jamie@kidkare.com" style={inputStyle("requesterEmail")} />
            {errors.requesterEmail && <div style={{ color: "#FF5252", fontSize: 12, marginTop: 4 }}>{errors.requesterEmail}</div>}
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Detailed Description * <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(min 30 chars)</span></label>
          <textarea value={form.description} onChange={e => set("description", e.target.value)}
            placeholder="Be specific: What topics should be covered? Which KidKare features are involved? Any CACFP compliance rules to address? What format do you prefer? What does success look like?"
            rows={5} style={{ ...inputStyle("description"), resize: "vertical" }} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            {errors.description ? <div style={{ color: "#FF5252", fontSize: 12 }}>{errors.description}</div> : <div />}
            <div style={{
              fontSize: 11, fontWeight: 600, fontFamily: "var(--font-body)",
              color: form.description.trim().length >= 30 ? "#2E7D32" : "#BFBFC8",
            }}>{form.description.trim().length}/30 min</div>
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Target Audience *</label>
          <input value={form.audience} onChange={e => set("audience", e.target.value)}
            placeholder="e.g. New providers, sponsor claims staff, SFA admins"
            style={inputStyle("audience")} />
          {errors.audience && <div style={{ color: "#FF5252", fontSize: 12, marginTop: 4 }}>{errors.audience}</div>}
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Additional Notes <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
          <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
            placeholder="Links, reference materials, scheduling preferences, anything helpful…"
            rows={2} style={{ ...inputStyle("notes"), resize: "vertical" }} />
        </div>

        {/* HubSpot section */}
        <div style={{
          background: "#FFF8E1", borderRadius: 14, padding: "16px 18px", marginBottom: 24,
          border: "1px dashed #FFD54F",
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#F57F17", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            🔗 HubSpot Link (optional — for tracking)
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ ...labelStyle, color: "#C49000" }}>Deal ID</label>
              <input value={form.hubspotDealId} onChange={e => set("hubspotDealId", e.target.value)}
                placeholder="e.g. 12345678" style={{ ...inputStyle("hubspotDealId"), background: "#FFFEF5" }} />
            </div>
            <div>
              <label style={{ ...labelStyle, color: "#C49000" }}>Contact ID</label>
              <input value={form.hubspotContactId} onChange={e => set("hubspotContactId", e.target.value)}
                placeholder="e.g. 87654321" style={{ ...inputStyle("hubspotContactId"), background: "#FFFEF5" }} />
            </div>
          </div>
        </div>

        <button onClick={handleSubmit} style={{
          width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
          background: "linear-gradient(135deg, #FF6B6B, #F368E0, #0ABDE3)",
          backgroundSize: "200% 200%",
          color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer",
          fontFamily: "var(--font-display)", letterSpacing: "0.02em",
          boxShadow: "0 6px 20px rgba(243, 104, 224, 0.3)",
          transition: "all 0.3s",
        }}
          onMouseEnter={e => { e.target.style.backgroundPosition = "100% 0"; e.target.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.target.style.backgroundPosition = "0% 0"; e.target.style.transform = "translateY(0)"; }}
        >
          🚀 Submit Request
        </button>
      </GlowCard>
    </div>
  );
}

/* ─── MAIN DASHBOARD ─── */
export default function KidKareDashboard() {
  const [state, dispatch] = useReducer(reducer, {
    requests: INITIAL_REQUESTS, activeTab: "dashboard",
    filterType: "All", filterStatus: "All", sortBy: "deadline",
  });
  const [expandedId, setExpandedId] = useState(null);
  const { requests, activeTab, filterType, filterStatus, sortBy } = state;

  const filtered = requests
    .filter(r => filterType === "All" ? true : r.type === filterType)
    .filter(r => filterStatus === "All" ? true : r.status === filterStatus)
    .sort((a, b) => {
      if (sortBy === "deadline") return new Date(a.deadline) - new Date(b.deadline);
      if (sortBy === "priority") return ({ Urgent: 0, High: 1, Medium: 2, Low: 3 })[a.priority] - ({ Urgent: 0, High: 1, Medium: 2, Low: 3 })[b.priority];
      return new Date(b.date) - new Date(a.date);
    });

  const counts = {
    total: requests.length,
    active: requests.filter(r => r.status !== "Complete").length,
    complete: requests.filter(r => r.status === "Complete").length,
    overdue: requests.filter(r => r.status !== "Complete" && new Date(r.deadline) < new Date()).length,
  };

  return (
    <div style={{
      "--font-display": "'Nunito', sans-serif",
      "--font-body": "'Nunito', sans-serif",
      minHeight: "100vh",
      background: "linear-gradient(170deg, #FFF5F5 0%, #F0F0FF 30%, #F5FFFA 60%, #FFFFF0 100%)",
      fontFamily: "var(--font-body)",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes shimmer { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        * { box-sizing: border-box; }
        select:focus, input:focus, textarea:focus { border-color: #F368E0 !important; box-shadow: 0 0 0 3px #F368E044 !important; outline: none; }
        button:active { transform: scale(0.97) !important; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{
        background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #F0E8FF", position: "sticky", top: 0, zIndex: 100,
        padding: "0 24px",
      }}>
        <div style={{
          maxWidth: 1000, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between", height: 64,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: "linear-gradient(135deg, #FF6B6B, #F368E0)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 18, fontWeight: 900,
              boxShadow: "0 4px 14px rgba(243, 104, 224, 0.3)",
            }}>K</div>
            <div>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 18, color: "#1a1a2e" }}>
                KidKare Training Hub
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, color: "#F368E0",
                background: "#FDF0FF", padding: "2px 8px", borderRadius: 6,
                marginLeft: 10, verticalAlign: "middle",
              }}>BETA</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 4, background: "#F4F4F8", borderRadius: 12, padding: 4 }}>
            {[
              { key: "dashboard", label: "📊 Dashboard" },
              { key: "submit", label: "✨ Submit Request" },
            ].map(tab => (
              <button key={tab.key} onClick={() => dispatch({ type: "SET_TAB", payload: tab.key })} style={{
                padding: "8px 20px", borderRadius: 10, border: "none",
                background: activeTab === tab.key ? "#fff" : "transparent",
                color: activeTab === tab.key ? "#1a1a2e" : "#8E8EA0",
                fontSize: 13, fontWeight: activeTab === tab.key ? 800 : 600,
                cursor: "pointer", fontFamily: "var(--font-body)",
                boxShadow: activeTab === tab.key ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                transition: "all 0.2s",
              }}>{tab.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 24px 60px" }}>
        {activeTab === "dashboard" && (
          <>
            {/* Stats Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
              <StatCard label="Total Requests" value={counts.total} icon="📋" gradient="linear-gradient(135deg, #667EEA, #764BA2)" />
              <StatCard label="Active" value={counts.active} icon="🔥" gradient="linear-gradient(135deg, #0ABDE3, #0984E3)" />
              <StatCard label="Completed" value={counts.complete} icon="🏆" gradient="linear-gradient(135deg, #00B894, #00CEC9)" />
              <StatCard label="Overdue" value={counts.overdue} icon={counts.overdue > 0 ? "🚨" : "😎"} gradient={counts.overdue > 0 ? "linear-gradient(135deg, #FF6B6B, #EE5A24)" : "linear-gradient(135deg, #B2BEC3, #636E72)"} />
            </div>

            {/* Type Filter Pills */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
              <button onClick={() => dispatch({ type: "SET_FILTER_TYPE", payload: "All" })} style={{
                padding: "8px 18px", borderRadius: 30, border: "none", cursor: "pointer",
                background: filterType === "All" ? "linear-gradient(135deg, #1a1a2e, #2d2d44)" : "#F4F4F8",
                color: filterType === "All" ? "#fff" : "#666",
                fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700,
                boxShadow: filterType === "All" ? "0 4px 14px rgba(26,26,46,0.25)" : "none",
              }}>All ({requests.length})</button>
              {TYPES.map(t => (
                <TypePill key={t} type={t} active={filterType === t}
                  count={requests.filter(r => r.type === t).length}
                  onClick={() => dispatch({ type: "SET_FILTER_TYPE", payload: t })} />
              ))}
              <div style={{ flex: 1 }} />

              {/* Status + Sort */}
              <select value={filterStatus} onChange={e => dispatch({ type: "SET_FILTER_STATUS", payload: e.target.value })} style={{
                padding: "8px 14px", borderRadius: 10, border: "1.5px solid #E8E8F0",
                fontSize: 12, fontFamily: "var(--font-body)", color: "#666",
                background: "#fff", cursor: "pointer", fontWeight: 600,
              }}>
                <option value="All">All Status</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={sortBy} onChange={e => dispatch({ type: "SET_SORT", payload: e.target.value })} style={{
                padding: "8px 14px", borderRadius: 10, border: "1.5px solid #E8E8F0",
                fontSize: 12, fontFamily: "var(--font-body)", color: "#666",
                background: "#fff", cursor: "pointer", fontWeight: 600,
              }}>
                <option value="deadline">Sort: Deadline</option>
                <option value="priority">Sort: Priority</option>
                <option value="newest">Sort: Newest</option>
              </select>
            </div>

            {/* Request List */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: "60px 24px", color: "#BFBFC8", fontSize: 15, fontFamily: "var(--font-body)" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                  No requests match your filters.
                </div>
              )}
              {filtered.map(r => (
                <RequestCard key={r.id} request={r}
                  expanded={expandedId === r.id}
                  onExpand={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  onStatusChange={(id, status) => dispatch({ type: "UPDATE_STATUS", payload: { id, status } })}
                  onDelete={id => dispatch({ type: "DELETE_REQUEST", payload: id })} />
              ))}
            </div>
          </>
        )}

        {activeTab === "submit" && (
          <RequestForm onSubmit={data => dispatch({ type: "ADD_REQUEST", payload: data })} />
        )}
      </div>
    </div>
  );
}
