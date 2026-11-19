import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const handler = require('../api/contato.js');

const configNames = [
  'RESEND_API_KEY', 'CONTACT_TO_EMAIL', 'CONTACT_FROM_EMAIL',
  'TURNSTILE_SITE_KEY', 'TURNSTILE_SECRET_KEY',
  'CONTACT_ALLOWED_ORIGIN', 'CONTACT_PRIVACY_APPROVED'
];
const previous = Object.fromEntries(configNames.map(name => [name, process.env[name]]));
const originalFetch = globalThis.fetch;
const origin = 'https://instituto-chroma-oficial.vercel.app';

const valid = {
  nome: 'Teste Chroma',
  email: 'contato@example.org',
  telefone: '',
  unidade: 'Diadema',
  perfil: 'Visitante',
  assunto: 'Conhecer a escola',
  mensagem: 'Gostaria de conversar com a equipe para agendar uma visita.',
  consentimento: 'on',
  website: '',
  'cf-turnstile-response': 'token-valido-de-teste'
};
const response = () => ({
  statusCode: 200, data: null, headers: {},
  setHeader(name, value) { this.headers[name.toLowerCase()] = value; return this; },
  status(value) { this.statusCode = value; return this; },
  json(value) { this.data = value; return this; }
});
const call = async (method, body, headers = {}) => {
  const res = response();
  await handler({
    method,
    body,
    headers: { origin, 'content-type': 'application/json', ...headers }
  }, res);
  return res;
};

let calls = [];
let turnstileResponse = { success: true, hostname: 'instituto-chroma-oficial.vercel.app', action: 'contato-institucional' };
let resendResponse = { id: 'em_test_01' };
let brokenService = '';

function mockNetwork() {
  calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    if (brokenService === 'turnstile' && String(url).includes('siteverify')) throw Error('External error');
    if (brokenService === 'mail' && String(url).includes('api.resend.com')) throw Error('External error');
    if (String(url).includes('siteverify')) {
      assert.equal(options.method, 'POST');
      assert.equal(options.body.get('secret'), 'turnstile-secret-test');
      assert.equal(options.body.get('response'), valid['cf-turnstile-response']);
      return { ok: true, json: async () => turnstileResponse };
    }
    assert.equal(url, 'https://api.resend.com/emails');
    assert.equal(options.method, 'POST');
    assert.equal(JSON.parse(options.body).reply_to, valid.email);
    return { ok: true, json: async () => resendResponse };
  };
}

try {
  for (const name of configNames) delete process.env[name];

  let result = await call('GET');
  assert.equal(result.statusCode, 200);
  assert.equal(result.data.acceptingMessages, false);
  assert.equal(result.data.turnstileSiteKey, undefined);
  result = await call('POST', valid);
  assert.equal(result.statusCode, 503);

  process.env.RESEND_API_KEY = 'resend-key-test';
  process.env.CONTACT_TO_EMAIL = 'school@example.org';
  process.env.CONTACT_FROM_EMAIL = 'Chroma <no-reply@example.org>';
  process.env.TURNSTILE_SITE_KEY = 'turnstile-site-test';
  process.env.TURNSTILE_SECRET_KEY = 'turnstile-secret-test';
  process.env.CONTACT_ALLOWED_ORIGIN = origin;
  process.env.CONTACT_PRIVACY_APPROVED = 'false';

  result = await call('GET');
  assert.equal(result.data.acceptingMessages, false, 'Privacy approval is mandatory');
  process.env.CONTACT_PRIVACY_APPROVED = 'true';
  delete process.env.TURNSTILE_SECRET_KEY;
  assert.equal((await call('GET')).data.acceptingMessages, false, 'Challenge secret is mandatory');
  process.env.TURNSTILE_SECRET_KEY = 'turnstile-secret-test';
  process.env.CONTACT_ALLOWED_ORIGIN = 'http://unsafe.example.org';
  assert.equal((await call('GET')).data.acceptingMessages, false, 'HTTPS origin required');
  process.env.CONTACT_ALLOWED_ORIGIN = origin;

  result = await call('GET');
  assert.equal(result.data.acceptingMessages, true);
  assert.equal(result.data.turnstileSiteKey, 'turnstile-site-test');
  assert.equal(JSON.stringify(result.data).includes('turnstile-secret-test'), false, 'Never expose private keys');

  mockNetwork();
  const bad = [
    [{ ...valid, mensagem: 'curta' }, 400],
    [{ ...valid, mensagem: '' }, 400],
    [{ ...valid, email: 'not an email' }, 400],
    [{ ...valid, email: 'x@y.org\r\nBcc:bot@evil.org' }, 400],
    [{ ...valid, nome: '' }, 400],
    [{ ...valid, unidade: 'Unidade inexistente' }, 400],
    [{ ...valid, perfil: 'Admin' }, 400],
    [{ ...valid, assunto: 'Outro inválido' }, 400],
    [{ ...valid, consentimento: false }, 400],
    [{ ...valid, telefone: 'x'.repeat(36) }, 400],
    [{ ...valid, website: 'spam' }, 400],
    [{ ...valid, 'cf-turnstile-response': '' }, 400],
    [{ ...valid, 'cf-turnstile-response': 'x'.repeat(2049) }, 400],
    [{ ...valid, mensagem: 'a'.repeat(6501) }, 413],
    ['{', 400],
    [[], 400],
    [valid, 415, { 'content-type': 'text/plain' }],
    [valid, 403, { origin: 'https://website-atacante.example' }]
  ];
  for (const [payload, expected, headers] of bad) {
    result = await call('POST', payload, headers || {});
    assert.equal(result.statusCode, expected, JSON.stringify(payload).slice(0, 125));
    assert.equal(result.data.ok, false);
  }
  assert.equal(calls.length, 0, 'Invalid input cannot invoke third-party services');

  turnstileResponse = { success: false };
  result = await call('POST', valid);
  assert.equal(result.statusCode, 403);
  assert.equal(calls.length, 1, 'Invalid challenge never sends mail');

  turnstileResponse = { success: true, hostname: 'attacker.example', action: 'contato-institucional' };
  result = await call('POST', valid);
  assert.equal(result.statusCode, 403);
  assert.equal(calls.length, 2);

  turnstileResponse = { success: true, hostname: 'instituto-chroma-oficial.vercel.app', action: 'other-action' };
  result = await call('POST', valid);
  assert.equal(result.statusCode, 403);
  assert.equal(calls.length, 3);

  turnstileResponse = { success: true, hostname: 'instituto-chroma-oficial.vercel.app', action: 'contato-institucional' };
  brokenService = 'turnstile';
  result = await call('POST', valid);
  assert.equal(result.statusCode, 503);
  brokenService = '';

  mockNetwork();
  result = await call('POST', valid);
  assert.equal(result.statusCode, 200);
  assert.equal(result.data.ok, true);
  assert.equal(calls.length, 2, 'Challenge verified before provider accepts mail');

  resendResponse = {};
  result = await call('POST', valid);
  assert.equal(result.statusCode, 502, 'A provider without acceptance ID must not generate success');

  resendResponse = { id: 'em_test_02' };
  brokenService = 'mail';
  result = await call('POST', valid);
  assert.equal(result.statusCode, 502);
  brokenService = '';

  result = await call('PUT', valid);
  assert.equal(result.statusCode, 405);
  assert.equal(result.headers.allow, 'GET, POST');
  assert.match(result.headers['cache-control'], /no-store/);
  assert.equal(result.headers['x-content-type-options'], 'nosniff');

  console.log('Contato seguro: configuração, consentimento, origem, desafio, validações e aceitação de e-mail aprovados.');
} finally {
  for (const name of configNames) {
    if (previous[name] === undefined) delete process.env[name];
    else process.env[name] = previous[name];
  }
  globalThis.fetch = originalFetch;
}
