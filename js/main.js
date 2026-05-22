/* ═══════════════════════════════════════════
   Main JS — Shared logic across all pages
   Header scroll, mobile menu, scroll reveal, smooth scroll
   ═══════════════════════════════════════════ */

import { renderHeader } from './components/header.js';
import { renderFooter } from './components/footer.js';

export function initMain() {
    renderHeader();
    renderFooter();
    renderFloatingButtons();

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

/* ──── Floating Action Buttons ──── */
function renderFloatingButtons() {
    const fab = document.createElement('div');
    fab.className = 'fab-container';
    fab.innerHTML = `
        <a href="https://t.me/OOO_M_Technics" target="_blank" rel="noopener" class="fab fab--tg" aria-label="Telegram">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </a>
        <a href="tel:+74951855740" class="fab fab--phone" aria-label="Позвонить">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        </a>
    `;
    document.body.appendChild(fab);
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
