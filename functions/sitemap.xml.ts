interface Env {
  DB: any;
}

export const onRequestGet = async (context: any) => {
  const url = new URL(context.request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  try {
    // Only include PUBLISHED prompts in the sitemap for SEO
    // Queries the D1 database for IDs and updated timestamps
    const { results } = await context.env.DB.prepare(
      "SELECT id, updatedAt FROM prompts WHERE status = 'PUBLISHED' ORDER BY updatedAt DESC"
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

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
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
    console.error("Sitemap generation error:", err);
    // Return basic sitemap if database access fails (e.g., during build or offline)
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