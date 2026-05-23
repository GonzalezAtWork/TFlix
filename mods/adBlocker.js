/**
 * TFlix Ad Blocker and Popup Remover
 * Detects and removes ads, popups, and unwanted overlays
 */

/**
 * Initialize ad blocking and popup removal
 */
function initializeAdBlocker() {
    // Remove popups and ads on initial page load
    removeAdsAndPopups();

    // Set up MutationObserver to catch dynamically added ads/popups
    setupAdBlockerObserver();

    // Remove inline ads and tracking elements
    removeInlineAds();

    // Block ads from loading
    blockAdLoading();

    // Clean up common ad containers
    setupPeriodicAdCleanup();
}

/**
 * Remove ads and popups from the page
 */
function removeAdsAndPopups() {
    const adSelectors = [
        // Common ad container selectors
        '.ad', '.ads', '.ad-container', '.advertisement', '.advert',
        '[class*="ad-"]', '[class*="ads-"]', '[id*="ad-"]', '[id*="ads-"]',

        // Common popup/modal selectors
        '.popup', '.modal', '.overlay', '.lightbox', '.dialog',
        '[class*="popup"]', '[class*="modal"]', '[class*="overlay"]',
        '[id*="popup"]', '[id*="modal"]', '[id*="overlay"]',

        // Specific ad network selectors
        '[data-ad-client]', '[data-ad-slot]', '.adsbygoogle',
        'iframe[src*="ads"]', 'iframe[src*="googleads"]',
        'script[src*="ads"]', 'script[src*="analytics"]',

        // Common banner ads
        '.banner', '.banner-ad', '.header-ad', '.footer-ad',
        '[class*="banner"]', '[id*="banner"]',

        // Video ads and player overlays
        '.video-ad', '.player-ad', '.preroll', '.midroll', '.postroll',
        '[class*="video-ad"]', '[class*="player-ad"]',

        // Common obscuring elements
        '.overlay-bg', '.modal-bg', '.dimmer',

        // Cineby.sc specific ad patterns
        '.cineby-ad', '.cineby-popup', '.cineby-modal',
        '[data-cineby-ad]', '[data-ad-type]',

        // Generic overlay/fullscreen elements that might be ads
        '[style*="position: fixed"]', '[style*="z-index: 9999"]', '[style*="z-index: 99999"]'
    ];

    let removedCount = 0;

    for (const selector of adSelectors) {
        try {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                // Skip if it's the main content
                if (isMainContent(el)) return;

                // Check if it looks like an ad or popup
                if (isLikelyAdOrPopup(el)) {
                    el.style.display = 'none';
                    el.classList.add('tflix-blocked');
                    removedCount++;
                }
            });
        } catch (e) {
            // Silent error - some selectors might not be valid in all contexts
        }
    }

    if (removedCount > 0) {
        console.log(`TFlix: Removed ${removedCount} ads/popups`);
    }
}

/**
 * Check if element is likely an ad or popup
 * @param {HTMLElement} el - Element to check
 * @returns {boolean} - True if likely an ad or popup
 */
function isLikelyAdOrPopup(el) {
    if (!el) return false;

    // Check element size and position
    const rect = el.getBoundingClientRect();

    // Skip if element is too small or too large
    if (rect.width < 50 && rect.height < 50) return true;
    if (rect.width > window.innerWidth * 0.9 && rect.height > window.innerHeight * 0.9) return true;

    // Check data attributes
    const dataAttrs = el.dataset || {};
    const dataStr = JSON.stringify(dataAttrs).toLowerCase();
    if (dataStr.includes('ad') || dataStr.includes('popup') || dataStr.includes('modal')) return true;

    // Check classes
    const classStr = (el.className || '').toLowerCase();
    if (classStr.includes('ad') || classStr.includes('popup') || classStr.includes('modal')) return true;

    // Check id
    const idStr = (el.id || '').toLowerCase();
    if (idStr.includes('ad') || idStr.includes('popup') || idStr.includes('modal')) return true;

    // Check aria-label and title
    const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
    const title = (el.getAttribute('title') || '').toLowerCase();
    if (ariaLabel.includes('advertisement') || title.includes('advertisement')) return true;

    return false;
}

/**
 * Check if element is main content
 * @param {HTMLElement} el - Element to check
 * @returns {boolean} - True if element is main content
 */
function isMainContent(el) {
    if (!el) return false;

    // Check if it's a video element or video container
    if (el.tagName === 'VIDEO' || el.querySelector('video')) return true;

    // Check if it's main content container
    const mainSelectors = ['main', '[role="main"]', '.main-content', '.content', '.player'];
    for (const selector of mainSelectors) {
        if (el.matches(selector) || el.querySelector(selector)) return true;
    }

    // Check if it's a movie/show card (likely content)
    if (el.classList.contains('movie-card') || el.classList.contains('content-item')) return true;

    return false;
}

/**
 * Setup MutationObserver to catch dynamically added ads
 */
function setupAdBlockerObserver() {
    const observer = new MutationObserver((mutations) => {
        let shouldClean = false;

        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                // Check if new nodes look like ads
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1) { // Element node
                        if (isLikelyAdOrPopup(node) && !isMainContent(node)) {
                            node.style.display = 'none';
                            node.classList.add('tflix-blocked');
                            shouldClean = true;
                        }

                        // Check children too
                        const children = node.querySelectorAll && node.querySelectorAll('*');
                        if (children) {
                            for (const child of children) {
                                if (isLikelyAdOrPopup(child) && !isMainContent(child)) {
                                    child.style.display = 'none';
                                    child.classList.add('tflix-blocked');
                                    shouldClean = true;
                                }
                            }
                        }
                    }
                }
            } else if (mutation.type === 'attributes') {
                // Check if attributes were modified to show ads
                if (mutation.target.classList && mutation.target.classList.contains('tflix-blocked')) {
                    mutation.target.style.display = 'none';
                    shouldClean = true;
                }
            }
        }

        if (shouldClean) {
            removeAdsAndPopups();
        }
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class'],
        attributeOldValue: false
    });

    // Return observer for potential cleanup
    return observer;
}

/**
 * Remove inline ad scripts and tracking
 */
function removeInlineAds() {
    try {
        // Remove ad-related scripts
        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => {
            const src = (script.src || '').toLowerCase();
            const content = (script.textContent || '').toLowerCase();

            if (src.includes('googleads') || src.includes('ads') || src.includes('analytics')) {
                script.remove();
                return;
            }

            if (content.includes('adsbygoogle') || content.includes('google-analytics')) {
                script.remove();
                return;
            }
        });

        // Remove tracking pixels
        const imgs = document.querySelectorAll('img[src*="analytics"], img[src*="tracking"], img[src*="ad"]');
        imgs.forEach(img => {
            if (img.width < 10 && img.height < 10) {
                img.remove();
            }
        });

        // Remove hidden divs with ad content
        const hiddenDivs = document.querySelectorAll('div[style*="display: none"]');
        hiddenDivs.forEach(div => {
            if (isLikelyAdOrPopup(div)) {
                div.remove();
            }
        });
    } catch (e) {
        console.log('TFlix: Error removing inline ads:', e);
    }
}

/**
 * Block ads from loading by intercepting network requests
 */
function blockAdLoading() {
    try {
        // Override fetch for ad-related requests
        const originalFetch = window.fetch;
        window.fetch = function (...args) {
            const url = args[0];
            const urlStr = typeof url === 'string' ? url : url.toString();

            // Block known ad domains and endpoints
            if (isAdUrl(urlStr)) {
                console.log('TFlix: Blocked ad request:', urlStr);
                return Promise.reject(new Error('Ad blocked'));
            }

            return originalFetch.apply(this, args);
        };
    } catch (e) {
        // Silently fail if fetch override is not possible
    }
}

/**
 * Check if URL is likely an ad
 * @param {string} url - URL to check
 * @returns {boolean} - True if likely an ad URL
 */
function isAdUrl(url) {
    const adPatterns = [
        'googleads', 'doubleclick', 'adserver', 'adnetwork',
        'ads.google', 'pagead', 'googleadservices',
        'adtech', 'advertising', 'ad.doubleclick'
    ];

    const urlLower = url.toLowerCase();
    return adPatterns.some(pattern => urlLower.includes(pattern));
}

/**
 * Setup periodic ad cleanup
 */
function setupPeriodicAdCleanup() {
    // Run cleanup every 5 seconds
    setInterval(() => {
        try {
            // Remove any new popups
            const popups = document.querySelectorAll('[class*="popup"]:not(.tflix-blocked), [id*="popup"]:not(.tflix-blocked)');
            popups.forEach(popup => {
                if (isLikelyAdOrPopup(popup) && !isMainContent(popup)) {
                    popup.style.display = 'none';
                    popup.classList.add('tflix-blocked');
                }
            });

            // Remove fullscreen overlays
            const overlays = document.querySelectorAll('[style*="position: fixed"]:not(.tflix-blocked):not(.tflix-focused)');
            overlays.forEach(overlay => {
                if (isLikelyAdOrPopup(overlay) && !isMainContent(overlay)) {
                    const zIndex = window.getComputedStyle(overlay).zIndex;
                    // Remove if it's a very high z-index (likely blocking content)
                    if (zIndex > 1000) {
                        overlay.style.display = 'none';
                        overlay.classList.add('tflix-blocked');
                    }
                }
            });

            // Remove scroll jacking
            if (document.body.style.overflow === 'hidden') {
                document.body.style.overflow = 'auto';
            }
        } catch (e) {
            // Silently handle errors
        }
    }, 5000);
}

/**
 * Close any open ad popups using keyboard
 */
function setupAdPopupCloser() {
    document.addEventListener('keydown', (e) => {
        // Escape key to close popups
        if (e.key === 'Escape') {
            closeVisiblePopups();
        }
    });
}

/**
 * Close visible popups
 */
function closeVisiblePopups() {
    const popupSelectors = ['.popup', '.modal', '.overlay', '[role="dialog"]'];

    for (const selector of popupSelectors) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            if (window.getComputedStyle(el).display !== 'none') {
                // Try to find and click close button
                const closeBtn = el.querySelector('[aria-label*="close" i], [class*="close" i]');
                if (closeBtn) {
                    closeBtn.click();
                } else {
                    el.style.display = 'none';
                }
            }
        });
    }
}

// Export functions
export {
    initializeAdBlocker,
    removeAdsAndPopups,
    removeInlineAds,
    blockAdLoading,
    closeVisiblePopups
};
