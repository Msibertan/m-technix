/* ═══════════════════════════════════════════
   Contact Form Handler — Telegram Bot
   ═══════════════════════════════════════════ */

const TG_TOKEN = import.meta.env.VITE_TG_BOT_TOKEN;
const CHAT_IDS = (import.meta.env.VITE_TG_CHAT_IDS || '').split(',').filter(Boolean);

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

export function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

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
        const message = `🚗 <b>Новая заявка с сайта!</b>\n\n`
            + `👤 <b>Имя:</b> ${name}\n`
            + `📞 <b>Телефон:</b> ${phone}\n`
            + `🚘 <b>Автомобиль:</b> ${car}\n`
            + `🕐 <b>Время:</b> ${now}`;

        // Show loading
        btn.textContent = 'Отправка...';
        btn.disabled = true;

        try {
            await sendToTelegram(message);
            btn.textContent = 'Отправлено ✓';
            btn.style.background = 'var(--c-accent)';
            form.reset();

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
