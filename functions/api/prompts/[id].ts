interface Env {
  DB: any;
  SITE_PASSWORD?: string;
}

export const onRequestDelete = async (context: any) => {
  const id = context.params.id;

  if (!id) {
    return new Response("Missing ID", { status: 400 });
  }

  // Security Check: Only allow modifications if authenticated
  const authHeader = context.request.headers.get('Authorization');
  const clientToken = authHeader ? authHeader.replace('Bearer ', '') : '';
  
  if (!context.env.SITE_PASSWORD || clientToken !== context.env.SITE_PASSWORD) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    await context.env.DB.prepare("DELETE FROM prompts WHERE id = ?").bind(id).run();
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};