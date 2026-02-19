/* ═══════════════════════════════════════════
   Catalog Filters — Connected to Supabase
   ═══════════════════════════════════════════ */

import { supabaseGet, supabaseGetWithCount } from './supabase.js';

let allBrands = [];
let allModels = [];
let currentCars = [];

/**
 * Format price in rubles
 */
function formatPrice(price) {
    if (!price) return '—';
    return Number(price).toLocaleString('ru-RU') + ' ₽';
}

/**
 * Format mileage 
 */
function formatMileage(km) {
    if (!km) return '—';
    return Number(km).toLocaleString('ru-RU') + ' км';
}

/**
 * Get fuel type icon name
 */
function getFuelIcon(fuel) {
    const map = { 'Бензин': 'fuel', 'Дизель': 'fuel', 'Гибрид': 'zap', 'Электро': 'zap' };
    return map[fuel] || 'fuel';
}

/**
 * Get status badge HTML
 */
function getStatusBadge(status) {
    const map = {
        'available': { text: 'В наличии', cls: '' },
        'reserved': { text: 'Забронирован', cls: 'car-card__badge--reserved' },
        'sold': { text: 'Продан', cls: 'car-card__badge--sold' }
    };
    const s = map[status] || map['available'];
    return `<div class="car-card__badge ${s.cls}">${s.text}</div>`;
}

/**
 * Render a single car card
 */
function renderCarCard(car) {
    const img = car.main_image || (car.images && car.images[0]) || '/images/search-europe.jpg';
    const specs = [
        `<span><i data-lucide="calendar"></i> ${car.year || '—'}</span>`,
        `<span><i data-lucide="gauge"></i> ${formatMileage(car.mileage)}</span>`,
        `<span><i data-lucide="${getFuelIcon(car.fuel_type)}"></i> ${car.fuel_type || '—'}</span>`
    ];

    if (car.engine_volume) {
        specs.push(`<span><i data-lucide="cylinder"></i> ${car.engine_volume} л</span>`);
    }
    if (car.transmission) {
        specs.push(`<span><i data-lucide="settings-2"></i> ${car.transmission}</span>`);
    }

    return `
        <a href="/car?slug=${car.slug}" class="car-card car-card--link" data-reveal>
            <div class="car-card__image">
                ${getStatusBadge(car.status)}
                <img src="${img}" alt="${car.title || car.brand + ' ' + car.model}" loading="lazy" 
                     onerror="this.src='/images/search-europe.jpg'" />
            </div>
            <div class="car-card__body">
                <h3 class="car-card__name">${car.title || (car.brand + ' ' + car.model)}</h3>
                <div class="car-card__specs">${specs.join('')}</div>
                <div class="car-card__footer">
                    <span class="car-card__price">${formatPrice(car.price)}</span>
                    <span class="btn btn--sm btn--primary">Подробнее</span>
                </div>
            </div>
        </a>
    `;
}

/**
 * Load brands for dropdown — using English name
 */
async function loadBrands() {
    try {
        allBrands = await supabaseGet('car_brands', {
            'is_active': 'eq.true',
            'order': 'name.asc',
            'select': 'id,name,name_ru'
        });
        const select = document.getElementById('filterBrand');
        if (!select) return;

        select.innerHTML = '<option value="">Все марки</option>';
        allBrands.forEach(b => {
            const opt = document.createElement('option');
            opt.value = b.name;
            opt.textContent = b.name; // English name
            select.appendChild(opt);
        });
    } catch (e) {
        console.error('Error loading brands:', e);
    }
}

/**
 * Load models for a specific brand — English name
 */
async function loadModels(brandName) {
    const select = document.getElementById('filterModel');
    if (!select) return;

    if (!brandName) {
        select.innerHTML = '<option value="">Сначала выберите марку</option>';
        select.disabled = true;
        return;
    }

    select.innerHTML = '<option value="">Загрузка...</option>';
    select.disabled = true;

    try {
        // find brand id by name
        const brand = allBrands.find(b => b.name === brandName);
        if (!brand) {
            select.innerHTML = '<option value="">Все модели</option>';
            select.disabled = false;
            return;
        }
        allModels = await supabaseGet('car_models', {
            'brand_id': `eq.${brand.id}`,
            'is_active': 'eq.true',
            'order': 'name.asc',
            'select': 'id,name,name_ru'
        });

        select.innerHTML = '<option value="">Все модели</option>';
        allModels.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.name;
            opt.textContent = m.name; // English name
            select.appendChild(opt);
        });
        select.disabled = false;
    } catch (e) {
        console.error('Error loading models:', e);
        select.innerHTML = '<option value="">Ошибка загрузки</option>';
    }
}

/**
 * Build year options
 */
function populateYears() {
    const currentYear = new Date().getFullYear();
    const fromSelect = document.getElementById('filterYearFrom');
    const toSelect = document.getElementById('filterYearTo');
    if (!fromSelect || !toSelect) return;

    for (let y = currentYear; y >= 2000; y--) {
        const optFrom = document.createElement('option');
        optFrom.value = y;
        optFrom.textContent = y;
        fromSelect.appendChild(optFrom);

        const optTo = document.createElement('option');
        optTo.value = y;
        optTo.textContent = y;
        toSelect.appendChild(optTo);
    }
}

/**
 * Load and display cars with current filters
 */
async function loadCars() {
    const grid = document.getElementById('carsGrid');
    const loading = document.getElementById('catalogLoading');
    const empty = document.getElementById('catalogEmpty');
    const countEl = document.getElementById('resultsCount');
    if (!grid) return;

    // Show loading
    grid.innerHTML = '';
    loading.style.display = 'flex';
    empty.style.display = 'none';

    // Build query params
    const params = {
        'select': '*',
    };

    // Brand filter
    const brand = document.getElementById('filterBrand')?.value;
    if (brand) params['brand'] = `eq.${brand}`;

    // Model filter
    const model = document.getElementById('filterModel')?.value;
    if (model) params['model'] = `eq.${model}`;

    // Year from
    const yearFrom = document.getElementById('filterYearFrom')?.value;
    if (yearFrom) params['year'] = `gte.${yearFrom}`;

    // Year to
    const yearTo = document.getElementById('filterYearTo')?.value;
    if (yearTo) {
        if (yearFrom) {
            // Both year from and to — use 'and' filter
            params['year'] = `gte.${yearFrom}`;
            params['and'] = `(year.lte.${yearTo})`;
        } else {
            params['year'] = `lte.${yearTo}`;
        }
    }

    // Fuel type
    const fuel = document.getElementById('filterFuel')?.value;
    if (fuel) params['fuel_type'] = `eq.${fuel}`;

    // Transmission
    const transmission = document.getElementById('filterTransmission')?.value;
    if (transmission) params['transmission'] = `eq.${transmission}`;

    // Max price
    const priceMax = document.getElementById('filterPriceMax')?.value;
    if (priceMax) params['price'] = `lte.${priceMax}`;

    // Sort
    const sortVal = document.getElementById('sortOrder')?.value || 'created_at.desc';
    params['order'] = sortVal;

    try {
        const { data, count } = await supabaseGetWithCount('cars', params);
        currentCars = data;

        loading.style.display = 'none';

        if (!data || data.length === 0) {
            empty.style.display = 'flex';
            countEl.textContent = 'Найдено: 0 авто';
            return;
        }

        countEl.textContent = `Найдено: ${count || data.length} авто`;
        grid.innerHTML = data.map(renderCarCard).join('');

        // Re-initialize lucide icons for new cards
        if (window.lucide) lucide.createIcons();

        // Trigger reveal animations
        requestAnimationFrame(() => {
            grid.querySelectorAll('[data-reveal]').forEach((el, i) => {
                el.style.animationDelay = `${i * 0.05}s`;
                el.classList.add('revealed');
            });
        });

    } catch (e) {
        console.error('Error loading cars:', e);
        loading.style.display = 'none';
        empty.style.display = 'flex';
        countEl.textContent = 'Ошибка загрузки';
    }
}

/**
 * Reset all filters
 */
function resetFilters() {
    document.getElementById('filterBrand').value = '';
    document.getElementById('filterModel').value = '';
    document.getElementById('filterModel').disabled = true;
    document.getElementById('filterModel').innerHTML = '<option value="">Сначала выберите марку</option>';
    document.getElementById('filterYearFrom').value = '';
    document.getElementById('filterYearTo').value = '';
    document.getElementById('filterFuel').value = '';
    document.getElementById('filterTransmission').value = '';
    document.getElementById('filterPriceMax').value = '';
    document.getElementById('sortOrder').value = 'created_at.desc';
    loadCars();
}

/**
 * Initialize Catalog
 */
export async function initCatalogFilters() {
    // Populate years
    populateYears();

    // Load brands
    await loadBrands();

    // Brand change -> load models
    const brandSelect = document.getElementById('filterBrand');
    if (brandSelect) {
        brandSelect.addEventListener('change', () => {
            loadModels(brandSelect.value);
        });
    }

    // Apply filters button
    const applyBtn = document.getElementById('applyFilters');
    if (applyBtn) {
        applyBtn.addEventListener('click', loadCars);
    }

    // Reset buttons
    const resetBtn = document.getElementById('resetFilters');
    const emptyReset = document.getElementById('emptyReset');
    if (resetBtn) resetBtn.addEventListener('click', resetFilters);
    if (emptyReset) emptyReset.addEventListener('click', resetFilters);

    // Sort change
    const sortSelect = document.getElementById('sortOrder');
    if (sortSelect) {
        sortSelect.addEventListener('change', loadCars);
    }

    // Initial load
    await loadCars();
}
