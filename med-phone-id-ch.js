/* ===========================================================================
   Auth0 ACUL · phone-identifier-challenge screen · logic + DOM mount
   Pairs with phone-identifier-challenge.css
   ---------------------------------------------------------------------------
   This is the OTP step: the patient enters the code sent to the phone number
   captured on signup-id. Renders the screen, runs a segmented 6-digit input
   with paste support + resend cooldown, and hands the code back to Auth0 via
   @auth0/auth0-acul-js.

   SDK import is set up for a bundler; a no-bundler CDN fallback is used by
   default. Method/field names (submitPhoneChallenge, resendCode,
   screen.data.phone, transaction.errors) should be verified against the
   current @auth0/auth0-acul-js docs.
   =========================================================================== */

// --- Option A: bundled (recommended):
// import PhoneIdentifierChallenge from "@auth0/auth0-acul-js/phone-identifier-challenge";

// --- Option B: no bundler (runtime CDN). Default.
async function loadSdk() {
  if (!window.universal_login_context) return null;          // outside Auth0 → demo
  try {
    const mod = await import("https://esm.sh/@auth0/auth0-acul-js/phone-identifier-challenge");
    return mod.default;
  } catch (e) {
    console.warn("[acul] SDK failed to load; demo mode.", e);
    return null;
  }
}

const OTP_LEN = 6;
const RESEND_COOLDOWN = 30; // seconds

const TEMPLATE = `
  <div class="stage">
    <main class="card" role="form" aria-labelledby="screen-title">
      <span class="bracket tl"></span><span class="bracket tr"></span>
      <span class="bracket bl"></span><span class="bracket br"></span>

      <div class="ecg" aria-hidden="true">
        <span class="status"><span class="dot"></span>OTP&nbsp;CHALLENGE&nbsp;//&nbsp;AWAITING&nbsp;CODE</span>
        <svg viewBox="0 0 800 64" preserveAspectRatio="none">
          <path class="trace" d="M0,40 L120,40 L150,40 L165,12 L180,58 L195,28 L210,40 L330,40
                                   L400,40 L430,40 L445,12 L460,58 L475,28 L490,40 L610,40
                                   L800,40" />
        </svg>
      </div>

      <div class="head">
        <button class="back-top" id="backTop" type="button">‹ Back to sign up</button>
        <span class="logo" aria-hidden="true">
          <svg width="46" height="50" viewBox="0 0 46 50" fill="none">
            <path d="M23 2 L43 9 V25 C43 38 34 46 23 49 C12 46 3 38 3 25 V9 Z"
                  fill="#081420" stroke="#00e5d4" stroke-width="2"/>
            <path d="M23 2 L43 9 V25 C43 33 38 39 31 43 L23 2Z" fill="rgba(0,229,212,.10)"/>
            <path d="M20 14 h6 v6 h6 v6 h-6 v6 h-6 v-6 h-6 v-6 h6 z"
                  fill="#00e5d4" filter="drop-shadow(0 0 4px #00e5d4)"/>
          </svg>
        </span>
        <p class="eyebrow">Isoft Medical · Identity Check</p>
        <h1 class="title" id="screen-title">Verify Your Number<span class="glyph">_</span></h1>
        <p class="sub">Enter the 6-digit code sent to <b id="phoneMask">your phone</b>.</p>
      </div>

      <div class="body">
        <div class="otp-grid" id="otpGrid" role="group" aria-label="6-digit verification code">
          ${Array.from({ length: OTP_LEN }).map((_, i) =>
            `<input class="otp-cell" inputmode="numeric" autocomplete="${i === 0 ? "one-time-code" : "off"}"
                    maxlength="1" pattern="[0-9]*" aria-label="Digit ${i + 1}" data-i="${i}" />`
          ).join("")}
        </div>
        <p class="err" id="err" role="alert"></p>

        <button class="submit" id="verifyBtn" type="button" disabled>Verify ▸</button>

        <p class="resend-row">
          Didn't get a code?
          <button class="linkbtn" id="resendBtn" type="button" disabled>Resend</button>
          <span class="timer" id="timer"></span>
        </p>
        <p class="foot">
          <button class="linkbtn" id="backBtn" type="button">Use a different number</button>
        </p>
      </div>
    </main>
  </div>
`;

async function boot() {
  const mount = document.getElementById("root") || document.body;
  mount.innerHTML = TEMPLATE;

  const $ = (id) => document.getElementById(id);
  const cells = Array.from(document.querySelectorAll(".otp-cell"));
  const grid = $("otpGrid");
  const verifyBtn = $("verifyBtn");
  const resendBtn = $("resendBtn");
  const timerEl = $("timer");
  const errEl = $("err");

  // --- SDK wiring (live inside Auth0) ---
  let acul = null;
  const Ctor = await loadSdk();
  if (Ctor) {
    try {
      acul = new Ctor();
      const phone = acul?.screen?.data?.phone || acul?.screen?.data?.phoneNumber;
      if (phone) $("phoneMask").textContent = formatPhone(phone);
      (acul?.transaction?.errors || []).forEach((e) => showError(e.message || "Invalid code."));
    } catch (e) {
      console.warn("[acul] init failed; demo mode.", e);
    }
  }
  // Demo fallback so the number is visible when previewing outside Auth0.
  if (!acul && $("phoneMask").textContent === "your phone") {
    $("phoneMask").textContent = "+40 723 923 876";
  }

  function formatPhone(p) {
    // Show the real number, grouped from the right in 3s. The patient needs to
    // confirm it's what they typed, so no heavy masking and no country-code guessing.
    const s = String(p).replace(/[^\d+]/g, "");
    const plus = s.startsWith("+") ? "+" : "";
    const digits = s.replace(/\D/g, "");
    return plus + digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }
  function showError(msg) {
    errEl.textContent = "⚠ " + msg;
    grid.classList.add("invalid");
  }
  function clearError() { errEl.textContent = ""; grid.classList.remove("invalid"); }

  const codeValue = () => cells.map((c) => c.value).join("");
  const isComplete = () => codeValue().length === OTP_LEN && /^\d{6}$/.test(codeValue());

  function refresh() {
    cells.forEach((c) => c.classList.toggle("filled", c.value !== ""));
    verifyBtn.disabled = !isComplete();
  }

  // --- segmented input behavior ---
  cells.forEach((cell, i) => {
    cell.addEventListener("input", () => {
      clearError();
      cell.value = cell.value.replace(/\D/g, "").slice(-1); // last digit only
      if (cell.value && i < OTP_LEN - 1) cells[i + 1].focus();
      refresh();
      if (isComplete()) submit();
    });
    cell.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !cell.value && i > 0) {
        cells[i - 1].focus(); cells[i - 1].value = ""; refresh(); e.preventDefault();
      }
      if (e.key === "ArrowLeft" && i > 0) cells[i - 1].focus();
      if (e.key === "ArrowRight" && i < OTP_LEN - 1) cells[i + 1].focus();
    });
    cell.addEventListener("paste", (e) => {
      e.preventDefault();
      const digits = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, OTP_LEN);
      digits.split("").forEach((d, k) => { if (cells[k]) cells[k].value = d; });
      refresh();
      (cells[Math.min(digits.length, OTP_LEN - 1)] || cells[0]).focus();
      if (isComplete()) submit();
    });
  });

  // --- submit / verify ---
  function submit() {
    if (!isComplete()) return;
    const code = codeValue();
    verifyBtn.disabled = true; verifyBtn.textContent = "Verifying…";

    if (acul) {
      acul.submitPhoneChallenge({ code });        // → Auth0 validates + advances
    } else {
      // demo: treat 123456 as valid
      setTimeout(() => {
        if (code === "123456") {
          verifyBtn.textContent = "✓ Verified";
        } else {
          showError("That code didn't match. Try again.");
          cells.forEach((c) => (c.value = ""));
          refresh(); cells[0].focus();
          verifyBtn.textContent = "Verify ▸";
        }
      }, 900);
    }
  }
  verifyBtn.addEventListener("click", submit);

  // --- resend cooldown ---
  let remaining = 0, tick = null;
  function startCooldown() {
    remaining = RESEND_COOLDOWN;
    resendBtn.disabled = true;
    renderTimer();
    clearInterval(tick);
    tick = setInterval(() => {
      remaining -= 1; renderTimer();
      if (remaining <= 0) { clearInterval(tick); resendBtn.disabled = false; timerEl.textContent = ""; }
    }, 1000);
  }
  function renderTimer() {
    timerEl.textContent = remaining > 0 ? `(${remaining}s)` : "";
  }
  resendBtn.addEventListener("click", () => {
    clearError();
    if (acul) { try { acul.resendCode(); } catch (e) { console.warn(e); } }
    else { console.log("[demo] resend requested"); }
    cells.forEach((c) => (c.value = "")); refresh(); cells[0].focus();
    startCooldown();
  });

  // --- back / change number (go back to signup-id) ---
  function goBack() {
    if (acul && typeof acul.returnToPrevious === "function") acul.returnToPrevious();
    else if (acul?.screen?.links?.back) location.href = acul.screen.links.back;
    else console.log("[demo] back to signup-id (number entry)");
  }
  $("backTop").addEventListener("click", goBack);
  $("backBtn").addEventListener("click", goBack);

  // init
  cells[0].focus();
  startCooldown();
  refresh();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
