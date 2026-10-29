const header = document.querySelector('.site-header');
const toggle = header.querySelector('.mobile-menu-toggle');
const explore = header.querySelector('details');
function closeMenu() { header.classList.remove('menu-open'); toggle.setAttribute('aria-expanded','false'); toggle.setAttribute('aria-label','Abrir menu'); explore.open = false; }
toggle.addEventListener('click', () => { const open = !header.classList.contains('menu-open'); header.classList.toggle('menu-open',open); toggle.setAttribute('aria-expanded',String(open)); toggle.setAttribute('aria-label',open ? 'Fechar menu' : 'Abrir menu'); });
header.querySelectorAll('nav a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('click', event => { if (!header.contains(event.target)) closeMenu(); });
document.addEventListener('keydown', event => { if(event.key === 'Escape') { const wasOpen = header.classList.contains('menu-open'); const wasExploring = explore.open; closeMenu(); if(wasOpen) toggle.focus(); else if(wasExploring) explore.querySelector('summary').focus(); } });
matchMedia('(min-width: 901px)').addEventListener('change',closeMenu);
