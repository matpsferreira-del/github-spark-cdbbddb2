const SUPABASE_URL = "https://ywhxhkfgjkngafqkbfdw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3aHhoa2ZnamtuZ2FmcWtiZmR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0OTAwMzcsImV4cCI6MjA5MDA2NjAzN30.C-8mAq3Dv5p-W4nWxGxI0kO8miYOW0po2CWF8BUrPVk";

document.addEventListener("DOMContentLoaded", async () => {
  const loginForm = document.getElementById("login-form");
  const loggedInView = document.getElementById("logged-in-view");
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const loginStatus = document.getElementById("login-status");
  const userEmailEl = document.getElementById("user-email");

  // Check if already logged in
  const stored = await chrome.storage.local.get(["session", "userEmail", "planId"]);
  if (stored.session && stored.userEmail) {
    showLoggedIn(stored.userEmail);
  }

  loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    if (!email || !password) return;

    loginBtn.disabled = true;
    loginStatus.textContent = "Entrando...";
    loginStatus.className = "status";

    try {
      // Sign in
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.error || !data.access_token) throw new Error(data.error_description || data.msg || "Erro no login");

      // Get mentee plan access
      const planRes = await fetch(`${SUPABASE_URL}/rest/v1/mentee_plan_access?user_id=eq.${data.user.id}&select=plan_id&limit=1`, {
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${data.access_token}`,
        },
      });
      const planData = await planRes.json();
      const planId = planData?.[0]?.plan_id;

      if (!planId) throw new Error("Nenhum plano encontrado para este usuário");

      await chrome.storage.local.set({
        session: data.access_token,
        refreshToken: data.refresh_token,
        userEmail: email,
        userId: data.user.id,
        planId: planId,
      });

      showLoggedIn(email);
    } catch (err) {
      loginStatus.textContent = err.message;
      loginStatus.className = "status error";
    } finally {
      loginBtn.disabled = false;
    }
  });

  logoutBtn.addEventListener("click", async () => {
    await chrome.storage.local.clear();
    loginForm.style.display = "block";
    loggedInView.style.display = "none";
  });

  function showLoggedIn(email) {
    loginForm.style.display = "none";
    loggedInView.style.display = "block";
    userEmailEl.textContent = email;
  }
});
