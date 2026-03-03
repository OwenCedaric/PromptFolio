interface Env {
  DB: any;
  SITE_URL?: string;
}

export const onRequestGet = async (context: any) => {
  const url = new URL(context.request.url);
  const baseUrl = context.env.SITE_URL || `${url.protocol}//${url.host}`;
  
  // Pagination logic
  const pageParam = url.searchParams.get('page');
  const page = pageParam ? parseInt(pageParam) : 1;
  const limit = 500;
  const offset = (page - 1) * limit;

  try {
    // Index everything except PRIVATE prompts, with Pagination
    const { results } = await context.env.DB.prepare(
      "SELECT id, updatedAt FROM prompts WHERE status != 'PRIVATE' ORDER BY updatedAt DESC LIMIT ? OFFSET ?"
    )
    .bind(limit, offset)
    .all();

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

    // Only include Homepage priority on the first page of results
    let extraUrls = '';
    if (page === 1) {
        // Use the very latest date for home if possible, or now
        const homeLastMod = results?.[0]?.updatedAt 
            ? new Date(results[0].updatedAt).toISOString() 
            : new Date().toISOString();
            
        extraUrls = `
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${homeLastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${extraUrls}${urls}
</urlset>`;

    return new Response(sitemap, {
      headers: { 
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600"
      },
    });

  } catch (err: any) {
    console.error("Sitemap prompts error:", err);
    // Return empty URL set on error to avoid breaking parsers
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;
     return new Response(sitemap, {
      headers: { "Content-Type": "application/xml" },
    });
  }
};