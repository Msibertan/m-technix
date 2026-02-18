/* ═══════════════════════════════════════════
   Shared Footer Component — Premium Design
   ═══════════════════════════════════════════ */

export function renderFooter() {
  const footerHTML = `
    <!-- Gradient top accent -->
    <div class="footer__accent"></div>

    <div class="container">
      <div class="footer__grid">

        <!-- Brand column -->
        <div class="footer__brand">
          <a href="/" class="header__logo">
            <img src="/images/my-logo.jpg" alt="М-Техникс" class="logo__img" />
            <span class="logo__text">М-Техникс</span>
          </a>
          <p class="footer__desc">Автопригон из Европы в Россию под ключ. Полное сопровождение от подбора до постановки на учёт.</p>
          <div class="footer__socials">
            <a href="https://wa.me/79390349133" target="_blank" rel="noopener" class="footer__social footer__social--wa" aria-label="WhatsApp">
              <i data-lucide="message-circle"></i>
            </a>
            <a href="https://t.me/OOO_M_Technics" target="_blank" rel="noopener" class="footer__social footer__social--tg" aria-label="Telegram">
              <i data-lucide="send"></i>
            </a>
          </div>
        </div>

        <!-- Company links -->
        <div class="footer__col">
          <h4 class="footer__heading">Компания</h4>
          <a href="/about" class="footer__link">О компании</a>
          <a href="/team" class="footer__link">Команда</a>
          <a href="/services" class="footer__link">Услуги</a>
          <a href="/how-we-work" class="footer__link">Как мы работаем</a>
          <a href="/reviews" class="footer__link">Отзывы</a>
        </div>

        <!-- Services links -->
        <div class="footer__col">
          <h4 class="footer__heading">Каталог и услуги</h4>
          <a href="/catalog" class="footer__link">Каталог авто</a>
          <a href="/faq" class="footer__link">Частые вопросы</a>
          <a href="/contacts" class="footer__link">Контакты</a>
        </div>

        <!-- Contact info -->
        <div class="footer__col">
          <h4 class="footer__heading">Контакты</h4>
          <a href="tel:+79390349133" class="footer__contact">
            <span class="footer__contact-icon"><i data-lucide="phone"></i></span>
            <span>+7 939 034-91-33</span>
          </a>
          <a href="mailto:mtehnics@mail.ru" class="footer__contact">
            <span class="footer__contact-icon"><i data-lucide="mail"></i></span>
            <span>mtehnics@mail.ru</span>
          </a>
          <div class="footer__contact">
            <span class="footer__contact-icon"><i data-lucide="clock"></i></span>
            <span>Пн–Сб: 9:00 — 20:00</span>
          </div>
        </div>

      </div>

      <!-- Bottom bar -->
      <div class="footer__bottom">
        <p>© 2026 ООО «М-Техникс». Все права защищены.</p>
        <a href="/privacy" class="footer__link">Политика конфиденциальности</a>
      </div>
    </div>
  `;

  const footer = document.createElement('footer');
  footer.className = 'footer';
  footer.innerHTML = footerHTML;

  document.body.appendChild(footer);
}
