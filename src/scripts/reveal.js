(() => {
  'use strict';
// A página inteira permanece visível quando o navegador bloqueia scripts.
  const revealNodes = [...document.querySelectorAll('[data-fusion-reveal]')];
  if (revealNodes.length &&
      'IntersectionObserver' in window &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('fusion-enhanced');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .06, rootMargin: '0px 0px -25px 0px' });
    revealNodes.forEach(node => observer.observe(node));
  }
})();
