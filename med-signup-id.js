/* ===========================================================================
   Auth0 ACUL · signup-id screen  ·  logic + DOM mount
   Pairs with signup-id.css
   ---------------------------------------------------------------------------
   In ACUL "advanced" mode Auth0 serves a bare page and loads this file via
   head_tags, so this script renders the whole screen, then enforces a REQUIRED
   phone number and hands submission back to Auth0 via @auth0/auth0-acul-js.

   The SDK import below is written for a bundler (Vite/webpack). If you are NOT
   bundling, swap it for the dynamic CDN import noted further down.
   =========================================================================== */

// --- Option A: bundled (recommended). Uncomment when building with a bundler:
// import SignupId from "@auth0/auth0-acul-js/signup-id";

// --- Option B: no bundler (loads from CDN at runtime). Used by default here.
let SignupIdCtor = null;
async function loadSdk() {
  if (!window.universal_login_context) return null;        // outside Auth0 → demo mode
  try {
    const mod = await import("https://esm.sh/@auth0/auth0-acul-js/signup-id");
    return mod.default;
  } catch (e) {
    console.warn("[acul] SDK failed to load; demo mode.", e);
    return null;
  }
}

/* ---------------------------------------------------------------------------
   1) Markup
   --------------------------------------------------------------------------- */
const TEMPLATE = `
  <div class="stage">
    <main class="card" role="form" aria-labelledby="screen-title">
      <span class="bracket tl"></span><span class="bracket tr"></span>
      <span class="bracket bl"></span><span class="bracket br"></span>

      <div class="ecg" aria-hidden="true">
        <span class="status"><span class="dot"></span>SECURE&nbsp;ENROLLMENT&nbsp;//&nbsp;LINK&nbsp;ACTIVE</span>
        <svg viewBox="0 0 800 64" preserveAspectRatio="none">
          <path class="trace" d="M0,40 L120,40 L150,40 L165,12 L180,58 L195,28 L210,40 L330,40
                                   L400,40 L430,40 L445,12 L460,58 L475,28 L490,40 L610,40
                                   L800,40" />
        </svg>
      </div>

      <div class="head">
        <span class="logo" aria-hidden="true">
          <svg width="46" height="50" viewBox="0 0 46 50" fill="none">
            <path d="M23 2 L43 9 V25 C43 38 34 46 23 49 C12 46 3 38 3 25 V9 Z"
                  fill="#081420" stroke="#00e5d4" stroke-width="2"/>
            <path d="M23 2 L43 9 V25 C43 33 38 39 31 43 L23 2Z" fill="rgba(0,229,212,.10)"/>
            <path d="M20 14 h6 v6 h6 v6 h-6 v6 h-6 v-6 h-6 v-6 h6 z"
                  fill="#00e5d4" filter="drop-shadow(0 0 4px #00e5d4)"/>
          </svg>
        </span>
        <p class="eyebrow">Isoft Medical · Patient Portal</p>
        <h1 class="title" id="screen-title">Create Your Account<span class="glyph">_</span></h1>
        <p class="sub">Sign up to <b>isoft-tests</b> to continue to Isoft Medical.</p>
      </div>

      <form id="signupForm" novalidate>
        <div class="row2">
          <div class="field">
            <label for="firstName">First name</label>
            <input class="control" id="firstName" name="given_name" autocomplete="given-name" placeholder="Jane" />
          </div>
          <div class="field">
            <label for="lastName">Last name</label>
            <input class="control" id="lastName" name="family_name" autocomplete="family-name" placeholder="Doe" />
          </div>
        </div>

        <div class="field" id="f-email">
          <label for="email">Email address <span class="req">*</span></label>
          <input class="control" id="email" name="email" type="email" inputmode="email"
                 autocomplete="email" placeholder="Email address" />
          <p class="err" id="e-email">⚠ A valid email is required.</p>
        </div>

        <div class="field" id="f-phone">
          <label for="phone">
            Phone number <span class="req">*</span>
            <span class="opt">(verification required)</span>
          </label>
          <div class="phone-grp">
            <select class="control cc" id="countryCode" aria-label="Country code">
              <option value="+40" data-iso="RO" selected>🇷🇴 RO +40</option>
              <option value="+972" data-iso="IL">🇮🇱 IL +972</option>
              <option value="+1"  data-iso="US">🇺🇸 US +1</option>
              <option value="+44" data-iso="GB">🇬🇧 GB +44</option>
              <option value="+49" data-iso="DE">🇩🇪 DE +49</option>
              <option value="+33" data-iso="FR">🇫🇷 FR +33</option>
              <option value="+34" data-iso="ES">🇪🇸 ES +34</option>
              <option value="+39" data-iso="IT">🇮🇹 IT +39</option>
            </select>
            <input class="control" id="phone" name="phone" type="tel" inputmode="tel"
                   autocomplete="tel-national" placeholder="Phone number" />
          </div>
          <p class="err" id="e-phone">⚠ Phone number is required to continue.</p>
        </div>

        <button class="submit" id="submitBtn" type="submit">Continue ▸</button>
        <p class="foot">Already have an account? <a id="loginLink" href="#">Log in</a></p>
      </form>
    </main>
  </div>
`;

/* ---------------------------------------------------------------------------
   2) Boot
   --------------------------------------------------------------------------- */
async function boot() {
  // Mount markup. ACUL pages expose a #root; fall back to body when standalone.
  const mount = document.getElementById("root") || document.body;
  mount.innerHTML = TEMPLATE;

  const $ = (id) => document.getElementById(id);
  let acul = null;

  // Wire the live SDK when running inside Auth0.
  SignupIdCtor = await loadSdk();
  if (SignupIdCtor) {
    try {
      acul = new SignupIdCtor();
      const loginUrl = acul?.transaction?.loginLink;
      if (loginUrl) $("loginLink").href = loginUrl;

      // Refill what the patient already entered (e.g. after "edit email"),
      // so they can correct instead of retyping the whole form.
      const pre = acul?.untrustedData?.submittedFormData || acul?.screen?.data || {};
      if (pre.email) $("email").value = pre.email;
      if (pre.given_name) $("firstName").value = pre.given_name;
      if (pre.family_name) $("lastName").value = pre.family_name;
      if (pre.phone) applyPhone(pre.phone);

      // Only replay a server error if that field is still empty/invalid now —
      // otherwise coming back to edit shows false "required" errors.
      (acul?.transaction?.errors || []).forEach((err) => {
        const tag = (err.field || err.code || "").toLowerCase();
        if (tag.includes("email") && !validEmail($("email").value)) showError("email", err.message);
        if (tag.includes("phone") && !validPhone($("phone").value)) showError("phone", err.message);
      });
    } catch (e) {
      console.warn("[acul] init failed; demo mode.", e);
    }
  }

  // Split a stored E.164 number back into the country prefix + local part.
  function applyPhone(full) {
    const f = String(full);
    const prefixes = Array.from($("countryCode").options)
      .map((o) => o.value).sort((a, b) => b.length - a.length);
    const match = prefixes.find((p) => f.startsWith(p));
    if (match) { $("countryCode").value = match; $("phone").value = f.slice(match.length); }
    else { $("phone").value = f.replace(/^\+/, ""); }
  }

  /* --- validation: phone is REQUIRED --- */
  function showError(which, msg) {
    if (msg) $("e-" + which).textContent = "⚠ " + msg;
    $("f-" + which).classList.add("invalid");
  }
  function clearError(which) { $("f-" + which).classList.remove("invalid"); }
  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim()); }
  function validPhone(v) {
    const d = String(v).replace(/[^\d]/g, "");
    return d.length >= 6 && d.length <= 14;
  }

  ["email", "phone"].forEach((id) =>
    $(id).addEventListener("input", () => clearError(id))
  );

  /* --- submit --- */
  $("signupForm").addEventListener("submit", (ev) => {
    ev.preventDefault();

    const email = $("email").value.trim();
    const phoneLocal = $("phone").value.trim();
    const prefix = $("countryCode").value;

    let ok = true;
    if (!validEmail(email)) { showError("email"); ok = false; }
    if (!phoneLocal) { showError("phone", "Phone number is required to continue."); ok = false; }
    else if (!validPhone(phoneLocal)) { showError("phone", "Enter a valid phone number."); ok = false; }
    if (!ok) { document.querySelector(".invalid .control")?.focus(); return; }

    // Normalize to E.164: strip national trunk 0, attach prefix.
    const e164 = prefix + phoneLocal.replace(/[^\d]/g, "").replace(/^0+/, "");

    const payload = {
      email,
      phone: e164,          // SDK requires this exact key (it threw "Missing parameter(s): phone" otherwise)
      given_name: $("firstName").value.trim(),
      family_name: $("lastName").value.trim(),
    };

    const btn = $("submitBtn");
    btn.disabled = true; btn.textContent = "Processing…";

    if (acul) {
      acul.signup(payload);                 // hand back to Auth0 to create the user
    } else {
      btn.textContent = "✓ Validated";      // demo / standalone preview
      console.log("[demo] would submit:", payload);
      setTimeout(() => { btn.disabled = false; btn.textContent = "Continue ▸"; }, 1400);
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
