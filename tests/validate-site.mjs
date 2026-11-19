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
const sourcePages = readdirSync(join(root, 'src', 'pages')).filter(name => name.endsWith('.html'));
if (sourcePages.length !== htmlFiles.length || sourcePages.some(name => !htmlFiles.includes(name))) {
  throw Error('A lista de templates não corresponde às páginas publicadas');
}
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

for (const file of ['app.js', 'v31.js', 'fusion.js', 'timeline.js', 'contact.js']) {
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


// Contratos editoriais e funcionais da revisão institucional V7.
const required = {
  'index.html': ['chroma-news-grid', 'chroma-practice-grid', 'data-fusion-gallery'],
  'nossa-escola.html': ['id="linha-do-tempo"', 'data-chroma-timeline', 'src="timeline.js"'],
  'nossa-essencia.html': ['class="page-essence"', 'Missão', 'Visão', 'Valores'],
  'metodologia.html': ['Aplicação orientada', 'class="method-step'],
  'contato.html': ['data-chroma-form', 'data-chroma-challenge', 'src="contact.js"', 'Instagram'],
  'unidades.html': ['id="anhanguera"', 'id="diadema"', 'id="sorocaba"']
};
for (const [page, fragments] of Object.entries(required)) {
  const content = htmlOf(join(root, page));
  for (const fragment of fragments) {
    if (!content.includes(fragment)) errors.push(page + ': elemento V7 ausente: ' + fragment);
  }
}
// Contato deve ser carregado apenas na página de atendimento, não globalmente.
for (const page of htmlFiles.filter(page => page !== 'contato.html')) {
  if (htmlOf(join(root, page)).includes('src="contact.js"')) {
    errors.push(page + ': controlador de formulário carregado fora da página de contato');
  }
}
const backend = readFileSync(join(root, 'api/contato.js'), 'utf8');
for (const marker of ['TURNSTILE_SECRET_KEY', 'CONTACT_PRIVACY_APPROVED', 'CONTACT_ALLOWED_ORIGIN', 'siteverify']) {
  if (!backend.includes(marker)) errors.push('api/contato.js: proteção obrigatória ausente: ' + marker);
}

const footers = htmlFiles.map(file => htmlOf(join(root, file)).match(/<footer class="footer chroma-footer"[\s\S]*?<\/footer>/)?.[0]);
if (footers.some(footer => !footer)) errors.push('Rodapé institucional V7 ausente em uma ou mais páginas');
if (new Set(footers).size > 1) errors.push('Rodapés divergentes entre páginas');


// Responsabilidade dos estilos: ajustes específicos de Novidades pertencem ao
// seu componente (v31.css), não à camada global quality.css.
const newsCss = readFileSync(join(root, 'v31.css'), 'utf8');
const globalCss = readFileSync(join(root, 'quality.css'), 'utf8');
if (!newsCss.includes('.v3-news-page .v31-expand-art')) {
  errors.push('v31.css: estilos responsivos do controle Ampliar arte ausentes');
}
if (globalCss.includes('.v3-news-page .v31-expand-art')) {
  errors.push('quality.css: estilos de Novidades duplicados fora do componente');
}

if (errors.length) {
  process.stderr.write('Falhas encontradas:\n' + errors.map(error => '- ' + error).join('\n') + '\n');
  process.exitCode = 1;
} else {
  console.log('Validação aprovada: ' + htmlFiles.length + ' páginas, links, imagens, CSS e JavaScript.');
}
