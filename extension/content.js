const SUPABASE_URL = "https://ywhxhkfgjkngafqkbfdw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3aHhoa2ZnamtuZ2FmcWtiZmR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0OTAwMzcsImV4cCI6MjA5MDA2NjAzN30.C-8mAq3Dv5p-W4nWxGxI0kO8miYOW0po2CWF8BUrPVk";

function normalizeLines(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function extractName() {
  let name = document.title.replace(" | LinkedIn", "").trim();

  if (!name) {
    const sectionTitles = [
      "Sobre",
      "Experiência",
      "Formação acadêmica",
      "Competências",
      "Idiomas",
      "Interesses",
      "Atividades",
      "Em destaque",
      "Experience",
      "About",
      "Education",
      "Skills",
    ];

    const h2 = Array.from(document.querySelectorAll("h2")).find((heading) => {
      const text = heading.innerText?.trim();
      return text && text.length > 2 && !sectionTitles.includes(text);
    });

    if (h2) name = h2.innerText.trim();
  }

  console.log("[Orion] Name extracted:", name);
  return name;
}

function getExperienceSection() {
  const experienceH2 = Array.from(document.querySelectorAll("h2")).find(
    (heading) => heading.innerText?.trim() === "Experiência" || heading.innerText?.trim() === "Experience"
  );

  console.log("[Orion] Experience H2 found:", !!experienceH2);
  return experienceH2?.closest("section") || experienceH2?.parentElement?.parentElement || null;
}

function extractCurrentExperience(section) {
  const allUls = section.querySelectorAll("ul");
  console.log("[Orion] ULs in experience section:", allUls.length);

  for (const ul of allUls) {
    const lis = Array.from(ul.querySelectorAll("li"));

    for (const li of lis) {
      const liText = li.innerText?.trim() || "";
      const liLines = normalizeLines(liText);
      const lowerText = liText.toLowerCase();
      const isCurrent = lowerText.includes("o momento") || lowerText.includes("present");

      if (!isCurrent) continue;
      console.log("[Orion] Found current experience lines:", liLines.slice(0, 5));

      const parent = ul.parentElement;
      const siblings = parent ? Array.from(parent.children) : [];
      const ulIdx = siblings.indexOf(ul);
      let prevDiv = null;

      for (let j = ulIdx - 1; j >= 0; j -= 1) {
        if (siblings[j].tagName === "DIV" && siblings[j].innerText?.trim().length > 2) {
          prevDiv = siblings[j];
          break;
        }
      }

      if (prevDiv) {
        const divLines = normalizeLines(prevDiv.innerText);
        const company = divLines[0] || "";
        const currentPosition = liLines[0] || "";
        console.log("[Orion] Grouped experience - Company:", company, "Position:", currentPosition);
        return { currentPosition, company };
      }

      const currentPosition = liLines[0] || "";
      const company = liLines.length > 1 ? liLines[1].split("·")[0].trim() : "";
      console.log("[Orion] Single experience - Position:", currentPosition, "Company:", company);
      return { currentPosition, company };
    }
  }

  console.log("[Orion] No current role found inside the experience section");
  return { currentPosition: "", company: "" };
}

function extractProfileData() {
  const name = extractName();
  const url = window.location.href.split("?")[0];
  const section = getExperienceSection();
  console.log("[Orion] Experience section found:", !!section);

  let currentPosition = "";
  let company = "";

  if (section) {
    ({ currentPosition, company } = extractCurrentExperience(section));
  }

  console.log("[Orion] Final extracted data from experience section:", {
    name,
    currentPosition,
    company,
    url,
  });

  return { name, currentPosition, company, url };
}

function createSaveButton() {
  if (document.getElementById("orion-save-btn")) return;

  const btn = document.createElement("button");
  btn.id = "orion-save-btn";
  btn.innerHTML = "🚀 Salvar no Orion";
  btn.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 999999;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 12px 24px;
    border: none;
    border-radius: 24px;
    background: linear-gradient(135deg, #1a9bab, #14707d);
    color: white;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    transition: all 0.2s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  btn.addEventListener("mouseenter", () => {
    btn.style.transform = "translateY(-2px)";
    btn.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.4)";
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.transform = "translateY(0)";
    btn.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.3)";
  });

  btn.addEventListener("click", handleSave);
  document.body.appendChild(btn);
  console.log("[Orion] Save button injected successfully");
}

async function refreshSessionIfNeeded() {
  const stored = await chrome.storage.local.get(["session", "refreshToken"]);
  if (!stored.session || !stored.refreshToken) return null;

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ refresh_token: stored.refreshToken }),
    });
    const data = await res.json();
    if (data.access_token) {
      await chrome.storage.local.set({
        session: data.access_token,
        refreshToken: data.refresh_token,
      });
      console.log("[Orion] Token refreshed successfully");
      return data.access_token;
    }
  } catch (e) {
    console.error("[Orion] Token refresh failed:", e);
  }
  return stored.session;
}

async function handleSave() {
  const btn = document.getElementById("orion-save-btn");
  if (!btn) return;
  const originalText = btn.innerHTML;
  btn.innerHTML = "⏳ Salvando...";
  btn.disabled = true;
  btn.style.opacity = "0.7";

  try {
    const stored = await chrome.storage.local.get(["session", "planId", "refreshToken"]);
    if (!stored.session || !stored.planId) {
      btn.innerHTML = "❌ Faça login na extensão";
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
        btn.style.opacity = "1";
      }, 3000);
      return;
    }

    const accessToken = await refreshSessionIfNeeded();
    const profile = extractProfileData();
    console.log("[Orion] Extracted profile:", profile);

    if (!profile.name) {
      btn.innerHTML = "❌ Nome não encontrado";
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
        btn.style.opacity = "1";
      }, 3000);
      return;
    }

    if (!profile.currentPosition || !profile.company) {
      btn.innerHTML = "❌ Experiência atual não encontrada";
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
        btn.style.opacity = "1";
      }, 3000);
      return;
    }

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
        name: profile.name,
        current_position: profile.currentPosition,
        company: profile.company,
        linkedin_url: profile.url,
        type: "other",
        tier: "A",
        status: "identified",
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error("[Orion] Save error:", res.status, errData);
      if (res.status === 401 || res.status === 403) {
        btn.innerHTML = "❌ Sessão expirada - refaça login";
      } else {
        btn.innerHTML = `❌ Erro ${res.status}`;
      }
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
        btn.style.opacity = "1";
      }, 3000);
      return;
    }

    btn.innerHTML = "✅ Salvo!";
    btn.style.background = "linear-gradient(135deg, #2ecc71, #27ae60)";
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.disabled = false;
      btn.style.opacity = "1";
      btn.style.background = "linear-gradient(135deg, #1a9bab, #14707d)";
    }, 3000);
  } catch (err) {
    console.error("[Orion] Save error:", err);
    btn.innerHTML = "❌ Erro ao salvar";
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.disabled = false;
      btn.style.opacity = "1";
    }, 3000);
  }
}

function init() {
  if (!window.location.pathname.startsWith("/in/")) return;

  let attempts = 0;
  function tryInject() {
    const section = getExperienceSection();
    if (section || attempts >= 10) {
      createSaveButton();
    } else {
      attempts += 1;
      setTimeout(tryInject, 1000);
    }
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
    const old = document.getElementById("orion-save-btn");
    if (old) old.remove();
    if (window.location.pathname.startsWith("/in/")) {
      setTimeout(init, 500);
    }
  }
});
observer.observe(document.body, { childList: true, subtree: true });
