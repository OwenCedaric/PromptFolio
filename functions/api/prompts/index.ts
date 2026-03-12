interface Env {
  DB: any;
  SITE_PASSWORD?: string;
}

export const onRequestGet = async (context: any) => {
  try {
    // Check Authentication
    const authHeader = context.request.headers.get('Authorization');
    const clientToken = authHeader ? authHeader.replace('Bearer ', '') : '';
    const isAuthenticated = context.env.SITE_PASSWORD && clientToken === context.env.SITE_PASSWORD;

    // Construct Query
    // If authenticated: Fetch ALL.
    // If NOT authenticated: Fetch ONLY non-private.
    let query = "SELECT * FROM prompts";
    if (!isAuthenticated) {
        query += " WHERE status != 'PRIVATE'";
    }
    query += " ORDER BY updatedAt DESC";

    const { results } = await context.env.DB.prepare(query).all();

    // Parse JSON strings back to objects and Integers back to Booleans
    const prompts = results.map((row: any) => ({
      ...row,
      tags: JSON.parse(row.tags as string),
      versions: JSON.parse(row.versions as string),
      isFavorite: row.isFavorite === 1,
    }));

    // Cache for 60 seconds at edge and browser
    return new Response(JSON.stringify(prompts), {
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300"
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

export const onRequestPost = async (context: any) => {
  try {
    // Security Check: Only allow modifications if authenticated
    const authHeader = context.request.headers.get('Authorization');
    const clientToken = authHeader ? authHeader.replace('Bearer ', '') : '';
    
    // If SITE_PASSWORD is not set or token mismatch, deny access.
    if (!context.env.SITE_PASSWORD || clientToken !== context.env.SITE_PASSWORD) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const data: any = await context.request.json();

    // Serialize complex objects to strings for SQLite
    const tagsStr = JSON.stringify(data.tags);
    const versionsStr = JSON.stringify(data.versions);
    const isFavInt = data.isFavorite ? 1 : 0;

    await context.env.DB.prepare(
      `INSERT OR REPLACE INTO prompts 
      (id, title, description, imageUrl, category, tags, status, versions, currentVersionId, updatedAt, isFavorite, copyright, author, topic) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        data.id,
        data.title,
        data.description,
        data.imageUrl || '',
        data.category,
        tagsStr,
        data.status,
        versionsStr,
        data.currentVersionId,
        data.updatedAt,
        isFavInt,
        data.copyright || 'None',
        data.author || null,
        data.topic || null
      )
      .run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};