import '../../style.css';
import { initMain } from '../main.js';
import { initContactForm } from '../contact-form.js';
import { initScrollProgress, initParallaxHero } from '../shared-effects.js';

document.addEventListener('DOMContentLoaded', () => {
    initMain();
    initScrollProgress();
    initParallaxHero();
    initContactForm();
});
