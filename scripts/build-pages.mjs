/**
 * Build the 12 static HTML pages from shared server-side components.
 *
 * Commands:
 *   node scripts/build-pages.mjs             Generate the deployable HTML.
 *   node scripts/build-pages.mjs --check     Fail if committed HTML is outdated.
 *
 * There is no runtime include, framework or client-side rendering. Accessibility,
 * SEO markup, scripts and CSS stay in the final HTML, including without JS.
 */
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve(process.cwd());
const pagesDir = join(root, 'src', 'pages');
const partsDir = join(root, 'src', 'components');
const markers = {
  skip: '<!-- CHROMA:SKIP_LINK -->',
  header: '<!-- CHROMA:HEADER -->',
  footer: '<!-- CHROMA:FOOTER -->'
};
const isCheck = process.argv.includes('--check');
const allowedArgs = new Set(['--check']);
for (const arg of process.argv.slice(2)) {
  if (!allowedArgs.has(arg)) throw Error('Argumento desconhecido: ' + arg);
}

function replaceOnce(source, marker, replacement, filename) {
  const count = source.split(marker).length - 1;
  if (count !== 1) {
    throw Error(filename + ': marcador ' + marker + ' deve existir uma única vez (encontrado ' + count + ')');
  }
  return source.replace(marker, replacement);
}

function renderHeader(filename, source) {
  const isHome = filename === 'index.html';
  const groupPages = new Set([
    'nossa-escola.html', 'nossa-essencia.html', 'estrutura.html', 'aluno-nota-10.html'
  ]);

  let markup = source
    .replaceAll('{{HEADER_SOLID}}', isHome ? '' : ' header-solid')
    .replaceAll('{{BRAND_LIGHT}}', isHome ? ' brand-light' : '')
    .replaceAll('{{LOGO_WHITE}}', isHome ? '-branco' : '')
    .replaceAll('{{GROUP_CURRENT}}', groupPages.has(filename) ? ' data-current="true"' : '');

  markup = markup.replace(/\{\{ACTIVE:(desktop|mobile):([^}]+)\}\}/g, (_, location, href) => {
    // Preservar as marcações da V13 byte por byte nesta migração estrutural.
    // Eventuais correções de estado ativo serão auditadas separadamente.
    if (filename === 'aluno-nota-10.html' && href === 'nossa-escola.html') {
      return location === 'mobile' ? ' aria-current="page"' : ' ';
    }
    if (['aluno-nota-10.html', 'parcerias.html', 'contato.html'].includes(filename)) return '';
    return href === filename ? ' aria-current="page"' : '';
  });
  if (/\{\{(?:HEADER|BRAND|LOGO|GROUP|ACTIVE)/.test(markup)) {
    throw Error(filename + ': variável do cabeçalho sem valor');
  }
  return markup;
}

async function build() {
  const [header, footer, skip, filenames] = await Promise.all([
    readFile(join(partsDir, 'site-header.html'), 'utf8'),
    readFile(join(partsDir, 'site-footer.html'), 'utf8'),
    readFile(join(partsDir, 'skip-link.html'), 'utf8'),
    readdir(pagesDir)
  ]);
  const pages = filenames.filter(name => name.endsWith('.html')).sort();
  if (pages.length !== 12) throw Error('Esperadas 12 páginas HTML, encontradas: ' + pages.length);

  const errors = [];
  let same = 0;
  let changed = 0;
  for (const filename of pages) {
    if (!/^[a-z0-9-]+\.html$/.test(filename)) {
      throw Error('Nome de página inválido: ' + filename);
    }
    const source = await readFile(join(pagesDir, filename), 'utf8');
    let html = replaceOnce(source, markers.skip, skip, filename);
    html = replaceOnce(html, markers.header, renderHeader(filename, header), filename);
    html = replaceOnce(html, markers.footer, footer, filename);

    if (html.includes('<!-- CHROMA:') || /\{\{(?:HEADER|BRAND|LOGO|GROUP|ACTIVE)/.test(html)) {
      throw Error(filename + ': marcador de template não resolvido');
    }

    const destination = join(root, filename);
    let previous = null;
    try {
      previous = await readFile(destination, 'utf8');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    if (previous === html) {
      same += 1;
    } else {
      changed += 1;
      if (isCheck) errors.push(filename + ': HTML estático desatualizado; execute node scripts/build-pages.mjs');
      else await writeFile(destination, html);
    }
  }

  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } else {
    console.log(
      (isCheck ? 'Conferência' : 'Geração') + ': ' +
      pages.length + ' páginas, ' + same + ' idênticas, ' + changed +
      (isCheck ? ' divergentes.' : ' atualizadas.')
    );
  }
}
await build();
