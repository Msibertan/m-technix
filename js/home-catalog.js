/* ═══════════════════════════════════════════
   Home Catalog — Load real cars from Supabase
   ═══════════════════════════════════════════ */

import { supabaseGet } from './supabase.js';

function formatPrice(price) {
    if (!price) return '—';
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}

function formatMileage(km) {
    if (!km && km !== 0) return '—';
    return new Intl.NumberFormat('ru-RU').format(km) + ' км';
}

function getFuelIcon(fuel) {
    if (!fuel) return 'fuel';
    const lower = fuel.toLowerCase();
    if (lower.includes('дизель')) return 'fuel';
    if (lower.includes('электро')) return 'zap';
    if (lower.includes('гибрид')) return 'leaf';
    return 'fuel';
}

function getStatusBadge(status) {
    if (!status) return '';
    const labels = {
        'in_stock': 'В наличии',
        'in_transit': 'В пути',
        'on_order': 'Под заказ',
    };
    const label = labels[status] || status;
    const orderClass = status === 'on_order' ? ' car-card__badge--order' : '';
    return `<div class="car-card__badge${orderClass}">${label}</div>`;
}

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
        <a href="/car.html?slug=${car.slug}" class="car-card car-card--link" data-reveal>
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

export async function initHomeCatalog() {
    const grid = document.getElementById('homeCarsGrid');
    const loading = document.getElementById('homeCarsLoading');
    if (!grid) return;

    try {
        const cars = await supabaseGet('cars', {
            select: 'slug,title,brand,model,year,mileage,fuel_type,engine_volume,transmission,price,status,main_image,images',
            order: 'created_at.desc',
            limit: '3'
        });

        if (loading) loading.style.display = 'none';

        if (!cars || cars.length === 0) {
            grid.innerHTML = '<p style="text-align:center; color:var(--c-text-muted); grid-column:1/-1;">Автомобили скоро появятся</p>';
            return;
        }

        grid.innerHTML = cars.map(car => renderCarCard(car)).join('');

        // Re-init lucide icons for the new cards
        if (window.lucide) {
            window.lucide.createIcons();
        }

        // Trigger reveal animations
        grid.querySelectorAll('[data-reveal]').forEach((el, i) => {
            setTimeout(() => el.classList.add('revealed'), i * 100);
        });

    } catch (err) {
        console.error('Failed to load home catalog:', err);
        if (loading) loading.style.display = 'none';
        grid.innerHTML = '<p style="text-align:center; color:var(--c-text-muted); grid-column:1/-1;">Не удалось загрузить каталог</p>';
    }
}
