import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  // generate random short code
  const code = Math.random().toString(36).substring(2, 8);

  // save in Supabase
  const { error } = await supabase.from("urls").insert({
    code: code,
    original_url: url,
    clicks: 0
  });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(200).json({ shortUrl: `${req.headers.host}/${code}` });
}
