/* ═══════════════════════════════════════════
   Morphing Text Animation
   ═══════════════════════════════════════════ */

export function initMorphingText() {
    const morphEl = document.getElementById('morphText');
    if (!morphEl) return;

    const words = [
        'на 30% дешевле',
        'без рисков',
        'с гарантией',
        'за 14 дней',
        'под ключ',
    ];

    let currentIndex = 0;

    function createWordSpan(text) {
        const span = document.createElement('span');
        span.className = 'morph-word';
        span.textContent = text;
        return span;
    }

    const initialSpan = createWordSpan(words[0]);
    morphEl.appendChild(initialSpan);

    function morphToNext() {
        const currentSpan = morphEl.querySelector('.morph-word');
        if (!currentSpan) return;

        currentSpan.classList.add('fade-out');

        setTimeout(() => {
            currentSpan.remove();
            currentIndex = (currentIndex + 1) % words.length;
            const newSpan = createWordSpan(words[currentIndex]);
            newSpan.classList.add('fade-in');
            morphEl.appendChild(newSpan);

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    newSpan.classList.remove('fade-in');
                });
            });
        }, 500);
    }

    setInterval(morphToNext, 3000);
}
