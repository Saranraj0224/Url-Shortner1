import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: "Short code required" });
  }

  // look up URL in Supabase
  const { data, error } = await supabase
    .from("urls")
    .select("*")
    .eq("code", code)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: "URL not found" });
  }

  // update click count
  await supabase
    .from("urls")
    .update({ clicks: data.clicks + 1 })
    .eq("code", code);

  // redirect
  return res.redirect(302, data.original_url);
}
