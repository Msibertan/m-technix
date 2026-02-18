/* ═══════════════════════════════════════════
   М-Техникс — Index Page Entry Point
   ═══════════════════════════════════════════ */

import '../../style.css';
import { initMain } from '../main.js';
import { initMorphingText } from '../morphing.js';
import { initCounterAnimation } from '../counters.js';
import { initFAQ } from '../faq.js';
import { initHomeCatalog } from '../home-catalog.js';
import { initContactForm } from '../contact-form.js';
import { initScrollProgress, initParallaxHero } from '../shared-effects.js';

document.addEventListener('DOMContentLoaded', () => {
    initMain();
    initScrollProgress();
    initParallaxHero();
    initMorphingText();
    initCounterAnimation();
    initFAQ();
    initHomeCatalog();
    initContactForm();
});
