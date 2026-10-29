// Montagem progressiva sem prender a rolagem ou interferir nos formulários.
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
const selector = [
  '.hero-copy > *', '.hero-art', '.stats > div', '.section-heading > *',
  '.search', '.product', '.pack', '.steps > article', '.sell > *',
  '.auction-intro > *', '#admin-panel > h2', '#admin-panel > .catalog-note',
  '.admin-form', '.section > .eyebrow', '.section > h2', '.section-description',
  'footer > *',
].join(',');

if ('IntersectionObserver' in window && !motion.matches) {
  const tracked = new WeakSet();
  const reveal = element => {
    element.classList.add('is-assembled');
    observer.unobserve(element);
  };
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) reveal(entry.target);
  }, { threshold: 0.06, rootMargin: '0px 0px -20px 0px' });

  function prepare(element, initial) {
    if (tracked.has(element) || motion.matches) return;
    tracked.add(element);
    // Atualizações de busca, lances e login já visíveis não voltam a desaparecer.
    const box = element.getBoundingClientRect();
    if (!initial && box.top < innerHeight && box.bottom > 0 && box.width > 0) return;
    const siblings = [...element.parentElement.children].filter(child => child.matches(selector));
    element.style.setProperty('--assemble-delay', `${Math.min(siblings.indexOf(element), 3) * 85}ms`);
    element.classList.add('assemble');
    observer.observe(element);
  }
  document.querySelectorAll(selector).forEach(element => prepare(element, true));
  const mutations = new MutationObserver(records => {
    for (const record of records) for (const node of record.addedNodes) {
      if (!(node instanceof Element)) continue;
      if (node.matches(selector)) prepare(node, false);
      node.querySelectorAll(selector).forEach(element => prepare(element, false));
    }
  });
  mutations.observe(document.querySelector('main'), { childList: true, subtree: true });
  document.addEventListener('focusin', event => {
    let target = event.target;
    while (target instanceof Element) {
      if (target.classList.contains('assemble')) reveal(target);
      target = target.parentElement;
    }
  });
  motion.addEventListener('change', event => {
    if (!event.matches) return;
    document.querySelectorAll('.assemble').forEach(reveal);
  });
  window.addEventListener('beforeprint', () => document.querySelectorAll('.assemble').forEach(reveal));
}
