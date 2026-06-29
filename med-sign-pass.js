/* ===========================================================================
   Auth0 ACUL · signup-password screen · logic + DOM mount
   Pairs with signup-password.css
   ---------------------------------------------------------------------------
   Final signup step after phone verification. Shows the EMAIL already entered
   (read-only, with an Edit link back to signup-id), collects a password with
   show/hide + a live strength/requirements hint, then hands off to Auth0.

   Verify against current @auth0/auth0-acul-js docs: the submit method
   (signup / submit), where the email lands (screen.data.email vs
   transaction / untrustedData), and the edit-identifier link name.
   =========================================================================== */

// --- Option A: bundled (recommended):
// import SignupPassword from "@auth0/auth0-acul-js/signup-password";

// --- Option B: no bundler (runtime CDN). Default.
async function loadSdk() {
  if (!window.universal_login_context) return null;          // outside Auth0 → demo
  try {
    const mod = await import("https://esm.sh/@auth0/auth0-acul-js/signup-password");
    return mod.default;
  } catch (e) {
    console.warn("[acul] SDK failed to load; demo mode.", e);
    return null;
  }
}

const TEMPLATE = `
  <div class="stage">
    <main class="card" role="form" aria-labelledby="screen-title">
      <span class="bracket tl"></span><span class="bracket tr"></span>
      <span class="bracket bl"></span><span class="bracket br"></span>

      <div class="ecg" aria-hidden="true">
        <span class="status"><span class="dot"></span>ACCOUNT&nbsp;SETUP&nbsp;//&nbsp;SET&nbsp;CREDENTIALS</span>
        <svg viewBox="0 0 800 64" preserveAspectRatio="none">
          <path class="trace" d="M0,40 L120,40 L150,40 L165,12 L180,58 L195,28 L210,40 L330,40
                                   L400,40 L430,40 L445,12 L460,58 L475,28 L490,40 L610,40
                                   L800,40" />
        </svg>
      </div>

      <div class="head">
        <button class="back-top" id="backTop" type="button">‹ Back</button>
        <span class="logo" aria-hidden="true">
          <svg width="46" height="50" viewBox="0 0 46 50" fill="none">
            <path d="M23 2 L43 9 V25 C43 38 34 46 23 49 C12 46 3 38 3 25 V9 Z"
                  fill="#081420" stroke="#00e5d4" stroke-width="2"/>
            <path d="M23 2 L43 9 V25 C43 33 38 39 31 43 L23 2Z" fill="rgba(0,229,212,.10)"/>
            <path d="M20 14 h6 v6 h6 v6 h-6 v6 h-6 v-6 h-6 v-6 h6 z"
                  fill="#00e5d4" filter="drop-shadow(0 0 4px #00e5d4)"/>
          </svg>
        </span>
        <p class="eyebrow">Isoft Medical · Final Step</p>
        <h1 class="title" id="screen-title">Set a Password<span class="glyph">_</span></h1>
        <p class="sub">Phone verified. Secure your account to finish.</p>
      </div>

      <div class="body">
        <!-- the email used, shown for confirmation -->
        <div class="identity">
          <svg class="ico" width="18" height="18" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.6"/>
            <path d="M4 7l8 6 8-6" stroke="currentColor" stroke-width="1.6" fill="none"/>
          </svg>
          <span class="id-text">
            <span class="id-label">Registering</span>
            <span class="id-value" id="emailValue">—</span>
          </span>
          <button class="edit" id="editEmail" type="button">Edit</button>
        </div>

        <!-- the verified phone, shown for confirmation (not editable here) -->
        <div class="identity">
          <svg class="ico" width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"
                  stroke="currentColor" stroke-width="1.6" fill="none"/>
          </svg>
          <span class="id-text">
            <span class="id-label">Verified phone</span>
            <span class="id-value" id="phoneValue">—</span>
          </span>
          <span class="verified-tag">✓ Verified</span>
        </div>

        <div class="field" id="f-password">
          <label for="password">Password <span class="req">*</span></label>
          <div class="pw-wrap">
            <input class="control" id="password" name="password" type="password"
                   autocomplete="new-password" placeholder="••••••••••••" />
            <button class="toggle" id="togglePw" type="button" aria-label="Show password">Show</button>
          </div>
          <div class="meter" id="meter" data-score="0" aria-hidden="true">
            <span></span><span></span><span></span><span></span>
          </div>
          <div class="rules" id="rules">
            <div class="rule" data-rule="len"><span class="mark">·</span>At least 8 characters</div>
            <div class="rule" data-rule="case"><span class="mark">·</span>Upper &amp; lower case letters</div>
            <div class="rule" data-rule="num"><span class="mark">·</span>At least one number</div>
            <div class="rule" data-rule="sym"><span class="mark">·</span>At least one symbol</div>
          </div>
          <p class="err" id="err" role="alert"></p>
        </div>

        <button class="submit" id="submitBtn" type="button" disabled>Create account ▸</button>
        <p class="foot">Already have an account? <a id="loginLink" href="#">Log in</a></p>
      </div>
    </main>
  </div>
`;

async function boot() {
  const mount = document.getElementById("root") || document.body;
  mount.innerHTML = TEMPLATE;

  const $ = (id) => document.getElementById(id);
  const pw = $("password");
  const submitBtn = $("submitBtn");
  const meter = $("meter");
  const errEl = $("err");

  // --- SDK wiring (live inside Auth0) ---
  let acul = null, email = "", phone = "";
  const Ctor = await loadSdk();
  if (Ctor) {
    try {
      acul = new Ctor();
      const pre = acul?.untrustedData?.submittedFormData || {};
      email =
        acul?.screen?.data?.email || pre.email ||
        acul?.transaction?.identifier || "";
      phone =
        acul?.screen?.data?.phone || acul?.screen?.data?.phoneNumber || pre.phone || "";
      const loginUrl = acul?.transaction?.loginLink;
      if (loginUrl) $("loginLink").href = loginUrl;
      (acul?.transaction?.errors || []).forEach((e) => showError(e.message || "Check your password."));
    } catch (e) {
      console.warn("[acul] init failed; demo mode.", e);
    }
  }
  if (!email) email = "dumitrus+56@isoft.co.il";   // demo fallback so preview shows something
  if (!phone) phone = "+40723923876";              // demo fallback
  $("emailValue").textContent = email;
  $("emailValue").title = email;
  $("phoneValue").textContent = formatPhone(phone);
  $("phoneValue").title = phone;

  function formatPhone(p) {
    const s = String(p).replace(/[^\d+]/g, "");
    const plus = s.startsWith("+") ? "+" : "";
    return plus + s.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }

  function showError(msg) { errEl.textContent = "⚠ " + msg; $("f-password").classList.add("invalid"); }
  function clearError() { errEl.textContent = ""; $("f-password").classList.remove("invalid"); }

  // --- show / hide ---
  $("togglePw").addEventListener("click", () => {
    const showing = pw.type === "text";
    pw.type = showing ? "password" : "text";
    $("togglePw").textContent = showing ? "Show" : "Hide";
    $("togglePw").setAttribute("aria-label", showing ? "Show password" : "Hide password");
    pw.focus();
  });

  // --- strength + rules (client-side hint; Auth0 enforces the real policy) ---
  const checks = {
    len:  (v) => v.length >= 8,
    case: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v),
    num:  (v) => /\d/.test(v),
    sym:  (v) => /[^A-Za-z0-9]/.test(v),
  };
  function evaluate() {
    const v = pw.value;
    let score = 0;
    Object.entries(checks).forEach(([k, fn]) => {
      const ok = fn(v);
      if (ok) score++;
      $("rules").querySelector(`[data-rule="${k}"]`).classList.toggle("ok", ok);
      $("rules").querySelector(`[data-rule="${k}"] .mark`).textContent = ok ? "✓" : "·";
    });
    meter.setAttribute("data-score", v ? String(score) : "0");
    submitBtn.disabled = score < 4;   // mirror the 4 hinted rules; server still validates
    return score;
  }
  pw.addEventListener("input", () => { clearError(); evaluate(); });

  // --- submit ---
  function submit() {
    if (submitBtn.disabled) return;
    submitBtn.disabled = true; submitBtn.textContent = "Creating…";
     // If phone number is required, you need to pass it in the sign-up request
     // If phone number is optional, you can skipp it
     // const payload = { email, phone_number: phone, password: pw.value };
     const payload = { username: email, password: pw.value, 'ulp-phone': phone};
    if (acul) {
      acul.signup(payload);            // → Auth0 creates the user / completes signup
    } else {
      setTimeout(() => { submitBtn.textContent = "✓ Account created"; console.log("[demo] signup:", { email }); }, 1000);
    }
  }
  submitBtn.addEventListener("click", submit);
  pw.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });

  // --- edit email / back to signup-id ---
  function goBack() {
    const link = acul?.screen?.links?.edit_identifier || acul?.transaction?.editIdentifierLink;
    if (acul && typeof acul.returnToPrevious === "function") acul.returnToPrevious();
    else if (link) location.href = link;
    else console.log("[demo] back to signup-id to edit email");
  }
  $("editEmail").addEventListener("click", goBack);
  $("backTop").addEventListener("click", goBack);

  pw.focus();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
