/* Supabase project settings for Crochet Bliss.
   This is a static site (no build step), so there are no .env variables here:
   this file plays that role. Only PUBLIC values belong in it.
   NEVER put the database password, a service_role key or an sb_secret_... key here. */
window.SUPABASE_URL = "https://ydvfidtgynyumrfxzjba.supabase.co";
window.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_HFfvKlzd0ScB46rF9FIfmw_9ch-TVhj";

/* Order saving + owner email. Leave false until the SQL is run, the "submit-order" function is
   deployed and its secrets are set (see SETUP-GUIDE.md). While false, checkout works exactly as before. */
window.ORDER_SUBMIT_ENABLED = true;
