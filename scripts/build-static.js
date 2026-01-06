const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const marked = require('marked');

const MiniSearch = require('minisearch');

const DIST_DIR = path.join(__dirname, '../dist-static');
const DB_NAME = 'DB';

// Load Config from wrangler.toml
const WRANGLER_PATH = path.join(__dirname, '../wrangler.toml');
let SITE_URL = process.env.SITE_URL;
if (!SITE_URL && fs.existsSync(WRANGLER_PATH)) {
    try {
        const tomlContent = fs.readFileSync(WRANGLER_PATH, 'utf8');
        // Match SITE_URL = "..." or SITE_URL = '...' (simple regex for [vars])
        const match = tomlContent.match(/SITE_URL\s*=\s*["']([^"']+)["']/);
        if (match) SITE_URL = match[1];
    } catch (e) { console.warn('Failed to parse wrangler.toml for SITE_URL'); }
}
if (!SITE_URL) SITE_URL = 'http://localhost'; // Default fallback
SITE_URL = SITE_URL.replace(/\/$/, '');
console.log(`Build using SITE_URL: ${SITE_URL}`);

// --- Helpers ---
function runCommand(command) {
    try {
        return execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    } catch (error) {
        console.error(`Error execution: ${command}`);
        console.error(error.stderr); // Print stderr
        process.exit(1);
    }
}

// function toUrlPath(str) { return encodeURIComponent(str); }
function toSlug(str) {
    if (!str) return '';
    return str.trim().replace(/\s+/g, '-');
}
function toUrlPath(str) { return encodeURIComponent(toSlug(str)); }

function getOptimizedImageUrl(url, width, height, quality = 70) {
    if (!url) return '';
    if (url.startsWith('data:') || url.endsWith('.svg') || url.startsWith('/')) return url;
    try {
        const cleanUrl = new URL(url).toString();
        const params = new URLSearchParams({ url: cleanUrl, w: width.toString(), q: quality.toString(), output: 'webp', il: '' });
        if (height) { params.append('h', height.toString()); params.append('fit', 'cover'); }
        return `https://wsrv.nl/?${params.toString()}`;
    } catch (e) { return url; }
}

// --- Search Logic ---
// Tokenizer for mixed Chinese/English content
const tokenize = (text) => {
    if (!text) return [];
    // Use Intl.Segmenter if available (Node 16+), fallback to char split for simple Chinese if needed, 
    // but here we assume modern Node.
    try {
        const segmenter = new Intl.Segmenter('zh', { granularity: 'word' });
        return Array.from(segmenter.segment(text)).map(s => s.segment).filter(s => s.trim().length > 0);
    } catch (e) {
        // Fallback: simple split by whitespace and punctuation for non-Chinese, char split for Chinese?
        // Actually MiniSearch default is space-split. 
        // Let's do a simple regex fallback if Segmenter fails (unlikely in modern env)
        return text.split(/\s+/);
    }
};

// --- Templates ---

const HEAD_TEMPLATE = (title, description, canonicalUrl) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | PromptFolio</title>
    <meta name="description" content="${description || 'PromptFolio - AI Prompt Collection'}">
    ${canonicalUrl ? `<link rel="canonical" href="${canonicalUrl}" />` : ''}
    <link href="/style.css" rel="stylesheet">
    <link href="/fonts.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/remixicon@4.8.0/fonts/remixicon.css" rel="stylesheet">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <style>
        body { font-family: 'Inter', sans-serif; }
        h1, h2, h3, .serif { font-family: 'Inter', sans-serif; }
        .font-serif { font-family: 'Noto Serif SC', serif; }
        #root { isolation: isolate; }
        .stroke-text { -webkit-text-stroke: 1px currentColor; color: transparent; }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/minisearch@7.2.0/dist/umd/index.min.js"></script>
    <script>
      (function() {
        try {
          const localTheme = localStorage.getItem('pf_theme');
          const supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (localTheme === 'dark' || (!localTheme && supportDarkMode)) {
            document.documentElement.classList.add('dark');
            document.documentElement.style.colorScheme = 'dark';
          } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.style.colorScheme = 'light';
          }
        } catch (e) {}
      })();
    </script>
    <script src="/client.js" defer></script>
</head>
<body class="bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 antialiased selection:bg-zinc-900 selection:text-white dark:selection:bg-zinc-100 dark:selection:text-zinc-900 font-sans transition-colors duration-300 overflow-hidden h-dvh w-full scrollbar-hide">
`;

function renderSidebar(currentView, selectedCategory, categories) {
    // Exact copy of structure from previous step
    const categoryLinks = categories.map(cat => `
        <a href="/category/${toSlug(cat)}/"
            class="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors min-h-[44px] ${currentView === 'library' && selectedCategory === cat
            ? 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white font-medium'
            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 hover:text-zinc-900 dark:hover:text-zinc-200'
        }">
            <span class="w-1.5 h-1.5 rounded-full shrink-0 transition-all ${currentView === 'library' && selectedCategory === cat ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-300 dark:bg-zinc-700'}"></span>
            <span class="truncate">${cat}</span>
        </a>
    `).join('');

    return `
    <div class="js-sidebar-overlay hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden transition-opacity"></div>
    <aside class="js-sidebar fixed md:relative z-50 flex flex-col h-full bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transform transition-transform duration-300 ease-in-out will-change-transform -translate-x-full md:translate-x-0 w-64 pb-[env(safe-area-inset-bottom)]">
        <div class="h-20 flex items-center justify-start px-6 shrink-0">
            <a href="/" class="flex items-center gap-3 overflow-hidden whitespace-nowrap group cursor-pointer hover:opacity-70 transition-opacity focus:outline-none min-h-[44px]">
                <div class="w-8 h-8 shrink-0 bg-current" style="mask-image: url(/favicon.svg); -webkit-mask-image: url(/favicon.svg); mask-size: contain; -webkit-mask-size: contain; mask-repeat: no-repeat; -webkit-mask-repeat: no-repeat; mask-position: center; -webkit-mask-position: center;"></div>
                <span class="text-lg font-bold tracking-tight text-zinc-900 dark:text-white font-sans">PromptFolio</span>
            </a>
            <button class="js-sidebar-close md:hidden ml-auto text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"><i class="ri-close-line text-2xl"></i></button>
        </div>
        <div class="flex-1 px-3 overflow-y-auto no-scrollbar transition-all duration-300">
            <nav class="space-y-1">
                <a href="/" class="w-full flex items-center justify-between px-3 py-3 text-sm rounded-lg transition-colors min-h-[44px] ${currentView === 'library' && selectedCategory === 'All' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'}">
                    <div class="flex items-center gap-3"><i class="ri-apps-2-line text-xl ${currentView === 'library' && selectedCategory === 'All' ? 'text-zinc-900 dark:text-zinc-100' : 'opacity-70'}"></i><span>All Prompts</span></div>
                </a>
                <a href="/topics/" class="w-full flex items-center justify-between px-3 py-3 text-sm rounded-lg transition-colors min-h-[44px] ${currentView === 'topics' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'}">
                    <div class="flex items-center gap-3"><i class="ri-book-open-line text-xl ${currentView === 'topics' ? 'text-zinc-900 dark:text-zinc-100' : 'opacity-70'}"></i><span>Topics</span></div>
                </a>
                <a href="/favorites/" class="w-full flex items-center justify-between px-3 py-3 text-sm rounded-lg transition-colors min-h-[44px] ${currentView === 'library' && selectedCategory === 'Favorites' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'}">
                    <div class="flex items-center gap-3"><i class="ri-star-line text-xl ${currentView === 'library' && selectedCategory === 'Favorites' ? 'text-zinc-900 dark:text-zinc-100' : 'opacity-70'}"></i><span>Favorites</span></div>
                </a>
            </nav>
            <div class="mt-8">
                <div class="mb-3 px-3 text-xs font-bold text-zinc-500 dark:text-zinc-600 uppercase tracking-wider">Collections</div>
                <nav class="space-y-0.5">${categoryLinks}</nav>
            </div>
        </div>
        <div class="p-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-1 shrink-0">
             <button class="js-theme-toggle flex items-center gap-3 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 min-h-[44px] w-full">
                <i class="ri-moon-line dark:hidden text-xl"></i>
                <i class="ri-sun-line hidden dark:block text-xl"></i>
                <span class="text-sm font-medium">Switch Theme</span>
            </button>
        </div>
    </aside>
    `;
}

function renderPromptCard(prompt) {
    const versionNumber = prompt.versions.length;
    const isLocked = prompt.status === 'PRIVATE';
    // Match PromptCard.tsx
    return `
    <a href="/p/${prompt.id}.html" class="block group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors duration-200 cursor-pointer flex flex-col h-[280px] p-5 relative rounded-2xl overflow-hidden" 
       style="content-visibility: auto; contain-intrinsic-size: 280px">
        <div class="hidden sm:block absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
            ${prompt.status === 'DRAFT' ? `<div class="absolute -bottom-8 -right-6 text-zinc-100 dark:text-zinc-800 group-hover:text-zinc-200 dark:group-hover:text-zinc-700 transition-colors duration-300 transform -rotate-12"><i class="ri-edit-line" style="font-size: 140px;"></i></div>` :
            isLocked ? `<div class="absolute -bottom-6 -right-4 text-zinc-100 dark:text-zinc-800 group-hover:text-zinc-200 dark:group-hover:text-zinc-700 transition-colors duration-300 transform -rotate-12"><i class="ri-lock-line" style="font-size: 120px;"></i></div>` :
                `<div class="absolute -bottom-6 -right-2 text-[80px] font-bold text-zinc-100 dark:text-zinc-800 group-hover:text-zinc-200 dark:group-hover:text-zinc-700 transition-colors duration-300 leading-none tracking-tighter">v${versionNumber}</div>`}
        </div>
        <div class="relative z-10 flex flex-col h-full">
            <div class="flex justify-between items-start mb-3 shrink-0">
                <span class="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700/50">${prompt.category}</span>
                <div class="flex gap-2">${prompt.isFavorite ? '<i class="ri-star-fill text-zinc-900 dark:text-zinc-100"></i>' : ''}</div>
            </div>
            <h3 class="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2 line-clamp-1 group-hover:opacity-70 transition-opacity shrink-0">${prompt.title}</h3>
            ${prompt.imageUrl && !isLocked ? `<div class="w-full h-32 mb-3 shrink-0 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 relative isolate transform-gpu"><img src="${getOptimizedImageUrl(prompt.imageUrl, 400)}" class="w-full h-full object-cover" width="400" height="128" loading="lazy"></div>` : ''}
            <div class="flex-1 overflow-hidden relative mb-3 rounded-lg min-h-0">
                ${isLocked ? `<div class="h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 gap-2 bg-zinc-50/50 dark:bg-zinc-800/30 rounded-lg border border-zinc-100 dark:border-zinc-800/50"><i class="ri-lock-line opacity-50 text-2xl"></i><span class="text-xs uppercase tracking-widest font-bold opacity-50">Private Content</span></div>` :
            `<p class="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed opacity-90 break-words whitespace-pre-wrap">${(prompt.versions.find(v => v.id === prompt.currentVersionId) || prompt.versions[0] || {}).content || ''}</p>`}
                ${!isLocked ? `<div class="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-zinc-900 dark:via-zinc-900/90 pointer-events-none"></div>` : ''}
            </div>
            <div class="flex flex-wrap gap-2 mt-auto h-7 overflow-hidden w-full content-start shrink-0">
                ${(prompt.tags || []).map(tag => `<span class="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded border border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors shrink-0">#${tag}</span>`).join('')}
            </div>
        </div>
    </a>`;
}

const renderTopBar = (title, count) => `
    <div class="sticky top-0 z-20 bg-zinc-50/95 dark:bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-200/50 dark:border-zinc-800/50 px-6 md:px-10 py-4">
        <div class="flex items-center justify-between gap-4">
             <div class="flex items-center gap-3 md:hidden">
                <button class="js-sidebar-open p-2 -ml-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100" aria-label="Open Sidebar">
                    <i class="ri-menu-line text-2xl"></i>
                </button>
                <div class="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onclick="window.location.href='/'">
                     <div class="w-6 h-6 shrink-0 bg-current text-zinc-900 dark:text-zinc-100" style="mask-image: url(/favicon.svg); -webkit-mask-image: url(/favicon.svg); mask-size: contain; -webkit-mask-size: contain; mask-repeat: no-repeat; -webkit-mask-repeat: no-repeat; mask-position: center; -webkit-mask-position: center;"></div>
                     <span class="font-bold text-zinc-900 dark:text-white truncate max-w-[100px]">PromptFolio</span>
                </div>
             </div>
             
             <div class="hidden md:flex flex-col">
                 <h1 class="text-lg font-bold text-zinc-900 dark:text-white leading-tight">${title || 'PromptFolio'}</h1>
                 ${count !== undefined ? `<span class="text-xs text-zinc-500 dark:text-zinc-400">Showing ${count} prompts</span>` : ''}
             </div>

             <!-- Search -->
             <div class="relative w-full md:w-80 group">
                 <i class="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-zinc-100 transition-colors"></i>
                 <input type="text" id="site-search" placeholder="Search prompts..." class="w-full pl-9 pr-8 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-600 focus:ring-2 focus:ring-zinc-100 dark:focus:ring-zinc-800 transition-all shadow-sm">
                 <button id="search-clear" class="hidden absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 bg-transparent border-0 cursor-pointer p-0" aria-label="Clear Search">
                     <i class="ri-close-circle-line"></i>
                 </button>
             </div>
        </div>
    </div>
`;

function getPaginationRange(currentPage, totalPages) {
    const siblingCount = 1;
    const totalNumbers = 2 * siblingCount + 3;
    const totalBlocks = totalNumbers + 2;

    if (totalPages <= totalBlocks) return Array.from({ length: totalPages }, (_, i) => i + 1);

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);
    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

    if (!shouldShowLeftDots && shouldShowRightDots) {
        let leftItemCount = 3 + 2 * siblingCount;
        let leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
        return [...leftRange, '...', totalPages];
    }
    if (shouldShowLeftDots && !shouldShowRightDots) {
        let rightItemCount = 3 + 2 * siblingCount;
        let rightRange = Array.from({ length: rightItemCount }, (_, i) => totalPages - rightItemCount + i + 1);
        return [1, '...', ...rightRange];
    }
    if (shouldShowLeftDots && shouldShowRightDots) {
        let middleRange = Array.from({ length: rightSiblingIndex - leftSiblingIndex + 1 }, (_, i) => leftSiblingIndex + i);
        return [1, '...', ...middleRange, '...', totalPages];
    }
    return [];
}

function renderPagination(currentPage, totalPages, baseUrl) {
    if (totalPages <= 1) return '';
    const getLink = (p) => baseUrl === '/' ? (p === 1 ? '/' : `/page/${p}.html`) : (p === 1 ? baseUrl : `${baseUrl}${p}.html`);

    const range = getPaginationRange(currentPage, totalPages);

    let html = '<div id="pagination-container" class="flex flex-wrap justify-center items-center gap-1 md:gap-2 py-6 mt-auto select-none w-full">';

    // Prev
    const prevDisabled = currentPage === 1;
    html += `<a ${prevDisabled ? '' : `href="${getLink(currentPage - 1)}"`} class="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 ${prevDisabled ? 'opacity-30 cursor-not-allowed' : 'transition-colors'}" aria-label="Previous Page"><i class="ri-arrow-left-s-line text-xl"></i></a>`;

    range.forEach(item => {
        if (item === '...') {
            html += `<span class="w-8 text-center text-xs text-zinc-400">...</span>`;
        } else {
            const isCurrent = item === currentPage;
            html += `<a href="${getLink(item)}" class="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-all ${isCurrent ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}">${item}</a>`;
        }
    });

    // Next
    const nextDisabled = currentPage === totalPages;
    html += `<a ${nextDisabled ? '' : `href="${getLink(currentPage + 1)}"`} class="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 ${nextDisabled ? 'opacity-30 cursor-not-allowed' : 'transition-colors'}" aria-label="Next Page"><i class="ri-arrow-right-s-line text-xl"></i></a>`;

    html += '</div>';
    return html;
}

function renderLayout(content, sidebarHtml, title) {
    return `
    <div id="root" class="h-full w-full overflow-hidden flex flex-col md:flex-row">
        ${sidebarHtml}
        <div class="flex-1 flex flex-col h-full overflow-hidden relative w-full">
            <div class="md:hidden h-14 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-4 bg-white dark:bg-zinc-900 shrink-0 z-20">
                <button class="js-sidebar-open p-2 -ml-2 text-zinc-600 dark:text-zinc-400"><i class="ri-menu-line text-xl"></i></button>
                <span class="ml-3 font-bold text-zinc-900 dark:text-white">${title}</span>
            </div>
            <main class="flex-1 overflow-y-auto no-scrollbar p-0 bg-zinc-50 dark:bg-zinc-950 w-full">${content}</main>
        </div>
    </div>
    </body></html>`;
}

// --- Topic Views (New) ---

function renderTopicGrid(topics, currentPage, totalPages) {
    // Matches TopicList.tsx
    const gridHtml = topics.map(t => {
        const bg = t.previewImage
            ? `<img src="${getOptimizedImageUrl(t.previewImage, 600)}" class="absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out filter saturate-[0.6] opacity-90 group-hover:saturate-100 group-hover:opacity-100 group-hover:scale-105" loading="lazy">`
            : `<div class="absolute inset-0 bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-900 opacity-50"></div>`;

        return `
        <a href="/topic/${toUrlPath(t.name)}/" class="group relative block aspect-[4/3] md:aspect-[16/9] lg:aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 text-left transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl transform-gpu" style="-webkit-mask-image: -webkit-radial-gradient(white, black)">
            ${bg}
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end">
                <span class="text-xs font-bold text-white/60 uppercase tracking-widest mb-1">Collection</span>
                <h3 class="text-2xl md:text-3xl font-serif font-medium text-white mb-2">${t.name}</h3>
                <div class="flex items-center justify-between mt-2">
                    <span class="text-sm font-medium text-white/80 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">${t.count} Prompts</span>
                    <div class="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center transform translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300"><i class="ri-arrow-right-line"></i></div>
                </div>
            </div>
        </a>
        `;
    }).join('');

    return `
    <div class="flex-1 p-6 md:p-10 pt-2 md:pt-10 overflow-y-auto scrollbar-hide">
        <div class="max-w-7xl mx-auto flex flex-col min-h-full">
            <div class="mb-10 shrink-0">
                <h1 class="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Topics</h1>
                <p class="text-zinc-500 dark:text-zinc-400">Curated collections of prompts grouped by theme.</p>
            </div>
            ${topics.length === 0 ? `
                <div class="flex flex-col items-center justify-center h-64 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50">
                    <i class="ri-price-tag-3-line text-zinc-300 dark:text-zinc-700 mb-4 text-5xl"></i>
                    <h3 class="text-lg font-medium text-zinc-600 dark:text-zinc-400">No Topics Found</h3>
                </div>` : `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">${gridHtml}</div>
                ${renderPagination(currentPage, totalPages, '/topics/')}
            `}
        </div>
    </div>
    `;
}

function renderTopicMagazineMode(topic, prompts) {
    // Matches TopicDetail.tsx - Magazine Style
    const coverImage = [...prompts].reverse().find(p => p.imageUrl)?.imageUrl;

    const itemsHtml = prompts.map((p, idx) => {
        const isEven = idx % 2 === 0;
        const currentVersion = p.versions.find(v => v.id === p.currentVersionId) || p.versions[p.versions.length - 1];
        const content = currentVersion?.content || '';

        let shapeClass = 'rounded-none';
        switch (idx % 4) {
            case 0: shapeClass = 'rounded-tl-[4rem] rounded-br-[4rem] rounded-tr-none rounded-bl-none'; break;
            case 1: shapeClass = 'rounded-tr-[4rem] rounded-bl-[4rem] rounded-tl-none rounded-br-none'; break;
            case 2: shapeClass = 'rounded-l-[4rem] rounded-r-none'; break;
            case 3: shapeClass = 'rounded-r-[4rem] rounded-l-none'; break;
        }

        return `
        <div class="w-full min-h-[80vh] flex flex-col md:flex-row relative group overflow-hidden">
            <div class="relative w-full md:min-h-full flex items-center justify-center p-6 md:p-12 ${isEven ? 'md:w-[55%] md:order-1' : 'md:w-[60%] md:order-2'}">
                <div class="hidden md:block absolute top-0 bottom-0 w-px bg-zinc-200 dark:bg-zinc-800 ${isEven ? 'right-0' : 'left-0'}"></div>
                <div class="relative z-10 w-full flex justify-center">
                    ${p.imageUrl ? `
                        <div class="relative overflow-hidden bg-zinc-100 dark:bg-zinc-800 ring-1 ring-zinc-900/5 dark:ring-white/10 group-hover:scale-[1.01] transition-transform duration-700 shadow-[8px_8px_0px_0px_rgba(24,24,27,0.1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.15)] ${shapeClass}">
                            <img src="${getOptimizedImageUrl(p.imageUrl, 800)}" class="w-full h-auto md:w-auto md:max-w-full md:max-h-[85vh] object-contain block" width="800" loading="lazy">
                        </div>` : `
                        <div class="w-full aspect-[3/4] md:max-w-md bg-zinc-100 dark:bg-zinc-900 flex flex-col items-center justify-center text-zinc-300 dark:text-zinc-700 shadow-inner ${shapeClass}">
                            <span class="text-8xl font-serif italic opacity-20">${idx + 1}</span>
                        </div>
                    `}
                </div>
                <div class="absolute text-[6rem] md:text-[12rem] leading-none font-serif font-black text-transparent stroke-text opacity-10 md:opacity-10 select-none pointer-events-none z-0 ${isEven ? '-left-2 md:-left-4 bottom-0' : '-right-2 md:-right-4 top-0'}">
                    ${(idx + 1).toString().padStart(2, '0')}
                </div>
            </div>
            <div class="relative w-full flex flex-col justify-center p-8 md:p-16 lg:p-24 ${isEven ? 'md:w-[45%] md:order-2' : 'md:w-[40%] md:order-1'}">
                <div class="flex flex-col gap-6 md:gap-10 max-w-lg mx-auto md:mx-0">
                    <div>
                        <span class="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-2 block">${p.category}</span>
                        <h2 class="text-3xl md:text-4xl lg:text-5xl font-serif font-medium leading-[1.1] text-zinc-900 dark:text-white">${p.title}</h2>
                    </div>
                    <div class="w-16 h-px bg-zinc-900 dark:bg-zinc-100 opacity-20"></div>
                    <div class="font-sans text-sm md:text-base leading-loose text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap line-clamp-[10] md:line-clamp-[15]">${content}</div>
                    <div class="mt-4 pt-6 border-t border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between gap-4">
                        <button class="js-copy-btn flex items-center gap-2 px-4 py-3 md:py-2 rounded-full border bg-transparent border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-900 dark:hover:border-zinc-100 hover:text-zinc-900 dark:hover:text-zinc-100 text-xs font-bold uppercase tracking-wider transition-all duration-200" data-clipboard-text="${content.replace(/"/g, '&quot;')}">
                            <i class="ri-file-copy-line"></i> <span>Copy</span>
                        </button>
                        <a href="/p/${p.id}.html" class="group/btn flex items-center gap-3 text-sm uppercase tracking-widest font-bold text-zinc-900 dark:text-white hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors text-right p-2">
                             Explore Detail
                             <span class="bg-zinc-900 dark:bg-white text-white dark:text-black rounded-full p-1 transition-transform duration-300 group-hover/btn:translate-x-2"><i class="ri-arrow-right-line"></i></span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
        `;
    }).join('');

    return `
    <div class="fixed inset-0 z-50 bg-white dark:bg-zinc-950 flex flex-col overflow-hidden font-sans">
        <div class="absolute top-0 left-0 right-0 z-50 p-6 md:p-10 flex justify-between items-start pointer-events-none mix-blend-difference text-white dark:text-zinc-200">
            <a href="/topics/" class="pointer-events-auto flex items-center gap-2 group hover:opacity-70 transition-opacity p-2">
                <div class="p-2 border border-current rounded-full transition-transform group-hover:-translate-x-1"><i class="ri-arrow-left-line text-xl"></i></div>
                <span class="hidden md:block font-bold tracking-wider text-sm uppercase">Back</span>
            </a>
        </div>
        <div class="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
             <div class="w-full flex flex-col items-center justify-center relative pb-10 md:pb-20 overflow-hidden transition-all duration-700 ${coverImage ? 'min-h-[70vh] md:min-h-[85vh] bg-zinc-900' : 'min-h-[50vh] md:min-h-[60vh] bg-zinc-50 dark:bg-zinc-950'}">
                 ${coverImage ? `
                    <div class="absolute inset-0 z-0 select-none pointer-events-none">
                        <img src="${getOptimizedImageUrl(coverImage, 1200)}" class="w-full h-full object-cover opacity-60 scale-105 animate-in fade-in duration-[1.5s]" fetchPriority="high">
                        <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/50 to-transparent"></div>
                        <div class="absolute inset-0 bg-black/10 mix-blend-multiply"></div>
                    </div>
                 ` : ''}
                 <div class="relative z-10 text-center px-4 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
                     <span class="inline-block py-1 px-3 border rounded-full text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-6 md:mb-8 backdrop-blur-none bg-white/10 transition-colors ${coverImage ? 'border-white/30 text-white/90' : 'border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400'}">Curated Collection</span>
                     <h1 class="text-6xl md:text-8xl lg:text-[9rem] font-serif font-medium tracking-tight mb-6 md:mb-8 leading-[0.9] transition-colors ${coverImage ? 'text-white drop-shadow-2xl' : 'text-zinc-900 dark:text-white'}">${topic}</h1>
                     <p class="text-base md:text-xl max-w-lg mx-auto leading-relaxed font-light transition-colors ${coverImage ? 'text-zinc-200 drop-shadow-md' : 'text-zinc-500 dark:text-zinc-400'}">A curated collection of ${prompts.length} high-quality prompt${prompts.length !== 1 ? 's' : ''}.</p>
                 </div>
             </div>
             
             <div class="flex flex-col gap-24 md:gap-40 pb-32">
                 ${itemsHtml}
             </div>
             
             <div class="min-h-[30vh] flex flex-col justify-center px-8 md:px-24 pb-20 pt-20 relative overflow-hidden">
                <div class="w-full border-t border-zinc-200 dark:border-zinc-800 mb-12"></div>
                <div class="flex flex-col md:flex-row items-end md:items-start justify-between gap-10">
                     <div class="hidden md:block"><span class="font-serif text-9xl text-zinc-100 dark:text-zinc-900 leading-none select-none">Fin.</span></div>
                     <div class="flex flex-col items-end text-right">
                         <div class="flex items-center gap-4 mb-4"><span class="text-xs font-bold uppercase tracking-widest text-zinc-400">Collection Complete</span><div class="w-12 h-px bg-zinc-400"></div></div>
                         <p class="text-lg md:text-xl font-serif text-zinc-900 dark:text-zinc-100 max-w-md mb-8 leading-snug">You have viewed all ${prompts.length} prompts in <span class="italic">${topic}</span>.</p>
                         <button onclick="window.scrollTo({ top: 0, behavior: 'smooth' })" class="group flex items-center gap-3 px-6 py-3 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity">Back to Top <i class="ri-arrow-right-line -rotate-90 group-hover:-translate-y-1 transition-transform"></i></button>
                     </div>
                </div>
             </div>
        </div>
    </div>
    `;
}

// --- Driver ---

// Init
if (fs.existsSync(DIST_DIR)) fs.rmSync(DIST_DIR, { recursive: true, force: true });
fs.mkdirSync(DIST_DIR);
['p', 'topic', 'category', 'tag', 'author', 'page', 'fonts', 'sitemaps', 'favorites', 'topics'].forEach(d => fs.mkdirSync(path.join(DIST_DIR, d), { recursive: true }));

console.log('Build CSS & Assets...');
runCommand('npm run build:css');
// Copy Fonts/Assets... (Same as before, skipped for brevity in tool call but included in file)
const fontMap = [
    { src: 'node_modules/@fontsource/inter/files/inter-latin-400-normal.woff2', dest: 'inter-400.woff2' },
    { src: 'node_modules/@fontsource/inter/files/inter-latin-500-normal.woff2', dest: 'inter-500.woff2' },
    { src: 'node_modules/@fontsource/inter/files/inter-latin-600-normal.woff2', dest: 'inter-600.woff2' },
    { src: 'node_modules/@fontsource/inter/files/inter-latin-800-normal.woff2', dest: 'inter-800.woff2' },
    { src: 'node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2', dest: 'jetbrains-mono-400.woff2' },
];
// Copy favicon
if (fs.existsSync(path.join(__dirname, '../favicon.svg'))) fs.copyFileSync(path.join(__dirname, '../favicon.svg'), path.join(DIST_DIR, 'favicon.svg'));
fontMap.forEach(f => {
    const s = path.join(__dirname, '../', f.src);
    if (fs.existsSync(s)) fs.copyFileSync(s, path.join(DIST_DIR, 'fonts', f.dest));
});
// Fonts CSS
const fontsCss = `
@font-face { font-family: 'Inter'; font-style: normal; font-weight: 400; src: url('/fonts/inter-400.woff2') format('woff2'); font-display: swap; }
@font-face { font-family: 'Inter'; font-style: normal; font-weight: 500; src: url('/fonts/inter-500.woff2') format('woff2'); font-display: swap; }
@font-face { font-family: 'Inter'; font-style: normal; font-weight: 600; src: url('/fonts/inter-600.woff2') format('woff2'); font-display: swap; }
@font-face { font-family: 'Inter'; font-style: normal; font-weight: 800; src: url('/fonts/inter-800.woff2') format('woff2'); font-display: swap; }
@font-face { font-family: 'JetBrains Mono'; font-style: normal; font-weight: 400; src: url('/fonts/jetbrains-mono-400.woff2') format('woff2'); font-display: swap; }
`;
fs.writeFileSync(path.join(DIST_DIR, 'fonts.css'), fontsCss);

// Client JS
const clientJsSrc = path.join(__dirname, 'static-client.js');
const clientJsDest = path.join(DIST_DIR, 'client.js');
if (fs.existsSync(clientJsSrc)) fs.copyFileSync(clientJsSrc, clientJsDest);
else fs.writeFileSync(clientJsDest, '');

// Fetch Data
console.log('Fetch Data...');
const query = `SELECT * FROM prompts WHERE status != 'PRIVATE' ORDER BY updatedAt DESC`;
const cmd = `npx wrangler d1 execute ${DB_NAME} --remote --command "${query}" --json`;
let prompts = [];
try {
    const output = runCommand(cmd);
    const jsonStr = output.substring(output.indexOf('['));
    const parsed = JSON.parse(jsonStr);
    if (parsed && parsed.length && parsed[0].results) {
        prompts = parsed[0].results.map(row => ({
            ...row,
            tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags,
            versions: typeof row.versions === 'string' ? JSON.parse(row.versions) : row.versions,
            isFavorite: row.isFavorite === 1
        }));
    }
} catch (e) { console.error(e); process.exit(1); }

const allCategories = [...new Set(prompts.map(p => p.category).filter(Boolean))];

// Generate Global Pages
function generateGridPage(title, items, type, name, outputSubDir) {
    const ITEMS_PER_PAGE = 12;
    const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);

    // View Context for Sidebar
    let view = 'library';
    let cat = 'All';
    if (type === 'category') cat = name;
    if (type === 'favorites') cat = 'Favorites';
    if (type === 'topic') view = 'topics'; // This handles individual topic grid? No, individual topic is magazine.

    const sidebarHtml = renderSidebar(view, cat, allCategories);
    if (!fs.existsSync(outputSubDir)) fs.mkdirSync(outputSubDir, { recursive: true });

    for (let page = 1; page <= totalPages; page++) {
        const start = (page - 1) * ITEMS_PER_PAGE;
        const pageItems = items.slice(start, start + ITEMS_PER_PAGE);
        const gridHtml = pageItems.map(renderPromptCard).join('');

        let baseUrl = '/';
        if (type === 'category') baseUrl = `/category/${toUrlPath(name)}/`;
        if (type === 'favorites') baseUrl = `/favorites/`;
        if (type === 'tag') baseUrl = `/tag/${toUrlPath(name)}/`;
        if (type === 'author') baseUrl = `/author/${toUrlPath(name)}/`;

        const paginationHtml = renderPagination(page, totalPages, baseUrl);
        const contentHtml = `
            ${renderTopBar(title, items.length)}
            <div class="flex-1 overflow-y-auto px-6 md:px-10 pb-[calc(6rem+env(safe-area-inset-bottom))] scrollbar-hide pt-6">
                <div id="static-content-grid">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">${gridHtml}</div>
                    ${paginationHtml}
                </div>
                <div id="search-results-grid" class="hidden grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 mb-8 mt-4"></div>
            </div>`;

        const fullHtml = HEAD_TEMPLATE(title, '', '') + renderLayout(contentHtml, sidebarHtml, title);
        let filename = (type === 'index' && page > 1) ? `page/${page}.html` : (page === 1 ? 'index.html' : `${page}.html`);
        let writePath = (type === 'index' && page > 1) ? path.join(DIST_DIR, filename) : path.join(outputSubDir, filename);
        fs.writeFileSync(writePath, fullHtml);
    }
}

console.log('Gen Index/Cats/Favs...');
generateGridPage('All Prompts', prompts, 'index', 'home', DIST_DIR);
generateGridPage('Favorites', prompts.filter(p => p.isFavorite), 'favorites', 'Favorites', path.join(DIST_DIR, 'favorites'));
allCategories.forEach(c => generateGridPage(c, prompts.filter(p => p.category === c), 'category', c, path.join(DIST_DIR, 'category', toSlug(c))));

// Generate Tag Pages
console.log('Gen Tag Pages...');
const allTags = [...new Set(prompts.flatMap(p => p.tags || []))].filter(Boolean);
allTags.forEach(t => generateGridPage(`#${t}`, prompts.filter(p => (p.tags || []).includes(t)), 'tag', t, path.join(DIST_DIR, 'tag', toSlug(t))));

// Generate Author Pages
console.log('Gen Author Pages...');
const allAuthors = [...new Set(prompts.map(p => p.author).filter(Boolean))];
allAuthors.forEach(a => generateGridPage(`Prompts by ${a}`, prompts.filter(p => p.author === a), 'author', a, path.join(DIST_DIR, 'author', toSlug(a))));

// Generate Topic Directory (/topics/)
console.log('Gen Topic Directory...');
// Group topics
const topicMap = new Map(); // name -> { count, previewImage }
prompts.forEach(p => {
    if (p.topic) {
        const entry = topicMap.get(p.topic) || { count: 0, previewImage: undefined };
        entry.count++;
        if (!entry.previewImage && p.imageUrl) entry.previewImage = p.imageUrl;
        topicMap.set(p.topic, entry);
    }
});
const topicsList = Array.from(topicMap.entries()).map(([name, data]) => ({ name, ...data })).sort((a, b) => a.name.localeCompare(b.name));

const ITEMS_PER_TOPIC_PAGE = 12;
const totalTopicPages = Math.ceil(topicsList.length / ITEMS_PER_TOPIC_PAGE);
const topicDirOut = path.join(DIST_DIR, 'topics');

for (let p = 1; p <= totalTopicPages; p++) {
    const start = (p - 1) * ITEMS_PER_TOPIC_PAGE;
    const pageTopics = topicsList.slice(start, start + ITEMS_PER_TOPIC_PAGE);
    const contentHtml = renderTopicGrid(pageTopics, p, totalTopicPages);
    const sidebarHtml = renderSidebar('topics', 'All', allCategories);
    const fullHtml = HEAD_TEMPLATE('Topics', 'All Topics', '') + renderLayout(contentHtml, sidebarHtml, 'Topics');
    const fname = p === 1 ? 'index.html' : `${p}.html`;
    fs.writeFileSync(path.join(topicDirOut, fname), fullHtml);
}

// Generate Individual Topic Pages (Magazine Layout)
console.log('Gen Topic Details...');
topicsList.forEach(t => {
    const topicPrompts = prompts.filter(p => p.topic === t.name);
    // Magazine layouts use their own full screen layout, no sidebar
    const magazineHtml = renderTopicMagazineMode(t.name, topicPrompts);
    const fullHtml = HEAD_TEMPLATE(t.name, `Topic: ${t.name}`, '') + magazineHtml + '</body></html>';
    const tDir = path.join(DIST_DIR, 'topic', toSlug(t.name));
    if (!fs.existsSync(tDir)) fs.mkdirSync(tDir, { recursive: true });
    fs.writeFileSync(path.join(tDir, 'index.html'), fullHtml);
});

// Generate Detail Pages (Standard)
console.log('Gen Prompt Details...');
prompts.forEach(p => {
    const version = p.versions.find(v => v.id === p.currentVersionId) || p.versions[p.versions.length - 1];
    const content = version ? version.content : '';
    const descriptionMd = p.description ? marked.parse(p.description) : '';
    const isLocked = p.status === 'PRIVATE';
    const sidebarHtml = renderSidebar('detail', p.category, allCategories);
    const pattern = /(\{\{[^}]+\}\}|\[[^\]]+\])/g;
    const highlightedContent = content.replace(pattern, '<span class="inline-block mx-0.5 px-1.5 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold border border-zinc-300 dark:border-zinc-600 text-[0.9em]">$1</span>');

    const detailContent = `
    <div class="flex flex-col h-full bg-zinc-50/50 dark:bg-zinc-950/50 relative">
       <div class="lg:hidden px-6 py-4 bg-zinc-50/95 dark:bg-zinc-950/95 border-b border-zinc-200/50 dark:border-zinc-800/50 sticky top-0 z-20 backdrop-blur-sm flex items-center justify-between">
            <a href="/" class="p-2 -ml-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-full"><i class="ri-arrow-left-line text-xl"></i></a>
            <h1 class="text-lg font-bold text-zinc-900 dark:text-white truncate mx-4">${p.title}</h1>
            <div class="w-8"></div>
       </div>
       <div class="flex-1 h-full max-w-[1920px] mx-auto w-full lg:grid lg:grid-cols-12 lg:divide-x lg:divide-zinc-200 dark:lg:divide-zinc-800 overflow-hidden">
            <section class="js-section-info lg:col-span-7 h-full flex flex-col overflow-hidden lg:flex">
                <div class="hidden lg:block shrink-0 px-10 pt-10 pb-6 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-950/50 z-10">
                    <div class="flex items-center gap-4 mb-6"><a href="/" class="p-2 -ml-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"><i class="ri-arrow-left-line text-xl"></i></a><span class="text-sm font-medium text-zinc-500">Prompt Details</span></div>
                    <div class="flex items-center gap-3 mb-4 flex-wrap"><span class="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">${p.category}</span>
                    ${p.topic ? `<a href="/topic/${toUrlPath(p.topic)}/" class="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 flex items-center gap-1"><i class="ri-book-open-line"></i> ${p.topic}</a>` : ''}
                    ${isLocked ? `<span class="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-500 border border-red-200/50 dark:border-red-800/30 flex items-center gap-1"><i class="ri-lock-line"></i> Private</span>` : `<span class="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-500 border border-green-200/50 dark:border-green-800/30 flex items-center gap-1"><i class="ri-eye-line"></i> Published</span>`}</div>
                    <h1 class="text-4xl font-bold text-zinc-900 dark:text-white leading-tight">${p.title}</h1>
                </div>
                <div class="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 no-scrollbar pb-24 lg:pb-10">
                     ${p.imageUrl ? `<div class="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm bg-zinc-100 dark:bg-zinc-900"><img src="${getOptimizedImageUrl(p.imageUrl, 1200)}" class="w-full h-auto block"></div>` : ''}
                     ${p.description ? `<div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8 shadow-sm"><h3 class="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-6 flex items-center gap-2"><i class="ri-information-line"></i> Description</h3><div class="prose prose-zinc dark:prose-invert max-w-none">${descriptionMd}</div></div>` : ''}
                     <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm"><h3 class="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2"><i class="ri-price-tag-3-line"></i> Tags</h3><div class="flex flex-wrap gap-2">${(p.tags || []).map(t => `<span class="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs px-3 py-1.5 rounded-lg">#${t}</span>`).join('')}</div></div>
                     
                     <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                         <h3 class="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2"><i class="ri-global-line"></i> Metadata & Rights</h3>
                         <div class="grid grid-cols-2 lg:grid-cols-3 gap-6">
                            ${p.author ? `
                            <div class="flex flex-col gap-1.5">
                                <span class="text-xs text-zinc-500 uppercase font-semibold">Author</span>
                                <a href="/author/${toUrlPath(p.author)}/" class="text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:underline decoration-blue-300 transition-colors text-left">${p.author}</a>
                            </div>` : ''}
                            <div class="flex flex-col gap-1.5">
                                <span class="text-xs text-zinc-500 uppercase font-semibold">License</span>
                                <span class="text-sm font-medium text-zinc-900 dark:text-zinc-100">${p.copyright || 'None'}</span>
                            </div>
                            <div class="flex flex-col gap-1.5">
                                <span class="text-xs text-zinc-500 uppercase font-semibold">Version History</span>
                                <span class="text-sm font-medium text-zinc-900 dark:text-zinc-100">${p.versions.length} versions</span>
                            </div>
                         </div>
                     </div>
                </div>
            </section>
            <section class="js-section-prompt lg:col-span-5 h-full bg-zinc-50 dark:bg-zinc-950/50 px-4 md:px-8 py-6 md:py-8 flex flex-col overflow-hidden hidden lg:flex">
                <div class="flex flex-col h-full">
                    <div class="flex items-center justify-between mb-3 gap-3 shrink-0">
                        <h3 class="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2"><div class="w-2 h-2 bg-zinc-900 dark:bg-white rounded-full"></div> Prompt Content</h3>
                        ${!isLocked ? `<button class="js-copy-btn text-xs flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800" data-clipboard-target="prompt-content-${p.id}"><i class="ri-file-copy-line"></i> <span>Copy</span></button>` : ''}
                    </div>
                    ${isLocked ? `<div class="flex flex-col items-center justify-center h-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 text-center shadow-sm"><div class="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4 text-zinc-400 dark:text-zinc-500"><i class="ri-lock-line text-2xl"></i></div><h3 class="text-sm font-bold text-zinc-900 dark:text-white mb-1">Private Content</h3><p class="text-xs text-zinc-500 dark:text-zinc-400">Restricted access.</p></div>` :
            `<div class="flex-1 group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col"><div class="h-8 bg-zinc-50/50 dark:bg-zinc-800/30 border-b border-zinc-100 dark:border-zinc-800 flex items-center px-4 justify-between shrink-0"><span class="text-xs font-bold text-zinc-400 uppercase tracking-widest">SOURCE</span><span class="text-xs font-mono text-zinc-400">${content.length} CHARS</span></div><div class="flex-1 p-6 overflow-y-auto scrollbar-thin"><pre id="prompt-content-${p.id}" class="font-mono text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words">${highlightedContent}</pre></div></div>`}
                </div>
            </section>
       </div>
       <nav class="lg:hidden fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 pb-[env(safe-area-inset-bottom)]">
            <div class="bg-zinc-900/90 dark:bg-zinc-800/90 backdrop-blur-md text-white p-1.5 rounded-full flex shadow-2xl border border-white/10">
                <button class="js-tab-btn px-6 py-2.5 rounded-full text-xs font-medium flex items-center gap-2 transition-all bg-white text-black shadow-sm scale-105" data-tab="info"><i class="ri-information-line"></i> Info</button>
                <button class="js-tab-btn px-6 py-2.5 rounded-full text-xs font-medium flex items-center gap-2 transition-all text-zinc-400 hover:text-white" data-tab="prompt"><i class="ri-file-text-line"></i> Prompt</button>
            </div>
       </nav>
    </div>`;

    const fullHtml = HEAD_TEMPLATE(p.title, p.description, '') + renderLayout(detailContent, sidebarHtml, p.title);
    fs.writeFileSync(path.join(DIST_DIR, `p/${p.id}.html`), fullHtml);
});

// Sitemaps + Robots (Basic)
console.log('Sitemaps...');
const SITEMAP_DIR = path.join(DIST_DIR, 'sitemaps');
if (!fs.existsSync(SITEMAP_DIR)) fs.mkdirSync(SITEMAP_DIR);

// Sitemap Helpers
const createSitemap = (items) => `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items.map(i => {
    const loc = typeof i === 'string' ? i : i.loc;
    const lastmod = typeof i === 'string' ? '' : (i.lastmod ? `<lastmod>${i.lastmod}</lastmod>` : '');
    return `<url><loc>${loc}</loc>${lastmod}</url>`;
}).join('')}</urlset>`;

const createIndex = (files) => `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${files.map(f => {
    // Ideally we should put lastmod here too, but for static build, maybe just use current date or skip
    return `<sitemap><loc>${SITE_URL}/sitemaps/${f}</loc><lastmod>${new Date().toISOString()}</lastmod></sitemap>`;
}).join('')}</sitemapindex>`;

// 1. Prompts (With LastMod)
const pItems = prompts.map(p => ({
    loc: `${SITE_URL}/p/${p.id}.html`,
    lastmod: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString()
}));
fs.writeFileSync(path.join(SITEMAP_DIR, 'sitemap-prompts.xml'), createSitemap(pItems));

// 2. Categories
const cats = [...new Set(prompts.map(p => p.category))];
const cUrls = cats.map(c => `${SITE_URL}/category/${toUrlPath(c)}/`);
fs.writeFileSync(path.join(SITEMAP_DIR, 'sitemap-categories.xml'), createSitemap(cUrls));

// 3. Topics
const topics = [...new Set(prompts.map(p => p.topic).filter(Boolean))];
const tUrls = topics.map(t => `${SITE_URL}/topic/${toUrlPath(t)}/`);
fs.writeFileSync(path.join(SITEMAP_DIR, 'sitemap-topics.xml'), createSitemap(tUrls));

// 4. Authors
const authors = [...new Set(prompts.map(p => p.author).filter(Boolean))];
const aUrls = authors.map(a => `${SITE_URL}/author/${toUrlPath(a)}/`);
fs.writeFileSync(path.join(SITEMAP_DIR, 'sitemap-authors.xml'), createSitemap(aUrls));

// 5. Tags
const tags = [...new Set(prompts.flatMap(p => p.tags || []))].filter(Boolean);
const tagUrls = tags.map(t => `${SITE_URL}/tag/${toUrlPath(t)}/`);
fs.writeFileSync(path.join(SITEMAP_DIR, 'sitemap-tags.xml'), createSitemap(tagUrls));

// 6. Misc Pages (Home, Topics Index, Favorites)
const miscUrls = [
    `${SITE_URL}/`,
    `${SITE_URL}/topics/`,
    `${SITE_URL}/favorites/`
];
fs.writeFileSync(path.join(SITEMAP_DIR, 'sitemap-pages.xml'), createSitemap(miscUrls));

// Main Index (Renamed to sitemap-index.xml)
const sitemaps = [
    'sitemap-prompts.xml',
    'sitemap-categories.xml',
    'sitemap-topics.xml',
    'sitemap-authors.xml',
    'sitemap-tags.xml',
    'sitemap-pages.xml'
];
fs.writeFileSync(path.join(DIST_DIR, 'sitemap-index.xml'), createIndex(sitemaps));
fs.writeFileSync(path.join(DIST_DIR, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap-index.xml`);

// Search Index Generation
console.log('Generating Search Index...');
const miniSearch = new MiniSearch({
    fields: ['title', 'content', 'description', 'tags', 'category', 'topic', 'author'], // added author
    storeFields: ['title', 'category', 'id', 'topic', 'imageUrl', 'description', 'author'], // added author
    tokenize: tokenize,
    searchOptions: {
        boost: { title: 2, topic: 1.5, category: 1.2, author: 1.2 },
        fuzzy: 0.2
    }
});

// Prepare documents for indexing
const searchDocs = prompts.map(p => {
    const version = p.versions.find(v => v.id === p.currentVersionId) || p.versions[p.versions.length - 1];
    return {
        id: p.id,
        title: p.title,
        content: version ? version.content : '',
        description: p.description || '',
        tags: (p.tags || []).join(' '),
        category: p.category,
        topic: p.topic || '',
        imageUrl: p.imageUrl || '',
        author: p.author || '' // added author
    };
});

miniSearch.addAll(searchDocs);
fs.writeFileSync(path.join(DIST_DIR, 'search-index.json'), JSON.stringify(miniSearch.toJSON()));

console.log('Done.');
