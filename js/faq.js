/* ═══════════════════════════════════════════
   FAQ Accordion + Category Filtering
   ═══════════════════════════════════════════ */

export function initFAQ() {
    // Legacy FAQ accordion (index page)
    const faqItems = document.querySelectorAll('.faq__item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq__question');
        if (!question) return;

        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            faqItems.forEach(other => other.classList.remove('active'));
            if (!isActive) item.classList.add('active');
        });
    });

    // Premium FAQ accordion (FAQ page)
    const premiumItems = document.querySelectorAll('.faq-premium__item');
    premiumItems.forEach(item => {
        const question = item.querySelector('.faq-premium__question');
        if (!question) return;

        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            // Close all in same category
            const category = item.closest('.faq-category');
            if (category) {
                category.querySelectorAll('.faq-premium__item').forEach(other => other.classList.remove('active'));
            }
            if (!isActive) item.classList.add('active');
        });
    });

    // Category filtering
    const navBtns = document.querySelectorAll('.faq-quick-nav__btn');
    const categories = document.querySelectorAll('.faq-category');

    if (navBtns.length && categories.length) {
        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const cat = btn.dataset.category;

                // Update active pill
                navBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Show/hide categories
                if (cat === 'all') {
                    categories.forEach(c => c.classList.remove('hidden'));
                } else {
                    categories.forEach(c => {
                        c.classList.toggle('hidden', c.dataset.cat !== cat);
                    });
                }
            });
        });
    }
}
