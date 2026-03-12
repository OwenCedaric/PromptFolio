interface Env {
  SITE_PASSWORD?: string;
}

export const onRequestPost = async (context: any) => {
  try {
    const authHeader = context.request.headers.get('Authorization');
    const clientToken = authHeader ? authHeader.replace('Bearer ', '') : '';

    if (!context.env.SITE_PASSWORD || clientToken !== context.env.SITE_PASSWORD) {
        return new Response(JSON.stringify({ valid: false, error: "Unauthorized" }), { 
            status: 401,
            headers: { "Content-Type": "application/json" }
        });
    }

    return new Response(JSON.stringify({ valid: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

// Also support GET for simple "am I logged in" checks if needed
export const onRequestGet = onRequestPost;
