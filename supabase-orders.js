/* Sends a finished order to the "submit-order" Edge Function (saves it + emails the owner).
   - Does nothing while ORDER_SUBMIT_ENABLED is false.
   - Never blocks or changes checkout: failures are only logged, the existing flow continues.
   - Safe to call twice for the same order (the server ignores duplicates). */
(function () {
  var inflight = {};
  function toPayload(o) {
    var c = o.cust || {}, t = o.t || {};
    return {
      order_ref: o.id,
      customer: { name: c.name, email: c.email, phone: c.phone, address_line1: c.a1, address_landmark: c.a2 || "", city: c.city, pincode: c.pin },
      items: (o.items || []).map(function (i) { return { name: i.name, qty: i.q, unit_price: i.price, note: i.note || "" }; }),
      gift_note: o.gift || "",
      pricing: { subtotal: t.sub, discount: t.disc, coupon_code: t.cp || null, shipping_fee: t.ship, cod_fee: t.fee, total: t.total },
      payment_method: o.pay   // "upi" or "cod". Payment status is decided on the server, never here.
    };
  }
  function markSynced(id) {
    try { var cur = store.get("cb_order", null); if (cur && cur.id === id) { cur.synced = true; store.set("cb_order", cur); } } catch (e) {}
  }
  function attempt(o, n) {
    var ctl = ("AbortController" in window) ? new AbortController() : null;
    var timer = ctl ? setTimeout(function () { ctl.abort(); }, 10000) : null;
    return fetch(window.SUPABASE_URL + "/functions/v1/submit-order", {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": window.SUPABASE_PUBLISHABLE_KEY },
      body: JSON.stringify(toPayload(o)),
      signal: ctl ? ctl.signal : undefined
    }).then(function (r) { return r.json().then(function (j) { return { status: r.status, body: j }; }); })
      .then(function (res) {
        if (res.body && res.body.ok) { markSynced(o.id); console.log("[Orders] saved", o.id, res.body.emailSent === false ? "(owner email NOT sent)" : ""); return res.body; }
        if (res.status >= 400 && res.status < 500 && res.status !== 429) { console.warn("[Orders] rejected:", res.status, res.body && res.body.error); return res.body; }
        throw new Error("server " + res.status);
      })
      .catch(function (e) {
        if (n < 2) return new Promise(function (r) { setTimeout(r, 1500); }).then(function () { return attempt(o, n + 1); });
        console.warn("[Orders] could not save order", o.id, String(e)); return { ok: false };
      })
      .finally(function () { if (timer) clearTimeout(timer); });
  }
  window.syncOrderToSupabase = function (o) {
    if (!window.ORDER_SUBMIT_ENABLED || !window.SUPABASE_URL || !window.SUPABASE_PUBLISHABLE_KEY) return Promise.resolve({ skipped: true });
    if (!o || !o.id || o.synced || inflight[o.id]) return Promise.resolve({ skipped: true });
    inflight[o.id] = true;
    return attempt(o, 1).finally(function () { delete inflight[o.id]; });
  };
})();
