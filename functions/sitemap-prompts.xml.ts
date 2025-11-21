interface Env {
  DB: any;
  SITE_URL?: string;
}

export const onRequestGet = async (context: any) => {
  const url = new URL(context.request.url);
  const baseUrl = context.env.SITE_URL || `${url.protocol}//${url.host}`;

  try {
    // Index everything except PRIVATE prompts
    const { results } = await context.env.DB.prepare(
      "SELECT id, updatedAt FROM prompts WHERE status != 'PRIVATE' ORDER BY updatedAt DESC"
    ).all();

    const urls = results.map((row: any) => {
      const lastMod = new Date(row.updatedAt).toISOString();
      return `
  <url>
    <loc>${baseUrl}/?id=${row.id}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }).join('');

    // Include Homepage with the date of the most recent prompt or now
    const homeLastMod = results?.[0]?.updatedAt 
        ? new Date(results[0].updatedAt).toISOString() 
        : new Date().toISOString();

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${homeLastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>${urls}
</urlset>`;

    return new Response(sitemap, {
      headers: { 
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600"
      },
    });

  } catch (err: any) {
    console.error("Sitemap prompts error:", err);
    // Return basic sitemap if database access fails
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <priority>1.0</priority>
  </url>
</urlset>`;
     return new Response(sitemap, {
      headers: { "Content-Type": "application/xml" },
    });
  }
};