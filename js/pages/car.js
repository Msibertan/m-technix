/* ═══════════════════════════════════════════
   Car Detail Page 
   ═══════════════════════════════════════════ */

import { initMain } from '../main.js';
import { supabaseGet } from '../supabase.js';

initMain();

/* ──── Re-observe dynamic [data-reveal] elements ──── */
function revealDynamicElements() {
    const els = document.querySelectorAll('[data-reveal]:not(.revealed)');
    if (!els.length) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.05, rootMargin: '0px 0px 0px 0px' }
    );

    els.forEach(el => observer.observe(el));
}
/* ──── Helpers ──── */
function formatPrice(price) {
    if (!price) return '—';
    return Number(price).toLocaleString('ru-RU') + ' ₽';
}

function formatMileage(km) {
    if (!km) return '—';
    return Number(km).toLocaleString('ru-RU') + ' км';
}

/* ──── Load Car by Slug ──── */
async function loadCar() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');

    if (!slug) {
        showError('Автомобиль не найден');
        return;
    }

    try {
        const cars = await supabaseGet('cars', { slug: `eq.${slug}` });
        if (!cars || cars.length === 0) {
            showError('Автомобиль не найден');
            return;
        }
        const car = cars[0];

        // Update page title
        document.title = `${car.title || car.brand + ' ' + car.model} — М-Техникс`;
        if (car.meta_description) {
            document.querySelector('meta[name="description"]')?.setAttribute('content', car.meta_description);
        }

        renderCar(car);
        await loadSimilarCars(car);

        // Re-init lucide icons
        if (window.lucide) lucide.createIcons();

        // Init lightbox
        initLightbox(car);

        // Reveal dynamically-injected elements (initScrollReveal ran before async content)
        revealDynamicElements();

    } catch (err) {
        console.error('Error loading car:', err);
        showError('Ошибка загрузки данных');
    }
}

/* ──── Render Car ──── */
function renderCar(car) {
    const detail = document.getElementById('carDetail');
    const images = car.images || [];
    const mainImg = car.main_image || images[0] || '/images/search-europe.jpg';
    const allImages = [mainImg, ...images.filter(i => i !== mainImg)];

    const statusMap = {
        'available': { text: 'В наличии', cls: 'car-status--available' },
        'reserved': { text: 'Забронирован', cls: 'car-status--reserved' },
        'sold': { text: 'Продан', cls: 'car-status--sold' }
    };
    const status = statusMap[car.status] || statusMap['available'];

    // Build specs grid
    const specs = [];
    const addSpec = (icon, label, value) => {
        if (value) specs.push({ icon, label, value });
    };

    addSpec('calendar', 'Год выпуска', car.year);
    addSpec('gauge', 'Пробег', formatMileage(car.mileage));
    addSpec('fuel', 'Топливо', car.fuel_type);
    addSpec('settings-2', 'КПП', car.transmission);
    addSpec('cylinder', 'Объём двигателя', car.engine_volume ? `${car.engine_volume} л` : null);
    addSpec('zap', 'Мощность', car.engine_power ? `${car.engine_power} л.с.` : null);
    addSpec('circle-dot', 'Привод', car.drive_type);
    addSpec('car', 'Кузов', car.body_type);
    addSpec('palette', 'Цвет', car.color_exterior || car.color);
    addSpec('armchair', 'Интерьер', car.color_interior);


    // Badges
    const badges = [
        '<span class="car-badge car-badge--ok"><i data-lucide="shield-check"></i> VIN проверен</span>',
        '<span class="car-badge car-badge--ok"><i data-lucide="file-check"></i> Документы готовы</span>'
    ];
    if (car.is_featured) badges.push('<span class="car-badge car-badge--star"><i data-lucide="star"></i> Избранное</span>');

    const carTitle = car.title || (car.brand + ' ' + car.model);

    detail.innerHTML = `
        <!-- Hero breadcrumb -->
        <section class="car-hero">
            <div class="container">
                <nav class="breadcrumbs" data-reveal>
                    <a href="/">Главная</a>
                    <span>/</span>
                    <a href="/catalog">Каталог</a>
                    <span>/</span>
                    <span>${car.title || car.brand + ' ' + car.model}</span>
                </nav>
            </div>
        </section>

        <section class="section car-content">
            <div class="container">
                <div class="car-layout" data-reveal>
                    <!-- Gallery -->
                    <div class="car-gallery">
                        <div class="car-gallery__main">
                            <img src="${mainImg}" alt="${car.title}" id="galleryMain" 
                                 class="car-gallery__main-img" data-idx="0"
                                 onerror="this.src='/images/search-europe.jpg'" />
                            <div class="car-gallery__status ${status.cls}">${status.text}</div>
                        </div>
                        ${allImages.length > 1 ? `
                            <div class="car-gallery__thumbs">
                                ${allImages.map((img, i) => `
                                    <img src="${img}" alt="Фото ${i + 1}" 
                                         class="car-gallery__thumb ${i === 0 ? 'active' : ''}"
                                         data-idx="${i}"
                                         onerror="this.style.display='none'" />
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>

                    <!-- Info -->
                    <div class="car-info">
                        <h1 class="car-info__title">${car.title || car.brand + ' ' + car.model}</h1>
                        <div class="car-info__price">${formatPrice(car.price)}</div>
                        
                        ${badges.length ? `<div class="car-info__badges">${badges.join('')}</div>` : ''}



                        <div class="car-specs-grid">
                            ${specs.map(s => `
                                <div class="car-spec">
                                    <i data-lucide="${s.icon}"></i>
                                    <div class="car-spec__content">
                                        <span class="car-spec__label">${s.label}</span>
                                        <span class="car-spec__value">${s.value}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>

                        <a href="/contacts?carSlug=${car.slug}#form" class="btn btn--primary btn--lg car-info__cta">
                            <i data-lucide="message-circle"></i> Оставить заявку
                        </a>
                    </div>
                </div>

                ${car.full_description || car.description ? `
                    <div class="car-description" data-reveal>
                        <h2>Описание</h2>
                        <div class="car-description__text">${(car.full_description || car.description || '').replace(/\n/g, '<br>')}</div>
                    </div>
                ` : ''}

                ${car.features && car.features.length ? `
                    <div class="car-features" data-reveal>
                        <h2>Комплектация</h2>
                        <div class="car-features__list">
                            ${car.features.map(f => `<span class="car-feature"><i data-lucide="check"></i> ${f}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        </section>

        <!-- Similar Cars -->
        <section class="section car-similar" id="similarSection" style="display:none;">
            <div class="container">
                <h2 class="section__title" data-reveal>Вам может понравиться</h2>
                <div class="catalog__grid catalog__grid--full" id="similarGrid" data-reveal></div>
            </div>
        </section>

        <!-- CTA -->
        <section class="cta-banner section">
            <div class="container">
                <div class="cta-banner__inner" data-reveal>
                    <h2 class="cta-banner__title">Не нашли нужный автомобиль?</h2>
                    <p class="cta-banner__text">Мы подберём любой авто под ваш запрос из 15 стран Европы</p>
                    <a href="/contacts#form" class="btn btn--primary btn--lg">Оставить заявку на подбор</a>
                </div>
            </div>
        </section>
    `;

    // Thumbnail click
    detail.querySelectorAll('.car-gallery__thumb').forEach(thumb => {
        thumb.addEventListener('click', () => {
            const idx = parseInt(thumb.dataset.idx);
            const mainImg = document.getElementById('galleryMain');
            mainImg.src = allImages[idx];
            mainImg.dataset.idx = idx;
            detail.querySelectorAll('.car-gallery__thumb').forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
        });
    });

    // Main image click → lightbox
    const mainImgEl = document.getElementById('galleryMain');
    if (mainImgEl) {
        mainImgEl.addEventListener('click', () => {
            openLightbox(allImages, parseInt(mainImgEl.dataset.idx));
        });
    }
}

/* ──── Lightbox ──── */
let lbImages = [];
let lbIndex = 0;

function openLightbox(images, startIdx = 0) {
    lbImages = images;
    lbIndex = startIdx;
    const lb = document.getElementById('lightbox');
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    updateLightbox();
}

function closeLightbox() {
    document.getElementById('lightbox').classList.remove('open');
    document.body.style.overflow = '';
}

function updateLightbox() {
    document.getElementById('lightboxImg').src = lbImages[lbIndex];
    document.getElementById('lightboxCounter').textContent = `${lbIndex + 1} / ${lbImages.length}`;
}

function initLightbox() {
    document.getElementById('lightboxClose')?.addEventListener('click', closeLightbox);
    document.getElementById('lightboxPrev')?.addEventListener('click', () => {
        lbIndex = (lbIndex - 1 + lbImages.length) % lbImages.length;
        updateLightbox();
    });
    document.getElementById('lightboxNext')?.addEventListener('click', () => {
        lbIndex = (lbIndex + 1) % lbImages.length;
        updateLightbox();
    });

    document.getElementById('lightbox')?.addEventListener('click', (e) => {
        if (e.target.id === 'lightbox') closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
        if (!document.getElementById('lightbox')?.classList.contains('open')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') { lbIndex = (lbIndex - 1 + lbImages.length) % lbImages.length; updateLightbox(); }
        if (e.key === 'ArrowRight') { lbIndex = (lbIndex + 1) % lbImages.length; updateLightbox(); }
    });
}

/* ──── Similar Cars ──── */
async function loadSimilarCars(car) {
    try {
        // Find similar by same brand, excluding current
        const similar = await supabaseGet('cars', {
            brand: `eq.${car.brand}`,
            id: `neq.${car.id}`,
            status: 'eq.available',
            limit: '4',
            order: 'created_at.desc'
        });

        let cars = similar || [];

        // If not enough from same brand, fill with similar price range
        if (cars.length < 4) {
            const minPrice = Math.round(car.price * 0.7);
            const maxPrice = Math.round(car.price * 1.3);
            const excludeIds = [car.id, ...cars.map(c => c.id)];

            const moreCars = await supabaseGet('cars', {
                id: `not.in.(${excludeIds.join(',')})`,
                status: 'eq.available',
                price: `gte.${minPrice}`,
                'price': `lte.${maxPrice}`,
                limit: `${4 - cars.length}`,
                order: 'created_at.desc'
            });
            cars = [...cars, ...(moreCars || [])];
        }

        if (cars.length === 0) return;

        const section = document.getElementById('similarSection');
        const grid = document.getElementById('similarGrid');
        section.style.display = '';

        grid.innerHTML = cars.map(c => {
            const img = c.main_image || (c.images && c.images[0]) || '/images/search-europe.jpg';
            return `
                <a href="/car?slug=${c.slug}" class="car-card car-card--link" data-reveal>
                    <div class="car-card__image">
                        <img src="${img}" alt="${c.title || c.brand + ' ' + c.model}" loading="lazy"
                             onerror="this.src='/images/search-europe.jpg'" />
                    </div>
                    <div class="car-card__body">
                        <h3 class="car-card__name">${c.title || (c.brand + ' ' + c.model)}</h3>
                        <div class="car-card__specs">
                            <span><i data-lucide="calendar"></i> ${c.year || '—'}</span>
                            <span><i data-lucide="gauge"></i> ${formatMileage(c.mileage)}</span>
                            <span><i data-lucide="fuel"></i> ${c.fuel_type || '—'}</span>
                        </div>
                        <div class="car-card__footer">
                            <span class="car-card__price">${formatPrice(c.price)}</span>
                        </div>
                    </div>
                </a>
            `;
        }).join('');

        if (window.lucide) lucide.createIcons();

    } catch (err) {
        console.error('Error loading similar cars:', err);
    }
}

/* ──── Error State ──── */
function showError(message) {
    const detail = document.getElementById('carDetail');
    detail.innerHTML = `
        <section class="section">
            <div class="container" style="text-align:center;padding:6rem 0;">
                <i data-lucide="car" style="width:64px;height:64px;color:var(--accent);margin-bottom:1.5rem;"></i>
                <h2>${message}</h2>
                <p style="margin:1rem 0 2rem;color:var(--text-muted);">Попробуйте вернуться в каталог</p>
                <a href="/catalog" class="btn btn--primary">Перейти в каталог</a>
            </div>
        </section>
    `;
    if (window.lucide) lucide.createIcons();
}

/* ──── Init ──── */
loadCar();
