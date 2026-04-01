const SUPABASE_URL = "https://ywhxhkfgjkngafqkbfdw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3aHhoa2ZnamtuZ2FmcWtiZmR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0OTAwMzcsImV4cCI6MjA5MDA2NjAzN30.C-8mAq3Dv5p-W4nWxGxI0kO8miYOW0po2CWF8BUrPVk";

function normalizeLines(text) {
  return text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
}

function extractName() {
  return document.title.replace(" | LinkedIn", "").trim() || "";
}

function getExperienceSection() {
  const h2 = Array.from(document.querySelectorAll("h2")).find(
    h => h.innerText?.trim() === "Experiência" || h.innerText?.trim() === "Experience"
  );
  return h2?.closest("section") || h2?.parentElement?.parentElement || null;
}

function extractCurrentExperience(section) {
  if (!section) return { currentPosition: "", company: "" };
  const allUls = section.querySelectorAll("ul");
  for (const ul of allUls) {
    for (const li of ul.querySelectorAll("li")) {
      const liText = li.innerText?.trim() || "";
      const lower = liText.toLowerCase();
      if (!lower.includes("o momento") && !lower.includes("present")) continue;
      const liLines = normalizeLines(liText);
      const parent = ul.parentElement;
      const siblings = parent ? Array.from(parent.children) : [];
      const idx = siblings.indexOf(ul);
      let prevDiv = null;
      for (let j = idx - 1; j >= 0; j--) {
        if (siblings[j].tagName === "DIV" && siblings[j].innerText?.trim().length > 2) {
          prevDiv = siblings[j];
          break;
        }
      }
      if (prevDiv) {
        const divLines = normalizeLines(prevDiv.innerText);
        return { currentPosition: liLines[0] || "", company: divLines[0] || "" };
      }
      return {
        currentPosition: liLines[0] || "",
        company: liLines.length > 1 ? liLines[1].split("·")[0].trim() : ""
      };
    }
  }
  return { currentPosition: "", company: "" };
}

function extractProfileData() {
  const name = extractName();
  const url = window.location.href.split("?")[0];
  const section = getExperienceSection();
  const { currentPosition, company } = extractCurrentExperience(section);
  return { name, currentPosition, company, url };
}

async function refreshSessionIfNeeded() {
  const stored = await chrome.storage.local.get(["session", "refreshToken"]);
  if (!stored.session || !stored.refreshToken) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
      body: JSON.stringify({ refresh_token: stored.refreshToken }),
    });
    const data = await res.json();
    if (data.access_token) {
      await chrome.storage.local.set({ session: data.access_token, refreshToken: data.refresh_token });
      return data.access_token;
    }
  } catch (e) { console.error("[Orion] Token refresh failed:", e); }
  return stored.session;
}

async function fetchCompanies(planId, tier, accessToken) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/companies?plan_id=eq.${planId}&tier=eq.${tier}&select=name&order=name.asc`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    if (!res.ok) return [];
    return (await res.json()).map(c => c.name);
  } catch (e) {
    console.error("[Orion] Fetch companies error:", e);
    return [];
  }
}

function showSaveForm() {
  if (document.getElementById("orion-save-form")) return;

  const profile = extractProfileData();

  const overlay = document.createElement("div");
  overlay.id = "orion-save-form";
  overlay.style.cssText = `
    position:fixed;bottom:24px;right:24px;z-index:1000000;
    width:340px;background:#1a1a2e;border-radius:16px;
    box-shadow:0 8px 32px rgba(0,0,0,0.5);padding:20px;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
    color:#e0e0e0;
  `;

  const inputStyle = `
    width:100%;padding:8px 12px;border:1px solid #333;border-radius:8px;
    background:#0d0d1a;color:#fff;font-size:13px;margin-top:4px;
    box-sizing:border-box;outline:none;
  `;
  const labelStyle = `font-size:12px;color:#999;font-weight:600;display:block;margin-top:10px;`;
  const selectStyle = inputStyle;

  overlay.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <span style="font-size:15px;font-weight:700;color:#1a9bab;">🚀 Salvar no Orion</span>
      <button id="orion-close" style="background:none;border:none;color:#666;font-size:18px;cursor:pointer;">✕</button>
    </div>

    <label style="${labelStyle}">Nome</label>
    <input id="orion-f-name" style="${inputStyle}" value="${profile.name.replace(/"/g, '&quot;')}">

    <div style="display:flex;gap:8px;margin-top:10px;">
      <div style="flex:1;">
        <label style="${labelStyle}">Tier</label>
        <select id="orion-f-tier" style="${selectStyle}">
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="Livre">Livre</option>
        </select>
      </div>
      <div style="flex:1;">
        <label style="${labelStyle}">Tipo</label>
        <select id="orion-f-type" style="${selectStyle}">
          <option value="decision_maker">Decisor</option>
          <option value="hr">RH</option>
          <option value="other" selected>Outro</option>
        </select>
      </div>
    </div>

    <div id="orion-company-section">
      <label style="${labelStyle}">Empresa</label>
      <div id="orion-company-loading" style="font-size:12px;color:#666;margin-top:4px;">Carregando empresas...</div>
      <select id="orion-f-company-select" style="${selectStyle};display:none;"></select>
      <input id="orion-f-company-free" style="${inputStyle};display:none;" placeholder="Nome da empresa">
    </div>

    <label style="${labelStyle}">Cargo Atual</label>
    <input id="orion-f-role" style="${inputStyle}" placeholder="Ex: Gerente de Vendas" value="${(profile.currentPosition || '').replace(/"/g, '&quot;')}">

    <div style="display:flex;gap:8px;margin-top:16px;">
      <button id="orion-cancel" style="flex:1;padding:10px;border:1px solid #333;border-radius:10px;background:transparent;color:#999;font-size:13px;font-weight:600;cursor:pointer;">Cancelar</button>
      <button id="orion-confirm" style="flex:1;padding:10px;border:none;border-radius:10px;background:linear-gradient(135deg,#1a9bab,#14707d);color:#fff;font-size:13px;font-weight:700;cursor:pointer;">Salvar</button>
    </div>
    <div id="orion-msg" style="text-align:center;margin-top:8px;font-size:12px;min-height:16px;"></div>
  `;

  document.body.appendChild(overlay);

  document.getElementById("orion-close").addEventListener("click", () => overlay.remove());
  document.getElementById("orion-cancel").addEventListener("click", () => overlay.remove());
  document.getElementById("orion-confirm").addEventListener("click", () => confirmSave(profile.url));

  // Tier change handler
  const tierSelect = document.getElementById("orion-f-tier");
  tierSelect.addEventListener("change", () => loadCompaniesForTier(tierSelect.value, profile.company));

  // Initial load
  loadCompaniesForTier(tierSelect.value, profile.company);
}

async function loadCompaniesForTier(tier, prefilledCompany) {
  const loading = document.getElementById("orion-company-loading");
  const selectEl = document.getElementById("orion-f-company-select");
  const freeEl = document.getElementById("orion-f-company-free");

  if (tier === "Livre") {
    loading.style.display = "none";
    selectEl.style.display = "none";
    freeEl.style.display = "block";
    freeEl.value = prefilledCompany || "";
    return;
  }

  loading.style.display = "block";
  selectEl.style.display = "none";
  freeEl.style.display = "none";

  const stored = await chrome.storage.local.get(["session", "planId", "refreshToken"]);
  if (!stored.session || !stored.planId) {
    loading.textContent = "Faça login na extensão primeiro";
    return;
  }

  const accessToken = await refreshSessionIfNeeded();
  const companies = await fetchCompanies(stored.planId, tier, accessToken || stored.session);

  loading.style.display = "none";

  if (companies.length === 0) {
    freeEl.style.display = "block";
    freeEl.placeholder = "Nenhuma empresa neste tier — digite manualmente";
    freeEl.value = prefilledCompany || "";
    selectEl.style.display = "none";
    return;
  }

  selectEl.innerHTML = `<option value="">Selecione...</option>` +
    companies.map(c => `<option value="${c.replace(/"/g, '&quot;')}">${c}</option>`).join("") +
    `<option value="__other__">Outra (digitar)</option>`;
  selectEl.style.display = "block";
  freeEl.style.display = "none";

  // Pre-select if match
  if (prefilledCompany) {
    const match = companies.find(c => c.toLowerCase() === prefilledCompany.toLowerCase());
    if (match) selectEl.value = match;
  }

  selectEl.onchange = () => {
    if (selectEl.value === "__other__") {
      selectEl.style.display = "none";
      freeEl.style.display = "block";
      freeEl.value = "";
      freeEl.focus();
    }
  };
}

function getSelectedCompany() {
  const tier = document.getElementById("orion-f-tier").value;
  const selectEl = document.getElementById("orion-f-company-select");
  const freeEl = document.getElementById("orion-f-company-free");

  if (tier === "Livre" || freeEl.style.display !== "none") {
    return freeEl.value.trim();
  }
  return selectEl.value === "__other__" ? "" : selectEl.value;
}

async function confirmSave(linkedinUrl) {
  const msg = document.getElementById("orion-msg");
  const btn = document.getElementById("orion-confirm");
  const name = document.getElementById("orion-f-name").value.trim();
  const role = document.getElementById("orion-f-role").value.trim();
  const company = getSelectedCompany();
  const type = document.getElementById("orion-f-type").value;
  const tierVal = document.getElementById("orion-f-tier").value;
  const tier = tierVal === "Livre" ? "A" : tierVal;

  if (!name) { msg.textContent = "❌ Nome é obrigatório"; msg.style.color = "#e74c3c"; return; }

  btn.disabled = true;
  btn.style.opacity = "0.6";
  msg.textContent = "⏳ Salvando...";
  msg.style.color = "#999";

  try {
    const stored = await chrome.storage.local.get(["session", "planId", "refreshToken"]);
    if (!stored.session || !stored.planId) {
      msg.textContent = "❌ Faça login na extensão primeiro";
      msg.style.color = "#e74c3c";
      btn.disabled = false; btn.style.opacity = "1";
      return;
    }

    const accessToken = await refreshSessionIfNeeded();

    const res = await fetch(`${SUPABASE_URL}/rest/v1/contact_mappings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken || stored.session}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        plan_id: stored.planId,
        name,
        current_position: role || null,
        company: company || null,
        linkedin_url: linkedinUrl,
        type,
        tier,
        status: "identified",
      }),
    });

    if (!res.ok) {
      const status = res.status;
      msg.textContent = status === 401 || status === 403 ? "❌ Sessão expirada" : `❌ Erro ${status}`;
      msg.style.color = "#e74c3c";
      btn.disabled = false; btn.style.opacity = "1";
      return;
    }

    msg.textContent = "✅ Salvo com sucesso!";
    msg.style.color = "#2ecc71";
    setTimeout(() => document.getElementById("orion-save-form")?.remove(), 1500);
  } catch (err) {
    console.error("[Orion] Save error:", err);
    msg.textContent = "❌ Erro ao salvar";
    msg.style.color = "#e74c3c";
    btn.disabled = false; btn.style.opacity = "1";
  }
}

function createSaveButton() {
  if (document.getElementById("orion-save-btn")) return;
  const btn = document.createElement("button");
  btn.id = "orion-save-btn";
  btn.innerHTML = "🚀 Salvar no Orion";
  btn.style.cssText = `
    position:fixed;bottom:24px;right:24px;z-index:999999;
    display:inline-flex;align-items:center;gap:6px;padding:12px 24px;
    border:none;border-radius:24px;
    background:linear-gradient(135deg,#1a9bab,#14707d);
    color:white;font-size:15px;font-weight:700;cursor:pointer;
    box-shadow:0 4px 16px rgba(0,0,0,0.3);transition:all 0.2s ease;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  `;
  btn.addEventListener("mouseenter", () => { btn.style.transform = "translateY(-2px)"; });
  btn.addEventListener("mouseleave", () => { btn.style.transform = "translateY(0)"; });
  btn.addEventListener("click", showSaveForm);
  document.body.appendChild(btn);
}

function init() {
  if (!window.location.pathname.startsWith("/in/")) return;
  let attempts = 0;
  function tryInject() {
    if (attempts >= 5) { createSaveButton(); return; }
    const section = getExperienceSection();
    if (section) { createSaveButton(); } else { attempts++; setTimeout(tryInject, 1000); }
  }
  setTimeout(tryInject, 2000);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

let lastUrl = window.location.href;
const observer = new MutationObserver(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    document.getElementById("orion-save-btn")?.remove();
    document.getElementById("orion-save-form")?.remove();
    if (window.location.pathname.startsWith("/in/")) setTimeout(init, 500);
  }
});
observer.observe(document.body, { childList: true, subtree: true });
