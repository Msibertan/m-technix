import '../../style.css';
import { initMain } from '../main.js';
import { initCatalogFilters } from '../catalog.js';
import { initScrollProgress, initParallaxHero } from '../shared-effects.js';

document.addEventListener('DOMContentLoaded', () => {
    initMain();
    initScrollProgress();
    initParallaxHero();
    initCatalogFilters();
});
