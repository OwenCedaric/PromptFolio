interface Env {
  DB: any;
  SITE_URL?: string;
}

export const onRequestGet = async (context: any) => {
  const url = new URL(context.request.url);
  const baseUrl = context.env.SITE_URL || `${url.protocol}//${url.host}`;
  const ITEMS_PER_PAGE = 12; // Must match the value in App.tsx

  try {
    // 1. Get total count of public prompts to calculate total pages
    const countResult = await context.env.DB.prepare(
      "SELECT COUNT(*) as total FROM prompts WHERE status != 'PRIVATE'"
    ).first();

    const totalPrompts = (countResult?.total as number) || 0;
    const totalPages = Math.ceil(totalPrompts / ITEMS_PER_PAGE);

    // 2. Get latest update time for the sitemap header
    const latestResult = await context.env.DB.prepare(
      "SELECT MAX(updatedAt) as latest FROM prompts WHERE status != 'PRIVATE'"
    ).first();
    const lastMod = latestResult?.latest ? new Date(latestResult.latest).toISOString() : new Date().toISOString();

    let urls = '';
    
    // Start from Page 2. 
    // Page 1 is technically the root '/' which is already covered in sitemap-prompts.xml as the Homepage.
    for (let i = 2; i <= totalPages; i++) {
      urls += `
  <url>
    <loc>${baseUrl}/?page=${i}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    return new Response(sitemap, {
      headers: { 
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600"
      },
    });

  } catch (err: any) {
    console.error("Sitemap library error:", err);
    // Return empty valid XML on error
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`, {
      headers: { "Content-Type": "application/xml" },
    });
  }
};