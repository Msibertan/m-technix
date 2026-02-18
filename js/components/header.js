/* ═══════════════════════════════════════════
   Shared Header Component
   ═══════════════════════════════════════════ */

export function renderHeader() {
  const currentPath = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';

  const navLinks = [
    { href: '/services', text: 'Услуги' },
    { href: '/catalog', text: 'Каталог' },
    { href: '/how-we-work', text: 'Как мы работаем' },
    { href: '/about', text: 'О компании' },
    { href: '/team', text: 'Команда' },
    { href: '/reviews', text: 'Отзывы' },
    { href: '/faq', text: 'FAQ' },
    { href: '/contacts', text: 'Контакты' },
  ];

  const navHTML = navLinks.map(link => {
    const isActive = currentPath === link.href;
    return `<a href="${link.href}" class="nav__link${isActive ? ' nav__link--active' : ''}">${link.text}</a>`;
  }).join('');

  const headerHTML = `
    <div class="container header__inner">
      <a href="/" class="header__logo">
        <img src="/images/my-logo.jpg" alt="М-Техникс" class="logo__img" />
        <span class="logo__text">М-Техникс</span>
      </a>
      <nav class="header__nav" id="nav">
        ${navHTML}
      </nav>
      <a href="/contacts#form" class="btn btn--primary header__cta">Оставить заявку</a>
      <button class="header__burger" id="burger" aria-label="Меню">
        <span></span><span></span><span></span>
      </button>
    </div>
  `;

  const header = document.createElement('header');
  header.className = 'header';
  header.id = 'header';
  header.innerHTML = headerHTML;

  document.body.prepend(header);
}
