/**
 * Chroma Timeline · aprimoramento progressivo
 * Navegação por abas com suporte a teclado e conteúdo estático sem scripts.
 */
(() => {
  'use strict';
  const timeline = document.querySelector('[data-chroma-timeline]');
  if (!timeline) return;

  const tabs = [...timeline.querySelectorAll('[role="tab"]')];
  const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
  const previous = timeline.querySelector('[data-timeline-prev]');
  const next = timeline.querySelector('[data-timeline-next]');
  if (!tabs.length || panels.some(panel => !panel)) return;

  let current = 0;
  function activate(index, focus = false) {
    current = (index + tabs.length) % tabs.length;
    tabs.forEach((tab, position) => {
      const selected = position === current;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[position].hidden = !selected;
      panels[position].classList.toggle('is-active', selected);
    });
    if (focus) tabs[current].focus();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(index));
    tab.addEventListener('keydown', event => {
      const action = {
        ArrowRight: () => activate(index + 1, true),
        ArrowLeft: () => activate(index - 1, true),
        Home: () => activate(0, true),
        End: () => activate(tabs.length - 1, true)
      }[event.key];
      if (action) { event.preventDefault(); action(); }
    });
  });
  previous?.addEventListener('click', () => activate(current - 1));
  next?.addEventListener('click', () => activate(current + 1));

  timeline.classList.add('is-ready');
  activate(0);
})();
