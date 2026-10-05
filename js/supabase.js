/**
 * RICIN XPRESS — Supabase connection (vanilla JS)
 * Uses the existing Ricin Xpress project + existing public.orders table.
 * Only the publishable (anon) key is used client-side.
 */
(function () {
  var SUPABASE_URL = "https://uvjetzuhmletfdpwtjne.supabase.co";
  var SUPABASE_KEY = "sb_publishable_XCtFDEzghRYg1hjN-DHSPg_KgIvQ8QR";

  function init() {
    if (!window.supabase || !window.supabase.createClient) {
      console.error("Supabase SDK not loaded");
      return;
    }
    window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    document.dispatchEvent(new CustomEvent("supabase:ready"));
  }

  if (window.supabase) init();
  else window.addEventListener("load", init);

  /** Resolve once the client is available. */
  window.whenDbReady = function () {
    return new Promise(function (resolve, reject) {
      if (window.sb) return resolve(window.sb);
      var started = Date.now();
      var timeoutMs = 10000;
      var t = setInterval(function () {
        if (window.sb) {
          clearInterval(t);
          resolve(window.sb);
          return;
        }
        if (Date.now() - started >= timeoutMs) {
          clearInterval(t);
          reject(new Error("Supabase client did not initialise."));
        }
      }, 80);
    });
  };
})();
