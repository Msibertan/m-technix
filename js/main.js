/* ═══════════════════════════════════════════
   Main JS — Shared logic across all pages
   Header scroll, mobile menu, scroll reveal, smooth scroll
   ═══════════════════════════════════════════ */

import { renderHeader } from './components/header.js';
import { renderFooter } from './components/footer.js';

export function initMain() {
    renderHeader();
    renderFooter();

    // Initialize Lucide icons after components render
    if (window.lucide) {
        lucide.createIcons();
    }

    initHeaderScroll();
    initMobileMenu();
    initScrollReveal();
    initSmoothScroll();

    // Reveal page after everything is initialized (prevents FOUC)
    document.body.classList.add('loaded');
}

/* ──── Header Scroll Effect ──── */
function initHeaderScroll() {
    const header = document.getElementById('header');
    if (!header) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }, { passive: true });
}

/* ──── Mobile Menu ──── */
function initMobileMenu() {
    const burger = document.getElementById('burger');
    const nav = document.getElementById('nav');
    if (!burger || !nav) return;

    burger.addEventListener('click', () => {
        burger.classList.toggle('active');
        nav.classList.toggle('open');
        document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
    });

    nav.querySelectorAll('.nav__link').forEach(link => {
        link.addEventListener('click', () => {
            burger.classList.remove('active');
            nav.classList.remove('open');
            document.body.style.overflow = '';
        });
    });
}

/* ──── Scroll Reveal ──── */
function initScrollReveal() {
    const elements = document.querySelectorAll('[data-reveal]');

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const siblings = entry.target.parentElement
                        ? Array.from(entry.target.parentElement.querySelectorAll('[data-reveal]'))
                        : [];
                    const idx = siblings.indexOf(entry.target);
                    setTimeout(() => entry.target.classList.add('revealed'), idx * 100);
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );

    elements.forEach(el => observer.observe(el));
}

/* ──── Smooth Scroll ──── */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', e => {
            const targetId = anchor.getAttribute('href');
            if (targetId === '#') return;
            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                e.preventDefault();
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}
