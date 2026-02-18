import '../../style.css';
import { initMain } from '../main.js';
import { initFAQ } from '../faq.js';
import { initScrollProgress, initParallaxHero } from '../shared-effects.js';

document.addEventListener('DOMContentLoaded', () => {
    initMain();
    initScrollProgress();
    initParallaxHero();
    initFAQ();
});
