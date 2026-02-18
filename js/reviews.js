/* ═══════════════════════════════════════════
   Reviews Carousel
   ═══════════════════════════════════════════ */

export function initReviewsCarousel() {
    const track = document.getElementById('reviewsTrack');
    const prevBtn = document.getElementById('reviewPrev');
    const nextBtn = document.getElementById('reviewNext');
    const dotsContainer = document.getElementById('reviewDots');
    if (!track || !prevBtn || !nextBtn || !dotsContainer) return;

    const cards = track.querySelectorAll('.review-card');
    const totalCards = cards.length;

    function getVisibleCount() {
        if (window.innerWidth <= 768) return 1;
        if (window.innerWidth <= 1024) return 2;
        return 3;
    }

    let visibleCount = getVisibleCount();
    let currentSlide = 0;
    let maxSlide = Math.max(0, totalCards - visibleCount);

    function createDots() {
        dotsContainer.innerHTML = '';
        for (let i = 0; i <= maxSlide; i++) {
            const dot = document.createElement('span');
            dot.className = `reviews__dot${i === 0 ? ' active' : ''}`;
            dot.addEventListener('click', () => goToSlide(i));
            dotsContainer.appendChild(dot);
        }
    }

    function updateDots() {
        dotsContainer.querySelectorAll('.reviews__dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === currentSlide);
        });
    }

    function goToSlide(index) {
        currentSlide = Math.max(0, Math.min(index, maxSlide));
        const cardWidth = cards[0].offsetWidth + parseInt(getComputedStyle(track).gap || '24');
        track.style.transform = `translateX(-${currentSlide * cardWidth}px)`;
        updateDots();
    }

    prevBtn.addEventListener('click', () => goToSlide(currentSlide - 1));
    nextBtn.addEventListener('click', () => goToSlide(currentSlide + 1));

    createDots();

    let autoPlay = setInterval(() => {
        goToSlide(currentSlide >= maxSlide ? 0 : currentSlide + 1);
    }, 5000);

    track.addEventListener('mouseenter', () => clearInterval(autoPlay));
    track.addEventListener('mouseleave', () => {
        autoPlay = setInterval(() => {
            goToSlide(currentSlide >= maxSlide ? 0 : currentSlide + 1);
        }, 5000);
    });

    window.addEventListener('resize', () => {
        const newVisible = getVisibleCount();
        if (newVisible !== visibleCount) {
            visibleCount = newVisible;
            maxSlide = Math.max(0, totalCards - visibleCount);
            currentSlide = Math.min(currentSlide, maxSlide);
            createDots();
            goToSlide(currentSlide);
        }
    });
}
