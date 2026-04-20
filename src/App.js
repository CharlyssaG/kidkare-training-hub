import { useState, useReducer, useEffect, useCallback } from "react";

/* ─── SUPABASE CONFIG ───
   Replace these with your actual values from Supabase > Settings > API
*/
const SUPABASE_URL = "https://qgcvummntlhgkiyjrzri.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_r7saQs-eOb9PTMxUF2wPEQ_GijArEEb";

/* Simple Supabase client using fetch */
const supabase = {
  from: (table) => ({
    select: async () => {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&order=created_at.desc`, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      });
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      return res.json();
    },
    insert: async (row) => {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json", Prefer: "return=representation",
        },
        body: JSON.stringify(row),
      });
      if (!res.ok) throw new Error(`Insert failed: ${res.status}`);
      return res.json();
    },
    update: async (id, updates) => {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json", Prefer: "return=representation",
        },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(`Update failed: ${res.status}`);
      return res.json();
    },
    delete: async (id) => {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
        method: "DELETE",
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      });
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      return true;
    },
  }),
};

/* Helper to convert database row (snake_case) to app format (camelCase) */
const fromDB = (row) => ({
  id: row.id,
  type: row.type,
  subtype: row.subtype || "",
  title: row.title,
  requester: row.requester,
  requesterEmail: row.requester_email || "",
  date: row.date,
  deadline: row.deadline,
  status: row.status,
  priority: row.priority,
  deliveryFormat: row.delivery_format || "",
  description: row.description,
  audience: row.audience,
  notes: row.notes || "",
  hubspotDealId: row.hubspot_deal_id || "",
  hubspotContactId: row.hubspot_contact_id || "",
});

/* Helper to convert app format to database format */
const toDB = (data) => ({
  type: data.type,
  subtype: data.subtype || "",
  title: data.title,
  requester: data.requester,
  requester_email: data.requesterEmail || "",
  date: data.date,
  deadline: data.deadline,
  status: data.status,
  priority: data.priority,
  delivery_format: data.deliveryFormat || "",
  description: data.description,
  audience: data.audience,
  notes: data.notes || "",
  hubspot_deal_id: data.hubspotDealId || "",
  hubspot_contact_id: data.hubspotContactId || "",
});

/* ─── EMAIL CONFIG ───
   To enable email notifications:
   1. Go to emailjs.com and create a free account
   2. Add an email service (Gmail, Outlook, etc.)
   3. Create an email template with these variables:
      {{request_type}}, {{title}}, {{requester}}, {{requester_email}},
      {{priority}}, {{deadline}}, {{description}}, {{audience}},
      {{subtype}}, {{delivery_format}}, {{notes}}
   4. Replace the three values below with your actual IDs
*/
const EMAILJS_SERVICE_ID = "YOUR_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID";
const EMAILJS_PUBLIC_KEY = "YOUR_PUBLIC_KEY";

const sendEmailNotification = async (formData) => {
  try {
    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: {
          request_type: formData.type,
          title: formData.title,
          requester: formData.requester,
          requester_email: formData.requesterEmail,
          priority: formData.priority,
          deadline: formData.deadline,
          description: formData.description,
          audience: formData.audience,
          subtype: formData.subtype || "N/A",
          delivery_format: formData.deliveryFormat || "N/A",
          notes: formData.notes || "None",
          hubspot_deal: formData.hubspotDealId || "Not linked",
          hubspot_contact: formData.hubspotContactId || "Not linked",
        },
      }),
    });
    return response.ok;
  } catch (err) {
    console.error("Email failed:", err);
    return false;
  }
};

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

const TYPES = ["Paid Training", "One Pager", "Video", "Webinar", "Chat"];
const STATUSES = ["Not Started", "In Progress", "In Review", "Complete"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

const TYPE_CONFIG = {
  "Paid Training": { icon: "🎓", gradient: "linear-gradient(135deg, #FF6B6B, #EE5A24)", color: "#EE5A24" },
  "One Pager": { icon: "📄", gradient: "linear-gradient(135deg, #0ABDE3, #0984E3)", color: "#0984E3" },
  Video: { icon: "🎬", gradient: "linear-gradient(135deg, #F368E0, #BE2EDD)", color: "#BE2EDD" },
  Webinar: { icon: "📡", gradient: "linear-gradient(135deg, #FF9F43, #EE5A24)", color: "#EE5A24" },
  Chat: { icon: "💬", gradient: "linear-gradient(135deg, #00CEC9, #00B894)", color: "#00B894" },
};

const STATUS_STYLE = {
  "Not Started": { bg: "#FFF3E0", text: "#E65100", glow: "#FF9800" },
  "In Progress": { bg: "#E3F2FD", text: "#1565C0", glow: "#42A5F5" },
  "In Review": { bg: "#F3E5F5", text: "#7B1FA2", glow: "#AB47BC" },
  Complete: { bg: "#E8F5E9", text: "#2E7D32", glow: "#66BB6A" },
};

const PRIORITY_COLORS = { Low: "#78909C", Medium: "#FFB300", High: "#FF5252", Urgent: "#D50000" };

function reducer(state, action) {
  switch (action.type) {
    case "SET_TAB": return { ...state, activeTab: action.payload };
    case "SET_FILTER_TYPE": return { ...state, filterType: action.payload };
    case "SET_FILTER_STATUS": return { ...state, filterStatus: action.payload };
    case "SET_SORT": return { ...state, sortBy: action.payload };
    case "SET_REQUESTS": return { ...state, requests: action.payload };
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
  const cfg = TYPE_CONFIG[request.type] || TYPE_CONFIG["Chat"];

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
  const [emailStatus, setEmailStatus] = useState("");

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

  const handleSubmit = async () => {
    if (!validate()) return;
    const requestData = { ...form, date: new Date().toISOString().slice(0, 10), status: "Not Started" };
    await onSubmit(requestData);

    setEmailStatus("sending");
    const emailSent = await sendEmailNotification(requestData);
    setEmailStatus(emailSent ? "sent" : "failed");

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setEmailStatus("");
      setForm({ type: "", subtype: "", title: "", requester: "", requesterEmail: "", deadline: "", priority: "", deliveryFormat: "", description: "", audience: "", notes: "", hubspotDealId: "", hubspotContactId: "" });
    }, 3000);
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
        <p style={{ color: "#8E8EA0", fontFamily: "var(--font-body)", marginBottom: 8 }}>Redirecting to dashboard…</p>
        <p style={{ fontSize: 12, fontFamily: "var(--font-body)", color: emailStatus === "sent" ? "#2E7D32" : emailStatus === "failed" ? "#FF5252" : "#8E8EA0" }}>
          {emailStatus === "sending" && "📧 Sending email notification…"}
          {emailStatus === "sent" && "✅ Email notification sent!"}
          {emailStatus === "failed" && "⚠️ Email not configured yet — request still saved!"}
        </p>
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
          Need a training, one pager, video, webinar, or just want to chat through an idea? Fill out every detail below so I can deliver exactly what you need.
        </p>

        {/* Type selection as cards */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>What do you need? *</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
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

        {/* Chat specific hint */}
        {form.type === "Chat" && (
          <div style={{
            background: "linear-gradient(135deg, #E8FFF8 0%, #F0FFFC 100%)",
            borderRadius: 14, padding: "18px 18px", marginBottom: 20,
            border: "1px dashed #7DCEA0",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#00B894", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              💬 Chat / Feedback Session
            </div>
            <div style={{ fontSize: 13, color: "#555", fontFamily: "var(--font-body)", lineHeight: 1.6 }}>
              Use this when you want to bounce ideas off me, get feedback on a project, or talk through something before it becomes a formal request.
              In the description below, tell me what you want to discuss and any context that will help me prepare.
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
    requests: [], activeTab: "submit",
    filterType: "All", filterStatus: "All", sortBy: "deadline",
  });
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [showPinInput, setShowPinInput] = useState(false);
  const [pinValue, setPinValue] = useState("");
  const [pinError, setPinError] = useState(false);
  const ADMIN_PIN = "5460"; // ← CHANGE THIS to your own secret PIN!
  const { requests, activeTab, filterType, filterStatus, sortBy } = state;

  /* Load requests from Supabase on mount */
  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await supabase.from("requests").select();
      dispatch({ type: "SET_REQUESTS", payload: data.map(fromDB) });
      setError(null);
    } catch (err) {
      console.error("Failed to load:", err);
      setError("Failed to load requests. Check your Supabase config.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  /* Database-connected actions */
  const handleAddRequest = async (formData) => {
    try {
      const rows = await supabase.from("requests").insert(toDB(formData));
      if (rows && rows.length > 0) {
        dispatch({ type: "ADD_REQUEST", payload: fromDB(rows[0]) });
      } else {
        await loadRequests();
      }
    } catch (err) {
      console.error("Failed to add:", err);
      await loadRequests();
    }
  };

  const handleStatusChange = async (id, status) => {
    dispatch({ type: "UPDATE_STATUS", payload: { id, status } });
    try {
      await supabase.from("requests").update(id, { status });
    } catch (err) {
      console.error("Failed to update:", err);
      await loadRequests();
    }
  };

  const handleDelete = async (id) => {
    dispatch({ type: "DELETE_REQUEST", payload: id });
    try {
      await supabase.from("requests").delete(id);
    } catch (err) {
      console.error("Failed to delete:", err);
      await loadRequests();
    }
  };

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
        @keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
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
            </div>
          </div>

          <div style={{ display: "flex", gap: 4, background: "#F4F4F8", borderRadius: 12, padding: 4, alignItems: "center" }}>
            <button onClick={() => dispatch({ type: "SET_TAB", payload: "submit" })} style={{
              padding: "8px 20px", borderRadius: 10, border: "none",
              background: activeTab === "submit" ? "#fff" : "transparent",
              color: activeTab === "submit" ? "#1a1a2e" : "#8E8EA0",
              fontSize: 13, fontWeight: activeTab === "submit" ? 800 : 600,
              cursor: "pointer", fontFamily: "var(--font-body)",
              boxShadow: activeTab === "submit" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
              transition: "all 0.2s",
            }}>✨ Submit Request</button>

            {adminUnlocked ? (
              <button onClick={() => dispatch({ type: "SET_TAB", payload: "dashboard" })} style={{
                padding: "8px 20px", borderRadius: 10, border: "none",
                background: activeTab === "dashboard" ? "#fff" : "transparent",
                color: activeTab === "dashboard" ? "#1a1a2e" : "#8E8EA0",
                fontSize: 13, fontWeight: activeTab === "dashboard" ? 800 : 600,
                cursor: "pointer", fontFamily: "var(--font-body)",
                boxShadow: activeTab === "dashboard" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                transition: "all 0.2s",
              }}>📊 Dashboard</button>
            ) : (
              <div style={{ position: "relative" }}>
                <button onClick={() => setShowPinInput(!showPinInput)} style={{
                  padding: "8px 20px", borderRadius: 10, border: "none",
                  background: "transparent", color: "#C0C0CC",
                  fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)",
                }}>🔒 Admin</button>
                {showPinInput && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 8px)", right: 0,
                    background: "#fff", borderRadius: 14, padding: "16px 18px",
                    boxShadow: "0 8px 30px rgba(0,0,0,0.15)", border: "1px solid #E8E8F0",
                    zIndex: 200, minWidth: 220,
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#1a1a2e", marginBottom: 8, fontFamily: "var(--font-body)" }}>
                      Enter admin PIN
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        type="password"
                        value={pinValue}
                        onChange={e => { setPinValue(e.target.value); setPinError(false); }}
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            if (pinValue === ADMIN_PIN) {
                              setAdminUnlocked(true);
                              setShowPinInput(false);
                              setPinValue("");
                              dispatch({ type: "SET_TAB", payload: "dashboard" });
                            } else {
                              setPinError(true);
                              setPinValue("");
                            }
                          }
                        }}
                        placeholder="PIN"
                        autoFocus
                        style={{
                          flex: 1, padding: "8px 12px", borderRadius: 8,
                          border: pinError ? "2px solid #FF5252" : "1.5px solid #E8E8F0",
                          fontSize: 14, fontFamily: "var(--font-body)", outline: "none",
                          textAlign: "center", letterSpacing: "0.2em",
                        }}
                      />
                      <button onClick={() => {
                        if (pinValue === ADMIN_PIN) {
                          setAdminUnlocked(true);
                          setShowPinInput(false);
                          setPinValue("");
                          dispatch({ type: "SET_TAB", payload: "dashboard" });
                        } else {
                          setPinError(true);
                          setPinValue("");
                        }
                      }} style={{
                        padding: "8px 14px", borderRadius: 8, border: "none",
                        background: "linear-gradient(135deg, #FF6B6B, #F368E0)",
                        color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
                      }}>Go</button>
                    </div>
                    {pinError && <div style={{ color: "#FF5252", fontSize: 11, marginTop: 6, fontFamily: "var(--font-body)" }}>Wrong PIN, try again</div>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 24px 60px" }}>

        {/* Loading state */}
        {loading && activeTab === "dashboard" && (
          <div style={{ textAlign: "center", padding: "80px 24px" }}>
            <div style={{ fontSize: 48, marginBottom: 16, animation: "pulse 1.5s infinite" }}>📊</div>
            <p style={{ color: "#8E8EA0", fontFamily: "var(--font-body)", fontSize: 15 }}>Loading your requests…</p>
          </div>
        )}

        {/* Error state */}
        {error && activeTab === "dashboard" && (
          <div style={{
            textAlign: "center", padding: "60px 24px", background: "#FFF5F5",
            borderRadius: 18, border: "1px solid #FFCDD2", marginBottom: 24,
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <p style={{ color: "#D50000", fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{error}</p>
            <p style={{ color: "#8E8EA0", fontFamily: "var(--font-body)", fontSize: 13 }}>
              Check that your SUPABASE_URL and SUPABASE_ANON_KEY are correct in App.js
            </p>
            <button onClick={loadRequests} style={{
              marginTop: 16, padding: "10px 24px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg, #FF6B6B, #F368E0)", color: "#fff",
              fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)",
            }}>Try Again</button>
          </div>
        )}

        {activeTab === "dashboard" && !loading && !error && (
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
                  {requests.length === 0 ? "No requests yet — submit your first one!" : "No requests match your filters."}
                </div>
              )}
              {filtered.map(r => (
                <RequestCard key={r.id} request={r}
                  expanded={expandedId === r.id}
                  onExpand={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete} />
              ))}
            </div>
          </>
        )}

        {activeTab === "submit" && (
          <RequestForm onSubmit={handleAddRequest} />
        )}
      </div>
    </div>
  );
}
