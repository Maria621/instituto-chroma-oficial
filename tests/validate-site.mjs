/**
 * Validação estática para o site multipáginas do Instituto Chroma.
 * Executar: node tests/validate-site.mjs
 * Sem dependências de terceiros.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { Script } from 'node:vm';

const root = resolve(process.cwd());
const htmlFiles = readdirSync(root).filter(name => name.endsWith('.html'));
const errors = [];
const htmlCache = new Map();
const htmlOf = file => {
  if (!htmlCache.has(file)) htmlCache.set(file, readFileSync(file, 'utf8'));
  return htmlCache.get(file);
};

for (const page of htmlFiles) {
  const file = join(root, page);
  const html = htmlOf(file);
  const ids = [...html.matchAll(/\sid=["']([^"']+)["']/g)].map(match => match[1]);
  const count = marker => [...html.matchAll(marker)].length;
  if (count(/<main\b/gi) !== 1) errors.push(page + ': esperado um elemento <main>');
  if (count(/<h1\b/gi) !== 1) errors.push(page + ': esperado um elemento <h1>');
  for (const [index, id] of ids.entries()) {
    if (ids.indexOf(id) !== index) errors.push(page + ': id duplicado ' + id);
  }

  for (const [tag] of html.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\salt=["'][^"']*["']/.test(tag)) errors.push(page + ': imagem sem atributo alt');
  }

  for (const [, controlledId] of html.matchAll(/\saria-controls=["']([^"']+)["']/gi)) {
    if (!ids.includes(controlledId)) errors.push(page + ': aria-controls sem destino: ' + controlledId);
  }

  const links = [...html.matchAll(/\s(?:href|src|data-view-image)=["']([^"']+)["']/gi)].map(match => match[1]);
  for (const raw of links) {
    if (!raw || /^(?:mailto:|tel:|data:|javascript:)/i.test(raw)) continue;
    const target = new URL(raw, 'https://chroma.local/' + page);
    if (target.hostname !== 'chroma.local') continue;
    const targetPath = join(root, decodeURIComponent(target.pathname.slice(1)));
    if (!existsSync(targetPath)) {
      errors.push(page + ': arquivo ausente em ' + raw);
      continue;
    }
    if (target.hash && targetPath.endsWith('.html')) {
      const fragment = decodeURIComponent(target.hash.slice(1));
      const targetIds = [...htmlOf(targetPath).matchAll(/\sid=["']([^"']+)["']/g)].map(match => match[1]);
      if (fragment && !targetIds.includes(fragment)) errors.push(page + ': âncora ausente em ' + raw);
    }
  }
  if (!html.includes('quality.css')) errors.push(page + ': camada de estilo V6 ausente');
}

for (const file of ['app.js', 'v31.js', 'fusion.js']) {
  try { new Script(readFileSync(join(root, file), 'utf8'), { filename: file }); }
  catch (error) { errors.push(file + ': ' + error.message); }
}

for (const file of ['style.css', 'v31.css', 'fusion.css', 'quality.css']) {
  const css = readFileSync(join(root, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  let depth = 0;
  for (const char of css) {
    if (char === '{') depth++;
    if (char === '}') depth--;
    if (depth < 0) break;
  }
  if (depth !== 0) errors.push(file + ': desequilíbrio de chaves');
}

if (errors.length) {
  process.stderr.write('Falhas encontradas:\n' + errors.map(error => '- ' + error).join('\n') + '\n');
  process.exitCode = 1;
} else {
  console.log('Validação aprovada: ' + htmlFiles.length + ' páginas, links, imagens, CSS e JavaScript.');
}
