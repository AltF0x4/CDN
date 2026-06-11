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
    @import url("https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@600;700&family=Rajdhani:wght@500;600&family=Share+Tech+Mono&display=swap");
    :root {
      --bg:#050810; --bg-2:#070c18; --line:#15263c; --cyan:#00e5d4; --cyan-soft:#38f0e2;
      --magenta:#ff2e7e; --text:#d8e6f2; --muted:#6c829b;
      --glow-cyan:0 0 .5rem rgba(0,229,212,.55), 0 0 1.4rem rgba(0,229,212,.25);
    }
    html, body { margin:0; min-height:100%; background:var(--bg); }
    .pk-stage {
      position:relative; min-height:100vh; display:grid; place-items:center; padding:28px 16px;
      font-family:"Rajdhani", system-ui, sans-serif; color:var(--text);
      background:
        radial-gradient(1100px 700px at 50% -10%, rgba(0,229,212,.10), transparent 60%),
        radial-gradient(900px 600px at 110% 120%, rgba(255,46,126,.08), transparent 55%),
        linear-gradient(var(--bg-2), var(--bg));
    }
    .pk-stage::after {
      content:""; position:absolute; inset:0; pointer-events:none;
      background-image:
        linear-gradient(rgba(0,229,212,.045) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,229,212,.045) 1px, transparent 1px);
      background-size:44px 44px;
      mask-image: radial-gradient(ellipse 80% 70% at 50% 40%, #000 30%, transparent 90%);
    }
    .pk-card {
      position:relative; width:100%; max-width:432px;
      background:linear-gradient(180deg, rgba(14,24,40,.92), rgba(8,14,26,.94));
      border:1px solid var(--line); border-radius:14px; overflow:hidden; padding:0 0 34px;
      box-shadow:0 0 0 1px rgba(0,229,212,.06), 0 30px 80px -30px rgba(0,0,0,.9);
    }
    .pk-bracket { position:absolute; width:18px; height:18px; border:2px solid var(--cyan); opacity:.7; }
    .pk-bracket.tl{top:10px;left:10px;border-right:0;border-bottom:0}
    .pk-bracket.tr{top:10px;right:10px;border-left:0;border-bottom:0}
    .pk-bracket.bl{bottom:10px;left:10px;border-right:0;border-top:0}
    .pk-bracket.br{bottom:10px;right:10px;border-left:0;border-top:0}
    .pk-ecg { position:relative; height:64px; border-bottom:1px solid var(--line);
      background:linear-gradient(180deg, rgba(0,229,212,.08), transparent); overflow:hidden; }
    .pk-ecg svg { position:absolute; inset:0; width:200%; height:100%; }
    .pk-ecg .trace { fill:none; stroke:var(--cyan); stroke-width:2;
      filter:drop-shadow(0 0 4px rgba(0,229,212,.9)); animation:pk-sweep 4.5s linear infinite; }
    @keyframes pk-sweep { to { transform:translateX(-50%); } }
    .pk-ecg .status { position:absolute; top:9px; left:16px; font-family:"Share Tech Mono",monospace;
      font-size:10.5px; letter-spacing:.12em; color:var(--cyan-soft); text-shadow:var(--glow-cyan); }
    .pk-body { padding:34px 32px 0; text-align:center; }
    .pk-shield { display:inline-flex; position:relative; animation:pk-pulse 2.2s ease-in-out infinite; }
    .pk-shield svg { filter:drop-shadow(0 0 10px rgba(0,229,212,.55)); }
    @keyframes pk-pulse { 50% { transform:scale(1.04); filter:brightness(1.12); } }
    .pk-eyebrow { margin:18px 0 0; font-family:"Share Tech Mono",monospace; font-size:10.5px;
      letter-spacing:.26em; text-transform:uppercase; color:var(--cyan-soft); }
    .pk-title { margin:6px 0 18px; font-family:"Chakra Petch",sans-serif; font-weight:700;
      font-size:22px; color:#f2f9ff; }
    .pk-title .glyph { color:var(--magenta); }
    .pk-loader { display:flex; align-items:center; justify-content:center; gap:5px; margin:6px 0 4px; }
    .pk-loader span { width:7px; height:7px; border-radius:50%; background:var(--cyan);
      box-shadow:var(--glow-cyan); animation:pk-bounce 1.1s ease-in-out infinite; }
    .pk-loader span:nth-child(2){ animation-delay:.15s } .pk-loader span:nth-child(3){ animation-delay:.3s }
    @keyframes pk-bounce { 0%,80%,100%{ transform:translateY(0); opacity:.35 } 40%{ transform:translateY(-7px); opacity:1 } }
    .pk-msg { margin:12px 0 0; font-family:"Share Tech Mono",monospace; font-size:11px;
      letter-spacing:.12em; text-transform:uppercase; color:var(--muted); }
    .pk-fallback { display:none; margin-top:24px; }
    .pk-btn { height:48px; padding:0 30px; border:0; border-radius:8px; cursor:pointer;
      background:linear-gradient(100deg, var(--cyan), #14b8c7 55%, var(--cyan)); color:#02161a;
      font-family:"Chakra Petch",sans-serif; font-weight:700; font-size:14px;
      letter-spacing:.14em; text-transform:uppercase; box-shadow:var(--glow-cyan); }
    .pk-hint { margin-top:10px; font-family:"Share Tech Mono",monospace; font-size:11px; color:var(--muted); }
    @media (prefers-reduced-motion: reduce) {
      .pk-ecg .trace, .pk-shield, .pk-loader span { animation:none; }
    }
  `;
  const tag = document.createElement("style");
  tag.id = "pk-skip-styles";
  tag.textContent = css;
  document.head.appendChild(tag);
}

const TEMPLATE = `
  <div class="pk-stage">
    <main class="pk-card">
      <span class="pk-bracket tl"></span><span class="pk-bracket tr"></span>
      <span class="pk-bracket bl"></span><span class="pk-bracket br"></span>

      <div class="pk-ecg" aria-hidden="true">
        <span class="status">ACCOUNT&nbsp;SETUP&nbsp;//&nbsp;FINALIZING</span>
        <svg viewBox="0 0 800 64" preserveAspectRatio="none">
          <path class="trace" d="M0,40 L120,40 L150,40 L165,12 L180,58 L195,28 L210,40 L330,40
                                   L400,40 L430,40 L445,12 L460,58 L475,28 L490,40 L610,40 L800,40" />
        </svg>
      </div>

      <div class="pk-body">
        <span class="pk-shield" aria-hidden="true">
          <svg width="50" height="54" viewBox="0 0 46 50" fill="none">
            <path d="M23 2 L43 9 V25 C43 38 34 46 23 49 C12 46 3 38 3 25 V9 Z"
                  fill="#081420" stroke="#00e5d4" stroke-width="2"/>
            <path d="M23 2 L43 9 V25 C43 33 38 39 31 43 L23 2Z" fill="rgba(0,229,212,.10)"/>
            <path d="M20 14 h6 v6 h6 v6 h-6 v6 h-6 v-6 h-6 v-6 h6 z"
                  fill="#00e5d4" filter="drop-shadow(0 0 4px #00e5d4)"/>
          </svg>
        </span>
        <p class="pk-eyebrow">Isoft Medical · Secure</p>
        <h1 class="pk-title">Almost done<span class="glyph">_</span></h1>

        <div class="pk-loader" aria-hidden="true"><span></span><span></span><span></span></div>
        <p class="pk-msg" id="pkMsg">Finalizing your account…</p>

        <div class="pk-fallback" id="pkFallback">
          <button class="pk-btn" id="pkContinue" type="button">Continue ▸</button>
          <p class="pk-hint">Continue without setting up a passkey.</p>
        </div>
      </div>
    </main>
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
