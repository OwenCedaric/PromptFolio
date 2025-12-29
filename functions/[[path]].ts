interface Env {
  DB: any;
  SITE_NAME?: string;
  SITE_URL?: string;
}

export const onRequest = async (context: any) => {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // If the request is for a static asset (js, css, images), continue as normal
  if (url.pathname.includes('.') || url.pathname.startsWith('/api/')) {
    return next();
  }

  // Handle HTML requests for SEO injection
  try {
    const response = await next();
    if (!response.headers.get('content-type')?.includes('text/html')) {
      return response;
    }

    const html = await response.text();
    const siteName = env.SITE_NAME || 'PromptFolio';
    
    let title = siteName;
    let description = 'Professional AI Prompt Management System.';
    let bodyContent = '';

    const promptId = url.searchParams.get('id');
    const topicName = url.searchParams.get('topic');

    if (promptId) {
      // Fetch prompt from D1 for SEO
      const result = await env.DB.prepare(
        "SELECT title, description, versions, currentVersionId FROM prompts WHERE id = ? AND status != 'PRIVATE'"
      ).bind(promptId).first();

      if (result) {
        title = `${result.title} | ${siteName}`;
        description = result.description || description;
        try {
            const versions = JSON.parse(result.versions);
            const current = versions.find((v: any) => v.id === result.currentVersionId) || versions[0];
            bodyContent = current?.content || '';
        } catch(e) {}
      }
    } else if (topicName) {
      title = `${topicName} Collection | ${siteName}`;
      description = `A curated collection of prompts regarding ${topicName}.`;
    }

    // Perform Edge-Side Injection
    const finalHtml = html
      .replace(/SITE_TITLE_PLACEHOLDER/g, title)
      .replace(/SITE_DESCRIPTION_PLACEHOLDER/g, description)
      .replace(/SITE_BODY_PLACEHOLDER/g, bodyContent)
      .replace(/<title>.*?<\/title>/, `<title>${title}</title>`);

    return new Response(finalHtml, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=60, s-maxage=3600'
      }
    });
  } catch (err) {
    return next();
  }
};