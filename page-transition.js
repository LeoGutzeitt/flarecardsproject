// Transição de entrada. Há saída de emergência mesmo se outro módulo falhar.
(() => {
  // Cada página tem sua primeira entrada durante a sessão desta aba.
  const page = location.pathname.endsWith('/auctions.html') ? 'auctions' : 'store';
  const introKey = `flare-cards:intro-seen:v2:${page}`;
  try {
    if (sessionStorage.getItem(introKey)) return;
    sessionStorage.setItem(introKey, '1');
  } catch {
    // Se o armazenamento estiver bloqueado, mantém a navegação direta.
    return;
  }
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let finished = false;
  let fallback;
  function finish() {
    finished = true; clearTimeout(fallback);
    root.classList.remove('page-loading','loader-running','page-leaving');
    document.querySelectorAll('[data-loader-inert]').forEach(element => { element.inert = false; element.removeAttribute('data-loader-inert'); });
    const loader = document.querySelector('#page-loader'); if (loader) loader.hidden = true;
  }
  root.classList.add('page-loading');
  fallback = setTimeout(finish, 4500);
  document.addEventListener('DOMContentLoaded', () => {
    if (finished) return;
    document.querySelectorAll('header,main,footer').forEach(element => { if (!element.inert) { element.inert = true; element.setAttribute('data-loader-inert',''); } });
    root.classList.add('loader-running');
    setTimeout(finish, reduced.matches ? 180 : 2050);
  }, { once: true });
  window.addEventListener('pageshow', event => { if (event.persisted) finish(); });
  reduced.addEventListener('change', event => { if (event.matches) finish(); });
})();
