import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const handler = require('../api/contato.js');
const previous = {
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  CONTACT_TO_EMAIL: process.env.CONTACT_TO_EMAIL,
  CONTACT_FROM_EMAIL: process.env.CONTACT_FROM_EMAIL,
  fetch: globalThis.fetch
};
const valid = {
  nome: 'Teste Chroma',
  email: 'contato@example.org',
  telefone: '',
  unidade: 'Diadema',
  perfil: 'Visitante',
  assunto: 'Conhecer a escola',
  mensagem: 'Quero saber como visitar a unidade.',
  consentimento: 'on'
};
const mockRes = () => ({
  statusCode: 200,
  data: null,
  headers: {},
  setHeader(name, value) { this.headers[name.toLowerCase()] = value; return this; },
  status(value) { this.statusCode = value; return this; },
  json(value) { this.data = value; return this; }
});
let fetchCount = 0;
const request = async (method, body, contentType = 'application/json') => {
  const res = mockRes();
  await handler({ method, body, headers: { 'content-type': contentType } }, res);
  return res;
};

try {
  delete process.env.RESEND_API_KEY;
  delete process.env.CONTACT_TO_EMAIL;
  delete process.env.CONTACT_FROM_EMAIL;
  let res = await request('GET');
  assert.equal(res.statusCode, 200);
  assert.equal(res.data.acceptingMessages, false, 'Form must not be enabled without provider settings');
  res = await request('POST', valid);
  assert.equal(res.statusCode, 503, 'Unavailable provider must reject POST');

  process.env.RESEND_API_KEY = 'test-key-not-real';
  process.env.CONTACT_TO_EMAIL = 'inbox@example.org';
  process.env.CONTACT_FROM_EMAIL = 'Chroma <sender@example.org>';
  globalThis.fetch = async (url, opts) => {
    assert.equal(url, 'https://api.resend.com/emails');
    assert.equal(opts.method, 'POST');
    fetchCount += 1;
    return { ok: true };
  };
  res = await request('GET');
  assert.equal(res.data.acceptingMessages, true, 'Form may be enabled once configured');

  const rejects = [
    [{ ...valid, mensagem: '' }, 400],
    [{ ...valid, mensagem: 'curta' }, 400],
    [{ ...valid, perfil: '' }, 400],
    [{ ...valid, perfil: 'Perfil inválido' }, 400],
    [{ ...valid, assunto: 'Assunto desconhecido' }, 400],
    [{ ...valid, unidade: 'Outra unidade' }, 400],
    [{ ...valid, email: 'nao-e-email' }, 400],
    [{ ...valid, consentimento: '' }, 400],
    [{ ...valid, telefone: '0'.repeat(40) }, 400],
    [valid, 415, 'text/plain']
  ];
  for (const [body, expected, contentType] of rejects) {
    res = await request('POST', body, contentType || 'application/json');
    assert.equal(res.statusCode, expected, JSON.stringify(body).slice(0, 120));
    assert.equal(res.data.ok, false);
  }
  assert.equal(fetchCount, 0, 'Invalid requests must never reach the email provider');
  res = await request('POST', valid);
  assert.equal(res.statusCode, 200);
  assert.equal(res.data.ok, true);
  assert.equal(fetchCount, 1, 'Valid request must call provider exactly once');

  res = await request('PUT', valid);
  assert.equal(res.statusCode, 405);
  console.log('Contato: indisponibilidade segura, validações e envio simulado aprovados.');
} finally {
  for (const [name, value] of Object.entries(previous)) {
    if (name === 'fetch') continue;
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
  globalThis.fetch = previous.fetch;
}
