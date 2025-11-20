interface Env {
  DB: any;
}

export const onRequestDelete = async (context: any) => {
  const id = context.params.id;

  if (!id) {
    return new Response("Missing ID", { status: 400 });
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