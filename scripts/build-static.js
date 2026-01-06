const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DIST_DIR = path.join(__dirname, '../dist-static');
const DB_NAME = 'DB'; // Use the binding name from wrangler.toml

// Helper to run shell commands
function runCommand(command) {
    try {
        return execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    } catch (error) {
        console.error(`Error executing command: ${command}`);
        console.error(error.message);
        process.exit(1);
    }
}

// Ensure dist directory exists
if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIST_DIR);
fs.mkdirSync(path.join(DIST_DIR, 'p'));
fs.mkdirSync(path.join(DIST_DIR, 'topic'));
fs.mkdirSync(path.join(DIST_DIR, 'category'));
fs.mkdirSync(path.join(DIST_DIR, 'tag'));
fs.mkdirSync(path.join(DIST_DIR, 'author'));
const FONTS_DIR = path.join(DIST_DIR, 'fonts');
fs.mkdirSync(FONTS_DIR);

// Build CSS locally
console.log('Building local Tailwind CSS...');
runCommand('npm run build:css');

// Handle Fonts (Localize Inter and JetBrains Mono)
console.log('Copying fonts...');
const fontMap = [
    { src: 'node_modules/@fontsource/inter/files/inter-latin-400-normal.woff2', dest: 'inter-400.woff2' },
    { src: 'node_modules/@fontsource/inter/files/inter-latin-600-normal.woff2', dest: 'inter-600.woff2' },
    { src: 'node_modules/@fontsource/inter/files/inter-latin-800-normal.woff2', dest: 'inter-800.woff2' },
    { src: 'node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2', dest: 'jetbrains-mono-400.woff2' },
];

fontMap.forEach(font => {
    const srcPath = path.join(__dirname, '../', font.src);
    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, path.join(FONTS_DIR, font.dest));
    } else {
        console.warn(`Font file not found: ${srcPath}`);
    }
});

// Generate fonts.css
const fontsCss = `
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  src: url('/fonts/inter-400.woff2') format('woff2');
  font-display: swap;
}
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 600;
  src: url('/fonts/inter-600.woff2') format('woff2');
  font-display: swap;
}
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 800;
  src: url('/fonts/inter-800.woff2') format('woff2');
  font-display: swap;
}
@font-face {
  font-family: 'JetBrains Mono';
  font-style: normal;
  font-weight: 400;
  src: url('/fonts/jetbrains-mono-400.woff2') format('woff2');
  font-display: swap;
}
`;
fs.writeFileSync(path.join(DIST_DIR, 'fonts.css'), fontsCss);

console.log('Fetching data from D1...');
const query = `SELECT * FROM prompts WHERE status != 'PRIVATE' ORDER BY updatedAt DESC`;
const cmd = `npx wrangler d1 execute ${DB_NAME} --remote --command "${query}" --json`;

let prompts = [];
try {
    const output = runCommand(cmd);
    const jsonStartIndex = output.indexOf('[');
    if (jsonStartIndex === -1) throw new Error('No JSON array found in output');
    const jsonStr = output.substring(jsonStartIndex);
    const parsed = JSON.parse(jsonStr);
    if (parsed && parsed.length > 0 && parsed[0].results) {
        prompts = parsed[0].results.map(row => ({
            ...row,
            tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags,
            versions: typeof row.versions === 'string' ? JSON.parse(row.versions) : row.versions,
            isFavorite: row.isFavorite === 1
        }));
    }
} catch (e) {
    console.error('Failed to parse D1 output:', e);
    process.exit(1);
}

console.log(`Found ${prompts.length} prompts.`);

// Helper: safe URL encoding
const toUrlPath = (str) => encodeURIComponent(str);

// Template for Head
const headTemplate = (title, description) => `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | PromptFolio</title>
    <meta name="description" content="${description || 'PromptFolio - AI Prompt Collection'}">
    <link href="/style.css" rel="stylesheet">
    <link href="/fonts.css" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
        h1, h2, h3, .serif { font-family: 'Noto Serif SC', serif; }
    </style>
</head>
<body class="bg-zinc-50 text-zinc-900 antialiased min-h-screen flex flex-col">
`;

const footerTemplate = `
    <footer class="mt-auto py-12 border-t border-zinc-200 bg-white">
        <div class="max-w-4xl mx-auto px-6 text-center text-zinc-500 text-sm">
            <p>&copy; ${new Date().getFullYear()} PromptFolio. Generated Static Site.</p>
        </div>
    </footer>
</body>
</html>
`;

// Helper: Generate Pagination Controls
function generatePagination(currentPage, totalPages, baseUrl) {
    if (totalPages <= 1) return '';

    // baseUrl format: /category/name/
    // Page 1: baseUrl + 'index.html' (or just baseUrl if index)
    // Page 2: baseUrl + '2.html'

    const getLink = (page) => {
        if (page === 1) return `${baseUrl}`; // e.g., /category/foo/ or /
        return `${baseUrl}${page}.html`;    // e.g., /category/foo/2.html
    };

    let html = '<div class="flex justify-center mt-12 gap-4">';
    if (currentPage > 1) {
        html += `<a href="${getLink(currentPage - 1)}" class="px-4 py-2 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 text-sm font-semibold">Previous</a>`;
    }
    if (currentPage < totalPages) {
        html += `<a href="${getLink(currentPage + 1)}" class="px-4 py-2 bg-black text-white rounded-lg hover:bg-zinc-800 text-sm font-semibold">Next</a>`;
    }
    html += '</div>';

    // Page info
    html += `<div class="text-center mt-4 text-xs text-zinc-400">Page ${currentPage} of ${totalPages}</div>`;

    return html;
}

// Global sitemap URL collector (now includes paginated pages)
const sitemaps = [];
// Helper to track generated URLs for sitemaps
// Structure: { type: 'category/topic/tag/author', name: 'foo', urls: [ { loc, lastmod, etc } ] }
// Or simpler: specific sitemap arrays
const categorySitemapUrls = [];
const topicSitemapUrls = [];
const tagSitemapUrls = [];
const authorSitemapUrls = [];

function generatePaginatedGrid(title, subtitle, allPrompts, type, name) {
    // Determine Output Directory
    // Type: category, topic, tag, author, index (null)
    // Name: 'Coding', 'Art', etc.
    // Directory: dist-static/category/Coding/

    let baseOutputDir;
    let baseUrl; // For pagination links

    if (type === 'index') {
        baseOutputDir = DIST_DIR;
        baseUrl = '/page/'; // Special case for home pagination /page/2.html
    } else {
        const safeName = toUrlPath(name);
        baseOutputDir = path.join(DIST_DIR, type, safeName);
        baseUrl = `/${type}/${safeName}/`;
    }

    if (!fs.existsSync(baseOutputDir)) {
        fs.mkdirSync(baseOutputDir, { recursive: true });
    }

    // Pagination Logic
    const ITEMS_PER_PAGE = 24;
    const totalPages = Math.ceil(allPrompts.length / ITEMS_PER_PAGE);

    for (let page = 1; page <= totalPages; page++) {
        const start = (page - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const pagePrompts = allPrompts.slice(start, end);

        const isHome = type === 'index' && page === 1;

        let outputFilename;
        let publicUrl;

        if (type === 'index') {
            if (page === 1) {
                outputFilename = 'index.html';
                publicUrl = '/';
            } else {
                // Ensure /page/ directory exists for homepage pagination
                const pageDir = path.join(DIST_DIR, 'page');
                if (!fs.existsSync(pageDir)) fs.mkdirSync(pageDir);
                outputFilename = `page/${page}.html`; // dist-static/page/2.html (relativePath to DIST_DIR)
                // For generatePagination to work for home, baseUrl needs adjustment:
                // Page 1 is "/", Page 2 is "/page/2.html"
                // The generatePagination helper needs a slight custom logic for Home or we adapt it.
                // Let's customize generatePagination for Home later or stick to consistent /page/x structure?
                // Standard: / (Page 1), /page/2.html (Page 2)
                publicUrl = `/page/${page}.html`;
            }
        } else {
            if (page === 1) {
                outputFilename = 'index.html'; // dist-static/category/foo/index.html
                publicUrl = baseUrl; // /category/foo/
            } else {
                outputFilename = `${page}.html`; // dist-static/category/foo/2.html
                publicUrl = `${baseUrl}${page}.html`;
            }
        }

        // Custom Pagination Link logic for Home vs Others
        const getPageLink = (p) => {
            if (type === 'index') {
                return p === 1 ? '/' : `/page/${p}.html`;
            } else {
                return p === 1 ? baseUrl : `${baseUrl}${p}.html`;
            }
        };

        const paginationHtml = `
            <div class="flex justify-center mt-12 gap-4">
                ${page > 1 ? `<a href="${getPageLink(page - 1)}" class="px-4 py-2 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 text-sm font-semibold">Previous</a>` : ''}
                ${page < totalPages ? `<a href="${getPageLink(page + 1)}" class="px-4 py-2 bg-black text-white rounded-lg hover:bg-zinc-800 text-sm font-semibold">Next</a>` : ''}
            </div>
            <div class="text-center mt-4 text-xs text-zinc-400">Page ${page} of ${totalPages}</div>
        `;

        const html = `
${headTemplate(title + (page > 1 ? ` (Page ${page})` : ''), subtitle)}
    <header class="py-20 px-6 text-center border-b border-zinc-200 bg-white">
        ${!isHome ? `<nav class="mb-8">
            <a href="/" class="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors">Home</a>
             <span class="text-zinc-300 mx-2">/</span>
            <span class="text-xs font-bold uppercase tracking-widest text-zinc-600">${type}</span>
        </nav>` : '<div class="mb-8"></div>'}
        <h1 class="text-4xl md:text-6xl font-bold tracking-tight text-zinc-900 mb-6">${title}</h1>
        <p class="text-xl text-zinc-500 max-w-2xl mx-auto">${subtitle}</p>
    </header>

    <main class="flex-grow w-full max-w-6xl mx-auto px-6 py-16">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            ${pagePrompts.map(p => `
                <a href="/p/${p.id}.html" class="group block h-full">
                    <article class="h-full bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                        <div class="aspect-[4/3] w-full bg-zinc-100 overflow-hidden relative">
                            ${p.imageUrl ?
                `<img src="${p.imageUrl}" alt="${p.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy">` :
                `<div class="w-full h-full flex items-center justify-center text-zinc-300 text-6xl serif italic opacity-50">Aa</div>`
            }
                        </div>
                        <div class="p-8 flex flex-col flex-grow">
                            <div class="mb-4">
                                <span class="text-xs font-bold uppercase tracking-widest text-zinc-400 border border-zinc-200 px-2 py-1 rounded-full">${p.category}</span>
                            </div>
                            <h2 class="text-2xl font-bold text-zinc-900 mb-3 group-hover:text-amber-600 transition-colors">${p.title}</h2>
                            <p class="text-zinc-500 line-clamp-3 mb-6 flex-grow">${p.description}</p>
                            <div class="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                                <span>Read More</span>
                                <span class="group-hover:translate-x-1 transition-transform">→</span>
                            </div>
                        </div>
                    </article>
                </a>
            `).join('')}
        </div>
        ${totalPages > 1 ? paginationHtml : ''}
    </main>
${footerTemplate}
    `;

        // Write file
        const finalPath = type === 'index' && page > 1
            ? path.join(DIST_DIR, outputFilename) // dist-static/page/2.html
            : path.join(baseOutputDir, outputFilename); // dist-static/category/foo/index.html

        fs.writeFileSync(finalPath, html);

        // Collect Sitemap Data
        // Use most recent update from page prompts as lastmod
        const maxDate = pagePrompts.reduce((max, p) => p.updatedAt > max ? p.updatedAt : max, '');
        const sitemapEntry = {
            loc: `https://promptfolio.pages.dev${publicUrl}`,
            lastmod: new Date(maxDate || new Date()).toISOString(),
            changefreq: 'weekly',
            priority: page === 1 ? '0.7' : '0.5' // Higher priority for page 1
        };

        if (type === 'category') categorySitemapUrls.push(sitemapEntry);
        if (type === 'topic') topicSitemapUrls.push(sitemapEntry);
        if (type === 'tag') tagSitemapUrls.push({ ...sitemapEntry, priority: page === 1 ? '0.6' : '0.4' });
        if (type === 'author') authorSitemapUrls.push({ ...sitemapEntry, changefreq: 'monthly', priority: page === 1 ? '0.5' : '0.3' });
    }
}


// GENERATE MAIN INDEX (PAGINATED)
console.log('Generating Index Page...');
generatePaginatedGrid('PromptFolio', '精选 AI 提示词集合，激发无限创意。', prompts, 'index', 'home');

// GENERATE DETAIL PAGES
console.log('Generating Detail Pages...');
prompts.forEach(p => {
    // Determine content
    const version = p.versions.find(v => v.id === p.currentVersionId) || p.versions[p.versions.length - 1];
    const content = version ? version.content : '';

    const detailHtml = `
${headTemplate(p.title, p.description)}
    <nav class="fixed top-0 left-0 right-0 z-50 p-6 flex justify-between items-center pointer-events-none">
        <a href="/" class="pointer-events-auto bg-white/80 backdrop-blur-md border border-zinc-200 hover:border-zinc-900 text-zinc-900 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-all shadow-sm">
            ← Back
        </a>
    </nav>

    <main class="w-full max-w-4xl mx-auto px-6 pt-32 pb-24">
        
        <header class="text-center mb-16">
            ${p.category ? `<a href="/category/${toUrlPath(p.category)}/" class="pointer-events-auto hover:opacity-70 transition-opacity inline-block py-1 px-3 border border-zinc-200 rounded-full text-xs font-bold uppercase tracking-widest text-zinc-500 mb-6 bg-white">${p.category}</a>` : ''}
            <h1 class="text-4xl md:text-6xl font-bold text-zinc-900 mb-8 leading-tight">${p.title}</h1>
            <p class="text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed">${p.description}</p>
        </header>

        ${p.imageUrl ? `
            <div class="mb-16 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-zinc-900/5 bg-zinc-100">
                <img src="${p.imageUrl}" alt="${p.title}" class="w-full h-auto max-h-[80vh] object-contain mx-auto">
            </div>
        ` : ''}

        <div class="prose prose-lg prose-zinc mx-auto bg-white p-8 md:p-12 rounded-2xl border border-zinc-200 shadow-sm relative group">
            <button onclick="copyContent()" class="absolute top-4 right-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider transition-colors">
                Copy
            </button>
            <pre class="whitespace-pre-wrap font-sans text-base leading-relaxed text-zinc-700 select-all" id="prompt-content">${content}</pre>
        </div>
        
        ${Array.isArray(p.tags) && p.tags.length > 0 ? `
            <div class="mt-12 flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
                ${p.tags.map(t => `<a href="/tag/${toUrlPath(t)}/" class="px-3 py-1 bg-zinc-100 rounded-full text-xs text-zinc-600 hover:bg-zinc-900 hover:text-white transition-colors">#${t}</a>`).join('')}
            </div>
        ` : ''}

        <div class="mt-16 pt-16 border-t border-zinc-200">
            <h3 class="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-6">Metadata</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                    <span class="block text-xs text-zinc-400 mb-1">Updated</span>
                    <span class="font-mono text-sm">${new Date(p.updatedAt).toLocaleDateString()}</span>
                </div>
                 <div>
                    <span class="block text-xs text-zinc-400 mb-1">Status</span>
                    <span class="font-mono text-sm">${p.status}</span>
                </div>
                 <div>
                    <span class="block text-xs text-zinc-400 mb-1">Author</span>
                    ${p.author ? `<a href="/author/${toUrlPath(p.author)}/" class="font-mono text-sm block truncate hover:underline">${p.author}</a>` : `<span class="font-mono text-sm block truncate">Unknown</span>`}
                </div>
                 <div>
                    <span class="block text-xs text-zinc-400 mb-1">ID</span>
                    <span class="font-mono text-xs block truncate" title="${p.id}">${p.id.substring(0, 8)}...</span>
                </div>
            </div>
        </div>

    </main>

    <script>
        function copyContent() {
            const content = document.getElementById('prompt-content').innerText;
            navigator.clipboard.writeText(content).then(() => {
                const btn = document.querySelector('button');
                const originalText = btn.innerText;
                btn.innerText = 'Copied!';
                btn.classList.add('bg-green-100', 'text-green-700');
                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.classList.remove('bg-green-100', 'text-green-700');
                }, 2000);
            });
        }
    </script>
${footerTemplate}
    `;
    fs.writeFileSync(path.join(DIST_DIR, `p/${p.id}.html`), detailHtml);
});


// 0. GENERATE STATIC LISTING PAGES (Category, Topic, Tag, Author)

// Categories
console.log('Generating Category Pages...');
const categories = new Set(prompts.map(p => p.category).filter(Boolean));
categories.forEach(cat => {
    const filtered = prompts.filter(p => p.category === cat);
    generatePaginatedGrid(cat, `${filtered.length} prompts in ${cat}`, filtered, 'category', cat);
});

// Topics
console.log('Generating Topic Pages...');
const topics = new Set(prompts.map(p => p.topic).filter(Boolean));
topics.forEach(topic => {
    const filtered = prompts.filter(p => p.topic === topic);
    generatePaginatedGrid(topic, `${filtered.length} prompts in ${topic}`, filtered, 'topic', topic);
});

// Tags
console.log('Generating Tag Pages...');
const allTags = new Set();
prompts.forEach(p => { if (Array.isArray(p.tags)) p.tags.forEach(t => allTags.add(t)); });
allTags.forEach(tag => {
    const filtered = prompts.filter(p => Array.isArray(p.tags) && p.tags.includes(tag));
    generatePaginatedGrid(`${tag}`, `${filtered.length} prompts tagged with #${tag}`, filtered, 'tag', tag);
});

// Authors
console.log('Generating Author Pages...');
const authors = new Set(prompts.map(p => p.author).filter(Boolean));
authors.forEach(author => {
    const filtered = prompts.filter(p => p.author === author);
    generatePaginatedGrid(author, `${filtered.length} prompts by ${author}`, filtered, 'author', author);
});


// GENERATE SITEMAPS

const BASE_URL = process.env.SITE_URL || 'https://promptfolio.pages.dev';
const SITEMAP_DIR = path.join(DIST_DIR, 'sitemaps');
if (!fs.existsSync(SITEMAP_DIR)) {
    fs.mkdirSync(SITEMAP_DIR);
}

// Helper to create sitemap XML
const createSitemap = (urls) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}
    ${u.changefreq ? `<changefreq>${u.changefreq}</changefreq>` : ''}
    ${u.priority ? `<priority>${u.priority}</priority>` : ''}
  </url>`).join('\n')}
</urlset>`;

console.log('Generating Sitemaps...');

// 1. Prompts Sitemap (Paginated)
const PROMPT_BATCH_SIZE = 500;
const promptPages = Math.ceil(prompts.length / PROMPT_BATCH_SIZE);

// Add Home URL to the first prompt sitemap (or a separate misc one, sticking to first prompt map for now)
const homeUrl = {
    loc: `${BASE_URL}/`,
    lastmod: new Date().toISOString(),
    changefreq: 'daily',
    priority: '1.0'
};

for (let i = 0; i < promptPages; i++) {
    const start = i * PROMPT_BATCH_SIZE;
    const end = start + PROMPT_BATCH_SIZE;
    const chunk = prompts.slice(start, end);

    const chunkUrls = chunk.map(p => ({
        loc: `${BASE_URL}/p/${p.id}.html`,
        lastmod: new Date(p.updatedAt).toISOString(),
        changefreq: 'weekly',
        priority: '0.8'
    }));

    if (i === 0) {
        chunkUrls.unshift(homeUrl);
    }

    const filename = `sitemap-prompts-${i + 1}.xml`;
    fs.writeFileSync(path.join(SITEMAP_DIR, filename), createSitemap(chunkUrls));
    sitemaps.push({ loc: `${BASE_URL}/sitemaps/${filename}`, lastmod: new Date().toISOString() });
}

// 2. Tags Sitemap (GENERATED DURING PAGINATION)
fs.writeFileSync(path.join(SITEMAP_DIR, 'sitemap-tags.xml'), createSitemap(tagSitemapUrls));
sitemaps.push({ loc: `${BASE_URL}/sitemaps/sitemap-tags.xml`, lastmod: new Date().toISOString() });

// 3. Categories Sitemap
fs.writeFileSync(path.join(SITEMAP_DIR, 'sitemap-categories.xml'), createSitemap(categorySitemapUrls));
sitemaps.push({ loc: `${BASE_URL}/sitemaps/sitemap-categories.xml`, lastmod: new Date().toISOString() });

// 4. Topics Sitemap
fs.writeFileSync(path.join(SITEMAP_DIR, 'sitemap-topics.xml'), createSitemap(topicSitemapUrls));
sitemaps.push({ loc: `${BASE_URL}/sitemaps/sitemap-topics.xml`, lastmod: new Date().toISOString() });

// 5. Authors Sitemap
fs.writeFileSync(path.join(SITEMAP_DIR, 'sitemap-authors.xml'), createSitemap(authorSitemapUrls));
sitemaps.push({ loc: `${BASE_URL}/sitemaps/sitemap-authors.xml`, lastmod: new Date().toISOString() });


// 6. Other Static Sitemaps
const libraryUrls = [{ loc: `${BASE_URL}/?view=library`, changefreq: 'daily', priority: '0.9' }];
fs.writeFileSync(path.join(SITEMAP_DIR, 'sitemap-library.xml'), createSitemap(libraryUrls));
sitemaps.push({ loc: `${BASE_URL}/sitemaps/sitemap-library.xml`, lastmod: new Date().toISOString() });

const topicDirUrls = [{ loc: `${BASE_URL}/?view=topics`, changefreq: 'daily', priority: '0.9' }];
fs.writeFileSync(path.join(SITEMAP_DIR, 'sitemap-topic-directory.xml'), createSitemap(topicDirUrls));
sitemaps.push({ loc: `${BASE_URL}/sitemaps/sitemap-topic-directory.xml`, lastmod: new Date().toISOString() });


// 7. Sitemap Index (Root level)
const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(s => `  <sitemap>
    <loc>${s.loc}</loc>
    <lastmod>${s.lastmod}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`;

fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemapIndex);

// 8. Robots.txt
console.log('Generating robots.txt...');
const robotsTxt = `User-agent: *
Allow: /
Sitemap: ${BASE_URL}/sitemap.xml
`;
fs.writeFileSync(path.join(DIST_DIR, 'robots.txt'), robotsTxt);


console.log('Build complete! Static files are in dist-static/');
