
interface Env {
  DB: any;
  SITE_URL?: string;
}

export const onRequest = async (context: any) => {
  const url = new URL(context.request.url);
  const response = await context.next();
  
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("text/html")) {
    return response;
  }

  const id = url.searchParams.get('id');
  const topic = url.searchParams.get('topic');
  
  let hydrationData: any = null;
  let staticHtml = "";
  let seoTitle = "PromptFolio - 专业的 AI Prompt 分享平台";
  let seoDescription = "发现并管理高质量的 AI 提示词。支持版本控制、Markdown 媒体描述和 AI 自动优化。";
  let jsonLd = "";

  try {
    if (id) {
      const prompt = await context.env.DB.prepare(
        "SELECT * FROM prompts WHERE id = ? AND status != 'PRIVATE'"
      ).bind(id).first();

      if (prompt) {
        hydrationData = {
          prompt: {
            ...prompt,
            tags: JSON.parse(prompt.tags),
            versions: JSON.parse(prompt.versions),
            isFavorite: prompt.isFavorite === 1
          }
        };

        const currentVersion = hydrationData.prompt.versions.find((v: any) => v.id === prompt.currentVersionId) || hydrationData.prompt.versions[0];
        
        seoTitle = `${prompt.title} | PromptFolio`;
        seoDescription = prompt.description ? prompt.description.substring(0, 160) : seoDescription;
        
        // 生成静态 HTML 骨架，用于在 JS 加载前展示
        staticHtml = `
          <div class="h-full w-full flex flex-col bg-zinc-50 dark:bg-zinc-950 overflow-y-auto">
            <div class="max-w-4xl mx-auto w-full px-6 py-12 md:py-20">
              <span class="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block">${prompt.category}</span>
              <h1 class="text-4xl md:text-6xl font-bold text-zinc-900 dark:text-white mb-6">${prompt.title}</h1>
              <div class="prose prose-zinc dark:prose-invert max-w-none">
                <pre class="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 font-mono text-sm leading-relaxed">${currentVersion?.content || ''}</pre>
                <div class="mt-8 text-zinc-600 dark:text-zinc-400">${prompt.description || ''}</div>
              </div>
            </div>
          </div>
        `;

        const siteUrl = context.env.SITE_URL || `${url.protocol}//${url.host}`;
        jsonLd = `<script type="application/ld+json">${JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          "name": prompt.title,
          "headline": prompt.title,
          "description": seoDescription,
          "image": prompt.imageUrl ? [prompt.imageUrl] : [],
          "datePublished": new Date(prompt.updatedAt).toISOString()
        })}</script>`;
      }
    }
  } catch (e) {
    console.error("SSR Middleware Error:", e);
  }

  const rewriter = new (globalThis as any).HTMLRewriter()
    .on('title', { element(el: any) { el.setInnerContent(seoTitle); } })
    .on('meta[name="description"]', { element(el: any) { el.setAttribute('content', seoDescription); } })
    .on('head', {
      element(el: any) {
        if (jsonLd) el.append(jsonLd, { html: true });
        if (hydrationData) {
          el.append(`<script>window.__PF_HYDRATION_DATA__ = ${JSON.stringify(hydrationData)};</script>`, { html: true });
        }
      }
    });

  if (staticHtml) {
    // 将静态 HTML 注入到 root 容器中，替换骨架屏
    rewriter.on('div#root', {
      element(el: any) {
        el.setInnerContent(staticHtml, { html: true });
      }
    });
  }

  return rewriter.transform(response);
};
