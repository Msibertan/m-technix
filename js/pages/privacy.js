import '../../style.css';
import { initMain } from '../main.js';
import { initScrollProgress } from '../shared-effects.js';

document.addEventListener('DOMContentLoaded', () => {
    initMain();
    initScrollProgress();
});
