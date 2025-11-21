interface Env {
  DB: any;
}

export const onRequestGet = async (context: any) => {
  try {
    const { results } = await context.env.DB.prepare(
      "SELECT * FROM prompts ORDER BY updatedAt DESC"
    ).all();

    // Parse JSON strings back to objects and Integers back to Booleans
    const prompts = results.map((row: any) => ({
      ...row,
      tags: JSON.parse(row.tags as string),
      versions: JSON.parse(row.versions as string),
      isFavorite: row.isFavorite === 1,
      // Ensure copyright/author are passed if they exist
    }));

    return new Response(JSON.stringify(prompts), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

export const onRequestPost = async (context: any) => {
  try {
    const data: any = await context.request.json();

    // Serialize complex objects to strings for SQLite
    const tagsStr = JSON.stringify(data.tags);
    const versionsStr = JSON.stringify(data.versions);
    const isFavInt = data.isFavorite ? 1 : 0;

    // Check if 'copyright' and 'author' columns exist implicitly by using them. 
    // NOTE: User must run migration: ALTER TABLE prompts ADD COLUMN author TEXT;
    await context.env.DB.prepare(
      `INSERT OR REPLACE INTO prompts 
      (id, title, description, imageUrl, category, tags, status, versions, currentVersionId, updatedAt, isFavorite, copyright, author) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
        data.author || null
      )
      .run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};