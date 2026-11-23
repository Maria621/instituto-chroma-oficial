(() => {
  'use strict';
const gallery = document.querySelector('[data-fusion-gallery]');
  if (gallery) {
    const images = [...gallery.querySelectorAll('.fusion-gallery-slide')];
    const dots = [...gallery.querySelectorAll('.fusion-gallery-dot')];
    const heading = gallery.querySelector('[data-gallery-title]');
    const description = gallery.querySelector('[data-gallery-description]');
    const credit = gallery.querySelector('[data-gallery-credit]');
    const media = gallery.querySelector('.fusion-gallery-media');
    const dialog = document.getElementById('fusion-modal');
    const dialogImage = dialog?.querySelector('img');
    const dialogTitle = dialog?.querySelector('[data-fusion-modal-title]');
    const dialogCredit = dialog?.querySelector('p');
    const modalClose = dialog?.querySelector('.fusion-modal-close');
    let active = 0;
    let startX = null;
    let lastTrigger = null;

    function show(index) {
      if (!images.length) return;
      active = (index + images.length) % images.length;
      images.forEach((image, i) => {
        const selected = i === active;
        image.classList.toggle('is-active', selected);
        image.setAttribute('aria-hidden', String(!selected));
      });
      dots.forEach((dot, i) => {
        const selected = i === active;
        dot.classList.toggle('is-active', selected);
        dot.setAttribute('aria-pressed', String(selected));
      });
      const image = images[active];
      const title = image.dataset.title || image.alt || 'Experiência Chroma';
      if (heading) heading.textContent = title;
      if (description) description.textContent = image.dataset.description || '';
      if (credit) credit.textContent = image.dataset.credit || 'Imagem ilustrativa';
      if (dialog?.open && dialogImage) {
        dialogImage.src = image.src;
        dialogImage.alt = image.alt;
        if (dialogTitle) dialogTitle.textContent = title;
        if (dialogCredit) dialogCredit.textContent = image.dataset.credit || '';
      }
    }

    gallery.querySelector('[data-gallery-prev]')?.addEventListener('click', () => show(active - 1));
    gallery.querySelector('[data-gallery-next]')?.addEventListener('click', () => show(active + 1));
    dots.forEach((dot, index) => dot.addEventListener('click', () => show(index)));
    gallery.addEventListener('keydown', event => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        show(active + (event.key === 'ArrowRight' ? 1 : -1));
      }
    });
    media?.addEventListener('touchstart', event => {
      startX = event.changedTouches[0]?.screenX ?? null;
    }, { passive: true });
    media?.addEventListener('touchend', event => {
      if (startX === null) return;
      const delta = (event.changedTouches[0]?.screenX ?? startX) - startX;
      if (Math.abs(delta) > 45) show(active + (delta < 0 ? 1 : -1));
      startX = null;
    }, { passive: true });

    if (dialog && typeof dialog.showModal === 'function') {
      gallery.querySelector('.fusion-gallery-open')?.addEventListener('click', event => {
        lastTrigger = event.currentTarget;
        dialog.showModal();
        show(active);
        modalClose?.focus();
      });
      modalClose?.addEventListener('click', () => dialog.close());
      dialog.querySelector('[data-fusion-modal-prev]')?.addEventListener('click', () => show(active - 1));
      dialog.querySelector('[data-fusion-modal-next]')?.addEventListener('click', () => show(active + 1));
      dialog.addEventListener('keydown', event => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
          event.preventDefault();
          show(active + (event.key === 'ArrowRight' ? 1 : -1));
        }
      });
      dialog.addEventListener('click', event => {
        if (event.target === dialog) dialog.close();
      });
      dialog.addEventListener('close', () => lastTrigger?.focus());
    }
    show(0);
  }
})();
