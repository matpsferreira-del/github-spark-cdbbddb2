const SUPABASE_URL = "https://ywhxhkfgjkngafqkbfdw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3aHhoa2ZnamtuZ2FmcWtiZmR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0OTAwMzcsImV4cCI6MjA5MDA2NjAzN30.C-8mAq3Dv5p-W4nWxGxI0kO8miYOW0po2CWF8BUrPVk";

function extractProfileData() {
  const nameEl = document.querySelector("h1.text-heading-xlarge") ||
                 document.querySelector("h1.inline.t-24") ||
                 document.querySelector("h1");
  const name = nameEl?.textContent?.trim() || "";

  const headlineEl = document.querySelector(".text-body-medium.break-words") ||
                     document.querySelector(".pv-text-details__left-panel .text-body-medium");
  const headline = headlineEl?.textContent?.trim() || "";

  // Try to extract current position and company from headline or experience
  let currentPosition = "";
  let company = "";

  // Try experience section first
  const expSection = document.querySelector("#experience ~ .pvs-list__outer-container .pvs-entity--padded");
  if (expSection) {
    const titleEl = expSection.querySelector(".t-bold span[aria-hidden='true']") ||
                    expSection.querySelector(".mr1.t-bold span");
    const companyEl = expSection.querySelector(".t-14.t-normal span[aria-hidden='true']") ||
                      expSection.querySelector(".t-14.t-normal:not(.t-black--light) span");
    currentPosition = titleEl?.textContent?.trim() || "";
    company = companyEl?.textContent?.trim() || "";
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
  btn.addEventListener("click", handleSave);

  // Find a good place to insert the button
  const actionsBar = document.querySelector(".pvs-profile-actions") ||
                     document.querySelector(".pv-top-card-v2-ctas") ||
                     document.querySelector(".ph5.pb5");
  if (actionsBar) {
    actionsBar.appendChild(btn);
  } else {
    // Fallback: fixed position
    btn.style.position = "fixed";
    btn.style.bottom = "20px";
    btn.style.right = "20px";
    btn.style.zIndex = "10000";
    document.body.appendChild(btn);
  }
}

async function handleSave() {
  const btn = document.getElementById("orion-save-btn");
  const originalText = btn.innerHTML;
  btn.innerHTML = "⏳ Salvando...";
  btn.disabled = true;

  try {
    const stored = await chrome.storage.local.get(["session", "planId"]);
    if (!stored.session || !stored.planId) {
      btn.innerHTML = "❌ Faça login na extensão";
      setTimeout(() => { btn.innerHTML = originalText; btn.disabled = false; }, 3000);
      return;
    }

    const profile = extractProfileData();
    if (!profile.name) {
      btn.innerHTML = "❌ Não foi possível extrair dados";
      setTimeout(() => { btn.innerHTML = originalText; btn.disabled = false; }, 3000);
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
      throw new Error(errData.message || `HTTP ${res.status}`);
    }

    btn.innerHTML = "✅ Salvo!";
    setTimeout(() => { btn.innerHTML = originalText; btn.disabled = false; }, 3000);
  } catch (err) {
    console.error("Orion save error:", err);
    btn.innerHTML = "❌ Erro ao salvar";
    setTimeout(() => { btn.innerHTML = originalText; btn.disabled = false; }, 3000);
  }
}

// Inject button when page loads
createSaveButton();

// Re-inject if LinkedIn does SPA navigation
const observer = new MutationObserver(() => {
  if (window.location.pathname.startsWith("/in/") && !document.getElementById("orion-save-btn")) {
    setTimeout(createSaveButton, 1000);
  }
});
observer.observe(document.body, { childList: true, subtree: true });
