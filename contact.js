/**
 * Instituto Chroma — formulário de contato.
 * Estado inicial seguro: não coleta dados se a API não puder encaminhar.
 */
(() => {
  'use strict';

  const forms = [...document.querySelectorAll('[data-chroma-form]')];
  if (!forms.length) return;

  const params = new URLSearchParams(window.__chromaRouteQuery || location.search);
  for (const name of ['unidade', 'assunto', 'perfil']) {
    const value = params.get(name);
    if (!value) continue;
    document.querySelectorAll('select[name="' + name + '"]').forEach(select => {
      const option = [...select.options].find(item => item.value === value);
      if (option) select.value = option.value;
    });
  }

  let challengeScript = null;

  const message = (form, text, error = false) => {
    const output = form.querySelector('.v3-form-notice');
    if (!output) return;
    output.textContent = text;
    output.classList.toggle('is-error', error);
  };

  const setAvailable = (form, ready) => {
    form.dataset.sendReady = ready ? 'true' : 'false';
    const button = form.querySelector('button[type="submit"]');
    if (button) button.disabled = true;
    if (!ready) {
      message(form, 'Formulário em configuração nesta prévia. Nenhuma mensagem será enviada por aqui; use o Instagram institucional.', true);
    }
  };

  function loadChallengeScript() {
    if (window.turnstile?.render) return Promise.resolve(window.turnstile);
    if (challengeScript) return challengeScript;

    challengeScript = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.onload = () => window.turnstile?.render
        ? resolve(window.turnstile)
        : reject(Error('Turnstile unavailable'));
      script.onerror = () => reject(Error('Turnstile script unavailable'));
      document.head.append(script);
    });
    return challengeScript;
  }

  const initForm = async (form, siteKey) => {
    setAvailable(form, true);
    const button = form.querySelector('button[type="submit"]');
    const challengeHost = form.querySelector('[data-chroma-challenge]');
    if (!challengeHost) {
      setAvailable(form, false);
      return;
    }

    let widgetId = null;
    let challengeToken = '';
    let submitting = false;

    const enable = () => {
      if (button) button.disabled = submitting || !challengeToken;
    };
    const resetToken = () => {
      challengeToken = '';
      enable();
      if (widgetId !== null) {
        try { window.turnstile?.reset(widgetId); } catch { /* fallback: retry page */ }
      }
    };

    try {
      const turnstile = await loadChallengeScript();
      widgetId = turnstile.render(challengeHost, {
        sitekey: siteKey,
        action: 'contato-institucional',
        theme: 'light',
        callback(token) {
          challengeToken = token;
          enable();
          message(form, 'Verificação concluída. Preencha os campos obrigatórios e envie sua mensagem.');
        },
        'expired-callback'() {
          challengeToken = '';
          enable();
          message(form, 'A verificação expirou. Conclua uma nova verificação para enviar.', true);
        },
        'error-callback'() {
          challengeToken = '';
          enable();
          message(form, 'Não foi possível concluir a verificação. Tente atualizar a página.', true);
          return true;
        },
        'unsupported-callback'() {
          challengeToken = '';
          enable();
          message(form, 'A verificação não é compatível com este navegador. Use o atendimento alternativo.', true);
        }
      });
      message(form, 'Para enviar, conclua a verificação de segurança.');
    } catch {
      setAvailable(form, false);
      return;
    }

    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (submitting) return;
      if (!form.checkValidity()) {
        form.reportValidity();
        message(form, 'Revise os campos obrigatórios antes de enviar.', true);
        return;
      }
      if (!challengeToken) {
        message(form, 'Conclua a verificação de segurança para continuar.', true);
        return;
      }

      const values = Object.fromEntries(new FormData(form).entries());
      if (values.website) {
        message(form, 'Não foi possível validar o formulário.', true);
        return;
      }
      delete values.website;
      values['cf-turnstile-response'] = challengeToken;

      submitting = true;
      enable();
      const originalText = button?.innerHTML;
      if (button) button.textContent = 'Enviando…';

      try {
        const response = await fetch('/api/contato', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify(values)
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || result.ok !== true) {
          if (response.status === 503) {
            setAvailable(form, false);
            return;
          }
          throw Error('not accepted');
        }

        form.reset();
        message(form, 'Solicitação encaminhada ao serviço de e-mail. A equipe poderá responder pelo contato informado.');
      } catch {
        message(form, 'Não foi possível confirmar o encaminhamento. Tente novamente ou utilize o Instagram institucional.', true);
      } finally {
        submitting = false;
        if (button) button.innerHTML = originalText;
        resetToken();
      }
    });
  };

  async function checkAvailability() {
    forms.forEach(form => setAvailable(form, false));
    if (!/^https?:$/.test(location.protocol)) return;

    try {
      const response = await fetch('/api/contato', { method: 'GET', cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      if (data.acceptingMessages !== true || typeof data.turnstileSiteKey !== 'string' ||
          !data.turnstileSiteKey.trim()) return;
      await Promise.all(forms.map(form => initForm(form, data.turnstileSiteKey)));
    } catch {
      forms.forEach(form => setAvailable(form, false));
    }
  }

  checkAvailability();
})();
