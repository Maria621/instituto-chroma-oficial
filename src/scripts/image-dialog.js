(() => {
  'use strict';
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
