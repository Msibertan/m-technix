import '../../style.css';
import { initMain } from '../main.js';
import { initScrollProgress, initParallaxHero } from '../shared-effects.js';

document.addEventListener('DOMContentLoaded', () => {
    initMain();
    initTabSwitcher();
    initScrollProgress();
    initParallaxHero();
    initImageLoadDetection();
    initEnhancedReveal();
});

/* ──── Tab Switcher ──── */
function initTabSwitcher() {
    const buttons = document.querySelectorAll('.tab-switcher__btn');
    const slider = document.querySelector('.tab-switcher__slider');
    const panels = document.querySelectorAll('.tab-panel');

    if (!buttons.length || !slider) return;

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;

            // Update buttons
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Move slider
            const idx = Array.from(buttons).indexOf(btn);
            slider.classList.toggle('right', idx === 1);

            // Show/hide panels
            panels.forEach(p => p.classList.remove('active'));
            const target = document.getElementById(`tab-${tab}`);
            if (target) {
                target.classList.add('active');
                // Re-trigger reveal animations for newly visible elements
                target.querySelectorAll('[data-reveal]').forEach(el => {
                    el.classList.remove('revealed');
                    void el.offsetWidth; // force reflow
                    el.classList.add('revealed');
                });
            }
        });
    });
}

/* ──── Image Load Detection ──── */
function initImageLoadDetection() {
    const images = document.querySelectorAll('.bento-card__visual img');

    images.forEach(img => {
        if (img.complete && img.naturalWidth > 0) {
            img.setAttribute('data-loaded', 'true');
        } else {
            img.addEventListener('load', () => {
                img.setAttribute('data-loaded', 'true');
            });
            img.addEventListener('error', () => {
                img.setAttribute('data-loaded', 'true');
            });
        }
    });
}

/* ──── Enhanced Reveal with IntersectionObserver ──── */
function initEnhancedReveal() {
    const cards = document.querySelectorAll('.bento-card[data-reveal]');
    if (!cards.length) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        }
    );

    cards.forEach(card => observer.observe(card));
}
