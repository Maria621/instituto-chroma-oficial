/**
 * Instituto Chroma · navegação compartilhada
 * Mantém os estados acessíveis sincronizados em todas as páginas.
 */
(() => {
  'use strict';

  const header = document.getElementById('header');
  if (!header) return;

  const menu = header.querySelector('#mobile-menu');
  const panel = header.querySelector('#mobile-panel');
  const dropdown = header.querySelector('.nav-dropdown');
  const dropdownToggle = header.querySelector('.nav-dropdown-toggle');
  const dropdownLinks = [...(dropdown?.querySelectorAll('a[href]') ?? [])];
  const focusable = element => element && element.getClientRects().length > 0;

  function setMobile(open, { restoreFocus = false } = {}) {
    if (!menu || !panel) return;
    panel.hidden = !open;
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Fechar menu de navegação' : 'Abrir menu de navegação');
    document.body.classList.toggle('nav-locked', open);
    window.chromaHeaderSync?.();
    if (open) {
      setDropdown(false);
      panel.querySelector('a[href]')?.focus();
    } else if (restoreFocus) {
      menu.focus();
    }
  }

  function setDropdown(open) {
    if (!dropdown || !dropdownToggle) return;
    dropdown.classList.toggle('is-open', open);
    dropdownToggle.setAttribute('aria-expanded', String(open));
  }

  menu?.addEventListener('click', () => setMobile(panel.hidden));
  panel?.querySelectorAll('a[href]').forEach(link => {
    link.addEventListener('click', () => setMobile(false));
  });

  dropdownToggle?.addEventListener('click', event => {
    event.stopPropagation();
    setDropdown(dropdownToggle.getAttribute('aria-expanded') !== 'true');
  });
  dropdownLinks.forEach(link => link.addEventListener('click', () => setDropdown(false)));

  // Feche apenas o painel realmente aberto ao clicar fora.
  document.addEventListener('pointerdown', event => {
    if (dropdown && !dropdown.contains(event.target)) setDropdown(false);
  });
  dropdown?.addEventListener('focusout', event => {
    if (!dropdown.contains(event.relatedTarget)) setDropdown(false);
  });

  dropdown?.addEventListener('keydown', event => {
    const current = dropdownLinks.indexOf(document.activeElement);
    if (event.key === 'Escape') {
      event.preventDefault();
      setDropdown(false);
      dropdownToggle?.focus();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setDropdown(true);
      const step = event.key === 'ArrowDown' ? 1 : -1;
      const next = current < 0 ? (step > 0 ? 0 : dropdownLinks.length - 1) :
        (current + step + dropdownLinks.length) % dropdownLinks.length;
      dropdownLinks[next]?.focus();
    } else if (event.key === 'Home' && current >= 0) {
      event.preventDefault();
      dropdownLinks[0]?.focus();
    } else if (event.key === 'End' && current >= 0) {
      event.preventDefault();
      dropdownLinks[dropdownLinks.length - 1]?.focus();
    }
  });

  // Ordem real do DOM: botão de menu, depois links do painel.
  // Aprisiona foco apenas enquanto o menu de tela cheia está aberto.
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (panel && !panel.hidden) {
        event.preventDefault();
        setMobile(false, { restoreFocus: true });
      } else if (dropdown?.classList.contains('is-open')) {
        event.preventDefault();
        setDropdown(false);
        dropdownToggle?.focus();
      }
    }
    if (event.key !== 'Tab' || !panel || panel.hidden || !menu) return;
    const items = [menu, ...panel.querySelectorAll('a[href]')].filter(focusable);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  });

  const desktop = window.matchMedia('(min-width: 1181px)');
  const onBreakpointChange = () => {
    if (desktop.matches && panel && !panel.hidden) setMobile(false);
  };
  desktop.addEventListener?.('change', onBreakpointChange);
  window.addEventListener('resize', onBreakpointChange, { passive: true });

  // Elemento dialog nativo: Escape, foco e retorno ao botão acionador.
  const dialog = document.getElementById('chroma-image-dialog');
  if (dialog && typeof dialog.showModal === 'function') {
    let lastTrigger = null;
    document.querySelectorAll('[data-view-image]').forEach(button => {
      button.addEventListener('click', () => {
        const image = dialog.querySelector('img');
        if (!image) return;
        image.src = button.dataset.viewImage;
        image.alt = button.previousElementSibling?.alt || 'Arte institucional ampliada da Chroma';
        lastTrigger = button;
        dialog.showModal();
      });
    });
    dialog.querySelector('[data-close-image]')?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => lastTrigger?.focus());
  }
})();
