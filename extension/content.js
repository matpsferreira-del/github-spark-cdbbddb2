const SUPABASE_URL = "https://ywhxhkfgjkngafqkbfdw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3aHhoa2ZnamtuZ2FmcWtiZmR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0OTAwMzcsImV4cCI6MjA5MDA2NjAzN30.C-8mAq3Dv5p-W4nWxGxI0kO8miYOW0po2CWF8BUrPVk";

function extractProfileData() {
  // Name - try multiple selectors
  const nameEl = document.querySelector("h1.text-heading-xlarge") ||
                 document.querySelector("h1.inline.t-24") ||
                 document.querySelector(".pv-text-details__left-panel h1") ||
                 document.querySelector("h1");
  const name = nameEl?.textContent?.trim() || "";

  // Headline
  const headlineEl = document.querySelector(".text-body-medium.break-words") ||
                     document.querySelector(".pv-text-details__left-panel .text-body-medium");
  const headline = headlineEl?.textContent?.trim() || "";

  let currentPosition = "";
  let company = "";

  // Try experience section - multiple selector patterns
  const expSelectors = [
    "#experience ~ .pvs-list__outer-container .pvs-entity--padded",
    "#experience + .pvs-list__outer-container .pvs-entity--padded",
    "section.experience-section li",
    "[id='experience'] ~ div li.pvs-list__paged-list-item:first-child",
    "#experience ~ div .pvs-list__paged-list-item:first-child",
  ];

  let expSection = null;
  for (const sel of expSelectors) {
    expSection = document.querySelector(sel);
    if (expSection) break;
  }

  if (expSection) {
    const titleEl = expSection.querySelector(".t-bold span[aria-hidden='true']") ||
                    expSection.querySelector(".mr1.t-bold span") ||
                    expSection.querySelector("span.t-bold");
    const companyEl = expSection.querySelector(".t-14.t-normal span[aria-hidden='true']") ||
                      expSection.querySelector(".t-14.t-normal:not(.t-black--light) span") ||
                      expSection.querySelector("span.t-14.t-normal");
    currentPosition = titleEl?.textContent?.trim() || "";
    // Company text often contains " · Full-time" etc, clean it
    let rawCompany = companyEl?.textContent?.trim() || "";
    company = rawCompany.split("·")[0].trim();
  }

  // Fallback to headline parsing
  if (!currentPosition && headline) {
    const parts = headline.split(/\s+(?:at|@|em|na|no)\s+/i);
    if (parts.length >= 2) {
      currentPosition = parts[0].trim();
      company = parts[1].trim();
    } else {
      currentPosition = headline;
    }
  }

  const url = window.location.href.split("?")[0];

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

// Wait for page to be ready before injecting
function init() {
  if (window.location.pathname.startsWith("/in/")) {
    // Wait a bit for LinkedIn SPA to render
    setTimeout(createSaveButton, 1500);
  }
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
