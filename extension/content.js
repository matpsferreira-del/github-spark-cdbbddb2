const SUPABASE_URL = "https://ywhxhkfgjkngafqkbfdw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3aHhoa2ZnamtuZ2FmcWtiZmR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0OTAwMzcsImV4cCI6MjA5MDA2NjAzN30.C-8mAq3Dv5p-W4nWxGxI0kO8miYOW0po2CWF8BUrPVk";

function extractProfileData() {
  let name = "";
  let currentPosition = "";
  let company = "";
  const url = window.location.href.split("?")[0];

  // Name: use document.title (most reliable on LinkedIn)
  name = document.title.replace(' | LinkedIn', '').trim();
  if (!name) {
    const sectionTitles = ['Sobre','Experiência','Formação acadêmica','Competências','Idiomas','Interesses','Atividades','Em destaque','Experience','About','Education','Skills'];
    const h2 = Array.from(document.querySelectorAll('h2')).find(h => {
      const t = h.innerText?.trim();
      return t && t.length > 2 && !sectionTitles.includes(t);
    });
    if (h2) name = h2.innerText.trim();
  }

  // Experience: find the current position (contains "o momento" or "present")
  const experienceH2 = Array.from(document.querySelectorAll('h2')).find(
    h => h.innerText?.trim() === 'Experiência' || h.innerText?.trim() === 'Experience'
  );
  const section = experienceH2?.closest('section') || experienceH2?.parentElement?.parentElement;

  if (section) {
    const allUls = section.querySelectorAll('ul');
    for (const ul of allUls) {
      const lis = Array.from(ul.querySelectorAll('li'));
      for (const li of lis) {
        const liText = li.innerText?.trim() || '';
        const liLines = liText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const isCurrent = liText.includes('o momento') || liText.toLowerCase().includes('present');
        if (!isCurrent) continue;

        const parent = ul.parentElement;
        const siblings = parent ? Array.from(parent.children) : [];
        const ulIdx = siblings.indexOf(ul);
        let prevDiv = null;
        for (let j = ulIdx - 1; j >= 0; j--) {
          if (siblings[j].tagName === 'DIV' && siblings[j].innerText?.trim().length > 2) {
            prevDiv = siblings[j];
            break;
          }
        }

        if (prevDiv) {
          const divLines = prevDiv.innerText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
          company = divLines[0];
          currentPosition = liLines[0];
        } else {
          currentPosition = liLines[0];
          company = liLines.length > 1 ? liLines[1].split('·')[0].trim() : '';
        }
        break;
      }
      if (currentPosition) break;
    }
  }

  // Fallback: lazy-column data
  if (!currentPosition || !company) {
    const lazy = document.querySelector('[data-testid="lazy-column"]');
    const lazyLines = lazy ? lazy.innerText.split('\n').map(l => l.trim()).filter(l => l.length > 0) : [];
    if (!currentPosition && lazyLines.length > 2) currentPosition = lazyLines[2];
    if (!company && lazyLines.length > 6) company = lazyLines[6];
  }

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

async function handleSave() {
  const btn = document.getElementById("orion-save-btn");
  if (!btn) return;
  const originalText = btn.innerHTML;
  btn.innerHTML = "⏳ Salvando...";
  btn.disabled = true;
  btn.style.opacity = "0.7";

  try {
    const stored = await chrome.storage.local.get(["session", "planId"]);
    if (!stored.session || !stored.planId) {
      btn.innerHTML = "❌ Faça login na extensão";
      setTimeout(() => { btn.innerHTML = originalText; btn.disabled = false; btn.style.opacity = "1"; }, 3000);
      return;
    }

    const profile = extractProfileData();
    console.log("[Orion] Extracted profile:", profile);

    if (!profile.name) {
      btn.innerHTML = "❌ Nome não encontrado";
      setTimeout(() => { btn.innerHTML = originalText; btn.disabled = false; btn.style.opacity = "1"; }, 3000);
      return;
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/contact_mappings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${stored.session}`,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({
        plan_id: stored.planId,
        name: profile.name,
        current_position: profile.currentPosition || null,
        company: profile.company || null,
        linkedin_url: profile.url,
        type: "other",
        tier: "A",
        status: "identified",
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error("[Orion] Save error response:", errData);
      throw new Error(errData.message || `HTTP ${res.status}`);
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
    setTimeout(() => { btn.innerHTML = originalText; btn.disabled = false; btn.style.opacity = "1"; }, 3000);
  }
}

// Wait for experience section to load before injecting
function init() {
  if (!window.location.pathname.startsWith("/in/")) return;

  let attempts = 0;
  function tryInject() {
    const expH2 = Array.from(document.querySelectorAll('h2')).find(
      h => h.innerText?.trim() === 'Experiência' || h.innerText?.trim() === 'Experience'
    );
    if (expH2 || attempts >= 10) {
      createSaveButton();
    } else {
      attempts++;
      setTimeout(tryInject, 1000);
    }
  }
  setTimeout(tryInject, 2000);
}

// Run on load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// Re-inject on SPA navigation
let lastUrl = window.location.href;
const observer = new MutationObserver(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    // Remove old button
    const old = document.getElementById("orion-save-btn");
    if (old) old.remove();
    if (window.location.pathname.startsWith("/in/")) {
      setTimeout(createSaveButton, 1500);
    }
  }
});
observer.observe(document.body, { childList: true, subtree: true });
