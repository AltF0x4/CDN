/* ===========================================================================
   Auth0 ACUL · passkey-enrollment screen · auto-skip
   ---------------------------------------------------------------------------
   Instantiates the PasskeyEnrollment screen class and, on load, programmatically
   invokes its "skip / continue without passkey" action so the patient never has
   to interact with it. A fallback Continue button is revealed only if the auto-
   skip doesn't navigate away (e.g. SDK method renamed), so no one gets stuck.

   Self-contained: injects its own minimal styling, so you only need one head_tag
   (the script). Verify the skip method name against the current
   @auth0/auth0-acul-js docs — this file probes the likely names and uses
   whichever exists.
   =========================================================================== */

// --- Option A: bundled (recommended):
// import PasskeyEnrollment from "@auth0/auth0-acul-js/passkey-enrollment";

// --- Option B: no bundler (runtime CDN). Default.
async function loadSdk() {
  if (!window.universal_login_context) return null;          // outside Auth0 → demo
  try {
    const mod = await import("https://esm.sh/@auth0/auth0-acul-js/passkey-enrollment");
    return mod.default;
  } catch (e) {
    console.warn("[acul] passkey-enrollment SDK failed to load; demo mode.", e);
    return null;
  }
}

// Skip-action names this screen has used across SDK versions. First match wins.
const SKIP_METHODS = [
  "abortPasskeyEnrollment",
  "continueWithoutPasskey",
  "skipPasskeyEnrollment",
  "declinePasskeyEnrollment",
];

function injectStyles() {
  if (document.getElementById("pk-skip-styles")) return;
  const css = `
    @import url("https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@600;700&family=Share+Tech+Mono&display=swap");
    .pk-stage {
      min-height: 100vh; display: grid; place-items: center; padding: 28px 16px;
      background: #050810; color: #d8e6f2;
    }
    .pk-box { text-align: center; }
    .pk-spinner {
      width: 46px; height: 46px; margin: 0 auto 20px; border-radius: 50%;
      border: 2px solid rgba(0,229,212,.18); border-top-color: #00e5d4;
      box-shadow: 0 0 .6rem rgba(0,229,212,.35);
      animation: pk-spin .9s linear infinite;
    }
    @keyframes pk-spin { to { transform: rotate(360deg); } }
    .pk-msg {
      font-family: "Share Tech Mono", monospace; font-size: 12px;
      letter-spacing: .18em; text-transform: uppercase; color: #38f0e2;
      text-shadow: 0 0 .5rem rgba(0,229,212,.4);
    }
    .pk-fallback { display: none; margin-top: 22px; }
    .pk-btn {
      height: 48px; padding: 0 28px; border: 0; border-radius: 8px; cursor: pointer;
      background: linear-gradient(100deg, #00e5d4, #14b8c7 55%, #00e5d4); color: #02161a;
      font-family: "Chakra Petch", sans-serif; font-weight: 700; font-size: 14px;
      letter-spacing: .14em; text-transform: uppercase;
      box-shadow: 0 0 .5rem rgba(0,229,212,.55);
    }
    .pk-hint { margin-top: 10px; font-family: "Share Tech Mono", monospace; font-size: 11px; color: #6c829b; }
    @media (prefers-reduced-motion: reduce) { .pk-spinner { animation: none; } }
  `;
  const tag = document.createElement("style");
  tag.id = "pk-skip-styles";
  tag.textContent = css;
  document.head.appendChild(tag);
}

const TEMPLATE = `
  <div class="pk-stage">
    <div class="pk-box">
      <div class="pk-spinner" aria-hidden="true"></div>
      <p class="pk-msg" id="pkMsg">Finalizing your account…</p>
      <div class="pk-fallback" id="pkFallback">
        <button class="pk-btn" id="pkContinue" type="button">Continue ▸</button>
        <p class="pk-hint">Click to continue without setting up a passkey.</p>
      </div>
    </div>
  </div>
`;

async function boot() {
  injectStyles();
  const mount = document.getElementById("root") || document.body;
  mount.innerHTML = TEMPLATE;

  let acul = null;
  const Ctor = await loadSdk();
  if (Ctor) {
    try { acul = new Ctor(); } catch (e) { console.warn("[acul] init failed; demo mode.", e); }
  }

  function trySkip() {
    if (!acul) { console.log("[demo] would skip passkey enrollment"); return false; }
    const name = SKIP_METHODS.find((m) => typeof acul[m] === "function");
    if (!name) {
      console.error("[acul] no skip method found on PasskeyEnrollment. Available:", Object.keys(acul));
      return false;
    }
    try { acul[name](); return true; }
    catch (e) { console.error(`[acul] ${name}() failed`, e); return false; }
  }

  // Auto-skip immediately on load — the patient should never interact here.
  const fired = trySkip();

  // Safety net: if we're still on this screen, reveal a manual continue control.
  // Short delay when the auto-skip clearly didn't fire; longer when it did
  // (it should navigate away before this runs).
  setTimeout(() => {
    const fb = document.getElementById("pkFallback");
    if (fb) fb.style.display = "block";
    const msg = document.getElementById("pkMsg");
    if (msg && !fired) msg.textContent = "Almost done";
  }, fired ? 3000 : 700);

  document.getElementById("pkContinue").addEventListener("click", trySkip);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
