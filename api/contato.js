'use strict';

/**
 * Instituto Chroma — API de contato (Vercel Functions).
 *
 * Segurança por padrão: nenhum envio sem configuração de e-mail,
 * proteção anti-automação, domínio autorizado e autorização de privacidade.
 * Não armazena dados no servidor nem registra mensagens em logs.
 */
const UNITS = new Set(['Diadema', 'Sorocaba', 'Não sei / ambas']);
const PROFILES = new Set([
  'Responsável por aluno', 'Aluno(a)', 'Visitante',
  'Parceiro(a) institucional', 'Representante de escola',
  'Representante de empresa', 'Outro'
]);
const SUBJECTS = new Set([
  'Conhecer a escola', 'Aluno Nota 10', 'Acompanhamento pedagógico',
  'Atendimento administrativo', 'Projetos e parcerias',
  'Parceria com escola', 'Parceria com empresa', 'Outros assuntos'
]);
const CHALLENGE_ACTION = 'contato-institucional';
const JSON_CONTENT_TYPE = /^application\/json(?:\s*;|$)/i;
const EMAIL = /^[^\s@<>\r\n]+@[^\s@<>\r\n]+\.[^\s@<>\r\n]+$/;
const NETWORK_TIMEOUT_MS = 8000;

const trim = value => typeof value === 'string' ? value.trim() : '';
const validLength = (value, min, max) => value.length >= min && value.length <= max;
const safeText = value => value.replace(/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').slice(0, 2100);
const json = (res, status, body) => res.status(status).json(body);

function config() {
  const env = process.env;
  const origin = trim(env.CONTACT_ALLOWED_ORIGIN).replace(/\/$/, '');
  let host = null;
  try {
    const url = new URL(origin);
    if (url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) {
      if (url.username === '' && url.password === '' && url.pathname === '/' && !url.search && !url.hash) {
        host = url.hostname;
      }
    }
  } catch {
    // Falha fechada: configuração de origem inválida não habilita o formulário.
  }
  const settings = {
    mailKey: trim(env.RESEND_API_KEY),
    from: trim(env.CONTACT_FROM_EMAIL),
    to: trim(env.CONTACT_TO_EMAIL),
    turnstileSiteKey: trim(env.TURNSTILE_SITE_KEY),
    turnstileSecret: trim(env.TURNSTILE_SECRET_KEY),
    origin,
    host
  };
  settings.ready = Boolean(
    settings.mailKey && settings.from && settings.to &&
    settings.turnstileSiteKey && settings.turnstileSecret &&
    settings.host && env.CONTACT_PRIVACY_APPROVED === 'true'
  );
  return settings;
}

function parsePayload(body) {
  if (Buffer.isBuffer(body)) return JSON.parse(body.toString('utf8'));
  if (typeof body === 'string') return JSON.parse(body);
  return body;
}

function validatePayload(p) {
  if (!p || typeof p !== 'object' || Array.isArray(p)) return null;
  const values = {
    nome: trim(p.nome),
    email: trim(p.email),
    telefone: trim(p.telefone),
    unidade: trim(p.unidade),
    perfil: trim(p.perfil),
    assunto: trim(p.assunto),
    mensagem: trim(p.mensagem),
    token: trim(p['cf-turnstile-response'])
  };
  if (
    !validLength(values.nome, 2, 150) ||
    !validLength(values.email, 5, 254) || !EMAIL.test(values.email) ||
    !validLength(values.telefone, 0, 35) ||
    !UNITS.has(values.unidade) || !PROFILES.has(values.perfil) ||
    !SUBJECTS.has(values.assunto) ||
    !validLength(values.mensagem, 10, 2000) ||
    !validLength(values.token, 1, 2048) ||
    p.consentimento !== 'on' ||
    trim(p.website) !== ''
  ) return null;
  return values;
}

async function verifyChallenge(token, settings) {
  const body = new URLSearchParams({
    secret: settings.turnstileSecret,
    response: token
  });
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(NETWORK_TIMEOUT_MS)
  });
  if (!response.ok) throw Error('Turnstile unavailable');
  const check = await response.json();
  return check?.success === true &&
    check?.hostname === settings.host &&
    check?.action === CHALLENGE_ACTION;
}

async function sendMail(p, settings) {
  const lines = [
    'Nome: ' + safeText(p.nome),
    'E-mail: ' + safeText(p.email),
    'Telefone: ' + safeText(p.telefone),
    'Unidade: ' + safeText(p.unidade),
    'Perfil: ' + safeText(p.perfil),
    'Assunto: ' + safeText(p.assunto),
    'Mensagem: ' + safeText(p.mensagem)
  ];
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + settings.mailKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: settings.from,
      to: [settings.to],
      reply_to: p.email,
      subject: 'Chroma • ' + safeText(p.assunto) + ' / ' + safeText(p.unidade),
      text: lines.join('\n')
    }),
    signal: AbortSignal.timeout(NETWORK_TIMEOUT_MS)
  });
  if (!response.ok) return false;
  const result = await response.json();
  return typeof result?.id === 'string' && result.id.length > 0;
}

module.exports = async function contactHandler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Allow', 'GET, POST');

  const settings = config();
  if (req.method === 'GET') {
    // A site key do Turnstile é pública; a secret key nunca retorna ao cliente.
    return json(res, 200, {
      ok: true,
      acceptingMessages: settings.ready,
      ...(settings.ready ? { turnstileSiteKey: settings.turnstileSiteKey } : {})
    });
  }
  if (req.method !== 'POST') return json(res, 405, { ok: false, message: 'Método não permitido' });
  if (!settings.ready) return json(res, 503, { ok: false, message: 'Formulário indisponível' });

  // Origin é uma defesa adicional; Turnstile fornece o controle de desafio.
  if (trim(req.headers?.origin) !== settings.origin) {
    return json(res, 403, { ok: false, message: 'Origem não autorizada' });
  }
  if (!JSON_CONTENT_TYPE.test(trim(req.headers?.['content-type']))) {
    return json(res, 415, { ok: false, message: 'Formato de dados não suportado' });
  }
  let raw;
  try {
    raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8') :
      (typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {}));
  } catch {
    return json(res, 400, { ok: false, message: 'Dados inválidos' });
  }
  if (Buffer.byteLength(raw, 'utf8') > 6500) {
    return json(res, 413, { ok: false, message: 'Mensagem extensa demais' });
  }
  let payload;
  try {
    payload = validatePayload(parsePayload(req.body));
  } catch {
    return json(res, 400, { ok: false, message: 'Dados inválidos' });
  }
  if (!payload) return json(res, 400, { ok: false, message: 'Revise os campos e a verificação de segurança' });

  let verified;
  try {
    verified = await verifyChallenge(payload.token, settings);
  } catch {
    return json(res, 503, { ok: false, message: 'Verificação temporariamente indisponível' });
  }
  if (!verified) {
    return json(res, 403, { ok: false, message: 'Verificação de segurança não concluída' });
  }

  try {
    const accepted = await sendMail(payload, settings);
    if (!accepted) return json(res, 502, { ok: false, message: 'Não foi possível confirmar o encaminhamento' });
    // A resposta confirma aceitação pelo provedor, não entrega na caixa de entrada.
    return json(res, 200, { ok: true, message: 'Mensagem encaminhada para processamento' });
  } catch {
    return json(res, 502, { ok: false, message: 'Não foi possível confirmar o encaminhamento' });
  }
};
