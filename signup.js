<!--
  ============================================================================
  Auth0 ACUL  •  Custom screen: signup-id  (prompt: signup-id)
  Theme: "VITAL://NET" — cyberpunk clinical terminal for Isoft Medical
  Change vs default: phone number is REQUIRED (was Optional).
  ----------------------------------------------------------------------------
  This single file renders standalone (demo mode) AND wires into the real
  Auth0 ACUL runtime when window.universal_login_context is present.
  See the DEPLOYMENT block at the bottom for how to ship it.
  ============================================================================
-->
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&display=swap" rel="stylesheet" />

<style>
  :root {
    --bg:        #050810;
    --bg-2:      #070c18;
    --surface:   #0b1322;
    --surface-2: #0e1828;
    --line:      #15263c;
    --cyan:      #00e5d4;
    --cyan-soft: #38f0e2;
    --magenta:   #ff2e7e;
    --amber:     #ffb347;
    --text:      #d8e6f2;
    --muted:     #6c829b;
    --muted-2:   #46586e;
    --glow-cyan: 0 0 0.5rem rgba(0,229,212,.55), 0 0 1.4rem rgba(0,229,212,.25);
    --glow-mag:  0 0 0.5rem rgba(255,46,126,.6), 0 0 1.4rem rgba(255,46,126,.3);
  }

  * { box-sizing: border-box; }

  html, body {
    margin: 0;
    min-height: 100%;
    background: var(--bg);
    color: var(--text);
    font-family: "Rajdhani", system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  /* Ambient backdrop: grid + radial wash + slow drift */
  body::before {
    content: "";
    position: fixed; inset: 0;
    background:
      radial-gradient(1100px 700px at 50% -10%, rgba(0,229,212,.10), transparent 60%),
      radial-gradient(900px 600px at 110% 120%, rgba(255,46,126,.08), transparent 55%),
      linear-gradient(var(--bg-2), var(--bg));
    z-index: -2;
  }
  body::after {
    content: "";
    position: fixed; inset: -2px;
    background-image:
      linear-gradient(rgba(0,229,212,.045) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,229,212,.045) 1px, transparent 1px);
    background-size: 44px 44px;
    mask-image: radial-gradient(ellipse 80% 70% at 50% 40%, #000 30%, transparent 90%);
    z-index: -1;
    animation: drift 32s linear infinite;
  }
  @keyframes drift { to { background-position: 44px 44px, 44px 44px; } }

  .stage {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 28px 16px;
  }

  /* ---- The card / terminal ---- */
  .card {
    position: relative;
    width: 100%;
    max-width: 432px;
    background:
      linear-gradient(180deg, rgba(14,24,40,.92), rgba(8,14,26,.94));
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 0 0 30px;
    overflow: hidden;
    box-shadow:
      0 0 0 1px rgba(0,229,212,.06),
      0 30px 80px -30px rgba(0,0,0,.9),
      inset 0 1px 0 rgba(255,255,255,.03);
  }
  /* corner brackets — the framing motif */
  .card .bracket {
    position: absolute; width: 18px; height: 18px;
    border: 2px solid var(--cyan);
    opacity: .7; pointer-events: none;
  }
  .bracket.tl { top: 10px; left: 10px; border-right: 0; border-bottom: 0; }
  .bracket.tr { top: 10px; right: 10px; border-left: 0; border-bottom: 0; }
  .bracket.bl { bottom: 10px; left: 10px; border-right: 0; border-top: 0; }
  .bracket.br { bottom: 10px; right: 10px; border-left: 0; border-top: 0; }

  /* ---- Signature element: live ECG header ---- */
  .ecg {
    position: relative;
    height: 64px;
    border-bottom: 1px solid var(--line);
    background:
      linear-gradient(180deg, rgba(0,229,212,.08), transparent);
    overflow: hidden;
  }
  .ecg svg { position: absolute; inset: 0; width: 200%; height: 100%; }
  .ecg .trace {
    fill: none;
    stroke: var(--cyan);
    stroke-width: 2;
    filter: drop-shadow(0 0 4px rgba(0,229,212,.9));
    animation: sweep 4.5s linear infinite;
  }
  @keyframes sweep { to { transform: translateX(-50%); } }
  .ecg .status {
    position: absolute; top: 9px; left: 16px;
    font-family: "Share Tech Mono", monospace;
    font-size: 10.5px; letter-spacing: .12em;
    color: var(--cyan-soft);
    text-shadow: var(--glow-cyan);
  }
  .ecg .status .dot {
    display: inline-block; width: 6px; height: 6px; border-radius: 50%;
    background: var(--cyan); margin-right: 6px; vertical-align: middle;
    box-shadow: var(--glow-cyan); animation: blink 1.6s steps(2) infinite;
  }
  @keyframes blink { 50% { opacity: .25; } }

  /* ---- Brand head ---- */
  .head { text-align: center; padding: 26px 32px 6px; }
  .logo { display: inline-flex; }
  .logo svg { filter: drop-shadow(0 0 8px rgba(0,229,212,.5)); }
  .eyebrow {
    margin: 14px 0 0;
    font-family: "Share Tech Mono", monospace;
    font-size: 10.5px; letter-spacing: .26em; text-transform: uppercase;
    color: var(--cyan-soft);
  }
  .title {
    margin: 6px 0 4px;
    font-family: "Chakra Petch", sans-serif;
    font-weight: 700; font-size: 25px; letter-spacing: .01em;
    color: #f2f9ff;
  }
  .title .glyph { color: var(--magenta); text-shadow: var(--glow-mag); }
  .sub {
    margin: 0; color: var(--muted);
    font-size: 13.5px; letter-spacing: .02em;
  }
  .sub b { color: var(--cyan-soft); font-weight: 600; }

  /* ---- Form ---- */
  form { padding: 22px 32px 0; display: grid; gap: 14px; }

  .field { position: relative; }
  .field label {
    display: flex; align-items: center; gap: 6px;
    font-family: "Share Tech Mono", monospace;
    font-size: 10.5px; letter-spacing: .14em; text-transform: uppercase;
    color: var(--muted); margin-bottom: 5px;
  }
  .req { color: var(--magenta); text-shadow: var(--glow-mag); }
  .opt { color: var(--muted-2); text-transform: none; letter-spacing: .05em; }

  .control {
    width: 100%;
    height: 46px;
    padding: 0 14px;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 8px;
    color: var(--text);
    font-family: "Rajdhani", sans-serif;
    font-size: 16px; font-weight: 500;
    letter-spacing: .01em;
    outline: none;
    transition: border-color .18s, box-shadow .18s, background .18s;
  }
  .control::placeholder { color: var(--muted-2); }
  .control:hover { border-color: #20364f; }
  .control:focus {
    border-color: var(--cyan);
    background: var(--surface-2);
    box-shadow: var(--glow-cyan);
  }

  .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  /* phone group: country prefix + number */
  .phone-grp { display: grid; grid-template-columns: 132px 1fr; gap: 10px; }
  .cc {
    appearance: none;
    background:
      var(--surface)
      url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8'><path d='M1 1l5 5 5-5' fill='none' stroke='%2300e5d4' stroke-width='1.6'/></svg>")
      no-repeat right 12px center;
    padding-right: 30px;
    font-family: "Share Tech Mono", monospace;
    font-size: 13px;
  }
  .cc option { background: #0b1322; color: var(--text); }

  /* the required-phone field gets a subtle persistent cue */
  #phone {
    border-color: rgba(255,46,126,.28);
  }
  #phone:focus { border-color: var(--cyan); }

  .err {
    display: none;
    margin-top: 6px;
    font-family: "Share Tech Mono", monospace;
    font-size: 11px; letter-spacing: .04em;
    color: var(--magenta);
  }
  .field.invalid .control { border-color: var(--magenta); box-shadow: var(--glow-mag); }
  .field.invalid .err { display: block; }

  /* ---- Submit ---- */
  .submit {
    margin-top: 6px;
    height: 50px;
    border: 0; border-radius: 8px;
    cursor: pointer;
    position: relative; overflow: hidden;
    background: linear-gradient(100deg, var(--cyan), #14b8c7 55%, var(--cyan));
    color: #02161a;
    font-family: "Chakra Petch", sans-serif;
    font-weight: 700; font-size: 15px;
    letter-spacing: .14em; text-transform: uppercase;
    box-shadow: var(--glow-cyan);
    transition: transform .12s, filter .18s, box-shadow .18s;
  }
  .submit:hover { filter: brightness(1.08); box-shadow: 0 0 1rem rgba(0,229,212,.7), 0 0 2.4rem rgba(0,229,212,.35); }
  .submit:active { transform: translateY(1px); }
  .submit::after { /* scanline shimmer */
    content: ""; position: absolute; top: 0; left: -60%;
    width: 40%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.55), transparent);
    transform: skewX(-20deg);
    animation: shine 3.6s ease-in-out infinite;
  }
  @keyframes shine { 0%,70% { left: -60%; } 100% { left: 140%; } }

  .foot {
    margin: 18px 0 0; text-align: center;
    font-size: 13.5px; color: var(--muted);
  }
  .foot a {
    color: var(--cyan-soft); text-decoration: none; font-weight: 600;
    letter-spacing: .02em;
  }
  .foot a:hover { text-shadow: var(--glow-cyan); }

  /* a11y */
  .control:focus-visible, .submit:focus-visible, .foot a:focus-visible {
    outline: 2px solid var(--cyan-soft); outline-offset: 2px;
  }
  @media (prefers-reduced-motion: reduce) {
    .ecg .trace, body::after, .submit::after, .ecg .status .dot { animation: none; }
  }
  @media (max-width: 420px) {
    .row2 { grid-template-columns: 1fr; }
    .phone-grp { grid-template-columns: 116px 1fr; }
  }
</style>

<div class="stage">
  <main class="card" role="form" aria-labelledby="screen-title">
    <span class="bracket tl"></span><span class="bracket tr"></span>
    <span class="bracket bl"></span><span class="bracket br"></span>

    <!-- Signature: ECG sweep -->
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
               autocomplete="email" placeholder="dumitrus+56@isoft.co.il" />
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
                 autocomplete="tel-national" placeholder="0723923876" />
        </div>
        <p class="err" id="e-phone">⚠ Phone number is required to continue.</p>
      </div>

      <button class="submit" id="submitBtn" type="submit">Continue ▸</button>

      <p class="foot">Already have an account? <a id="loginLink" href="#">Log in</a></p>
    </form>
  </main>
</div>

<script type="module">
  /* =========================================================================
     1) ACUL runtime hookup (real Auth0) — gracefully no-ops in preview.
     ========================================================================= */
  let acul = null;
  async function initAcul() {
    if (!window.universal_login_context) return null;        // running outside Auth0 → demo mode
    try {
      // In a real build you bundle this import; via CDN it also works:
      const { default: SignupId } =
        await import("https://esm.sh/@auth0/auth0-acul-js/signup-id");
      acul = new SignupId();

      // Pull server-provided links / prefilled data when available.
      const loginUrl = acul?.transaction?.loginLink;
      if (loginUrl) document.getElementById("loginLink").href = loginUrl;

      // Surface any server-side field errors Auth0 returned on a previous attempt.
      (acul?.transaction?.errors || []).forEach(err => {
        if (/phone/i.test(err.field || err.code || "")) showError("phone", err.message);
        if (/email/i.test(err.field || err.code || "")) showError("email", err.message);
      });
    } catch (e) {
      console.warn("ACUL SDK not loaded; demo mode.", e);
    }
    return acul;
  }

  /* =========================================================================
     2) Validation — phone is now REQUIRED (the whole point of this screen).
     ========================================================================= */
  const $ = id => document.getElementById(id);

  function showError(which, msg) {
    const field = $("f-" + which);
    if (msg) $("e-" + which).textContent = "⚠ " + msg;
    field.classList.add("invalid");
  }
  function clearError(which) { $("f-" + which).classList.remove("invalid"); }

  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }
  function validPhone(v) {
    const digits = v.replace(/[^\d]/g, "");
    return digits.length >= 6 && digits.length <= 14;           // required + sane length
  }

  ["email","phone"].forEach(id =>
    $(id).addEventListener("input", () => clearError(id))
  );

  /* =========================================================================
     3) Submit
     ========================================================================= */
  $("signupForm").addEventListener("submit", async (ev) => {
    ev.preventDefault();

    const email = $("email").value.trim();
    const phoneLocal = $("phone").value.trim();
    const prefix = $("countryCode").value;

    let ok = true;
    if (!validEmail(email)) { showError("email"); ok = false; }
    if (!phoneLocal)        { showError("phone", "Phone number is required to continue."); ok = false; }
    else if (!validPhone(phoneLocal)) { showError("phone", "Enter a valid phone number."); ok = false; }
    if (!ok) { (document.querySelector(".invalid .control") || {}).focus?.(); return; }

    // Normalize: strip a leading 0 (national trunk) then attach E.164 prefix.
    const e164 = prefix + phoneLocal.replace(/[^\d]/g, "").replace(/^0+/, "");

    const payload = {
      email,
      phone: e164,
      given_name:  $("firstName").value.trim(),
      family_name: $("lastName").value.trim(),
    };

    const btn = $("submitBtn");
    btn.disabled = true; btn.textContent = "Processing…";

    if (acul) {
      // → hands control back to Auth0 to create the user / advance the flow.
      acul.signup(payload);
    } else {
      // Demo mode (preview): just echo so the screen is testable on its own.
      btn.textContent = "✓ Validated";
      console.log("[demo] would submit:", payload);
      setTimeout(() => { btn.disabled = false; btn.textContent = "Continue ▸"; }, 1400);
    }
  });

  initAcul();
</script>

<!--
  ============================================================================
  DEPLOYMENT — making this the live signup-id screen (ACUL "advanced" mode)
  ============================================================================
  ACUL advanced mode loads YOUR JS/CSS into Auth0's hosted page. The flow:

  1. Build & host your assets. Bundle the @auth0/auth0-acul-js import (Vite/
     webpack) into e.g.  signup-id.js  and  signup-id.css , and upload them to
     a CDN you control (HTTPS, public).

  2. Point the screen at your assets via the Management API:

     PATCH /api/v2/prompts/signup-id/screen/signup-id/rendering
     Authorization: Bearer <mgmt-api-token with update:prompts>
     {
       "rendering_mode": "advanced",
       "context_configuration": [
         "screen.texts",
         "transaction.errors",
         "transaction.login_link"
       ],
       "head_tags": [
         { "tag": "link",   "attributes": { "rel": "stylesheet", "href": "https://YOUR-CDN/signup-id.css" } },
         { "tag": "script", "attributes": { "src": "https://YOUR-CDN/signup-id.js", "defer": true } }
       ]
     }

  3. Reset to default any time with  "rendering_mode": "standard".

  NOTE ON "required": ACUL doesn't expose a server-side "make phone required"
  toggle for this screen — the optional/required behavior here is enforced in
  YOUR screen code (the validation above). If you also want a hard server-side
  guarantee, pair this with a Pre User Registration Action that calls
  api.access.deny() when the phone attribute is missing, so a crafted request
  can't bypass the UI.

  Verify method/field names (e.g. acul.signup payload keys, transaction.loginLink)
  against the current @auth0/auth0-acul-js docs — the SDK iterates often.
  ============================================================================
-->
