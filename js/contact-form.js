/* ═══════════════════════════════════════════
   Contact Form Handler — Telegram Bot
   ═══════════════════════════════════════════ */

import { supabaseGet } from './supabase.js';

const TG_TOKEN = import.meta.env.VITE_TG_BOT_TOKEN;
const CHAT_IDS = (import.meta.env.VITE_TG_CHAT_IDS || '').split(',').filter(Boolean);

function formatPrice(price) {
    if (!price) return '—';
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}

async function sendToTelegram(text) {
    const url = `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`;

    const results = await Promise.allSettled(
        CHAT_IDS.map(chatId =>
            fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: text,
                    parse_mode: 'HTML',
                }),
            })
        )
    );

    const anySuccess = results.some(r => r.status === 'fulfilled' && r.value.ok);
    if (!anySuccess) throw new Error('Не удалось отправить сообщение');
}

/**
 * Render a mini car card above the form
 */
function renderCarCard(car, form) {
    const carTitle = car.title || (car.brand + ' ' + car.model);
    const img = car.main_image || (car.images && car.images[0]) || '/images/search-europe.jpg';
    const carUrl = `/car?slug=${car.slug}`;

    const specs = [];
    if (car.year) specs.push(car.year);
    if (car.mileage) specs.push(new Intl.NumberFormat('ru-RU').format(car.mileage) + ' км');
    if (car.fuel_type) specs.push(car.fuel_type);

    const cardHTML = `
        <div class="form-car-card">
            <div class="form-car-card__img">
                <img src="${img}" alt="${carTitle}" onerror="this.src='/images/search-europe.jpg'" />
            </div>
            <div class="form-car-card__info">
                <div class="form-car-card__label">Вы интересуетесь</div>
                <a href="${carUrl}" class="form-car-card__name">${carTitle}</a>
                ${specs.length ? `<div class="form-car-card__specs">${specs.join(' · ')}</div>` : ''}
                ${car.price ? `<div class="form-car-card__price">${formatPrice(car.price)}</div>` : ''}
            </div>
            <button type="button" class="form-car-card__remove" title="Убрать" aria-label="Убрать авто">
                <i data-lucide="x"></i>
            </button>
        </div>
    `;

    // Insert before the form
    const container = document.createElement('div');
    container.id = 'formCarCard';
    container.innerHTML = cardHTML;
    form.parentNode.insertBefore(container, form);

    // Remove button
    container.querySelector('.form-car-card__remove').addEventListener('click', () => {
        container.remove();
        const carInput = form.querySelector('#car');
        if (carInput) {
            carInput.value = '';
            carInput.closest('.form__group').style.display = '';
        }
    });

    // Init lucide icons for the X button
    if (window.lucide) lucide.createIcons();

    return { carTitle, carUrl };
}

export async function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    // Check if coming from a car detail page
    const urlParams = new URLSearchParams(window.location.search);
    const carSlug = urlParams.get('carSlug');
    let carData = null;

    if (carSlug) {
        try {
            const cars = await supabaseGet('cars', { slug: `eq.${carSlug}` });
            if (cars && cars.length > 0) {
                carData = cars[0];
                const { carTitle } = renderCarCard(carData, form);

                // Auto-fill and hide the car text input
                const carInput = form.querySelector('#car');
                if (carInput) {
                    carInput.value = carTitle;
                    carInput.closest('.form__group').style.display = 'none';
                }
            }
        } catch (err) {
            console.error('Error loading car for form:', err);
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.textContent;

        // Collect form data
        const name = form.querySelector('#name')?.value?.trim() || '—';
        const phone = form.querySelector('#phone')?.value?.trim() || '—';
        const car = form.querySelector('#car')?.value?.trim() || 'Не указан';

        // Build message
        const now = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
        let message = `🚗 <b>Новая заявка с сайта!</b>\n\n`
            + `👤 <b>Имя:</b> ${name}\n`
            + `📞 <b>Телефон:</b> ${phone}\n`
            + `🚘 <b>Автомобиль:</b> ${car}\n`
            + `🕐 <b>Время:</b> ${now}`;

        // Add car link if available
        if (carData) {
            message += `\n🔗 <b>Ссылка:</b> ${window.location.origin}/car?slug=${carData.slug}`;
        }

        // Show loading
        btn.textContent = 'Отправка...';
        btn.disabled = true;

        try {
            await sendToTelegram(message);
            btn.textContent = 'Отправлено ✓';
            btn.style.background = 'var(--c-accent)';
            form.reset();

            // Remove car card after successful submit
            const cardEl = document.getElementById('formCarCard');
            if (cardEl) cardEl.remove();

            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
                btn.disabled = false;
            }, 4000);
        } catch (err) {
            console.error('Telegram send error:', err);
            btn.textContent = 'Ошибка, попробуйте ещё';
            btn.style.background = '#e74c3c';

            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
                btn.disabled = false;
            }, 3000);
        }
    });
}
