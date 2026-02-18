/* ════════════════════════════════════════════
   SHARED EFFECTS — reusable across all pages
   ════════════════════════════════════════════ */

/* ──── Scroll Progress Bar ──── */
export function initScrollProgress() {
    const fill = document.getElementById('scrollProgress');
    if (!fill) return;

    function updateProgress() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        fill.style.width = `${Math.min(progress, 100)}%`;
    }

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
}

/* ──── Hero Parallax ──── */
export function initParallaxHero() {
    const hero = document.querySelector('.page-hero--extended');
    if (!hero) return;

    // Inject CSS for parallax transform via custom property
    const style = document.createElement('style');
    style.textContent = `
        .page-hero--extended::before {
            transform: translateY(var(--parallax-y, 0px)) !important;
        }
    `;
    document.head.appendChild(style);

    function updateParallax() {
        const scrollY = window.scrollY;
        const heroHeight = hero.offsetHeight;

        if (scrollY < heroHeight * 1.5) {
            const parallaxOffset = scrollY * 0.35;
            hero.style.setProperty('--parallax-y', `${parallaxOffset}px`);
        }
    }

    window.addEventListener('scroll', updateParallax, { passive: true });
}
