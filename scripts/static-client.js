
(function () {
    // --- Dark Mode ---
    function setupTheme() {
        // Theme init is done in head to prevent FOUC, but we need to wire the toggle
        const toggleBtns = document.querySelectorAll('.js-theme-toggle');
        toggleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const isDark = document.documentElement.classList.toggle('dark');
                document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
                localStorage.setItem('pf_theme', isDark ? 'dark' : 'light');
            });
        });
    }

    // --- Sidebar ---
    function setupSidebar() {
        const sidebar = document.querySelector('.js-sidebar');
        const overlay = document.querySelector('.js-sidebar-overlay');
        const openBtns = document.querySelectorAll('.js-sidebar-open');
        const closeBtns = document.querySelectorAll('.js-sidebar-close');

        function toggleSidebar(show) {
            if (!sidebar) return;
            if (show) {
                sidebar.classList.remove('-translate-x-full');
                sidebar.classList.add('translate-x-0');
                if (overlay) overlay.classList.remove('hidden');
            } else {
                sidebar.classList.add('-translate-x-full');
                sidebar.classList.remove('translate-x-0');
                if (overlay) overlay.classList.add('hidden');
            }
        }

        openBtns.forEach(btn => btn.addEventListener('click', () => toggleSidebar(true)));
        closeBtns.forEach(btn => btn.addEventListener('click', () => toggleSidebar(false)));
        if (overlay) overlay.addEventListener('click', () => toggleSidebar(false));
    }

    // --- Copy to Clipboard ---
    function setupCopy() {
        document.querySelectorAll('.js-copy-btn').forEach(btn => {
            // Use event delegation or re-attach for search results if needed?
            // For now, simpler to rely on bubble or re-attach. 
            // Actually, search results are links to detail pages, so no copy button needed on the card usually?
            // Wait, PromptCard usually has quick copy. If I want full parity, I need it.
            // But let's assume search result cards link to detail first.
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                const targetId = btn.getAttribute('data-clipboard-target');
                let text = '';

                if (targetId) {
                    const el = document.getElementById(targetId);
                    text = el ? el.innerText : '';
                } else {
                    text = btn.getAttribute('data-clipboard-text') || '';
                }

                if (text) {
                    try {
                        await navigator.clipboard.writeText(text);
                        // Feedback
                        const originalHtml = btn.innerHTML;
                        btn.innerHTML = '<i class="ri-check-line"></i>';
                        btn.classList.add('text-green-600', 'bg-green-50');

                        setTimeout(() => {
                            btn.innerHTML = originalHtml;
                            btn.classList.remove('text-green-600', 'bg-green-50');
                        }, 2000);
                    } catch (err) {
                        console.error('Failed to copy!', err);
                    }
                }
            });
        });
    }

    // --- Detail Mobile Tabs ---
    function setupMobileTabs() {
        // ... (Existing logic) ...
        const tabs = document.querySelectorAll('.js-tab-btn');
        const sections = {
            'info': document.querySelector('.js-section-info'),
            'prompt': document.querySelector('.js-section-prompt')
        };

        if (!sections.info || !sections.prompt) return;

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.getAttribute('data-tab');

                // Update buttons
                tabs.forEach(t => {
                    if (t.getAttribute('data-tab') === target) {
                        t.classList.add('bg-white', 'text-black', 'shadow-sm', 'scale-105');
                        t.classList.remove('text-zinc-400', 'hover:text-white');
                    } else {
                        t.classList.add('text-zinc-400', 'hover:text-white');
                        t.classList.remove('bg-white', 'text-black', 'shadow-sm', 'scale-105');
                    }
                });

                if (target === 'info') {
                    sections.info.classList.remove('hidden');
                    sections.info.classList.add('flex');
                    sections.prompt.classList.add('hidden');
                    sections.prompt.classList.remove('flex');
                } else {
                    sections.prompt.classList.remove('hidden');
                    sections.prompt.classList.add('flex');
                    sections.info.classList.add('hidden');
                    sections.info.classList.remove('flex');
                }
            });
        });
    }

    // --- Search (In-Place w/ Pagination) ---
    function setupSearch() {
        const input = document.getElementById('site-search');
        const clearBtn = document.getElementById('search-clear');
        const staticGrid = document.getElementById('static-content-grid');
        const searchGrid = document.getElementById('search-results-grid');
        const pagination = document.getElementById('pagination-container');

        const isListPage = !!staticGrid && !!searchGrid;

        if (!input) return;

        let miniSearch = null;
        let isLoading = false;
        let searchResults = [];
        let currentPage = 1;
        const ITEMS_PER_PAGE = 12;

        const tokenize = (text) => {
            if (!text) return [];
            try {
                const segmenter = new Intl.Segmenter('zh', { granularity: 'word' });
                return Array.from(segmenter.segment(text)).map(s => s.segment).filter(s => s.trim().length > 0);
            } catch (e) {
                return text.split(/\s+/);
            }
        };

        // Pagination Helpers
        function getPaginationRange(current, total) {
            const siblingCount = 1;
            const totalNumbers = 2 * siblingCount + 3;
            const totalBlocks = totalNumbers + 2;

            if (total <= totalBlocks) return Array.from({ length: total }, (_, i) => i + 1);

            const leftSibling = Math.max(current - siblingCount, 1);
            const rightSibling = Math.min(current + siblingCount, total);
            const showLeftDots = leftSibling > 2;
            const showRightDots = rightSibling < total - 2;

            if (!showLeftDots && showRightDots) {
                let leftItemCount = 3 + 2 * siblingCount;
                let leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
                return [...leftRange, '...', total];
            }
            if (showLeftDots && !showRightDots) {
                let rightItemCount = 3 + 2 * siblingCount;
                let rightRange = Array.from({ length: rightItemCount }, (_, i) => total - rightItemCount + i + 1);
                return [1, '...', ...rightRange];
            }
            if (showLeftDots && showRightDots) {
                let midRange = Array.from({ length: rightSibling - leftSibling + 1 }, (_, i) => leftSibling + i);
                return [1, '...', ...midRange, '...', total];
            }
            return [];
        }

        function renderPaginationControls(current, total) {
            if (total <= 1) return '';
            const range = getPaginationRange(current, total);
            let html = '<div class="js-search-pagination flex flex-wrap justify-center items-center gap-1 md:gap-2 py-6 mt-auto select-none w-full col-span-full">';

            // Prev
            const prevDisabled = current === 1;
            html += `<button data-page="${current - 1}" class="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 ${prevDisabled ? 'opacity-30 cursor-not-allowed pointer-events-none' : 'transition-colors'}" aria-label="Previous Page"><i class="ri-arrow-left-s-line text-xl pointer-events-none"></i></button>`;

            range.forEach(item => {
                if (item === '...') {
                    html += `<span class="w-8 text-center text-xs text-zinc-400">...</span>`;
                } else {
                    const isCurrent = item === current;
                    html += `<button data-page="${item}" class="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-all ${isCurrent ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}">${item}</button>`;
                }
            });

            // Next
            const nextDisabled = current === total;
            html += `<button data-page="${current + 1}" class="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 ${nextDisabled ? 'opacity-30 cursor-not-allowed pointer-events-none' : 'transition-colors'}" aria-label="Next Page"><i class="ri-arrow-right-s-line text-xl pointer-events-none"></i></button>`;

            html += '</div>';
            return html;
        }

        async function loadIndex() {
            if (miniSearch || isLoading) return;
            isLoading = true;
            try {
                if (typeof MiniSearch === 'undefined') throw new Error('MiniSearch library not loaded');
                const response = await fetch('/search-index.json?v=' + Date.now());
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const json = await response.text();
                miniSearch = MiniSearch.loadJSON(json, {
                    fields: ['title', 'content', 'description', 'tags', 'category', 'topic', 'author'],
                    storeFields: ['title', 'category', 'id', 'topic', 'imageUrl', 'description', 'author'],
                    tokenize: tokenize,
                    searchOptions: {
                        boost: { title: 2, topic: 1.5, category: 1.2, author: 1.2 },
                        fuzzy: 0.2
                    }
                });
            } catch (e) {
                console.error('Failed to load search index', e);
                searchGrid.innerHTML = `
                    <div class="col-span-full flex flex-col items-center justify-center h-64 text-red-500">
                        <i class="ri-error-warning-line text-4xl mb-3"></i>
                        <p class="text-lg font-medium">Search Unavailable</p>
                        <p class="text-sm opacity-80">${e.message || 'Failed to load index'}</p>
                    </div>
                `;
            } finally {
                isLoading = false;
                // Re-trigger search if input has value
                if (input.value.trim()) input.dispatchEvent(new Event('input'));
            }
        }

        function renderCard(item) {
            const title = item.title;
            const category = item.category || 'Uncategorized';
            const id = item.id;
            const desc = item.description || '';
            const imageUrl = item.imageUrl;

            const getImg = (url, width) => {
                if (!url) return '';
                if (url.includes('wsrv.nl')) return url;
                return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${width}&q=80&output=webp`;
            };

            const imgHtml = imageUrl
                ? `<div class="w-full h-32 mb-3 shrink-0 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 relative isolate"><img src="${getImg(imageUrl, 400)}" class="w-full h-full object-cover" loading="lazy"></div>`
                : '';

            return `
             <a href="/p/${id}.html" class="block group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors duration-200 cursor-pointer flex flex-col h-[280px] p-5 relative rounded-2xl overflow-hidden">
                <div class="flex justify-between items-start mb-3 shrink-0">
                    <span class="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700/50">${category}</span>
                </div>
                <h3 class="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2 line-clamp-1 group-hover:opacity-70 transition-opacity shrink-0">${title}</h3>
                ${imgHtml}
                <div class="flex-1 overflow-hidden relative mb-3 rounded-lg min-h-0 ${!imageUrl ? 'bg-zinc-50/50 dark:bg-zinc-800/20 p-3' : ''}">
                   <p class="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed opacity-90 break-words line-clamp-${imageUrl ? '2' : '6'}">${desc}</p>
                </div>
             </a>
             `;
        }

        function renderSearchResults() {
            if (!searchGrid) return;

            const total = searchResults.length;
            if (total === 0) {
                searchGrid.innerHTML = `
                    <div class="col-span-full flex flex-col items-center justify-center h-64 text-zinc-400">
                        <i class="ri-search-line text-4xl mb-3 opacity-50"></i>
                        <p class="text-lg font-medium">No results found</p>
                        <p class="text-sm">Try different keywords.</p>
                    </div>
                 `;
                return;
            }

            const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
            if (currentPage > totalPages) currentPage = 1;

            const start = (currentPage - 1) * ITEMS_PER_PAGE;
            const pageItems = searchResults.slice(start, start + ITEMS_PER_PAGE);

            let html = pageItems.map(renderCard).join('');
            html += renderPaginationControls(currentPage, totalPages);

            searchGrid.innerHTML = html;

            // Bind Pagination Events
            searchGrid.querySelectorAll('button[data-page]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation(); // prevent card click
                    const p = parseInt(btn.getAttribute('data-page'));
                    if (!isNaN(p)) {
                        currentPage = p;
                        renderSearchResults();
                        // Scroll to top of results?
                        const top = document.querySelector('main')?.offsetTop || 0;
                        document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                });
            });
        }

        function clearSearch() {
            input.value = '';
            clearBtn.classList.add('hidden');
            if (isListPage) {
                searchGrid.classList.add('hidden');
                searchGrid.innerHTML = '';
                staticGrid.classList.remove('hidden');
            }
        }

        if (clearBtn) clearBtn.addEventListener('click', clearSearch);

        input.addEventListener('focus', loadIndex);

        let debounceTimer;
        input.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            const query = e.target.value.trim();

            if (clearBtn) {
                if (query) clearBtn.classList.remove('hidden');
                else clearBtn.classList.add('hidden');
            }

            if (!query) {
                clearSearch();
                return;
            }

            if (!isListPage) return;

            debounceTimer = setTimeout(async () => {
                if (!miniSearch && !isLoading) {
                    await loadIndex();
                    // loadIndex triggers re-input event or checks value, but here we can continue
                }
                if (isLoading) {
                    staticGrid.classList.add('hidden');
                    searchGrid.classList.remove('hidden');
                    searchGrid.innerHTML = '<div class="col-span-full py-10 text-center text-zinc-400 animate-pulse">Loading search index...</div>';
                    return;
                }

                if (miniSearch) {
                    staticGrid.classList.add('hidden');
                    searchGrid.classList.remove('hidden');

                    searchResults = miniSearch.search(query, { prefix: true });
                    currentPage = 1;
                    renderSearchResults();
                }
            }, 300);
        });
    }

    // --- Init ---
    document.addEventListener('DOMContentLoaded', () => {
        setupTheme();
        setupSidebar();
        setupCopy();
        setupMobileTabs();
        setupSearch();
    });

})();
