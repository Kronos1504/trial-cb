/* Creates the Supabase client (window.sb) and a connection check. Needs supabase-config.js
   and the supabase-js CDN script to be loaded first. Does not touch any existing site code. */
(function () {
  var EXPECTED_REF = "ydvfidtgynyumrfxzjba"; // the new "Crochet Bliss" project
  var url = window.SUPABASE_URL, key = window.SUPABASE_PUBLISHABLE_KEY;

  if (!window.supabase || !window.supabase.createClient) {
    console.warn("[Supabase] supabase-js did not load (offline or blocked). Site works as before.");
    return;
  }
  if (!url || !key) { console.warn("[Supabase] Missing URL or publishable key."); return; }
  if (/service_role|sb_secret_/i.test(key)) { console.error("[Supabase] Secret key detected - remove it!"); return; }

  window.sb = window.supabase.createClient(url, key);

  window.checkSupabaseConnection = async function () {
    var r = { url: url, projectRefMatches: url.indexOf(EXPECTED_REF) !== -1, reachable: false, status: null };
    try {
      var res = await fetch(url + "/auth/v1/health", { headers: { apikey: key } });
      r.status = res.status; r.reachable = res.ok;
      var s = await window.sb.auth.getSession();
      r.clientOk = !s.error;
    } catch (e) { r.error = String(e); }
    r.ok = r.projectRefMatches && r.reachable && r.clientOk === true;
    console[r.ok ? "log" : "error"]("[Supabase] connection check:", r);
    return r;
  };

  if (/[?&]sbtest=1/.test(location.search)) window.checkSupabaseConnection();
})();
