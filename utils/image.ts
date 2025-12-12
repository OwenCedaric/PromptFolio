
/**
 * Generates an optimized image URL using wsrv.nl
 * @param url The original image URL
 * @param width Target width
 * @param height Target height (optional)
 * @param quality Quality (1-100, default 75)
 */
export const getOptimizedImageUrl = (url: string | undefined, width: number, height?: number, quality: number = 75): string => {
    if (!url) return '';
    
    // Skip optimization for:
    // 1. Data URLs (Base64)
    // 2. SVGs (Vector graphics shouldn't be rasterized)
    // 3. Localhost/Relative URLs (Proxy can't reach them)
    if (url.startsWith('data:') || url.endsWith('.svg') || url.startsWith('/')) {
        return url;
    }

    try {
        // Encode the URL to ensure query params in the source URL don't break the proxy
        const cleanUrl = new URL(url).toString();
        
        const params = new URLSearchParams({
            url: cleanUrl,
            w: width.toString(),
            q: quality.toString(),
            output: 'webp', // Force WebP for better compression
            il: '' // Incremental loading (Progressive)
        });

        if (height) {
            params.append('h', height.toString());
            params.append('fit', 'cover'); // Smart crop
        }

        return `https://wsrv.nl/?${params.toString()}`;
    } catch (e) {
        // Fallback if URL parsing fails
        return url;
    }
};