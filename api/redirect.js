// In-memory storage for demo (in production, use a database)
const urlDatabase = new Map();

export default async function handler(req, res) {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).json({ error: 'Short code required' });
  }

  const urlData = urlDatabase.get(code);
  
  if (!urlData) {
    // Redirect to home page if URL not found
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    return res.redirect(302, `${protocol}://${host}`);
  }

  // Increment clicks
  urlData.clicks += 1;
  urlDatabase.set(code, urlData);

  // Redirect to original URL
  return res.redirect(302, urlData.originalUrl);
}